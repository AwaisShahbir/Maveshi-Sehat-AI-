const express = require('express');
const router = express.Router();
const { sendNotification } = require('../services/notificationService');

module.exports = (pool, io) => {
  // Vet Directory
  router.get('/api/vets', async (req, res) => {
    try {
      const { district, ownerName } = req.query;
      let query = "SELECT id, full_name, district, specialization, experience_years, status FROM users WHERE role = 'vet' AND status = 'verified'";
      const params = [];

      if (district) {
        query += " AND district ILIKE $1";
        params.push(district);
      } else if (ownerName) {
        const ownerRes = await pool.query("SELECT district FROM users WHERE full_name ILIKE $1 AND role = 'farmer'", [ownerName]);
        if (ownerRes.rows.length > 0 && ownerRes.rows[0].district) {
          query += " AND district ILIKE $1";
          params.push(ownerRes.rows[0].district);
        }
      }

      const result = await pool.query(query, params);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching vets:', err.message);
      res.status(500).json({ error: 'Failed to fetch veterinarians' });
    }
  });

  // GET Vet Profile
  router.get('/api/vet/profile', async (req, res) => {
    try {
      const { vetId } = req.query;
      if (!vetId) {
        return res.status(400).json({ error: 'vetId parameter is required' });
      }
      const result = await pool.query(
        `SELECT id, full_name, email, phone_number, district, role, status,
                specialization, experience_years, pvmc_number, license_document_url,
                availability_schedule, consultation_mode
         FROM users WHERE id = $1 AND role = 'vet'`,
        [parseInt(vetId)]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vet profile not found.' });
      }

      const vet = result.rows[0];

      // Dynamic stats
      const casesRes = await pool.query(
        `SELECT COUNT(*) FROM consultations WHERE vet_id = $1`,
        [parseInt(vetId)]
      );
      const casesCount = parseInt(casesRes.rows[0].count) || 0;

      const prescriptionsRes = await pool.query(
        `SELECT COUNT(*) FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE c.vet_id = $1 AND m.is_prescription = true`,
        [parseInt(vetId)]
      );
      const prescriptionsCount = parseInt(prescriptionsRes.rows[0].count) || 0;

      res.status(200).json({
        id: vet.id,
        fullName: vet.full_name,
        email: vet.email,
        phoneNumber: vet.phone_number,
        district: vet.district,
        specialization: vet.specialization || '',
        experienceYears: vet.experience_years || 0,
        pvmcNumber: vet.pvmc_number || '',
        licenseDocumentUrl: vet.license_document_url || '',
        availabilitySchedule: vet.availability_schedule || '',
        consultationMode: vet.consultation_mode || 'Chat + Video',
        status: vet.status,
        stats: {
          cases: casesCount,
          prescriptions: prescriptionsCount
        }
      });
    } catch (err) {
      console.error('Error fetching vet profile:', err.message);
      res.status(500).json({ error: 'Failed to fetch vet profile.' });
    }
  });

  // UPDATE Vet Profile
  router.put('/api/vet/profile', async (req, res) => {
    try {
      const { vetId, fullName, email, phoneNumber, district, specialization,
              experienceYears, pvmcNumber, availabilitySchedule, consultationMode } = req.body;
      if (!vetId) {
        return res.status(400).json({ error: 'vetId is required' });
      }

      const result = await pool.query(
        `UPDATE users SET
          full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          phone_number = COALESCE($3, phone_number),
          district = COALESCE($4, district),
          specialization = COALESCE($5, specialization),
          experience_years = COALESCE($6, experience_years),
          pvmc_number = COALESCE($7, pvmc_number),
          availability_schedule = $8,
          consultation_mode = $9
        WHERE id = $10 AND role = 'vet'
        RETURNING id, full_name, email, phone_number, district, specialization,
                  experience_years, pvmc_number, availability_schedule, consultation_mode, status`,
        [
          fullName || null, email || null, phoneNumber || null, district || null,
          specialization || null, experienceYears ? parseInt(experienceYears) : null,
          pvmcNumber || null, availabilitySchedule || null,
          consultationMode || 'Chat + Video', parseInt(vetId)
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vet not found.' });
      }

      const vet = result.rows[0];
      res.status(200).json({
        message: 'Profile updated successfully!',
        profile: {
          id: vet.id,
          fullName: vet.full_name,
          email: vet.email,
          phoneNumber: vet.phone_number,
          district: vet.district,
          specialization: vet.specialization || '',
          experienceYears: vet.experience_years || 0,
          pvmcNumber: vet.pvmc_number || '',
          availabilitySchedule: vet.availability_schedule || '',
          consultationMode: vet.consultation_mode || 'Chat + Video',
          status: vet.status
        }
      });
    } catch (err) {
      console.error('Error updating vet profile:', err.message);
      res.status(500).json({ error: 'Failed to update vet profile.' });
    }
  });

  // Get Vet Consultations
  router.get('/api/consultations/vet/:id', async (req, res) => {
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
                u.full_name as farmer_name, u.phone_number as farmer_phone
         FROM consultations c 
         JOIN users u ON c.farmer_id = u.id 
         LEFT JOIN conversations conversation
           ON conversation.farmer_id = c.farmer_id
          AND conversation.vet_id = c.vet_id
         WHERE c.vet_id = $1 ORDER BY c.created_at DESC`,
        [req.params.id]
      );
      res.json({ success: true, consultations: result.rows });
    } catch (err) {
      console.error('Error fetching vet consultations:', err);
      res.status(500).json({ error: 'Failed to fetch consultations' });
    }
  });

  // Update Consultation Status
  router.put('/api/consultations/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const result = await pool.query(
        `UPDATE consultations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [status, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Consultation not found' });
      }

      const consultation = result.rows[0];
      if (status === 'completed') {
        await pool.query(
          `UPDATE conversations
           SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
           WHERE farmer_id = $1
             AND vet_id = $2
             AND NOT EXISTS (
               SELECT 1
               FROM consultations
               WHERE farmer_id = $1
                 AND vet_id = $2
                 AND status IN ('pending', 'approved')
             )`,
          [consultation.farmer_id, consultation.vet_id]
        );
      } else if (status === 'approved') {
        await pool.query(
          `UPDATE conversations
           SET status = 'active', updated_at = CURRENT_TIMESTAMP
           WHERE farmer_id = $1 AND vet_id = $2`,
          [consultation.farmer_id, consultation.vet_id]
        );
      }

      // Notify farmer about consultation status update
      try {
        const vetRes = await pool.query('SELECT full_name FROM users WHERE id = $1', [consultation.vet_id]);
        const vetName = vetRes.rows[0]?.full_name || 'Veterinarian';

        let titleEn = 'Consultation Update';
        let titleUr = 'مشاورت کی اپ ڈیٹ';
        let messageEn = `Your consultation status is now ${status}.`;
        let messageUr = `آپ کی مشاورت کی صورتحال اب ${status} ہے۔`;

        if (status === 'approved') {
          titleEn = 'Consultation Approved';
          titleUr = 'مشاورت منظور ہو گئی';
          messageEn = `Dr. ${vetName} has accepted your consultation request.`;
          messageUr = `ڈاکٹر ${vetName} نے آپ کی مشاورت کی درخواست منظور کر لی ہے۔`;
        } else if (status === 'rejected') {
          titleEn = 'Consultation Declined';
          titleUr = 'مشاورت منسوخ';
          messageEn = `Dr. ${vetName} was unable to accept your consultation request.`;
          messageUr = `ڈاکٹر ${vetName} آپ کی مشاورت قبول نہیں کر سکے۔`;
        } else if (status === 'completed') {
          titleEn = 'Consultation Completed';
          titleUr = 'مشاورت مکمل';
          messageEn = `Your consultation with Dr. ${vetName} has been completed.`;
          messageUr = `ڈاکٹر ${vetName} کے ساتھ آپ کی مشاورت مکمل ہو گئی ہے۔`;
        }

        await sendNotification({
          pool,
          io,
          userId: consultation.farmer_id,
          type: 'consultation',
          title_en: titleEn,
          title_ur: titleUr,
          message_en: messageEn,
          message_ur: messageUr,
          data: {
            consultationId: consultation.id,
            status,
            targetScreen: 'MyConsultations'
          }
        });
      } catch (notifErr) {
        console.error('Failed to notify farmer about consultation status:', notifErr.message);
      }

      res.json({ success: true, consultation: result.rows[0] });
    } catch (err) {
      console.error('Error updating consultation status:', err);
      res.status(500).json({ error: 'Failed to update consultation' });
    }
  });

  // Get Vet Prescriptions
  router.get('/api/vet/prescriptions', async (req, res) => {
    try {
      const { vetId, vetName } = req.query;
      let query = `
        SELECT m.*, u.full_name as farmer_name
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        JOIN users u ON c.farmer_id = u.id
        WHERE m.is_prescription = true
      `;
      const params = [];
      if (vetId) {
        query += ` AND c.vet_id = $1`;
        params.push(vetId);
      } else if (vetName) {
        const vetRes = await pool.query("SELECT id FROM users WHERE full_name ILIKE $1 AND role = 'vet'", [vetName]);
        if (vetRes.rows.length === 0) return res.status(200).json([]);
        query += ` AND c.vet_id = $1`;
        params.push(vetRes.rows[0].id);
      }
      query += ` ORDER BY m.created_at DESC`;
      const result = await pool.query(query, params);
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Server error fetching prescriptions' });
    }
  });

  // Search Farmers for Prescription Form
  router.get('/api/vet/farmers', async (req, res) => {
    try {
      const { vetId, search } = req.query;
      const normalizedSearch = String(search || '').trim();
      if (!vetId) {
        return res.status(400).json({ error: 'vetId is required' });
      }
      if (normalizedSearch.length < 2) {
        return res.json({ farmers: [] });
      }

      const result = await pool.query(
        `SELECT id, full_name, phone_number, district
         FROM users
         WHERE role = 'farmer'
           AND full_name ILIKE $1
           AND (
             EXISTS (
               SELECT 1
               FROM conversations c
               WHERE c.farmer_id = users.id AND c.vet_id = $2
             )
             OR EXISTS (
               SELECT 1
               FROM consultations consultation
               WHERE consultation.farmer_id = users.id AND consultation.vet_id = $2
             )
           )
         ORDER BY full_name ASC
         LIMIT 10`,
        [`%${normalizedSearch}%`, vetId]
      );
      res.json({ farmers: result.rows });
    } catch (err) {
      console.error('Error fetching farmers for prescription form:', err);
      res.status(500).json({ error: 'Failed to fetch farmers' });
    }
  });

  // Create Vet Prescription
  router.post('/api/vet/prescriptions', async (req, res) => {
    try {
      const { vetId, vetName, farmerId, farmerName, animal, diagnosis, diagnosisUrdu, medicines, notes } = req.body;
      if ((!farmerId && !farmerName) || !diagnosis) {
        return res.status(400).json({ error: 'Farmer and diagnosis are required' });
      }

      let resolvedVetId = vetId;
      if (!resolvedVetId && vetName) {
        const vetRes = await pool.query("SELECT id FROM users WHERE full_name ILIKE $1 AND role = 'vet'", [vetName]);
        if (vetRes.rows.length === 0) return res.status(404).json({ error: 'Vet not found' });
        resolvedVetId = vetRes.rows[0].id;
      }
      if (!resolvedVetId) return res.status(400).json({ error: 'vetId or vetName is required' });

      const farmerRes = farmerId
        ? await pool.query("SELECT id, full_name FROM users WHERE id = $1 AND role = 'farmer'", [farmerId])
        : await pool.query("SELECT id, full_name FROM users WHERE full_name ILIKE $1 AND role = 'farmer'", [farmerName.trim()]);
      if (farmerRes.rows.length === 0) {
        return res.status(404).json({ error: 'Farmer not found. Select a registered farmer and try again.' });
      }
      const resolvedFarmerId = farmerRes.rows[0].id;

      let convRes = await pool.query(
        'SELECT * FROM conversations WHERE farmer_id = $1 AND vet_id = $2',
        [resolvedFarmerId, resolvedVetId]
      );
      if (convRes.rows.length === 0) {
        convRes = await pool.query(
          "INSERT INTO conversations (farmer_id, vet_id, status) VALUES ($1, $2, 'active') RETURNING *",
          [resolvedFarmerId, resolvedVetId]
        );
      }
      const conversationId = convRes.rows[0].id;

      const prescriptionData = {
        diagnosis: diagnosis,
        diagnosisUrdu: diagnosisUrdu || '',
        animal: animal || '',
        medicines: (medicines || []).map(m => ({
          name: m.name,
          dosage: m.dose || m.dosage || '',
          frequency: m.frequency || '',
          duration: m.days ? `${m.days} days` : (m.duration || '')
        })),
        notes: notes || '',
        createdAt: new Date().toISOString()
      };

      const result = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, message, is_prescription, prescription_data)
         VALUES ($1, $2, $3, true, $4) RETURNING *`,
        [
          conversationId,
          resolvedVetId,
          `Prescription: ${diagnosis}`,
          JSON.stringify(prescriptionData)
        ]
      );
      const createdPrescription = result.rows[0];

      // Notify farmer of new prescription
      try {
        const convRes = await pool.query('SELECT farmer_id FROM conversations WHERE id = $1', [conversationId]);
        if (convRes.rows.length > 0 && convRes.rows[0].farmer_id) {
          const farmerId = convRes.rows[0].farmer_id;
          const vetRes = await pool.query('SELECT full_name FROM users WHERE id = $1', [resolvedVetId]);
          const vetName = vetRes.rows[0]?.full_name || 'Veterinarian';

          await sendNotification({
            pool,
            io,
            userId: farmerId,
            type: 'prescription',
            title_en: 'New Prescription Issued',
            title_ur: 'نیا نسخہ جاری کیا گیا',
            message_en: `Dr. ${vetName} issued a new prescription for your animal.`,
            message_ur: `ڈاکٹر ${vetName} نے آپ کے جانور کے لیے دوا تجویز کی ہے۔`,
            data: {
              conversationId,
              prescriptionId: createdPrescription.id,
              targetScreen: 'Chat'
            }
          });
        }
      } catch (notifErr) {
        console.error('Failed to notify farmer of prescription:', notifErr.message);
      }

      res.status(201).json({ success: true, prescription: createdPrescription });
    } catch (err) {
      console.error('Error creating prescription:', err);
      res.status(500).json({ error: 'Failed to create prescription' });
    }
  });

  // Delete Prescription
  router.delete('/api/vet/prescriptions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('UPDATE messages SET is_prescription = false WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Prescription not found' });
      }
      res.status(200).json({ success: true, message: 'Prescription deleted successfully' });
    } catch (err) {
      console.error('Error deleting prescription:', err);
      res.status(500).json({ error: 'Failed to delete prescription' });
    }
  });

  return router;
};
