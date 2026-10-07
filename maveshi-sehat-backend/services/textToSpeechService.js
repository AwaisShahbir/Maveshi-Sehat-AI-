const fs = require('fs');
const path = require('path');
const googleTTS = require('google-tts-api');

let gcloudClient = null;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_TTS_API_KEY) {
    const textToSpeech = require('@google-cloud/text-to-speech');
    gcloudClient = new textToSpeech.TextToSpeechClient();
  }
} catch (e) {
  // Graceful fallback to zero-key TTS
}

/**
 * Detects whether the text is primarily Urdu script or English/Latin
 */
const isUrduScript = (text) => {
  return /[\u0600-\u06FF]/.test(text);
};

/**
 * Converts text into spoken audio buffer.
 * Requires ZERO API key and ZERO credit card.
 * Works seamlessly for both Urdu and English.
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

  // 1. If Google Cloud credentials exist and user configured them, attempt Cloud TTS
  if (gcloudClient) {
    try {
      const languageCode = lang === 'ur' ? 'ur-PK' : 'en-US';
      const request = {
        input: { text: cleanedText },
        voice: { languageCode, ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
      };
      const [response] = await gcloudClient.synthesizeSpeech(request);
      return {
        audioBuffer: Buffer.from(response.audioContent),
        format: 'audio/mp3',
        languageCode,
      };
    } catch (gcloudErr) {
      console.warn('Google Cloud TTS unavailable, using free instant TTS engine:', gcloudErr.message);
    }
  }

  // 2. 100% Free Instant TTS Engine (Zero API Key, Zero Billing, No Card Needed)
  try {
    // If text is short, get direct base64
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

    // For longer responses, fetch multi-segment audio and concatenate
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
    console.error('Free TTS synthesis failed:', err.message);
    throw new Error('TTS synthesis failed: ' + err.message);
  }
};

module.exports = { synthesizeSpeech, isUrduScript };
