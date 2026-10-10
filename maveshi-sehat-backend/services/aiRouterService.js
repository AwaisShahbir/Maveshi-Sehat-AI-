const { chatWithGemini } = require('./geminiService');
const { chatWithGroq } = require('./groqService');
const { getSystemPrompt } = require('../config/systemPrompt');

/**
 * Detects the language mode of the user's message:
 * - 'ur_script': Contains Arabic/Urdu unicode characters
 * - 'roman_urdu': Contains Romanized Urdu vocabulary written in Latin alphabet
 * - 'en': Standard English query
 */
const detectUserLanguage = (text) => {
  if (!text || typeof text !== 'string') return 'en';

  // 1. Urdu Script
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ur_script';
  }

  // 2. Normalize and check for Roman Urdu words
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);

  const romanUrduKeywords = new Set([
    'hai', 'hain', 'ho', 'hoon', 'hun', 'kya', 'kyu', 'kyun', 'kaise', 'kaisa', 'kesi', 'kesa',
    'meri', 'mera', 'mere', 'gaye', 'gay', 'gai', 'bhains', 'bakri', 'bakra', 'janwar', 'janwaron',
    'ilaj', 'ilaaj', 'dawa', 'dawai', 'dawaiyan', 'doctor', 'daktar', 'bukhar', 'doodh', 'dudh',
    'kahan', 'kidhar', 'pe', 'par', 'ko', 'ka', 'ki', 'ke', 'nahi', 'nhi', 'na', 'mat',
    'btao', 'batao', 'btaen', 'bataen', 'btain', 'batayein', 'btaiye', 'kar', 'karo', 'krein',
    'kren', 'krain', 'karein', 'dein', 'den', 'dain', 'do', 'app', 'ap', 'aap', 'gaa', 'gi', 'ge',
    'wala', 'wali', 'wale', 'bohat', 'boht', 'bht', 'theek', 'thik', 'thek', 'khana', 'chara',
    'chaara', 'pani', 'masla', 'maslay', 'bimari', 'beemari', 'bimariyan', 'dard', 'pait', 'pet',
    'zakhmi', 'zakham', 'khansi', 'motay', 'moti', 'kam', 'ziyada', 'zyada', 'kitna', 'kitni',
    'kab', 'kabse', 'abhi', 'aj', 'aaj', 'kal', 'subah', 'sham', 'raat', 'bacha', 'bache', 'wazan',
    'teeka', 'teekay', 'tika', 'rabta', 'rabtah', 'karna', 'karni', 'kisi', 'kisko', 'sab', 'kuch',
    'salam', 'assalam', 'walaikum', 'shukriya', 'meherbani'
  ]);

  let romanUrduMatches = 0;
  for (const w of words) {
    if (romanUrduKeywords.has(w)) {
      romanUrduMatches++;
    }
  }

  if (romanUrduMatches >= 1) {
    return 'roman_urdu';
  }

  return 'en';
};

/**
 * Deterministic Domain Guardrail:
 * Checks whether user query is unambiguously outside livestock/Maveshi Sehat scope.
 */
const checkDomainBoundary = (message) => {
  if (!message || typeof message !== 'string') return { allowed: true };
  const lower = message.toLowerCase().trim();

  // 0. Strict Data Privacy & Internal Metrics Guardrail
  const metricsPatterns = [
    /\b(how many|how much|total|kitne|kitnay)\s+.*(vet|vets|doctor|doctors|daktar|users|registered|accounts|platefrom|platform)\b/,
    /\b(list of|all)\s+(vets|doctors|users|registered)\b/,
    /\b(registered\s+(vet|vets|doctor|doctors|users))\s+(count|number|details|list)\b/,
    /\b(phone number|contact number|pvmc number|credentials|personal details)\b/
  ];

  if (metricsPatterns.some(pattern => pattern.test(lower))) {
    const lang = detectUserLanguage(message);
    let refusalText = '';
    if (lang === 'ur_script') {
      refusalText = 'مویشی صحت AI کی ڈیٹا پرائیویسی اور سیکیورٹی پالیسی کے مطابق پلیٹ فارم کے اندرونی اعداد و شمار اور رجسٹریشن کی تفصیلات خفیہ ہیں۔ میں مویشیوں کی صحت، کلینیکل معاونت اور ادویات کی خوراک کے لیے حاضر ہوں۔';
    } else if (lang === 'roman_urdu') {
      refusalText = 'Maveshi Sehat AI ki privacy aur security policy ke mutabiq platform ke internal statistics aur registry counts confidential (raazdari) hain. Main aap ki livestock aur clinical guidance ke liye hazir hoon.';
    } else {
      refusalText = 'As per Maveshi Sehat AI data privacy and security policy, internal platform metrics, database statistics, and registered user counts are strictly confidential. I am here to assist you with livestock healthcare and clinical guidance.';
    }
    return { allowed: false, refusalText };
  }

  // Allow livestock & Maveshi Sehat keywords regardless of other words
  const livestockTerms = [
    'cow', 'cattle', 'buffalo', 'gaye', 'gai', 'gay', 'bhains', 'bhens', 'bhense', 'janwar',
    'livestock', 'doodh', 'milk', 'bachra', 'bachiya', 'katta', 'katti', 'calf', 'calves',
    'mastitis', 'saaro', 'saadu', 'saado', 'lumpy', 'lsd', 'fmd', 'munh khur', 'khur', 'gal ghotu',
    'hs', 'black quarter', 'choria', 'thi', 'heat stress', 'vaccin', 'teeka', 'tika', 'fodder',
    'chara', 'silage', 'wanda', 'pvmc', 'vet', 'doctor', 'daktar', 'maveshi', 'sehat', 'shefa',
    'heifer', 'bull', 'ox', 'calving', 'ruminant', 'deworm', 'udder', 'teat', 'rumen', 'bloat',
    'prolapse', 'ketosis', 'milk fever', 'downer', 'estrus', 'ai straw', 'semen'
  ];

  const hasLivestockContext = livestockTerms.some(term => lower.includes(term));
  if (hasLivestockContext) {
    return { allowed: true };
  }

  // Greetings, capability checks, or short conversational pleasantries are permitted
  const pleasantries = ['hi', 'hello', 'salam', 'assalam', 'aoa', 'kya haal', 'how are you', 'roman', 'urdu', 'english', 'help', 'madad'];
  const isShortGreeting = pleasantries.some(p => lower.includes(p)) && lower.split(/\s+/).length <= 6;
  if (isShortGreeting) {
    return { allowed: true };
  }

  // Unambiguous out-of-domain patterns
  const bannedPatterns = [
    /\b(python|javascript|coding|react|java|c\+\+|html|css|sql|function|algorithm|programming)\b/,
    /\b(politics|imran khan|nawaz sharif|election|parliament|pti|pmln|biden|trump|modi)\b/,
    /\b(cricket|psl|ipl|babar azam|football|fifa|messi|ronaldo|match score|world cup)\b/,
    /\b(movie|film|actor|actress|cinema|drama|song|music|netflix)\b/,
    /\b(recipe|biryani|pizza|burger|chai|paratha|salan|cooking for human)\b/,
    /\b(human disease|sar dard|headache|cough in human|corona in human|sugar patient|heart attack human)\b/,
    /\b(cat|kitten|billi|dog|puppy|kutta|parrot|tota|kabootar|pigeon|snake|lion|tiger)\b/
  ];

  for (const pattern of bannedPatterns) {
    if (pattern.test(lower)) {
      const lang = detectUserLanguage(message);
      let refusalText = '';
      if (lang === 'ur_script') {
        refusalText = 'میں صحت اسسٹنٹ ہوں، جو صرف مویشی صحت AI اور گائے و بھینس کی نگہداشت کے لیے مخصوص ہے۔ میں مویشیوں کی صحت اور ایپ کے علاوہ کسی موضوع پر معلومات فراہم نہیں کر سکتا۔ براہ کرم اپنی گائے یا بھینس کے متعلق سوال پوچھیں۔';
      } else if (lang === 'roman_urdu') {
        refusalText = 'Main Sehat Assistant hoon, jo sirf Maveshi Sehat AI aur gaye/bhains ki sehat ke liye mukhtas hai. Main livestock aur app ke ilawa kisi aur mauzu par baat nahi kar sakta. Barah-e-karam apni gaye ya bhains ki sehat ke mutaliq sawal poochein.';
      } else {
        refusalText = 'I am Sehat Assistant, dedicated exclusively to Maveshi Sehat AI and cattle & buffalo healthcare. I cannot assist with topics outside bovine health and our platform. Please ask about your cows, buffaloes, or our app features.';
      }
      return { allowed: false, refusalText };
    }
  }

  return { allowed: true };
};

/**
 * Builds a strict language directive to prevent LLM script mixing
 */
const buildLanguageDirective = (userMessage, role = 'farmer', userName = 'User') => {
  const lang = detectUserLanguage(userMessage);
  const isVet = role === 'vet' || role === 'veterinarian';

  const roleConstraint = isVet
    ? `VETERINARY CLINICAL DIRECTIVE:
You are assisting Dr. ${userName || 'Doctor'}, a licensed veterinary surgeon/physician.
1. Use clinical veterinary terminology (differential diagnoses, pharmacokinetics, dosages in mg/kg body weight, withdrawal periods).
2. NEVER instruct them to "consult a vet" or "visit a clinic" — they ARE the veterinarian. Support their diagnostic and clinical decision-making.
3. Keep clinical recommendations evidence-based and structured.`
    : `FARMER SAFETY DIRECTIVE:
You are assisting livestock farmer / owner (${userName || 'Farmer'}).
1. Explain in simple, practical, layman terms that a rural farmer understands.
2. Provide safe first-aid and supportive management.
3. Remind that potent antibiotics, hormones, and intravenous medications must only be administered under the physical guidance of a licensed veterinarian: [👨‍⚕️ View Veterinarians](app:VeterinariansList).`;

  const sharedConstraints = `
CRITICAL PERSONA & SCOPE RULES:
1. MALE FORMAL VOICE ONLY: Always use masculine formal grammatical gender (e.g. "main kar sakta hoon", "madad karoon ga", "bata sakta hoon", "میں کر سکتا ہوں"). NEVER use feminine grammar ("karti hoon", "sakti hoon", "کرتی ہوں", "سکتی ہوں").
2. CONCISENESS: Answer ONLY what was asked. Keep answers direct and short. If the user asks a simple greeting or asks if you can speak Roman Urdu, reply in 1-2 friendly sentences without unprompted lectures or feature dumping.
3. COWS & BUFFALOES ONLY: Focus strictly on Cows (گائے) and Buffaloes (بھینس). Do NOT mention pets, poultry, goats, sheep, or humans.
4. STRICT DOMAIN GUARDRAIL: If the user asks about ANYTHING outside bovine health or Maveshi Sehat AI, politely refuse immediately.
5. APP NAVIGATION LINKS: If guiding the user to a feature or if they ask to open/find a section, include a navigation link in the exact format: [Button Text](app:ScreenName), where ScreenName is one of: VeterinariansList, AiScan, HealthRecords, Vaccination, Marketplace, HeatAlert, CommunityForum, MyConsultations.

${roleConstraint}`;

  if (lang === 'ur_script') {
    return `[MANDATORY SCRIPT & LANGUAGE DIRECTIVE]:
The user's input is in URDU SCRIPT (اردو رسم الخط).
You MUST respond 100% in proper Urdu script (اردو رسم الخط).
Do NOT use Roman Urdu or full English.
${sharedConstraints}`;
  } else if (lang === 'roman_urdu') {
    return `[MANDATORY SCRIPT & LANGUAGE DIRECTIVE]:
The user's input is in ROMAN URDU (Latin alphabet, e.g. "app kaise hain?", "meri cow ko bukhar hai", "kia ap roman urdu me baat kr skte hain?").
You MUST respond 100% in ROMAN URDU using ONLY the English/Latin alphabet.
CRITICAL:
1. NEVER use any Arabic/Urdu script letters (کوئی اردو رسم الخط استعمال نہ کریں).
2. DO NOT respond in pure English. Respond in polite, friendly Roman Urdu.
${sharedConstraints}`;
  } else {
    return `[MANDATORY SCRIPT & LANGUAGE DIRECTIVE]:
The user's input is in ENGLISH.
You MUST respond 100% in proper, grammatically correct ENGLISH.
CRITICAL:
1. NEVER insert any Arabic/Urdu script letters (NO اردو رسم الخط).
2. Do NOT mix random Urdu words. Keep the response completely in professional English.
${sharedConstraints}`;
  }
};

/**
 * Intelligent AI Router:
 * 1. Executes deterministic domain boundary guardrail check
 * 2. Selects role-tailored system prompt (Farmer vs Veterinarian)
 * 3. Attaches dynamic language enforcement directive and platform directory
 * 4. Routes through Google Gemini (Primary) with Groq Llama 3.3 70B fallback
 */
const routeChatMessage = async (userMessage, history = [], options = {}) => {
  // 1. Guardrail Check
  const boundaryCheck = checkDomainBoundary(userMessage);
  if (!boundaryCheck.allowed) {
    return {
      reply: boundaryCheck.refusalText,
      provider: 'guardrail'
    };
  }

  // Parse options
  let extraContext = '';
  let role = 'farmer';
  let userName = 'Farmer';

  if (typeof options === 'string') {
    extraContext = options;
  } else if (options && typeof options === 'object') {
    extraContext = options.extraContext || '';
    role = options.role || 'farmer';
    userName = options.userName || (role === 'vet' ? 'Doctor' : 'Farmer');
  }

  // Role-Specific System Prompt & Directives
  const baseSystemPrompt = getSystemPrompt({ role, userName });
  const languageDirective = buildLanguageDirective(userMessage, role, userName);

  const combinedSystemPrompt = `${baseSystemPrompt}\n\n${languageDirective}${extraContext ? `\n\n${extraContext}` : ''}`;

  try {
    const reply = await chatWithGemini(userMessage, history, combinedSystemPrompt);
    return { reply, provider: 'gemini' };
  } catch (geminiError) {
    console.warn('Primary AI (Gemini) failed, attempting Groq fallback. Error:', geminiError.message);
    try {
      const reply = await chatWithGroq(userMessage, history, combinedSystemPrompt);
      return { reply, provider: 'groq' };
    } catch (groqError) {
      console.error('Fallback AI (Groq) also failed. Error:', groqError.message);
      throw new Error(`Both AI services failed. Gemini: ${geminiError.message} | Groq: ${groqError.message}`);
    }
  }
};

module.exports = { routeChatMessage, detectUserLanguage, checkDomainBoundary };
