import { getProfile } from './profileStore.js';

// In-memory translation cache (pre-warmed with key terms for instant synchronous render)
const translationCache = new Map([
  ['Heat Stress Alert', 'ہیٹ اسٹریس الرٹ'],
  ['Real-Time Livestock THI Index & Weather', 'مویشیوں کے لیے بروقت THI انڈیکس اور موسم'],
  ['Current Detected Location', 'موجودہ معلوم شدہ مقام'],
  ['Selected Farm Location', 'منتخب کردہ فارم کا مقام'],
  ['Change', 'تبدیل کریں'],
  ['Change Location', 'مقام تبدیل کریں'],
  ['Current THI Index', 'موجودہ THI انڈیکس'],
  ['Temperature-Humidity Index', 'درجہ حرارت اور نمی انڈیکس'],
  ['THI Index', 'ٹی ایچ آئی انڈیکس'],
  ['Temperature', 'درجہ حرارت'],
  ['Humidity', 'نمی'],
  ['Wind Speed', 'ہوا کی رفتار'],
  ['No Stress', 'کوئی دباؤ نہیں'],
  ['Moderate Stress', 'معتدل دباؤ'],
  ['Severe Stress', 'شدید دباؤ'],
  ['Deadly', 'خطرناک'],
  ['Veterinary Advisory', 'حفاظتی تدابیر و رہنمائی'],
  ['7-Day Forecast', '7 روزہ پیشن گوئی'],
  ['Today', 'آج'],
  ['Sun', 'اتوار'],
  ['Mon', 'پیر'],
  ['Tue', 'منگل'],
  ['Wed', 'بدھ'],
  ['Thu', 'جمعرات'],
  ['Fri', 'جمعہ'],
  ['Sat', 'ہفتہ'],
  ['Select Farm Location', 'فارم کا مقام منتخب کریں'],
  ['Heat stress calculation relies on your area weather', 'ہیٹ اسٹریس کا حساب آپ کے علاقے کے موسم پر ہوتا ہے'],
  ['Detecting Location...', 'مقام تلاش ہو رہا ہے...'],
  ['Use Current Device Location', 'موجودہ موبائل کا مقام استعمال کریں'],
  ['Search any district or city...', 'شہر یا ضلع تلاش کریں...'],
  ['Major Livestock Hubs (Pakistan)', 'پاکستان کے اہم لائیو اسٹاک اضلاع'],
  ['Calculating Heat Stress for your area...', 'آپ کے علاقے کے لیے ہیٹ اسٹریس لوڈ ہو رہا ہے...'],
  ['Home', 'ہوم'],
  ['AI Scan', 'اسکین'],
  ['Records', 'ریکارڈز'],
  ['Forum', 'فورم'],
  ['Profile', 'پروفائل'],
  ['Assalam-o-Alaikum', 'السلام علیکم'],
  ['Livestock', 'مویشی'],
  ['Healthy', 'صحت مند'],
  ['Farmer', 'کسان'],
  ['Veterinarian', 'ڈاکٹر'],
  ['Consultations', 'مشاورت'],
  ['Notifications', 'اطلاعات'],
]);

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
 * Calls Translation API to translate English text to Urdu (or target language)
 */
export const translateText = async (text, targetLang = 'ur') => {
  if (!text || typeof text !== 'string') return '';
  if (targetLang === 'en') return text;

  const cacheKey = `${text.trim()}_${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }
  if (translationCache.has(text.trim())) {
    return translationCache.get(text.trim());
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data[0]) {
      const translated = data[0].map(s => s[0]).join('');
      translationCache.set(cacheKey, translated);
      translationCache.set(text.trim(), translated);
      notifyTranslationListeners();
      return translated;
    }
  } catch (err) {
    console.warn('Google Translate API error:', err);
  }
  return text;
};

/**
 * Universal translation function.
 * Translates English text automatically using the Translation API and cached translations.
 */
export const t = (en, urFallback) => {
  if (!en) return '';
  const profile = getProfile();
  const lang = profile.language || 'English';

  if (lang === 'English') {
    return en;
  }

  // Look up translated text from API cache, or fallback to provided string
  const cleanEn = typeof en === 'string' ? en.trim() : en;
  let translatedUr = translationCache.get(cleanEn) || urFallback;

  // If not yet translated, trigger async API fetch in the background
  if (!translatedUr && typeof en === 'string' && en.length > 0) {
    translateText(cleanEn, 'ur');
    translatedUr = en; // temporary fallback until API returns
  }

  if (lang === 'Urdu') {
    return translatedUr || en;
  }

  // 'Both' mode
  if (lang === 'Both') {
    if (translatedUr && translatedUr !== en) {
      return `${en} / ${translatedUr}`;
    }
    return en;
  }

  return en;
};

/**
 * Structured helper for clean UI rendering without ugly slash wrapping
 * Returns { en, ur, isBoth, isUrdu, isEnglish }
 */
export const tSplit = (en, urFallback) => {
  if (!en) return { en: '', ur: '', display: '' };
  const profile = getProfile();
  const lang = profile.language || 'English';

  const cleanEn = typeof en === 'string' ? en.trim() : en;
  let ur = translationCache.get(cleanEn) || urFallback;

  if (!ur && typeof en === 'string' && en.length > 0) {
    translateText(cleanEn, 'ur');
    ur = en;
  }

  return {
    en: cleanEn,
    ur: ur || cleanEn,
    lang,
    isBoth: lang === 'Both',
    isUrdu: lang === 'Urdu',
    isEnglish: lang === 'English',
    display: lang === 'Urdu' ? (ur || cleanEn) : (lang === 'Both' ? `${cleanEn} / ${ur}` : cleanEn)
  };
};

export const useTranslation = () => {
  return { t, tSplit, translateText };
};

export const getLocalizedDescription = (disease, defaultDesc) => {
  const profile = getProfile();
  const lang = profile.language || 'English';
  
  let urduDesc = '';
  if (disease === 'Lumpy Skin Disease') {
    urduDesc = 'جلد پر گانٹھیں، بخار، اور لمف نوڈس کا بڑھ جانا۔';
  } else if (disease === 'Foot and Mouth Disease') {
    urduDesc = 'منہ، زبان اور کھروں پر چھالے، منہ سے رال بہنا، لنگڑا پن، اور تیز بخار۔';
  } else if (disease === 'Mastitis') {
    urduDesc = 'تھنوں کا سوج جانا اور درد ہونا۔ دودھ کا رنگ بدلنا، دودھ میں خون کے لوتھڑے آنا اور پیداوار میں کمی۔';
  } else {
    urduDesc = 'نارمل خوراک، صاف جلد، چمکدار آنکھیں، چست رویہ۔';
  }

  if (lang === 'Urdu') return urduDesc;
  if (lang === 'Both') return `${defaultDesc} / ${urduDesc}`;
  return defaultDesc;
};

export const getLocalizedFirstAid = (disease, defaultTips = []) => {
  const profile = getProfile();
  const lang = profile.language || 'English';
  
  let urduTips = [];
  if (disease === 'Lumpy Skin Disease') {
    urduTips = [
      'متاثرہ جانور کو فوری طور پر باڑے کے دوسرے جانوروں سے الگ کریں۔',
      'سیکنڈری انفیکشن سے بچنے کے لیے کھلے زخموں پر جراثیم کش دوا لگائیں۔',
      'بیماری کے پھیلاؤ کو روکنے کے لیے مچھروں اور چچڑوں کا خاتمہ کریں۔',
      'نرم چارہ اور صاف پانی فراہم کریں۔'
    ];
  } else if (disease === 'Foot and Mouth Disease') {
    urduTips = [
      'منہ کے زخموں کو ہلکے جراثیم کش پانی (پوٹاشیم پرمینگنیٹ) سے دھوئیں۔',
      'منہ کے چھالوں پر بورک ایسڈ اور گلیسرین کا مرکب لگائیں۔',
      'کھروں کے انفیکشن سے بچنے کے لیے جانور کو خشک جگہ پر رکھیں۔',
      'چبانے میں آسانی کے لیے نرم دلیا یا خوراک فراہم کریں۔'
    ];
  } else if (disease === 'Mastitis') {
    urduTips = [
      'بیماری والے تھن سے بار بار (ہر ۲ گھنٹے بعد) دودھ نکالیں تاکہ جراثیم ختم ہوں۔',
      'سوجن والے تھن پر ٹھنڈے پانی کی پٹیاں رکھیں، اور خشک ہونے پر ہلکا مساج کریں۔',
      'ملکنگ کے دوران صفائی کا خاص خیال رکھیں، دودھ نکالنے سے پہلے اور بعد میں تھنوں کو دھوئیں۔',
      'تھنوں کو مزید نقصان سے بچانے کے لیے آرام دہ جگہ فراہم کریں۔'
    ];
  } else {
    urduTips = [
      'باقاعدگی سے متوازن خوراک اور ویکسینیشن کا شیڈول برقرار رکھیں۔',
      'رہائش گاہ کو خشک، ہوادار اور صاف رکھیں۔',
      'باقاعدگی سے صحت کا معائنہ کریں۔'
    ];
  }

  if (lang === 'Urdu') return urduTips;
  if (lang === 'Both') {
    return defaultTips.map((tip, idx) => `${tip} / ${urduTips[idx] || ''}`);
  }
  return defaultTips;
};
