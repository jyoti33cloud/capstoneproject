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

// CREATE - Add therapist manually
router.post('/add-manually', authRequired, isAdmin, async (req, res) => {
  const { name, email, phone, specializations, years_experience, consultation_fee, bio, city } = req.body;

  if (!name || !email || !specializations) {
    return res.status(400).json({ error: 'Name, email, and specializations required' });
  }

  try {
    // Check if therapist already exists
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rowCount) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user account
    const userRes = await pool.query(
      `INSERT INTO users (name, email, role, city, avatar_url, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [name, email, 'therapist', city || null, `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`]
    );

    const userId = userRes.rows[0].id;

    // Create therapist profile
    await pool.query(
      `INSERT INTO therapist_profiles (user_id, bio, years_experience, consultation_fee, verification_status, specializations, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [userId, bio || null, years_experience || 0, consultation_fee || 0, 'pending', specializations]
    );

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'ADD_THERAPIST_MANUALLY', 'therapists', userId]
    );

    res.status(201).json({
      therapist: { id: userId, name, email, specializations },
      message: 'Therapist added manually and marked as pending'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add therapist' });
  }
});

// READ - Get all therapist applications with filters
router.get('/applications', authRequired, isAdmin, async (req, res) => {
  const { limit = 20, offset = 0, status = 'pending', search } = req.query;

  try {
    let query = `
      SELECT u.id, u.name, u.email, u.city, tp.years_experience, tp.consultation_fee,
             tp.verification_status, tp.bio, tp.specializations, tp.created_at,
             (SELECT COUNT(*) FROM verification_documents WHERE user_id = u.id) as document_count
      FROM users u
      LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
      WHERE u.role = $1
    `;
    const params = ['therapist'];

    if (status !== 'all') {
      query += ` AND tp.verification_status = $${params.length + 1}`;
      params.push(status);
    }

    if (search) {
      query += ` AND (u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY tp.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as count FROM users u
      LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
      WHERE u.role = $1
    `;
    const countParams = ['therapist'];

    if (status !== 'all') {
      countQuery += ` AND tp.verification_status = $${countParams.length + 1}`;
      countParams.push(status);
    }

    if (search) {
      countQuery += ` AND (u.name ILIKE $${countParams.length + 1} OR u.email ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      applications: rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// READ - Get uploaded certificates/documents for a therapist
router.get('/:id/documents', authRequired, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, document_type, document_url, status, admin_notes, created_at
       FROM verification_documents
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({ documents: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// READ - Get therapist qualifications
router.get('/:id/qualifications', authRequired, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, qualification_title, institution, completion_date, certificate_url
       FROM therapist_qualifications
       WHERE user_id = $1
       ORDER BY completion_date DESC`,
      [req.params.id]
    );

    res.json({ qualifications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch qualifications' });
  }
});

// READ - Get full therapist profile
router.get('/:id/profile', authRequired, isAdmin, async (req, res) => {
  try {
    const [userRes, profileRes, docsRes, qualsRes] = await Promise.all([
      pool.query('SELECT id, name, email, city, created_at FROM users WHERE id = $1', [req.params.id]),
      pool.query('SELECT * FROM therapist_profiles WHERE user_id = $1', [req.params.id]),
      pool.query('SELECT * FROM verification_documents WHERE user_id = $1 ORDER BY created_at DESC', [req.params.id]),
      pool.query('SELECT * FROM therapist_qualifications WHERE user_id = $1 ORDER BY completion_date DESC', [req.params.id])
    ]);

    if (!userRes.rowCount) {
      return res.status(404).json({ error: 'Therapist not found' });
    }

    res.json({
      user: userRes.rows[0],
      profile: profileRes.rows[0] || null,
      documents: docsRes.rows,
      qualifications: qualsRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// UPDATE - Approve therapist
router.put('/:id/approve', authRequired, isAdmin, async (req, res) => {
  const { approval_notes } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE therapist_profiles
       SET verification_status = $1, approval_notes = $2, verified_at = NOW()
       WHERE user_id = $3
       RETURNING *`,
      ['approved', approval_notes || null, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'APPROVE_THERAPIST', 'therapists', req.params.id, JSON.stringify({ status: 'approved' })]
    );

    res.json({ therapist: rows[0], message: 'Therapist approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve therapist' });
  }
});

// UPDATE - Reject therapist
router.put('/:id/reject', authRequired, isAdmin, async (req, res) => {
  const { rejection_reason } = req.body;

  if (!rejection_reason) {
    return res.status(400).json({ error: 'Rejection reason required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE therapist_profiles
       SET verification_status = $1, rejection_reason = $2, rejected_at = NOW()
       WHERE user_id = $3
       RETURNING *`,
      ['rejected', rejection_reason, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'REJECT_THERAPIST', 'therapists', req.params.id, JSON.stringify({ reason: rejection_reason })]
    );

    res.json({ therapist: rows[0], message: 'Therapist rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject therapist' });
  }
});

// UPDATE - Request additional documents
router.put('/:id/request-documents', authRequired, isAdmin, async (req, res) => {
  const { document_types, message } = req.body;

  if (!document_types || !Array.isArray(document_types)) {
    return res.status(400).json({ error: 'Document types array required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE therapist_profiles
       SET verification_status = $1, admin_notes = $2
       WHERE user_id = $3
       RETURNING *`,
      ['pending_documents', message || `Requesting: ${document_types.join(', ')}`, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'REQUEST_DOCUMENTS', 'therapists', req.params.id, JSON.stringify({ documents: document_types })]
    );

    res.json({ therapist: rows[0], message: 'Document request sent to therapist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to request documents' });
  }
});

// UPDATE - Update verification status
router.put('/:id/status', authRequired, isAdmin, async (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['pending', 'pending_documents', 'approved', 'rejected'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE therapist_profiles
       SET verification_status = $1, admin_notes = $2
       WHERE user_id = $3
       RETURNING *`,
      [status, notes || null, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'UPDATE_VERIFICATION_STATUS', 'therapists', req.params.id, JSON.stringify({ status })]
    );

    res.json({ therapist: rows[0], message: `Status updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// DELETE - Remove therapist listing
router.delete('/:id/remove-listing', authRequired, isAdmin, async (req, res) => {
  try {
    // Delete therapist profile
    await pool.query('DELETE FROM therapist_profiles WHERE user_id = $1', [req.params.id]);

    // Delete related documents
    await pool.query('DELETE FROM verification_documents WHERE user_id = $1', [req.params.id]);

    // Delete qualifications
    await pool.query('DELETE FROM therapist_qualifications WHERE user_id = $1', [req.params.id]);

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'REMOVE_THERAPIST_LISTING', 'therapists', req.params.id]
    );

    res.json({ message: 'Therapist listing removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove listing' });
  }
});

// DELETE - Revoke verification
router.put('/:id/revoke-verification', authRequired, isAdmin, async (req, res) => {
  const { revocation_reason } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE therapist_profiles
       SET verification_status = $1, revocation_reason = $2, revoked_at = NOW()
       WHERE user_id = $3
       RETURNING *`,
      ['revoked', revocation_reason || null, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Therapist profile not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'REVOKE_VERIFICATION', 'therapists', req.params.id, JSON.stringify({ reason: revocation_reason })]
    );

    res.json({ therapist: rows[0], message: 'Verification revoked' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to revoke verification' });
  }
});

module.exports = router;
