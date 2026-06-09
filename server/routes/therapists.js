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

  if (!day_of_week || !start_time) {
    return res.status(400).json({ error: 'Day of week and start time required' });
  }

  try {
    // First check if exists
    const exists = await pool.query(
      `SELECT id FROM therapist_availability WHERE user_id = $1 AND day_of_week = $2`,
      [req.user.id, day_of_week]
    );

    let rows;
    if (exists.rowCount > 0) {
      // Update existing
      const result = await pool.query(
        `UPDATE therapist_availability SET start_time = $1, end_time = $2, updated_at = NOW()
         WHERE user_id = $3 AND day_of_week = $4
         RETURNING *`,
        [start_time, end_time || null, req.user.id, day_of_week]
      );
      rows = result.rows;
    } else {
      // Insert new
      const result = await pool.query(
        `INSERT INTO therapist_availability (user_id, day_of_week, start_time, end_time, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [req.user.id, day_of_week, start_time, end_time || null]
      );
      rows = result.rows;
    }

    res.json({ availability: rows[0], message: exists.rowCount > 0 ? 'Availability updated' : 'Availability added' });
  } catch (err) {
    console.error('Availability error:', err);
    res.status(500).json({ error: 'Failed to set availability', details: err.message });
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

// MESSAGING FEATURES

// CREATE - Send message to parents
router.post('/messages/send', authRequired, async (req, res) => {
  const { parent_id, message_type, subject, content } = req.body;

  if (!parent_id || !message_type || !content) {
    return res.status(400).json({ error: 'Parent ID, message type, and content required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message_type, subject, content, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [req.user.id, parent_id, message_type, subject || null, content]
    );

    res.status(201).json({ message: rows[0], messageCreated: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// CREATE - Send follow-up advice
router.post('/messages/follow-up', authRequired, async (req, res) => {
  const { parent_id, advice_subject, advice_content } = req.body;

  if (!parent_id || !advice_subject || !advice_content) {
    return res.status(400).json({ error: 'Parent ID, subject, and content required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message_type, subject, content, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [req.user.id, parent_id, 'follow_up_advice', advice_subject, advice_content]
    );

    res.status(201).json({ message: rows[0], adviceSent: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send follow-up advice' });
  }
});

// READ - View conversations
router.get('/messages/conversations', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT
         u.id, u.name, u.email, u.avatar_url,
         (SELECT COUNT(*) FROM messages WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1)) as message_count,
         (SELECT created_at FROM messages WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1) ORDER BY created_at DESC LIMIT 1) as last_message_at,
         (SELECT is_read FROM messages WHERE sender_id = u.id AND receiver_id = $1 ORDER BY created_at DESC LIMIT 1) as unread
       FROM users u
       JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = $1) OR (m.sender_id = $1 AND m.receiver_id = u.id)
       WHERE u.role = 'parent'
       ORDER BY last_message_at DESC`,
      [req.user.id]
    );

    res.json({ conversations: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// READ - Read messages with specific parent
router.get('/messages/:parent_id', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*,
              u_sender.name as sender_name, u_sender.avatar_url as sender_avatar,
              u_receiver.name as receiver_name, u_receiver.avatar_url as receiver_avatar
       FROM messages m
       JOIN users u_sender ON m.sender_id = u_sender.id
       JOIN users u_receiver ON m.receiver_id = u_receiver.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [req.user.id, req.params.parent_id]
    );

    // Mark as read
    await pool.query(
      `UPDATE messages SET is_read = true, read_at = NOW()
       WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false`,
      [req.user.id, req.params.parent_id]
    );

    res.json({ messages: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// UPDATE - Edit draft messages
router.put('/messages/:id/edit', authRequired, async (req, res) => {
  const { subject, content } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE messages SET subject = $1, content = $2, updated_at = NOW()
       WHERE id = $3 AND sender_id = $4
       RETURNING *`,
      [subject, content, req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }

    res.json({ message: rows[0], updated: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// DELETE - Delete conversation
router.delete('/messages/conversation/:parent_id', authRequired, async (req, res) => {
  if (!window?.confirm('Are you sure you want to delete this entire conversation?')) {
    return res.status(400).json({ error: 'Operation cancelled' });
  }

  try {
    await pool.query(
      `DELETE FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
      [req.user.id, req.params.parent_id]
    );

    res.json({ message: 'Conversation deleted', deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// DELETE - Delete specific message
router.delete('/messages/:id', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM messages WHERE id = $1 AND sender_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }

    res.json({ message: 'Message deleted', deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
