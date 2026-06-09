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

// ===== READ ENDPOINTS =====

// GET /api/org-appointments/all - View all appointments
router.get('/all', authRequired, isOrgAdmin, async (req, res) => {
  const { limit = 20, offset = 0, status, therapist_id, date_from, date_to } = req.query;
  const orgId = req.user.organization_id;

  try {
    let query = `
      SELECT aps.id, aps.appointment_date, aps.start_time, aps.end_time, aps.status, aps.notes,
             tp.name as therapist_name, tp.id as therapist_id,
             pp.name as parent_name, pp.id as parent_id,
             pp.email as parent_email
      FROM appointment_slots aps
      JOIN users tp ON aps.therapist_id = tp.id
      JOIN users pp ON aps.parent_id = pp.id
      WHERE tp.organization_id = $1
    `;
    const params = [orgId];

    if (status) {
      query += ` AND aps.status = $${params.length + 1}`;
      params.push(status);
    }

    if (therapist_id) {
      query += ` AND aps.therapist_id = $${params.length + 1}`;
      params.push(therapist_id);
    }

    if (date_from) {
      query += ` AND aps.appointment_date >= $${params.length + 1}`;
      params.push(date_from);
    }

    if (date_to) {
      query += ` AND aps.appointment_date <= $${params.length + 1}`;
      params.push(date_to);
    }

    query += ` ORDER BY aps.appointment_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    res.json({ appointments: rows, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    console.error('Get appointments error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/org-appointments/therapist-schedules - View therapist schedules
router.get('/therapist-schedules', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name,
              (SELECT COUNT(*) FROM appointment_slots WHERE therapist_id = u.id AND status = 'confirmed' AND appointment_date >= CURRENT_DATE) as upcoming_count,
              (SELECT COUNT(*) FROM appointment_slots WHERE therapist_id = u.id AND status = 'completed') as completed_count,
              (SELECT appointment_date FROM appointment_slots WHERE therapist_id = u.id ORDER BY appointment_date ASC LIMIT 1) as next_appointment
       FROM users u
       WHERE u.organization_id = $1 AND u.role = 'therapist'
       ORDER BY u.name`,
      [orgId]
    );

    res.json({ therapists: rows });
  } catch (err) {
    console.error('Get therapist schedules error:', err);
    res.status(500).json({ error: 'Failed to fetch therapist schedules' });
  }
});

// GET /api/org-appointments/history - View appointment history
router.get('/history', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `SELECT aps.id, aps.appointment_date, aps.start_time, aps.status,
              tp.name as therapist_name, pp.name as parent_name,
              pn.observations as session_notes, pn.created_at as notes_date
       FROM appointment_slots aps
       JOIN users tp ON aps.therapist_id = tp.id
       JOIN users pp ON aps.parent_id = pp.id
       LEFT JOIN progress_notes pn ON aps.id = pn.appointment_id
       WHERE tp.organization_id = $1 AND aps.status = 'completed'
       ORDER BY aps.appointment_date DESC
       LIMIT 100`,
      [orgId]
    );

    res.json({ history: rows });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: 'Failed to fetch appointment history' });
  }
});

// ===== UPDATE ENDPOINTS =====

// PUT /api/org-appointments/:id/assign-therapist - Assign therapist
router.put('/:id/assign-therapist', authRequired, isOrgAdmin, async (req, res) => {
  const { therapist_id } = req.body;
  const orgId = req.user.organization_id;

  if (!therapist_id) {
    return res.status(400).json({ error: 'Therapist ID required' });
  }

  try {
    // Verify therapist belongs to organization
    const therapistCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND organization_id = $2 AND role = 'therapist'`,
      [therapist_id, orgId]
    );

    if (!therapistCheck.rowCount) {
      return res.status(404).json({ error: 'Therapist not found in this organization' });
    }

    // Update appointment
    const { rows } = await pool.query(
      `UPDATE appointment_slots SET therapist_id = $1, updated_at = NOW()
       WHERE id = $2 AND therapist_id IN (SELECT id FROM users WHERE organization_id = $3)
       RETURNING *`,
      [therapist_id, req.params.id, orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ appointment: rows[0], message: 'Therapist assigned successfully' });
  } catch (err) {
    console.error('Assign therapist error:', err);
    res.status(500).json({ error: 'Failed to assign therapist' });
  }
});

// PUT /api/org-appointments/:id/reschedule - Reschedule appointment
router.put('/:id/reschedule', authRequired, isOrgAdmin, async (req, res) => {
  const { appointment_date, start_time, end_time } = req.body;
  const orgId = req.user.organization_id;

  if (!appointment_date || !start_time) {
    return res.status(400).json({ error: 'Date and start time required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE appointment_slots SET appointment_date = $1, start_time = $2, end_time = $3, updated_at = NOW()
       WHERE id = $4 AND therapist_id IN (SELECT id FROM users WHERE organization_id = $5)
       RETURNING *`,
      [appointment_date, start_time, end_time || null, req.params.id, orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ appointment: rows[0], message: 'Appointment rescheduled successfully' });
  } catch (err) {
    console.error('Reschedule error:', err);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

// PUT /api/org-appointments/:id/mark-completed - Mark completed
router.put('/:id/mark-completed', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `UPDATE appointment_slots SET status = 'completed', updated_at = NOW()
       WHERE id = $1 AND therapist_id IN (SELECT id FROM users WHERE organization_id = $2)
       RETURNING *`,
      [req.params.id, orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ appointment: rows[0], message: 'Appointment marked completed' });
  } catch (err) {
    console.error('Mark completed error:', err);
    res.status(500).json({ error: 'Failed to mark appointment completed' });
  }
});

// PUT /api/org-appointments/:id/cancel - Cancel appointment
router.put('/:id/cancel', authRequired, isOrgAdmin, async (req, res) => {
  const { reason } = req.body;
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `UPDATE appointment_slots SET status = 'cancelled', notes = $1, updated_at = NOW()
       WHERE id = $2 AND therapist_id IN (SELECT id FROM users WHERE organization_id = $3)
       RETURNING *`,
      [reason || 'Cancelled by admin', req.params.id, orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ appointment: rows[0], message: 'Appointment cancelled' });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// ===== DELETE ENDPOINTS =====

// DELETE /api/org-appointments/:id - Remove appointment
router.delete('/:id', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `DELETE FROM appointment_slots
       WHERE id = $1 AND therapist_id IN (SELECT id FROM users WHERE organization_id = $2)
       RETURNING id`,
      [req.params.id, orgId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment removed successfully' });
  } catch (err) {
    console.error('Delete appointment error:', err);
    res.status(500).json({ error: 'Failed to remove appointment' });
  }
});

module.exports = router;
