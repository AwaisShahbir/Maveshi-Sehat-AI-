import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Animated,
  Platform
} from 'react-native';
import io from 'socket.io-client';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfile, subscribeProfile } from '../utils/profileStore';
import { t } from '../utils/translate';

const BASE_URL = 'https://maveshi-sehat-api.onrender.com';

const CallContext = createContext({
  incomingCall: null,
  acceptCall: () => {},
  declineCall: () => {}
});

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children, navigationRef }) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const socketRef = useRef(null);
  const ringTimeoutRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for incoming call dialog
  useEffect(() => {
    let pulseLoop;
    if (incomingCall) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (pulseLoop) pulseLoop.stop();
    };
  }, [incomingCall]);

  useEffect(() => {
    // Initialize global signaling socket
    const socket = io(BASE_URL, {
      transports: ['websocket'],
      autoConnect: true
    });
    socketRef.current = socket;

    const registerUserRoom = (profile) => {
      if (profile?.userId) {
        socket.emit('join_user', profile.userId);
        console.log(`📡 Registered global user signaling room for user_${profile.userId}`);
      }
    };

    const currentProfile = getProfile();
    registerUserRoom(currentProfile);

    const unsub = subscribeProfile((p) => {
      registerUserRoom(p);
    });

    socket.on('connect', () => {
      console.log('🔗 Global Call Socket connected:', socket.id);
      const p = getProfile();
      if (p?.userId) {
        socket.emit('join_user', p.userId);
      }
    });

    // App-wide incoming call listener
    socket.on('incoming_call', (data) => {
      console.log('🔔 Global incoming call received:', data);
      const p = getProfile();
      const myId = p?.userId;

      // Ensure caller is not ourselves
      if (data && Number(data.callerId) !== Number(myId)) {
        setIncomingCall(data);

        // Vibrate in ring pattern (500ms on, 1000ms off)
        try {
          Vibration.vibrate([0, 500, 1000, 500, 1000, 500, 1000], true);
        } catch (e) {}

        // Auto-dismiss if unanswered within 35 seconds
        if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = setTimeout(() => {
          handleDecline('missed');
        }, 35000);
      }
    });

    socket.on('call_ended', (data) => {
      console.log('⏹️ Incoming call cancelled by caller');
      stopRinging();
      setIncomingCall(null);
    });

    socket.on('call_rejected', (data) => {
      stopRinging();
      setIncomingCall(null);
    });

    return () => {
      unsub();
      stopRinging();
      socket.disconnect();
    };
  }, []);

  const stopRinging = () => {
    try {
      Vibration.cancel();
    } catch (e) {}
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
  };

  const handleAccept = () => {
    if (!incomingCall) return;
    const callData = incomingCall;
    stopRinging();
    setIncomingCall(null);

    const p = getProfile();
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('accept_call', {
        conversationId: Number(callData.conversationId),
        responderId: Number(p?.userId || 1),
        responderName: p?.fullName || 'User'
      });
    }

    // Navigate to Chat screen and auto-connect call
    const nav = navigationRef?.current || navigationRef;
    if (nav && typeof nav.navigate === 'function') {
      const myRole = p?.role || (callData.callerRole === 'vet' ? 'farmer' : 'vet');
      nav.navigate('Chat', {
        conversationId: callData.conversationId,
        partnerName: callData.callerName,
        partnerRole: callData.callerRole,
        userName: p?.fullName || (myRole === 'vet' ? 'Dr. Doctor' : 'Farmer'),
        userRole: myRole,
        vetId: myRole === 'vet' ? (p?.userId || 16) : undefined,
        autoAcceptCall: true
      });
    }
  };

  const handleDecline = (reason = 'declined') => {
    if (!incomingCall) return;
    const callData = incomingCall;
    stopRinging();
    setIncomingCall(null);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('reject_call', {
        conversationId: Number(callData.conversationId),
        reason: reason
      });
    }
  };

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        acceptCall: handleAccept,
        declineCall: handleDecline
      }}
    >
      {children}

      {/* Global High-Priority Incoming Call Modal */}
      <Modal
        visible={!!incomingCall}
        animationType="fade"
        transparent={true}
        onRequestClose={() => handleDecline('declined')}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            {/* Header / Security Badge */}
            <View style={styles.securityRow}>
              <View style={styles.dotPulse} />
              <Text style={styles.securityText}>Incoming Live Video Consultation</Text>
            </View>

            {/* Caller Avatar with Animated Glow Ring */}
            <Animated.View style={[styles.avatarGlow, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarInitial}>
                  {(incomingCall?.callerName || 'U').trim().charAt(0).toUpperCase()}
                </Text>
              </View>
            </Animated.View>

            {/* Caller Info */}
            <Text style={styles.callerName}>{incomingCall?.callerName || 'Maveshi Sehat User'}</Text>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons
                name={incomingCall?.callerRole === 'vet' ? 'stethoscope' : 'cow'}
                size={14}
                color="#0284C7"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.roleText}>
                {incomingCall?.callerRole === 'vet' ? t('Veterinary Surgeon') : t('Farmer')}
              </Text>
            </View>

            <Text style={styles.ringingSubtitle}>
              {t('Ringing... Live livestock inspection requested.')}
            </Text>

            {/* Action Buttons: Accept & Decline */}
            <View style={styles.actionsRow}>
              {/* Decline Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.declineBtn]}
                onPress={() => handleDecline('declined')}
                activeOpacity={0.8}
              >
                <Feather name="phone-off" size={24} color="#FFF" />
                <Text style={styles.btnLabel}>{t('Decline')}</Text>
              </TouchableOpacity>

              {/* Accept Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={handleAccept}
                activeOpacity={0.8}
              >
                <Feather name="video" size={24} color="#FFF" />
                <Text style={styles.btnLabel}>{t('Accept Call')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CallContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14
  },
  dotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    marginRight: 6
  },
  securityText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700'
  },
  avatarGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  avatarInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#38BDF8'
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFF'
  },
  callerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
    textAlign: 'center'
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12
  },
  roleText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700'
  },
  ringingSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 26,
    paddingHorizontal: 10
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 18,
    minWidth: 120,
    elevation: 4
  },
  declineBtn: {
    backgroundColor: '#EF4444'
  },
  acceptBtn: {
    backgroundColor: '#10B981'
  },
  btnLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6
  }
});
