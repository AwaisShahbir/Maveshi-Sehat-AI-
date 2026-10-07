const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { routeChatMessage } = require('../services/aiRouterService');
const { transcribeAudio } = require('../services/speechToTextService');
const { synthesizeSpeech } = require('../services/textToSpeechService');

// Multer storage for incoming voice recordings
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.m4a';
    cb(null, `voice-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const audioUpload = multer({ storage: audioStorage });

module.exports = (pool) => {
  // Ensure chat_logs table exists
  if (pool) {
    pool.query(`
      CREATE TABLE IF NOT EXISTS chat_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100),
        role VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        audio_url VARCHAR(255),
        provider VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(err => console.warn('chat_logs table check warning:', err.message));
  }

  const getPlatformContext = async () => {
    if (!pool) return '';
    try {
      const vetsRes = await pool.query(
        "SELECT full_name, district, specialization, experience_years, phone_number, pvmc_number FROM users WHERE role = 'vet' AND (status = 'verified' OR status = 'approved')"
      );
      const pharmRes = await pool.query(
        "SELECT name, city, address, phone, whatsapp FROM pharmacies WHERE status = 'approved' OR status = 'active' LIMIT 10"
      );

      const vetsText = vetsRes.rows.length > 0
        ? vetsRes.rows.map(v => `- Dr. ${v.full_name} (Specialization: ${v.specialization || 'Generalist'}, Experience: ${v.experience_years || 5} years, District/City: ${v.district || 'Punjab'}, PVMC: ${v.pvmc_number || 'Registered'}, Contact: ${v.phone_number})`).join('\n')
        : 'No doctors currently registered.';

      const pharmText = pharmRes.rows.length > 0
        ? pharmRes.rows.map(p => `- ${p.name} (${p.city || p.address || 'Punjab'}, Contact: ${p.phone || p.whatsapp || 'Via App'})`).join('\n')
        : 'Pharmacies accessible in Marketplace tab.';

      return `[LIVE MAVESHI SEHAT AI REGISTERED DIRECTORY]:
The following verified doctors and pharmacies are actively registered in the Maveshi Sehat AI database:

Verified Doctors on Maveshi Sehat AI:
${vetsText}

Approved Pharmacies on Maveshi Sehat AI:
${pharmText}

CRITICAL INSTRUCTION FOR DOCTOR & PHARMACY QUESTIONS:
- When a farmer asks for a vet or doctor (especially in Lahore or anywhere in Pakistan), actively recommend the registered doctor(s) above (e.g. Dr. ${vetsRes.rows[0]?.full_name || 'Ali Khan'}).
- Keep it concise, focused, and directly relevant.
- Always provide a direct app button link: [👨‍⚕️ View Dr. Ali Khan / Veterinarians](app:VeterinariansList) so the user can tap and instantly view their profile, request online consultation, or book an appointment!
- For medicines or pharmacy needs, provide: [🛒 Open Marketplace](app:Marketplace).
- NEVER claim that Maveshi Sehat AI lacks a registered doctor network or directory.`;
    } catch (dbErr) {
      console.warn('Could not build platform directory for chatbot:', dbErr.message);
      return '';
    }
  };

  /**
   * POST /api/chat/message
   * Send a text message to Sehat Assistant
   */
  router.post('/message', async (req, res) => {
    try {
      const { message, history = [], userId = 'guest', enableTts = false } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message text is required' });
      }

      // Retrieve registered platform directory from database to ground the AI in actual Maveshi Sehat doctors & pharmacies
      const platformContext = await getPlatformContext();

      // Route message through Gemini (Primary) with Groq fallback
      const { reply, provider } = await routeChatMessage(message, history, platformContext);

      let audioUrl = null;
      if (enableTts && reply) {
        try {
          const { audioBuffer } = await synthesizeSpeech(reply);
          const audioFileName = `reply-${Date.now()}.mp3`;
          const audioFilePath = path.join(__dirname, '../uploads', audioFileName);
          fs.writeFileSync(audioFilePath, audioBuffer);
          audioUrl = `/uploads/${audioFileName}`;
        } catch (ttsErr) {
          console.warn('TTS synthesis warning (message still sent):', ttsErr.message);
        }
      }

      // Log to database
      if (pool) {
        try {
          await pool.query(
            'INSERT INTO chat_logs (user_id, role, message, provider) VALUES ($1, $2, $3, $4)',
            [userId, 'user', message, null]
          );
          await pool.query(
            'INSERT INTO chat_logs (user_id, role, message, audio_url, provider) VALUES ($1, $2, $3, $4, $5)',
            [userId, 'assistant', reply, audioUrl, provider]
          );
        } catch (dbErr) {
          console.warn('Failed to persist chat log to DB:', dbErr.message);
        }
      }

      return res.json({
        success: true,
        reply,
        provider,
        audioUrl,
      });
    } catch (err) {
      console.error('Chat message processing error:', err.message);
      return res.status(500).json({
        error: 'Failed to process chat message',
        details: err.message
      });
    }
  });

  /**
   * POST /api/chat/voice
   * Process voice message: STT -> AI -> TTS
   */
  router.post('/voice', audioUpload.single('audio'), async (req, res) => {
    let localFilePath = null;
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      localFilePath = req.file.path;
      const userId = req.body.userId || 'guest';
      let history = [];
      if (req.body.history) {
        try {
          history = JSON.parse(req.body.history);
        } catch (e) {
          history = [];
        }
      }

      // 1. Transcribe with OpenAI Whisper
      const { transcript } = await transcribeAudio(localFilePath);

      if (!transcript || transcript.trim().length === 0) {
        return res.status(400).json({ error: 'Could not transcribe speech from audio' });
      }

      // 2. AI Response
      const platformContext = await getPlatformContext();
      const { reply, provider } = await routeChatMessage(transcript, history, platformContext);

      // 3. TTS Voice Reply
      let audioUrl = null;
      try {
        const { audioBuffer } = await synthesizeSpeech(reply);
        const replyAudioFileName = `voice-reply-${Date.now()}.mp3`;
        const replyAudioPath = path.join(__dirname, '../uploads', replyAudioFileName);
        fs.writeFileSync(replyAudioPath, audioBuffer);
        audioUrl = `/uploads/${replyAudioFileName}`;
      } catch (ttsErr) {
        console.warn('Voice reply TTS synthesis warning:', ttsErr.message);
      }

      // 4. Log to database
      if (pool) {
        try {
          await pool.query(
            'INSERT INTO chat_logs (user_id, role, message, audio_url) VALUES ($1, $2, $3, $4)',
            [userId, 'user', transcript, `/uploads/${req.file.filename}`]
          );
          await pool.query(
            'INSERT INTO chat_logs (user_id, role, message, audio_url, provider) VALUES ($1, $2, $3, $4, $5)',
            [userId, 'assistant', reply, audioUrl, provider]
          );
        } catch (dbErr) {
          console.warn('Failed to log voice message to DB:', dbErr.message);
        }
      }

      return res.json({
        success: true,
        transcript,
        reply,
        provider,
        audioUrl,
      });
    } catch (err) {
      console.error('Voice chat processing error:', err.message);
      return res.status(500).json({
        error: 'Failed to process voice chat',
        details: err.message
      });
    }
  });

  /**
   * GET /api/chat/history/:userId
   * Fetch conversation history
   */
  router.get('/history/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      if (!pool) {
        return res.json({ history: [] });
      }

      const result = await pool.query(
        'SELECT id, role, message, audio_url, provider, created_at FROM chat_logs WHERE user_id = $1 ORDER BY created_at ASC LIMIT 50',
        [userId]
      );

      return res.json({ history: result.rows });
    } catch (err) {
      console.error('Fetch chat history error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  });

  /**
   * POST /api/chat/tts
   * Synthesize text to speech on demand for any message
   */
  router.post('/tts', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required for TTS' });
      }
      const { audioBuffer } = await synthesizeSpeech(text);
      const audioFileName = `tts-${Date.now()}.mp3`;
      const audioFilePath = path.join(__dirname, '../uploads', audioFileName);
      fs.writeFileSync(audioFilePath, audioBuffer);
      return res.json({
        success: true,
        audioUrl: `/uploads/${audioFileName}`
      });
    } catch (err) {
      console.warn('TTS on-demand error:', err.message);
      return res.status(500).json({ error: 'TTS failed', details: err.message });
    }
  });

  return router;
};
