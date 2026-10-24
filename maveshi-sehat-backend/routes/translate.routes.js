const express = require('express');
const router = express.Router();

const backendTranslationCache = new Map();

// Built-in high-quality Urdu dictionary for instant offline/0ms UI translation
const BUILTIN_URDU_DICTIONARY = {
  // Navigation & Core Actions
  'Home': 'گھر',
  'AI Scan': 'اے آئی اسکین',
  'Scan': 'اسکین',
  'Records': 'ریکارڈز',
  'Forum': 'فورم',
  'Profile': 'پروفائل',
  'Marketplace': 'مارکیٹ پلیس',
  'Heat Alert': 'ہیٹ الرٹ',
  'Consultations': 'مشاورت',
  'Notifications': 'اطلاعات',
  'Settings': 'ترتیبات',
  'Back': 'واپس',
  'Cancel': 'منسوخ',
  'Close': 'بند کریں',
  'Search': 'تلاش کریں',
  'Loading...': 'لوڈ ہو رہا ہے...',
  'Success': 'کامیابی',
  'Error': 'خرابی',
  'Save Changes': 'تبدیلیاں محفوظ کریں',
  'Saved successfully': 'کامیابی سے محفوظ ہو گیا',
  'Log Out': 'لاگ آؤٹ',
  'Help & Support': 'مدد اور تعاون',
  'Terms & Privacy': 'شرائط اور رازداری',

  // Auth & Account
  'Welcome Back': 'خوش آمدید',
  'Login': 'لاگ ان',
  'Register': 'رجسٹر',
  'Login As': 'بطور لاگ ان کریں',
  'Owner': 'مالک',
  'Farmer': 'کسان',
  'Vet': 'ڈاکٹر',
  'Veterinarian': 'ماہر امراض مویشی',
  'Phone Number': 'فون نمبر',
  'Password': 'پاس ورڈ',
  'Confirm Password': 'پاس ورڈ کی تصدیق کریں',
  'Forgot Password?': 'پاس ورڈ بھول گئے؟',
  "Don't have an account?": 'کیا آپ کا اکاؤنٹ نہیں ہے؟',
  'Already have an account?': 'پہلے سے اکاؤنٹ موجود ہے؟',
  'Create Account': 'اکاؤنٹ بنائیں',
  'Logging in...': 'لاگ ان ہو رہا ہے...',
  'Creating Account...': 'اکاؤنٹ بن رہا ہے...',
  'Full Name': 'پورا نام',
  'Email': 'ای میل',
  'District': 'ضلع',
  'Select District': 'ضلع منتخب کریں',
  'Role': 'کردار',
  'PVMC License Number': 'پی وی ایم سی لائسنس نمبر',
  'Specialization': 'مہارت',
  'Experience (Years)': 'تجربہ (سال)',
  'Upload Document': 'دستاویز اپ لوڈ کریں',
  'Uploading...': 'اپ لوڈ ہو رہا ہے...',
  'Enter password': 'پاس ورڈ درج کریں',
  'Enter Full Name': 'پورا نام درج کریں',
  'Enter Phone Number': 'فون نمبر درج کریں',
  'Verification': 'تصدیق',
  'Verify Code': 'کوڈ کی تصدیق کریں',
  'Enter OTP': 'او ٹی پی درج کریں',
  'Resend Code': 'کوڈ دوبارہ بھیجیں',
  'Language': 'زبان',
  'Choose Your Language': 'اپنی زبان منتخب کریں',
  'Select Language': 'زبان منتخب کریں',
  'English': 'انگریزی',
  'Urdu': 'اردو',
  'Personal Information': 'ذاتی معلومات',
  'Edit Profile': 'پروفائل میں ترمیم کریں',
  'Location': 'مقام',
  'City': 'شہر',
  'Account': 'اکاؤنٹ',

  // Livestock & Health Terms
  'Assalam-o-Alaikum': 'السلام علیکم',
  'Livestock': 'مویشی',
  'Total Animals': 'کل جانور',
  'Healthy Animals': 'صحت مند جانور',
  'Healthy': 'صحت مند',
  'Infected': 'متاثرہ',
  'Sick': 'بیمار',
  'Active Cases': 'فعال کیسز',
  'Quick Actions': 'فوری اقدامات',
  'Scan Disease': 'بیماری اسکین کریں',
  'Ask Community': 'کمیونٹی سے پوچھیں',
  'Find Veterinarian': 'ڈاکٹر تلاش کریں',
  'Order Medicines': 'دوائیں منگوائیں',
  'Recent Scans': 'حالیہ اسکینز',
  'Animal Health': 'جانوروں کی صحت',
  'Weather Alert': 'موسمی الرٹ',
  'Veterinarians': 'ڈاکٹرز',
  'Confidence': 'یقین',
  'Confidence:': 'یقین:',
  'Animal Type': 'جانور کی قسم',
  'Animal Type:': 'جانور کی قسم:',
  'Cow': 'گائے',
  'Buffalo': 'بھینس',
  'Goat': 'بکری',
  'Sheep': 'بھیڑ',
  'Symptoms': 'علامات',
  'Symptoms:': 'علامات:',
  'First Aid': 'ابتدائی طبی امداد',
  'First Aid / Treatment': 'ابتدائی طبی امداد / علاج',
  'First Aid / Treatment:': 'ابتدائی طبی امداد / علاج:',
  'Risk Level:': 'خطرے کی سطح:',
  'High Risk': 'زیادہ خطرہ',
  'Medium Risk': 'درمیانہ خطرہ',
  'Low Risk': 'کم خطرہ',
  'Date & Time:': 'تاریخ اور وقت:',
  'Save to Records': 'ریکارڈ میں محفوظ کریں',
  'Consult Vet Now': 'ابھی ڈاکٹر سے رابطہ کریں',
  'Health Records': 'صحت کے ریکارڈز',
  'Search records...': 'ریکارڈز تلاش کریں...',
  'Total Scans': 'کل اسکینز',
  'All': 'تمام',
  'Active': 'فعال',
  'Under Treatment': 'زیر علاج',
  'Recovered': 'صحت یاب',
  'Pending': 'زیر التواء',
  'Urgent': 'فوری',
  'Resolved': 'حل شدہ',
  'Submitted Cases': 'جمع کردہ کیسز',
  'Verification Document': 'تصدیقی دستاویز',
  'Sehat Assistant': 'صحت اسسٹنٹ',
  'Ask Sehat Assistant': 'صحت اسسٹنٹ سے پوچھیں',
  'Instant AI guidance for your animals': 'آپ کے جانوروں کے لیے فوری اے آئی رہنمائی',
  'AI Assistant': 'اے آئی اسسٹنٹ',
  'Clear Chat': 'چیٹ صاف کریں',
  'Suggested Questions': 'تجویز کردہ سوالات'
};

// Seed in-memory cache with standard Urdu translations
for (const [key, val] of Object.entries(BUILTIN_URDU_DICTIONARY)) {
  backendTranslationCache.set(`${key.trim()}_en_ur`, val);
}

async function fetchOnlineTranslation(text, targetLang = 'ur', sourceLang = 'en') {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (targetLang === sourceLang) return trimmed;

  const cacheKey = `${trimmed}_${sourceLang}_${targetLang}`;
  if (backendTranslationCache.has(cacheKey)) {
    return backendTranslationCache.get(cacheKey);
  }

  // Check built-in dictionary for Urdu translations
  if (targetLang === 'ur' && BUILTIN_URDU_DICTIONARY[trimmed]) {
    const val = BUILTIN_URDU_DICTIONARY[trimmed];
    backendTranslationCache.set(cacheKey, val);
    return val;
  }

  // Primary: Google Translate dict-chrome-ex API (with 4-second timeout)
  try {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${targetLang}&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data[0]) {
        const translated = Array.isArray(data) ? data[0] : data;
        if (typeof translated === 'string' && translated.length > 0) {
          backendTranslationCache.set(cacheKey, translated);
          return translated;
        }
      }
    }
  } catch (err) {
    // Silently fall back to secondary without spamming the console
  }

  // Fallback: MyMemory API (with 4-second timeout)
  try {
    const memUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${sourceLang}|${targetLang}`;
    const memRes = await fetch(memUrl, { signal: AbortSignal.timeout(4000) });
    if (memRes.ok) {
      const memData = await memRes.json();
      if (memData && memData.responseData && memData.responseData.translatedText) {
        const result = memData.responseData.translatedText;
        backendTranslationCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    // Network offline or rate limited
  }

  return trimmed;
}

// Helper to process translations in small batches of 5 to avoid network congestion
async function translateInBatches(items, targetLang, sourceLang, batchSize = 5) {
  const results = {};
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(async (t) => {
        if (t && typeof t === 'string') {
          results[t] = await fetchOnlineTranslation(t, targetLang, sourceLang);
        }
      })
    );
  }
  return results;
}

module.exports = () => {
  router.post('/api/translate', async (req, res) => {
    try {
      const { text, texts, targetLang = 'ur', sourceLang = 'en' } = req.body;
      
      // Support both `texts: [...]` and `text: [...]`
      const rawList = Array.isArray(texts) ? texts : (Array.isArray(text) ? text : null);

      if (rawList) {
        const results = await translateInBatches(rawList, targetLang, sourceLang);
        
        // Return both object and list format to support mobile app and pharmacy dashboards
        const translationsList = Object.entries(results).map(([original, translated]) => ({
          original,
          translated
        }));

        return res.json({
          translations: results,
          translationsList,
          targetLang
        });
      }

      // Single text translation
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text or texts array is required.' });
      }

      const translatedText = await fetchOnlineTranslation(text, targetLang, sourceLang);
      res.json({ translatedText, sourceText: text, targetLang });
    } catch (err) {
      console.error('Translation endpoint error:', err);
      res.status(500).json({ error: 'Translation failed', details: err.message });
    }
  });

  return router;
};
