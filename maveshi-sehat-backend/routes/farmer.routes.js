const express = require('express');
const router = express.Router();

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 31536000);

  if (interval >= 1) return interval === 1 ? '1 year ago' : `${interval} years ago`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval === 1 ? '1 month ago' : `${interval} months ago`;
  interval = Math.floor(seconds / 604800);
  if (interval >= 1) return interval === 1 ? '1 week ago' : `${interval} weeks ago`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval === 1 ? '1 day ago' : `${interval} days ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  return 'just now';
}

const { sendNotification } = require('../services/notificationService');

module.exports = (pool, io) => {
  // Farmer Dashboard Stats
  router.get('/api/dashboard-stats', async (req, res) => {
    try {
      const { ownerName } = req.query;
      if (!ownerName) {
        return res.status(400).json({ error: 'ownerName parameter is required' });
      }

      const totalScansRes = await pool.query(
        'SELECT COUNT(*) FROM detections WHERE owner_name ILIKE $1',
        [ownerName]
      );
      const aiScans = parseInt(totalScansRes.rows[0].count) || 0;

      const healthyScansRes = await pool.query(
        "SELECT COUNT(*) FROM detections WHERE owner_name ILIKE $1 AND disease IN ('Healthy', 'BCS Normal')",
        [ownerName]
      );
      const healthyCount = parseInt(healthyScansRes.rows[0].count) || 0;

      const healthyPercentage = aiScans > 0 ? Math.round((healthyCount / aiScans) * 100) : 0;

      const distinctAnimalsRes = await pool.query(
        'SELECT COUNT(DISTINCT animal_type) FROM detections WHERE owner_name ILIKE $1',
        [ownerName]
      );
      const livestock = parseInt(distinctAnimalsRes.rows[0].count) || 0;

      const recentScansRes = await pool.query(
        'SELECT * FROM detections WHERE owner_name ILIKE $1 ORDER BY created_at DESC LIMIT 5',
        [ownerName]
      );

      const recentScans = recentScansRes.rows.map((row) => {
        let severity = 'Low';
        let icon = 'check-circle';
        let color = '#4CB85C';
        let bg = '#E8F8EA';

        if (row.risk_level === 'High') {
          severity = 'High';
          icon = 'alert-circle';
          color = '#FF4D4D';
          bg = '#FFEBEB';
        } else if (row.risk_level === 'Medium') {
          severity = 'Medium';
          icon = 'alert-triangle';
          color = '#FFB020';
          bg = '#FFF5E5';
        }

        let displayTitle = row.disease;
        if (row.disease === 'LSD') displayTitle = 'Lumpy Skin Disease';
        else if (row.disease === 'FMD') displayTitle = 'Foot & Mouth Disease';
        else if (row.disease === 'BCS Normal') displayTitle = 'Healthy (BCS Normal)';

        const timeDiff = getTimeAgo(row.created_at);

        return {
          id: row.id,
          title: displayTitle,
          time: timeDiff,
          percentage: Math.round(row.confidence),
          severity,
          icon,
          color,
          bg
        };
      });

      res.status(200).json({
        stats: {
          livestock,
          aiScans,
          healthy: healthyPercentage
        },
        recentScans
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err.message);
      res.status(500).json({ error: 'Server error fetching dashboard stats' });
    }
  });

  // Get Detections by Owner
  router.get('/api/detections', async (req, res) => {
    try {
      const { ownerName } = req.query;
      if (!ownerName) {
        return res.status(400).json({ error: 'ownerName parameter is required' });
      }
      const result = await pool.query(
        'SELECT * FROM detections WHERE owner_name ILIKE $1 ORDER BY created_at DESC',
        [ownerName]
      );

      const records = result.rows.map(row => {
        const isHealthy = row.disease === 'Healthy' || row.disease === 'BCS Normal';
        let severityColor = '#4CB85C';
        let severityBg = '#E8F8EA';
        if (row.risk_level === 'High') {
          severityColor = '#FF4D4D';
          severityBg = '#FFEBEB';
        } else if (row.risk_level === 'Medium') {
          severityColor = '#FFB020';
          severityBg = '#FFF5E5';
        }

        return {
          id: row.id,
          animalId: row.id,
          animalType: row.animal_type,
          disease: row.disease,
          diseaseUrdu: row.disease_urdu || (isHealthy ? 'صحت مند' : row.disease),
          confidence: row.confidence ? `${parseFloat(row.confidence).toFixed(1)}%` : '0%',
          timeAgo: 'Just now',
          date: new Date(row.created_at).toLocaleString(),
          risk: row.risk_level === 'High' ? 'High Risk' : (row.risk_level === 'Medium' ? 'Medium Risk' : 'Low Risk'),
          status: row.status || (isHealthy ? 'Healthy' : 'Active'),
          icon: isHealthy ? 'check-circle' : (row.risk_level === 'High' ? 'alert-circle' : 'trending-up'),
          color: severityColor,
          bg: severityBg,
          uri: row.image_url || 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=400&auto=format&fit=crop',
          description: row.description || '',
          firstAid: row.first_aid || []
        };
      });

      res.status(200).json(records);
    } catch (err) {
      console.error('Error fetching detections:', err.message);
      res.status(500).json({ error: 'Server error fetching detections' });
    }
  });

  // Save Animal Detection
  router.post('/api/detections', async (req, res) => {
    try {
      const {
        id, ownerName, animalType, disease, diseaseUrdu, confidence,
        riskLevel, imageUrl, description, firstAid, province
      } = req.body;

      if (!id || !ownerName || !animalType || !disease) {
        return res.status(400).json({ error: 'Missing required parameters (id, ownerName, animalType, disease)' });
      }

      const existing = await pool.query('SELECT * FROM detections WHERE id = $1', [id]);
      if (existing.rows.length > 0) {
        return res.status(200).json({ message: 'Record already exists', record: existing.rows[0] });
      }

      const result = await pool.query(
        `INSERT INTO detections (
          id, owner_name, animal_type, disease, confidence, risk_level, 
          image_url, description, first_aid, disease_urdu, province, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          id,
          ownerName,
          animalType,
          disease,
          confidence || 0,
          riskLevel || 'Low',
          imageUrl || null,
          description || null,
          firstAid || [],
          diseaseUrdu || null,
          province || 'Punjab',
          disease === 'Healthy' ? 'Healthy' : 'Active'
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error saving detection:', err.message);
      res.status(500).json({ error: 'Server error saving detection' });
    }
  });

  // Create Consultation Request
  router.post('/api/consultations', async (req, res) => {
    try {
      const { farmer_id, vet_id, type, ai_record_data, appointment_date, reason } = req.body;

      if (!farmer_id || !vet_id || !type) {
        return res.status(400).json({ error: 'farmer_id, vet_id, and type are required' });
      }

      const result = await pool.query(
        `INSERT INTO consultations (farmer_id, vet_id, type, ai_record_data, appointment_date, reason)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [farmer_id, vet_id, type, ai_record_data ? JSON.stringify(ai_record_data) : null, appointment_date, reason]
      );

      const createdConsultation = result.rows[0];

      // Notify Vet in real-time
      try {
        const farmerUser = await pool.query('SELECT full_name FROM users WHERE id = $1', [farmer_id]);
        const farmerName = farmerUser.rows[0]?.full_name || 'Farmer';

        await sendNotification({
          pool,
          io,
          userId: vet_id,
          type: 'consultation',
          title_en: 'New Consultation Request',
          title_ur: 'نئی مشاورت کی درخواست',
          message_en: `${farmerName} requested a consultation.`,
          message_ur: `${farmerName} نے معائنے کے لیے مشاورت کی درخواست کی ہے۔`,
          data: {
            consultationId: createdConsultation.id,
            farmerId: farmer_id,
            targetScreen: 'VetCases'
          }
        });
      } catch (notifErr) {
        console.error('Failed to notify vet for consultation:', notifErr.message);
      }

      res.status(201).json({ success: true, consultation: createdConsultation });
    } catch (err) {
      console.error('Error creating consultation:', err);
      res.status(500).json({ error: 'Failed to create consultation request' });
    }
  });

  // Get Farmer Consultations
  router.get('/api/consultations/farmer/:id', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT c.*,
                CASE
                  WHEN LOWER(TRIM(c.status)) = 'completed' THEN 'completed'
                  WHEN LOWER(TRIM(c.status)) = 'approved'
                    AND LOWER(TRIM(COALESCE(conversation.status, ''))) = 'resolved' THEN 'completed'
                  WHEN LOWER(TRIM(c.status)) = 'pending' THEN 'pending'
                  ELSE LOWER(TRIM(c.status))
                END AS status,
                conversation.status AS conversation_status,
                u.full_name as vet_name, u.specialization as vet_specialization
         FROM consultations c 
         JOIN users u ON c.vet_id = u.id 
         LEFT JOIN conversations conversation
           ON conversation.farmer_id = c.farmer_id
          AND conversation.vet_id = c.vet_id
         WHERE c.farmer_id = $1 ORDER BY c.created_at DESC`,
        [req.params.id]
      );
      res.json({ success: true, consultations: result.rows });
    } catch (err) {
      console.error('Error fetching farmer consultations:', err);
      res.status(500).json({ error: 'Failed to fetch consultations' });
    }
  });

  // Get Farmer Vaccinations
  router.get('/api/farmer/vaccinations', async (req, res) => {
    try {
      const { farmerId, farmerName } = req.query;
      let query = `
        SELECT m.*, u.full_name as vet_name
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        JOIN users u ON c.vet_id = u.id
        WHERE m.is_vaccination = true
      `;
      const params = [];
      if (farmerId) {
        query += ` AND c.farmer_id = $1`;
        params.push(farmerId);
      } else if (farmerName) {
        const fRes = await pool.query("SELECT id FROM users WHERE full_name ILIKE $1 AND role = 'farmer'", [farmerName]);
        if (fRes.rows.length === 0) return res.status(200).json([]);
        query += ` AND c.farmer_id = $1`;
        params.push(fRes.rows[0].id);
      }
      query += ` ORDER BY m.created_at DESC`;
      const result = await pool.query(query, params);
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Server error fetching vaccinations' });
    }
  });

  return router;
};
