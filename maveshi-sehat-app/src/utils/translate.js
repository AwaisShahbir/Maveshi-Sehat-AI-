import { getProfile } from './profileStore';


export const t = (en, ur) => {
  const profile = getProfile();
  const lang = profile.language || 'English'; 
  
  if (lang === 'Urdu') {
    return ur || en;
  }
  if (lang === 'English') {
    return en || ur;
  }
  
  if (en && ur) {
    return `${en} / ${ur}`;
  }
  return en || ur || '';
};

export const useTranslation = () => {
  return { t };
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
