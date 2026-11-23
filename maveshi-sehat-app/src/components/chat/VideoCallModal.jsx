import React from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RtcSurfaceView, VideoSourceType, RenderModeType } from 'react-native-agora';
import { t } from '../../utils/translate';

export default function VideoCallModal({
  visible,
  callStatus,
  callDuration,
  formatCallDuration,
  isCameraInMainStage,
  onToggleStageSwap,
  isAgoraReady,
  remoteUid,
  isVideoDisabled,
  isMuted,
  isFrontCamera,
  isTorchOn,
  partnerName,
  partnerRole,
  snapshotToastVisible,
  onToggleMute,
  onToggleVideo,
  onToggleCamera,
  onCaptureSnapshot,
  onToggleTorch,
  onEndCall
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onEndCall}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B132B' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0B132B" />

        {/* Top Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <TouchableOpacity
            onPress={onEndCall}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Feather name="chevron-down" size={22} color="#FFF" />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: callStatus === 'calling' ? '#F59E0B' : '#10B981',
                marginRight: 6
              }} />
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 }}>
                {callStatus === 'calling' ? t('Connecting Call...') : t('Live HD Session')}
              </Text>
            </View>
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>
              {callStatus === 'calling' ? t('Ringing...') : (typeof formatCallDuration === 'function' ? formatCallDuration(callDuration) : `${callDuration}s`)}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 12
          }}>
            <Feather name="lock" size={12} color="#34D399" style={{ marginRight: 4 }} />
            <Text style={{ color: '#34D399', fontSize: 11, fontWeight: '700' }}>E2EE</Text>
          </View>
        </View>

        {/* Snapshot Success Toast */}
        {snapshotToastVisible && (
          <View style={{
            position: 'absolute',
            top: 70,
            alignSelf: 'center',
            backgroundColor: 'rgba(16, 185, 129, 0.95)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: 99,
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10
          }}>
            <Feather name="check" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>
              {t('High-Res Clinical Snapshot Saved!')}
            </Text>
          </View>
        )}

        {/* Video Stream Stage */}
        <View style={{ flex: 1, position: 'relative', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
          {/* Main Stage View */}
          {isCameraInMainStage && isAgoraReady && !isVideoDisabled ? (
            <RtcSurfaceView
              style={{ width: '100%', height: '100%' }}
              canvas={{ uid: 0, renderMode: RenderModeType.RenderModeHidden }}
            />
          ) : remoteUid && !isVideoDisabled ? (
            <RtcSurfaceView
              style={{ width: '100%', height: '100%' }}
              canvas={{ uid: remoteUid, renderMode: RenderModeType.RenderModeHidden }}
            />
          ) : callStatus === 'connected' && !isVideoDisabled ? (
            <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B' }}>
              <View style={{ alignItems: 'center', padding: 24 }}>
                <View style={{
                  width: 130,
                  height: 130,
                  borderRadius: 65,
                  backgroundColor: '#0284C7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: '#38BDF8',
                  shadowColor: '#38BDF8',
                  shadowOpacity: 0.4,
                  shadowRadius: 15,
                  elevation: 10,
                  marginBottom: 16
                }}>
                  <Text style={{ fontSize: 44, fontWeight: '800', color: '#FFF' }}>
                    {(partnerName || 'V').trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4 }}>
                  {partnerName}
                </Text>
                <Text style={{ fontSize: 14, color: '#38BDF8', fontWeight: '600', marginBottom: 12 }}>
                  {partnerRole === 'vet' ? 'Veterinary Surgeon · Live Stream' : t('Farmer')}
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20
                }}>
                  <Feather name="activity" size={14} color="#38BDF8" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#CBD5E1', fontSize: 12 }}>
                    HD 1080p · 60fps · Audio Synced
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: 'center', padding: 24 }}>
              <View style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: 'rgba(2, 132, 199, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                borderWidth: 2,
                borderColor: '#0284C7'
              }}>
                <Text style={{ fontSize: 44, fontWeight: '800', color: '#FFF' }}>
                  {(partnerName || 'V').trim().charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 6 }}>
                {partnerName}
              </Text>
              <Text style={{ fontSize: 14, color: '#94A3B8', marginBottom: 20 }}>
                {partnerRole === 'vet' ? t('Veterinary Surgeon') : t('Farmer')}
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20
              }}>
                <ActivityIndicator size="small" color="#F59E0B" style={{ marginRight: 8 }} />
                <Text style={{ color: '#FBBF24', fontSize: 13, fontWeight: '600' }}>
                  {callStatus === 'calling' ? t('Ringing other device...') : t('Connecting encrypted media...')}
                </Text>
              </View>
            </View>
          )}

          {/* Picture-in-Picture Floating Preview */}
          <View style={{ position: 'absolute', top: 16, left: 16 }}>
            <View style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}>
              <Feather name="camera" size={12} color="#38BDF8" style={{ marginRight: 6 }} />
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>
                {isFrontCamera ? t('Front Camera') : t('Rear Camera (Livestock Mode)')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onToggleStageSwap}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 100,
              height: 145,
              borderRadius: 16,
              backgroundColor: '#1E293B',
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: '#38BDF8',
              shadowColor: '#000',
              shadowOpacity: 0.5,
              shadowRadius: 10,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 30
            }}
          >
            {isCameraInMainStage ? (
              remoteUid && !isVideoDisabled ? (
                <RtcSurfaceView
                  style={{ width: '100%', height: '100%' }}
                  zOrderMediaOverlay={true}
                  canvas={{ uid: remoteUid, renderMode: RenderModeType.RenderModeHidden }}
                />
              ) : (
                <View style={{ width: '100%', height: '100%', backgroundColor: '#0284C7', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFF' }}>
                    {(partnerName || 'V').trim().charAt(0).toUpperCase()}
                  </Text>
                  <Text style={{ color: '#FFF', fontSize: 10, marginTop: 4, fontWeight: '700' }} numberOfLines={1}>
                    {partnerName}
                  </Text>
                  <Text style={{ color: '#E0F2FE', fontSize: 8, marginTop: 2 }}>{t('Tap to swap')}</Text>
                </View>
              )
            ) : isAgoraReady && !isVideoDisabled ? (
              <RtcSurfaceView
                style={{ width: '100%', height: '100%' }}
                zOrderMediaOverlay={true}
                canvas={{ uid: 0, renderMode: RenderModeType.RenderModeHidden }}
              />
            ) : (
              <View style={{ width: '100%', height: '100%', backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#38BDF8" style={{ marginBottom: 6 }} />
                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{t('Starting...')}</Text>
              </View>
            )}
            {isMuted && (
              <View style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#EF4444',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Feather name="mic-off" size={11} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Call Action Controls Bar */}
        <View style={{
          paddingHorizontal: 16,
          paddingVertical: 18,
          backgroundColor: '#0B132B',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: 420,
            alignSelf: 'center',
            width: '100%'
          }}>
            {/* Mute Button */}
            <TouchableOpacity
              onPress={onToggleMute}
              style={{ alignItems: 'center' }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4
              }}>
                <Feather name={isMuted ? 'mic-off' : 'mic'} size={20} color="#FFF" />
              </View>
              <Text style={{ color: '#CBD5E1', fontSize: 10, fontWeight: '600' }}>
                {isMuted ? t('Unmute') : t('Mute')}
              </Text>
            </TouchableOpacity>

            {/* Video Toggle Button */}
            <TouchableOpacity
              onPress={onToggleVideo}
              style={{ alignItems: 'center' }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isVideoDisabled ? '#EF4444' : 'rgba(255, 255, 255, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4
              }}>
                <Feather name={isVideoDisabled ? 'video-off' : 'video'} size={20} color="#FFF" />
              </View>
              <Text style={{ color: '#CBD5E1', fontSize: 10, fontWeight: '600' }}>
                {isVideoDisabled ? t('Video On') : t('Video Off')}
              </Text>
            </TouchableOpacity>

            {/* Camera Flip Button */}
            <TouchableOpacity
              onPress={onToggleCamera}
              style={{ alignItems: 'center' }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isFrontCamera ? 'rgba(255, 255, 255, 0.15)' : '#0284C7',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4
              }}>
                <Feather name="refresh-cw" size={20} color="#FFF" />
              </View>
              <Text style={{ color: '#CBD5E1', fontSize: 10, fontWeight: '600' }}>
                {t('Flip')}
              </Text>
            </TouchableOpacity>

            {/* Snapshot Tool for Clinical Livestock Inspection */}
            <TouchableOpacity
              onPress={onCaptureSnapshot}
              style={{ alignItems: 'center' }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#0284C7',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4
              }}>
                <Feather name="camera" size={20} color="#FFF" />
              </View>
              <Text style={{ color: '#38BDF8', fontSize: 10, fontWeight: '700' }}>
                {t('Snapshot')}
              </Text>
            </TouchableOpacity>

            {/* Torch Toggle for Dark Barn Inspection */}
            <TouchableOpacity
              onPress={onToggleTorch}
              style={{ alignItems: 'center' }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isTorchOn ? '#F59E0B' : 'rgba(255, 255, 255, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4
              }}>
                <Feather name="zap" size={20} color="#FFF" />
              </View>
              <Text style={{ color: isTorchOn ? '#FBBF24' : '#CBD5E1', fontSize: 10, fontWeight: '600' }}>
                {isTorchOn ? t('Torch On') : t('Torch Off')}
              </Text>
            </TouchableOpacity>

            {/* End Call Button */}
            <TouchableOpacity
              onPress={onEndCall}
              style={{ alignItems: 'center' }}
            >
              <View style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: '#DC2626',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
                shadowColor: '#DC2626',
                shadowOpacity: 0.5,
                shadowRadius: 10,
                elevation: 8
              }}>
                <MaterialCommunityIcons name="phone-hangup" size={24} color="#FFF" />
              </View>
              <Text style={{ color: '#F87171', fontSize: 10, fontWeight: '700' }}>
                {t('End Call')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
