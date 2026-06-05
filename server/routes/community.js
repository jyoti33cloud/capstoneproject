const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

// GET /api/community/posts?category=all|behavior|schooling|therapy
router.get('/posts', async (req, res) => {
  const { category = 'all' } = req.query;
  try {
    let sql = `
      SELECT p.*, u.name AS author_name, u.city AS author_city, u.avatar_url AS author_avatar,
             COALESCE(l.likes, 0) AS likes,
             COALESCE(r.replies, 0) AS replies
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN (SELECT post_id, COUNT(*)::int AS likes FROM post_likes GROUP BY post_id) l
        ON l.post_id = p.id
      LEFT JOIN (SELECT post_id, COUNT(*)::int AS replies FROM replies GROUP BY post_id) r
        ON r.post_id = p.id
    `;
    const params = [];
    if (category !== 'all') {
      params.push(category);
      sql += ` WHERE p.category = $${params.length}`;
    }
    sql += ' ORDER BY p.created_at DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST /api/community/posts
router.post('/posts', authRequired, async (req, res) => {
  const { title, body, category } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  const cat = ['behavior', 'schooling', 'therapy', 'general'].includes(category) ? category : 'general';
  try {
    const { rows } = await pool.query(
      `INSERT INTO posts (user_id, title, body, category)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, title, body, cat]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// POST /api/community/posts/:id/like  (toggle)
router.post('/posts/:id/like', authRequired, async (req, res) => {
  const postId = req.params.id;
  try {
    const existing = await pool.query(
      'SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2',
      [req.user.id, postId]
    );
    if (existing.rowCount) {
      await pool.query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2',
        [req.user.id, postId]);
      return res.json({ liked: false });
    }
    await pool.query('INSERT INTO post_likes (user_id, post_id) VALUES ($1,$2)',
      [req.user.id, postId]);
    res.json({ liked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// GET /api/community/posts/:id/replies
router.get('/posts/:id/replies', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.*, u.name AS author_name, u.avatar_url AS author_avatar
     FROM replies r JOIN users u ON u.id = r.user_id
     WHERE post_id = $1 ORDER BY created_at ASC`,
    [req.params.id]
  );
  res.json(rows);
});

// POST /api/community/posts/:id/replies
router.post('/posts/:id/replies', authRequired, async (req, res) => {
  const { body } = req.body || {};
  if (!body) return res.status(400).json({ error: 'body required' });
  const { rows } = await pool.query(
    'INSERT INTO replies (post_id, user_id, body) VALUES ($1,$2,$3) RETURNING *',
    [req.params.id, req.user.id, body]
  );
  res.json(rows[0]);
});

module.exports = router;
