const router = require('express').Router();
const pool = require('../db');
const { adminRequired } = require('../middleware/adminAuth');

// ============================================
// DASHBOARD STATS
// ============================================

// GET /api/admin/dashboard
router.get('/dashboard', adminRequired, async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalTherapists = await pool.query('SELECT COUNT(*) as count FROM specialists WHERE verified = true');
    const pendingTherapists = await pool.query('SELECT COUNT(*) as count FROM specialists WHERE verified = false');
    const totalPosts = await pool.query('SELECT COUNT(*) as count FROM posts');
    const flaggedPosts = await pool.query('SELECT COUNT(*) as count FROM posts WHERE flagged = true');
    const totalAppointments = await pool.query('SELECT COUNT(*) as count FROM appointments');

    res.json({
      stats: {
        totalUsers: totalUsers.rows[0].count,
        totalTherapists: totalTherapists.rows[0].count,
        pendingTherapists: pendingTherapists.rows[0].count,
        totalPosts: totalPosts.rows[0].count,
        flaggedPosts: flaggedPosts.rows[0].count,
        totalAppointments: totalAppointments.rows[0].count
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ============================================
// THERAPIST MANAGEMENT
// ============================================

// GET /api/admin/therapists/pending
router.get('/therapists/pending', adminRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, specialist_type, location, email, contact_phone, created_at
       FROM specialists WHERE verified = false ORDER BY created_at DESC`
    );
    res.json({ therapists: rows });
  } catch (err) {
    console.error('Pending therapists error:', err);
    res.status(500).json({ error: 'Failed to fetch pending therapists' });
  }
});

// GET /api/admin/therapists
router.get('/therapists', adminRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, specialist_type, location, email, contact_phone, verified, created_at
       FROM specialists ORDER BY name ASC`
    );
    res.json({ therapists: rows });
  } catch (err) {
    console.error('Therapists list error:', err);
    res.status(500).json({ error: 'Failed to fetch therapists' });
  }
});

// GET /api/admin/therapists/:id
router.get('/therapists/:id', adminRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM specialists WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    res.json({ therapist: rows[0] });
  } catch (err) {
    console.error('Get therapist error:', err);
    res.status(500).json({ error: 'Failed to fetch therapist' });
  }
});

// POST /api/admin/therapists/:id/verify
router.post('/therapists/:id/verify', adminRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE specialists SET verified = true, verified_by = $1, verified_at = NOW() WHERE id = $2 RETURNING *',
      [req.user.id, req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    console.log(`Admin ${req.user.email} verified therapist ${rows[0].name}`);
    res.json({ therapist: rows[0], message: 'Therapist verified successfully' });
  } catch (err) {
    console.error('Verify therapist error:', err);
    res.status(500).json({ error: 'Failed to verify therapist' });
  }
});

// POST /api/admin/therapists/:id/reject
router.post('/therapists/:id/reject', adminRequired, async (req, res) => {
  const { reason } = req.body || {};
  try {
    const { rows } = await pool.query(
      'UPDATE specialists SET verified = false, rejection_reason = $1, rejected_by = $2, rejected_at = NOW() WHERE id = $3 RETURNING *',
      [reason || 'Admin rejection', req.user.id, req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    console.log(`Admin ${req.user.email} rejected therapist ${rows[0].name}`);
    res.json({ therapist: rows[0], message: 'Therapist rejected' });
  } catch (err) {
    console.error('Reject therapist error:', err);
    res.status(500).json({ error: 'Failed to reject therapist' });
  }
});

// DELETE /api/admin/therapists/:id
router.delete('/therapists/:id', adminRequired, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM specialists WHERE id = $1', [req.params.id]);
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    console.log(`Admin ${req.user.email} deleted therapist ${req.params.id}`);
    res.json({ message: 'Therapist deleted successfully' });
  } catch (err) {
    console.error('Delete therapist error:', err);
    res.status(500).json({ error: 'Failed to delete therapist' });
  }
});

// ============================================
// CONTENT MODERATION (Posts)
// ============================================

// GET /api/admin/posts/flagged
router.get('/posts/flagged', adminRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.user_id, p.content, p.flagged, p.created_at, u.name, u.email
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.flagged = true
       ORDER BY p.created_at DESC`
    );
    res.json({ posts: rows });
  } catch (err) {
    console.error('Flagged posts error:', err);
    res.status(500).json({ error: 'Failed to fetch flagged posts' });
  }
});

// GET /api/admin/posts
router.get('/posts', adminRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.user_id, p.content, p.flagged, p.created_at, u.name, u.email
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC LIMIT 50`
    );
    res.json({ posts: rows });
  } catch (err) {
    console.error('Posts list error:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST /api/admin/posts/:id/approve
router.post('/posts/:id/approve', adminRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE posts SET flagged = false, moderated_by = $1, moderated_at = NOW() WHERE id = $2 RETURNING *',
      [req.user.id, req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Post not found' });
    }
    console.log(`Admin ${req.user.email} approved post ${req.params.id}`);
    res.json({ post: rows[0], message: 'Post approved' });
  } catch (err) {
    console.error('Approve post error:', err);
    res.status(500).json({ error: 'Failed to approve post' });
  }
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', adminRequired, async (req, res) => {
  const { reason } = req.body || {};
  try {
    // Store deletion log
    await pool.query(
      'INSERT INTO deleted_content (content_type, content_id, reason, deleted_by) VALUES ($1, $2, $3, $4)',
      ['post', req.params.id, reason || 'Admin deletion', req.user.id]
    );

    const result = await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Post not found' });
    }
    console.log(`Admin ${req.user.email} deleted post ${req.params.id}`);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ============================================
// FORUM MODERATION (Comments)
// ============================================

// GET /api/admin/comments/flagged
router.get('/comments/flagged', adminRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.post_id, c.user_id, c.content, c.flagged, c.created_at, u.name, u.email
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.flagged = true
       ORDER BY c.created_at DESC`
    );
    res.json({ comments: rows });
  } catch (err) {
    console.error('Flagged comments error:', err);
    res.status(500).json({ error: 'Failed to fetch flagged comments' });
  }
});

// POST /api/admin/comments/:id/approve
router.post('/comments/:id/approve', adminRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE comments SET flagged = false, moderated_by = $1, moderated_at = NOW() WHERE id = $2 RETURNING *',
      [req.user.id, req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    console.log(`Admin ${req.user.email} approved comment ${req.params.id}`);
    res.json({ comment: rows[0], message: 'Comment approved' });
  } catch (err) {
    console.error('Approve comment error:', err);
    res.status(500).json({ error: 'Failed to approve comment' });
  }
});

// DELETE /api/admin/comments/:id
router.delete('/comments/:id', adminRequired, async (req, res) => {
  const { reason } = req.body || {};
  try {
    // Store deletion log
    await pool.query(
      'INSERT INTO deleted_content (content_type, content_id, reason, deleted_by) VALUES ($1, $2, $3, $4)',
      ['comment', req.params.id, reason || 'Admin deletion', req.user.id]
    );

    const result = await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    console.log(`Admin ${req.user.email} deleted comment ${req.params.id}`);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

// GET /api/admin/users
router.get('/users', adminRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ users: rows });
  } catch (err) {
    console.error('Users list error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users/:id/ban
router.post('/users/:id/ban', adminRequired, async (req, res) => {
  const { reason } = req.body || {};
  try {
    const { rows } = await pool.query(
      'UPDATE users SET banned = true, ban_reason = $1, banned_by = $2, banned_at = NOW() WHERE id = $3 RETURNING id, name, email',
      [reason || 'Admin ban', req.user.id, req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(`Admin ${req.user.email} banned user ${rows[0].email}`);
    res.json({ user: rows[0], message: 'User banned successfully' });
  } catch (err) {
    console.error('Ban user error:', err);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// POST /api/admin/users/:id/unban
router.post('/users/:id/unban', adminRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE users SET banned = false, ban_reason = null WHERE id = $1 RETURNING id, name, email',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(`Admin ${req.user.email} unbanned user ${rows[0].email}`);
    res.json({ user: rows[0], message: 'User unbanned successfully' });
  } catch (err) {
    console.error('Unban user error:', err);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// ============================================
// MODERATION ACTIVITY LOG
// ============================================

// GET /api/admin/activity
router.get('/activity', adminRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM admin_activity
       ORDER BY created_at DESC LIMIT 100`
    );
    res.json({ activity: rows });
  } catch (err) {
    console.error('Activity log error:', err);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

module.exports = router;
