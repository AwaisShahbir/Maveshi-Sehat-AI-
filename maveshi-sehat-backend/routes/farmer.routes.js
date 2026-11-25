const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { detectDiseaseFromImage } = require('../services/roboflowService');
const { persistUploadedFile } = require('../utils/fileStore');

const scanStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'scan-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const scanUpload = multer({ storage: scanStorage });

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

        const createdAtDate = row.created_at ? new Date(row.created_at) : new Date();
        const formattedDate = createdAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + createdAtDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

        let imageFullUrl = row.image_url;
        if (imageFullUrl && !imageFullUrl.startsWith('http')) {
          imageFullUrl = `https://maveshi-sehat-api.onrender.com${imageFullUrl.startsWith('/') ? '' : '/'}${imageFullUrl}`;
        }
        if (!imageFullUrl) {
          imageFullUrl = row.animal_type === 'Buffalo'
            ? 'https://images.unsplash.com/photo-1558024920-b41e1887dc32?q=80&w=400&auto=format&fit=crop'
            : 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=400&auto=format&fit=crop';
        }

        return {
          id: row.id,
          animalId: row.id,
          animalType: row.animal_type,
          disease: row.disease,
          diseaseUrdu: row.disease_urdu || (isHealthy ? 'صحت مند' : row.disease),
          confidence: row.confidence ? `${parseFloat(row.confidence).toFixed(1)}%` : '0%',
          timeAgo: formattedDate,
          date: formattedDate,
          risk: row.risk_level === 'High' ? 'High Risk' : (row.risk_level === 'Medium' ? 'Medium Risk' : 'Low Risk'),
          status: row.status || (isHealthy ? 'Healthy' : 'Active'),
          icon: isHealthy ? 'check-circle' : (row.risk_level === 'High' ? 'alert-circle' : 'trending-up'),
          color: severityColor,
          bg: severityBg,
          uri: imageFullUrl,
          imageUrl: imageFullUrl,
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
          province || null,
          disease === 'Healthy' ? 'Healthy' : 'Active'
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error saving detection:', err.message);
      res.status(500).json({ error: 'Server error saving detection' });
    }
  });

  // AI Disease Detection Scanner via Roboflow
  router.post('/api/ai/scan-disease', scanUpload.single('image'), async (req, res) => {
    try {
      const { animalType = 'Cow', ownerName = 'Farmer', province, animalId, userId } = req.body;

      // 1. Check User Subscription & Free Scan Allowance (Max 10 Free Scans)
      let effectiveUserId = userId;
      if (!effectiveUserId && ownerName && ownerName !== 'Farmer') {
        try {
          const uRes = await pool.query('SELECT id FROM users WHERE LOWER(full_name) = LOWER($1) LIMIT 1', [ownerName]);
          if (uRes.rows.length > 0) effectiveUserId = uRes.rows[0].id;
        } catch (findErr) {
          console.warn('User lookup warning in scan:', findErr.message);
        }
      }

      let userSubData = null;
      if (effectiveUserId) {
        try {
          const uRes = await pool.query(
            'SELECT id, scans_used, subscription_status, subscription_expires_at FROM users WHERE id = $1',
            [effectiveUserId]
          );
          if (uRes.rows.length > 0) {
            userSubData = uRes.rows[0];
            let status = userSubData.subscription_status || 'free';
            const scansUsed = parseInt(userSubData.scans_used, 10) || 0;

            if (status === 'active' && userSubData.subscription_expires_at && new Date(userSubData.subscription_expires_at) < new Date()) {
              status = 'expired';
              await pool.query('UPDATE users SET subscription_status = $1 WHERE id = $2', ['expired', effectiveUserId]);
            }

            if (status === 'pending_approval' && scansUsed >= 10) {
              return res.status(403).json({
                error: 'Your payment proof for Rs. 300 subscription is currently under review by Admin. Access will be unlocked as soon as verified.',
                limitReached: true,
                pendingApproval: true,
                scansUsed,
                maxFreeScans: 10
              });
            }

            if ((status === 'free' || status === 'expired') && scansUsed >= 10) {
              return res.status(403).json({
                error: 'You have exhausted your 10 free AI scans. Please upgrade to our Monthly Pro Plan (Rs. 300) for unlimited scans.',
                limitReached: true,
                requiresSubscription: true,
                scansUsed,
                maxFreeScans: 10
              });
            }
          }
        } catch (subErr) {
          console.warn('Subscription check warning in scan:', subErr.message);
        }
      }

      let imageFilePath = null;
      let publicImageUrl = null;

      const host = req.get('host');
      const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;

      if (req.file) {
        imageFilePath = req.file.path;
        publicImageUrl = `${baseUrl}/uploads/${req.file.filename}`;
        await persistUploadedFile(pool, req.file.filename, imageFilePath, req.file.mimetype);
      } else if (req.body.imageBase64) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileName = `scan-b64-${uniqueSuffix}.jpg`;
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        imageFilePath = path.join(uploadDir, fileName);
        const cleanBase64 = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(imageFilePath, Buffer.from(cleanBase64, 'base64'));
        publicImageUrl = `${baseUrl}/uploads/${fileName}`;
        await persistUploadedFile(pool, fileName, imageFilePath, 'image/jpeg');
      } else if (req.body.imageUrl) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileName = `scan-url-${uniqueSuffix}.jpg`;
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        imageFilePath = path.join(uploadDir, fileName);
        const axios = require('axios');
        const imageRes = await axios.get(req.body.imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
        fs.writeFileSync(imageFilePath, Buffer.from(imageRes.data));
        publicImageUrl = `${baseUrl}/uploads/${fileName}`;
        await persistUploadedFile(pool, fileName, imageFilePath, 'image/jpeg');
      } else {
        return res.status(400).json({ error: 'Please provide an image file, base64 image data, or imageUrl.' });
      }

      // Run Universal Two-Stage AI Multimodal Vision Disease Inference
      const diagnosis = await detectDiseaseFromImage(imageFilePath, 25, animalType);

      // If uploaded image is not livestock (e.g. keyboard, car, human face), return validation report
      if (diagnosis.isCattle === false) {
        const fullPublicImageUrl = publicImageUrl && !publicImageUrl.startsWith('http')
          ? `https://maveshi-sehat-api.onrender.com${publicImageUrl.startsWith('/') ? '' : '/'}${publicImageUrl}`
          : publicImageUrl;

        return res.status(200).json({
          success: true,
          diagnosis: {
            isCattle: false,
            detected: false,
            status: diagnosis.name,
            name: diagnosis.name,
            urdu: diagnosis.urdu,
            confidence: '0%',
            riskLevel: 'Low',
            severity: 'Invalid Image',
            severityColor: '#94A3B8',
            severityBg: '#F1F5F9',
            animalType: 'N/A',
            breed: 'N/A',
            description: diagnosis.description,
            firstAid: diagnosis.firstAid,
            firstAidUrdu: diagnosis.firstAidUrdu,
            imageUrl: fullPublicImageUrl
          }
        });
      }

      // Auto-detected animal species / breed from Vision AI
      const finalSpecies = diagnosis.animalType || req.body.animalType || 'Cow';

      // Assigned livestock ID (mandatory from user or ear-tag fallback)
      let assignedAnimalId = (animalId && typeof animalId === 'string' && animalId.trim().length > 0)
        ? animalId.trim()
        : `${finalSpecies.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      // Guard against primary key collision
      let recordId = assignedAnimalId;
      try {
        const existing = await pool.query('SELECT id FROM detections WHERE id = $1 LIMIT 1', [recordId]);
        if (existing.rows.length > 0) {
          const countRes = await pool.query('SELECT COUNT(*) FROM detections WHERE id LIKE $1', [`${assignedAnimalId}%`]);
          const seq = parseInt(countRes.rows[0].count, 10) + 1;
          recordId = `${assignedAnimalId}-${seq}`;
        }
      } catch (checkErr) {
        console.warn('Animal ID existence check warning:', checkErr.message);
      }

      // Insert record directly into database
      const insertQuery = `
        INSERT INTO detections (
          id, owner_name, animal_type, disease, confidence, risk_level,
          image_url, description, first_aid, disease_urdu, province, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `;

      const confNumber = parseFloat(diagnosis.confidence.replace('%', '')) || 0;
      const statusValue = diagnosis.detected ? (diagnosis.status.includes('Mastitis') ? 'Under Treatment' : 'Active') : 'Healthy';

      const dbRes = await pool.query(insertQuery, [
        recordId,
        ownerName,
        finalSpecies,
        diagnosis.status,
        confNumber,
        diagnosis.riskLevel,
        publicImageUrl,
        diagnosis.description,
        diagnosis.firstAid,
        diagnosis.urdu,
        province,
        statusValue
      ]);

      // Increment scans_used for user upon valid livestock diagnosis
      let currentScansUsed = (userSubData?.scans_used || 0);
      if (effectiveUserId) {
        try {
          const updateRes = await pool.query(
            'UPDATE users SET scans_used = COALESCE(scans_used, 0) + 1 WHERE id = $1 RETURNING scans_used',
            [effectiveUserId]
          );
          if (updateRes.rows.length > 0) {
            currentScansUsed = updateRes.rows[0].scans_used;
          }
        } catch (incErr) {
          console.warn('Could not increment scans_used:', incErr.message);
        }
      }

      // Emit realtime websocket event if IO is present
      if (io) {
        io.emit('new_detection', dbRes.rows[0]);
      }

      const fullPublicImageUrl = publicImageUrl && !publicImageUrl.startsWith('http')
        ? `https://maveshi-sehat-api.onrender.com${publicImageUrl.startsWith('/') ? '' : '/'}${publicImageUrl}`
        : publicImageUrl;

      res.status(200).json({
        success: true,
        record: dbRes.rows[0],
        scansUsed: currentScansUsed,
        maxFreeScans: 10,
        scansRemaining: Math.max(0, 10 - currentScansUsed),
        isUnlimited: userSubData?.subscription_status === 'active' || userSubData?.subscription_status === 'lifetime',
        diagnosis: {
          ...diagnosis,
          animalId: assignedAnimalId,
          recordId: recordId,
          imageUrl: fullPublicImageUrl
        }
      });
    } catch (err) {
      console.error('Scan Disease API Error:', err);
      res.status(500).json({ error: err.message || 'Error processing AI disease scan' });
    }
  });

  // Helper validator & normalizer for ISO / standard date strings
  function normalizeAppointmentDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const trimmed = dateStr.trim();
    // Match YYYY-MM-DD or YYYY-DD-MM with optional time
    const regex = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/;
    const match = trimmed.match(regex);
    if (!match) {
      const parsed = new Date(trimmed);
      return !isNaN(parsed.getTime()) ? parsed.toISOString() : null;
    }

    let y = parseInt(match[1], 10);
    let m = parseInt(match[2], 10);
    let d = parseInt(match[3], 10);
    let hh = match[4] !== undefined ? parseInt(match[4], 10) : 14;
    let mm = match[5] !== undefined ? parseInt(match[5], 10) : 30;
    let ss = match[6] !== undefined ? parseInt(match[6], 10) : 0;

    // Smart auto-correction: if user swapped month and day (e.g. 2026-30-12)
    if (m > 12 && d <= 12) {
      const temp = m;
      m = d;
      d = temp;
    }

    // Auto-advance past years (e.g. user typed 2024 instead of 2026)
    const currentYear = new Date().getFullYear();
    if (y < currentYear) {
      y = currentYear;
    }

    // Format single-digit afternoon hour (e.g. "2:30" => 14:30)
    if (hh >= 1 && hh <= 6) {
      hh += 12;
    }

    if (m < 1 || m > 12 || d < 1 || d > 31) return null;

    const pad = (n) => String(n).padStart(2, '0');
    return `${y}-${pad(m)}-${pad(d)} ${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  }

  // Create Consultation Request
  router.post('/api/consultations', async (req, res) => {
    try {
      const {
        farmer_id,
        farmerId,
        userId,
        vet_id,
        vetId,
        type,
        consultType,
        ai_record_data,
        appointment_date,
        appointmentDate,
        reason,
        farmer_name,
        farmerName,
        userName,
        phone,
        phoneNumber
      } = req.body;

      // 1. Resolve Farmer ID gracefully (never fail on missing ID)
      let resolvedFarmerId = parseInt(farmer_id || farmerId || userId, 10);
      if (isNaN(resolvedFarmerId) || !resolvedFarmerId) {
        const searchPhone = phone || phoneNumber;
        if (searchPhone) {
          const pRes = await pool.query('SELECT id FROM users WHERE phone_number = $1 LIMIT 1', [searchPhone.trim()]);
          if (pRes.rows.length > 0) resolvedFarmerId = pRes.rows[0].id;
        }
        const searchName = farmer_name || farmerName || userName;
        if (!resolvedFarmerId && searchName) {
          const nRes = await pool.query('SELECT id FROM users WHERE full_name ILIKE $1 LIMIT 1', [searchName.trim()]);
          if (nRes.rows.length > 0) resolvedFarmerId = nRes.rows[0].id;
        }
        if (!resolvedFarmerId) {
          const fRes = await pool.query("SELECT id FROM users WHERE role = 'farmer' ORDER BY id ASC LIMIT 1");
          resolvedFarmerId = fRes.rows[0]?.id || 2;
        }
      }

      // 2. Resolve Veterinarian ID
      let resolvedVetId = parseInt(vet_id || vetId, 10);
      if (isNaN(resolvedVetId) || !resolvedVetId) {
        const vetSearchName = req.body.vet_name || req.body.vetName;
        if (vetSearchName) {
          const vRes = await pool.query("SELECT id FROM users WHERE role = 'vet' AND full_name ILIKE $1 LIMIT 1", [vetSearchName.trim()]);
          if (vRes.rows.length > 0) resolvedVetId = vRes.rows[0].id;
        }
        if (!resolvedVetId) {
          const vDefault = await pool.query("SELECT id FROM users WHERE role = 'vet' ORDER BY id ASC LIMIT 1");
          resolvedVetId = vDefault.rows[0]?.id;
        }
      }

      if (!resolvedVetId) {
        return res.status(400).json({
          error: 'Please select a veterinarian for this consultation.',
          errorUrdu: 'برائے مہربانی مشاورت کے لیے ڈاکٹر کا انتخاب کریں۔'
        });
      }

      // 3. Normalize Consultation Type (handles online_chat, video_consult, physical_appointment, etc.)
      const rawType = (type || consultType || 'chat').toString().toLowerCase().trim();
      let normalizedType = 'chat';
      if (rawType.includes('video')) {
        normalizedType = 'video';
      } else if (rawType.includes('physical') || rawType.includes('clinic') || rawType.includes('in_person') || rawType.includes('appointment')) {
        normalizedType = 'physical';
      } else {
        normalizedType = 'chat';
      }

      // 4. Physical appointment date handling & smart normalizer
      let finalApptDate = null;
      if (normalizedType === 'physical') {
        const rawAppt = appointment_date || appointmentDate;
        if (!rawAppt || !rawAppt.trim()) {
          return res.status(400).json({
            error: 'Physical appointments require a designated appointment date and time.',
            errorUrdu: 'بالمشافہ ملاقات کے لیے تاریخ اور وقت کا انتخاب لازمی ہے۔'
          });
        }

        finalApptDate = normalizeAppointmentDate(rawAppt);
        if (!finalApptDate) {
          return res.status(400).json({
            error: 'Invalid appointment date format. Please choose a valid date and time.',
            errorUrdu: 'ملاقات کی تاریخ درست نہیں۔ برائے مہربانی درست تاریخ اور وقت منتخب کریں۔'
          });
        }

        const apptTimestamp = new Date(finalApptDate).getTime();
        // Allow up to 2 hours in the past for grace period/time zone differences
        if (apptTimestamp < Date.now() - 2 * 60 * 60 * 1000) {
          return res.status(400).json({
            error: 'Appointment date and time cannot be in the past.',
            errorUrdu: 'ملاقات کا وقت گزر چکا ہے۔ برائے مہربانی موجودہ یا آئندہ کا وقت منتخب کریں۔'
          });
        }
        // Disallow dates more than 6 months ahead
        const maxFuture = Date.now() + 180 * 24 * 60 * 60 * 1000;
        if (apptTimestamp > maxFuture) {
          return res.status(400).json({
            error: 'Appointments cannot be scheduled more than 6 months in advance.',
            errorUrdu: 'ملاقات 6 ماہ سے زیادہ آگے شیڈول نہیں کی جا سکتی۔'
          });
        }
      }

      const finalReason = reason && reason.trim().length >= 3
        ? reason.trim()
        : 'Livestock health consultation requested via mobile application.';

      // Prevent duplicate double-booking from rapid clicks within 15 seconds
      const duplicateCheck = await pool.query(
        `SELECT c.*, conv.id as conversation_id
         FROM consultations c
         LEFT JOIN conversations conv ON conv.consultation_id = c.id
         WHERE c.farmer_id = $1 AND c.vet_id = $2 AND c.type = $3
           AND c.created_at > NOW() - INTERVAL '15 seconds'
         ORDER BY c.id DESC LIMIT 1`,
        [resolvedFarmerId, resolvedVetId, normalizedType]
      );
      if (duplicateCheck.rows.length > 0) {
        return res.status(200).json({
          success: true,
          message: 'Consultation request already placed.',
          consultation: duplicateCheck.rows[0],
          conversation: { id: duplicateCheck.rows[0].conversation_id }
        });
      }

      // Consultation Financials: Rs. 300 consultation fee for online, custom for physical
      const isPhysical = normalizedType === 'physical';
      const fee = isPhysical ? (Number(req.body.fee) || 0.00) : 300.00;
      const adminCommission = isPhysical ? Math.round(fee * 0.25 * 100) / 100 : 75.00;
      const vetEarnings = isPhysical ? Math.round(fee * 0.75 * 100) / 100 : 225.00;
      const paymentMethod = req.body.payment_method || req.body.paymentMethod || 'JazzCash';
      const senderPhone = (req.body.sender_phone || req.body.senderPhone || phone || phoneNumber || '').trim() || null;
      const transactionId = (req.body.transaction_id || req.body.transactionId || req.body.tid || '').trim() || null;
      let finalProofUrl = req.body.payment_proof_url || req.body.paymentProofUrl || null;

      // Handle base64 payment receipt proof upload if provided
      const paymentProofBase64 = req.body.paymentProofBase64 || req.body.payment_proof_base64;
      if (paymentProofBase64) {
        try {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileName = `consult-proof-${uniqueSuffix}.jpg`;
          const uploadDir = path.join(__dirname, '..', 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const filePath = path.join(uploadDir, fileName);
          const cleanBase64 = paymentProofBase64.replace(/^data:image\/\w+;base64,/, '');
          fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));
          const host = req.get('host');
          const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
          finalProofUrl = `${protocol}://${host}/uploads/${fileName}`;
          await persistUploadedFile(pool, fileName, filePath, 'image/jpeg');
        } catch (proofErr) {
          console.warn('Consultation payment proof save error:', proofErr.message);
        }
      }

      let paymentStatus = req.body.payment_status || req.body.paymentStatus;
      if (!paymentStatus) {
        if (isPhysical) {
          paymentStatus = (transactionId || finalProofUrl) ? 'pending_verification' : 'fee_upon_visit';
        } else {
          paymentStatus = (transactionId || finalProofUrl || senderPhone) ? 'pending_verification' : 'unpaid';
        }
      }

      const result = await pool.query(
        `INSERT INTO consultations (
          farmer_id, vet_id, type, ai_record_data, appointment_date, reason, status,
          fee, admin_commission, vet_earnings, payment_method, payment_status,
          sender_phone, transaction_id, payment_proof_url
        )
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING *`,
        [
          resolvedFarmerId,
          resolvedVetId,
          normalizedType,
          ai_record_data ? JSON.stringify(ai_record_data) : null,
          finalApptDate,
          finalReason,
          fee,
          adminCommission,
          vetEarnings,
          paymentMethod,
          paymentStatus,
          senderPhone,
          transactionId,
          finalProofUrl
        ]
      );

      const createdConsultation = result.rows[0];

      // Auto-create an isolated conversation record for this specific consultation
      let createdConversation = null;
      try {
        const convRes = await pool.query(
          `INSERT INTO conversations (farmer_id, vet_id, consultation_id, status)
           VALUES ($1, $2, $3, 'active')
           RETURNING *`,
          [resolvedFarmerId, resolvedVetId, createdConsultation.id]
        );
        createdConversation = convRes.rows[0];
        createdConsultation.conversation_id = createdConversation.id;
      } catch (convErr) {
        console.warn('Auto conversation create warning:', convErr.message);
      }

      // Realtime websocket emit
      if (io) {
        io.emit('new_consultation', createdConsultation);
      }

      // Notify Vet in real-time
      try {
        const farmerUser = await pool.query('SELECT full_name FROM users WHERE id = $1', [resolvedFarmerId]);
        const farmerDisplayName = farmerUser.rows[0]?.full_name || farmer_name || 'Farmer';

        await sendNotification({
          pool,
          io,
          userId: resolvedVetId,
          type: 'consultation',
          title_en: 'New Consultation & Payment Request',
          title_ur: 'نئی مشاورت اور فیس تصدیق',
          message_en: `${farmerDisplayName} requested a Rs. 300 ${normalizedType} consultation (TID: ${transactionId || 'Pending'}).`,
          message_ur: `${farmerDisplayName} نے 300 روپے فیس کے ساتھ ${normalizedType === 'physical' ? 'بالمشافہ' : (normalizedType === 'video' ? 'ویڈیو' : 'آن لائن چیٹ')} مشاورت کی درخواست کی ہے۔`,
          data: {
            consultationId: createdConsultation.id,
            farmerId: resolvedFarmerId,
            targetScreen: 'VetConsultations'
          }
        });
      } catch (notifErr) {
        console.warn('Consultation notification warning:', notifErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Consultation request submitted successfully',
        consultation: createdConsultation,
        conversationId: createdConversation?.id || null
      });
    } catch (err) {
      console.error('Create Consultation Error:', err);
      res.status(500).json({ error: err.message || 'Error creating consultation request' });
    }
  });

  // Submit or Update Payment Proof for a Consultation
  router.put('/api/consultations/:id/payment', async (req, res) => {
    try {
      const { id } = req.params;
      const {
        sender_phone,
        senderPhone,
        transaction_id,
        transactionId,
        tid,
        payment_method,
        paymentMethod,
        paymentProofBase64,
        payment_proof_base64,
        payment_proof_url,
        paymentProofUrl
      } = req.body;

      let finalProofUrl = payment_proof_url || paymentProofUrl || null;
      const base64Data = paymentProofBase64 || payment_proof_base64;
      if (base64Data) {
        try {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileName = `consult-proof-${id}-${uniqueSuffix}.jpg`;
          const uploadDir = path.join(__dirname, '..', 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const filePath = path.join(uploadDir, fileName);
          const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
          fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));
          const host = req.get('host');
          const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
          finalProofUrl = `${protocol}://${host}/uploads/${fileName}`;
          await persistUploadedFile(pool, fileName, filePath, 'image/jpeg');
        } catch (proofErr) {
          console.warn('Consultation payment proof save error:', proofErr.message);
        }
      }

      const effectivePhone = sender_phone || senderPhone || null;
      const effectiveTid = transaction_id || transactionId || tid || null;
      const effectiveMethod = payment_method || paymentMethod || 'JazzCash';

      const updateRes = await pool.query(
        `UPDATE consultations
         SET sender_phone = COALESCE($1, sender_phone),
             transaction_id = COALESCE($2, transaction_id),
             payment_proof_url = COALESCE($3, payment_proof_url),
             payment_method = COALESCE($4, payment_method),
             payment_status = 'pending_verification',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [effectivePhone, effectiveTid, finalProofUrl, effectiveMethod, id]
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: 'Consultation not found' });
      }

      const updatedConsultation = updateRes.rows[0];
      if (io) {
        io.emit('consultation_updated', updatedConsultation);
      }

      // Notify Vet about new payment submission
      try {
        const farmerUser = await pool.query('SELECT full_name FROM users WHERE id = $1', [updatedConsultation.farmer_id]);
        const farmerDisplayName = farmerUser.rows[0]?.full_name || 'Farmer';
        await sendNotification({
          pool,
          io,
          userId: updatedConsultation.vet_id,
          type: 'consultation',
          title_en: 'Consultation Payment Submitted',
          title_ur: 'مشاورت فیس ثبوت موصول ہوا',
          message_en: `${farmerDisplayName} submitted payment proof of Rs. 300 (TID: ${effectiveTid || 'Submitted'}). Please verify.`,
          message_ur: `${farmerDisplayName} نے 300 روپے کی فیس کا ثبوت جمع کرا دیا ہے۔ برائے مہربانی تصدیق کریں۔`,
          data: {
            consultationId: updatedConsultation.id,
            farmerId: updatedConsultation.farmer_id,
            targetScreen: 'VetConsultations'
          }
        });
      } catch (e) {}

      res.status(200).json({
        success: true,
        message: 'Payment proof submitted successfully. Awaiting vet verification.',
        consultation: updatedConsultation
      });
    } catch (err) {
      console.error('Error submitting consultation payment:', err);
      res.status(500).json({ error: 'Server error submitting payment proof' });
    }
  });

  // Get Farmer Consultations
  router.get('/api/consultations/farmer/:id', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT c.*,
                c.status as status,
                u.full_name as vet_name,
                u.specialization as vet_specialization,
                u.district as vet_district,
                u.phone_number as vet_phone,
                u.consultation_mode as vet_consultation_mode,
                u.payment_wallet_type as vet_wallet_type,
                u.payment_account_title as vet_account_title,
                u.payment_account_number as vet_account_number,
                conv.id as conversation_id
         FROM consultations c 
         JOIN users u ON c.vet_id = u.id 
         LEFT JOIN conversations conv ON conv.consultation_id = c.id
         WHERE c.farmer_id = $1 ORDER BY c.created_at DESC`,
        [req.params.id]
      );
      res.json({ success: true, consultations: result.rows });
    } catch (err) {
      console.error('Error fetching farmer consultations:', err);
      res.status(500).json({ error: 'Failed to fetch consultations' });
    }
  });

  // Get Farmer Vaccinations (both Vet prescribed and Farmer logged)
  router.get('/api/farmer/vaccinations', async (req, res) => {
    try {
      const { farmerId, farmerName } = req.query;
      let resolvedFarmerId = farmerId;
      if (!resolvedFarmerId && farmerName) {
        const fRes = await pool.query("SELECT id FROM users WHERE full_name ILIKE $1 AND role = 'farmer'", [farmerName]);
        if (fRes.rows.length > 0) {
          resolvedFarmerId = fRes.rows[0].id;
        }
      }

      // 1. Fetch vet-prescribed vaccinations from chat messages
      let vetQuery = `
        SELECT m.id, m.created_at, u.full_name as vet_name, m.vaccination_data, 'vet' as source
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        JOIN users u ON c.vet_id = u.id
        WHERE m.is_vaccination = true
      `;
      const vetParams = [];
      if (resolvedFarmerId) {
        vetQuery += ` AND c.farmer_id = $1`;
        vetParams.push(resolvedFarmerId);
      }
      vetQuery += ` ORDER BY m.created_at DESC`;
      const vetRes = await pool.query(vetQuery, vetParams);

      // 2. Fetch farmer self-logged vaccinations
      let loggedQuery = `
        SELECT id, created_at, vaccine_name, animal_type, administered_date, next_due_date, status, notes, administered_by as vet_name, 'self' as source
        FROM farmer_vaccinations
      `;
      const loggedParams = [];
      if (resolvedFarmerId) {
        loggedQuery += ` WHERE farmer_id = $1`;
        loggedParams.push(resolvedFarmerId);
      }
      loggedQuery += ` ORDER BY created_at DESC`;
      const loggedRes = await pool.query(loggedQuery, loggedParams);

      // Format all into a clean, unified response
      const combined = [];

      loggedRes.rows.forEach(item => {
        const nextDue = item.next_due_date ? new Date(item.next_due_date).toISOString().split('T')[0] : null;
        const admDate = item.administered_date ? new Date(item.administered_date).toISOString().split('T')[0] : null;
        combined.push({
          id: item.id,
          source: 'self',
          vet_name: item.vet_name || 'Self-Administered',
          vaccine_name: item.vaccine_name,
          animal_type: item.animal_type || 'Cattle',
          vaccine_date: admDate,
          next_due_date: nextDue,
          status: item.status || 'Upcoming',
          notes: item.notes || '',
          created_at: item.created_at,
          vaccination_data: {
            vaccineName: item.vaccine_name,
            vaccineDate: admDate,
            nextDueDate: nextDue,
            animalType: item.animal_type || 'Cattle',
            status: item.status || 'Upcoming',
            notes: item.notes || '',
            vetName: item.vet_name || 'Self-Administered'
          }
        });
      });

      vetRes.rows.forEach(item => {
        let vData = item.vaccination_data;
        if (typeof vData === 'string') {
          try { vData = JSON.parse(vData); } catch (e) { vData = {}; }
        }
        if (!vData) vData = {};
        const vDate = vData.vaccineDate || (item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : '');
        const nDate = vData.nextDueDate || '';
        
        // Determine status based on dates
        const isUpcoming = nDate ? new Date(nDate) >= new Date() : false;
        const calculatedStatus = isUpcoming ? 'Upcoming' : 'Completed';

        combined.push({
          id: item.id,
          source: 'vet',
          vet_name: item.vet_name ? `Dr. ${item.vet_name.replace(/^Dr\.\s*/i, '')}` : 'Veterinarian',
          vaccine_name: vData.vaccineName || 'Livestock Vaccine',
          animal_type: vData.animalType || 'Livestock',
          vaccine_date: vDate,
          next_due_date: nDate,
          status: calculatedStatus,
          notes: vData.notes || '',
          created_at: item.created_at,
          vaccination_data: {
            ...vData,
            vaccineName: vData.vaccineName || 'Livestock Vaccine',
            vaccineDate: vDate,
            nextDueDate: nDate,
            animalType: vData.animalType || 'Livestock',
            status: calculatedStatus,
            vetName: item.vet_name ? `Dr. ${item.vet_name.replace(/^Dr\.\s*/i, '')}` : 'Veterinarian'
          }
        });
      });

      // Sort by newest created_at
      combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.status(200).json(combined);
    } catch (err) {
      console.error('Server error fetching vaccinations:', err);
      res.status(500).json({ error: 'Server error fetching vaccinations' });
    }
  });

  // Log a new Farmer Vaccination
  router.post('/api/farmer/vaccinations', async (req, res) => {
    try {
      const { farmerId, farmerName, vaccineName, animalType, administeredDate, nextDueDate, status, notes } = req.body;
      if (!vaccineName || typeof vaccineName !== 'string' || vaccineName.trim().length < 2) {
        return res.status(400).json({ error: 'A valid vaccine name (minimum 2 characters) is required' });
      }

      if (administeredDate && !isValidCalendarDate(administeredDate)) {
        return res.status(400).json({ error: 'Administered date must be a valid date in YYYY-MM-DD format.' });
      }

      if (nextDueDate) {
        if (!isValidCalendarDate(nextDueDate)) {
          return res.status(400).json({ error: 'Next due date must be a valid date in YYYY-MM-DD format.' });
        }
        const admTimestamp = administeredDate ? new Date(administeredDate).getTime() : Date.now();
        const dueTimestamp = new Date(nextDueDate).getTime();
        if (dueTimestamp < admTimestamp) {
          return res.status(400).json({ error: 'Next due date cannot be earlier than the administered date.' });
        }
      }

      let targetFarmerId = farmerId;
      if (!targetFarmerId && farmerName) {
        const fRes = await pool.query("SELECT id FROM users WHERE full_name ILIKE $1 AND role = 'farmer'", [farmerName]);
        if (fRes.rows.length > 0) targetFarmerId = fRes.rows[0].id;
      }
      if (!targetFarmerId) {
        const defaultFarmer = await pool.query("SELECT id FROM users WHERE role = 'farmer' LIMIT 1");
        if (defaultFarmer.rows.length > 0) targetFarmerId = defaultFarmer.rows[0].id;
      }

      const admDate = administeredDate || new Date().toISOString().split('T')[0];
      const initialStatus = status || (nextDueDate && new Date(nextDueDate) >= new Date() ? 'Upcoming' : 'Completed');

      const insertRes = await pool.query(
        `INSERT INTO farmer_vaccinations 
         (farmer_id, vaccine_name, animal_type, administered_date, next_due_date, status, notes, administered_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          targetFarmerId,
          vaccineName,
          animalType || 'Cattle',
          admDate,
          nextDueDate || null,
          initialStatus,
          notes || '',
          'Self-Administered'
        ]
      );

      res.status(201).json({ success: true, vaccination: insertRes.rows[0] });
    } catch (err) {
      console.error('Error adding vaccination:', err);
      res.status(500).json({ error: 'Server error adding vaccination' });
    }
  });

  // Delete Consultation
  router.delete('/api/consultations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM consultations WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Consultation not found' });
      }
      res.status(200).json({ success: true, message: 'Consultation deleted successfully' });
    } catch (err) {
      console.error('Error deleting consultation:', err);
      res.status(500).json({ error: 'Failed to delete consultation' });
    }
  });

  // Delete Animal Health Record / Detection
  router.delete('/api/detections/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM detections WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.status(200).json({ success: true, message: 'Animal health record deleted successfully' });
    } catch (err) {
      console.error('Error deleting detection:', err);
      res.status(500).json({ error: 'Failed to delete health record' });
    }
  });

  // Mark vaccination completed
  router.put('/api/farmer/vaccinations/:id/complete', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query("UPDATE farmer_vaccinations SET status = 'Completed' WHERE id = $1", [id]);
      res.status(200).json({ success: true, message: 'Vaccination marked completed' });
    } catch (err) {
      console.error('Error completing vaccination:', err);
      res.status(500).json({ error: 'Error updating vaccination' });
    }
  });

  // Delete vaccination (supports self-logged and vet-prescribed)
  router.delete('/api/farmer/vaccinations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { source } = req.query; // 'vet' or 'self'
      if (source === 'vet') {
        await pool.query('UPDATE messages SET is_vaccination = false WHERE id = $1', [id]);
      } else {
        await pool.query('DELETE FROM farmer_vaccinations WHERE id = $1', [id]);
      }
      res.status(200).json({ success: true, message: 'Vaccination deleted' });
    } catch (err) {
      console.error('Error deleting vaccination:', err);
      res.status(500).json({ error: 'Error deleting vaccination' });
    }
  });

  return router;
};
