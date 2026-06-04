require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  try {
    console.log('🔄 Initializing Forum Tables...');

    // 1. Create forum_posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forum_posts (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        likes_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created forum_posts table');

    // 2. Create forum_comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forum_comments (
        id SERIAL PRIMARY KEY,
        post_id INT REFERENCES forum_posts(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created forum_comments table');

    // 3. Seed some dummy posts (matching the GUI uploaded by the user)
    const checkPosts = await pool.query('SELECT COUNT(*) FROM forum_posts');
    if (parseInt(checkPosts.rows[0].count) === 0) {
      // Find default farmer user (Awais shabbir) to attach posts to
      const farmerRes = await pool.query("SELECT id FROM users WHERE role = 'farmer' LIMIT 1");
      if (farmerRes.rows.length > 0) {
        const farmerId = farmerRes.rows[0].id;
        
        // Post 1 (Ahmed Hussain mockup)
        const post1 = await pool.query(`
          INSERT INTO forum_posts (user_id, title, description, category, likes_count, created_at)
          VALUES (
            $1, 
            'My buffalo had FMD last month. Used the AI scan and followed vet advice.',
            'My buffalo had FMD last month. Used the AI scan and followed vet advice. She''s fully recovered now! Thanks Maveshi Sehat AI.\n\nمیری بھینس کو پچھلے مہینے ایف ایم ڈی ہوا تھا۔ اے آئی اسکین استعمال کیا اور ڈاکٹر کی ہدایات پر عمل کیا۔ اب وہ مکمل طور پر صحت یاب ہے! شکریہ مویشی صحت اے آئی۔',
            'Trending',
            24,
            NOW() - INTERVAL '2 hours'
          ) RETURNING id
        `, [farmerId]);

        // Post 2 (Fatima Khan mockup)
        const post2 = await pool.query(`
          INSERT INTO forum_posts (user_id, title, description, category, likes_count, created_at)
          VALUES (
            $1, 
            'What''s the best vaccination schedule for newborn calves?',
            'Question: What''s the best vaccination schedule for newborn calves? Need advice from experienced farmers.\n\nسوال: نوزائیدہ بچھڑوں کے لیے بہترین ویکسینیشن شیڈول کیا ہے؟ تجربہ کار کسانوں سے مشورہ چاہیے۔',
            'All Posts',
            15,
            NOW() - INTERVAL '5 hours'
          ) RETURNING id
        `, [farmerId]);

        console.log('🌱 Seeded default mock forum posts successfully!');
      } else {
        console.log('⚠️ No farmer user found to associate seeded posts with.');
      }
    }

  } catch (err) {
    console.error('❌ Error creating forum tables:', err.message);
  } finally {
    pool.end();
  }
}

main();
