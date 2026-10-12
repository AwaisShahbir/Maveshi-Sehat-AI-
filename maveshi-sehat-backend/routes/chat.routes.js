const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // Create or Get Conversation
  router.post('/api/chat/conversation', async (req, res) => {
    try {
      const { farmerId, farmerName, vetId } = req.body;
      if ((!farmerId && !farmerName) || !vetId) {
        return res.status(400).json({ error: 'farmerId/farmerName and vetId are required' });
      }

      let fId = farmerId;
      if (!fId) {
        const farmerRes = await pool.query("SELECT id FROM users WHERE full_name ILIKE $1 AND role = 'farmer'", [farmerName]);
        if (farmerRes.rows.length === 0) {
          return res.status(404).json({ error: 'Farmer user not found' });
        }
        fId = farmerRes.rows[0].id;
      }

      let convRes = await pool.query(
        'SELECT * FROM conversations WHERE farmer_id = $1 AND vet_id = $2',
        [fId, vetId]
      );

      if (convRes.rows.length === 0) {
        convRes = await pool.query(
          "INSERT INTO conversations (farmer_id, vet_id, status) VALUES ($1, $2, 'active') RETURNING *",
          [fId, vetId]
        );
      }

      res.status(200).json(convRes.rows[0]);
    } catch (err) {
      console.error('Error creating conversation:', err.message);
      res.status(500).json({ error: 'Server error handling conversation' });
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
