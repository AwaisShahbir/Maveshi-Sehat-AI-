const fs = require('fs');
const Groq = require('groq-sdk');
const OpenAI = require('openai');

/**
 * Transcribes audio file to text using Groq Whisper (Primary, fast & free)
 * with graceful fallback to OpenAI Whisper.
 *
 * @param {string} audioFilePath - Local path of the recorded audio file (m4a, mp3, wav, etc.)
 * @returns {Promise<{ transcript: string, language?: string }>}
 */
const transcribeAudio = async (audioFilePath) => {
  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file does not exist at: ${audioFilePath}`);
  }

  // 1. Try Groq Whisper (Free, high-speed, excellent Urdu & English support)
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: 'whisper-large-v3-turbo',
        prompt: 'مویشی، گائے، بھینس، بکری، بیماریاں، مویشی صحت، Livestock dairy farming query in Urdu or English',
        response_format: 'json',
      });

      if (transcription && transcription.text && transcription.text.trim().length > 0) {
        console.log('🎤 Groq Whisper transcription success:', transcription.text);
        return {
          transcript: transcription.text.trim(),
        };
      }
    } catch (groqErr) {
      console.warn('Groq Whisper STT failed, checking OpenAI fallback:', groqErr.message);
    }
  }

  // 2. Fallback to OpenAI Whisper if OPENAI_API_KEY is available and has credits
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const fileStream = fs.createReadStream(audioFilePath);
      const transcription = await openai.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-1',
      });

      if (transcription && transcription.text) {
        return {
          transcript: transcription.text.trim(),
        };
      }
    } catch (openAiErr) {
      console.warn('OpenAI Whisper STT also failed:', openAiErr.message);
    }
  }

  throw new Error('All speech transcription services failed. Please check microphone or try again.');
};

module.exports = { transcribeAudio };
