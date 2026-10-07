const fs = require('fs');
const OpenAI = require('openai');
const Groq = require('groq-sdk');

/**
 * Transcribes audio file to text using OpenAI Whisper (Primary)
 * with graceful fallback to Groq Whisper (Fallback).
 *
 * @param {string} audioFilePath - Local path of the recorded audio file (m4a, mp3, wav, etc.)
 * @returns {Promise<{ transcript: string, language?: string }>}
 */
const transcribeAudio = async (audioFilePath) => {
  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file does not exist at: ${audioFilePath}`);
  }

  // 1. Try OpenAI Whisper (Industry standard precision for Urdu, Roman Urdu & English)
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const fileStream = fs.createReadStream(audioFilePath);
      const transcription = await openai.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-1',
        prompt: 'مویشی، گائے، بھینس، بکری، مویشی صحت، ڈاکٹر، Livestock dairy farming query in Urdu or English',
      });

      if (transcription && transcription.text && transcription.text.trim().length > 0) {
        console.log('🎤 OpenAI Whisper transcription success:', transcription.text);
        return {
          transcript: transcription.text.trim(),
        };
      }
    } catch (openAiErr) {
      console.warn('OpenAI Whisper STT failed, falling back to Groq Whisper:', openAiErr.message);
    }
  }

  // 2. Try Groq Whisper (Ultra fast free fallback)
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
      console.warn('Groq Whisper STT also failed:', groqErr.message);
    }
  }

  throw new Error('All speech transcription services failed. Please check microphone or try again.');
};

module.exports = { transcribeAudio };
