import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Request runtime camera and microphone permissions for live telehealth consultations.
 */
export const requestCameraAndAudioPermissions = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    const cameraGranted = granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;
    const audioGranted = granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;
    return cameraGranted && audioGranted;
  } catch (err) {
    console.warn('Failed to request camera/mic permissions:', err);
    return false;
  }
};
