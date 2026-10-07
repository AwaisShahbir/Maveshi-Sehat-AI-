package com.maveshisehatapp

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.os.Build
import com.facebook.react.bridge.*
import java.io.File

class AudioModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var mediaPlayer: MediaPlayer? = null
    private var mediaRecorder: MediaRecorder? = null
    private var currentRecordPath: String? = null

    override fun getName(): String = "AudioModule"

    @ReactMethod
    fun playSound(url: String, promise: Promise) {
        try {
            stopCurrentPlayback()

            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )
                setDataSource(url)
                setOnPreparedListener { mp ->
                    mp.start()
                    promise.resolve(true)
                }
                setOnCompletionListener { mp ->
                    mp.release()
                    mediaPlayer = null
                }
                setOnErrorListener { mp, what, extra ->
                    mp.release()
                    mediaPlayer = null
                    promise.reject("PLAYBACK_ERROR", "MediaPlayer error: what=$what, extra=$extra")
                    true
                }
                prepareAsync()
            }
        } catch (e: Exception) {
            stopCurrentPlayback()
            promise.reject("PLAYBACK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopSound(promise: Promise) {
        try {
            stopCurrentPlayback()
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

            val map = Arguments.createMap()
            map.putString("filePath", currentRecordPath ?: "")
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
