const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

// POST /api/messages/send - Send message
router.post('/send', authRequired, async (req, res) => {
  const { receiver_id, content } = req.body;

  if (!receiver_id || !content) {
    return res.status(400).json({ error: 'Receiver and content required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content, is_read)
       VALUES ($1, $2, $3, false)
       RETURNING *`,
      [req.user.id, receiver_id, content]
    );

    res.status(201).json({ message: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/messages/inbox - Get received messages
router.get('/inbox', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.name as sender_name, u.avatar_url
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.receiver_id = $1
       ORDER BY m.created_at DESC`,
      [req.user.id]
    );

    res.json({ messages: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/messages/sent - Get sent messages
router.get('/sent', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.name as receiver_name, u.avatar_url
       FROM messages m
       JOIN users u ON m.receiver_id = u.id
       WHERE m.sender_id = $1
       ORDER BY m.created_at DESC`,
      [req.user.id]
    );

    res.json({ messages: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/messages/conversation/:user_id - Get conversation with specific user
router.get('/conversation/:user_id', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*,
              CASE WHEN m.sender_id = $1 THEN u2.name ELSE u1.name END as other_user_name,
              u1.avatar_url as sender_avatar,
              u2.avatar_url as receiver_avatar
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.receiver_id = u2.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [req.user.id, req.params.user_id]
    );

    // Mark messages as read
    await pool.query(
      `UPDATE messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2`,
      [req.user.id, req.params.user_id]
    );

    res.json({ messages: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// PUT /api/messages/:id/read - Mark message as read
router.put('/:id/read', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE messages SET is_read = true WHERE id = $1 AND receiver_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// GET /api/messages/unread-count - Get unread message count
router.get('/unread-count', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND is_read = false`,
      [req.user.id]
    );

    res.json({ unread_count: rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch count' });
  }
});

module.exports = router;
