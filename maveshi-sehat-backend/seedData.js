require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function seed() {
  try {
    console.log('Seeding database...');
    
    // Hash admin password and default passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassHash = await bcrypt.hash('awais0810', salt);
    const passHash = await bcrypt.hash('password123', salt);

    // 1. Seed Users (Super Admin, Vets, Farmers/Owners)
    const usersQuery = `
      INSERT INTO users (full_name, phone_number, email, district, role, password, status, specialization, experience_years, pvmc_number) VALUES
      ('Super Admin', '+92 300 1234567', 'awais@gmail.com', 'Lahore', 'admin', $1, 'approved', NULL, NULL, NULL),
      
      -- Pending Vets (from Vet Verification Screen)
      ('Dr. Muhammad Aslam', '0311-4567890', 'dr.aslam@maveshisehat.pk', 'Lahore', 'vet', $2, 'pending', 'Large Animal Specialist', 5, 'PVMC-2023-4521'),
      ('Dr. Sara Ahmed', '0322-3456789', 'dr.sara@maveshisehat.pk', 'Karachi', 'vet', $2, 'pending', 'Dairy Cattle Expert', 8, 'PVMC-2024-1102'),
      ('Dr. Hassan Ali', '0333-2345678', 'dr.hassan@maveshisehat.pk', 'Multan', 'vet', $2, 'pending', 'Buffalo & Goat Care', 6, 'PVMC-2023-8834'),
      ('Dr. Amjad Khan', '0344-1234567', 'dr.amjad@maveshisehat.pk', 'Faisalabad', 'vet', $2, 'pending', 'General Livestock Care', 4, 'PVMC-2024-5567'),
      ('Dr. Zainab Tariq', '0355-9876543', 'dr.zainab@maveshisehat.pk', 'Peshawar', 'vet', $2, 'pending', 'Goat and sheep specialist', 7, 'PVMC-2023-9921'),
      ('Dr. Bilal Hussain', '0366-5432109', 'dr.bilal@maveshisehat.pk', 'Rawalpindi', 'vet', $2, 'pending', 'Surgical procedures expert', 10, 'PVMC-2024-3312'),
      
      -- Active Vets (for user management & recent assignments)
      ('Dr. Rahim Malik', '0322-9988776', 'dr.rahim@maveshisehat.pk', 'Lahore', 'vet', $2, 'verified', 'Large Animal Specialist', 6, 'PVMC-2022-7744'),
      ('Dr. Khalid Mahmood', '0333-8877665', 'dr.khalid@maveshisehat.pk', 'Karachi', 'vet', $2, 'verified', 'Dairy Cattle Expert', 9, 'PVMC-2021-9988'),
      ('Dr. Farhan Ali', '0310-7766554', 'dr.farhan@maveshisehat.pk', 'Islamabad', 'vet', $2, 'verified', 'Livestock Health', 5, 'PVMC-2023-2211'),

      -- Owners (Farmers)
      ('Ahmad Khan', '0311-1111111', 'ahmad@maveshisehat.pk', 'Sahiwal', 'farmer', $2, 'active', NULL, NULL, NULL),
      ('Zahid Ali', '0322-2222222', 'zahid@maveshisehat.pk', 'Multan', 'farmer', $2, 'active', NULL, NULL, NULL),
      ('Fatima Bibi', '0333-3333333', 'fatima@maveshisehat.pk', 'Faisalabad', 'farmer', $2, 'blocked', NULL, NULL, NULL),
      ('Hassan Raza', '0344-4444444', 'hassan@maveshisehat.pk', 'Okara', 'farmer', $2, 'active', NULL, NULL, NULL),
      ('Asif Mahmood', '0355-5555555', 'asif@maveshisehat.pk', 'Sialkot', 'farmer', $2, 'active', NULL, NULL, NULL),
      ('Nadia Saleem', '0366-6666666', 'nadia@maveshisehat.pk', 'Gujranwala', 'farmer', $2, 'active', NULL, NULL, NULL)
      RETURNING id, full_name, role;
    `;
    const usersResult = await pool.query(usersQuery, [adminPassHash, passHash]);
    const usersMap = {};
    usersResult.rows.forEach(r => {
      usersMap[r.full_name] = r.id;
    });
    console.log('✅ Seeded users');

    // 2. Seed Pharmacies
    const pharmaciesQuery = `
      INSERT INTO pharmacies (name, license_number, owner_name, address, phone, status) VALUES
      -- Pending Pharmacies
      ('Al-Shifa Medical Store', 'DRAP-2024-8823', 'Haji Muhammad Saleem', 'Main Bazar, Sahiwal, Punjab', '042-3561-2233', 'pending'),
      ('Punjab Livestock Pharma', 'DRAP-2024-5512', 'Ahmed Raza Khan', 'Canal Road, Multan, Punjab', '061-4523-1122', 'pending'),
      ('Al-Noor Medical Store', 'DRAP-2023-9934', 'Tariq Mehmood', 'GT Road, Gujranwala, Punjab', '055-3782-4455', 'pending'),
      
      -- Approved Pharmacies
      ('Farooq Labs', 'DRAP-2023-1234', 'Dr. Farooq', 'Lahore, Punjab', '0321-1234567', 'approved'),
      ('National Vet Supplies', 'DRAP-2022-5678', 'Zafar Iqbal', 'Karachi, Sindh', '0331-1234567', 'approved'),
      ('Livestock Care Pharma', 'DRAP-2023-9012', 'Muhammad Ali', 'Faisalabad, Punjab', '0341-1234567', 'approved'),
      ('Green Valley Medical', 'DRAP-2024-3456', 'Sajid Hussain', 'Sialkot, Punjab', '0351-1234567', 'approved'),
      ('Pak Vet Store', 'DRAP-2023-7890', 'Jamil Khan', 'Rawalpindi, Punjab', '0361-1234567', 'approved')
      RETURNING id, name;
    `;
    const pharmResult = await pool.query(pharmaciesQuery);
    const pharmMap = {};
    pharmResult.rows.forEach(p => {
      pharmMap[p.name] = p.id;
    });
    console.log('✅ Seeded pharmacies');

    // 3. Seed Medicines
    const medicinesQuery = `
      INSERT INTO medicines (name, category, pharmacy_id, price, stock, status) VALUES
      ('LSD Vaccine (Neethling)', 'Vaccine', $1, 850.00, 240, 'active'),
      ('Oxytetracycline 20%', 'Antibiotic', $2, 420.00, 87, 'active'),
      ('Deltamethrin Tick Grease', 'Antiparasitic', $3, 290.00, 12, 'low_stock'),
      ('FMD Vaccine', 'Vaccine', $4, 1200.00, 0, 'out_of_stock'),
      ('Ivermectin Injection', 'Antiparasitic', $5, 380.00, 156, 'active'),
      ('Vitamin AD3E Injectable', 'Vitamin', $1, 520.00, 94, 'active'),
      ('PPR Vaccine', 'Vaccine', $4, 650.00, 78, 'active'),
      ('Penicillin-Streptomycin', 'Antibiotic', $2, 340.00, 143, 'active'),
      ('Calcium Borogluconate', 'Vitamin', $3, 280.00, 8, 'low_stock'),
      ('Albendazole Suspension', 'Antiparasitic', $5, 190.00, 201, 'active');
    `;
    await pool.query(medicinesQuery, [
      pharmMap['Al-Shifa Medical Store'] || null,
      pharmMap['Farooq Labs'] || null,
      pharmMap['Punjab Livestock Pharma'] || null,
      pharmMap['National Vet Supplies'] || null,
      pharmMap['Livestock Care Pharma'] || null
    ]);
    console.log('✅ Seeded medicines');

    // 4. Seed Orders
    const ordersQuery = `
      INSERT INTO orders (id, buyer_name, pharmacy_id, items_count, total_price, payment_method, status, created_at) VALUES
      ('ORD-1047', 'Ahmad Khan', $1, 2, 1270.00, 'JazzCash', 'dispatched', '2025-05-12 14:00:00'),
      ('ORD-1046', 'Zahid Ali', $2, 1, 420.00, 'Easypaisa', 'delivered', '2025-05-11 11:30:00'),
      ('ORD-1045', 'Fatima Bibi', $3, 3, 890.00, 'COD', 'pending', '2025-05-10 09:15:00'),
      ('ORD-1044', 'Hassan Raza', $4, 1, 1200.00, 'Bank Transfer', 'delivered', '2025-05-09 16:45:00'),
      ('ORD-1043', 'Nadia Ahmed', $1, 4, 1850.00, 'JazzCash', 'dispatched', '2025-05-08 12:00:00'),
      ('ORD-1042', 'Tariq Mehmood', $5, 2, 760.00, 'Easypaisa', 'delivered', '2025-05-07 10:20:00'),
      ('ORD-1041', 'Ayesha Khan', $2, 1, 340.00, 'COD', 'cancelled', '2025-05-06 15:10:00'),
      ('ORD-1040', 'Imran Siddiqui', $1, 5, 2340.00, 'JazzCash', 'delivered', '2025-05-05 13:40:00'),
      ('ORD-1039', 'Saima Bibi', $3, 2, 580.00, 'Bank Transfer', 'dispatched', '2025-05-04 11:00:00'),
      ('ORD-1038', 'Khalid Mahmood', $4, 3, 1450.00, 'Easypaisa', 'pending', '2025-05-03 08:30:00');
    `;
    await pool.query(ordersQuery, [
      pharmMap['Al-Shifa Medical Store'] || null,
      pharmMap['Farooq Labs'] || null,
      pharmMap['Punjab Livestock Pharma'] || null,
      pharmMap['National Vet Supplies'] || null,
      pharmMap['Livestock Care Pharma'] || null
    ]);
    console.log('✅ Seeded orders');

    // 5. Seed Detections
    const detectionsQuery = `
      INSERT INTO detections (id, owner_name, animal_type, disease, confidence, risk_level, vet_id, status, province, created_at) VALUES
      ('HR-1847', 'Ahmad Khan', 'Cow', 'LSD', 87.00, 'High', $1, 'Reviewed', 'Punjab', '2025-05-12 16:30:00'),
      ('HR-1846', 'Zahid Ali', 'Buffalo', 'Tick', 74.00, 'Medium', NULL, 'pending_vet', 'Punjab', '2025-05-08 13:22:00'),
      ('HR-1845', 'Fatima Bibi', 'Cow', 'FMD', 91.00, 'High', $2, 'Reviewed', 'Punjab', '2025-05-03 10:11:00'),
      ('HR-1844', 'Arif Hussain', 'Goat', 'BCS Normal', 98.00, 'Low', NULL, 'Auto-resolved', 'KPK', '2025-05-01 09:05:00'),
      ('HR-1843', 'Nasir Mehmood', 'Cow', 'LSD', 83.00, 'High', $1, 'Reviewed', 'Punjab', '2025-04-28 14:00:00'),
      ('HR-1842', 'Hassan Ali', 'Buffalo', 'Mastitis', 79.00, 'Medium', $3, 'Reviewed', 'Punjab', '2025-04-25 11:50:00'),
      ('HR-1841', 'Saima Bibi', 'Goat', 'PPR', 88.00, 'High', $4, 'Reviewed', 'Sindh', '2025-04-22 17:30:00'),
      ('HR-1840', 'Khalid Mahmood', 'Cow', 'Healthy', 96.00, 'Low', NULL, 'Auto-resolved', 'Sindh', '2025-04-20 15:40:00'),
      ('HR-1839', 'Nadia Ahmed', 'Buffalo', 'FMD', 85.00, 'High', $5, 'Reviewed', 'Punjab', '2025-04-18 10:20:00'),
      ('HR-1838', 'Tariq Raza', 'Goat', 'Tick', 72.00, 'Medium', NULL, 'pending_vet', 'Balochistan', '2025-04-15 08:15:00'),
      ('HR-1837', 'Ayesha Khan', 'Cow', 'BCS Normal', 94.00, 'Low', NULL, 'Auto-resolved', 'KPK', '2025-04-12 11:30:00'),
      ('HR-1836', 'Imran Siddiqui', 'Buffalo', 'LSD', 89.00, 'High', $6, 'Reviewed', 'Punjab', '2025-04-10 14:22:00');
    `;
    await pool.query(detectionsQuery, [
      usersMap['Dr. Rahim Malik'] || null,
      usersMap['Dr. Sara Ahmed'] || null, // temporarily use pending or active vets
      usersMap['Dr. Amjad Khan'] || null,
      usersMap['Dr. Zainab Tariq'] || null,
      usersMap['Dr. Hassan Ali'] || null,
      usersMap['Dr. Bilal Hussain'] || null
    ]);
    console.log('✅ Seeded detections');

    // 6. Seed Admin Notifications
    const adminNotifQuery = `
      INSERT INTO admin_notifications (type, message_en, message_ur, read, created_at) VALUES
      ('vet_application', 'New vet application submitted - Dr. Amjad Khan', 'ڈاکٹر امجد خان نے تصدیق جمع کرائی — لاہور', FALSE, NOW() - INTERVAL '5 minutes'),
      ('high_risk_case', 'High risk case unattended — 6 hours', 'فاطمہ بی بی کا ایف ایم ڈی کیس — ڈاکٹر نہیں ملا', FALSE, NOW() - INTERVAL '1 hour'),
      ('pharmacy_approval', 'New pharmacy approval request - Al-Noor Medical Store', 'النور میڈیکل اسٹور — ملتان', FALSE, NOW() - INTERVAL '3 hours'),
      ('order_dispatched', 'Order #ORD-1047 dispatched to Ahmad Khan', 'آرڈر احمد خان کو بھیج دیا گیا', TRUE, NOW() - INTERVAL '5 hours'),
      ('vet_approved', 'Vet verification approved - Dr. Sara Ahmed', 'ڈاکٹر سارہ احمد کی تصدیق ہو گئی', TRUE, NOW() - INTERVAL '1 day'),
      ('low_stock', 'Low stock alert: Deltamethrin Tick Grease', 'ٹک گریس کم ہو گئی — صرف 12 یونٹ باقی', TRUE, NOW() - INTERVAL '1 day');
    `;
    await pool.query(adminNotifQuery);
    console.log('✅ Seeded admin notifications');

    console.log('🚀 Database Seeding Completed Successfully!');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
  } finally {
    pool.end();
  }
}

seed();
