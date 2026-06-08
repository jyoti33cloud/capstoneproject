const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

// GET /api/therapists/:id/profile
router.get('/:id/profile', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT tp.*, u.name, u.email, u.avatar_url
       FROM therapist_profiles tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.user_id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json({ profile: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/therapists/profile
router.post('/profile', authRequired, async (req, res) => {
  const { bio, years_experience, consultation_fee, languages, specializations } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO therapist_profiles (user_id, bio, years_experience, consultation_fee, languages, specializations)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
       bio = EXCLUDED.bio, years_experience = EXCLUDED.years_experience,
       consultation_fee = EXCLUDED.consultation_fee, languages = EXCLUDED.languages,
       specializations = EXCLUDED.specializations, updated_at = NOW()
       RETURNING *`,
      [req.user.id, bio, years_experience, consultation_fee, languages, specializations]
    );
    res.json({ profile: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// POST /api/therapists/qualifications
router.post('/qualifications', authRequired, async (req, res) => {
  const { qualification_type, title, issuing_organization, issue_date, expiry_date, credential_url } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO therapist_qualifications (user_id, qualification_type, title, issuing_organization, issue_date, expiry_date, credential_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, qualification_type, title, issuing_organization, issue_date, expiry_date, credential_url]
    );
    res.status(201).json({ qualification: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add qualification' });
  }
});

// GET /api/therapists/qualifications
router.get('/qualifications', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM therapist_qualifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ qualifications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch qualifications' });
  }
});

// DELETE /api/therapists/qualifications/:id
router.delete('/qualifications/:id', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM therapist_qualifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Qualification not found' });
    res.json({ message: 'Qualification deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete qualification' });
  }
});

// POST /api/therapists/availability
router.post('/availability', authRequired, async (req, res) => {
  const { day_of_week, start_time, end_time } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO therapist_availability (user_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, day_of_week) DO UPDATE SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time
       RETURNING *`,
      [req.user.id, day_of_week, start_time, end_time]
    );
    res.json({ availability: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to set availability' });
  }
});

// GET /api/therapists/availability
router.get('/availability', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM therapist_availability WHERE user_id = $1 ORDER BY day_of_week`,
      [req.user.id]
    );
    res.json({ availability: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// POST /api/therapists/block-dates
router.post('/block-dates', authRequired, async (req, res) => {
  const { block_date, reason } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO therapist_blocked_dates (user_id, block_date, reason)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, block_date, reason]
    );
    res.status(201).json({ blockedDate: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Date already blocked' });
    console.error(err);
    res.status(500).json({ error: 'Failed to block date' });
  }
});

// GET /api/therapists/dashboard
router.get('/dashboard', authRequired, async (req, res) => {
  try {
    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM appointment_slots WHERE therapist_id = $1', [req.user.id]),
      pool.query('SELECT COUNT(*) as count FROM appointment_slots WHERE therapist_id = $1 AND status = $2 AND appointment_date >= CURRENT_DATE', [req.user.id, 'confirmed']),
      pool.query('SELECT COUNT(*) as count FROM appointment_slots WHERE therapist_id = $1 AND status = $2', [req.user.id, 'requested']),
      pool.query('SELECT COUNT(DISTINCT parent_id) as count FROM appointment_slots WHERE therapist_id = $1', [req.user.id])
    ]);

    res.json({
      dashboard: {
        total_appointments: stats[0].rows[0].count,
        upcoming_appointments: stats[1].rows[0].count,
        appointment_requests: stats[2].rows[0].count,
        patient_count: stats[3].rows[0].count
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

module.exports = router;
