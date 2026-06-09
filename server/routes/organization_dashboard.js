const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

// Middleware: Check if organization admin
async function isOrgAdmin(req, res, next) {
  if (req.user.role !== 'organization_admin') {
    return res.status(403).json({ error: 'Organization admin access required' });
  }
  next();
}

// ===== OVERVIEW ENDPOINTS =====

// GET /api/org-dashboard/overview - All overview metrics
router.get('/overview', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  if (!orgId) {
    return res.status(400).json({ error: 'User not associated with an organization' });
  }

  try {
    const [
      staffCount,
      clientsCount,
      monthlyAppointments,
      upcomingAppointments,
      workshopsCount,
      servicesCount,
      recentAppointments,
      newApplications,
      eventRegistrations,
      monthlyStats
    ] = await Promise.all([
      // Total staff members
      pool.query(
        `SELECT COUNT(*) as count FROM organization_members WHERE organization_id = $1`,
        [orgId]
      ),

      // Active clients/families (unique parents with appointments at this org)
      pool.query(
        `SELECT COUNT(DISTINCT aps.parent_id) as count FROM appointment_slots aps
         JOIN users t ON aps.therapist_id = t.id
         WHERE t.organization_id = $1 AND aps.status != 'cancelled'`,
        [orgId]
      ),

      // Monthly therapy sessions
      pool.query(
        `SELECT COUNT(*) as count FROM appointment_slots aps
         JOIN users t ON aps.therapist_id = t.id
         WHERE t.organization_id = $1 AND EXTRACT(MONTH FROM aps.appointment_date) = EXTRACT(MONTH FROM NOW())`,
        [orgId]
      ),

      // Upcoming appointments
      pool.query(
        `SELECT COUNT(*) as count FROM appointment_slots aps
         JOIN users t ON aps.therapist_id = t.id
         WHERE t.organization_id = $1 AND aps.appointment_date >= CURRENT_DATE AND aps.status != 'cancelled'`,
        [orgId]
      ),

      // Upcoming workshops/events
      pool.query(
        `SELECT COUNT(*) as count FROM events WHERE organization_id = $1 AND event_date >= CURRENT_DATE`,
        [orgId]
      ),

      // Active services
      pool.query(
        `SELECT COUNT(*) as count FROM organization_services WHERE organization_id = $1`,
        [orgId]
      ),

      // Recent appointments (last 5)
      pool.query(
        `SELECT aps.id, aps.appointment_date, aps.start_time, aps.status,
                u1.name as therapist_name, u2.name as parent_name
         FROM appointment_slots aps
         JOIN users u1 ON aps.therapist_id = u1.id
         JOIN users u2 ON aps.parent_id = u2.id
         WHERE u1.organization_id = $1
         ORDER BY aps.appointment_date DESC
         LIMIT 5`,
        [orgId]
      ),

      // New therapist applications (pending)
      pool.query(
        `SELECT COUNT(*) as count FROM therapist_profiles
         WHERE verification_status = 'pending' AND user_id IN (
           SELECT id FROM users WHERE organization_id = $1
         )`,
        [orgId]
      ),

      // Event registrations
      pool.query(
        `SELECT COUNT(*) as count FROM event_registrations er
         JOIN events e ON er.event_id = e.id
         WHERE e.organization_id = $1`,
        [orgId]
      ),

      // Monthly statistics
      pool.query(
        `SELECT
           (SELECT COUNT(*) FROM organization_members WHERE organization_id = $1) as total_staff,
           (SELECT COUNT(*) FROM appointment_slots aps
            JOIN users t ON aps.therapist_id = t.id
            WHERE t.organization_id = $1 AND aps.status = 'completed') as completed_sessions,
           (SELECT COUNT(DISTINCT parent_id) FROM appointment_slots aps
            JOIN users t ON aps.therapist_id = t.id
            WHERE t.organization_id = $1) as total_clients,
           (SELECT COUNT(*) FROM organization_services WHERE organization_id = $1) as active_services
         `,
        [orgId]
      )
    ]);

    res.json({
      overview: {
        total_staff: parseInt(staffCount.rows[0].count),
        active_clients: parseInt(clientsCount.rows[0].count),
        monthly_sessions: parseInt(monthlyAppointments.rows[0].count),
        upcoming_appointments: parseInt(upcomingAppointments.rows[0].count),
        upcoming_workshops: parseInt(workshopsCount.rows[0].count),
        active_services: parseInt(servicesCount.rows[0].count)
      },
      dashboard_widgets: {
        recent_appointments: recentAppointments.rows,
        new_applications: parseInt(newApplications.rows[0].count),
        event_registrations: parseInt(eventRegistrations.rows[0].count)
      },
      monthly_statistics: monthlyStats.rows[0]
    });
  } catch (err) {
    console.error('Overview error:', err);
    res.status(500).json({ error: 'Failed to fetch overview', details: err.message });
  }
});

// ===== TEAM MANAGEMENT ENDPOINTS =====

// CREATE - Add therapist
router.post('/staff/add-therapist', authRequired, isOrgAdmin, async (req, res) => {
  const { name, email, specialization, position } = req.body;
  const orgId = req.user.organization_id;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email required' });
  }

  try {
    // Check if user exists
    let userId;
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rowCount > 0) {
      userId = existing.rows[0].id;
    } else {
      // Create new user
      const newUser = await pool.query(
        `INSERT INTO users (name, email, role, organization_id, avatar_url, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id`,
        [name, email, 'therapist', orgId, `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`]
      );
      userId = newUser.rows[0].id;
    }

    // Add to organization members
    const { rows } = await pool.query(
      `INSERT INTO organization_members (organization_id, user_id, position, joined_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (organization_id, user_id) DO UPDATE SET position = EXCLUDED.position
       RETURNING *`,
      [orgId, userId, position || 'Therapist']
    );

    res.status(201).json({ member: rows[0], message: 'Therapist added successfully' });
  } catch (err) {
    console.error('Add therapist error:', err);
    res.status(500).json({ error: 'Failed to add therapist', details: err.message });
  }
});

// CREATE - Add psychologist
router.post('/staff/add-psychologist', authRequired, isOrgAdmin, async (req, res) => {
  const { name, email, specialization } = req.body;
  const orgId = req.user.organization_id;

  try {
    let userId;
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rowCount > 0) {
      userId = existing.rows[0].id;
    } else {
      const newUser = await pool.query(
        `INSERT INTO users (name, email, role, organization_id, avatar_url, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id`,
        [name, email, 'therapist', orgId, `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`]
      );
      userId = newUser.rows[0].id;
    }

    const { rows } = await pool.query(
      `INSERT INTO organization_members (organization_id, user_id, position, joined_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (organization_id, user_id) DO UPDATE SET position = EXCLUDED.position
       RETURNING *`,
      [orgId, userId, 'Psychologist']
    );

    res.status(201).json({ member: rows[0], message: 'Psychologist added successfully' });
  } catch (err) {
    console.error('Add psychologist error:', err);
    res.status(500).json({ error: 'Failed to add psychologist' });
  }
});

// CREATE - Add special educator
router.post('/staff/add-educator', authRequired, isOrgAdmin, async (req, res) => {
  const { name, email, specialization } = req.body;
  const orgId = req.user.organization_id;

  try {
    let userId;
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rowCount > 0) {
      userId = existing.rows[0].id;
    } else {
      const newUser = await pool.query(
        `INSERT INTO users (name, email, role, organization_id, avatar_url, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id`,
        [name, email, 'therapist', orgId, `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`]
      );
      userId = newUser.rows[0].id;
    }

    const { rows } = await pool.query(
      `INSERT INTO organization_members (organization_id, user_id, position, joined_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (organization_id, user_id) DO UPDATE SET position = EXCLUDED.position
       RETURNING *`,
      [orgId, userId, 'Special Educator']
    );

    res.status(201).json({ member: rows[0], message: 'Special Educator added successfully' });
  } catch (err) {
    console.error('Add educator error:', err);
    res.status(500).json({ error: 'Failed to add educator' });
  }
});

// CREATE - Add counselor
router.post('/staff/add-counselor', authRequired, isOrgAdmin, async (req, res) => {
  const { name, email, specialization } = req.body;
  const orgId = req.user.organization_id;

  try {
    let userId;
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rowCount > 0) {
      userId = existing.rows[0].id;
    } else {
      const newUser = await pool.query(
        `INSERT INTO users (name, email, role, organization_id, avatar_url, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id`,
        [name, email, 'therapist', orgId, `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`]
      );
      userId = newUser.rows[0].id;
    }

    const { rows } = await pool.query(
      `INSERT INTO organization_members (organization_id, user_id, position, joined_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (organization_id, user_id) DO UPDATE SET position = EXCLUDED.position
       RETURNING *`,
      [orgId, userId, 'Counselor']
    );

    res.status(201).json({ member: rows[0], message: 'Counselor added successfully' });
  } catch (err) {
    console.error('Add counselor error:', err);
    res.status(500).json({ error: 'Failed to add counselor' });
  }
});

// CREATE - Add generic staff member
router.post('/staff/add-member', authRequired, isOrgAdmin, async (req, res) => {
  const { name, email, position } = req.body;
  const orgId = req.user.organization_id;

  if (!name || !email || !position) {
    return res.status(400).json({ error: 'Name, email, and position required' });
  }

  try {
    let userId;
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rowCount > 0) {
      userId = existing.rows[0].id;
    } else {
      const newUser = await pool.query(
        `INSERT INTO users (name, email, role, organization_id, avatar_url, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id`,
        [name, email, 'therapist', orgId, `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`]
      );
      userId = newUser.rows[0].id;
    }

    const { rows } = await pool.query(
      `INSERT INTO organization_members (organization_id, user_id, position, joined_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (organization_id, user_id) DO UPDATE SET position = EXCLUDED.position
       RETURNING *`,
      [orgId, userId, position]
    );

    res.status(201).json({ member: rows[0], message: 'Staff member added successfully' });
  } catch (err) {
    console.error('Add staff error:', err);
    res.status(500).json({ error: 'Failed to add staff member' });
  }
});

// READ - Get all staff
router.get('/staff/all', authRequired, isOrgAdmin, async (req, res) => {
  const { limit = 20, offset = 0, search } = req.query;
  const orgId = req.user.organization_id;

  try {
    let query = `
      SELECT u.id, u.name, u.email, u.avatar_url, om.position, om.joined_at
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = $1
    `;
    const params = [orgId];

    if (search) {
      query += ` AND (u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY om.joined_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    res.json({ staff: rows, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    console.error('Get staff error:', err);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// READ - Get staff profile
router.get('/staff/:id/profile', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_url, om.position, om.joined_at,
              tp.bio, tp.years_experience, tp.specializations
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
       WHERE om.organization_id = $1 AND u.id = $2`,
      [orgId, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ staff: rows[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// UPDATE - Edit staff information
router.put('/staff/:id/update', authRequired, isOrgAdmin, async (req, res) => {
  const { name, email, position } = req.body;
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `UPDATE organization_members SET position = $1
       WHERE organization_id = $2 AND user_id = $3
       RETURNING *`,
      [position, orgId, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ staff: rows[0], message: 'Staff information updated' });
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

// UPDATE - Assign role
router.put('/staff/:id/role', authRequired, isOrgAdmin, async (req, res) => {
  const { position } = req.body;
  const orgId = req.user.organization_id;

  if (!position) {
    return res.status(400).json({ error: 'Position required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE organization_members SET position = $1, updated_at = NOW()
       WHERE organization_id = $2 AND user_id = $3
       RETURNING *`,
      [position, orgId, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ staff: rows[0], message: 'Role assigned successfully' });
  } catch (err) {
    console.error('Assign role error:', err);
    res.status(500).json({ error: 'Failed to assign role' });
  }
});

// DELETE - Remove staff member
router.delete('/staff/:id/remove', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `DELETE FROM organization_members
       WHERE organization_id = $1 AND user_id = $2
       RETURNING id`,
      [orgId, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ message: 'Staff member removed successfully' });
  } catch (err) {
    console.error('Remove staff error:', err);
    res.status(500).json({ error: 'Failed to remove staff member' });
  }
});

// DELETE - Disable account
router.put('/staff/:id/disable', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `UPDATE organization_members SET disabled = true, updated_at = NOW()
       WHERE organization_id = $1 AND user_id = $2
       RETURNING *`,
      [orgId, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ staff: rows[0], message: 'Account disabled successfully' });
  } catch (err) {
    console.error('Disable account error:', err);
    res.status(500).json({ error: 'Failed to disable account' });
  }
});

module.exports = router;
