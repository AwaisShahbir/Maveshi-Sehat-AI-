import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Request runtime camera and microphone permissions for live telehealth consultations.
 */
export const requestCameraAndAudioPermissions = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    const hasCamera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
    const hasAudio = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);

    if (hasCamera && hasAudio) {
      console.log('✅ Camera and Audio permissions already granted.');
      return true;
    }

    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);

    const cameraOk = hasCamera || granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;
    const audioOk = hasAudio || granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;

    return cameraOk && audioOk;
  } catch (err) {
    console.warn('Failed to check/request camera/mic permissions:', err);
    return true; // Do not block Agora engine from trying to start
  }
};
