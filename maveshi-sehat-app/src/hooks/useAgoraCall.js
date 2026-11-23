import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} from 'react-native-agora';
import { requestCameraAndAudioPermissions } from '../utils/permissionUtils';
import { AGORA_APP_ID } from '../services/agoraConfig';
import { t } from '../utils/translate';

export default function useAgoraCall({
  conversationId,
  videoCallVisible,
  setVideoCallVisible,
  callStatus,
  setCallStatus,
  socketRef,
  partnerName,
  onCallEndedNotice
}) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [snapshotToastVisible, setSnapshotToastVisible] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);
  const [isAgoraJoined, setIsAgoraJoined] = useState(false);
  const [isAgoraReady, setIsAgoraReady] = useState(false);
  const [isCameraInMainStage, setIsCameraInMainStage] = useState(false);
  const agoraEngineRef = useRef(null);

  // Format MM:SS call duration
  const formatCallDuration = useCallback((sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const destroyAgora = useCallback(() => {
    try {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.stopPreview();
        agoraEngineRef.current.leaveChannel();
        agoraEngineRef.current.release();
        agoraEngineRef.current = null;
      }
    } catch (e) {
      console.warn('Error releasing Agora engine:', e);
    }
    setIsAgoraReady(false);
    setIsAgoraJoined(false);
    setRemoteUid(null);
  }, []);

  const initAgora = useCallback(async () => {
    try {
      const hasPermission = await requestCameraAndAudioPermissions();
      console.log('Camera and Audio permission status:', hasPermission);

      // Clean up previous instance before creating a new one
      if (agoraEngineRef.current) {
        try {
          agoraEngineRef.current.stopPreview();
          agoraEngineRef.current.leaveChannel();
          agoraEngineRef.current.release();
        } catch (_) {}
        agoraEngineRef.current = null;
      }

      const engine = createAgoraRtcEngine();
      agoraEngineRef.current = engine;
      
      engine.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      try {
        engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
        engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      } catch (roleErr) {
        console.warn('Set broadcaster role notice:', roleErr);
      }

      engine.registerEventHandler({
        onJoinChannelSuccess: (connection) => {
          console.log('✅ Joined Agora Channel:', connection.channelId, 'uid:', connection.localUid);
          setIsAgoraJoined(true);
        },
        onUserJoined: (connection, rUid) => {
          console.log('👤 Peer joined Agora video call:', rUid);
          if (rUid) {
            setRemoteUid(rUid);
            setCallStatus('connected');
          }
        },
        onFirstRemoteVideoDecoded: (connection, rUid) => {
          console.log('🎬 First remote video frame decoded for uid:', rUid);
          if (rUid) {
            setRemoteUid(rUid);
            setCallStatus('connected');
          }
        },
        onFirstRemoteVideoFrame: (connection, rUid) => {
          console.log('🖼️ First remote video frame rendered for uid:', rUid);
          if (rUid) {
            setRemoteUid(rUid);
            setCallStatus('connected');
          }
        },
        onUserOffline: (connection, rUid, reason) => {
          console.log('🚪 Peer left Agora video call:', rUid, 'reason:', reason);
          setRemoteUid(null);
        },
        onRemoteVideoStateChanged: (connection, rUid, state) => {
          console.log('📹 Remote video state changed for uid:', rUid, 'state:', state);
          if (rUid && (state === 1 || state === 2)) {
            setRemoteUid(rUid);
            setCallStatus('connected');
          }
        },
        onError: (errCode, msg) => {
          console.warn('⚠️ Agora RTC Engine event error:', errCode, msg);
        }
      });

      engine.enableAudio();
      engine.enableVideo();
      engine.startPreview();
      try {
        engine.setDefaultAudioRouteToSpeakerphone(true);
        engine.muteLocalAudioStream(false);
        engine.muteLocalVideoStream(false);
      } catch (audioErr) {
        console.warn('Speakerphone setup notice:', audioErr);
      }
      setIsAgoraReady(true);

      const channelName = 'maveshi_conv_' + String(conversationId || 'room').replace(/[^a-zA-Z0-9_]/g, '');

      console.log('Joining Agora channel:', channelName, 'with dynamic unique uid: 0');
      const ret = engine.joinChannel('', channelName, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        publishCameraTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });
      console.log('Agora joinChannel status code:', ret);
    } catch (err) {
      console.warn('⚠️ Agora RTC init error:', err);
    }
  }, [conversationId, setCallStatus]);

  // Agora lifecycle purely driven by videoCallVisible
  useEffect(() => {
    if (videoCallVisible) {
      initAgora();
    } else {
      destroyAgora();
    }
    return () => {
      destroyAgora();
    };
  }, [videoCallVisible, initAgora, destroyAgora]);

  // Outgoing call unanswered timeout (35 seconds)
  useEffect(() => {
    let ringTimeout;
    if (videoCallVisible && callStatus === 'calling') {
      ringTimeout = setTimeout(() => {
        setVideoCallVisible(false);
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('end_call', {
            conversationId: Number(conversationId),
            reason: 'timeout',
            duration: 0
          });
        }
        Alert.alert(
          t('No Answer'),
          `${partnerName || t('The other participant')} ${t('is not answering the call right now. Please try again or leave a message.')}`
        );
      }, 35000);
    }
    return () => {
      if (ringTimeout) clearTimeout(ringTimeout);
    };
  }, [videoCallVisible, callStatus, conversationId, partnerName, setVideoCallVisible, socketRef]);

  // Call duration counter
  useEffect(() => {
    let durationTimer;
    if (videoCallVisible && callStatus === 'connected') {
      durationTimer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (durationTimer) clearInterval(durationTimer);
    };
  }, [videoCallVisible, callStatus]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      try {
        if (agoraEngineRef.current) {
          agoraEngineRef.current.muteLocalAudioStream(nextMuted);
        }
      } catch (e) {}
      return nextMuted;
    });
  }, []);

  const handleToggleVideo = useCallback(() => {
    setIsVideoDisabled((prev) => {
      const nextDisabled = !prev;
      try {
        if (agoraEngineRef.current) {
          agoraEngineRef.current.muteLocalVideoStream(nextDisabled);
        }
      } catch (e) {}
      return nextDisabled;
    });
  }, []);

  const handleToggleCamera = useCallback(() => {
    setIsFrontCamera((prev) => !prev);
    try {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.switchCamera();
      }
    } catch (e) {}
  }, []);

  const handleToggleTorch = useCallback(() => {
    setIsTorchOn((prev) => {
      const nextTorch = !prev;
      try {
        if (agoraEngineRef.current) {
          agoraEngineRef.current.setCameraTorchOn(nextTorch);
        }
      } catch (e) {}
      return nextTorch;
    });
  }, []);

  const handleCaptureSnapshot = useCallback(() => {
    setSnapshotToastVisible(true);
    setTimeout(() => {
      setSnapshotToastVisible(false);
    }, 2800);
  }, []);

  const handleEndVideoCall = useCallback(() => {
    const finalDuration = callDuration;
    setVideoCallVisible(false);
    destroyAgora();

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('end_call', {
        conversationId: Number(conversationId),
        duration: finalDuration
      });
    }

    if (finalDuration > 0 && typeof onCallEndedNotice === 'function') {
      onCallEndedNotice(formatCallDuration(finalDuration));
    }
  }, [callDuration, conversationId, destroyAgora, formatCallDuration, onCallEndedNotice, setVideoCallVisible, socketRef]);

  const resetCallSession = useCallback(() => {
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoDisabled(false);
    setIsFrontCamera(true);
    setIsTorchOn(false);
    setIsCameraInMainStage(false);
    setRemoteUid(null);
  }, []);

  return {
    callDuration,
    setCallDuration,
    formatCallDuration,
    isMuted,
    isVideoDisabled,
    isFrontCamera,
    isTorchOn,
    snapshotToastVisible,
    remoteUid,
    isAgoraJoined,
    isAgoraReady,
    isCameraInMainStage,
    setIsCameraInMainStage,
    handleToggleMute,
    handleToggleVideo,
    handleToggleCamera,
    handleToggleTorch,
    handleCaptureSnapshot,
    handleEndVideoCall,
    destroyAgora,
    resetCallSession
  };
}
