const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { sendNotification } = require('../services/notificationService');
const { persistUploadedFile } = require('../utils/fileStore');

module.exports = (pool, io) => {
  // Vet Directory
  router.get('/api/vets', async (req, res) => {
    try {
      const { district, ownerName } = req.query;
      let query = "SELECT id, full_name, district, specialization, experience_years, status, consultation_mode FROM users WHERE role = 'vet' AND status = 'verified'";
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
                c.status as status,
                u.full_name as farmer_name,
                u.phone_number as farmer_phone,
                u.district as farmer_district,
                conv.id as conversation_id
         FROM consultations c 
         JOIN users u ON c.farmer_id = u.id 
         LEFT JOIN conversations conv ON conv.consultation_id = c.id
         WHERE c.vet_id = $1 ORDER BY c.created_at DESC`,
        [req.params.id]
      );
      res.json({ success: true, consultations: result.rows });
    } catch (err) {
      console.error('Error fetching vet consultations:', err);
      res.status(500).json({ error: 'Failed to fetch consultations' });
    }
  });

  // Verify Farmer Payment for Consultation (Sets paid + approved, records Rs. 30 admin commission)
  router.put('/api/consultations/:id/verify-payment', async (req, res) => {
    try {
      const consultId = req.params.id;
      const consultRes = await pool.query('SELECT * FROM consultations WHERE id = $1', [consultId]);
      if (consultRes.rows.length === 0) {
        return res.status(404).json({ error: 'Consultation not found' });
      }

      const consultation = consultRes.rows[0];
      const adminCommission = parseFloat(consultation.admin_commission) || 75.00;

      // 1. Mark consultation as paid and approved
      const updatedRes = await pool.query(
        `UPDATE consultations
         SET payment_status = 'paid',
             status = 'approved',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [consultId]
      );
      const updatedConsultation = updatedRes.rows[0];

      // 2. Increment vet's commission debt to admin (25% platform commission = Rs. 75)
      if (consultation.vet_id) {
        await pool.query(
          `UPDATE users
           SET commission_due = COALESCE(commission_due, 0) + $1
           WHERE id = $2`,
          [adminCommission, consultation.vet_id]
        );
      }

      // 3. Ensure conversation for this consultation is active
      const convCheck = await pool.query(
        'SELECT id FROM conversations WHERE consultation_id = $1',
        [consultId]
      );
      if (convCheck.rows.length === 0) {
        await pool.query(
          "INSERT INTO conversations (farmer_id, vet_id, consultation_id, status) VALUES ($1, $2, $3, 'active')",
          [consultation.farmer_id, consultation.vet_id, consultId]
        );
      } else {
        await pool.query(
          "UPDATE conversations SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE consultation_id = $1",
          [consultId]
        );
      }

      if (io) {
        io.emit('consultation_updated', updatedConsultation);
      }

      // Notify Farmer that consultation is approved & payment verified
      try {
        const vetRes = await pool.query('SELECT full_name FROM users WHERE id = $1', [consultation.vet_id]);
        const vetName = vetRes.rows[0]?.full_name || 'Veterinarian';

        await sendNotification({
          pool,
          io,
          userId: consultation.farmer_id,
          type: 'consultation',
          title_en: 'Payment Verified & Consultation Approved',
          title_ur: 'فیس تصدیق شدہ اور مشاورت منظور',
          message_en: `Dr. ${vetName} has confirmed your Rs. 300 payment! Video call, audio call, and chat are now unlocked.`,
          message_ur: `ڈاکٹر ${vetName} نے آپ کی 300 روپے کی فیس کی تصدیق کر لی ہے۔ اب آپ ویڈیو کال، آڈیو کال اور چیٹ کر سکتے ہیں۔`,
          data: {
            consultationId: consultation.id,
            status: 'approved',
            targetScreen: 'MyConsultations'
          }
        });
      } catch (notifErr) {
        console.error('Failed to notify farmer of payment verification:', notifErr.message);
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified and consultation approved successfully.',
        consultation: updatedConsultation
      });
    } catch (err) {
      console.error('Error verifying consultation payment:', err);
      res.status(500).json({ error: 'Failed to verify consultation payment' });
    }
  });

  // Reject Farmer Payment for Consultation
  router.put('/api/consultations/:id/reject-payment', async (req, res) => {
    try {
      const consultId = req.params.id;
      const { rejectionReason } = req.body;

      const updatedRes = await pool.query(
        `UPDATE consultations
         SET payment_status = 'rejected',
             status = 'rejected',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [consultId]
      );

      if (updatedRes.rows.length === 0) {
        return res.status(404).json({ error: 'Consultation not found' });
      }

      const updatedConsultation = updatedRes.rows[0];

      if (io) {
        io.emit('consultation_updated', updatedConsultation);
      }

      // Notify Farmer about rejected payment proof
      try {
        const vetRes = await pool.query('SELECT full_name FROM users WHERE id = $1', [updatedConsultation.vet_id]);
        const vetName = vetRes.rows[0]?.full_name || 'Veterinarian';

        await sendNotification({
          pool,
          io,
          userId: updatedConsultation.farmer_id,
          type: 'consultation',
          title_en: 'Payment Proof Rejected',
          title_ur: 'فیس کا ثبوت مسترد ہو گیا',
          message_en: `Dr. ${vetName} could not verify your payment proof. Please verify your TID or re-upload the receipt.`,
          message_ur: `ڈاکٹر ${vetName} نے آپ کا فیس ثبوت مسترد کر دیا ہے۔ برائے مہربانی درست رسید یا ٹرانزیکشن آئی ڈی دوبارہ بھیجیں۔`,
          data: {
            consultationId: updatedConsultation.id,
            status: 'rejected',
            targetScreen: 'MyConsultations'
          }
        });
      } catch (notifErr) {
        console.error('Failed to notify farmer of payment rejection:', notifErr.message);
      }

      res.status(200).json({
        success: true,
        message: 'Payment rejected',
        consultation: updatedConsultation
      });
    } catch (err) {
      console.error('Error rejecting consultation payment:', err);
      res.status(500).json({ error: 'Failed to reject payment' });
    }
  });

  // Get Vet Commission Status & Summary
  router.get('/api/vet/:id/commission-status', async (req, res) => {
    try {
      const vetId = parseInt(req.params.id);
      const userRes = await pool.query(
        `SELECT id, full_name, phone_number, email, consultation_fee,
                payment_wallet_type, payment_account_title, payment_account_number,
                commission_rate, commission_due, commission_paid
         FROM users WHERE id = $1 AND role = 'vet'`,
        [vetId]
      );

      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'Veterinarian not found' });
      }

      const vet = userRes.rows[0];

      const countsRes = await pool.query(
        `SELECT COUNT(*) as total_consultations,
                COUNT(CASE WHEN payment_status = 'paid' OR status IN ('approved', 'completed') THEN 1 END) as paid_consultations,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' OR status IN ('approved', 'completed') THEN fee ELSE 0 END), 0) as gross_earnings,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' OR status IN ('approved', 'completed') THEN admin_commission ELSE 0 END), 0) as total_admin_commission,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' OR status IN ('approved', 'completed') THEN vet_earnings ELSE 0 END), 0) as net_vet_earnings
         FROM consultations WHERE vet_id = $1`,
        [vetId]
      );

      const stats = countsRes.rows[0];

      res.status(200).json({
        vet: {
          id: vet.id,
          fullName: vet.full_name,
          phone: vet.phone_number,
          consultationFee: parseFloat(vet.consultation_fee) || 300.00,
          commissionRate: parseFloat(vet.commission_rate) || 25.00,
          commissionDue: parseFloat(vet.commission_due) || 0.00,
          commissionPaid: parseFloat(vet.commission_paid) || 0.00,
          paymentWalletType: vet.payment_wallet_type || 'JazzCash',
          paymentAccountTitle: vet.payment_account_title || '',
          paymentAccountNumber: vet.payment_account_number || '',
          adminJazzCashNumber: '03054758667'
        },
        stats: {
          totalConsultations: parseInt(stats.total_consultations) || 0,
          paidConsultations: parseInt(stats.paid_consultations) || 0,
          grossEarnings: parseFloat(stats.gross_earnings) || 0.00,
          totalAdminCommission: parseFloat(stats.total_admin_commission) || 0.00,
          netVetEarnings: parseFloat(stats.net_vet_earnings) || 0.00
        }
      });
    } catch (err) {
      console.error('Error fetching vet commission status:', err);
      res.status(500).json({ error: 'Server error fetching commission status' });
    }
  });

  // Submit Vet Commission Settlement Proof to Admin
  router.post('/api/vet/settlement-proof', async (req, res) => {
    try {
      const {
        vetId,
        vet_id,
        amount,
        senderPhone,
        sender_phone,
        transactionId,
        transaction_id,
        tid,
        paymentMethod,
        payment_method,
        proofImageBase64,
        proof_image_base64,
        proofImageUrl,
        proof_image_url
      } = req.body;

      const effectiveVetId = parseInt(vetId || vet_id);
      if (!effectiveVetId) {
        return res.status(400).json({ error: 'vetId is required' });
      }

      const effectiveAmount = parseFloat(amount);
      if (!effectiveAmount || effectiveAmount <= 0) {
        return res.status(400).json({ error: 'A valid settlement amount is required' });
      }

      const effectivePhone = (senderPhone || sender_phone || '').trim();
      const effectiveTid = (transactionId || transaction_id || tid || '').trim();
      if (!effectivePhone || !effectiveTid) {
        return res.status(400).json({ error: 'Sender phone and transaction ID (TID) are required' });
      }

      let finalProofUrl = proofImageUrl || proof_image_url || null;
      const b64 = proofImageBase64 || proof_image_base64;
      if (b64) {
        try {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileName = `vet-settlement-${effectiveVetId}-${uniqueSuffix}.jpg`;
          const uploadDir = path.join(__dirname, '..', 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const filePath = path.join(uploadDir, fileName);
          const cleanBase64 = b64.replace(/^data:image\/\w+;base64,/, '');
          fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));
          const host = req.get('host');
          const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
          finalProofUrl = `${protocol}://${host}/uploads/${fileName}`;
          await persistUploadedFile(pool, fileName, filePath, 'image/jpeg');
        } catch (proofErr) {
          console.warn('Vet settlement proof image save error:', proofErr.message);
        }
      }

      if (!finalProofUrl) {
        return res.status(400).json({ error: 'Receipt proof image is required' });
      }

      const vetRes = await pool.query('SELECT full_name FROM users WHERE id = $1', [effectiveVetId]);
      const vetName = vetRes.rows[0]?.full_name || 'Veterinarian';

      const insertRes = await pool.query(
        `INSERT INTO vet_commission_settlements (
           vet_id, vet_name, amount, payment_method, account_number, sender_phone,
           transaction_id, proof_image_url, status
         ) VALUES ($1, $2, $3, $4, '03054758667', $5, $6, $7, 'pending')
         RETURNING *`,
        [
          effectiveVetId,
          vetName,
          effectiveAmount,
          paymentMethod || payment_method || 'JazzCash',
          effectivePhone,
          effectiveTid,
          finalProofUrl
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Commission settlement proof submitted to Admin for verification.',
        settlement: insertRes.rows[0]
      });
    } catch (err) {
      console.error('Error submitting vet settlement proof:', err);
      res.status(500).json({ error: 'Server error submitting settlement proof' });
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
           WHERE consultation_id = $1`,
          [consultation.id]
        );
      } else if (status === 'approved') {
        const convCheck = await pool.query(
          'SELECT id FROM conversations WHERE consultation_id = $1',
          [consultation.id]
        );
        if (convCheck.rows.length === 0) {
          await pool.query(
            "INSERT INTO conversations (farmer_id, vet_id, consultation_id, status) VALUES ($1, $2, $3, 'active')",
            [consultation.farmer_id, consultation.vet_id, consultation.id]
          );
        } else {
          await pool.query(
            "UPDATE conversations SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE consultation_id = $1",
            [consultation.id]
          );
        }
      }

      if (io) {
        io.emit('consultation_updated', consultation);
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
          messageEn = `Dr. ${vetName} has accepted your consultation request. You can now chat!`;
          messageUr = `ڈاکٹر ${vetName} نے آپ کی مشاورت کی درخواست منظور کر لی ہے۔ اب آپ چیٹ کر سکتے ہیں۔`;
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
            status: status,
            targetScreen: 'MyConsultations'
          }
        });
      } catch (notifErr) {
        console.error('Failed to notify farmer of consultation status update:', notifErr.message);
      }

      res.status(200).json({ success: true, consultation });
    } catch (err) {
      console.error('Error updating consultation status:', err);
      res.status(500).json({ error: 'Failed to update consultation status' });
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
      if ((!farmerId && !farmerName) || !diagnosis || typeof diagnosis !== 'string' || diagnosis.trim().length < 2) {
        return res.status(400).json({ error: 'A valid farmer and clinical diagnosis (minimum 2 characters) are required.' });
      }

      if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
        return res.status(400).json({ error: 'At least one medicine must be added to the prescription.' });
      }

      const validMedicines = medicines.filter(m => m && typeof m.name === 'string' && m.name.trim().length > 0);
      if (validMedicines.length === 0) {
        return res.status(400).json({ error: 'Please enter a valid medicine name.' });
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
