import { getProfile } from './profileStore.js';

// In-memory translation cache (pre-warmed with comprehensive UI dictionary for instant render)
const translationCache = new Map([
  // Core Navigation & App Shell
  ['Home', 'ہوم'],
  ['AI Scan', 'اے آئی اسکین'],
  ['Scan', 'اسکین'],
  ['Records', 'ریکارڈز'],
  ['Forum', 'فورم'],
  ['Profile', 'پروفائل'],
  ['Marketplace', 'مارکیٹ'],
  ['Heat Alert', 'گرمی کا الرٹ'],
  ['Consultations', 'مشاورت'],
  ['Notifications', 'اطلاعات'],
  ['Settings', 'ترتیبات'],
  ['Back', 'واپس'],

  // Authentication & Onboarding
  ['Welcome Back', 'خوش آمدید'],
  ['Login', 'لاگ اِن'],
  ['Register', 'رجسٹر کریں'],
  ['Login As', 'لاگ ان بطور'],
  ['Owner', 'مالک'],
  ['Farmer', 'کسان'],
  ['Vet', 'ڈاکٹر'],
  ['Veterinarian', 'ویٹرنری ڈاکٹر'],
  ['Phone Number', 'فون نمبر'],
  ['Password', 'پاس ورڈ'],
  ['Confirm Password', 'پاس ورڈ کی تصدیق'],
  ['Forgot Password?', 'پاس ورڈ بھول گئے؟'],
  ["Don't have an account?", 'اکاؤنٹ نہیں ہے؟'],
  ['Already have an account?', 'پہلے سے اکاؤنٹ ہے؟'],
  ['Create Account', 'اکاؤنٹ بنائیں'],
  ['Logging in...', 'لاگ ان ہو رہا ہے...'],
  ['Creating Account...', 'اکاؤنٹ بن رہا ہے...'],
  ['Full Name', 'پورا نام'],
  ['Full Name (English)', 'پورا نام (انگریزی)'],
  ['Urdu Name', 'نام (اردو)'],
  ['Email', 'ای میل'],
  ['District', 'ضلع'],
  ['Select District', 'ضلع منتخب کریں'],
  ['Role', 'کردار'],
  ['PVMC License Number', 'پی وی ایم سی لائسنس نمبر'],
  ['Specialization', 'شعبہ تخصص'],
  ['Experience (Years)', 'تجربہ (سال)'],
  ['Upload Document', 'دستاویز اپ لوڈ کریں'],
  ['Uploading...', 'اپ لوڈ ہو رہا ہے...'],
  ['Enter password', 'پاس ورڈ درج کریں'],
  ['Enter Full Name', 'پورا نام درج کریں'],
  ['Enter Phone Number', 'فون نمبر درج کریں'],
  ['Enter Location (City, Province)', 'مقام درج کریں (شہر، صوبہ)'],
  ['Verification', 'تصدیق'],
  ['Verify Code', 'کوڈ کی تصدیق کریں'],
  ['Enter OTP', 'او ٹی پی درج کریں'],
  ['Resend Code', 'کوڈ دوبارہ بھیجیں'],

  // Language & Profile
  ['Language', 'زبان'],
  ['Choose Your Language', 'زبان کا انتخاب کریں'],
  ['Select Language', 'زبان منتخب کریں'],
  ['English', 'English'],
  ['Urdu', 'اردو'],
  ['Both (English and Urdu)', 'Both (English and Urdu)'],
  ['Personal Information', 'ذاتی معلومات'],
  ['Edit Profile', 'پروفائل تبدیل کریں'],
  ['Save Changes', 'تبدیلیاں محفوظ کریں'],
  ['Saved successfully', 'کامیابی سے محفوظ ہو گیا'],
  ['Help & Support', 'مدد اور رہنمائی'],
  ['Terms & Privacy', 'شرائط و ضوابط'],
  ['Log Out', 'لاگ آؤٹ'],
  ['Are you sure you want to log out?', 'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟'],
  ['Set by Admin', 'ایڈمن کے زیر انتظام'],
  ['Managed by Admin', 'ایڈمن کنٹرولڈ'],
  ['Location', 'مقام'],
  ['City', 'شہر'],
  ['Account', 'اکاؤنٹ'],

  // Dashboard & Livestock
  ['Assalam-o-Alaikum', 'السلام علیکم'],
  ['Livestock', 'مویشی'],
  ['Total Animals', 'کل جانور'],
  ['Healthy Animals', 'صحت مند جانور'],
  ['Healthy', 'صحت مند'],
  ['Infected', 'بیمار'],
  ['Sick', 'بیمار'],
  ['Active Cases', 'زیر علاج کیسز'],
  ['Quick Actions', 'فوری اقدامات'],
  ['Scan Disease', 'بیماری اسکین کریں'],
  ['Ask Community', 'کمیونٹی سے پوچھیں'],
  ['Find Veterinarian', 'ڈاکٹر تلاش کریں'],
  ['Order Medicines', 'ادویات منگوائیں'],
  ['Recent Scans', 'حالیہ اسکینز'],
  ['Recent AI Scans', 'حالیہ اے آئی اسکینز'],
  ['View All', 'سب دیکھیں'],
  ['No recent scans found', 'کوئی حالیہ اسکین نہیں ملا'],
  ['Animal Health', 'جانوروں کی صحت'],
  ['Vaccination Due', 'ویکسین کا وقت'],
  ['Weather Alert', 'موسمی الرٹ'],
  ['Veterinarians', 'ڈاکٹرز'],

  // Heat Stress & Weather
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
  ['Select Farm Location', 'فارم کا مقام منتخب کریں'],
  ['Heat stress calculation relies on your area weather', 'ہیٹ اسٹریس کا حساب آپ کے علاقے کے موسم پر ہوتا ہے'],
  ['Detecting Location...', 'مقام تلاش ہو رہا ہے...'],
  ['Use Current Device Location', 'موجودہ موبائل کا مقام استعمال کریں'],
  ['Search any district or city...', 'شہر یا ضلع تلاش کریں...'],
  ['Major Livestock Hubs (Pakistan)', 'پاکستان کے اہم لائیو اسٹاک اضلاع'],
  ['Calculating Heat Stress for your area...', 'آپ کے علاقے کے لیے ہیٹ اسٹریس لوڈ ہو رہا ہے...'],

  // AI Scan & Diseases
  ['Take Photo', 'تصویر لیں'],
  ['Upload from Gallery', 'گیلری سے منتخب کریں'],
  ['Take Clear Picture', 'صاف تصویر لیں'],
  ['Analyzing Animal...', 'جانور کا معائنہ ہو رہا ہے...'],
  ['Detection Result', 'تشخیصی نتیجہ'],
  ['Confidence', 'درستگی کا تناسب'],
  ['Confidence:', 'درستگی کا تناسب:'],
  ['Symptoms', 'علامات'],
  ['Symptoms:', 'علامات:'],
  ['First Aid / Treatment', 'ابتدائی طبی امداد و علاج'],
  ['First Aid / Treatment:', 'ابتدائی طبی امداد:'],
  ['First Aid Treatment', 'ابتدائی طبی امداد'],
  ['Consult Vet Now', 'ابھی ڈاکٹر سے رابطہ کریں'],
  ['Save to Records', 'ریکارڈ میں محفوظ کریں'],
  ['Animal Type', 'جانور کی قسم'],
  ['Animal Type:', 'جانور کی قسم:'],
  ['Cow', 'گائے'],
  ['Buffalo', 'بھینس'],
  ['Goat', 'بکری'],
  ['Sheep', 'بھیڑ'],
  ['Lumpy Skin Disease', 'لمپی اسکن بیماری'],
  ['Foot and Mouth Disease', 'منہ کھر کی بیماری'],
  ['Mastitis', 'تھنوں کی بیماری (ساڑو)'],

  // Vet Portal
  ['Vet Dashboard', 'ڈاکٹر ڈیش بورڈ'],
  ['Active Consultations', 'زیر غور مشاورت'],
  ['Pending Requests', 'زیر التواء درخواستیں'],
  ['Prescriptions', 'نسخہ جات'],
  ['Patient Records', 'مریضوں کے ریکارڈ'],
  ['Write Prescription', 'نسخہ لکھیں'],
  ['Diagnosis', 'تشخیص'],
  ['Diagnosis (English)', 'تشخیص (انگریزی)'],
  ['Treatment Plan', 'طریقہ علاج'],
  ['Dosage', 'خوراک کی مقدار'],
  ['Send Prescription', 'نسخہ ارسال کریں'],
  ['Verified Veterinarian', 'تصدیق شدہ ویٹرنری ڈاکٹر'],
  ['Available for Consultations', 'مشاورت کے لیے دستیاب'],
  ['Book Consultation', 'مشاورت بک کریں'],
  ['Total Prescriptions', 'کل نسخہ جات'],

  // Forum & Community
  ['Community Forum', 'کمیونٹی فورم'],
  ['Discussions', 'گفتگو'],
  ['Start Discussion', 'نئی گفتگو شروع کریں'],
  ['Search discussions...', 'تلاش کریں...'],
  ['Brief title for your discussion', 'گفتگو کا مختصر عنوان'],
  ['Describe your issue or share advice (English/Urdu)', 'اپنے مسئلے کی وضاحت کریں یا مشورہ دیں (انگریزی/اردو)'],
  ['Reply', 'جواب دیں'],
  ['Replies', 'جوابات'],
  ['Post Reply', 'جواب ارسال کریں'],
  ['No discussions yet', 'ابھی تک کوئی گفتگو نہیں'],

  // Marketplace & Cart
  ['Search medicines...', 'دوائیں تلاش کریں...'],
  ['Add to Cart', 'ٹوکری میں شامل کریں'],
  ['Cart', 'ٹوکری'],
  ['Checkout', 'آرڈر مکمل کریں'],
  ['Total Amount', 'کل رقم'],
  ['Cash on Delivery', 'کیش آن ڈیلیوری'],
  ['Payment Method', 'ادائیگی کا طریقہ'],

  // Common Actions & Modals
  ['Save', 'محفوظ کریں'],
  ['Cancel', 'منسوخ کریں'],
  ['Delete', 'حذف کریں'],
  ['Edit', 'ترمیم کریں'],
  ['Submit', 'جمع کروائیں'],
  ['Done', 'مکمل'],
  ['Close', 'بند کریں'],
  ['Search', 'تلاش کریں'],
  ['Loading...', 'لوڈ ہو رہا ہے...'],
  ['Success', 'کامیابی'],
  ['Error', 'خرابی'],
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
 * 
 * Rules:
 * - English mode: Pure English only.
 * - Urdu mode: Pure Urdu only.
 * - Both mode: English on line 1, Urdu written strictly below on line 2 (separated by \n, never /).
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

  // 'Both' mode: Urdu placed just below English
  if (lang === 'Both') {
    if (translatedUr && translatedUr !== en) {
      return `${en}\n${translatedUr}`;
    }
    return en;
  }

  return en;
};

/**
 * Structured helper for clean UI rendering without inline single-line collisions.
 * Returns { en, ur, isBoth, isUrdu, isEnglish, display }
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
    display: lang === 'Urdu' ? (ur || cleanEn) : (lang === 'Both' ? `${cleanEn}\n${ur || cleanEn}` : cleanEn)
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
  if (lang === 'Both') return `${defaultDesc}\n${urduDesc}`;
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
    return defaultTips.map((tip, idx) => {
      const urTip = urduTips[idx];
      return urTip ? `${tip}\n${urTip}` : tip;
    });
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

export default {
  t,
  tSplit,
  translateText,
  useTranslation,
  getLocalizedDescription,
  getLocalizedFirstAid,
  isUrduText
};
