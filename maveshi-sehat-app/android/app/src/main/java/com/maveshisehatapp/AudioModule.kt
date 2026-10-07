package com.maveshisehatapp

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

class AudioModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var mediaPlayer: MediaPlayer? = null
    private var mediaRecorder: MediaRecorder? = null
    private var currentRecordPath: String? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun getName(): String = "AudioModule"

    @ReactMethod
    fun addListener(eventName: String) {
        // Required by React Native NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required by React Native NativeEventEmitter
    }

    private fun sendEvent(eventName: String, params: Any?) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (ignored: Exception) {}
    }

    private fun downloadUrlToTempFile(primaryUrl: String): File {
        val urlsToTry = mutableListOf(primaryUrl)
        if (primaryUrl.contains("10.0.2.2:5000")) {
            urlsToTry.add(primaryUrl.replace("10.0.2.2:5000", "127.0.0.1:5000"))
            urlsToTry.add(primaryUrl.replace("10.0.2.2:5000", "localhost:5000"))
        } else if (primaryUrl.contains("localhost:5000") || primaryUrl.contains("127.0.0.1:5000")) {
            urlsToTry.add(primaryUrl.replace("localhost:5000", "10.0.2.2:5000").replace("127.0.0.1:5000", "10.0.2.2:5000"))
        }

        var lastException: Exception? = null
        for (u in urlsToTry) {
            try {
                val tempFile = File(reactContext.cacheDir, "audio_play_${System.currentTimeMillis()}.mp3")
                val connection = URL(u).openConnection() as HttpURLConnection
                connection.connectTimeout = 5000
                connection.readTimeout = 15000
                connection.instanceFollowRedirects = true
                val responseCode = connection.responseCode
                if (responseCode in 200..299) {
                    connection.inputStream.use { input ->
                        tempFile.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }
                    if (tempFile.exists() && tempFile.length() > 0) {
                        return tempFile
                    }
                }
            } catch (e: Exception) {
                lastException = e
            }
        }
        throw lastException ?: java.io.IOException("Failed to download audio from $primaryUrl")
    }

    @ReactMethod
    fun playSound(url: String, promise: Promise) {
        Thread {
            try {
                mainHandler.post { stopCurrentPlayback() }

                val localFile: File = if (url.startsWith("http://") || url.startsWith("https://")) {
                    downloadUrlToTempFile(url)
                } else if (url.startsWith("file://")) {
                    File(url.removePrefix("file://"))
                } else {
                    File(url)
                }

                if (!localFile.exists() || localFile.length() == 0L) {
                    mainHandler.post {
                        sendEvent("onAudioPlaybackFinished", null)
                        promise.reject("FILE_NOT_FOUND", "Audio file is empty or does not exist")
                    }
                    return@Thread
                }

                mainHandler.post {
                    try {
                        val player = MediaPlayer()
                        player.setAudioAttributes(
                            AudioAttributes.Builder()
                                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                                .setUsage(AudioAttributes.USAGE_MEDIA)
                                .build()
                        )
                        player.setDataSource(localFile.absolutePath)
                        player.setOnPreparedListener { mp ->
                            mp.start()
                            promise.resolve(true)
                        }
                        player.setOnCompletionListener { mp ->
                            mp.release()
                            mediaPlayer = null
                            sendEvent("onAudioPlaybackFinished", null)
                        }
                        player.setOnErrorListener { mp, what, extra ->
                            mp.release()
                            mediaPlayer = null
                            sendEvent("onAudioPlaybackFinished", null)
                            promise.reject("PLAYBACK_ERROR", "MediaPlayer error: what=$what, extra=$extra")
                            true
                        }
                        mediaPlayer = player
                        player.prepareAsync()
                    } catch (innerEx: Exception) {
                        stopCurrentPlayback()
                        sendEvent("onAudioPlaybackFinished", null)
                        promise.reject("PLAYBACK_ERROR", innerEx.message, innerEx)
                    }
                }
            } catch (e: Exception) {
                mainHandler.post {
                    stopCurrentPlayback()
                    sendEvent("onAudioPlaybackFinished", null)
                    promise.reject("PLAYBACK_ERROR", e.message, e)
                }
            }
        }.start()
    }

    @ReactMethod
    fun stopSound(promise: Promise) {
        try {
            stopCurrentPlayback()
            sendEvent("onAudioPlaybackFinished", null)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun startRecording(promise: Promise) {
        try {
            stopCurrentPlayback()
            stopCurrentRecording()

            val outputFile = File(reactContext.cacheDir, "voice_${System.currentTimeMillis()}.m4a")
            currentRecordPath = outputFile.absolutePath

            val recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(reactContext)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            recorder.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioEncodingBitRate(64000)
                setAudioSamplingRate(44100)
                setOutputFile(outputFile.absolutePath)
                prepare()
                start()
            }

            mediaRecorder = recorder
            val map = Arguments.createMap()
            map.putString("filePath", outputFile.absolutePath)
            promise.resolve(map)
        } catch (e: Exception) {
            stopCurrentRecording()
            promise.reject("RECORD_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        try {
            mediaRecorder?.let {
                try {
                    it.stop()
                } catch (ignored: Exception) {}
                it.release()
            }
            mediaRecorder = null

            val path = currentRecordPath
            val file = if (path != null) File(path) else null
            val map = Arguments.createMap()
            map.putString("filePath", file?.absolutePath ?: "")
            map.putDouble("fileSize", (file?.length() ?: 0L).toDouble())
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("STOP_RECORD_ERROR", e.message, e)
        }
    }

    private fun stopCurrentPlayback() {
        mediaPlayer?.let {
            try {
                if (it.isPlaying) {
                    it.stop()
                }
            } catch (ignored: Exception) {}
            try {
                it.release()
            } catch (ignored: Exception) {}
        }
        mediaPlayer = null
    }

    private fun stopCurrentRecording() {
        mediaRecorder?.let {
            try {
                it.stop()
            } catch (ignored: Exception) {}
            try {
                it.release()
            } catch (ignored: Exception) {}
        }
        mediaRecorder = null
    }
}
