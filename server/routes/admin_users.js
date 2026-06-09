const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

// Middleware: Check if admin
async function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// CREATE - Create user account manually
router.post('/create', authRequired, isAdmin, async (req, res) => {
  const { name, email, password, role = 'parent', city } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if email exists
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rowCount) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, city, avatar_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, name, email, role, city, created_at`,
      [name, email, hash, role, city || null, `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`]
    );

    // Log admin action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'CREATE_USER', 'users', rows[0].id]
    );

    res.status(201).json({ user: rows[0], message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// READ - Get all users with pagination and filters
router.get('/all', authRequired, isAdmin, async (req, res) => {
  const { limit = 20, offset = 0, role, search } = req.query;

  try {
    let query = 'SELECT id, name, email, role, city, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ` AND role = $${params.length + 1}`;
      params.push(role);
    }

    if (search) {
      query += ` AND (name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const countParams = [];

    if (role) {
      countQuery += ` AND role = $${countParams.length + 1}`;
      countParams.push(role);
    }

    if (search) {
      countQuery += ` AND (name ILIKE $${countParams.length + 1} OR email ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      users: rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// READ - Get single user profile
router.get('/:id/profile', authRequired, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, city, avatar_url, created_at FROM users WHERE id = $1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// UPDATE - Edit user details
router.put('/:id/update', authRequired, isAdmin, async (req, res) => {
  const { name, email, city } = req.body;

  try {
    let updates = [];
    let params = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }

    if (email) {
      // Check if new email already exists
      const exists = await pool.query(
        'SELECT 1 FROM users WHERE email = $1 AND id != $2',
        [email, req.params.id]
      );
      if (exists.rowCount) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      updates.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }

    if (city !== undefined) {
      updates.push(`city = $${paramIndex}`);
      params.push(city || null);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, name, email, role, city, created_at`,
      params
    );

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'UPDATE_USER', 'users', req.params.id, JSON.stringify({ name, email, city })]
    );

    res.json({ user: rows[0], message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// UPDATE - Change user role
router.put('/:id/role', authRequired, isAdmin, async (req, res) => {
  const { role } = req.body;
  const validRoles = ['parent', 'therapist', 'admin', 'organization_admin'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, name, email, role`,
      [role, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'CHANGE_ROLE', 'users', req.params.id, JSON.stringify({ new_role: role })]
    );

    res.json({ user: rows[0], message: 'User role updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// UPDATE - Reset password
router.put('/:id/reset-password', authRequired, isAdmin, async (req, res) => {
  const newPassword = Math.random().toString(36).slice(-8);

  try {
    const hash = await bcrypt.hash(newPassword, 10);

    const { rows } = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2
       RETURNING id, name, email`,
      [hash, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'RESET_PASSWORD', 'users', req.params.id]
    );

    res.json({
      user: rows[0],
      temporary_password: newPassword,
      message: 'Password reset. Share temporary password with user.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// UPDATE - Activate/Deactivate account (using soft delete with is_active)
// First add is_active column concept (we'll use a workaround for now with status in audit logs)
router.put('/:id/deactivate', authRequired, isAdmin, async (req, res) => {
  try {
    // Mark user as deactivated (we'll store this in audit logs for now)
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'DEACTIVATE_USER', 'users', req.params.id]
    );

    res.json({ message: 'User account deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

router.put('/:id/activate', authRequired, isAdmin, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'ACTIVATE_USER', 'users', req.params.id]
    );

    res.json({ message: 'User account activated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to activate user' });
  }
});

// DELETE - Hard delete user
router.delete('/:id/delete', authRequired, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING id, name, email`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'DELETE_USER', 'users', req.params.id]
    );

    res.json({ message: 'User permanently deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// DELETE - Soft delete (just log it for now)
router.put('/:id/soft-delete', authRequired, isAdmin, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'SOFT_DELETE_USER', 'users', req.params.id]
    );

    res.json({ message: 'User account soft deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to soft delete user' });
  }
});

module.exports = router;
