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

  /**
   * Helper to fetch AI Assistant Service Status set by Administrator
   */
  const getAiServiceStatus = async () => {
    if (!pool) return { enabled: true };
    try {
      const res = await pool.query(
        "SELECT setting_value FROM admin_settings WHERE setting_key = 'ai_assistant' LIMIT 1"
      );
      if (res.rows.length === 0) {
        return {
          enabled: true,
          messageEn: 'Sehat Assistant is temporarily paused for scheduled maintenance by administration. Please consult our registered veterinarians directly.',
          messageUr: 'انتظامیہ کی جانب سے صحت اسسٹنٹ سروس عارضی طور پر روک دی گئی ہے۔ برائے مہربانی رجسٹرڈ ویٹرنری ڈاکٹرز سے براہ راست رابطہ کریں۔'
        };
      }
      const val = typeof res.rows[0].setting_value === 'string'
        ? JSON.parse(res.rows[0].setting_value)
        : res.rows[0].setting_value;
      return {
        enabled: val.enabled !== false,
        messageEn: val.messageEn || 'Sehat Assistant is temporarily paused for scheduled maintenance by administration. Please consult our registered veterinarians directly.',
        messageUr: val.messageUr || 'انتظامیہ کی جانب سے صحت اسسٹنٹ سروس عارضی طور پر روک دی گئی ہے۔ برائے مہربانی رجسٹرڈ ویٹرنری ڈاکٹرز سے براہ راست رابطہ کریں۔',
        pausedAt: val.pausedAt || null,
        pausedBy: val.pausedBy || null
      };
    } catch (e) {
      console.warn('Error reading AI assistant status:', e.message);
      return {
        enabled: true,
        messageEn: 'Service operational',
        messageUr: 'سروس فعال ہے'
      };
    }
  };

  /**
   * Safe platform operational context without leaking private user data or database statistics
   */
  const getPlatformContext = (role) => {
    if (role === 'vet' || role === 'veterinarian') {
      return `[VETERINARIAN SESSION CONFIDENTIALITY & DIRECTIVES]:
- You are communicating with a registered veterinary doctor.
- STRICTLY FORBIDDEN: NEVER suggest booking a veterinarian, never tell them to consult another vet, and NEVER link to the veterinarians directory (app:VeterinariansList).
- STRICTLY FORBIDDEN: NEVER suggest or link to the consumer "Marketplace" (app:Marketplace) or farmer records (app:HealthRecords). The doctor is not a customer or animal owner.
- STRICTLY FORBIDDEN: Under NO circumstance reveal internal platform statistics, database counts, or how many vets/users are registered on Maveshi Sehat. If asked, politely state that platform registry statistics are confidential.
- Focus exclusively on Clinical Decision Support: exact drug dosages in mg/kg, differential diagnoses, pharmacology, fluid therapy, and clinical management without promotional links.`;
    }

    return `[FARMER SESSION CONFIDENTIALITY & DIRECTIVES]:
- You are communicating with a livestock farmer/owner.
- If the animal requires in-person medical attention, advise them to consult a qualified veterinarian and direct them to: [👨‍⚕️ View Veterinarians](app:VeterinariansList).
- STRICTLY FORBIDDEN: Under NO circumstance reveal internal database statistics, user counts, or how many vets are registered. If asked, state that internal platform statistics are confidential.`;
  };

  /**
   * GET /api/chat/status
   * Public check for AI assistant availability & maintenance state
   */
  router.get('/status', async (req, res) => {
    try {
      const status = await getAiServiceStatus();
      return res.status(200).json(status);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve AI status' });
    }
  });

  /**
   * POST /api/chat/admin/toggle
   * Administrator kill-switch / maintenance toggle
   */
  router.post('/admin/toggle', async (req, res) => {
    try {
      const { enabled, messageEn, messageUr, adminName = 'Administrator' } = req.body;
      const payload = {
        enabled: Boolean(enabled),
        messageEn: messageEn || 'Sehat Assistant is temporarily paused for scheduled maintenance by administration. Please consult our registered veterinarians directly.',
        messageUr: messageUr || 'انتظامیہ کی جانب سے صحت اسسٹنٹ سروس عارضی طور پر روک دی گئی ہے۔ برائے مہربانی رجسٹرڈ ویٹرنری ڈاکٹرز سے براہ راست رابطہ کریں۔',
        pausedAt: enabled ? null : new Date().toISOString(),
        pausedBy: adminName
      };

      await pool.query(`
        INSERT INTO admin_settings (setting_key, setting_value, updated_at)
        VALUES ('ai_assistant', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (setting_key)
        DO UPDATE SET setting_value = $1, updated_at = CURRENT_TIMESTAMP
      `, [JSON.stringify(payload)]);

      return res.status(200).json({
        success: true,
        message: enabled ? 'AI Assistant service resumed.' : 'AI Assistant service paused for maintenance.',
        status: payload
      });
    } catch (err) {
      console.error('Error toggling AI assistant service:', err.message);
      return res.status(500).json({ error: 'Failed to toggle service status', details: err.message });
    }
  });

  /**
   * POST /api/chat/message
   * Send a text message to Sehat Assistant (Role-Aware)
   */
  router.post('/message', async (req, res) => {
    try {
      const {
        message,
        history = [],
        userId = 'guest',
        role = 'farmer',
        userName = '',
        enableTts = false,
        isUrdu = false
      } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message text is required' });
      }

      // 1. Admin Service Status Check
      const serviceStatus = await getAiServiceStatus();
      if (!serviceStatus.enabled) {
        const pauseMsg = isUrdu ? serviceStatus.messageUr : serviceStatus.messageEn;
        return res.json({
          success: false,
          isServicePaused: true,
          reply: pauseMsg,
          provider: 'admin_maintenance'
        });
      }

      // 2. Retrieve live platform directory
      const platformContext = getPlatformContext(role);

      // 3. Route through Dual-Persona AI Router (Farmer vs Vet)
      const { reply, provider } = await routeChatMessage(message, history, {
        role,
        userName: userName || (role === 'vet' ? 'Doctor' : 'Farmer'),
        extraContext: platformContext
      });

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

      // 4. Log to database
      if (pool) {
        try {
          await pool.query(
            'INSERT INTO chat_logs (user_id, role, message, provider) VALUES ($1, $2, $3, $4)',
            [userId, role === 'vet' ? 'vet' : 'farmer', message, null]
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
   * Process voice message: STT -> Role-Aware AI -> TTS
   */
  router.post('/voice', audioUpload.single('audio'), async (req, res) => {
    let localFilePath = null;
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      localFilePath = req.file.path;
      const userId = req.body.userId || 'guest';
      const role = req.body.role || 'farmer';
      const userName = req.body.userName || (role === 'vet' ? 'Doctor' : 'Farmer');
      const isUrdu = req.body.isUrdu === 'true' || req.body.isUrdu === true;

      // 1. Admin Service Status Check
      const serviceStatus = await getAiServiceStatus();
      if (!serviceStatus.enabled) {
        const pauseMsg = isUrdu ? serviceStatus.messageUr : serviceStatus.messageEn;
        return res.json({
          success: false,
          isServicePaused: true,
          transcript: '',
          reply: pauseMsg,
          provider: 'admin_maintenance'
        });
      }

      let history = [];
      if (req.body.history) {
        try {
          history = JSON.parse(req.body.history);
        } catch (e) {
          history = [];
        }
      }

      // 2. Transcribe with OpenAI Whisper
      const { transcript } = await transcribeAudio(localFilePath);

      if (!transcript || transcript.trim().length === 0) {
        return res.status(400).json({ error: 'Could not transcribe speech from audio' });
      }

      // 3. AI Response
      const platformContext = getPlatformContext(role);
      const { reply, provider } = await routeChatMessage(transcript, history, {
        role,
        userName,
        extraContext: platformContext
      });

      // 4. TTS Voice Reply
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

      // 5. Log to database
      if (pool) {
        try {
          await pool.query(
            'INSERT INTO chat_logs (user_id, role, message, audio_url) VALUES ($1, $2, $3, $4)',
            [userId, role === 'vet' ? 'vet' : 'farmer', transcript, `/uploads/${req.file.filename}`]
          );
          await pool.query(
            'INSERT INTO chat_logs (user_id, role, message, audio_url, provider) VALUES ($1, $2, $3, $4, $5)',
            [userId, 'assistant', reply, audioUrl, provider]
          );
        } catch (dbErr) {
          console.warn('Voice chat log DB save warning:', dbErr.message);
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
      console.error('Voice message error:', err.message);
      return res.status(500).json({
        error: 'Failed to process voice message',
        details: err.message
      });
    } finally {
      if (localFilePath && fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (e) {}
      }
    }
  });

  /**
   * GET /api/chat/history
   * Retrieve previous chat logs for a specific user
   */
  router.get('/history', async (req, res) => {
    try {
      const userId = req.query.userId || req.query.user_id || 'guest';
      if (!pool) {
        return res.json({ success: true, messages: [] });
      }

      const result = await pool.query(
        `SELECT id, role, message AS content, audio_url AS "audioUrl", provider,
                TO_CHAR(created_at, 'HH12:MI AM') AS time, created_at
         FROM chat_logs
         WHERE user_id = $1
         ORDER BY created_at ASC
         LIMIT 60`,
        [userId]
      );

      const formatted = result.rows.map(row => ({
        id: String(row.id),
        role: row.role === 'farmer' || row.role === 'vet' ? 'user' : row.role,
        content: row.content,
        audioUrl: row.audioUrl,
        provider: row.provider || 'Sehat Assistant',
        time: row.time || ''
      }));

      return res.json({
        success: true,
        messages: formatted
      });
    } catch (err) {
      console.error('Fetch chat history error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  });

  /**
   * DELETE /api/chat/history
   * Clear chat history for a specific user
   */
  router.delete('/history', async (req, res) => {
    try {
      const userId = req.query.userId || req.body.userId || 'guest';
      if (pool) {
        await pool.query('DELETE FROM chat_logs WHERE user_id = $1', [userId]);
      }
      return res.json({ success: true, message: 'Chat history cleared' });
    } catch (err) {
      console.error('Clear chat history error:', err.message);
      return res.status(500).json({ error: 'Failed to clear chat history' });
    }
  });

  return router;
};
