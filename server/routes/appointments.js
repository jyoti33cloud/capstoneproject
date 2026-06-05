const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');
const { sendAppointmentReminder } = require('../services/emailService');

// POST /api/appointments
router.post('/', authRequired, async (req, res) => {
  const { specialist_id, appointment_date, appointment_time } = req.body || {};
  if (!specialist_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'specialist_id, appointment_date and appointment_time are required' });
  }
  try {
    const userResult = await pool.query('SELECT email, name FROM users WHERE id = $1', [req.user.id]);
    const specialist = await pool.query('SELECT name FROM specialists WHERE id = $1', [specialist_id]);

    if (!userResult.rowCount || !specialist.rowCount) {
      return res.status(404).json({ error: 'User or specialist not found' });
    }

    const { rows } = await pool.query(
      `INSERT INTO appointments (user_id, specialist_id, appointment_date, appointment_time)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [req.user.id, specialist_id, appointment_date, appointment_time]
    );

    const user = userResult.rows[0];
    const spec = specialist.rows[0];

    sendAppointmentReminder(user.email, user.name, spec.name, appointment_date, appointment_time);

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// GET /api/appointments  (current user)
router.get('/', authRequired, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.*, s.name AS specialist_name, s.specialty, s.location, s.image_url
     FROM appointments a
     JOIN specialists s ON s.id = a.specialist_id
     WHERE a.user_id = $1
     ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// DELETE /api/appointments/:id
router.delete('/:id', authRequired, async (req, res) => {
  await pool.query(
    'DELETE FROM appointments WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
});

module.exports = router;
