const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

// POST /api/organizations/create
// Create a new organization (therapy center, etc.)
router.post('/create', authRequired, async (req, res) => {
  const { name, type, location, phone, email, description } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  const validTypes = ['therapy_center', 'child_dev_center', 'special_ed_center', 'rehab_center'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid organization type' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO organizations (name, type, location, phone, email, description, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, type, location, phone, email, description, avatar_url, created_at`,
      [
        name,
        type,
        location || null,
        phone || null,
        email || null,
        description || null,
        `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`
      ]
    );

    const organization = rows[0];

    // Set the creator as organization_admin
    await pool.query(
      `UPDATE users SET role = $1, organization_id = $2 WHERE id = $3`,
      ['organization_admin', organization.id, req.user.id]
    );

    res.status(201).json({
      organization,
      message: 'Organization created successfully'
    });
  } catch (err) {
    console.error('Organization creation error:', err);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// GET /api/organizations/:id
// Get organization details
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, type, location, phone, email, description, avatar_url, created_at FROM organizations WHERE id = $1',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ organization: rows[0] });
  } catch (err) {
    console.error('Get organization error:', err);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

// GET /api/organizations/:id/members
// Get organization members (therapists)
router.get('/:id/members', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_url, om.position, om.joined_at
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.organization_id = $1
       ORDER BY om.joined_at DESC`,
      [req.params.id]
    );

    res.json({ members: rows });
  } catch (err) {
    console.error('Get members error:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// POST /api/organizations/:id/invite-therapist
// Invite a therapist to join organization
router.post('/:id/invite-therapist', authRequired, async (req, res) => {
  const { therapistId, position } = req.body;

  if (!therapistId) {
    return res.status(400).json({ error: 'Therapist ID is required' });
  }

  try {
    // Verify the requester is organization admin
    const { rows: admin } = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2 AND organization_id = $3',
      [req.user.id, 'organization_admin', req.params.id]
    );

    if (!admin.length) {
      return res.status(403).json({ error: 'Only organization admins can invite therapists' });
    }

    // Add therapist to organization
    const { rows } = await pool.query(
      `INSERT INTO organization_members (organization_id, user_id, position)
       VALUES ($1, $2, $3)
       RETURNING id, organization_id, user_id, position, joined_at`,
      [req.params.id, therapistId, position || 'Therapist']
    );

    // Update user role if not already therapist/organization_admin
    await pool.query(
      `UPDATE users SET role = $1, organization_id = $2 WHERE id = $3 AND role = $4`,
      ['therapist', req.params.id, therapistId, 'parent']
    );

    res.status(201).json({
      member: rows[0],
      message: 'Therapist added to organization'
    });
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Therapist already in this organization' });
    }
    console.error('Invite therapist error:', err);
    res.status(500).json({ error: 'Failed to invite therapist' });
  }
});

// PUT /api/organizations/:id
// Update organization (admin only)
router.put('/:id', authRequired, async (req, res) => {
  const { name, location, phone, email, description } = req.body;

  try {
    // Verify the requester is organization admin
    const { rows: admin } = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2 AND organization_id = $3',
      [req.user.id, 'organization_admin', req.params.id]
    );

    if (!admin.length) {
      return res.status(403).json({ error: 'Only organization admins can update organization' });
    }

    const { rows } = await pool.query(
      `UPDATE organizations SET name = COALESCE($1, name), location = COALESCE($2, location),
       phone = COALESCE($3, phone), email = COALESCE($4, email), description = COALESCE($5, description)
       WHERE id = $6
       RETURNING id, name, type, location, phone, email, description, avatar_url, created_at`,
      [name, location, phone, email, description, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ organization: rows[0] });
  } catch (err) {
    console.error('Update organization error:', err);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// POST /api/organizations/:id/services
router.post('/:id/services', authRequired, async (req, res) => {
  const { service_name, description, price_range } = req.body;

  if (!service_name) {
    return res.status(400).json({ error: 'Service name is required' });
  }

  try {
    // Verify org admin
    const admin = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2 AND organization_id = $3',
      [req.user.id, 'organization_admin', req.params.id]
    );

    if (!admin.rowCount) {
      return res.status(403).json({ error: 'Only organization admins can add services' });
    }

    const { rows } = await pool.query(
      `INSERT INTO organization_services (organization_id, service_name, description, price_range)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.id, service_name, description, price_range]
    );

    res.status(201).json({ service: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

// GET /api/organizations/:id/services
router.get('/:id/services', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM organization_services WHERE organization_id = $1 AND is_active = true',
      [req.params.id]
    );
    res.json({ services: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST /api/organizations/:id/details
router.post('/:id/details', authRequired, async (req, res) => {
  const { address_line_1, city, state, postal_code, phone_1, phone_2, registration_number, about_us } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO organization_details (organization_id, address_line_1, city, state, postal_code, phone_1, phone_2, registration_number, about_us)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (organization_id) DO UPDATE SET
       address_line_1 = EXCLUDED.address_line_1, city = EXCLUDED.city, state = EXCLUDED.state,
       postal_code = EXCLUDED.postal_code, phone_1 = EXCLUDED.phone_1, phone_2 = EXCLUDED.phone_2,
       registration_number = EXCLUDED.registration_number, about_us = EXCLUDED.about_us, updated_at = NOW()
       RETURNING *`,
      [req.params.id, address_line_1, city, state, postal_code, phone_1, phone_2, registration_number, about_us]
    );

    res.json({ details: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save organization details' });
  }
});

// GET /api/organizations/:id/details
router.get('/:id/details', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM organization_details WHERE organization_id = $1',
      [req.params.id]
    );
    res.json({ details: rows[0] || {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch details' });
  }
});

// GET /api/organizations/:id/appointments - View all appointments in organization
router.get('/:id/appointments', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT aps.*, u_therapist.name as therapist_name, u_parent.name as parent_name
       FROM appointment_slots aps
       JOIN users u_therapist ON aps.therapist_id = u_therapist.id
       JOIN users u_parent ON aps.parent_id = u_parent.id
       WHERE u_therapist.organization_id = $1
       ORDER BY aps.appointment_date DESC`,
      [req.params.id]
    );
    res.json({ appointments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// POST /api/organizations/:id/events
router.post('/:id/events', authRequired, async (req, res) => {
  const { title, description, event_date, start_time, end_time, location, event_type, capacity } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO events (organization_id, title, description, event_date, start_time, end_time, location, event_type, capacity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.params.id, title, description, event_date, start_time, end_time, location, event_type, capacity]
    );

    res.status(201).json({ event: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// GET /api/organizations/:id/events
router.get('/:id/events', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM events WHERE organization_id = $1 AND is_published = true ORDER BY event_date DESC',
      [req.params.id]
    );
    res.json({ events: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

module.exports = router;
