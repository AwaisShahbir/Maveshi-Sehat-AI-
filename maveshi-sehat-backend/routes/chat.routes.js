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
          const conv = { ...convRes.rows[0] };
          try {
            if (conv.vet_id) {
              const vetRes = await pool.query('SELECT full_name, phone_number, consultation_mode FROM users WHERE id = $1', [conv.vet_id]);
              if (vetRes.rows.length > 0) {
                conv.vet_consultation_mode = vetRes.rows[0].consultation_mode || 'Chat + Video';
                conv.vet_phone = vetRes.rows[0].phone_number;
              }
            }
            if (conv.farmer_id) {
              const farmerRes = await pool.query('SELECT full_name, phone_number FROM users WHERE id = $1', [conv.farmer_id]);
              if (farmerRes.rows.length > 0) {
                conv.farmer_phone = farmerRes.rows[0].phone_number;
              }
            }
            const consultRes = await pool.query(
              'SELECT id, type, status, ai_record_data, reason, created_at FROM consultations WHERE farmer_id = $1 AND vet_id = $2 ORDER BY id DESC LIMIT 1',
              [conv.farmer_id, conv.vet_id]
            );
            conv.latest_consultation = consultRes.rows[0] || null;
          } catch (cErr) {
            console.warn('Could not query extra conversation details:', cErr.message);
          }
          return res.status(200).json(conv);
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
        }
      }

      if (!fId) {
        return res.status(400).json({ error: 'Valid farmerId or farmerName is required' });
      }

      if (!vetId) {
        return res.status(400).json({ error: 'Valid vetId is required' });
      }

      const safeVetId = vetId;

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
        const vetRes = await pool.query('SELECT full_name, phone_number, consultation_mode FROM users WHERE id = $1', [safeVetId]);
        if (vetRes.rows.length > 0) {
          conv.vet_consultation_mode = vetRes.rows[0].consultation_mode || 'Chat + Video';
          conv.vet_phone = vetRes.rows[0].phone_number;
        }
        const farmerRes = await pool.query('SELECT full_name, phone_number FROM users WHERE id = $1', [fId]);
        if (farmerRes.rows.length > 0) {
          conv.farmer_phone = farmerRes.rows[0].phone_number;
        }
        const consultRes = await pool.query(
          'SELECT id, type, status, ai_record_data, reason, created_at FROM consultations WHERE farmer_id = $1 AND vet_id = $2 ORDER BY id DESC LIMIT 1',
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
  router.post('/api/chat/message', async (req, res, next) => {
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
        // Pass request to next handler (AI Chatbot) if not a consultation message
        if (typeof next === 'function') {
          return next();
        }
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

  // Resolve a Conversation / Consultation Case
  router.put('/api/chat/conversation/resolve', async (req, res) => {
    try {
      const { conversationId, consultationId, outcome, dischargeNotes, followUpDays } = req.body;
      if (!conversationId) {
        return res.status(400).json({ error: 'conversationId is required' });
      }

      // Calculate optional follow-up timestamp
      const followUpTimestamp = followUpDays ? new Date(Date.now() + Number(followUpDays) * 24 * 60 * 60 * 1000) : null;

      // 1. If a specific consultationId is passed, mark ONLY that specific consultation completed
      if (consultationId) {
        await pool.query(
          `UPDATE consultations
           SET status = 'completed',
               outcome = COALESCE($2, outcome, 'fully_recovered'),
               discharge_notes = COALESCE($3, discharge_notes),
               follow_up_date = COALESCE($4, follow_up_date),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [consultationId, outcome || null, dischargeNotes || null, followUpTimestamp]
        );
      } else {
        // Fallback: resolve only the single most recent active consultation between these two users
        await pool.query(
          `UPDATE consultations
           SET status = 'completed',
               outcome = COALESCE($2, outcome, 'fully_recovered'),
               discharge_notes = COALESCE($3, discharge_notes),
               follow_up_date = COALESCE($4, follow_up_date),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = (
             SELECT id FROM consultations
             WHERE farmer_id = (SELECT farmer_id FROM conversations WHERE id = $1)
               AND vet_id = (SELECT vet_id FROM conversations WHERE id = $1)
               AND status IN ('pending', 'approved')
             ORDER BY created_at DESC
             LIMIT 1
           )`,
          [conversationId, outcome || null, dischargeNotes || null, followUpTimestamp]
        );
      }

      // 2. Check if there are any remaining pending or approved consultations between this farmer and vet
      const activeRemaining = await pool.query(
        `SELECT COUNT(*) as count FROM consultations
         WHERE farmer_id = (SELECT farmer_id FROM conversations WHERE id = $1)
           AND vet_id = (SELECT vet_id FROM conversations WHERE id = $1)
           AND status IN ('pending', 'approved')`,
        [conversationId]
      );

      const allResolved = parseInt(activeRemaining.rows[0]?.count || '0', 10) === 0;

      // 3. Only mark the whole conversation thread as resolved if NO other active consultations remain
      if (allResolved) {
        await pool.query(
          `UPDATE conversations
           SET status = 'resolved'
           WHERE id = $1`,
          [conversationId]
        );
      }

      // 4. Real-time signaling
      if (io) {
        io.to(conversationId.toString()).emit('consultation_resolved', {
          conversationId: Number(conversationId),
          consultationId: consultationId ? Number(consultationId) : null,
          outcome: outcome || 'fully_recovered',
          allResolved
        });
      }

      res.status(200).json({
        message: 'Consultation marked as resolved',
        consultationId,
        outcome: outcome || 'fully_recovered',
        allResolved
      });
    } catch (err) {
      console.error('Error resolving conversation:', err.message);
      res.status(500).json({ error: 'Server error resolving conversation' });
    }
  });

  // Submit Farmer Rating & Review for a Consultation
  router.post('/api/consultations/:id/rating', async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, review } = req.body;

      const numRating = Number(rating);
      if (!numRating || numRating < 1 || numRating > 5) {
        return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
      }

      // Update consultation record
      const consultRes = await pool.query(
        `UPDATE consultations
         SET rating = $1, review = $2, rating_date = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING vet_id`,
        [numRating, (review || '').trim(), id]
      );

      if (consultRes.rows.length === 0) {
        return res.status(404).json({ error: 'Consultation not found' });
      }

      const vetId = consultRes.rows[0].vet_id;
      if (vetId) {
        // Recalculate average rating and total reviews for the vet
        const stats = await pool.query(
          `SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(rating) as total_reviews
           FROM consultations
           WHERE vet_id = $1 AND rating IS NOT NULL`,
          [vetId]
        );

        const newAvg = stats.rows[0]?.avg_rating || 5.0;
        const total = stats.rows[0]?.total_reviews || 1;

        await pool.query(
          `UPDATE users
           SET avg_rating = $1, total_reviews = $2
           WHERE id = $3`,
          [newAvg, total, vetId]
        );
      }

      res.status(200).json({
        success: true,
        message: 'Rating and review submitted successfully'
      });
    } catch (err) {
      console.error('Error submitting consultation rating:', err.message);
      res.status(500).json({ error: 'Server error saving rating' });
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
