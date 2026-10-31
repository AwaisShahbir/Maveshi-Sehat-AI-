const express = require('express');
const router = express.Router();
const { 
  fetchFullWeatherData, 
  calculateTHI, 
  getStressCategory, 
  checkAndDispatchDistrictAlerts, 
  DISTRICT_COORDINATES 
} = require('../services/heatStressService');
const { sendNotification } = require('../services/notificationService');

module.exports = (pool, io) => {
  // GET /api/weather/heat-stress
  router.get('/api/weather/heat-stress', async (req, res) => {
    try {
      let { lat, lng, district } = req.query;

      // Resolve coordinates from district if lat/lng missing
      if ((!lat || !lng) && district) {
        const cleanDist = district.trim().toLowerCase();
        if (DISTRICT_COORDINATES[cleanDist]) {
          lat = DISTRICT_COORDINATES[cleanDist].lat;
          lng = DISTRICT_COORDINATES[cleanDist].lng;
        } else {
          // Geocode via open-meteo
          try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(district)}&count=1&language=en&format=json`);
            const geoData = await geoRes.json();
            if (geoData && geoData.results && geoData.results.length > 0) {
              lat = geoData.results[0].latitude;
              lng = geoData.results[0].longitude;
            }
          } catch (e) {
            console.warn('Geocoding fallback failed:', e.message);
          }
        }
      }

      // Default to Lahore if still unresolved
      const targetLat = parseFloat(lat) || 31.5497;
      const targetLng = parseFloat(lng) || 74.3436;

      const payload = await fetchFullWeatherData(targetLat, targetLng);
      res.status(200).json({
        success: true,
        coordinates: { lat: targetLat, lng: targetLng },
        district: district || 'Lahore, Punjab',
        ...payload
      });
    } catch (err) {
      console.error('Error fetching weather & heat stress:', err.message);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve meteorological and heat stress data',
        details: err.message
      });
    }
  });

  // GET /api/weather/active-alerts
  router.get('/api/weather/active-alerts', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT * FROM heat_stress_alerts 
        ORDER BY created_at DESC 
        LIMIT 20
      `);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching active heat alerts:', err.message);
      res.status(500).json({ error: 'Server error retrieving heat alerts' });
    }
  });

  // POST /api/weather/trigger-alert (Test or Manual trigger)
  router.post('/api/weather/trigger-alert', async (req, res) => {
    try {
      const { userId, district, customThi } = req.body;
      const distName = district || 'Lahore';
      const thi = customThi ? parseInt(customThi) : 83;
      const stress = getStressCategory(thi);

      let targetUserId = userId;
      if (!targetUserId) {
        const uRes = await pool.query(`SELECT id FROM users WHERE role = 'farmer' LIMIT 1`);
        targetUserId = uRes.rows[0]?.id;
      }

      if (!targetUserId) {
        return res.status(404).json({ error: 'No user found to receive test alert' });
      }

      const alert = await sendNotification({
        pool,
        io,
        userId: targetUserId,
        type: 'heat_alert',
        title_en: `🚨 High Heat Stress Alert: ${distName}`,
        title_ur: `🚨 مویشی شدید ہیٹ الرٹ: ${distName}`,
        message_en: `Current THI is ${thi} (${stress.labelEn}). Turn on misting fans and electrolytes immediately!`,
        message_ur: `موجودہ THI انڈیکس ${thi} (${stress.labelUr}) ہے۔ فوری پنکھے چلائیں اور ٹھنڈا پانی مہیا کریں۔`,
        data: {
          district: distName,
          thi,
          severity: stress.level
        }
      });

      res.status(200).json({
        success: true,
        message: 'Heat stress alert dispatched successfully',
        alert
      });
    } catch (err) {
      console.error('Error triggering heat alert:', err.message);
      res.status(500).json({ error: 'Failed to trigger heat stress alert' });
    }
  });

  // GET /api/weather/regional-status
  router.get('/api/weather/regional-status', async (req, res) => {
    try {
      const statuses = [];
      for (const [key, dist] of Object.entries(DISTRICT_COORDINATES)) {
        statuses.push({
          district: dist.name,
          province: dist.province,
          lat: dist.lat,
          lng: dist.lng
        });
      }
      res.status(200).json(statuses);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};

