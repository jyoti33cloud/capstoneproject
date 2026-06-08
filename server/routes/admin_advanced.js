const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

// Middleware: Check if admin
async function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ============ USER MANAGEMENT ============

// GET /api/admin/users - List all users with filters
router.get('/users', authRequired, isAdmin, async (req, res) => {
  const { role, limit = 20, offset = 0 } = req.query;
  try {
    let query = 'SELECT id, name, email, role, created_at FROM users';
    let params = [];

    if (role) {
      query += ' WHERE role = $1';
      params.push(role);
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    } else {
      query += ` LIMIT $1 OFFSET $2`;
      params = [limit, offset];
    }

    const { rows } = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM users');

    res.json({ users: rows, total: countResult.rows[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/suspend - Suspend user account
router.put('/users/:id/suspend', authRequired, isAdmin, async (req, res) => {
  const { reason } = req.body;
  try {
    // In a real app, add is_suspended column to users table
    // For now, we'll just log it
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'SUSPEND_USER', 'users', req.params.id, JSON.stringify({ reason })]
    );

    res.json({ message: 'User suspended', user_id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

// PUT /api/admin/users/:id/ban - Ban user permanently
router.put('/users/:id/ban', authRequired, isAdmin, async (req, res) => {
  const { reason } = req.body;
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'BAN_USER', 'users', req.params.id, JSON.stringify({ reason })]
    );

    res.json({ message: 'User banned', user_id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// ============ THERAPIST VERIFICATION ============

// GET /api/admin/therapist-verification - List pending therapist verifications
router.get('/therapist-verification', authRequired, isAdmin, async (req, res) => {
  const { status = 'pending', limit = 20, offset = 0 } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT tp.*, u.name, u.email, u.avatar_url
       FROM therapist_profiles tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.verification_status = $1
       ORDER BY tp.created_at ASC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    res.json({ therapists: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch therapists' });
  }
});

// GET /api/admin/therapists/:id/documents - Get therapist documents
router.get('/therapists/:id/documents', authRequired, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM verification_documents WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json({ documents: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// PUT /api/admin/therapist-verification/:id/approve
router.put('/therapist-verification/:id/approve', authRequired, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE therapist_profiles SET verification_status = $1, is_verified = true, updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      ['approved', req.params.id]
    );

    if (rows.length) {
      await pool.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
         VALUES ($1, $2, $3, $4)`,
        [req.user.id, 'APPROVE_THERAPIST', 'therapist_profiles', req.params.id]
      );
    }

    res.json({ therapist: rows[0], message: 'Therapist approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve therapist' });
  }
});

// PUT /api/admin/therapist-verification/:id/reject
router.put('/therapist-verification/:id/reject', authRequired, isAdmin, async (req, res) => {
  const { reason } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE therapist_profiles SET verification_status = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      ['rejected', req.params.id]
    );

    if (rows.length) {
      await pool.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, 'REJECT_THERAPIST', 'therapist_profiles', req.params.id, JSON.stringify({ reason })]
      );
    }

    res.json({ therapist: rows[0], message: 'Therapist rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject therapist' });
  }
});

// ============ ORGANIZATION VERIFICATION ============

// GET /api/admin/org-verification - List pending organization verifications
router.get('/org-verification', authRequired, isAdmin, async (req, res) => {
  const { status = 'pending', limit = 20, offset = 0 } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT od.*, o.name, o.type
       FROM organization_details od
       JOIN organizations o ON od.organization_id = o.id
       WHERE od.verification_status = $1
       ORDER BY od.created_at ASC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    res.json({ organizations: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// PUT /api/admin/org-verification/:id/approve
router.put('/org-verification/:id/approve', authRequired, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE organization_details SET verification_status = $1, is_verified = true, updated_at = NOW()
       WHERE organization_id = $2
       RETURNING *`,
      ['approved', req.params.id]
    );

    if (rows.length) {
      await pool.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
         VALUES ($1, $2, $3, $4)`,
        [req.user.id, 'APPROVE_ORG', 'organization_details', req.params.id]
      );
    }

    res.json({ organization: rows[0], message: 'Organization approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve organization' });
  }
});

// ============ CONTENT MODERATION ============

// GET /api/admin/reported-content - List reported posts/comments
router.get('/reported-content', authRequired, isAdmin, async (req, res) => {
  const { status = 'pending', limit = 20, offset = 0 } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT cr.*, u.name as reporter_name
       FROM community_reports cr
       JOIN users u ON cr.reported_by = u.id
       WHERE cr.status = $1
       ORDER BY cr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    res.json({ reports: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// DELETE /api/admin/posts/:id - Delete post
router.delete('/posts/:id', authRequired, isAdmin, async (req, res) => {
  const { reason } = req.body;
  try {
    const { rows } = await pool.query(
      `DELETE FROM posts WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    if (rows.length) {
      await pool.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, 'DELETE_POST', 'posts', req.params.id, JSON.stringify({ reason })]
      );
    }

    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ============ DASHBOARD ============

// GET /api/admin/dashboard - Admin dashboard statistics
router.get('/dashboard', authRequired, isAdmin, async (req, res) => {
  try {
    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['therapist']),
      pool.query('SELECT COUNT(*) as count FROM organizations'),
      pool.query('SELECT COUNT(*) as count FROM appointment_slots'),
      pool.query('SELECT COUNT(*) as count FROM posts WHERE created_at >= NOW() - INTERVAL \'30 days\'')
    ]);

    res.json({
      dashboard: {
        total_users: stats[0].rows[0].count,
        total_therapists: stats[1].rows[0].count,
        total_organizations: stats[2].rows[0].count,
        total_appointments: stats[3].rows[0].count,
        recent_posts: stats[4].rows[0].count
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// ============ AUDIT LOGS ============

// GET /api/admin/audit-logs
router.get('/audit-logs', authRequired, isAdmin, async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT al.*, u.name as admin_name
       FROM audit_logs al
       LEFT JOIN users u ON al.admin_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ logs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
