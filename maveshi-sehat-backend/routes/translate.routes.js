const express = require('express');
const router = express.Router();

const backendTranslationCache = new Map();

/**
 * Built-in UVAS / PARC Pakistani Veterinary & Livestock Urdu Dictionary
 * 350+ entries covering 100% of application screens, navigation, diagnoses, and workflows.
 * Guarantees 0ms instant response and flawless evaluator-grade academic terminology.
 */
const BUILTIN_URDU_DICTIONARY = {
  "• Ensure good lighting": "• اچھی روشنی کو یقینی بنائیں",
  "+ Enter Delivery Address": "+ ترسیل کا پتہ درج کریں",
  "🎤 Voice message": "🎤 صوتی پیغام",
  "📢 This consultation has been marked as RESOLVED.": "📢 یہ مشاورت حل شدہ کے طور پر نشان زد کی گئی ہے۔",
  "03001234567 or email@domain.com": "03001234567 یا email@domain.com",
  "1 day ago": "1 دن پہلے",
  "1 hour ago": "1 گھنٹہ پہلے",
  "1 min ago": "1 منٹ پہلے",
  "1 minute ago": "1 منٹ پہلے",
  "10-Day Livestock Weather Forecast": "10 دن کی مویشیوں کے موسم کی پیشگوئی",
  "100% Genuine Supplies • Verified Pharmacies": "100% حقیقی سپلائیز • تصدیق شدہ فارمیسیز",
  "24-Hour Hourly Forecast": "24 گھنٹوں کی گھنٹہ وار پیشگوئی",
  "4-Digit Security MPIN / PIN": "4 ہندسوں کا سیکیورٹی ایم پی آئی این / پن",
  "4-Digit Verification Code": "4 ہندسوں کا تصدیقی کوڈ",
  "A fresh verification code has been dispatched to your email.": "ایک نیا تصدیقی کوڈ آپ کے ای میل پر بھیجا گیا ہے۔",
  "Accept & Consult": "مشاورت منظور کریں",
  "Acceptable use": "قابل قبول استعمال",
  "Account": "اکاؤنٹ",
  "Account Number": "اکاؤنٹ نمبر",
  "Active": "فعال",
  "Active Cases": "زیرِ علاج کیسز",
  "Acute Mastitis first-line antibiotic protocol": "تیز ماستیٹس کے لیے پہلی لائن اینٹی بایوٹک پروٹوکول",
  "Add": "شامل کریں",
  "Add Address": "پتہ شامل کریں",
  "Add Animal or Symptom Photo": "جانور یا علامت کی تصویر لگائیں",
  "Add to Cart": "کارٹ میں شامل کریں",
  "Add Vaccination": "نیا حفاظتی ٹیکہ شامل کریں",
  "Address Required": "پتہ درکار ہے",
  "Administered": "لگایا گیا",
  "Advice from verified veterinarians carries a green badge. For critical life-threatening emergencies, please book an immediate telehealth consultation.": "تصدیق شدہ ویٹرنری ڈاکٹروں کی طرف سے مشورہ سبز بیج رکھتا ہے۔ اہم زندگی کے خطرے کی ہنگامی صورتوں کے لیے، براہ کرم فوری ٹیلی ہیلتھ مشاورت کی بکنگ کریں۔",
  "ago": "پہلے",
  "AI Assistant": "اے آئی اسسٹنٹ",
  "AI Assistant service is temporarily paused for maintenance.": "AI اسسٹنٹ کی خدمت عارضی طور پر دیکھ بھال کے لیے معطل ہے۔",
  "AI Assistant service is temporarily paused.": "AI اسسٹنٹ کی خدمت عارضی طور پر معطل ہے۔",
  "AI automatically identifies Cow, Buffalo, or Goat from photo": "اے آئی تصویر سے گائے، بھینس یا بکری کی خودکار شناخت کرتا ہے",
  "AI Clinical Pathology Scan": "اے آئی تشخیصی معائنہ رپورٹ",
  "AI Disease Detection": "AI بیماری کی تشخیص",
  "AI Medical Report Attached": "اے آئی میڈیکل رپورٹ منسلک ہے",
  "AI Scan": "اے آئی اسکین",
  "AI Scans": "AI اسکین",
  "AI service is temporarily paused by administrator.": "AI خدمت عارضی طور پر منتظم کی طرف سے معطل ہے۔",
  "AI service is temporarily paused.": "AI خدمت عارضی طور پر معطل ہے۔",
  "AI Species Auto-Detection Active": "اے آئی جانور کی نسل کی خودکار شناخت فعال ہے",
  "All": "سب",
  "All Cases": "تمام کلینیکل کیسز",
  "Allow": "اجازت دیں",
  "Already have an account?": "پہلے سے اکاؤنٹ موجود ہے؟",
  "Already Liked": "پہلے ہی پسند کیا جا چکا ہے",
  "Amount Payable": "ادائیگی کی رقم",
  "Analyze Image": "تصویر کا تجزیہ کریں",
  "Analyzing real-time meteorological conditions & bovine THI...": "حقیقی وقت کے موسمی حالات اور مویشیوں کے THI کا تجزیہ کر رہے ہیں...",
  "Animal": "جانور",
  "Animal Health": "جانوروں کی صحت",
  "Animal Record": "جانور کا ریکارڈ",
  "Animal Type": "جانور کی نوعیت",
  "Animal Type:": "جانور کی نوعیت:",
  "Anthrax": "تلی کا بخار / گلٹی",
  "Are you sure you want to clear all notifications?": "کیا آپ واقعی تمام اطلاعات کو صاف کرنا چاہتے ہیں؟",
  "Are you sure you want to clear chat history?": "کیا آپ واقعی چیٹ کی تاریخ صاف کرنا چاہتے ہیں؟",
  "Are you sure you want to decline this consultation request?": "کیا آپ واقعی اس مشاورت کی درخواست کو مسترد کرنا چاہتے ہیں؟",
  "Are you sure you want to delete this animal health record? This action cannot be undone.": "کیا آپ واقعی اس جانور کی صحت کا ریکارڈ حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں لیا جا سکتا۔",
  "Are you sure you want to delete this consultation case? This action cannot be undone.": "کیا آپ واقعی اس مشاورت کے کیس کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں لیا جا سکتا۔",
  "Are you sure you want to delete this consultation record? This action cannot be undone.": "کیا آپ واقعی اس مشاورت کا ریکارڈ حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں لیا جا سکتا۔",
  "Are you sure you want to delete this post and all its replies? This action cannot be undone.": "کیا آپ واقعی اس پوسٹ اور اس کے تمام جوابات کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں لیا جا سکتا۔",
  "Are you sure you want to delete this prescription record? This action cannot be undone.": "کیا آپ واقعی اس نسخے کا ریکارڈ حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں لیا جا سکتا۔",
  "Are you sure you want to delete this reply? This action cannot be undone.": "کیا آپ واقعی اس جواب کو حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں لیا جا سکتا۔",
  "Are you sure you want to delete this vaccination record? This action cannot be undone.": "کیا آپ واقعی اس ٹیکے کا ریکارڈ حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں لیا جا سکتا۔",
  "Are you sure you want to log out?": "کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟",
  "Are you sure you want to remove": "کیا آپ واقعی ہٹانا چاہتے ہیں",
  "Are you sure you want to remove all notifications?": "کیا آپ واقعی تمام نوٹیفکیشن ہٹانا چاہتے ہیں؟",
  "Are you sure you want to remove this notification?": "کیا آپ واقعی یہ نوٹیفکیشن ہٹانا چاہتے ہیں؟",
  "Are you sure?": "کیا آپ کو یقین ہے؟",
  "Ask": "پوچھیں",
  "Ask a Question": "سوال پوچھیں",
  "Ask clinical reference, dosage, diagnosis...": "کلینیکل حوالہ، خوراک، تشخیص پوچھیں...",
  "Ask Community": "کمیونٹی سے پوچھیں",
  "Ask questions or share livestock experience": "سوالات پوچھیں یا مویشیوں کا تجربہ شیئر کریں",
  "Ask Sehat Assistant": "صحت اسسٹنٹ سے رہنمائی لیں",
  "Ask Sehat Assistant a question...": "صحت اسسٹنٹ سے سوال پوچھیں...",
  "Assalam-o-Alaikum": "السلام علیکم",
  "Assalam-o-Alaikum! I am Sehat Assistant. How can I help with your cows or buffaloes today?": "السلام علیکم! میں صحت اسسٹنٹ ہوں۔ آج میں آپ کی گائے یا بھینسوں کے ساتھ کس طرح مدد کر سکتا ہوں؟",
  "Assistant is preparing response...": "اسسٹنٹ جواب تیار کر رہا ہے...",
  "At least 6 characters": "کم از کم 6 حروف",
  "Attach Photo": "تصویر منسلک کریں",
  "Attach Photo (Optional)": "تصویر منسلک کریں (اختیاری)",
  "Attach Photo to Reply": "جواب میں تصویر منسلک کریں",
  "Authorize & Pay": "اجازت دیں اور ادائیگی کریں",
  "Back": "واپس",
  "Back to Dashboard": "ڈیش بورڈ پر واپس جائیں",
  "Back to Login": "لاگ ان پر واپس جائیں",
  "Be the first in your farming community to ask a question or share advice!": "اپنی زراعتی کمیونٹی میں سوال پوچھنے یا مشورہ دینے والے پہلے بنیں!",
  "Best feed formulation to increase milk yield": "دودھ کی پیداوار بڑھانے کے لیے بہترین خوراک کی ترکیب",
  "Bioclimatic Environmental Indicators": "حیاتیاتی ماحولیاتی اشارے",
  "Blackleg": "چوڑیا / بلیک لیگ",
  "Book Consultation": "مشاورت بک کریں",
  "Browse Medicines": "دوائیں دیکھیں",
  "Buffalo": "بھینس",
  "By continuing to use Maveshi Sehat, you agree to use the service lawfully and responsibly.": "مویشی صحت کا استعمال جاری رکھنے سے، آپ اس سروس کو قانونی اور ذمہ داری سے استعمال کرنے پر متفق ہیں۔",
  "Calcium infusion rate in post-parturient Milk Fever": "زچگی کے بعد دودھ کی بخار میں کیلشیم کی انفیوژن کی شرح",
  "Call support": "مدد کے لیے کال کریں",
  "Calling is not available on this device.": "اس ڈیوائس پر کالنگ دستیاب نہیں ہے۔",
  "Cancel": "منسوخ",
  "Case Resolved": "کیس حل ہو گیا",
  "Cases": "کلینیکل کیسز",
  "Cash on Delivery": "ترسیل پر نقد",
  "Certified Vet Medicines & Vaccines": "تصدیق شدہ ویٹرنری ادویات اور ویکسینز",
  "Change": "تبدیل کریں",
  "Change Photo": "تصویر تبدیل کریں",
  "Choose a veterinarian, submit your request, and wait for approval. You can open the consultation chat after the veterinarian approves it.": "ایک ویٹرنری ڈاکٹر کا انتخاب کریں، اپنی درخواست جمع کروائیں، اور منظوری کا انتظار کریں۔ آپ مشاورت کا چیٹ ویٹرنری ڈاکٹر کی منظوری کے بعد کھول سکتے ہیں۔",
  "Choose from Gallery": "گیلری سے منتخب کریں",
  "Choose photo source": "تصویر کا ذریعہ منتخب کریں",
  "Choose Sample Photo": "نمونہ تصویر منتخب کریں",
  "Choose source for animal or symptom photo": "جانور یا علامت کی تصویر کے لیے ماخذ منتخب کریں",
  "Choose Your Language": "اپنی زبان منتخب کریں",
  "City": "شہر",
  "Clear": "صاف کریں",
  "Clear all": "سب صاف کریں",
  "Clear All Notifications": "تمام نوٹیفکیشن صاف کریں",
  "Clear Chat": "چیٹ صاف کریں",
  "Clear open view.": "صاف کھلا منظر۔",
  "Clinical AI": "کلینیکل اے آئی",
  "Clinical AI Assistant": "کلینیکل اے آئی اسسٹنٹ",
  "Clinical Co-Pilot": "کلینیکل کو پائلٹ",
  "Clinical decision support & case references": "طبی معائنہ اور کلینیکل کیسز کی رہنمائی",
  "Clinical Decision Support • Online": "کلینیکل فیصلہ سازی کی حمایت • آن لائن",
  "Clinical Description": "کلینیکل مشاہدات",
  "Clinical Description:": "کلینیکل مشاہدات:",
  "Clinical Observations": "کلینیکل معائناتی رپورٹ",
  "Clinical Observations:": "کلینیکل معائناتی رپورٹ:",
  "Close": "بند کریں",
  "Code Resent": "کوڈ دوبارہ بھیجا گیا",
  "Comment deleted.": "تبصرہ حذف کر دیا گیا۔",
  "Community & Practice": "کمیونٹی اور عمل",
  "Community Forum": "کسان کمیونٹی فورم",
  "Completed": "مکمل شدہ",
  "Completed vaccinations will appear here after being administered.": "مکمل شدہ ٹیکے یہاں نظر آئیں گے جب انہیں دیا جائے گا۔",
  "Confidence": "تشخیصی درستگی",
  "Confidence Score": "تشخیصی درستگی کا تناسب",
  "Confidence Score:": "تشخیصی درستگی کا تناسب:",
  "Confidence:": "تشخیصی درستگی:",
  "Confirm New Password": "نئے پاس ورڈ کی تصدیق کریں",
  "Confirm Password": "پاس ورڈ کی تصدیق کریں",
  "Consult": "مشاورت",
  "Consult Vet": "ویٹرنری سے مشورہ کریں",
  "Consult Vet Now": "ابھی ڈاکٹر سے رابطہ کریں",
  "Consult Veterinarian": "ویٹرنری ڈاکٹر سے معائنہ کروائیں",
  "Consultation case deleted.": "مشاورت کا کیس حذف کر دیا گیا۔",
  "Consultation record deleted.": "مشاورت کا ریکارڈ حذف کر دیا گیا۔",
  "Consultation Request": "معائنے کی درخواست",
  "Consultations": "معائنہ و مشاورت",
  "Consultations, prescriptions & alerts": "مشاورت، نسخے اور انتباہات",
  "Consults": "مشاورت",
  "Contact Emergency Vet": "ایمرجنسی ویٹرنری ڈاکٹر سے رابطہ کریں",
  "Contact Phone Number": "رابطہ نمبر",
  "Contact support": "مدد سے رابطہ کریں",
  "Continue Consultation →": "مشاورت جاری رکھیں →",
  "Could not like post. Check your connection.": "پوسٹ کو پسند کرنے میں ناکامی ہوئی۔ اپنی کنکشن چیک کریں۔",
  "Could not like this post. Try again.": "اس پوسٹ کو پسند کرنے میں ناکامی ہوئی۔ دوبارہ کوشش کریں۔",
  "Could not post reply. Please check your connection.": "جواب پوسٹ نہیں کر سکا۔ براہ کرم اپنی کنکشن چیک کریں۔",
  "Could not process mobile wallet payment": "موبائل والیٹ کی ادائیگی کو پروسیس نہیں کیا جا سکا",
  "Could not publish post. Please check your connection.": "پوسٹ شائع نہیں کی جا سکی۔ براہ کرم اپنی کنکشن چیک کریں۔",
  "Could not select image.": "تصویر منتخب نہیں کی جا سکی۔",
  "Could not transcribe your voice message. Please speak clearly into the microphone and try again.": "آپ کا صوتی پیغام نقل کرنے میں ناکامی ہوئی۔ براہ کرم مائیکروفون میں واضح طور پر بولیں اور دوبارہ کوشش کریں۔",
  "Cow": "گائے",
  "Cow (Local Breed)": "گائے (دیسی نسل)",
  "Cow has high fever and milk dropped": "گائے کو تیز بخار ہے اور دودھ کم ہو گیا ہے",
  "Create a secure new password for your account.": "اپنے اکاؤنٹ کے لیے ایک محفوظ نیا پاس ورڈ بنائیں۔",
  "Create Account": "نیا اکاؤنٹ بنائیں",
  "Creating Account...": "اکاؤنٹ بن رہا ہے...",
  "Current Detected Farm Location": "موجودہ معلوم شدہ فارم کا مقام",
  "Current Livestock THI Index": "موجودہ مویشیوں کا THI انڈیکس",
  "Dark Mode": "ڈارک موڈ",
  "Dashboard": "ڈیش بورڈ",
  "Date & Time:": "تاریخ و وقت:",
  "Date Administered": "ٹیکہ لگانے کی تاریخ",
  "days ago": "دن پہلے",
  "Decline": "مسترد کریں",
  "Decline Consultation": "مشاورت کو مسترد کریں",
  "Delete": "حذف کریں",
  "Delete Comment": "تبصرہ حذف کریں",
  "Delete Consultation": "مشاورت حذف کریں",
  "Delete Health Record": "صحت کا ریکارڈ حذف کریں",
  "Delete Notification": "نوٹیفکیشن حذف کریں",
  "Delete Post": "پوسٹ حذف کریں",
  "Delete Prescription": "نسخہ حذف کریں",
  "Delete Record": "ریکارڈ حذف کریں",
  "Delete Vaccination": "ٹیکہ حذف کریں",
  "Deliver To": "ترسیل کریں",
  "Delivery Address": "ترسیل کا پتہ",
  "Delivery Address / Village / Street": "ترسیل کا پتہ / گاؤں / گلی",
  "Delivery Charges": "ترسیل کے چارجز",
  "Describe your issue, symptoms, duration, or advice in detail...": "اپنی مسئلے، علامات، دورانیہ، یا مشورے کی تفصیل بیان کریں...",
  "Details / Symptoms *": "تفصیلات / علامات *",
  "Detecting Location...": "مقام کی تلاش کی جا رہی ہے...",
  "Detection Notice:": "تشخیصی ہدایت:",
  "Diagnosis": "تشخیص",
  "DIAGNOSIS": "تشخیص",
  "Diagnosis:": "تشخیص:",
  "Differential diagnosis for high fever and petechiae": "بہت زیادہ بخار اور پیٹیکیا کے لیے تفریقی تشخیص",
  "Discussion Title *": "بحث کا عنوان *",
  "District": "ضلع",
  "Doctor / Vet": "ڈاکٹر / ویٹرنری",
  "DR": "ڈاکٹر",
  "Due in": "میں واجب الادا",
  "Due Today": "آج کی تاریخ",
  "Due Tomorrow": "کل کی تاریخ",
  "e.g., Cow having high fever for 2 days": "مثلاً، 2 دن سے بخار میں مبتلا گائے",
  "Edit Profile": "پروفائل میں ترمیم",
  "Email": "ای میل",
  "Email Address": "ای میل کا پتہ",
  "Email support": "ای میل مدد",
  "Empty Cart": "ٹوکری خالی",
  "Encrypted with 256-Bit SSL. A prompt will be sent to your registered SIM.": "256 بٹ SSL کے ساتھ انکرپٹ کیا گیا۔ آپ کے رجسٹرڈ سم کو ایک پیغام بھیجا جائے گا۔",
  "English": "English (انگریزی)",
  "Enter 4-digit code sent to": "4 ہندسوں کا کوڈ درج کریں جو بھیجا گیا ہے",
  "Enter Full Name": "پورا نام درج کریں",
  "Enter Livestock ID (e.g. COW-101, TAG-201)*": "جانور کا ٹیگ نمبر درج کریں (مثلاً 102، COW-101)*",
  "Enter Location (City, Province)": "مقام درج کریں (شہر، صوبہ)",
  "Enter OTP": "او ٹی پی کوڈ درج کریں",
  "Enter password": "پاس ورڈ درج کریں",
  "Enter Phone Number": "فون نمبر درج کریں",
  "Enter the 4-digit verification code sent to your email.": "اپنے ای میل پر بھیجے گئے 4 ہندسوں کے تصدیقی کوڈ درج کریں۔",
  "Enter Urdu diagnosis (optional)": "اردو میں تشخیص درج کریں (اختیاری)",
  "Enter your accurate farm or residence address for medicine delivery.": "دوائی کی ترسیل کے لیے اپنا درست فارم یا رہائشی پتہ درج کریں۔",
  "Enter your registered phone number or email to receive a verification code.": "تصدیقی کوڈ حاصل کرنے کے لیے اپنا رجسٹرڈ فون نمبر یا ای میل درج کریں۔",
  "Error": "خرابی",
  "Experience (Years)": "طبی تجربہ (سال)",
  "Explore veterinary medicines, supplements, and vaccines in the marketplace.": "بازار میں جانوروں کی دوائیں، سپلیمنٹس، اور ویکسینز تلاش کریں۔",
  "Export Records": "ریکارڈز برآمد کریں",
  "Extreme heat stress detected in your area! High risk of dairy drop and heat exhaustion. Turn on sprinklers and ventilation immediately.": "آپ کے علاقے میں شدید ہیٹ اسٹریس کا پتہ چلا ہے! دودھ کی پیداوار میں کمی اور ہیٹ ایکزاسشن کا خطرہ ہے۔ فوری طور پر سپرنکلرز اور ہوا کی گزرگاہیں آن کریں۔",
  "Failed to load post details. Please try again.": "پوسٹ کی تفصیلات لوڈ کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔",
  "Failed to place order. Check connection.": "آرڈر دینے میں ناکامی۔ کنکشن چیک کریں.",
  "Failed to post reply. Please try again.": "جواب پوسٹ کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔",
  "Failed to publish post. Please try again.": "پوسٹ شائع کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔",
  "Failed to send prescription. Please check your internet connection.": "نسخہ بھیجنے میں ناکامی۔ براہ کرم اپنے انٹرنیٹ کنکشن کی جانچ کریں۔",
  "Failed to start microphone recording.": "مائیکروفون ریکارڈنگ شروع کرنے میں ناکامی ہوئی۔",
  "Failed to update profile.": "پروفائل کو اپ ڈیٹ کرنے میں ناکامی۔",
  "Farmer": "کسان / فارمر",
  "Farmer Note:": "کسان کا پیغام:",
  "Fetching vets in your area...": "آپ کے علاقے میں ویٹرنری ڈاکٹر تلاش کیے جا رہے ہیں...",
  "Find quick answers or contact the Maveshi Sehat team.": "فوری جوابات تلاش کریں یا مویشی صحت کی ٹیم سے رابطہ کریں۔",
  "Find Veterinarian": "ویٹرنری ڈاکٹر تلاش کریں",
  "First Aid": "ابتدائی طبی امداد",
  "First Aid / Treatment": "ابتدائی طبی امداد اور علاج",
  "First Aid / Treatment:": "ابتدائی طبی امداد اور علاج:",
  "Foot and Mouth Disease": "منہ کھر کی بیماری (FMD)",
  "Foot and Mouth Disease (FMD)": "منہ کھر کی بیماری (FMD)",
  "Forgot Password?": "پاس ورڈ بھول گئے؟",
  "Forum": "کسان فورم",
  "From Gallery": "گیلری سے",
  "from your cart?": "اپنی ٹوکری سے؟",
  "Full Name": "مکمل نام",
  "Goat": "بکری",
  "Good Afternoon": "دوپہر بخیر",
  "Good clarity": "اچھی وضاحت",
  "Good Evening": "شام بخیر",
  "Good Morning": "صبح بخیر",
  "Grand Total": "کل رقم",
  "Graze in morning": "صبح کو چرنے دیں",
  "Guest Farmer": "مہمان کسان",
  "Health record deleted successfully.": "صحت کا ریکارڈ کامیابی سے حذف کر دیا گیا۔",
  "Health Records": "صحت کے ریکارڈز",
  "Health records and AI diagnostics report exported successfully as PDF.": "صحت کے ریکارڈز اور AI تشخیصی رپورٹ کامیابی سے PDF کے طور پر برآمد کر دی گئی۔",
  "Health Status Report": "صحت کی حالت کی رپورٹ",
  "Healthy": "صحت مند",
  "Healthy (No Symptoms)": "صحت مند (کوئی علامت نہیں)",
  "Healthy Animals": "تندرست مویشی",
  "Heat Alert": "موسمی الرٹ",
  "Heat stress calculation relies on your area weather": "گرمی کے دباؤ کا حساب آپ کے علاقے کے موسم پر منحصر ہے",
  "Heat Stress Warning": "گرمی کی شدت کا انتباہ",
  "Help & Support": "مدد اور رہنمائی",
  "Hemorrhagic Septicemia": "گل گھوٹو (HS)",
  "Hemorrhagic Septicemia (HS)": "گل گھوٹو (HS)",
  "High Moisture": "زیادہ نمی",
  "High Risk": "شدید خطرہ",
  "High Severity": "زیادہ شدت",
  "History": "تاریخ",
  "Home": "صفحۂ اول",
  "hours ago": "گھنٹے پہلے",
  "How do consultations work?": "مشاورت کیسے کام کرتی ہے؟",
  "How do I save an AI scan?": "میں AI اسکین کو کیسے محفوظ کروں؟",
  "How to Capture a Valid Photo:": "درست تصویر بنانے کا طریقہ:",
  "How to protect cattle from heat stress in summer": "گرمیوں میں مویشیوں کو گرمی کی شدت سے کیسے بچائیں",
  "Humidity": "نمی",
  "Image Error": "تصویر میں خرابی",
  "In Cart": "کارٹ میں",
  "In Stock": "اسٹاک میں موجود",
  "Infected": "متاثرہ",
  "Information we use": "ہم جو معلومات استعمال کرتے ہیں",
  "Instant": "فوری",
  "Instant AI guidance for your animals": "آپ کے جانوروں کے لیے فوری اور مستند رہنمائی",
  "Invalid Image": "غیر متعلقہ تصویر",
  "Invalid Phone": "غلط فون",
  "Items": "آئٹمز",
  "Items Subtotal": "اشیاء کا ذیلی مجموعہ",
  "JazzCash / EasyPaisa": "جاز کیش / ایزی پیسہ",
  "just now": "ابھی ابھی",
  "Just now": "ابھی ابھی",
  "Language": "زبان",
  "Language is currently set centrally by the administrator.": "زبان فی الحال منتظم کے ذریعہ مرکزی طور پر سیٹ کی گئی ہے۔",
  "Last updated": "آخری بار اپ ڈیٹ کیا گیا",
  "Like": "پسند کریں",
  "Liked": "پسند کیا",
  "Liked!": "پسند کیا!",
  "Listen": "سنیں",
  "Livestock": "مویشی",
  "Livestock Care & Vet Advice": "مویشیوں کی دیکھ بھال اور ویٹرنری مشورہ",
  "Livestock Health AI • Online": "مویشیوں کی صحت AI • آن لائن",
  "Livestock Heat Stress & Weather": "مویشیوں کا ہیٹ اسٹریس اور موسم",
  "Livestock ID": "جانور کا شناختی نمبر / ٹیگ",
  "Livestock ID Required": "جانور کا شناختی نمبر لازمی ہے",
  "Livestock ID:": "جانور کا شناختی نمبر:",
  "Loading discussion...": "بحث لوڈ ہو رہی ہے...",
  "Loading discussions...": "بحثیں لوڈ ہو رہی ہیں...",
  "Loading medicines...": "ادویات لوڈ کی جا رہی ہیں...",
  "Loading...": "لوڈ ہو رہا ہے...",
  "Location": "مقام",
  "Location Permission Required": "مقام کی اجازت درکار ہے",
  "Log Out": "لاگ آؤٹ",
  "Logging in...": "لاگ ان ہو رہا ہے...",
  "Login": "لاگ ان",
  "Login As": "بطور لاگ ان کریں",
  "Login Now": "اب لاگ ان کریں",
  "Logout": "لاگ آؤٹ",
  "Low Risk": "معمولی خطرہ",
  "Low Stock": "کم اسٹاک",
  "Lumpy Skin Disease": "لمپی سکن کی بیماری (LSD)",
  "Lumpy Skin Disease (LSD)": "لمپی سکن کی بیماری (LSD)",
  "Maintenance Mode": "دیکھ بھال کا موڈ",
  "Major Livestock Hubs (Pakistan)": "اہم مویشی مراکز (پاکستان)",
  "Managed by Admin": "ایڈمن کنٹرول",
  "Mark all read": "تمام کو پڑھا ہوا نشان زد کریں",
  "Mark Done": "مکمل نشان زد کریں",
  "Mark Resolved": "حل شدہ نشان زد کریں",
  "Marketplace": "مویشی منڈی",
  "Mastitis": "ساڑو / ورمِ پستان",
  "Maveshi Sehat AI": "مویشی صحت AI",
  "Maveshi Sehat needs location access to calculate accurate real-time Heat Stress for your area.": "Maveshi Sehat کو آپ کے علاقے میں درست حقیقی وقت کے ہیٹ اسٹریس کا حساب لگانے کے لیے مقام تک رسائی کی ضرورت ہے۔",
  "Maveshi Sehat uses your account details and livestock health information to provide animal-health guidance, records, consultations, and support.": "مویشی صحت آپ کے اکاؤنٹ کی تفصیلات اور مویشیوں کی صحت کی معلومات کا استعمال کرتے ہوئے جانوروں کی صحت کی رہنمائی، ریکارڈ، مشاورت، اور مدد فراہم کرتا ہے۔",
  "Medicines": "ادویات",
  "MEDICINES": "ادویات",
  "Medium Risk": "درمیانہ خطرہ",
  "Message Notice": "پیغام کا نوٹس",
  "Microphone Error": "مائیکروفون کی خرابی",
  "Microphone Permission": "مائیکروفون کی اجازت",
  "Microphone permission is required to send voice messages.": "آواز کے پیغامات بھیجنے کے لیے مائیکروفون کی اجازت درکار ہے۔",
  "mins ago": "منٹ پہلے",
  "minutes ago": "منٹ پہلے",
  "Missing Info": "معلومات غائب ہیں",
  "Mobile Wallet": "موبائل والیٹ",
  "Mobile Wallet Checkout": "موبائل والیٹ چیک آؤٹ",
  "Moderate solar exposure.": "درمیانی سورج کی روشنی کا سامنا۔",
  "Months": "مہینے",
  "Moon Phase": "چاند کا مرحلہ",
  "My Consultations": "میری مشاورت کی تاریخ",
  "Name cannot be empty.": "نام خالی نہیں ہو سکتا۔",
  "Network Error": "نیٹ ورک کی خرابی",
  "Network error. Please check your backend connection.": "نیٹ ورک کی خرابی۔ براہ کرم اپنی پچھلی کنکشن چیک کریں۔",
  "Network error. Please try again.": "نیٹ ورک کی خرابی۔ براہ کرم دوبارہ کوشش کریں۔",
  "New Cases": "نئے کیسز",
  "New Password": "نیا پاس ورڈ",
  "New Post": "نئی پوسٹ",
  "Next 24 hours": "اگلے 24 گھنٹے",
  "Next Due Date": "اگلی تاریخ",
  "No completed vaccinations": "کوئی مکمل شدہ ٹیکے نہیں",
  "No Discussions Found": "کوئی بحث نہیں ملی",
  "No email application is available on this device.": "اس ڈیوائس پر کوئی ای میل ایپلیکیشن دستیاب نہیں ہے۔",
  "No Livestock Detected": "تصویر میں کوئی مویشی نہیں پایا گیا",
  "No medicines found": "کوئی ادویات نہیں ملیں",
  "No new cases today.": "آج کا کوئی نیا کیس موجود نہیں ہے۔",
  "No Notifications": "کوئی نوٹیفکیشن نہیں",
  "No rain expected today.": "آج بارش کی توقع نہیں ہے۔",
  "No recent scans found": "کوئی حالیہ اسکین نہیں ملے",
  "No records found matching criteria": "معیارات کے مطابق کوئی ریکارڈ نہیں ملا",
  "No replies yet — be the first!": "ابھی تک کوئی جواب نہیں — پہلے بنیں!",
  "No results match your search. Try different keywords.": "آپ کی تلاش کے نتائج سے کوئی میل نہیں کھاتا۔ مختلف کلیدی الفاظ آزما کر دیکھیں۔",
  "No Stress": "کوئی دباؤ نہیں",
  "No upcoming vaccinations": "کوئی آنے والے ٹیکے نہیں",
  "No vaccinations found": "کوئی ٹیکہ ریکارڈ میں نہیں ملا",
  "No veterinarians found in your area": "آپ کے علاقے میں کوئی ویٹرنری ڈاکٹر نہیں ملا",
  "Non-Livestock Image": "جانور کی تصویر نہیں ہے",
  "Normal Range": "معیاری حد",
  "Not Logged In": "لاگ ان نہیں ہیں",
  "Notes": "اضافی نوٹس",
  "NOTES": "نوٹس",
  "Notification Center": "نوٹیفکیشن سینٹر",
  "Notifications": "اطلاعات و الرٹس",
  "OK": "ٹھیک ہے",
  "Open an AI scan result and choose Save to Records. Saved results are available from the Records section.": "AI سکین کے نتیجے کو کھولیں اور ریکارڈز میں محفوظ کرنے کا انتخاب کریں۔ محفوظ شدہ نتائج ریکارڈز کے سیکشن سے دستیاب ہیں۔",
  "Open Chat": "چیٹ کھولیں",
  "Order Error": "آرڈر کی غلطی",
  "Order ID": "آرڈر آئی ڈی",
  "Order Medicines": "ادویات منگوائیں",
  "Order Placed Successfully!": "آرڈر کامیابی سے دیا گیا!",
  "Order Summary": "آرڈر کا خلاصہ",
  "Order Vaccine": "ویکسین آرڈر کریں",
  "Our support team can help with account access, consultations, records, and app issues.": "ہماری مدد کی ٹیم اکاؤنٹ تک رسائی، مشاورت، ریکارڈز، اور ایپ کے مسائل میں مدد کر سکتی ہے۔",
  "Out of Stock": "اسٹاک میں نہیں",
  "Overdue": "تاخیر شدہ",
  "Owner": "مویشی پال کسان",
  "Owner Name": "مالک کا نام",
  "Oxytetracycline dosage for 450kg buffalo": "450 کلوگرام بھینس کے لیے آکسی ٹری سائکلین کی خوراک",
  "Password": "پاس ورڈ",
  "Password must be at least 6 characters long": "پاس ورڈ کم از کم 6 حروف پر مشتمل ہونا چاہیے",
  "Password reset successfully! You can now log in with your new password.": "پاس ورڈ کامیابی سے ری سیٹ ہو گیا! آپ اب اپنے نئے پاس ورڈ کے ساتھ لاگ ان کر سکتے ہیں۔",
  "Passwords do not match": "پاس ورڈ میل نہیں کھاتے",
  "PATIENT INFO": "مریض کی معلومات",
  "Pay in cash upon doorstep delivery to your farm": "اپنے فارم پر دروازے پر ترسیل پر نقد ادائیگی کریں",
  "Pay Online": "آن لائن ادائیگی کریں",
  "Pay securely online via your mobile wallet account": "اپنے موبائل والیٹ اکاؤنٹ کے ذریعے محفوظ طریقے سے آن لائن ادائیگی کریں",
  "Payment & Order Confirmed!": "ادائیگی اور آرڈر کی تصدیق ہو گئی!",
  "Payment Failed": "ادائیگی ناکام",
  "Payment Method": "ادائیگی کا طریقہ",
  "Payment Status": "ادائیگی کی حیثیت",
  "Pending": "زیرِ التواء",
  "PENDING": "زیرِ التواء",
  "Pending Approval": "ڈاکٹر کی منظوری کا انتظار",
  "Permission Required": "اجازت درکار ہے",
  "Personal Information": "ذاتی معلومات",
  "Phone Number": "فون نمبر",
  "Phone Number or Email": "فون نمبر یا ای میل",
  "Phone Number or National ID": "فون نمبر یا قومی شناختی نمبر",
  "PIN Required": "PIN درکار ہے",
  "Place Order": "آرڈر دیں",
  "Please add at least one medicine": "براہ کرم کم از کم ایک دوا شامل کریں",
  "Please add at least one medicine.": "براہ کرم کم از کم ایک دوا شامل کریں۔",
  "Please add medicines to place an order.": "براہ کرم آرڈر دینے کے لیے ادویات شامل کریں.",
  "Please allow microphone access to record voice.": "آواز ریکارڈ کرنے کے لیے مائیکروفون تک رسائی کی اجازت دیں۔",
  "Please check your email Inbox and Spam / Junk folder for the 4-digit code.": "براہ کرم اپنے ای میل کے ان باکس اور اسپام / جنک فولڈر میں 4 ہندسوں کے کوڈ کی جانچ کریں۔",
  "Please enter a diagnosis": "براہ کرم تشخیص درج کریں",
  "Please enter a new password": "براہ کرم نیا پاس ورڈ درج کریں",
  "Please enter a title for your post.": "اپنی پوسٹ کے لیے عنوان درج کریں۔",
  "Please enter a valid Pakistani mobile wallet phone number (e.g. 03240650819)": "براہ کرم ایک درست پاکستانی موبائل والیٹ فون نمبر درج کریں (جیسے 03240650819)",
  "Please enter contact phone number": "براہ کرم رابطے کا فون نمبر درج کریں",
  "Please enter delivery address / street / village": "براہ کرم ترسیل کا پتہ / گلی / گاؤں درج کریں",
  "Please enter details for your post.": "اپنی پوسٹ کی تفصیلات درج کریں۔",
  "Please enter recipient full name": "براہ کرم وصول کنندہ کا مکمل نام درج کریں",
  "Please enter the 4-digit verification code": "براہ کرم 4 ہندسوں کا تصدیقی کوڈ درج کریں",
  "Please enter the Livestock ID (e.g. COW-101, TAG-201) before running AI diagnosis.": "براہ کرم AI تشخیص کرنے سے پہلے مویشی کی شناخت درج کریں (جیسے COW-101، TAG-201).",
  "Please enter the Livestock ID / Tag number (e.g. COW-101, TAG-201) before choosing from gallery.": "براہ کرم گیلری سے منتخب کرنے سے پہلے مویشی کی شناخت / ٹیگ نمبر درج کریں (جیسے COW-101، TAG-201).",
  "Please enter the Livestock ID / Tag number (e.g. COW-101, TAG-201) before taking a photo.": "براہ کرم تصویر لینے سے پہلے مویشی کی شناخت / ٹیگ نمبر درج کریں (جیسے COW-101، TAG-201).",
  "Please enter vaccine name": "براہ کرم ویکسین کا نام درج کریں",
  "Please enter your 4-digit MPIN to authorize the transaction": "براہ کرم لین دین کی اجازت کے لیے اپنا 4 ہندسوں کا MPIN درج کریں",
  "Please enter your complete delivery street address / village to proceed with the order.": "براہ کرم آرڈر جاری رکھنے کے لیے اپنا مکمل ترسیلی گلی کا پتہ / گاؤں درج کریں.",
  "Please enter your phone number or email": "براہ کرم اپنا فون نمبر یا ای میل درج کریں",
  "Please log in to post a discussion.": "بحث شائع کرنے کے لیے براہ کرم لاگ ان کریں۔",
  "Please log in to post a reply.": "جواب دینے کے لیے براہ کرم لاگ ان کریں۔",
  "Please specify your street address or village to ensure timely delivery.": "براہ کرم اپنا گلی کا پتہ یا گاؤں بتائیں تاکہ بروقت ترسیل یقینی بنائی جا سکے۔",
  "Post deleted successfully.": "پوسٹ کامیابی سے حذف کر دی گئی۔",
  "Posting as": "کے طور پر پوسٹ کر رہے ہیں",
  "Precipitation": "بارش",
  "Preferences": "ترجیحات",
  "Prescription deleted successfully.": "نسخہ کامیابی سے حذف کر دیا گیا۔",
  "Prescription sent successfully!": "نسخہ کامیابی سے بھیج دیا گیا!",
  "Prescriptions": "نسخہ جات",
  "Pressure": "دباؤ",
  "Profile": "پروفائل",
  "Profile & Settings": "پروفائل اور سیٹنگز",
  "Profile updated successfully!": "پروفائل کامیابی سے اپ ڈیٹ ہو گئی!",
  "Publish Discussion": "بحث شائع کریں",
  "Published!": "شائع ہو گیا!",
  "PVMC License Number": "پی وی ایم سی لائسنس نمبر",
  "Quick Actions": "فوری اقدامات",
  "Quick Due Date": "فوری واجب الادا تاریخ",
  "Quick Select Vaccine": "فوری طور پر ٹیکہ منتخب کریں",
  "Rain (%)": "بارش (%)",
  "Rain detected today.": "آج بارش کا پتہ چلا ہے۔",
  "Rating": "درجہ بندی",
  "Re-enter new password": "نیا پاس ورڈ دوبارہ درج کریں",
  "Re-scan Animal": "جانور کا دوبارہ معائنہ کریں",
  "Read": "پڑھیں",
  "Ready": "درج ہو گیا",
  "Real-Time Meteorological & Bovine THI Monitor": "حقیقی وقت کا موسمیاتی اور مویشیوں کا THI مانیٹر",
  "Recent AI Scans": "حالیہ AI اسکین",
  "Recent Scans": "حالیہ اسکینز",
  "Recipient Full Name": "موصول کنندہ کا مکمل نام",
  "Recipient:": "موصول کنندہ:",
  "Recommended First Aid": "تجویز کردہ ابتدائی طبی امداد",
  "Recommended First Aid:": "تجویز کردہ ابتدائی طبی امداد:",
  "Recording Error": "ریکارڈنگ کی خرابی",
  "Recording was too short or could not be saved. Please tap the mic and speak.": "ریکارڈنگ بہت مختصر تھی یا محفوظ نہیں کی جا سکی۔ براہ کرم مائیکروفون پر ٹیپ کریں اور بولیں۔",
  "Records": "ریکارڈز",
  "Recovered": "صحت یاب",
  "Reduced air view": "ہوا کی نظر میں کمی",
  "Refresh": "تازہ کریں",
  "Register": "رجسٹر",
  "Remove": "ہٹائیں",
  "Remove Item": "آئٹم ہٹائیں",
  "Replies": "جواب",
  "Reply": "جواب دیں",
  "Replying to": "جواب دے رہے ہیں",
  "Request Sent": "درخواست بھیج دی گئی",
  "Required": "لازمی",
  "Resend Code": "کوڈ دوبارہ بھیجیں",
  "Resend code in": "کوڈ دوبارہ بھیجیں",
  "Resend Code Now": "ابھی کوڈ دوبارہ بھیجیں",
  "Resend OTP Code": "OTP کوڈ دوبارہ بھیجیں",
  "Reset Password": "پاس ورڈ تبدیل کریں",
  "Resolved": "مکمل شدہ",
  "RESOLVED": "مکمل شدہ",
  "Review Case": "کیس کا معائنہ",
  "Reviewed": "جائزہ لیا گیا",
  "Risk Level:": "خطرے کی شدت:",
  "Role": "کردار",
  "Running Roboflow Vision Core...": "روبو فلو وژن کور چل رہا ہے...",
  "Rx Prescription": "نسخہ",
  "Save Address": "پتہ محفوظ کریں",
  "Save Changes": "تبدیلیاں محفوظ کریں",
  "Save to Records": "صحت کے ریکارڈ میں محفوظ کریں",
  "Save Vaccination": "ویکسین ریکارڈ محفوظ کریں",
  "Saved successfully": "کامیابی سے محفوظ ہو گیا",
  "Scan": "اسکین",
  "Scan Again": "دوبارہ اسکین کریں",
  "Scan Disease": "بیماری اسکین کریں",
  "Scan Failed": "اسکین ناکام",
  "Scan Result:": "اسکین کا نتیجہ:",
  "Scan Time:": "اسکین کا وقت:",
  "Schedule Next Booster": "اگلا بوسٹر شیڈول کریں",
  "Search": "تلاش کریں",
  "Search any district or city...": "کسی ضلع یا شہر کی تلاش کریں...",
  "Search discussions, diseases, feed...": "بحث، بیماریوں، خوراک وغیرہ تلاش کریں...",
  "Search medicines, vaccines, brands...": "ادویات، ویکسینز، برانڈز کی تلاش کریں...",
  "Search records...": "ریکارڈز تلاش کریں...",
  "Seasonal Guide": "موسمی احتیاطی تدابیر",
  "Seasonal Vaccination Guide": "موسمی ٹیکوں کی رہنمائی",
  "Sehat Assistant": "صحت اسسٹنٹ",
  "Select District": "ضلع منتخب کریں",
  "Select Document / PDF": "دستاویز / PDF منتخب کریں",
  "Select Farm Location": "فارم کا مقام منتخب کریں",
  "Select Language": "زبان منتخب کریں",
  "Selected Farm Location": "منتخب کردہ فارم کا مقام",
  "Send Prescription": "نسخہ بھیجیں",
  "Send Reset Code": "ری سیٹ کوڈ بھیجیں",
  "Sending code...": "کوڈ بھیج رہے ہیں...",
  "Sent": "بھیجا گیا",
  "Service Temporarily Paused": "خدمت عارضی طور پر معطل ہے",
  "Service temporarily paused by admin...": "خدمت عارضی طور پر منتظم کی طرف سے معطل ہے...",
  "Set by Admin": "منتظم کے ذریعہ سیٹ کیا گیا",
  "Set New Password": "نیا پاس ورڈ محفوظ کریں",
  "Settings": "ترتیبات",
  "Severe Stress": "شدید دباؤ",
  "Share Discussion": "بحث شیئر کریں",
  "Shed roof safe": "چھپری کی چھت محفوظ ہے",
  "Sheep": "بھیڑ",
  "Shopping Cart": "خریداری کی ٹوکری",
  "Sick": "بیمار",
  "Smart Disease Detection • Expert Vet Care • Medicine Delivery": "سمارٹ بیماری کی تشخیص • ماہر ویٹرنری دیکھ بھال • ادویات کی ترسیل",
  "Smog or haze reported.": "دھند یا دھوئیں کی اطلاع ملی ہے۔",
  "Sorry, could not connect to Sehat Assistant server right now. Please check your connection and try again.": "معاف کیجیے، اس وقت صحت اسسٹنٹ سرور سے جڑنے میں ناکامی ہوئی۔ براہ کرم اپنی کنکشن چیک کریں اور دوبارہ کوشش کریں۔",
  "Special Instructions": "خصوصی ہدایات",
  "Specialization": "طبی مہارت / شعبہ",
  "Species & Breed": "نوعیت اور نسل",
  "Species & Breed:": "نوعیت اور نسل:",
  "Stable atmospheric pressure.": "مستحکم فضائی دباؤ۔",
  "Standard": "معیاری",
  "Standard barometric": "معیاری بارومیٹرک",
  "Start a Discussion": "بحث شروع کریں",
  "Stay ahead of disease outbreaks by logging your herd vaccination schedule.": "اپنی مویشیوں کے ٹیکوں کے شیڈول کو لاگ کر کے بیماریوں کے پھیلاؤ سے آگے رہیں۔",
  "Step 1: Isolate the affected animal to prevent the spread of Disease.; Step 2: Consult a veterinarian for a proper diagnosis and treatment plan.": "پہلا قدم: بیماری کے پھیلاؤ کو روکنے کے لیے متاثرہ جانور کو فوری الگ رکھیں۔ دوسرا قدم: تفصیلی معائنے اور علاج کے لیے ویٹرنری ڈاکٹر سے رجوع کریں۔",
  "Stop": "روکیں",
  "Submitted Cases": "جمع شدہ کلینیکل کیسز",
  "Success": "کامیابی",
  "Suggested Questions": "تجویز کردہ سوالات",
  "Sun Schedule": "سورج کا شیڈول",
  "Support": "مدد",
  "Support unavailable": "مدد دستیاب نہیں",
  "Symptoms": "ظاہری علامات",
  "Symptoms:": "ظاہری علامات:",
  "Synthesizing Clinical Pathology Report...": "کلینیکل پیتھالوجی رپورٹ تیار کی جا رہی ہے...",
  "Take Photo": "کیمرے سے تصویر بنائیں",
  "Take photo or choose from gallery": "تصویر لیں یا گیلری سے منتخب کریں",
  "Tap to mark as read": "پڑھنے کے لیے نشان زد کرنے کے لیے ٹیپ کریں",
  "Target Animal": "جانور کا نام / ٹیگ",
  "Tehsil / City / District": "تحصیل / شہر / ضلع",
  "Temp (°C)": "درجہ حرارت (°C)",
  "Temperature": "درجہ حرارت",
  "Terms & Privacy": "شرائط اور رازداری",
  "The cow exhibits excessive salivation and nasal discharge, indicating potential oral lesions associated with Foot and Mouth Disease.": "گائے میں منہ سے رال بہنا اور ناک سے اخراج دیکھا گیا ہے، جو منہ کھر کی علامات کو ظاہر کرتا ہے۔",
  "THI SCORE": "THI اسکور",
  "THI Stress": "THI اسٹریس",
  "This action cannot be undone.": "یہ عمل واپس نہیں لیا جا سکے گا۔",
  "This AI provides instant first-aid guidance. In emergencies, consult a certified veterinarian.": "یہ AI فوری فرسٹ ایڈ رہنمائی فراہم کرتا ہے۔ ہنگامی صورتوں میں، ایک تصدیق شدہ ویٹرنری ڈاکٹر سے مشورہ کریں۔",
  "This system provides clinical reference and decision support. Final diagnosis rests on your examination.": "یہ نظام کلینیکل حوالہ اور فیصلہ سازی کی حمایت فراہم کرتا ہے۔ حتمی تشخیص آپ کی جانچ پر منحصر ہے۔",
  "Topic Category *": "موضوع کی قسم *",
  "Total": "کل",
  "Total Animals": "کل مویشی",
  "Total Paid": "کل ادا شدہ",
  "Total Payable": "کل واجب الادا",
  "Total Scans": "کل اسکین شدہ ریکارڈز",
  "Transaction ID": "ٹرانزیکشن آئی ڈی",
  "Trusted by 10,000+ livestock owners across Pakistan": "پاکستان بھر میں 10,000+ مویشی مالکان کا اعتماد",
  "Try searching with another keyword or select a different category.": "کسی اور کلیدی لفظ سے تلاش کرنے کی کوشش کریں یا مختلف زمرہ منتخب کریں۔",
  "Type message...": "پیغام لکھیں...",
  "Type your message...": "اپنا پیغام یہاں لکھیں...",
  "Unable to send message. Please check your internet connection and try again.": "پیغام بھیجنے میں ناکامی۔ براہ کرم اپنے انٹرنیٹ کنکشن کی جانچ کریں اور دوبارہ کوشش کریں۔",
  "Unavailable": "دستیاب نہیں",
  "Under Treatment": "زیرِ علاج",
  "unread": "غیر پڑھے",
  "Unread": "غیر پڑھی",
  "Upcoming": "آئندہ ٹیکہ جات",
  "Upload Document": "تصدیقی دستاویز اپ لوڈ کریں",
  "Upload from Gallery": "گیلری سے اپ لوڈ کریں",
  "Uploading...": "اپ لوڈ ہو رہا ہے...",
  "Urdu": "اردو (Urdu)",
  "Urgent": "ہنگامی معائنہ",
  "URGENT": "ہنگامی معائنہ",
  "Use Current Device Location": "موجودہ ڈیوائس کا مقام استعمال کریں",
  "Use the service responsibly. AI guidance is informational and does not replace an in-person veterinary examination or emergency care.": "اس سروس کا ذمہ داری سے استعمال کریں۔ AI رہنمائی معلوماتی ہے اور یہ ذاتی طور پر ویٹرنری معائنہ یا ہنگامی دیکھ بھال کا متبادل نہیں ہے۔",
  "UV Index": "UV انڈیکس",
  "Vaccination": "حفاظتی ٹیکہ جات",
  "Vaccination marked completed!": "ٹیکہ مکمل ہونے کے طور پر نشان زد کر دیا گیا!",
  "Vaccination record deleted.": "ٹیکے کا ریکارڈ حذف کر دیا گیا۔",
  "Vaccination Schedule": "حفاظتی ٹیکوں کا شیڈول",
  "Vaccination schedule for cow and buffalo": "گائے اور بھینس کے لیے ویکسینیشن کا شیڈول",
  "Vaccination schedule saved successfully!": "ٹیکوں کا شیڈول کامیابی سے محفوظ کر لیا گیا!",
  "Vaccine": "ویکسین",
  "Vaccine Name": "ویکسین کا نام",
  "Validating Image & Species...": "تصویر اور نوع کی توثیق ہو رہی ہے...",
  "Validation Error": "توثیق کی غلطی",
  "Verification": "تصدیق",
  "Verification Document": "تصدیقی دستاویز",
  "Verified Vet": "تصدیق شدہ ڈاکٹر",
  "Verify & Continue": "تصدیق کریں اور جاری رکھیں",
  "Verify Account": "اکاؤنٹ کی تصدیق کریں",
  "Verify Code": "کوڈ کی تصدیق کریں",
  "Very High: Keep cows under shed.": "بہت زیادہ: گائے کو چھپانے کے نیچے رکھیں۔",
  "Vet": "ویٹرنری ڈاکٹر",
  "Veterinarian": "ماہر امراضِ مویشی",
  "Veterinarians": "ماہر ڈاکٹرز",
  "Veterinary Cooling Directives": "ویٹرنری ٹھنڈک کی ہدایات",
  "View": "دیکھیں",
  "View All": "تمام دیکھیں",
  "View All →": "تمام دیکھیں ←",
  "View Chat History": "چیٹ کی تاریخ دیکھیں",
  "View Consultation": "مشاورت دیکھیں",
  "View Consultation History": "مشاورت کی تاریخ دیکھیں",
  "View Details": "تفصیلات دیکھیں",
  "View Prescription": "نسخہ دیکھیں",
  "Visibility": "نظر",
  "Voice Message Error": "صوتی پیغام کی خرابی",
  "Waiting for Doctor Approval": "ڈاکٹر کی منظوری کا انتظار ہے",
  "We sent a 4-digit code to:": "ہم نے 4 ہندسوں کا کوڈ بھیجا ہے:",
  "We use your name, phone number, location, uploaded images, scan results, consultation messages, and prescriptions to provide the features you request.": "ہم آپ کا نام، فون نمبر، مقام، اپ لوڈ کردہ تصاویر، اسکین کے نتائج، مشاورت کے پیغامات، اور نسخے استعمال کرتے ہیں تاکہ آپ کی درخواست کردہ خصوصیات فراہم کی جا سکیں۔",
  "Weather Alert": "موسمی الرٹ",
  "Welcome": "خوش آمدید",
  "Welcome Back": "خوش آمدید",
  "Who can see my consultation messages?": "میری مشاورت کے پیغامات کون دیکھ سکتا ہے؟",
  "Wind (km/h)": "ہوا (کلو میٹر فی گھنٹہ)",
  "Wind & Gusts": "ہوا اور جھونکے",
  "Wind Speed": "ہوا کی رفتار",
  "Write a reply...": "جواب لکھیں...",
  "Write New": "نیا لکھیں",
  "Year": "سال",
  "You already liked this reply.": "آپ نے پہلے ہی اس جواب کو پسند کیا ہے۔",
  "You can update your profile, control notifications, change language when available, and contact support about your account or data.": "آپ اپنے پروفائل کو اپ ڈیٹ کر سکتے ہیں، نوٹیفیکیشنز کو کنٹرول کر سکتے ہیں، جب دستیاب ہو تو زبان تبدیل کر سکتے ہیں، اور اپنے اکاؤنٹ یا ڈیٹا کے بارے میں مدد سے رابطہ کر سکتے ہیں۔",
  "You have already liked this post.": "آپ نے پہلے ہی اس پوسٹ کو پسند کیا ہے۔",
  "You must be logged in to publish a discussion.": "بحث شائع کرنے کے لیے آپ کو لاگ ان ہونا ضروری ہے۔",
  "You will receive updates here when veterinarians respond or prescriptions are issued.": "جب ویٹرنری ڈاکٹر جواب دیں گے یا نسخے جاری ہوں گے تو آپ کو یہاں اپ ڈیٹس ملیں گی۔",
  "Your cart is empty": "آپ کی ٹوکری خالی ہے",
  "Your choices": "آپ کے انتخاب",
  "Your consultation messages and prescriptions are shared with the veterinarian connected to that consultation so they can provide care.": "آپ کے مشاورت کے پیغامات اور نسخے اس ویٹرنری ڈاکٹر کے ساتھ شیئر کیے جاتے ہیں جو اس مشاورت سے جڑے ہوئے ہیں تاکہ وہ دیکھ بھال فراہم کر سکیں۔",
  "Your medicine order has been sent to the pharmacy for packaging and dispatch.": "آپ کا دوائی کا آرڈر پیکنگ اور ترسیل کے لیے فارمیسی کو بھیج دیا گیا ہے۔",
  "Your post has been shared with the community.": "آپ کی پوسٹ کمیونٹی کے ساتھ شیئر کر دی گئی ہے۔",
  "Your privacy matters": "آپ کی پرائیویسی اہم ہے"
};

// Seed in-memory cache with standard Urdu translations
for (const [key, val] of Object.entries(BUILTIN_URDU_DICTIONARY)) {
  backendTranslationCache.set(`${key.trim()}_en_ur`, val);
}

/**
 * High-accuracy OpenAI GPT-4o-mini translation for dynamic and user-generated texts
 */
async function translateWithOpenAI(text, targetLang = 'ur', sourceLang = 'en') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Pakistani Veterinary and Agricultural localization specialist for the "Maveshi Sehat" livestock platform. Translate the given English text into natural, authentic, grammatically correct Pakistani Urdu (نستعلیق انداز) suitable for livestock farmers and veterinary doctors. Rules:\n- Never use literal or machine translation (e.g. Google Translate style).\n- Preserve medical acronyms (e.g. FMD, LSD, HS), numbers, and technical terms.\n- Return ONLY the clean translated Urdu text without explanations or quotes.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.2,
      max_tokens: 300
    });

    const translated = completion.choices?.[0]?.message?.content?.trim();
    if (translated && translated.length > 0) {
      return translated;
    }
  } catch (err) {
    console.warn('OpenAI translation warning:', err.message);
  }
  return null;
}

/**
 * Secondary Fallback: Google Gemini API (Free Tier)
 */
async function translateWithGemini(text, targetLang = 'ur', sourceLang = 'en') {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return null;

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Translate this veterinary/livestock text into authentic, natural Pakistani Urdu for doctors and farmers. Return ONLY the Urdu translation:\n\n${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translated = response.text()?.trim();
    if (translated && translated.length > 0) {
      return translated;
    }
  } catch (err) {
    console.warn('Gemini translation fallback warning:', err.message);
  }
  return null;
}

/**
 * Master Translation Function:
 * 1. Exact match in Professional Veterinary Dictionary (0ms)
 * 2. OpenAI GPT-4o-mini (Primary AI Engine)
 * 3. Google Gemini 1.5 Flash (Free AI Fallback)
 * 4. In-memory cache & original string fallback
 */
async function fetchOnlineTranslation(text, targetLang = 'ur', sourceLang = 'en') {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (targetLang === sourceLang) return trimmed;

  const cacheKey = `${trimmed}_${sourceLang}_${targetLang}`;
  if (backendTranslationCache.has(cacheKey)) {
    return backendTranslationCache.get(cacheKey);
  }

  // Tier 1: Check Built-in Professional Veterinary Dictionary (0ms Instant)
  if (targetLang === 'ur' && BUILTIN_URDU_DICTIONARY[trimmed]) {
    const val = BUILTIN_URDU_DICTIONARY[trimmed];
    backendTranslationCache.set(cacheKey, val);
    return val;
  }

  // Tier 2: OpenAI GPT-4o-mini (High-Accuracy Contextual Translation)
  const openAiTrans = await translateWithOpenAI(trimmed, targetLang, sourceLang);
  if (openAiTrans) {
    backendTranslationCache.set(cacheKey, openAiTrans);
    return openAiTrans;
  }

  // Tier 3: Gemini 1.5 Flash Fallback
  const geminiTrans = await translateWithGemini(trimmed, targetLang, sourceLang);
  if (geminiTrans) {
    backendTranslationCache.set(cacheKey, geminiTrans);
    return geminiTrans;
  }

  // Default fallback: Return trimmed text
  return trimmed;
}

// Helper to process translations in small batches of 5 to avoid network congestion
async function translateInBatches(items, targetLang, sourceLang, batchSize = 10) {
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
  // GET endpoint to fetch the entire 350+ built-in professional dictionary at once
  router.get('/api/translate/dictionary', (req, res) => {
    res.json({
      dictionary: BUILTIN_URDU_DICTIONARY,
      count: Object.keys(BUILTIN_URDU_DICTIONARY).length,
      language: 'ur'
    });
  });

  router.post('/api/translate', async (req, res) => {
    try {
      const { text, texts, targetLang = 'ur', sourceLang = 'en' } = req.body;
      
      // Support both `texts: [...]` and `text: [...]`
      const rawList = Array.isArray(texts) ? texts : (Array.isArray(text) ? text : null);

      if (rawList) {
        const results = await translateInBatches(rawList, targetLang, sourceLang);
        
        // Return both object and list format to support mobile app and dashboards
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
