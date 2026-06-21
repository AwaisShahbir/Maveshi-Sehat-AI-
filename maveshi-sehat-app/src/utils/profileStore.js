
let profile = {
  userName: 'Muhammad Ahmed',
  userNameUrdu: 'محمد احمد',
  phone: '+92 300 1234567',
  location: 'Okara, Punjab',
  language: 'English',
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
