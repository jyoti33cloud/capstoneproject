const jwt = require('jsonwebtoken');
const pool = require('../db');

async function adminRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, name: payload.name };

    // Check if user is admin
    const { rows } = await pool.query('SELECT role FROM admin_users WHERE user_id = $1', [payload.id]);

    if (!rows.length) {
      console.warn(`Unauthorized admin access attempt by user ${payload.id}`);
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = { role: rows[0].role };
    next();
  } catch (err) {
    console.error('Admin auth error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { adminRequired };
