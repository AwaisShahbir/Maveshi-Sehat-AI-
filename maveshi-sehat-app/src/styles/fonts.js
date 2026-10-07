import { Platform } from 'react-native';

export const fonts = {
  urduRegular: Platform.OS === 'android' ? 'sans-serif' : 'System',
  urduBold: Platform.OS === 'android' ? 'sans-serif-medium' : 'System',
};

export default fonts;

