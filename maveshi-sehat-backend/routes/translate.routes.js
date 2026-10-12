const express = require('express');
const router = express.Router();

const backendTranslationCache = new Map();

async function fetchOnlineTranslation(text, targetLang = 'ur', sourceLang = 'en') {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  const cacheKey = `${trimmed}_${sourceLang}_${targetLang}`;
  if (backendTranslationCache.has(cacheKey)) {
    return backendTranslationCache.get(cacheKey);
  }

  // Primary: Google Translate dict-chrome-ex API
  try {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${targetLang}&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
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
    console.warn('Google dict-chrome-ex failed, falling back:', err.message);
  }

  // Fallback: MyMemory API
  try {
    const memUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${sourceLang}|${targetLang}`;
    const memRes = await fetch(memUrl);
    if (memRes.ok) {
      const memData = await memRes.json();
      if (memData && memData.responseData && memData.responseData.translatedText) {
        const result = memData.responseData.translatedText;
        backendTranslationCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('MyMemory fallback failed:', err.message);
  }

  return trimmed;
}

module.exports = () => {
  router.post('/api/translate', async (req, res) => {
    try {
      const { text, texts, targetLang = 'ur', sourceLang = 'en' } = req.body;
      
      // Batch translation
      if (Array.isArray(texts)) {
        const results = {};
        await Promise.all(
          texts.map(async (t) => {
            if (t && typeof t === 'string') {
              results[t] = await fetchOnlineTranslation(t, targetLang, sourceLang);
            }
          })
        );
        return res.json({ translations: results, targetLang });
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
