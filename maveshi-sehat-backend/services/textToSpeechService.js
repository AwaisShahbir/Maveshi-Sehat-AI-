const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const googleTTS = require('google-tts-api');

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

/**
 * Detects whether the text is primarily Urdu script or English/Latin
 */
const isUrduScript = (text) => {
  return /[\u0600-\u06FF]/.test(text);
};

/**
 * Converts text into spoken audio buffer.
 * Uses OpenAI TTS (tts-1) as primary for human-like natural voice,
 * with automatic fallback to Google TTS engine.
 *
 * @param {string} text - Text to synthesize into speech
 * @param {string} forcedLanguage - Optional language code ('ur' | 'en')
 * @returns {Promise<{ audioBuffer: Buffer, format: string, languageCode: string }>}
 */
const synthesizeSpeech = async (text, forcedLanguage = null) => {
  const isUrdu = isUrduScript(text);
  const lang = forcedLanguage || (isUrdu ? 'ur' : 'en');

  // Clean markdown asterisks, hashes, and formatting tags for clean voice output
  const cleanedText = text
    .replace(/[*#_~`]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  // 1. Try OpenAI TTS (Ultra-high quality natural voice)
  const openai = getOpenAIClient();
  if (openai && cleanedText) {
    try {
      // Limit to 4096 chars per OpenAI docs
      const truncated = cleanedText.length > 4000 ? cleanedText.substring(0, 4000) : cleanedText;
      const mp3Response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy', // clear, natural voice
        input: truncated,
      });

      const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
      return {
        audioBuffer,
        format: 'audio/mp3',
        languageCode: lang,
      };
    } catch (openAiErr) {
      console.warn('OpenAI TTS failed, falling back to Google TTS engine:', openAiErr.message);
    }
  }

  // 2. Fallback: Free Instant TTS Engine
  try {
    if (cleanedText.length <= 200) {
      const base64 = await googleTTS.getAudioBase64(cleanedText, {
        lang,
        slow: false,
        host: 'https://translate.google.com',
        timeout: 10000,
      });
      return {
        audioBuffer: Buffer.from(base64, 'base64'),
        format: 'audio/mp3',
        languageCode: lang,
      };
    }

    const results = await googleTTS.getAllAudioBase64(cleanedText, {
      lang,
      slow: false,
      host: 'https://translate.google.com',
      timeout: 15000,
      splitPunct: '.,!?;:۔',
    });

    const buffers = results.map(item => Buffer.from(item.base64, 'base64'));
    const combinedBuffer = Buffer.concat(buffers);

    return {
      audioBuffer: combinedBuffer,
      format: 'audio/mp3',
      languageCode: lang,
    };
  } catch (err) {
    console.error('TTS synthesis failed completely:', err.message);
    throw new Error('TTS synthesis failed: ' + err.message);
  }
};

module.exports = { synthesizeSpeech, isUrduScript };
