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

// ===== REPORT GENERATION ENDPOINTS =====

// GET /api/org-reports/overview - All statistics
router.get('/overview', authRequired, isOrgAdmin, async (req, res) => {
  const { start_date, end_date } = req.query;
  const orgId = req.user.organization_id;

  try {
    const [
      clientsServed,
      therapySessions,
      appointmentStats,
      workshopAttendance,
      therapistWorkload,
      serviceUtilization
    ] = await Promise.all([
      // Clients served
      pool.query(
        `SELECT COUNT(DISTINCT parent_id) as total_clients,
                COUNT(DISTINCT CASE WHEN appointment_date >= CURRENT_DATE - INTERVAL '30 days' THEN parent_id END) as active_clients_30d,
                COUNT(DISTINCT CASE WHEN appointment_date >= CURRENT_DATE - INTERVAL '7 days' THEN parent_id END) as active_clients_7d
         FROM appointment_slots aps
         JOIN users tp ON aps.therapist_id = tp.id
         WHERE tp.organization_id = $1`,
        [orgId]
      ),

      // Therapy sessions
      pool.query(
        `SELECT COUNT(*) as total_sessions,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
                COUNT(CASE WHEN status = 'confirmed' AND appointment_date >= CURRENT_DATE THEN 1 END) as scheduled_sessions,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_sessions,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sessions,
                ROUND(AVG(EXTRACT(EPOCH FROM (end_time::time - start_time::time))/3600)::numeric, 2) as avg_session_duration
         FROM appointment_slots aps
         JOIN users tp ON aps.therapist_id = tp.id
         WHERE tp.organization_id = $1`,
        [orgId]
      ),

      // Appointment statistics
      pool.query(
        `SELECT
         ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / COUNT(*)::float * 100)::numeric, 2) as completion_rate,
         ROUND((COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::float / COUNT(*)::float * 100)::numeric, 2) as cancellation_rate,
         AVG(DATE_PART('day', aps.appointment_date - aps.created_at)) as avg_booking_advance_days,
         COUNT(CASE WHEN appointment_date = CURRENT_DATE THEN 1 END) as appointments_today,
         COUNT(CASE WHEN appointment_date >= CURRENT_DATE AND appointment_date < CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as appointments_this_week,
         COUNT(CASE WHEN appointment_date >= CURRENT_DATE AND appointment_date < CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as appointments_this_month
         FROM appointment_slots aps
         JOIN users tp ON aps.therapist_id = tp.id
         WHERE tp.organization_id = $1`,
        [orgId]
      ),

      // Workshop attendance
      pool.query(
        `SELECT COUNT(DISTINCT e.id) as total_events,
                COUNT(DISTINCT CASE WHEN e.event_type = 'workshop' THEN e.id END) as total_workshops,
                COUNT(DISTINCT CASE WHEN e.event_type = 'parent_training' THEN e.id END) as parent_trainings,
                COUNT(DISTINCT CASE WHEN e.event_type = 'awareness_campaign' THEN e.id END) as campaigns,
                SUM(e.capacity) as total_capacity,
                COUNT(er.id) as total_registrations,
                ROUND((COUNT(er.id)::float / SUM(e.capacity)::float * 100)::numeric, 2) as attendance_rate
         FROM events e
         LEFT JOIN event_registrations er ON e.id = er.event_id
         WHERE e.organization_id = $1`,
        [orgId]
      ),

      // Therapist workload
      pool.query(
        `SELECT u.id, u.name,
                COUNT(*) as total_appointments,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'confirmed' AND appointment_date >= CURRENT_DATE THEN 1 END) as upcoming,
                COUNT(DISTINCT parent_id) as unique_clients,
                ROUND(AVG(EXTRACT(EPOCH FROM (end_time::time - start_time::time))/3600)::numeric, 2) as avg_duration
         FROM users u
         LEFT JOIN appointment_slots aps ON u.id = aps.therapist_id
         WHERE u.organization_id = $1 AND u.role = 'therapist'
         GROUP BY u.id, u.name
         ORDER BY total_appointments DESC`,
        [orgId]
      ),

      // Service utilization
      pool.query(
        `SELECT os.id, os.service_name AS name,
                COUNT(DISTINCT aps.parent_id) as clients_using,
                COUNT(aps.id) as total_sessions,
                ROUND((COUNT(DISTINCT aps.parent_id)::float / COALESCE(
                  (SELECT COUNT(DISTINCT parent_id) FROM appointment_slots aps2
                   JOIN users u2 ON aps2.therapist_id = u2.id
                   WHERE u2.organization_id = $1), 1)::float * 100)::numeric, 2) as usage_percentage
         FROM organization_services os
         LEFT JOIN appointment_slots aps ON aps.notes ILIKE '%' || os.service_name || '%'
         LEFT JOIN users u ON aps.therapist_id = u.id
         WHERE os.organization_id = $1
         GROUP BY os.id, os.service_name
         ORDER BY total_sessions DESC`,
        [orgId]
      )
    ]);

    res.json({
      clients_served: clientsServed.rows[0],
      therapy_sessions: therapySessions.rows[0],
      appointment_statistics: appointmentStats.rows[0],
      workshop_attendance: workshopAttendance.rows[0],
      therapist_workload: therapistWorkload.rows,
      service_utilization: serviceUtilization.rows,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ error: 'Failed to generate report', details: err.message });
  }
});

// GET /api/org-reports/clients - Detailed client report
router.get('/clients', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email,
              COUNT(DISTINCT aps.id) as total_sessions,
              COUNT(CASE WHEN aps.status = 'completed' THEN 1 END) as completed_sessions,
              MAX(aps.appointment_date) as last_session,
              MIN(aps.created_at) as first_session,
              STRING_AGG(DISTINCT t.name, ', ') as therapists
       FROM users u
       LEFT JOIN appointment_slots aps ON u.id = aps.parent_id
       LEFT JOIN users t ON aps.therapist_id = t.id
       WHERE u.role = 'parent' AND EXISTS (
         SELECT 1 FROM appointment_slots aps2
         JOIN users t2 ON aps2.therapist_id = t2.id
         WHERE t2.organization_id = $1 AND aps2.parent_id = u.id
       )
       GROUP BY u.id, u.name, u.email
       ORDER BY total_sessions DESC`,
      [orgId]
    );

    res.json({ clients: rows });
  } catch (err) {
    console.error('Client report error:', err);
    res.status(500).json({ error: 'Failed to generate client report' });
  }
});

// GET /api/org-reports/therapist-performance - Detailed therapist report
router.get('/therapist-performance', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email,
              COUNT(*) as total_appointments,
              COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
              COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
              COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
              COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
              COUNT(DISTINCT parent_id) as unique_clients,
              ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / COUNT(*)::float * 100)::numeric, 2) as completion_rate,
              AVG(EXTRACT(EPOCH FROM (end_time::time - start_time::time))/3600) as avg_session_hours,
              ROUND((COUNT(DISTINCT parent_id)::float / COUNT(*)::float * 100)::numeric, 2) as repeat_client_rate
       FROM users u
       LEFT JOIN appointment_slots aps ON u.id = aps.therapist_id
       WHERE u.organization_id = $1 AND u.role = 'therapist'
       GROUP BY u.id, u.name, u.email
       ORDER BY total_appointments DESC`,
      [orgId]
    );

    res.json({ therapists: rows });
  } catch (err) {
    console.error('Therapist report error:', err);
    res.status(500).json({ error: 'Failed to generate therapist report' });
  }
});

// GET /api/org-reports/monthly-trends - Monthly trend data for charts
router.get('/monthly-trends', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `SELECT
       DATE_TRUNC('month', aps.appointment_date)::DATE as month,
       COUNT(*) as total_appointments,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
       COUNT(DISTINCT parent_id) as unique_clients,
       COUNT(DISTINCT therapist_id) as therapists_active
       FROM appointment_slots aps
       JOIN users tp ON aps.therapist_id = tp.id
       WHERE tp.organization_id = $1
       GROUP BY DATE_TRUNC('month', aps.appointment_date)
       ORDER BY month DESC
       LIMIT 12`,
      [orgId]
    );

    res.json({ trends: rows });
  } catch (err) {
    console.error('Trends report error:', err);
    res.status(500).json({ error: 'Failed to generate trends report' });
  }
});

// GET /api/org-reports/revenue - Revenue and utilization report
router.get('/revenue', authRequired, isOrgAdmin, async (req, res) => {
  const orgId = req.user.organization_id;

  try {
    const { rows } = await pool.query(
      `SELECT
       COUNT(e.id) as total_paid_events,
       COALESCE(SUM(e.amount * (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id)), 0) as estimated_event_revenue,
       SUM(CASE WHEN e.is_paid THEN e.capacity ELSE 0 END) as potential_paid_capacity,
       COUNT(DISTINCT er.user_id) as total_event_participants,
       SUM(e.capacity) as total_event_capacity,
       ROUND((COUNT(DISTINCT er.user_id)::float / SUM(e.capacity)::float * 100)::numeric, 2) as capacity_utilization
       FROM events e
       LEFT JOIN event_registrations er ON e.id = er.event_id
       WHERE e.organization_id = $1`,
      [orgId]
    );

    res.json({ revenue: rows[0] || {} });
  } catch (err) {
    console.error('Revenue report error:', err);
    res.status(500).json({ error: 'Failed to generate revenue report' });
  }
});

module.exports = router;
