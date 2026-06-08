const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

// POST /api/appointments/request - Request appointment with therapist
router.post('/request', authRequired, async (req, res) => {
  const { therapist_id, appointment_date, start_time, end_time, notes } = req.body;

  if (!therapist_id || !appointment_date || !start_time) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO appointment_slots (therapist_id, parent_id, appointment_date, start_time, end_time, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [therapist_id, req.user.id, appointment_date, start_time, end_time || start_time, notes, 'requested']
    );
    res.status(201).json({ appointment: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to request appointment' });
  }
});

// GET /api/appointments/therapist - Get appointments for therapist
router.get('/therapist', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT aps.*, u.name as parent_name, u.email as parent_email
       FROM appointment_slots aps
       JOIN users u ON aps.parent_id = u.id
       WHERE aps.therapist_id = $1
       ORDER BY aps.appointment_date DESC, aps.start_time DESC`,
      [req.user.id]
    );
    res.json({ appointments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/appointments/parent - Get appointments for parent
router.get('/parent', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT aps.*, u.name as therapist_name, u.email as therapist_email
       FROM appointment_slots aps
       JOIN users u ON aps.therapist_id = u.id
       WHERE aps.parent_id = $1
       ORDER BY aps.appointment_date DESC, aps.start_time DESC`,
      [req.user.id]
    );
    res.json({ appointments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// PUT /api/appointments/:id/status - Update appointment status
router.put('/:id/status', authRequired, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['confirmed', 'completed', 'cancelled', 'rescheduled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE appointment_slots SET status = $1, updated_at = NOW()
       WHERE id = $2 AND (therapist_id = $3 OR parent_id = $3)
       RETURNING *`,
      [status, req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ appointment: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// PUT /api/appointments/:id/reschedule - Reschedule appointment
router.put('/:id/reschedule', authRequired, async (req, res) => {
  const { new_date, new_start_time, new_end_time } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE appointment_slots
       SET appointment_date = $1, start_time = $2, end_time = $3, status = 'rescheduled', updated_at = NOW()
       WHERE id = $4 AND (therapist_id = $5 OR parent_id = $5)
       RETURNING *`,
      [new_date, new_start_time, new_end_time, req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ appointment: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

// POST /api/appointments/:id/session-notes - Add session notes (therapist only)
router.post('/:id/session-notes', authRequired, async (req, res) => {
  const { session_notes, observations, recommendations, milestones, next_steps } = req.body;

  try {
    // Get appointment details
    const apptResult = await pool.query(
      `SELECT * FROM appointment_slots WHERE id = $1 AND therapist_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!apptResult.rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appt = apptResult.rows[0];

    // Update appointment with session notes
    await pool.query(
      `UPDATE appointment_slots SET session_notes = $1 WHERE id = $2`,
      [session_notes, req.params.id]
    );

    // Create progress note
    const { rows } = await pool.query(
      `INSERT INTO progress_notes (appointment_id, therapist_id, parent_id, session_date, observations, recommendations, milestones, next_steps)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.params.id, req.user.id, appt.parent_id, appt.appointment_date, observations, recommendations, milestones, next_steps]
    );

    res.json({ progress_note: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save session notes' });
  }
});

// GET /api/appointments/:id/progress-notes
router.get('/:id/progress-notes', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT pn.* FROM progress_notes pn
       JOIN appointment_slots aps ON pn.appointment_id = aps.id
       WHERE aps.id = $1 AND (aps.therapist_id = $2 OR aps.parent_id = $2)`,
      [req.params.id, req.user.id]
    );
    res.json({ progress_notes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch progress notes' });
  }
});

module.exports = router;
