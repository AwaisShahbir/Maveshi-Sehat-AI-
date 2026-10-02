import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

let profile = {
  userName: 'Muhammad Ahmed',
  userNameUrdu: 'محمد احمد',
  phone: '+92 300 1234567',
  location: 'Okara, Punjab',
  language: 'Both',
  notificationsEnabled: true,
  consultationsCount: 12
};

let listeners = [];

export const getProfile = () => profile;

export const updateProfile = (newProfile) => {
  profile = { ...profile, ...newProfile };
  listeners.forEach(listener => {
    try {
      listener(profile);
    } catch (e) {
      console.error("Error in profileStore listener:", e);
    }
  });
};

export const subscribeProfile = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

export const syncSystemLanguage = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/app/settings`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.language && data.language !== profile.language) {
        updateProfile({ language: data.language });
      }
    }
  } catch (e) {
    // network or server offline, maintain current language
  }
};
