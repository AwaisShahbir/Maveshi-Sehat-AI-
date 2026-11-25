require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testAdminEndpoints() {
  try {
    const statsRes = await pool.query(`
      SELECT 
        COUNT(CASE WHEN role = 'vet' AND status = 'verified' THEN 1 END)::int as active_vets,
        COUNT(CASE WHEN role = 'vet' AND status = 'pending' THEN 1 END)::int as pending_vets
      FROM users
    `);
    console.log('STATS:', statsRes.rows[0]);

    const vetCommRes = await pool.query(`
      SELECT u.id, u.full_name, u.phone_number, u.district, u.specialization,
             u.status, u.consultation_mode,
             COALESCE(u.consultation_fee, 300.00)::float as consultation_fee,
             COALESCE(u.commission_rate, 10.00)::float as commission_rate,
             COALESCE(u.commission_due, 0.00)::float as commission_due,
             COALESCE(u.commission_paid, 0.00)::float as commission_paid,
             u.payment_wallet_type, u.payment_account_title, u.payment_account_number,
             COUNT(c.id)::int as total_consultations,
             COUNT(CASE WHEN c.payment_status = 'paid' OR c.status IN ('approved', 'completed') THEN 1 END)::int as paid_consultations,
             COALESCE(SUM(CASE WHEN c.payment_status = 'paid' OR c.status IN ('approved', 'completed') THEN c.fee ELSE 0 END), 0)::float as total_gross_fees,
             COALESCE(SUM(CASE WHEN c.payment_status = 'paid' OR c.status IN ('approved', 'completed') THEN c.admin_commission ELSE 0 END), 0)::float as total_admin_commission_earned,
             COALESCE(SUM(CASE WHEN c.payment_status = 'paid' OR c.status IN ('approved', 'completed') THEN c.vet_earnings ELSE 0 END), 0)::float as total_vet_earnings
      FROM users u
      LEFT JOIN consultations c ON u.id = c.vet_id
      WHERE u.role = 'vet'
      GROUP BY u.id
      ORDER BY u.commission_due DESC, u.id ASC
    `);
    console.log('VET COMMISSIONS ROWS COUNT:', vetCommRes.rows.length);
    console.log('FIRST VET ROW:', vetCommRes.rows[0]);

    pool.end();
  } catch (err) {
    console.error('TEST ERROR:', err);
    pool.end();
  }
}

testAdminEndpoints();
