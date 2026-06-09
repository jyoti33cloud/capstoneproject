const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

// Middleware: Check if admin
async function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// GET /api/admin/dashboard/overview - Complete overview with all stats
router.get('/overview', authRequired, isAdmin, async (req, res) => {
  try {
    // Fetch all metrics in parallel
    const [
      totalUsers,
      totalTherapists,
      totalOrganizations,
      totalAppointments,
      totalPosts,
      pendingVerifications,
      recentActivities,
      platformStats
    ] = await Promise.all([
      // Total users
      pool.query('SELECT COUNT(*) as count FROM users'),

      // Total therapists
      pool.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['therapist']),

      // Total organizations
      pool.query('SELECT COUNT(*) as count FROM organizations'),

      // Total appointments
      pool.query('SELECT COUNT(*) as count FROM appointment_slots'),

      // Total forum posts
      pool.query('SELECT COUNT(*) as count FROM posts'),

      // Pending verifications
      pool.query(
        `SELECT COUNT(*) as count FROM therapist_profiles
         WHERE verification_status = $1`,
        ['pending']
      ),

      // Recent activities (last 10 audit logs)
      pool.query(
        `SELECT al.*, u.name as admin_name
         FROM audit_logs al
         LEFT JOIN users u ON al.admin_id = u.id
         ORDER BY al.created_at DESC
         LIMIT 10`
      ),

      // Platform statistics
      pool.query(
        `SELECT
           (SELECT COUNT(*) FROM users) as total_users,
           (SELECT COUNT(*) FROM users WHERE role = $1) as therapists,
           (SELECT COUNT(*) FROM users WHERE role = $2) as organizations_admin,
           (SELECT COUNT(*) FROM appointment_slots WHERE status = $3) as completed_appointments,
           (SELECT COUNT(*) FROM posts) as community_posts,
           (SELECT COUNT(DISTINCT user_id) FROM appointment_slots) as unique_parents,
           (SELECT COUNT(DISTINCT specialist_id) FROM appointment_slots) as active_therapists
         `,
        ['therapist', 'organization_admin', 'completed']
      )
    ]);

    res.json({
      metrics: {
        total_users: parseInt(totalUsers.rows[0].count),
        total_therapists: parseInt(totalTherapists.rows[0].count),
        total_organizations: parseInt(totalOrganizations.rows[0].count),
        total_appointments: parseInt(totalAppointments.rows[0].count),
        total_posts: parseInt(totalPosts.rows[0].count),
        pending_verifications: parseInt(pendingVerifications.rows[0].count)
      },
      recent_activities: recentActivities.rows,
      platform_statistics: platformStats.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/dashboard/users-breakdown - Users by role
router.get('/users-breakdown', authRequired, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`
    );
    res.json({ breakdown: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch breakdown' });
  }
});

// GET /api/admin/dashboard/appointments-by-status - Appointments breakdown
router.get('/appointments-by-status', authRequired, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*) as count FROM appointment_slots GROUP BY status`
    );
    res.json({ breakdown: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch breakdown' });
  }
});

// GET /api/admin/dashboard/recent-activities - Get recent activities with filters
router.get('/recent-activities', authRequired, isAdmin, async (req, res) => {
  const { limit = 20, offset = 0, action_type } = req.query;

  try {
    let query = `
      SELECT al.*, u.name as admin_name
      FROM audit_logs al
      LEFT JOIN users u ON al.admin_id = u.id
    `;
    const params = [];

    if (action_type) {
      query += ` WHERE al.action = $1`;
      params.push(action_type);
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    res.json({ activities: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// GET /api/admin/dashboard/export - Export data as JSON
router.get('/export', authRequired, isAdmin, async (req, res) => {
  const { type = 'full' } = req.query; // full, users, therapists, organizations, appointments

  try {
    const exportData = {};

    if (type === 'full' || type === 'users') {
      const { rows } = await pool.query(
        'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
      );
      exportData.users = rows;
    }

    if (type === 'full' || type === 'therapists') {
      const { rows } = await pool.query(
        `SELECT u.id, u.name, u.email, tp.bio, tp.years_experience, tp.consultation_fee, tp.verification_status
         FROM users u
         LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
         WHERE u.role = $1
         ORDER BY u.created_at DESC`,
        ['therapist']
      );
      exportData.therapists = rows;
    }

    if (type === 'full' || type === 'organizations') {
      const { rows } = await pool.query(
        `SELECT o.id, o.name, o.type, o.location, od.phone_1, od.email, od.verification_status
         FROM organizations o
         LEFT JOIN organization_details od ON o.id = od.organization_id
         ORDER BY o.created_at DESC`
      );
      exportData.organizations = rows;
    }

    if (type === 'full' || type === 'appointments') {
      const { rows } = await pool.query(
        `SELECT aps.id, aps.appointment_date, aps.start_time, aps.status,
                u1.name as therapist_name, u2.name as parent_name
         FROM appointment_slots aps
         JOIN users u1 ON aps.therapist_id = u1.id
         JOIN users u2 ON aps.parent_id = u2.id
         ORDER BY aps.appointment_date DESC`
      );
      exportData.appointments = rows;
    }

    // Return as JSON
    res.json({
      export: exportData,
      timestamp: new Date().toISOString(),
      type: type
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// GET /api/admin/dashboard/platform-health - Platform health check
router.get('/platform-health', authRequired, isAdmin, async (req, res) => {
  try {
    const [
      userGrowth,
      appointmentTrend,
      verificationRate,
      activeSessions
    ] = await Promise.all([
      // User growth last 30 days
      pool.query(
        `SELECT COUNT(*) as count FROM users
         WHERE created_at >= NOW() - INTERVAL '30 days'`
      ),

      // Appointments last 30 days
      pool.query(
        `SELECT COUNT(*) as count FROM appointment_slots
         WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'`
      ),

      // Therapist verification rate
      pool.query(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN verification_status = 'approved' THEN 1 ELSE 0 END) as verified
         FROM therapist_profiles`
      ),

      // Active specialists this month
      pool.query(
        `SELECT COUNT(DISTINCT therapist_id) as active_count
         FROM appointment_slots
         WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'`
      )
    ]);

    res.json({
      health: {
        new_users_30days: parseInt(userGrowth.rows[0].count),
        appointments_30days: parseInt(appointmentTrend.rows[0].count),
        verification_rate: verificationRate.rows[0].verified && verificationRate.rows[0].total
          ? ((verificationRate.rows[0].verified / verificationRate.rows[0].total) * 100).toFixed(2)
          : 0,
        active_specialists_30days: parseInt(activeSessions.rows[0].active_count || 0),
        platform_status: 'healthy'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch health data' });
  }
});

module.exports = router;
