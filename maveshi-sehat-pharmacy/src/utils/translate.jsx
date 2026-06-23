import React, { createContext, useContext, useState, useEffect } from 'react';

const TranslationContext = createContext();
let translationQueue = [];
let isTranslating = false;

export const TranslationProvider = ({ children }) => {
  const [translations, setTranslations] = useState({});
  const [targetLang, setTargetLang] = useState('en');
  const baseUrl = 'http://localhost:5000';

  useEffect(() => {
    const loadCache = () => {
      try {
        const cached = localStorage.getItem('translations_cache');
        if (cached) setTranslations(JSON.parse(cached));
        
        const profile = localStorage.getItem('profile');
        if (profile) {
          const parsed = JSON.parse(profile);
          if (parsed.language === 'Urdu') setTargetLang('ur');
          else if (parsed.language === 'Both') setTargetLang('both');
          else setTargetLang('en');
        }
      } catch (err) {}
    };
    
    loadCache();
    const interval = setInterval(loadCache, 2000); 
    return () => clearInterval(interval);
  }, []);

  const processQueue = async () => {
    if (isTranslating || translationQueue.length === 0) return;
    isTranslating = true;
    const batch = translationQueue.splice(0, 20);
    
    try {
      const response = await fetch(\\/api/translate\, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: batch, targetLang: 'ur' })
      });
      const data = await response.json();
      
      if (data.translations) {
        setTranslations(prev => {
          const updated = { ...prev };
          data.translations.forEach(t => { updated[t.original] = t.translated; });
          localStorage.setItem('translations_cache', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      isTranslating = false;
      if (translationQueue.length > 0) processQueue();
    }
  };

  const t = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    if (targetLang === 'en') return text;
    if (translations[text] && translations[text] !== text) {
      return targetLang === 'both' ? \\ / \\ : translations[text];
    }
    if (translations[text] === undefined && !translationQueue.includes(text)) {
      setTranslations(prev => ({ ...prev, [text]: text }));
      translationQueue.push(text);
      processQueue();
    }
    return text;
  };

  return (
    <TranslationContext.Provider value={{ t, setTargetLang, targetLang }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
