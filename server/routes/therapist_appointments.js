const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

// Middleware: Check if therapist
async function isTherapist(req, res, next) {
  if (req.user.role !== 'therapist') {
    return res.status(403).json({ error: 'Therapist access required' });
  }
  next();
}

// READ - Get therapist dashboard overview
router.get('/overview', authRequired, isTherapist, async (req, res) => {
  try {
    const therapistId = req.user.id;

    const [
      totalAppointments,
      upcomingAppointments,
      completedSessions,
      pendingRequests,
      uniqueFamilies,
      verificationStatus,
      todayAppointments,
      thisWeekAppointments,
      newMessages,
      pendingVerifications
    ] = await Promise.all([
      // Total appointments
      pool.query(
        `SELECT COUNT(*) as count FROM appointment_slots
         WHERE therapist_id = $1`,
        [therapistId]
      ),

      // Upcoming appointments
      pool.query(
        `SELECT COUNT(*) as count FROM appointment_slots
         WHERE therapist_id = $1 AND appointment_date >= CURRENT_DATE AND status != 'cancelled'`,
        [therapistId]
      ),

      // Completed sessions
      pool.query(
        `SELECT COUNT(*) as count FROM appointment_slots
         WHERE therapist_id = $1 AND status = 'completed'`,
        [therapistId]
      ),

      // Pending appointment requests
      pool.query(
        `SELECT COUNT(*) as count FROM appointment_slots
         WHERE therapist_id = $1 AND status = 'pending'`,
        [therapistId]
      ),

      // Number of families served (unique parents)
      pool.query(
        `SELECT COUNT(DISTINCT parent_id) as count FROM appointment_slots
         WHERE therapist_id = $1`,
        [therapistId]
      ),

      // Verification status
      pool.query(
        `SELECT verification_status FROM therapist_profiles
         WHERE user_id = $1`,
        [therapistId]
      ),

      // Today's appointments
      pool.query(
        `SELECT COUNT(*) as count FROM appointment_slots
         WHERE therapist_id = $1 AND appointment_date = CURRENT_DATE AND status != 'cancelled'`,
        [therapistId]
      ),

      // This week's appointments
      pool.query(
        `SELECT COUNT(*) as count FROM appointment_slots
         WHERE therapist_id = $1 AND appointment_date >= CURRENT_DATE
         AND appointment_date < CURRENT_DATE + INTERVAL '7 days'
         AND status != 'cancelled'`,
        [therapistId]
      ),

      // New messages
      pool.query(
        `SELECT COUNT(*) as count FROM messages
         WHERE receiver_id = $1 AND is_read = false`,
        [therapistId]
      ),

      // Pending verifications
      pool.query(
        `SELECT COUNT(*) as count FROM verification_documents
         WHERE user_id = $1 AND status = 'pending'`,
        [therapistId]
      )
    ]);

    res.json({
      overview: {
        total_appointments: parseInt(totalAppointments.rows[0].count),
        upcoming_appointments: parseInt(upcomingAppointments.rows[0].count),
        completed_sessions: parseInt(completedSessions.rows[0].count),
        pending_requests: parseInt(pendingRequests.rows[0].count),
        families_served: parseInt(uniqueFamilies.rows[0].count),
        verification_status: verificationStatus.rows[0]?.verification_status || 'pending'
      },
      dashboard_cards: {
        todays_appointments: parseInt(todayAppointments.rows[0].count),
        this_week_appointments: parseInt(thisWeekAppointments.rows[0].count),
        new_messages: parseInt(newMessages.rows[0].count),
        pending_verifications: parseInt(pendingVerifications.rows[0].count)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// READ - Get all appointments with filters
router.get('/all', authRequired, isTherapist, async (req, res) => {
  const { limit = 20, offset = 0, status, date_from, date_to } = req.query;
  const therapistId = req.user.id;

  try {
    let query = `
      SELECT aps.id, aps.appointment_date, aps.start_time, aps.end_time, aps.status,
             u.id as parent_id, u.name as parent_name, u.email as parent_email,
             aps.created_at, aps.updated_at
      FROM appointment_slots aps
      JOIN users u ON aps.parent_id = u.id
      WHERE aps.therapist_id = $1
    `;
    const params = [therapistId];

    if (status) {
      query += ` AND aps.status = $${params.length + 1}`;
      params.push(status);
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

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM appointment_slots WHERE therapist_id = $1`;
    const countParams = [therapistId];

    if (status) {
      countQuery += ` AND status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    if (date_from) {
      countQuery += ` AND appointment_date >= $${countParams.length + 1}`;
      countParams.push(date_from);
    }
    if (date_to) {
      countQuery += ` AND appointment_date <= $${countParams.length + 1}`;
      countParams.push(date_to);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      appointments: rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// UPDATE - Accept appointment
router.put('/:id/accept', authRequired, isTherapist, async (req, res) => {
  const therapistId = req.user.id;

  try {
    const { rows } = await pool.query(
      `UPDATE appointment_slots
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND therapist_id = $3
       RETURNING *`,
      ['confirmed', req.params.id, therapistId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ appointment: rows[0], message: 'Appointment accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept appointment' });
  }
});

// UPDATE - Reject appointment
router.put('/:id/reject', authRequired, isTherapist, async (req, res) => {
  const { reason } = req.body;
  const therapistId = req.user.id;

  try {
    const { rows } = await pool.query(
      `UPDATE appointment_slots
       SET status = $1, cancellation_reason = $2, updated_at = NOW()
       WHERE id = $3 AND therapist_id = $4
       RETURNING *`,
      ['cancelled', reason || 'Rejected by therapist', req.params.id, therapistId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ appointment: rows[0], message: 'Appointment rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject appointment' });
  }
});

// UPDATE - Reschedule appointment
router.put('/:id/reschedule', authRequired, isTherapist, async (req, res) => {
  const { appointment_date, start_time, end_time } = req.body;
  const therapistId = req.user.id;

  if (!appointment_date || !start_time) {
    return res.status(400).json({ error: 'New date and time required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE appointment_slots
       SET appointment_date = $1, start_time = $2, end_time = $3, updated_at = NOW()
       WHERE id = $4 AND therapist_id = $5
       RETURNING *`,
      [appointment_date, start_time, end_time || null, req.params.id, therapistId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ appointment: rows[0], message: 'Appointment rescheduled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

// UPDATE - Mark appointment completed
router.put('/:id/complete', authRequired, isTherapist, async (req, res) => {
  const therapistId = req.user.id;

  try {
    const { rows } = await pool.query(
      `UPDATE appointment_slots
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND therapist_id = $3
       RETURNING *`,
      ['completed', req.params.id, therapistId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ appointment: rows[0], message: 'Appointment marked as completed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark appointment completed' });
  }
});

// UPDATE - Add/Update appointment notes
router.put('/:id/notes', authRequired, isTherapist, async (req, res) => {
  const { notes } = req.body;
  const therapistId = req.user.id;

  if (!notes) {
    return res.status(400).json({ error: 'Notes required' });
  }

  try {
    // Get the appointment to resolve parent_id and date (both required on progress_notes)
    const appt = await pool.query(
      `SELECT parent_id, appointment_date FROM appointment_slots WHERE id = $1 AND therapist_id = $2`,
      [req.params.id, therapistId]
    );

    if (!appt.rowCount) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const { parent_id, appointment_date } = appt.rows[0];

    // Check if progress note exists
    const existing = await pool.query(
      `SELECT id FROM progress_notes WHERE appointment_id = $1`,
      [req.params.id]
    );

    let result;
    if (existing.rowCount) {
      result = await pool.query(
        `UPDATE progress_notes
         SET observations = $1, updated_at = NOW()
         WHERE appointment_id = $2
         RETURNING *`,
        [notes, req.params.id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO progress_notes (appointment_id, therapist_id, parent_id, session_date, observations, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [req.params.id, therapistId, parent_id, appointment_date, notes]
      );
    }

    res.json({ notes: result.rows[0], message: 'Notes saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

// DELETE - Cancel appointment
router.put('/:id/cancel', authRequired, isTherapist, async (req, res) => {
  const { reason } = req.body;
  const therapistId = req.user.id;

  try {
    const { rows } = await pool.query(
      `UPDATE appointment_slots
       SET status = $1, cancellation_reason = $2, updated_at = NOW()
       WHERE id = $3 AND therapist_id = $4
       RETURNING *`,
      ['cancelled', reason || 'Cancelled by therapist', req.params.id, therapistId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ appointment: rows[0], message: 'Appointment cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// READ - Get appointment details with notes
router.get('/:id/details', authRequired, isTherapist, async (req, res) => {
  const therapistId = req.user.id;

  try {
    const [appointmentRes, notesRes] = await Promise.all([
      pool.query(
        `SELECT aps.*, u.name as parent_name, u.email as parent_email
         FROM appointment_slots aps
         JOIN users u ON aps.parent_id = u.id
         WHERE aps.id = $1 AND aps.therapist_id = $2`,
        [req.params.id, therapistId]
      ),
      pool.query(
        `SELECT * FROM progress_notes WHERE appointment_id = $1`,
        [req.params.id]
      )
    ]);

    if (!appointmentRes.rowCount) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      appointment: appointmentRes.rows[0],
      notes: notesRes.rows[0] || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointment details' });
  }
});

// READ - Get calendar data for therapist
router.get('/calendar/month', authRequired, isTherapist, async (req, res) => {
  const { year, month } = req.query;
  const therapistId = req.user.id;

  try {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { rows } = await pool.query(
      `SELECT appointment_date, status, COUNT(*) as count
       FROM appointment_slots
       WHERE therapist_id = $1 AND appointment_date >= $2 AND appointment_date <= $3
       GROUP BY appointment_date, status
       ORDER BY appointment_date`,
      [therapistId, startDate, endDate]
    );

    res.json({ calendar_data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

// READ - Send appointment reminder
router.post('/:id/send-reminder', authRequired, isTherapist, async (req, res) => {
  const therapistId = req.user.id;

  try {
    // Get appointment and parent details
    const { rows } = await pool.query(
      `SELECT aps.*, u.email as parent_email, u.name as parent_name
       FROM appointment_slots aps
       JOIN users u ON aps.parent_id = u.id
       WHERE aps.id = $1 AND aps.therapist_id = $2`,
      [req.params.id, therapistId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = rows[0];

    // In production, integrate with email service
    // For now, just return success
    res.json({
      message: `Reminder sent to ${appointment.parent_name} at ${appointment.parent_email}`,
      appointment: appointment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

module.exports = router;
