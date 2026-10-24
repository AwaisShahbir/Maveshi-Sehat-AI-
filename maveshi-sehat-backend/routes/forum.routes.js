const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'forum-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, PNG, WEBP, and GIF images are allowed!'));
  }
});

module.exports = (pool) => {
  // Standalone upload endpoint
  router.post('/api/forum/upload', upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      res.status(200).json({ imageUrl });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Image upload failed' });
    }
  });

  // Get Forum Posts (with category filtering)
  router.get('/api/forum/posts', async (req, res) => {
    try {
      const { category } = req.query;
      let query = `
        SELECT fp.*, u.full_name as author_name, u.role as author_role,
               (SELECT COUNT(*) FROM forum_comments fc WHERE fc.post_id = fp.id) as comments_count
        FROM forum_posts fp
        JOIN users u ON fp.user_id = u.id
      `;
      const params = [];
      if (category && category !== 'All' && category !== 'All Posts') {
        if (category === 'Trending') {
          query += ` WHERE fp.category = $1 OR fp.likes_count >= 20`;
        } else {
          query += ` WHERE fp.category = $1`;
        }
        params.push(category);
      }
      query += ` ORDER BY fp.created_at DESC`;
      const result = await pool.query(query, params);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching forum posts:', err.message);
      res.status(500).json({ error: 'Server error fetching forum posts' });
    }
  });

  // Create Forum Post (supports multipart image attachment or JSON)
  router.post('/api/forum/posts', upload.single('image'), async (req, res) => {
    try {
      const { userName, userId: providedUserId, title, description, category, imageUrl: directImageUrl } = req.body;
      if (!title || !description || !category) {
        return res.status(400).json({ error: 'Title, description, and category are required' });
      }
      if (!userName && !providedUserId) {
        return res.status(400).json({ error: 'User identification is required' });
      }

      let resolvedUserId = providedUserId ? parseInt(providedUserId) : null;

      if (!resolvedUserId && userName) {
        const userRes = await pool.query(
          'SELECT id FROM users WHERE TRIM(LOWER(full_name)) = TRIM(LOWER($1)) LIMIT 1',
          [userName.trim()]
        );
        if (userRes.rows.length === 0) {
          return res.status(404).json({ error: 'User not found. Please make sure you are logged in.' });
        }
        resolvedUserId = userRes.rows[0].id;
      }

      let finalImageUrl = directImageUrl || null;
      if (req.file) {
        finalImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      }

      const result = await pool.query(
        'INSERT INTO forum_posts (user_id, title, description, category, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [resolvedUserId, title.trim(), description.trim(), category, finalImageUrl]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error creating forum post:', err.message);
      res.status(500).json({ error: 'Server error creating forum post' });
    }
  });

  // Get Forum Post Details with Comments
  router.get('/api/forum/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const postRes = await pool.query(`
        SELECT fp.*, u.full_name as author_name, u.role as author_role
        FROM forum_posts fp
        JOIN users u ON fp.user_id = u.id
        WHERE fp.id = $1
      `, [id]);
      if (postRes.rows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }
      const commentsRes = await pool.query(`
        SELECT fc.*, u.full_name as author_name, u.role as author_role
        FROM forum_comments fc
        JOIN users u ON fc.user_id = u.id
        WHERE fc.post_id = $1
        ORDER BY fc.created_at ASC
      `, [id]);
      res.status(200).json({
        post: postRes.rows[0],
        comments: commentsRes.rows
      });
    } catch (err) {
      console.error('Error fetching forum post details:', err.message);
      res.status(500).json({ error: 'Server error fetching post details' });
    }
  });

  // Post Comment on Forum Post
  router.post('/api/forum/posts/:id/comments', upload.single('image'), async (req, res) => {
    try {
      const { id } = req.params;
      const { userName, userId: providedUserId, comment, parentCommentId, imageUrl: directImageUrl } = req.body;
      if (!comment || !comment.trim()) {
        return res.status(400).json({ error: 'Comment text is required' });
      }
      if (!userName && !providedUserId) {
        return res.status(400).json({ error: 'User identification is required' });
      }

      let resolvedUserId = providedUserId ? parseInt(providedUserId) : null;

      if (!resolvedUserId && userName) {
        const userRes = await pool.query(
          'SELECT id FROM users WHERE TRIM(LOWER(full_name)) = TRIM(LOWER($1)) LIMIT 1',
          [userName.trim()]
        );
        if (userRes.rows.length === 0) {
          return res.status(404).json({ error: 'User not found. Please make sure you are logged in.' });
        }
        resolvedUserId = userRes.rows[0].id;
      }

      const parentId = parentCommentId ? parseInt(parentCommentId) : null;

      let finalImageUrl = directImageUrl || null;
      if (req.file) {
        finalImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      }

      const result = await pool.query(
        'INSERT INTO forum_comments (post_id, user_id, comment, parent_comment_id, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [id, resolvedUserId, comment.trim(), parentId, finalImageUrl]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error posting comment:', err.message);
      res.status(500).json({ error: 'Server error posting comment' });
    }
  });

  // Like a Comment
  router.post('/api/forum/comments/:id/like', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        'UPDATE forum_comments SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count',
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      res.status(200).json({ likesCount: result.rows[0].likes_count });
    } catch (err) {
      console.error('Error liking comment:', err.message);
      res.status(500).json({ error: 'Server error liking comment' });
    }
  });

  // Like a Post
  router.post('/api/forum/posts/:id/like', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        'UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count',
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.status(200).json({ likesCount: result.rows[0].likes_count });
    } catch (err) {
      console.error('Error liking post:', err.message);
      res.status(500).json({ error: 'Server error liking post' });
    }
  });

  // Delete Forum Post (cascades to comments)
  router.delete('/api/forum/posts/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM forum_comments WHERE post_id = $1', [id]);
      const result = await pool.query('DELETE FROM forum_posts WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.status(200).json({ success: true, message: 'Forum post deleted successfully' });
    } catch (err) {
      console.error('Error deleting forum post:', err.message);
      res.status(500).json({ error: 'Server error deleting forum post' });
    }
  });

  // Delete Forum Comment
  router.delete('/api/forum/comments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      // Delete any nested replies first
      await pool.query('DELETE FROM forum_comments WHERE parent_comment_id = $1', [id]);
      const result = await pool.query('DELETE FROM forum_comments WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      res.status(200).json({ success: true, message: 'Comment deleted successfully' });
    } catch (err) {
      console.error('Error deleting comment:', err.message);
      res.status(500).json({ error: 'Server error deleting comment' });
    }
  });

  return router;
};
