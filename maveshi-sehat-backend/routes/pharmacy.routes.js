const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

module.exports = (pool) => {
  // Pharmacy Registration
  router.post('/api/pharmacy/register', async (req, res) => {
    try {
      const {
        name, nameUrdu, licenseNumber, licenseExpiry, ownerName,
        cnic, phone, whatsapp, email, password, address,
        province, city, businessHours, description
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
          province, city, business_hours, description, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending') RETURNING id, name, email`,
        [
          name, nameUrdu || null, licenseNumber, licenseExpiry || null, ownerName,
          cnic || null, phone, whatsapp || null, email, hashedPassword, address || null,
          province || null, city || null, businessHours || null, description || null
        ]
      );

      await pool.query(
        `INSERT INTO admin_notifications (type, message_en, message_ur) 
         VALUES ('pharmacy_approval', $1, $2)`,
        [`New pharmacy application submitted - ${name}`, `${name} نے رجسٹریشن کی درخواست جمع کرائی — ${city || ''}`]
      );

      res.status(201).json({
        message: 'Registration successful! Pending admin approval.',
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
        return res.status(403).json({ error: 'Your pharmacy portal account is pending admin approval.' });
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

      res.status(200).json({
        stats: {
          totalRevenue,
          todayRevenue,
          monthRevenue,
          activeOrders: activeOrdersCount,
          medicineListings: medicineListingsCount,
          stockAlerts: stockAlertsCount,
          rxOrdersCount,
          pipeline
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

  // CREATE Order
  router.post('/api/pharmacy/orders', async (req, res) => {
    try {
      const { 
        buyerName, 
        buyerNameUrdu, 
        pharmacyId, 
        totalPrice, 
        paymentMethod, 
        items,
        deliveryAddress,
        phone,
        transactionId,
        paymentStatus
      } = req.body;
      if (!buyerName || !pharmacyId || !totalPrice || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Missing required parameters or empty items list.' });
      }

      const pId = parseInt(pharmacyId);

      const countRes = await pool.query("SELECT COUNT(*) FROM orders");
      const count = parseInt(countRes.rows[0].count) || 0;
      const orderId = `ORD-${1000 + count + Math.floor(Math.random() * 100)}`;

      let totalQty = 0;
      items.forEach(item => {
        totalQty += parseInt(item.quantity);
      });

      const resolvedPaymentStatus = paymentStatus || (paymentMethod === 'COD' ? 'unpaid' : 'paid');

      const orderResult = await pool.query(
        `INSERT INTO orders (id, buyer_name, buyer_name_urdu, pharmacy_id, items_count, total_price, payment_method, status, delivery_address, phone, transaction_id, payment_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11, CURRENT_TIMESTAMP) RETURNING *`,
        [
          orderId, 
          buyerName, 
          buyerNameUrdu || null, 
          pId, 
          totalQty, 
          parseFloat(totalPrice), 
          paymentMethod,
          deliveryAddress || null,
          phone || null,
          transactionId || null,
          resolvedPaymentStatus
        ]
      );

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
        "SELECT id, name, name_urdu, license_number, license_expiry, owner_name, cnic, phone, whatsapp, email, address, province, city, business_hours, description, status FROM pharmacies WHERE id = $1",
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
        address, province, city, businessHours, description
      } = req.body;

      const result = await pool.query(
        `UPDATE pharmacies SET 
          name = $1, name_urdu = $2, owner_name = $3, phone = $4, whatsapp = $5,
          address = $6, province = $7, city = $8, business_hours = $9, description = $10
        WHERE id = $11 RETURNING id, name, name_urdu, owner_name, phone, whatsapp, address, province, city, business_hours, description, status`,
        [
          name, nameUrdu, ownerName, phone, whatsapp,
          address, province, city, businessHours, description, parseInt(pharmacyId)
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

  return router;
};
