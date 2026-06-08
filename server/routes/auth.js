const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authRequired } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/emailService');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, city } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rowCount) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, avatar_url, role)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, email, avatar_url, role`,
      [name, email, hash, `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`, 'parent']
    );
    const user = rows[0];
    sendWelcomeEmail(email, name);
    return res.json({ user, token: signToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Please use Google Sign-In' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      role: user.role
    };
    res.json({ user: safeUser, token: signToken(safeUser) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { googleToken, profile } = req.body || {};

  if (!googleToken || !profile) {
    console.error('Missing googleToken or profile');
    return res.status(400).json({ error: 'Google token and profile required' });
  }

  try {
    const { id, email, name, picture } = profile;

    if (!email) {
      console.error('Missing email in profile');
      return res.status(400).json({ error: 'Email required from Google profile' });
    }

    let { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [id]);
    let user = rows[0];

    if (!user) {
      const existingEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existingEmail.rowCount) {
        console.warn(`Email ${email} already registered with password`);
        return res.status(409).json({ error: 'Email already in use. Please login with password instead.' });
      }

      console.log(`Creating new user: ${email}`);
      try {
        const { rows: newUser } = await pool.query(
          `INSERT INTO users (name, email, google_id, avatar_url, role)
           VALUES ($1,$2,$3,$4,$5)
           RETURNING id, name, email, avatar_url, role`,
          [
            name || email.split('@')[0],
            email,
            id,
            picture || `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
            'parent'
          ]
        );

        if (!newUser.length) {
          console.error('Failed to create user - no rows returned');
          return res.status(500).json({ error: 'Failed to create user account' });
        }

        user = newUser[0];
        sendWelcomeEmail(email, name || email);
      } catch (insertErr) {
        console.error('User creation error:', insertErr.message);
        return res.status(500).json({ error: 'Failed to create user: ' + insertErr.message });
      }
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      role: user.role
    };

    console.log(`User authenticated via Google: ${email}`);
    res.json({ user: safeUser, token: signToken(safeUser), needsRoleSelection: !user.role || user.role === 'parent' });
  } catch (err) {
    console.error('Google auth error:', err.message, err.stack);
    res.status(500).json({ error: 'Google authentication failed: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, avatar_url, role FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/auth/select-role
router.post('/select-role', authRequired, async (req, res) => {
  const { role, organizationId } = req.body;

  // Validate role
  const validRoles = ['parent', 'therapist', 'admin', 'organization_admin'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role selected' });
  }

  try {
    const uid = req.user.id;

    const updateQuery = role === 'therapist' && organizationId
      ? `UPDATE users SET role = $1, organization_id = $2 WHERE id = $3 RETURNING id, name, email, avatar_url, role`
      : `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, avatar_url, role`;

    const params = role === 'therapist' && organizationId
      ? [role, organizationId, uid]
      : [role, uid];

    const { rows } = await pool.query(updateQuery, params);

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    const token = signToken(user);

    res.json({
      user,
      token,
      message: `Role set to ${role}`
    });
  } catch (err) {
    console.error('Role selection error:', err);
    res.status(500).json({ error: 'Failed to set role: ' + err.message });
  }
});

module.exports = router;
