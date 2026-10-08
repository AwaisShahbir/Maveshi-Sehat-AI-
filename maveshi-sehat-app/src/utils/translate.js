import { Platform } from 'react-native';
import { getProfile } from './profileStore.js';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

// Dynamic in-memory translation cache (no hardcoded Urdu text in codebase)
const translationCache = new Map();
const pendingRequests = new Set();
let translationListeners = [];

export const subscribeTranslation = (listener) => {
  translationListeners.push(listener);
  return () => {
    translationListeners = translationListeners.filter(l => l !== listener);
  };
};

const notifyTranslationListeners = () => {
  translationListeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      console.error('Translation listener error:', e);
    }
  });
};

/**
 * Common application terms pre-fetched in batch from API to ensure instant UI rendering in Urdu
 */
export const CORE_UI_KEYS = [
  'Home', 'AI Scan', 'Scan', 'Records', 'Forum', 'Profile', 'Marketplace', 'Heat Alert',
  'Consultations', 'Notifications', 'Settings', 'Back', 'Welcome Back', 'Login', 'Register',
  'Login As', 'Owner', 'Farmer', 'Vet', 'Veterinarian', 'Phone Number', 'Password',
  'Confirm Password', 'Forgot Password?', "Don't have an account?", 'Already have an account?',
  'Create Account', 'Logging in...', 'Creating Account...', 'Full Name', 'Email', 'District',
  'Select District', 'Role', 'PVMC License Number', 'Specialization', 'Experience (Years)',
  'Upload Document', 'Uploading...', 'Enter password', 'Enter Full Name', 'Enter Phone Number',
  'Verification', 'Verify Code', 'Enter OTP', 'Resend Code', 'Language', 'Choose Your Language',
  'Select Language', 'English', 'Urdu', 'Personal Information', 'Edit Profile', 'Save Changes',
  'Saved successfully', 'Help & Support', 'Terms & Privacy', 'Log Out', 'Location', 'City', 'Account',
  'Assalam-o-Alaikum', 'Livestock', 'Total Animals', 'Healthy Animals', 'Healthy', 'Infected',
  'Sick', 'Active Cases', 'Quick Actions', 'Scan Disease', 'Ask Community', 'Find Veterinarian',
  'Order Medicines', 'Recent Scans', 'Animal Health', 'Weather Alert', 'Veterinarians',
  'Confidence', 'Confidence:', 'Animal Type', 'Animal Type:', 'Cow', 'Buffalo', 'Goat', 'Sheep',
  'Symptoms', 'Symptoms:', 'First Aid', 'First Aid / Treatment', 'First Aid / Treatment:',
  'Risk Level:', 'High Risk', 'Medium Risk', 'Low Risk', 'Date & Time:', 'Cancel', 'Close',
  'Search', 'Loading...', 'Success', 'Error', 'Save to Records', 'Consult Vet Now',
  'Health Records', 'Search records...', 'Total Scans', 'All', 'Active', 'Under Treatment', 'Recovered',
  'Pending', 'Urgent', 'Resolved', 'Submitted Cases', 'Verification Document',
  'Sehat Assistant', 'Ask Sehat Assistant', 'Instant AI guidance for your animals', 'AI Assistant', 'Clear Chat', 'Suggested Questions'
];

/**
 * Batch translates an array of English strings via Backend API and populates the cache
 */
export const prefetchTranslations = async (keys = CORE_UI_KEYS, targetLang = 'ur') => {
  if (targetLang === 'en' || !Array.isArray(keys) || keys.length === 0) return;
  
  const uncached = keys.filter(k => typeof k === 'string' && k.trim().length > 0 && !translationCache.has(k.trim()));
  if (uncached.length === 0) return;

  try {
    const res = await fetch(`${BASE_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: uncached, targetLang })
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.translations) {
        Object.entries(data.translations).forEach(([orig, trans]) => {
          if (trans && typeof trans === 'string') {
            translationCache.set(orig.trim(), trans);
          }
        });
        notifyTranslationListeners();
      }
    }
  } catch (err) {
    console.warn('Batch translation prefetch error:', err.message);
  }
};

/**
 * Translates an English string dynamically using the Backend API or Google Translate API
 */
export const translateText = async (text, targetLang = 'ur', sourceLang = 'en') => {
  if (!text || typeof text !== 'string') return '';
  if (targetLang === 'en') return text;

  const trimmed = text.trim();
  const cacheKey = `${trimmed}_${targetLang}`;
  
  if (translationCache.has(trimmed)) {
    return translationCache.get(trimmed);
  }
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  if (pendingRequests.has(trimmed)) {
    return trimmed;
  }
  pendingRequests.add(trimmed);

  try {
    // 1. Primary: Backend translation endpoint
    const res = await fetch(`${BASE_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, targetLang, sourceLang })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.translatedText) {
        const trans = data.translatedText;
        translationCache.set(trimmed, trans);
        translationCache.set(cacheKey, trans);
        pendingRequests.delete(trimmed);
        notifyTranslationListeners();
        return trans;
      }
    }
  } catch (backendErr) {
    // 2. Direct fallback: Google Translate dict-chrome-ex client
    try {
      const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${targetLang}&q=${encodeURIComponent(trimmed)}`;
      const directRes = await fetch(url);
      if (directRes.ok) {
        const directData = await directRes.json();
        const trans = Array.isArray(directData) ? directData[0] : directData;
        if (typeof trans === 'string' && trans.length > 0) {
          translationCache.set(trimmed, trans);
          translationCache.set(cacheKey, trans);
          pendingRequests.delete(trimmed);
          notifyTranslationListeners();
          return trans;
        }
      }
    } catch (directErr) {
      console.warn('Direct Google Translate fallback failed:', directErr.message);
    }
  }

  pendingRequests.delete(trimmed);
  return trimmed;
};

/**
 * Core translation helper.
 * Zero hardcoded Urdu strings in application code.
 * Retrieves Urdu translation dynamically from English text via API.
 */
export const t = (enText) => {
  if (!enText || typeof enText !== 'string') return enText || '';
  
  const profile = getProfile();
  const lang = profile.language || 'English';

  if (lang === 'English') {
    return enText;
  }

  const trimmed = enText.trim();
  const cached = translationCache.get(trimmed);
  
  if (cached) {
    return cached;
  }

  // Trigger dynamic background translation if not yet in cache
  translateText(trimmed, 'ur');
  return enText;
};

/**
 * Splits string for bilingual display
 */
export const tSplit = (enText) => {
  if (!enText || typeof enText !== 'string') return { en: '', ur: '' };
  return {
    en: enText,
    ur: t(enText)
  };
};

/**
 * Hook helper for functional components
 */
export const useTranslation = () => {
  const profile = getProfile();
  const lang = profile.language || 'English';
  return {
    t,
    lang,
    isUrdu: lang === 'Urdu',
    translateText,
    prefetchTranslations
  };
};

/**
 * Returns dynamic disease description
 */
export const getLocalizedDescription = (disease, defaultDesc) => {
  const profile = getProfile();
  if (profile.language === 'Urdu' && defaultDesc) {
    return t(defaultDesc);
  }
  return defaultDesc;
};

/**
 * Returns dynamic first aid tips
 */
export const getLocalizedFirstAid = (disease, defaultTips = []) => {
  const profile = getProfile();
  if (profile.language === 'Urdu' && Array.isArray(defaultTips)) {
    return defaultTips.map(tip => t(tip));
  }
  return defaultTips;
};

/**
 * Checks if a string contains Urdu/Arabic characters
 */
export const isUrduText = (text) => {
  if (typeof text !== 'string') return false;
  return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
};

// Automatically prefetch core UI translations into cache in the background
prefetchTranslations();

export default {
  t,
  translateText,
  prefetchTranslations,
  useTranslation,
  getLocalizedDescription,
  getLocalizedFirstAid,
  isUrduText,
  CORE_UI_KEYS
};
