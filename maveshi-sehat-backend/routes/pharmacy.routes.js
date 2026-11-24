const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { persistUploadedFile } = require('../utils/fileStore');

module.exports = (pool) => {
  // Pharmacy Registration
  router.post('/api/pharmacy/register', async (req, res) => {
    try {
      const {
        name, nameUrdu, licenseNumber, licenseExpiry, ownerName,
        cnic, phone, whatsapp, email, password, address,
        province, city, businessHours, description,
        licenseDocumentUrl, cnicDocumentUrl
      } = req.body;

      const exists = await pool.query(
        'SELECT * FROM pharmacies WHERE email = $1 OR license_number = $2 OR phone = $3',
        [email, licenseNumber, phone]
      );
      if (exists.rows.length > 0) {
        return res.status(400).json({ error: 'Pharmacy with this email, phone, or license number already exists!' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const result = await pool.query(
        `INSERT INTO pharmacies (
          name, name_urdu, license_number, license_expiry, owner_name,
          cnic, phone, whatsapp, email, password, address,
          province, city, business_hours, description,
          license_document_url, cnic_document_url, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'pending') RETURNING id, name, email`,
        [
          name, nameUrdu || null, licenseNumber, licenseExpiry || null, ownerName,
          cnic || null, phone, whatsapp || null, email, hashedPassword, address || null,
          province || null, city || null, businessHours || null, description || null,
          licenseDocumentUrl || null, cnicDocumentUrl || null
        ]
      );

      await pool.query(
        `INSERT INTO admin_notifications (type, message_en, message_ur) 
         VALUES ('pharmacy_approval', $1, $2)`,
        [
          `New pharmacy application awaiting CNIC & License verification - ${name} (${ownerName})`,
          `${name} نے فارمیسی رجسٹریشن کے لیے لائسنس اور شناختی کارڈ جمع کرایا ہے — جانچ درکار ہے`
        ]
      );

      res.status(201).json({
        message: 'Registration successful! Your application and verification documents are pending admin review.',
        pharmacy: result.rows[0]
      });
    } catch (err) {
      console.error('Pharmacy Registration Error:', err.message);
      res.status(500).json({ error: 'Server error during pharmacy registration.' });
    }
  });

  // Pharmacy Login
  router.post('/api/pharmacy/login', async (req, res) => {
    try {
      const { emailOrPhone, password } = req.body;

      const result = await pool.query(
        'SELECT * FROM pharmacies WHERE email = $1 OR phone = $1',
        [emailOrPhone]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid email/phone number or pharmacy not registered.' });
      }

      const pharmacy = result.rows[0];

      if (pharmacy.status === 'pending') {
        return res.status(403).json({
          error: 'Your pharmacy portal account is pending admin approval. The administrator is currently reviewing your DRAP License and CNIC documents.'
        });
      }
      if (pharmacy.status === 'rejected') {
        return res.status(403).json({ error: 'Your pharmacy registration request was rejected by admin.' });
      }
      if (pharmacy.status === 'blocked') {
        return res.status(403).json({ error: 'Your pharmacy account has been blocked by administrator. Please contact support.' });
      }

      const isMatch = await bcrypt.compare(password, pharmacy.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid password.' });
      }

      res.status(200).json({
        message: 'Login successful!',
        pharmacy: {
          id: pharmacy.id,
          name: pharmacy.name,
          nameUrdu: pharmacy.name_urdu,
          email: pharmacy.email,
          phone: pharmacy.phone,
          status: pharmacy.status
        }
      });
    } catch (err) {
      console.error('Pharmacy Login Error:', err.message);
      res.status(500).json({ error: 'Server error during pharmacy login.' });
    }
  });

  // Get Admin Announcements relevant to pharmacies
  router.get('/api/pharmacy/announcements', async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM announcements WHERE target_audience = 'all' OR target_audience LIKE '%pharmac%' ORDER BY created_at DESC LIMIT 20"
      );
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching pharmacy announcements:', err.message);
      res.status(500).json({ error: 'Failed to fetch announcements' });
    }
  });

  // Pharmacy Dashboard Stats
  router.get('/api/pharmacy/dashboard-stats', async (req, res) => {
    try {
      const { pharmacyId } = req.query;
      if (!pharmacyId) {
        return res.status(400).json({ error: 'pharmacyId parameter is required' });
      }

      const pId = parseInt(pharmacyId);

      // All-time revenue
      const revRes = await pool.query(
        "SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE pharmacy_id = $1 AND status IN ('delivered', 'completed')",
        [pId]
      );
      const totalRevenue = parseFloat(revRes.rows[0].coalesce) || 0.00;

      // Today's revenue
      const todayRevRes = await pool.query(
        "SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE pharmacy_id = $1 AND status IN ('delivered', 'completed') AND created_at >= CURRENT_DATE",
        [pId]
      );
      const todayRevenue = parseFloat(todayRevRes.rows[0].coalesce) || 0.00;

      // This Month's revenue
      const monthRevRes = await pool.query(
        "SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE pharmacy_id = $1 AND status IN ('delivered', 'completed') AND created_at >= DATE_TRUNC('month', CURRENT_DATE)",
        [pId]
      );
      const monthRevenue = parseFloat(monthRevRes.rows[0].coalesce) || 0.00;

      const actRes = await pool.query(
        "SELECT COUNT(*) FROM orders WHERE pharmacy_id = $1 AND status NOT IN ('delivered', 'completed', 'cancelled')",
        [pId]
      );
      const activeOrdersCount = parseInt(actRes.rows[0].count) || 0;

      const medRes = await pool.query(
        "SELECT COUNT(*) FROM medicines WHERE pharmacy_id = $1",
        [pId]
      );
      const medicineListingsCount = parseInt(medRes.rows[0].count) || 0;

      const alertRes = await pool.query(
        "SELECT COUNT(*) FROM medicines WHERE pharmacy_id = $1 AND (stock < min_stock OR status = 'out_of_stock')",
        [pId]
      );
      const stockAlertsCount = parseInt(alertRes.rows[0].count) || 0;

      // Orders requiring prescription (Rx)
      let rxOrdersCount = 0;
      try {
        const rxRes = await pool.query(`
          SELECT COUNT(DISTINCT o.id) 
          FROM orders o 
          JOIN order_items oi ON o.id = oi.order_id 
          JOIN medicines m ON oi.medicine_id = m.id 
          WHERE o.pharmacy_id = $1 AND m.prescription_required = TRUE
        `, [pId]);
        rxOrdersCount = parseInt(rxRes.rows[0].count) || 0;
      } catch (e) {
        console.warn('rxRes error:', e.message);
      }

      // Order Pipeline Breakdown
      const pipelineRes = await pool.query(`
        SELECT status, COUNT(*)::int as count 
        FROM orders 
        WHERE pharmacy_id = $1 
        GROUP BY status
      `, [pId]);
      const pipeline = {
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      };
      pipelineRes.rows.forEach(r => {
        const s = (r.status || '').toLowerCase();
        if (s === 'pending') {
          pipeline.pending += r.count;
        } else if (s === 'confirmed' || s === 'processing') {
          pipeline.confirmed += r.count;
        } else if (s === 'shipped' || s === 'dispatched') {
          pipeline.shipped += r.count;
        } else if (s === 'delivered' || s === 'completed') {
          pipeline.delivered += r.count;
        } else if (s === 'cancelled' || s === 'rejected') {
          pipeline.cancelled += r.count;
        }
      });

      // Top Selling Medicines
      let topSellingList = [];
      try {
        const topSellRes = await pool.query(`
          SELECT m.name, m.dosage_form, m.strength, COALESCE(SUM(oi.quantity), 0)::int as sold_count, COALESCE(SUM(oi.price * oi.quantity), 0) as total_sales
          FROM order_items oi
          JOIN medicines m ON oi.medicine_id = m.id
          WHERE m.pharmacy_id = $1
          GROUP BY m.id, m.name, m.dosage_form, m.strength
          ORDER BY sold_count DESC
          LIMIT 5
        `, [pId]);
        topSellingList = topSellRes.rows;
      } catch (e) {
        console.warn('topSellRes error:', e.message);
      }

      const recentOrdersRes = await pool.query(
        "SELECT * FROM orders WHERE pharmacy_id = $1 ORDER BY created_at DESC LIMIT 5",
        [pId]
      );

      const stockAlertsRes = await pool.query(
        "SELECT * FROM medicines WHERE pharmacy_id = $1 AND stock < min_stock ORDER BY stock ASC LIMIT 5",
        [pId]
      );

      // Pharmacy account & commission debt lock check
      const pharmInfoRes = await pool.query(
        "SELECT id, is_locked, lock_reason, commission_due FROM pharmacies WHERE id = $1",
        [pId]
      );
      const pharmRow = pharmInfoRes.rows[0] || {};
      const commissionDue = parseFloat(pharmRow.commission_due) || 0.00;
      const isLocked = pharmRow.is_locked || commissionDue >= 2000.00;

      res.status(200).json({
        stats: {
          totalRevenue,
          todayRevenue,
          monthRevenue,
          activeOrders: activeOrdersCount,
          medicineListings: medicineListingsCount,
          stockAlerts: stockAlertsCount,
          rxOrdersCount,
          pipeline,
          commissionDue,
          isLocked,
          lockReason: pharmRow.lock_reason,
          creditLimit: 2000.00,
          minSettlement: 1000.00
        },
        recentOrders: recentOrdersRes.rows,
        stockAlertsList: stockAlertsRes.rows,
        topSellingMedicines: topSellingList
      });
    } catch (err) {
      console.error('Pharmacy Stats Error:', err.message);
      res.status(500).json({ error: 'Failed to fetch pharmacy dashboard stats.' });
    }
  });

  // GET Pharmacy Medicines
  router.get('/api/pharmacy/medicines', async (req, res) => {
    try {
      const { pharmacyId } = req.query;
      if (!pharmacyId) {
        return res.status(400).json({ error: 'pharmacyId parameter is required' });
      }
      const result = await pool.query(
        "SELECT * FROM medicines WHERE pharmacy_id = $1 ORDER BY id ASC",
        [parseInt(pharmacyId)]
      );
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch medicines.' });
    }
  });

  // ADD Pharmacy Medicine
  router.post('/api/pharmacy/medicines', async (req, res) => {
    try {
      const {
        name, nameUrdu, manufacturer, dosageForm, strength, category,
        price, stock, minStock, maxStock, batchNumber, expiryDate,
        activeIngredients, description, prescriptionRequired, imageUrl
      } = req.body;

      const pharmacyId = parseInt(req.body.pharmacyId);
      const mStock = minStock !== undefined ? parseInt(minStock) : 10;
      const mxStock = maxStock !== undefined ? parseInt(maxStock) : 100;
      const curStock = parseInt(stock);
      const status = curStock === 0 ? 'out_of_stock' : (curStock < mStock ? 'low_stock' : 'active');
      const rxReq = prescriptionRequired === true || prescriptionRequired === 'true';

      const result = await pool.query(
        `INSERT INTO medicines (
          name, name_urdu, manufacturer, dosage_form, strength, category, 
          pharmacy_id, price, stock, min_stock, max_stock, batch_number, 
          expiry_date, active_ingredients, description, prescription_required, image_url, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
        [
          name, nameUrdu || null, manufacturer || null, dosageForm || null, strength || null, category,
          pharmacyId, parseFloat(price), curStock, mStock, mxStock, batchNumber || null,
          expiryDate || null, activeIngredients || null, description || null, rxReq, imageUrl || null, status
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error adding medicine:', err.message);
      res.status(500).json({ error: 'Failed to add medicine.' });
    }
  });

  // UPDATE Pharmacy Medicine
  router.put('/api/pharmacy/medicines/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name, nameUrdu, manufacturer, dosageForm, strength, category,
        price, stock, minStock, maxStock, batchNumber, expiryDate,
        activeIngredients, description, prescriptionRequired, imageUrl, status
      } = req.body;

      if (status !== undefined && name === undefined) {
        const result = await pool.query(
          "UPDATE medicines SET status = $1 WHERE id = $2 RETURNING *",
          [status, parseInt(id)]
        );
        return res.status(200).json(result.rows[0]);
      }

      const mStock = minStock !== undefined ? parseInt(minStock) : 10;
      const mxStock = maxStock !== undefined ? parseInt(maxStock) : 100;
      const curStock = parseInt(stock);
      let resolvedStatus = status;
      if (!resolvedStatus) {
        resolvedStatus = curStock === 0 ? 'out_of_stock' : (curStock < mStock ? 'low_stock' : 'active');
      }
      const rxReq = prescriptionRequired === true || prescriptionRequired === 'true';

      const result = await pool.query(
        `UPDATE medicines SET 
          name = $1, name_urdu = $2, manufacturer = $3, dosage_form = $4, strength = $5, 
          category = $6, price = $7, stock = $8, min_stock = $9, max_stock = $10, 
          batch_number = $11, expiry_date = $12, active_ingredients = $13, description = $14, 
          prescription_required = $15, image_url = $16, status = $17, last_restocked = CURRENT_TIMESTAMP
         WHERE id = $18 RETURNING *`,
        [
          name, nameUrdu || null, manufacturer || null, dosageForm || null, strength || null,
          category, parseFloat(price), curStock, mStock, mxStock,
          batchNumber || null, expiryDate || null, activeIngredients || null, description || null,
          rxReq, imageUrl || null, resolvedStatus, parseInt(id)
        ]
      );
      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error('Error updating medicine:', err.message);
      res.status(500).json({ error: 'Failed to update medicine.' });
    }
  });

  // DELETE Pharmacy Medicine
  router.delete('/api/pharmacy/medicines/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM medicines WHERE id = $1", [parseInt(id)]);
      res.status(200).json({ message: 'Medicine deleted successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete medicine.' });
    }
  });

  // Pharmacy Analytics
  router.get('/api/pharmacy/analytics', async (req, res) => {
    try {
      const { pharmacyId } = req.query;
      if (!pharmacyId) {
        return res.status(400).json({ error: 'pharmacyId parameter is required' });
      }
      const pId = parseInt(pharmacyId);

      const revRes = await pool.query(
        "SELECT SUM(total_price) FROM orders WHERE pharmacy_id = $1 AND status IN ('delivered', 'completed')",
        [pId]
      );
      const totalRevenue = parseFloat(revRes.rows[0].sum) || 0.00;

      const ordRes = await pool.query(
        "SELECT COUNT(*) FROM orders WHERE pharmacy_id = $1",
        [pId]
      );
      const totalOrders = parseInt(ordRes.rows[0].count) || 0;

      const custRes = await pool.query(
        "SELECT COUNT(DISTINCT buyer_name) FROM orders WHERE pharmacy_id = $1",
        [pId]
      );
      const activeCustomers = parseInt(custRes.rows[0].count) || 0;

      const avgRes = await pool.query(
        "SELECT AVG(total_price) FROM orders WHERE pharmacy_id = $1 AND status IN ('delivered', 'completed')",
        [pId]
      );
      const avgOrderValue = parseFloat(avgRes.rows[0].avg) || 0.00;

      const monthlyRes = await pool.query(
        `SELECT 
           TO_CHAR(created_at, 'Mon') as month_name,
           SUM(total_price)::float as revenue,
           COUNT(*)::int as order_count,
           DATE_TRUNC('month', created_at) as month_date
         FROM orders 
         WHERE pharmacy_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
         GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
         ORDER BY month_date ASC`,
        [pId]
      );

      let monthlyData = monthlyRes.rows.map(row => ({
        name: row.month_name,
        Revenue: row.revenue,
        Orders: row.order_count
      }));

      if (monthlyData.length === 0) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        monthlyData = months.map(m => ({ name: m, Revenue: 0, Orders: 0 }));
      }

      const topMedsRes = await pool.query(
        `SELECT 
           m.id,
           m.name,
           m.name_urdu,
           COUNT(oi.id)::int as order_count,
           SUM(oi.quantity * oi.price)::float as total_sales
         FROM order_items oi
         JOIN medicines m ON oi.medicine_id = m.id
         WHERE m.pharmacy_id = $1
         GROUP BY m.id, m.name, m.name_urdu
         ORDER BY order_count DESC, total_sales DESC
         LIMIT 5`,
        [pId]
      );

      const topMedicines = topMedsRes.rows.map(row => ({
        name: row.name,
        nameUrdu: row.name_urdu || '',
        orders: row.order_count,
        sales: row.total_sales
      }));

      const distRes = await pool.query(
        `SELECT status, COUNT(*)::int as count FROM orders WHERE pharmacy_id = $1 GROUP BY status`,
        [pId]
      );

      let completedCount = 0;
      let processingCount = 0;
      let cancelledCount = 0;
      let totalDist = 0;

      distRes.rows.forEach(r => {
        const cnt = r.count;
        totalDist += cnt;
        if (r.status.toLowerCase() === 'completed' || r.status.toLowerCase() === 'delivered') {
          completedCount += cnt;
        } else if (r.status.toLowerCase() === 'processing' || r.status.toLowerCase() === 'pending' || r.status.toLowerCase() === 'dispatched') {
          processingCount += cnt;
        } else if (r.status.toLowerCase() === 'cancelled') {
          cancelledCount += cnt;
        }
      });

      const distribution = {
        completed: totalDist > 0 ? Math.round((completedCount / totalDist) * 100) : 0,
        processing: totalDist > 0 ? Math.round((processingCount / totalDist) * 100) : 0,
        cancelled: totalDist > 0 ? Math.round((cancelledCount / totalDist) * 100) : 0
      };

      const repeatBuyersRes = await pool.query(
        `WITH buyer_counts AS (
           SELECT buyer_name, COUNT(*) as ord_cnt FROM orders WHERE pharmacy_id = $1 GROUP BY buyer_name
         )
         SELECT 
           COUNT(*)::float as total_buyers,
           SUM(CASE WHEN ord_cnt > 1 THEN 1 ELSE 0 END)::float as repeat_buyers
         FROM buyer_counts`,
        [pId]
      );

      const totalBuyers = parseFloat(repeatBuyersRes.rows[0].total_buyers) || 0;
      const repeatBuyers = parseFloat(repeatBuyersRes.rows[0].repeat_buyers) || 0;
      const customerRetention = totalBuyers > 0 ? Math.round((repeatBuyers / totalBuyers) * 100) : 0;

      res.status(200).json({
        kpis: {
          totalRevenue,
          totalOrders,
          activeCustomers,
          avgOrderValue
        },
        revenueOverview: monthlyData,
        topMedicines,
        distribution,
        customerRetention,
        customerSatisfaction: 4.8
      });
    } catch (err) {
      console.error('Pharmacy Analytics Error:', err.message);
      res.status(500).json({ error: 'Failed to fetch pharmacy analytics.' });
    }
  });

  // GET Pharmacy Orders
  router.get('/api/pharmacy/orders', async (req, res) => {
    try {
      const { pharmacyId } = req.query;
      if (!pharmacyId) {
        return res.status(400).json({ error: 'pharmacyId parameter is required' });
      }
      const result = await pool.query(
        "SELECT * FROM orders WHERE pharmacy_id = $1 ORDER BY created_at DESC",
        [parseInt(pharmacyId)]
      );
      res.status(200).json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch orders.' });
    }
  });

  // UPDATE Order Status
  router.put('/api/pharmacy/orders/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await pool.query(
        "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
      );
      res.status(200).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update order status.' });
    }
  });

  // GET Order Items
  router.get('/api/pharmacy/orders/:id/items', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `SELECT oi.quantity, oi.price, m.name, m.name_urdu 
         FROM order_items oi
         JOIN medicines m ON oi.medicine_id = m.id
         WHERE oi.order_id = $1`,
        [id]
      );
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching order items:', err.message);
      res.status(500).json({ error: 'Failed to fetch order items.' });
    }
  });

  // GET Orders for a specific user / farmer (Order History & Live Condition Tracking)
  router.get('/api/pharmacy/orders/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const phone = req.query.phone ? req.query.phone.trim() : '';
      const parsedUserId = parseInt(userId);
      const validUserId = !isNaN(parsedUserId) ? parsedUserId : null;

      const conditions = [];
      const params = [];

      if (validUserId) {
        params.push(validUserId);
        conditions.push(`o.user_id = $${params.length}`);
      }

      if (phone && phone.length > 5) {
        params.push(phone);
        const pIdx = params.length;
        conditions.push(`(o.phone = $${pIdx} OR o.sender_phone = $${pIdx})`);
      }

      if (conditions.length === 0) {
        return res.status(200).json([]);
      }

      const whereClause = `WHERE (${conditions.join(' OR ')})`;

      const result = await pool.query(
        `SELECT 
           o.*, 
           p.name as pharmacy_name, 
           p.name_urdu as pharmacy_name_urdu,
           p.phone as pharmacy_phone, 
           p.city as pharmacy_city,
           p.address as pharmacy_address,
           p.whatsapp as pharmacy_whatsapp,
           COALESCE(
             (
               SELECT json_agg(json_build_object(
                 'id', oi.id,
                 'medicine_id', oi.medicine_id,
                 'name', m.name,
                 'name_urdu', m.name_urdu,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'image_url', m.image_url
               ))
               FROM order_items oi
               LEFT JOIN medicines m ON oi.medicine_id = m.id
               WHERE oi.order_id = o.id
             ), '[]'::json
           ) as items
         FROM orders o
         LEFT JOIN pharmacies p ON o.pharmacy_id = p.id
         ${whereClause}
         ORDER BY o.created_at DESC`,
        params
      );

      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching user orders history:', err.message);
      res.status(500).json({ error: 'Failed to fetch user order history.' });
    }
  });

  // CREATE Order
  router.post('/api/pharmacy/orders', async (req, res) => {
    try {
      const { 
        userId,
        buyerName, 
        buyerNameUrdu, 
        pharmacyId, 
        totalPrice, 
        paymentMethod, 
        items,
        deliveryAddress,
        phone,
        transactionId,
        paymentStatus,
        senderPhone,
        paymentProofBase64,
        paymentProofUrl: existingProofUrl
      } = req.body;
      if (!buyerName || !pharmacyId || !totalPrice || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Missing required parameters or empty items list.' });
      }

      if (!deliveryAddress || typeof deliveryAddress !== 'string' || deliveryAddress.trim().length < 5) {
        return res.status(400).json({ error: 'A complete delivery address (minimum 5 characters) is required.' });
      }

      if (!phone || typeof phone !== 'string' || phone.trim().replace(/\D/g, '').length < 10) {
        return res.status(400).json({ error: 'A valid Pakistani contact phone number (at least 10-11 digits) is required.' });
      }

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.medicineId || parseInt(it.quantity) <= 0 || parseFloat(it.price) < 0) {
          return res.status(400).json({ error: `Invalid item details at position ${i + 1}. Quantity must be > 0 and price >= 0.` });
        }
      }

      const pId = parseInt(pharmacyId);

      // Check if pharmacy store is locked due to commission threshold
      const pharmCheck = await pool.query(
        "SELECT id, name, is_locked, commission_due, commission_rate FROM pharmacies WHERE id = $1",
        [pId]
      );
      if (pharmCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Selected pharmacy does not exist.' });
      }
      const targetPharm = pharmCheck.rows[0];
      const currentDue = parseFloat(targetPharm.commission_due) || 0.00;
      if (targetPharm.is_locked || currentDue >= 2000.00) {
        return res.status(403).json({
          error: `This pharmacy's store and stock are temporarily blocked because their accumulated commission due (Rs. ${currentDue.toFixed(2)}) has reached the Rs. 2,000 limit. Orders cannot be placed until the pharmacy settles at least Rs. 1,000 with the platform administrator.`,
          isLocked: true,
          commissionDue: currentDue
        });
      }

      const countRes = await pool.query("SELECT COUNT(*) FROM orders");
      const count = parseInt(countRes.rows[0].count) || 0;
      const orderId = `ORD-${1000 + count + Math.floor(Math.random() * 100)}`;

      let totalQty = 0;
      items.forEach(item => {
        totalQty += parseInt(item.quantity);
      });

      // Calculate 10% Platform Commission & 90% Pharmacy Earnings
      const parsedTotal = parseFloat(totalPrice);
      const commissionRate = parseFloat(targetPharm.commission_rate) || 10.00;
      const adminCommission = parseFloat(((parsedTotal * commissionRate) / 100).toFixed(2));
      const pharmacyEarnings = parseFloat((parsedTotal - adminCommission).toFixed(2));

      // Handle payment proof upload
      let finalProofUrl = existingProofUrl || null;
      if (paymentProofBase64) {
        try {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileName = `order-proof-${orderId}-${uniqueSuffix}.jpg`;
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
          console.warn('Order payment proof save error:', proofErr.message);
        }
      }

      const isManualOnline = paymentMethod === 'JazzCash' || paymentMethod === 'Online';
      const resolvedPaymentStatus = paymentStatus || (isManualOnline ? 'pending_verification' : (paymentMethod === 'COD' ? 'unpaid' : 'paid'));
      const parsedUserId = userId ? parseInt(userId) : null;
      const validUserId = !isNaN(parsedUserId) ? parsedUserId : null;

      const orderResult = await pool.query(
        `INSERT INTO orders (
           id, buyer_name, buyer_name_urdu, pharmacy_id, items_count, total_price,
           payment_method, status, delivery_address, phone, transaction_id, payment_status,
           sender_phone, payment_proof_url, commission_rate, admin_commission, pharmacy_earnings, user_id, created_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP) RETURNING *`,
        [
          orderId, 
          buyerName, 
          buyerNameUrdu || null, 
          pId, 
          totalQty, 
          parsedTotal, 
          paymentMethod,
          deliveryAddress || null,
          phone || null,
          transactionId || null,
          resolvedPaymentStatus,
          senderPhone || phone || null,
          finalProofUrl,
          commissionRate,
          adminCommission,
          pharmacyEarnings,
          validUserId
        ]
      );

      // Increment pharmacy commission debt & check Rs. 2,000 threshold
      const newCommissionTotal = currentDue + adminCommission;
      await pool.query(
        `UPDATE pharmacies 
         SET commission_due = commission_due + $1,
             is_locked = CASE WHEN (commission_due + $1) >= 2000.00 THEN TRUE ELSE is_locked END,
             lock_reason = CASE WHEN (commission_due + $1) >= 2000.00 THEN 'Commission due exceeded Rs. 2,000 limit. Store and medicine stock blocked.' ELSE lock_reason END
         WHERE id = $2`,
        [adminCommission, pId]
      );

      if (newCommissionTotal >= 2000.00) {
        try {
          await pool.query(
            `INSERT INTO admin_notifications (type, message_en, message_ur)
             VALUES ($1, $2, $3)`,
            [
              'pharmacy_commission_lock',
              `⚠️ Pharmacy '${targetPharm.name}' stock has been blocked. Outstanding commission reached Rs. ${newCommissionTotal.toFixed(2)} (Limit: Rs. 2,000).`,
              `فارمیسی '${targetPharm.name}' کی کمیشن بقایا رقم 2,000 روپے سے زائد ہونے کی وجہ سے سٹاک بلاک کر دیا گیا ہے`
            ]
          );
        } catch (_) {}
      }

      // Notify admin if manual JazzCash proof attached
      if (isManualOnline && finalProofUrl) {
        try {
          await pool.query(
            `INSERT INTO admin_notifications (type, message_en, message_ur)
             VALUES ($1, $2, $3)`,
            [
              'order_payment_verification',
              `New JazzCash receipt for Order #${orderId} (Rs. ${totalPrice}) from ${buyerName} (TID: ${transactionId || 'N/A'})`,
              `آرڈر #${orderId} (رقم: ${totalPrice} روپے) کے لیے جاز کیش رسید جمع کرائی گئی ہے — جانچ درکار ہے`
            ]
          );
        } catch (notifErr) {
          console.warn('Admin notification warning for order payment:', notifErr.message);
        }
      }

      for (const item of items) {
        await pool.query(
          `INSERT INTO order_items (order_id, medicine_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [orderId, parseInt(item.medicineId), parseInt(item.quantity), parseFloat(item.price)]
        );

        await pool.query(
          `UPDATE medicines SET 
             stock = GREATEST(0, stock - $1),
             status = CASE 
               WHEN GREATEST(0, stock - $1) = 0 THEN 'out_of_stock' 
               WHEN GREATEST(0, stock - $1) < min_stock THEN 'low_stock' 
               ELSE status 
             END
           WHERE id = $2`,
          [parseInt(item.quantity), parseInt(item.medicineId)]
        );
      }

      res.status(201).json(orderResult.rows[0]);
    } catch (err) {
      console.error('Error creating order:', err.message);
      res.status(500).json({ error: 'Failed to create order.' });
    }
  });

  // GET Pharmacy Profile
  router.get('/api/pharmacy/profile', async (req, res) => {
    try {
      const { pharmacyId } = req.query;
      if (!pharmacyId) {
        return res.status(400).json({ error: 'pharmacyId parameter is required' });
      }
      const result = await pool.query(
        `SELECT id, name, name_urdu, license_number, license_expiry, owner_name, cnic, phone, whatsapp, email, 
                address, province, city, business_hours, description, status,
                payment_wallet_type, payment_account_title, payment_account_number,
                commission_rate, commission_due, commission_paid, is_locked, lock_reason 
         FROM pharmacies WHERE id = $1`,
        [parseInt(pharmacyId)]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pharmacy profile not found.' });
      }
      res.status(200).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch profile.' });
    }
  });

  // UPDATE Pharmacy Profile
  router.put('/api/pharmacy/profile', async (req, res) => {
    try {
      const {
        pharmacyId, name, nameUrdu, ownerName, phone, whatsapp,
        address, province, city, businessHours, description,
        paymentWalletType, paymentAccountTitle, paymentAccountNumber
      } = req.body;

      const result = await pool.query(
        `UPDATE pharmacies SET 
          name = $1, name_urdu = $2, owner_name = $3, phone = $4, whatsapp = $5,
          address = $6, province = $7, city = $8, business_hours = $9, description = $10,
          payment_wallet_type = COALESCE($11, payment_wallet_type),
          payment_account_title = COALESCE($12, payment_account_title),
          payment_account_number = COALESCE($13, payment_account_number)
        WHERE id = $14 
        RETURNING id, name, name_urdu, owner_name, phone, whatsapp, address, province, city, business_hours, description, status,
                  payment_wallet_type, payment_account_title, payment_account_number,
                  commission_rate, commission_due, commission_paid, is_locked, lock_reason`,
        [
          name, nameUrdu, ownerName, phone, whatsapp,
          address, province, city, businessHours, description,
          paymentWalletType || null, paymentAccountTitle || null, paymentAccountNumber || null,
          parseInt(pharmacyId)
        ]
      );
      res.status(200).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  });

  // Pharmacy Change Password
  router.put('/api/pharmacy/change-password', async (req, res) => {
    try {
      const { pharmacyId, currentPassword, newPassword } = req.body;
      if (!pharmacyId || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'All password fields are required.' });
      }
      const result = await pool.query("SELECT * FROM pharmacies WHERE id = $1", [parseInt(pharmacyId)]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pharmacy not found.' });
      }
      const pharmacy = result.rows[0];
      const isMatch = await bcrypt.compare(currentPassword, pharmacy.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE pharmacies SET password = $1 WHERE id = $2", [hashedPassword, parseInt(pharmacyId)]);
      res.status(200).json({ message: 'Password updated successfully.' });
    } catch (err) {
      console.error('Pharmacy change password error:', err.message);
      res.status(500).json({ error: 'Failed to update password.' });
    }
  });

  // Admin: List Orders with Payment Proofs Pending Verification
  router.get('/api/admin/orders/pending-proofs', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT o.*, p.name as pharmacy_name
        FROM orders o
        LEFT JOIN pharmacies p ON o.pharmacy_id = p.id
        WHERE o.payment_proof_url IS NOT NULL
        ORDER BY o.created_at DESC
      `);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching order proofs:', err.message);
      res.status(500).json({ error: 'Failed to fetch order payment proofs.' });
    }
  });

  // Pharmacy / Admin: Verify & Approve Customer Order Payment
  router.put('/api/pharmacy/orders/:id/verify-payment', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "UPDATE orders SET payment_status = 'paid' WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found.' });
      }
      res.status(200).json({
        success: true,
        message: 'Customer payment successfully verified by pharmacy and marked as Paid!',
        order: result.rows[0]
      });
    } catch (err) {
      console.error('Verify order payment error:', err.message);
      res.status(500).json({ error: 'Failed to verify order payment.' });
    }
  });

  // Pharmacy / Admin: Reject Customer Order Payment
  router.put('/api/pharmacy/orders/:id/reject-payment', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "UPDATE orders SET payment_status = 'rejected', status = 'cancelled' WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found.' });
      }
      res.status(200).json({
        success: true,
        message: 'Order payment rejected by pharmacy and order marked as Cancelled.',
        order: result.rows[0]
      });
    } catch (err) {
      console.error('Reject order payment error:', err.message);
      res.status(500).json({ error: 'Failed to reject order payment.' });
    }
  });

  // Admin: Verify & Approve Order Payment (legacy alias)
  router.put('/api/admin/orders/:id/verify-payment', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "UPDATE orders SET payment_status = 'paid' WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found.' });
      }
      res.status(200).json({
        success: true,
        message: 'Order payment successfully verified and marked as Paid!',
        order: result.rows[0]
      });
    } catch (err) {
      console.error('Verify order payment error:', err.message);
      res.status(500).json({ error: 'Failed to verify order payment.' });
    }
  });

  // Admin: Reject Order Payment (legacy alias)
  router.put('/api/admin/orders/:id/reject-payment', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "UPDATE orders SET payment_status = 'rejected', status = 'cancelled' WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found.' });
      }
      res.status(200).json({
        success: true,
        message: 'Order payment rejected and order marked as Cancelled.',
        order: result.rows[0]
      });
    } catch (err) {
      console.error('Reject order payment error:', err.message);
      res.status(500).json({ error: 'Failed to reject order payment.' });
    }
  });

  // ==========================================
  // PHARMACY PAYMENT & COMMISSION MANAGEMENT
  // ==========================================

  // 1. GET Pharmacy Online Payment Credentials (for Mobile Cart Checkout)
  router.get('/api/pharmacy/:id/payment-info', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `SELECT id, name, name_urdu, phone, whatsapp, 
                payment_wallet_type, payment_account_title, payment_account_number,
                commission_rate, commission_due, is_locked, lock_reason, status
         FROM pharmacies WHERE id = $1`,
        [parseInt(id)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pharmacy not found.' });
      }

      const p = result.rows[0];
      const due = parseFloat(p.commission_due) || 0.00;
      const locked = p.is_locked || due >= 2000.00;

      res.status(200).json({
        pharmacyId: p.id,
        pharmacyName: p.name,
        pharmacyNameUrdu: p.name_urdu,
        phone: p.phone,
        walletType: p.payment_wallet_type || 'JazzCash',
        accountTitle: p.payment_account_title || p.name,
        accountNumber: p.payment_account_number || p.phone,
        commissionRate: parseFloat(p.commission_rate) || 10.00,
        commissionDue: due,
        isLocked: locked,
        lockReason: p.lock_reason,
        canAcceptOrders: !locked && p.status === 'approved'
      });
    } catch (err) {
      console.error('Error fetching pharmacy payment info:', err.message);
      res.status(500).json({ error: 'Failed to fetch pharmacy payment info.' });
    }
  });

  // 2. UPDATE Pharmacy Payment Credentials
  router.put('/api/pharmacy/:id/payment-info', async (req, res) => {
    try {
      const { id } = req.params;
      const { walletType, accountTitle, accountNumber } = req.body;

      if (!accountNumber || !accountTitle) {
        return res.status(400).json({ error: 'Account title and account number are required.' });
      }

      const result = await pool.query(
        `UPDATE pharmacies 
         SET payment_wallet_type = $1, payment_account_title = $2, payment_account_number = $3
         WHERE id = $4
         RETURNING id, name, payment_wallet_type, payment_account_title, payment_account_number`,
        [walletType || 'JazzCash', accountTitle.trim(), accountNumber.trim(), parseInt(id)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pharmacy not found.' });
      }

      res.status(200).json({
        success: true,
        message: 'Payment credentials updated successfully.',
        paymentInfo: result.rows[0]
      });
    } catch (err) {
      console.error('Error updating pharmacy payment info:', err.message);
      res.status(500).json({ error: 'Failed to update payment credentials.' });
    }
  });

  // 3. GET Pharmacy Commission Status & Ledger (for Pharmacy Portal)
  router.get('/api/pharmacy/:id/commission-status', async (req, res) => {
    try {
      const { id } = req.params;
      const pId = parseInt(id);

      const pharmRes = await pool.query(
        `SELECT id, name, commission_rate, commission_due, commission_paid, is_locked, lock_reason, status
         FROM pharmacies WHERE id = $1`,
        [pId]
      );

      if (pharmRes.rows.length === 0) {
        return res.status(404).json({ error: 'Pharmacy not found.' });
      }

      const pharm = pharmRes.rows[0];
      const commissionDue = parseFloat(pharm.commission_due) || 0.00;
      const commissionPaid = parseFloat(pharm.commission_paid) || 0.00;
      const threshold = 2000.00;
      const minSettlement = 1000.00;
      const isLocked = pharm.is_locked || commissionDue >= threshold;

      // Fetch sales summary
      const salesRes = await pool.query(
        `SELECT COALESCE(SUM(total_price), 0)::float as total_sales,
                COALESCE(SUM(admin_commission), 0)::float as total_admin_commission,
                COALESCE(SUM(pharmacy_earnings), 0)::float as total_pharmacy_earnings,
                COUNT(*)::int as total_orders
         FROM orders WHERE pharmacy_id = $1`,
        [pId]
      );

      // Fetch settlement history
      const settlementsRes = await pool.query(
        `SELECT * FROM pharmacy_commission_settlements 
         WHERE pharmacy_id = $1 
         ORDER BY created_at DESC LIMIT 20`,
        [pId]
      );

      // Fetch recent orders with commission breakdown
      const recentOrdersRes = await pool.query(
        `SELECT id, total_price, admin_commission, pharmacy_earnings, payment_method, payment_status, status, created_at
         FROM orders 
         WHERE pharmacy_id = $1 
         ORDER BY created_at DESC LIMIT 10`,
        [pId]
      );

      res.status(200).json({
        pharmacyId: pharm.id,
        pharmacyName: pharm.name,
        commissionRate: parseFloat(pharm.commission_rate) || 10.00,
        commissionDue,
        commissionPaid,
        thresholdLimit: threshold,
        minSettlementAmount: minSettlement,
        remainingCredit: Math.max(0, threshold - commissionDue),
        isLocked,
        lockReason: pharm.lock_reason,
        salesSummary: salesRes.rows[0],
        recentOrders: recentOrdersRes.rows,
        settlements: settlementsRes.rows,
        adminJazzCashNumber: '03054758667',
        adminAccountTitle: 'Maveshi Sehat Official'
      });
    } catch (err) {
      console.error('Error fetching commission status:', err.message);
      res.status(500).json({ error: 'Failed to fetch commission status.' });
    }
  });

  // 4. Pharmacy Submits Commission Settlement Proof (to Admin JazzCash)
  router.post('/api/pharmacy/settlements/submit', async (req, res) => {
    try {
      const {
        pharmacyId,
        amount,
        senderPhone,
        transactionId,
        paymentMethod = 'JazzCash',
        proofBase64
      } = req.body;

      if (!pharmacyId || !amount || !senderPhone || !transactionId || !proofBase64) {
        return res.status(400).json({
          error: 'Pharmacy ID, amount, sender phone, transaction ID, and payment proof screenshot are required.'
        });
      }

      const settleAmount = parseFloat(amount);
      if (isNaN(settleAmount) || settleAmount < 1000.00) {
        return res.status(400).json({
          error: 'The minimum commission settlement transfer amount to Admin is Rs. 1,000.'
        });
      }

      const pId = parseInt(pharmacyId);
      const pharmRes = await pool.query("SELECT id, name FROM pharmacies WHERE id = $1", [pId]);
      if (pharmRes.rows.length === 0) {
        return res.status(404).json({ error: 'Pharmacy not found.' });
      }

      const pharmName = pharmRes.rows[0].name;

      // Save screenshot
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `settlement-proof-${pId}-${uniqueSuffix}.jpg`;
      const uploadDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, fileName);
      const cleanBase64 = proofBase64.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));

      const host = req.get('host');
      const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const proofUrl = `${protocol}://${host}/uploads/${fileName}`;
      await persistUploadedFile(pool, fileName, filePath, 'image/jpeg');

      // Insert settlement record
      const result = await pool.query(
        `INSERT INTO pharmacy_commission_settlements 
         (pharmacy_id, pharmacy_name, amount, payment_method, account_number, sender_phone, transaction_id, proof_image_url, status)
         VALUES ($1, $2, $3, $4, '03054758667', $5, $6, $7, 'pending')
         RETURNING *`,
        [pId, pharmName, parseFloat(amount), paymentMethod, senderPhone.trim(), transactionId.trim(), proofUrl]
      );

      // Insert Admin notification
      await pool.query(
        `INSERT INTO admin_notifications (type, message_en, message_ur)
         VALUES ($1, $2, $3)`,
        [
          'pharmacy_commission_settlement',
          `New 10% Commission Settlement Proof of Rs. ${amount} from Pharmacy '${pharmName}' (TID: ${transactionId})`,
          `فارمیسی '${pharmName}' نے کمیشن ادائیگی کی مد میں ${amount} روپے کی رسید جمع کرائی ہے — جانچ درکار ہے`
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Commission payment proof submitted successfully. Admin will verify and unlock your store shortly.',
        settlement: result.rows[0]
      });
    } catch (err) {
      console.error('Error submitting commission settlement:', err.message);
      res.status(500).json({ error: 'Failed to submit settlement proof.' });
    }
  });

  // 5. Admin: List All Pharmacy Settlements
  router.get('/api/admin/pharmacy-settlements', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT s.*, p.commission_due as current_pharmacy_due, p.is_locked as pharmacy_locked, p.phone as pharmacy_phone
        FROM pharmacy_commission_settlements s
        LEFT JOIN pharmacies p ON s.pharmacy_id = p.id
        ORDER BY s.created_at DESC
      `);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching pharmacy settlements:', err.message);
      res.status(500).json({ error: 'Failed to fetch settlements.' });
    }
  });

  // 6. Admin: Approve Pharmacy Settlement & Unlock Store
  router.put('/api/admin/pharmacy-settlements/:id/approve', async (req, res) => {
    try {
      const { id } = req.params;
      const settleRes = await pool.query(
        "SELECT * FROM pharmacy_commission_settlements WHERE id = $1",
        [parseInt(id)]
      );

      if (settleRes.rows.length === 0) {
        return res.status(404).json({ error: 'Settlement record not found.' });
      }

      const settlement = settleRes.rows[0];
      if (settlement.status === 'approved') {
        return res.status(400).json({ error: 'Settlement has already been approved.' });
      }

      const pId = settlement.pharmacy_id;
      const settleAmount = parseFloat(settlement.amount);

      // Update settlement status
      await pool.query(
        "UPDATE pharmacy_commission_settlements SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP WHERE id = $1",
        [parseInt(id)]
      );

      // Deduct from pharmacy commission_due and add to commission_paid
      const updatePharmRes = await pool.query(
        `UPDATE pharmacies 
         SET commission_due = GREATEST(0.00, commission_due - $1),
             commission_paid = commission_paid + $1,
             is_locked = CASE WHEN (commission_due - $1) < 2000.00 THEN FALSE ELSE is_locked END,
             lock_reason = CASE WHEN (commission_due - $1) < 2000.00 THEN NULL ELSE lock_reason END
         WHERE id = $2
         RETURNING id, name, commission_due, commission_paid, is_locked`,
        [settleAmount, pId]
      );

      res.status(200).json({
        success: true,
        message: `Settlement of Rs. ${settleAmount} approved! Pharmacy balance updated and store status refreshed.`,
        pharmacy: updatePharmRes.rows[0]
      });
    } catch (err) {
      console.error('Error approving pharmacy settlement:', err.message);
      res.status(500).json({ error: 'Failed to approve settlement.' });
    }
  });

  // 7. Admin: Reject Pharmacy Settlement
  router.put('/api/admin/pharmacy-settlements/:id/reject', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const result = await pool.query(
        "UPDATE pharmacy_commission_settlements SET status = 'rejected', admin_notes = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        [reason || 'Payment could not be verified in JazzCash account', parseInt(id)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Settlement record not found.' });
      }

      res.status(200).json({
        success: true,
        message: 'Settlement rejected.',
        settlement: result.rows[0]
      });
    } catch (err) {
      console.error('Error rejecting pharmacy settlement:', err.message);
      res.status(500).json({ error: 'Failed to reject settlement.' });
    }
  });

  // 8. Admin: List All Pharmacies with Commissions & Overdue Status
  router.get('/api/admin/pharmacies-commissions', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT p.id, p.name, p.owner_name, p.phone, p.status,
               p.payment_wallet_type, p.payment_account_title, p.payment_account_number,
               p.commission_rate, p.commission_due, p.commission_paid, p.is_locked, p.lock_reason,
               COALESCE(SUM(o.total_price), 0)::float as total_gross_sales,
               COALESCE(SUM(o.admin_commission), 0)::float as total_admin_commission_earned,
               COUNT(o.id)::int as total_orders
        FROM pharmacies p
        LEFT JOIN orders o ON p.id = o.pharmacy_id
        GROUP BY p.id
        ORDER BY p.commission_due DESC, p.id ASC
      `);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching pharmacies commission ledger:', err.message);
      res.status(500).json({ error: 'Failed to fetch pharmacies commission overview.' });
    }
  });

  // 9. Admin: Manually Lock / Unlock Pharmacy
  router.put('/api/admin/pharmacies/:id/toggle-lock', async (req, res) => {
    try {
      const { id } = req.params;
      const { isLocked, reason } = req.body;

      const result = await pool.query(
        "UPDATE pharmacies SET is_locked = $1, lock_reason = $2 WHERE id = $3 RETURNING id, name, is_locked, lock_reason, commission_due",
        [Boolean(isLocked), isLocked ? (reason || 'Manually locked by administrator') : null, parseInt(id)]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pharmacy not found.' });
      }

      res.status(200).json({
        success: true,
        message: `Pharmacy store ${isLocked ? 'locked' : 'unlocked'} successfully.`,
        pharmacy: result.rows[0]
      });
    } catch (err) {
      console.error('Error toggling pharmacy lock:', err.message);
      res.status(500).json({ error: 'Failed to toggle pharmacy lock status.' });
    }
  });

  return router;
};
