const { chatWithGemini } = require('./geminiService');
const { chatWithGroq } = require('./groqService');

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
 * Builds a strict language directive to prevent LLM script mixing
 */
const buildLanguageDirective = (userMessage) => {
  const lang = detectUserLanguage(userMessage);

  if (lang === 'ur_script') {
    return `[MANDATORY SCRIPT & LANGUAGE DIRECTIVE]:
The user's input is in URDU SCRIPT (اردو رسم الخط).
You MUST respond 100% in proper Urdu script (اردو رسم الخط).
Do NOT use Roman Urdu or full English.`;
  } else if (lang === 'roman_urdu') {
    return `[MANDATORY SCRIPT & LANGUAGE DIRECTIVE]:
The user's input is in ROMAN URDU (Latin alphabet, e.g. "app kaise hain?", "meri cow ko bukhar hai").
You MUST respond 100% in ROMAN URDU using ONLY the English/Latin alphabet.
CRITICAL:
1. NEVER use any Arabic/Urdu script letters (کوئی اردو رسم الخط استعمال نہ کریں).
2. DO NOT respond in pure English. Respond in polite, friendly Roman Urdu (e.g. "Walaikum Assalam! Main theek hoon. Aap ke janwar ko kya masla hai?").`;
  } else {
    return `[MANDATORY SCRIPT & LANGUAGE DIRECTIVE]:
The user's input is in ENGLISH.
You MUST respond 100% in proper, grammatically correct ENGLISH.
CRITICAL:
1. NEVER insert any Arabic/Urdu script letters (NO اردو رسم الخط).
2. Do NOT mix random Urdu words. Keep the response completely in professional English.`;
  }
};

/**
 * Intelligent AI Router:
 * 1. Attaches dynamic language enforcement directive
 * 2. Attempts Google Gemini 1.5 Flash (Primary)
 * 3. On error / failure / quota limit, automatically fails over to Groq Llama 3.3 70B (Fallback)
 * @param {string} userMessage - User's query
 * @param {Array} history - Prior conversation
 * @param {string} extraContext - Registered platform vets/pharmacies context
 * @returns {Promise<{ reply: string, provider: 'gemini' | 'groq' }>}
 */
const routeChatMessage = async (userMessage, history = [], extraContext = '') => {
  const languageDirective = buildLanguageDirective(userMessage);
  const combinedContext = extraContext 
    ? `${languageDirective}\n\n${extraContext}`
    : languageDirective;

  try {
    const reply = await chatWithGemini(userMessage, history, combinedContext);
    return { reply, provider: 'gemini' };
  } catch (geminiError) {
    console.warn('Primary AI (Gemini) failed, attempting Groq fallback. Error:', geminiError.message);
    try {
      const reply = await chatWithGroq(userMessage, history, combinedContext);
      return { reply, provider: 'groq' };
    } catch (groqError) {
      console.error('Fallback AI (Groq) also failed. Error:', groqError.message);
      throw new Error(`Both AI services failed. Gemini: ${geminiError.message} | Groq: ${groqError.message}`);
    }
  }
};

module.exports = { routeChatMessage, detectUserLanguage };
