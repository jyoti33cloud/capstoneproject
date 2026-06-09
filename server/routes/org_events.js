const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

// Middleware: Check organization admin
async function isOrgAdmin(req, res, next) {
  if (req.user.role !== 'organization_admin') {
    return res.status(403).json({ error: 'Organization admin access required' });
  }
  next();
}

// ===== CREATE ENDPOINTS =====

// POST /api/org-events/create - Create event
router.post('/create', authRequired, isOrgAdmin, async (req, res) => {
  const { title, description, event_date, start_time, location, event_type, capacity, is_paid, amount } = req.body;
  const orgId = req.user.organization_id;

  if (!title || !event_date || !event_type) {
    return res.status(400).json({ error: 'Title, date, and type required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO events (organization_id, title, description, event_date, start_time, location, event_type, capacity, is_paid, amount, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`,
      [orgId, title, description || null, event_date, start_time || null, location || null, event_type, capacity || 50, is_paid || false, amount || 0]
    );

    res.status(201).json({ event: rows[0], message: 'Event created successfully' });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// POST /api/org-events/create-workshop - Create workshop
router.post('/create-workshop', authRequired, isOrgAdmin, async (req, res) => {
  const { title, description, event_date, start_time, end_time, location, trainer, capacity, is_paid, amount } = req.body;
  const orgId = req.user.organization_id;

  if (!title || !event_date || !trainer) {
    return res.status(400).json({ error: 'Title, date, and trainer required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO events (organization_id, title, description, event_date, start_time, end_time, location, event_type, trainer, capacity, is_paid, amount, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING *`,
      [orgId, title, description || null, event_date, start_time || null, end_time || null, location || null, 'workshop', trainer, capacity || 30, is_paid || false, amount || 0]
    );

    res.status(201).json({ event: rows[0], message: 'Workshop created successfully' });
  } catch (err) {
    console.error('Create workshop error:', err);
    res.status(500).json({ error: 'Failed to create workshop' });
  }
});

// POST /api/org-events/create-campaign - Create awareness campaign
router.post('/create-campaign', authRequired, isOrgAdmin, async (req, res) => {
  const { title, description, event_date, campaign_type, objectives, target_audience } = req.body;
  const orgId = req.user.organization_id;

  if (!title || !event_date) {
    return res.status(400).json({ error: 'Title and date required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO events (organization_id, title, description, event_date, event_type, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [orgId, title, description || null, event_date, 'awareness_campaign']
    );

    res.status(201).json({ event: rows[0], message: 'Campaign created successfully' });
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// POST /api/org-events/create-training - Create parent training session
router.post('/create-training', authRequired, isOrgAdmin, async (req, res) => {
  const { title, description, event_date, start_time, end_time, location, trainer, topic, capacity, is_paid, amount } = req.body;
  const orgId = req.user.organization_id;

  if (!title || !event_date || !topic) {
    return res.status(400).json({ error: 'Title, date, and topic required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO events (organization_id, title, description, event_date, start_time, end_time, location, event_type, trainer, capacity, is_paid, amount, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING *`,
      [orgId, title, description || null, event_date, start_time || null, end_time || null, location || null, 'parent_training', trainer || null, capacity || 25, is_paid || false, amount || 0]
    );

    res.status(201).json({ event: rows[0], message: 'Parent training session created successfully' });
  } catch (err) {
    console.error('Create training error:', err);
    res.status(500).json({ error: 'Failed to create training' });
  }
});

// ===== READ ENDPOINTS =====

// GET /api/org-events/all - View events
router.get('/all', authRequired, isOrgAdmin, async (req, res) => {
  const { limit = 20, offset = 0, event_type, status } = req.query;
  const orgId = req.user.organization_id;

  try {
    let query = `
      SELECT e.id, e.title, e.description, e.event_date, e.start_time, e.location, e.event_type, e.capacity, e.is_paid, e.amount,
             (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registration_count,
             CASE
               WHEN e.event_date < CURRENT_DATE THEN 'completed'
               WHEN e.event_date = CURRENT_DATE THEN 'today'
               ELSE 'upcoming'
             END as status
      FROM events e
      WHERE e.organization_id = $1
    `;
    const params = [orgId];

    if (event_type) {
      query += ` AND e.event_type = $${params.length + 1}`;
      params.push(event_type);
    }

    if (status === 'upcoming') {
      query += ` AND e.event_date >= CURRENT_DATE`;
    } else if (status === 'completed') {
      query += ` AND e.event_date < CURRENT_DATE`;
    }

    query += ` ORDER BY e.event_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    res.json({ events: rows, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/org-events/:id/registrations - View registrations
router.get('/:id/registrations', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  try {
    // Verify event belongs to organization
    const eventCheck = await pool.query(
      'SELECT id FROM events WHERE id = $1 AND organization_id = $2',
      [req.params.id, orgId]
    );

    if (!eventCheck.rowCount) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get registrations
    const { rows } = await pool.query(
      `SELECT er.id, er.registration_date, er.status,
              u.name, u.email, u.phone, u.avatar_url
       FROM event_registrations er
       JOIN users u ON er.user_id = u.id
       WHERE er.event_id = $1
       ORDER BY er.registration_date DESC`,
      [req.params.id]
    );

    res.json({ registrations: rows, total: rows.length });
  } catch (err) {
    console.error('Get registrations error:', err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// ===== UPDATE ENDPOINTS =====

// PUT /api/org-events/:id/edit - Edit event details
router.put('/:id/edit', authRequired, isOrgAdmin, async (req, res) => {
  const { title, description, location, capacity, is_paid, amount } = req.body;
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `UPDATE events SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       location = COALESCE($3, location),
       capacity = COALESCE($4, capacity),
       is_paid = COALESCE($5, is_paid),
       amount = COALESCE($6, amount),
       updated_at = NOW()
       WHERE id = $7 AND organization_id = $8
       RETURNING *`,
      [title || null, description || null, location || null, capacity || null, is_paid || null, amount || null, req.params.id, orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event: rows[0], message: 'Event updated successfully' });
  } catch (err) {
    console.error('Edit event error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// PUT /api/org-events/:id/reschedule - Change schedule
router.put('/:id/reschedule', authRequired, isOrgAdmin, async (req, res) => {
  const { event_date, start_time, end_time } = req.body;
  const orgId = req.user.organization_id;

  if (!event_date) {
    return res.status(400).json({ error: 'Event date required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE events SET event_date = $1, start_time = $2, end_time = $3, updated_at = NOW()
       WHERE id = $4 AND organization_id = $5
       RETURNING *`,
      [event_date, start_time || null, end_time || null, req.params.id, orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event: rows[0], message: 'Event schedule updated' });
  } catch (err) {
    console.error('Reschedule error:', err);
    res.status(500).json({ error: 'Failed to reschedule event' });
  }
});

// ===== DELETE ENDPOINTS =====

// DELETE /api/org-events/:id - Cancel event
router.delete('/:id', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  try {
    // Delete registrations first
    await pool.query('DELETE FROM event_registrations WHERE event_id = $1', [req.params.id]);

    // Delete event
    const { rows } = await pool.query(
      `DELETE FROM events WHERE id = $1 AND organization_id = $2 RETURNING id`,
      [req.params.id, orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event cancelled and deleted successfully' });
  } catch (err) {
    console.error('Cancel event error:', err);
    res.status(500).json({ error: 'Failed to cancel event' });
  }
});

module.exports = router;
