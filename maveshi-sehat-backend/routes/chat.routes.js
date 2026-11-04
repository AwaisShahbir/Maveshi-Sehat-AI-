const express = require('express');
const router = express.Router();

module.exports = (pool, io) => {
  // Create or Get Conversation
  router.post('/api/chat/conversation', async (req, res) => {
    try {
      const { conversationId, farmerId, farmerName, vetId } = req.body;

      // If direct conversationId is passed, look it up immediately
      if (conversationId) {
        const convRes = await pool.query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
        if (convRes.rows.length > 0) {
          return res.status(200).json(convRes.rows[0]);
        }
      }

      let fId = farmerId;
      if (!fId && farmerName) {
        const farmerRes = await pool.query(
          "SELECT id FROM users WHERE (full_name ILIKE $1 OR phone_number ILIKE $1) AND role = 'farmer' LIMIT 1",
          [farmerName]
        );
        if (farmerRes.rows.length > 0) {
          fId = farmerRes.rows[0].id;
        } else {
          // Fallback to any active farmer or first farmer ID if name is generic placeholder
          const fallbackRes = await pool.query("SELECT id FROM users WHERE role = 'farmer' ORDER BY id ASC LIMIT 1");
          if (fallbackRes.rows.length > 0) {
            fId = fallbackRes.rows[0].id;
          } else {
            fId = 1;
          }
        }
      } else if (!fId) {
        fId = 1;
      }

      const safeVetId = vetId || 1;

      let convRes = await pool.query(
        'SELECT * FROM conversations WHERE farmer_id = $1 AND vet_id = $2 ORDER BY id DESC LIMIT 1',
        [fId, safeVetId]
      );

      if (convRes.rows.length === 0) {
        convRes = await pool.query(
          "INSERT INTO conversations (farmer_id, vet_id, status) VALUES ($1, $2, 'active') RETURNING *",
          [fId, safeVetId]
        );
      }

      const conv = { ...convRes.rows[0] };
      try {
        const consultRes = await pool.query(
          'SELECT id, status, ai_record_data, reason, created_at FROM consultations WHERE farmer_id = $1 AND vet_id = $2 ORDER BY id DESC LIMIT 1',
          [fId, safeVetId]
        );
        conv.latest_consultation = consultRes.rows[0] || null;
      } catch (cErr) {
        console.warn('Could not query latest consultation for conversation:', cErr.message);
      }

      res.status(200).json(conv);
    } catch (err) {
      console.error('Error creating conversation:', err.message);
      res.status(500).json({ error: 'Server error handling conversation' });
    }
  });

  // REST Message Send Endpoint (Reliable fallback if WebSocket disconnects)
  router.post('/api/chat/message', async (req, res) => {
    try {
      const {
        conversationId,
        senderId,
        message,
        imageUrl,
        isPrescription,
        prescriptionData,
        isVaccination,
        vaccinationData,
        consultationId
      } = req.body;

      if (!conversationId) {
        return res.status(400).json({ error: 'conversationId is required' });
      }

      const result = await pool.query(
        `INSERT INTO messages (
          conversation_id, sender_id, message, image_url, is_prescription, prescription_data,
          is_vaccination, vaccination_data, consultation_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          conversationId,
          senderId || null,
          message || null,
          imageUrl || null,
          !!isPrescription,
          prescriptionData ? (typeof prescriptionData === 'string' ? prescriptionData : JSON.stringify(prescriptionData)) : null,
          !!isVaccination,
          vaccinationData ? (typeof vaccinationData === 'string' ? vaccinationData : JSON.stringify(vaccinationData)) : null,
          consultationId || null
        ]
      );

      const savedMessage = result.rows[0];

      if (io) {
        io.to(String(conversationId)).emit('receive_message', savedMessage);
      }

      res.status(201).json(savedMessage);
    } catch (err) {
      console.error('Error sending message via REST:', err);
      res.status(500).json({ error: 'Server error sending message' });
    }
  });

  // Get Messages for a Conversation
  router.get('/api/chat/messages', async (req, res) => {
    try {
      const { conversationId } = req.query;
      if (!conversationId) {
        return res.status(400).json({ error: 'conversationId is required' });
      }
      const messagesRes = await pool.query(
        'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [conversationId]
      );
      res.status(200).json(messagesRes.rows);
    } catch (err) {
      console.error('Error fetching messages:', err.message);
      res.status(500).json({ error: 'Server error fetching messages' });
    }
  });

  // Get All Conversations for a Vet
  router.get('/api/chat/conversations/vet', async (req, res) => {
    try {
      const { vetId, vetName } = req.query;
      if (!vetId && !vetName) {
        return res.status(400).json({ error: 'vetId or vetName is required' });
      }

      let query = `
        SELECT c.*, u.full_name as farmer_name, u.district as farmer_district, u.phone_number as farmer_phone
        FROM conversations c
        JOIN users u ON c.farmer_id = u.id
      `;
      const params = [];

      if (vetId) {
        query += ` WHERE c.vet_id = $1`;
        params.push(vetId);
      } else {
        const vetRes = await pool.query("SELECT id FROM users WHERE full_name ILIKE $1 AND role = 'vet'", [vetName]);
        if (vetRes.rows.length === 0) {
          return res.status(200).json([]);
        }
        query += ` WHERE c.vet_id = $1`;
        params.push(vetRes.rows[0].id);
      }

      query += ` ORDER BY c.created_at DESC`;

      const result = await pool.query(query, params);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching vet conversations:', err.message);
      res.status(500).json({ error: 'Server error fetching conversations' });
    }
  });

  // Resolve a Conversation
  router.put('/api/chat/conversation/resolve', async (req, res) => {
    try {
      const { conversationId } = req.body;
      if (!conversationId) {
        return res.status(400).json({ error: 'conversationId is required' });
      }
      await pool.query(
        `UPDATE conversations
         SET status = 'resolved'
         WHERE id = $1`,
        [conversationId]
      );
      await pool.query(
        `UPDATE consultations
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP
         WHERE farmer_id = (SELECT farmer_id FROM conversations WHERE id = $1)
           AND vet_id = (SELECT vet_id FROM conversations WHERE id = $1)
           AND status IN ('pending', 'approved')`,
        [conversationId]
      );
      res.status(200).json({ message: 'Conversation marked as resolved' });
    } catch (err) {
      console.error('Error resolving conversation:', err.message);
      res.status(500).json({ error: 'Server error resolving conversation' });
    }
  });

  // Reopen a Conversation
  router.put('/api/chat/conversation/reopen', async (req, res) => {
    try {
      const { conversationId, reason } = req.body;
      if (!conversationId) {
        return res.status(400).json({ error: 'conversationId is required' });
      }

      const result = await pool.query(
        `UPDATE conversations
         SET status = 'active'
         WHERE id = $1
         RETURNING *`,
        [conversationId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const consultationResult = await pool.query(
        `INSERT INTO consultations (farmer_id, vet_id, type, status, reason)
         VALUES ($1, $2, 'online_chat', 'approved', $3)
         RETURNING *`,
        [result.rows[0].farmer_id, result.rows[0].vet_id, reason?.trim() || 'Consultation']
      );

      res.status(200).json({
        ...result.rows[0],
        consultation: consultationResult.rows[0]
      });
    } catch (err) {
      console.error('Error reopening conversation:', err);
      res.status(500).json({ error: 'Server error reopening conversation' });
    }
  });

  return router;
};
