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

// CREATE - Add organization
router.post('/add', authRequired, isAdmin, async (req, res) => {
  const { name, type, email, phone_1, location, city, state, website, specializations } = req.body;

  if (!name || !type || !email || !location) {
    return res.status(400).json({ error: 'Name, type, email, and location required' });
  }

  const validTypes = ['therapy_center', 'child_development_center', 'special_education_center', 'rehabilitation_center'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid organization type' });
  }

  try {
    // Check if organization already exists
    const exists = await pool.query('SELECT 1 FROM organizations WHERE name = $1', [name]);
    if (exists.rowCount) {
      return res.status(409).json({ error: 'Organization already registered' });
    }

    // Create organization
    const orgRes = await pool.query(
      `INSERT INTO organizations (name, type, location, city, state, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [name, type, location, city || null, state || null]
    );

    const orgId = orgRes.rows[0].id;

    // Create organization details
    await pool.query(
      `INSERT INTO organization_details (organization_id, email, phone_1, website, specializations, verification_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [orgId, email, phone_1 || null, website || null, specializations || null, 'pending']
    );

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'ADD_ORGANIZATION', 'organizations', orgId]
    );

    res.status(201).json({
      organization: { id: orgId, name, type, email, location },
      message: 'Organization added and marked as pending'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add organization' });
  }
});

// READ - Get all organization applications with filters
router.get('/applications', authRequired, isAdmin, async (req, res) => {
  const { limit = 20, offset = 0, status = 'pending', search } = req.query;

  try {
    let query = `
      SELECT o.id, o.name, o.type, o.location, o.city, o.state, o.created_at,
             od.email, od.phone_1, od.verification_status,
             (SELECT COUNT(*) FROM verification_documents WHERE organization_id = o.id) as document_count
      FROM organizations o
      LEFT JOIN organization_details od ON o.id = od.organization_id
      WHERE 1=1
    `;
    const params = [];

    if (status !== 'all') {
      query += ` AND od.verification_status = $${params.length + 1}`;
      params.push(status);
    }

    if (search) {
      query += ` AND (o.name ILIKE $${params.length + 1} OR od.email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as count FROM organizations o
      LEFT JOIN organization_details od ON o.id = od.organization_id
      WHERE 1=1
    `;
    const countParams = [];

    if (status !== 'all') {
      countQuery += ` AND od.verification_status = $${countParams.length + 1}`;
      countParams.push(status);
    }

    if (search) {
      countQuery += ` AND (o.name ILIKE $${countParams.length + 1} OR od.email ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      applications: rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// READ - Get registration documents for organization
router.get('/:id/documents', authRequired, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, organization_id, document_type, document_url, status, admin_notes, created_at
       FROM verification_documents
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({ documents: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// READ - Get full organization profile
router.get('/:id/profile', authRequired, isAdmin, async (req, res) => {
  try {
    const [orgRes, detailsRes, docsRes, servicesRes] = await Promise.all([
      pool.query('SELECT id, name, type, location, city, state, created_at FROM organizations WHERE id = $1', [req.params.id]),
      pool.query('SELECT * FROM organization_details WHERE organization_id = $1', [req.params.id]),
      pool.query('SELECT * FROM verification_documents WHERE organization_id = $1 ORDER BY created_at DESC', [req.params.id]),
      pool.query('SELECT * FROM organization_services WHERE organization_id = $1', [req.params.id])
    ]);

    if (!orgRes.rowCount) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({
      organization: orgRes.rows[0],
      details: detailsRes.rows[0] || null,
      documents: docsRes.rows,
      services: servicesRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// UPDATE - Approve organization
router.put('/:id/approve', authRequired, isAdmin, async (req, res) => {
  const { approval_notes } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE organization_details
       SET verification_status = $1, approval_notes = $2, verified_at = NOW()
       WHERE organization_id = $3
       RETURNING *`,
      ['approved', approval_notes || null, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'APPROVE_ORGANIZATION', 'organizations', req.params.id, JSON.stringify({ status: 'approved' })]
    );

    res.json({ organization: rows[0], message: 'Organization approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve organization' });
  }
});

// UPDATE - Reject organization
router.put('/:id/reject', authRequired, isAdmin, async (req, res) => {
  const { rejection_reason } = req.body;

  if (!rejection_reason) {
    return res.status(400).json({ error: 'Rejection reason required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE organization_details
       SET verification_status = $1, rejection_reason = $2, rejected_at = NOW()
       WHERE organization_id = $3
       RETURNING *`,
      ['rejected', rejection_reason, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'REJECT_ORGANIZATION', 'organizations', req.params.id, JSON.stringify({ reason: rejection_reason })]
    );

    res.json({ organization: rows[0], message: 'Organization rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reject organization' });
  }
});

// UPDATE - Update organization information
router.put('/:id/update', authRequired, isAdmin, async (req, res) => {
  const { name, type, location, city, state, email, phone_1, website, specializations } = req.body;

  try {
    let updates = [];
    let params = [];
    let paramIndex = 1;

    // Update organization table
    if (name || type || location || city || state) {
      let orgUpdates = [];
      if (name) {
        orgUpdates.push(`name = $${paramIndex}`);
        params.push(name);
        paramIndex++;
      }
      if (type) {
        orgUpdates.push(`type = $${paramIndex}`);
        params.push(type);
        paramIndex++;
      }
      if (location) {
        orgUpdates.push(`location = $${paramIndex}`);
        params.push(location);
        paramIndex++;
      }
      if (city !== undefined) {
        orgUpdates.push(`city = $${paramIndex}`);
        params.push(city || null);
        paramIndex++;
      }
      if (state !== undefined) {
        orgUpdates.push(`state = $${paramIndex}`);
        params.push(state || null);
        paramIndex++;
      }

      if (orgUpdates.length > 0) {
        params.push(req.params.id);
        await pool.query(
          `UPDATE organizations SET ${orgUpdates.join(', ')} WHERE id = $${paramIndex}`,
          params
        );
        params.pop(); // Remove org id for next query
        paramIndex--;
      }
    }

    // Update organization details
    let detailUpdates = [];
    if (email) {
      detailUpdates.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }
    if (phone_1 !== undefined) {
      detailUpdates.push(`phone_1 = $${paramIndex}`);
      params.push(phone_1 || null);
      paramIndex++;
    }
    if (website !== undefined) {
      detailUpdates.push(`website = $${paramIndex}`);
      params.push(website || null);
      paramIndex++;
    }
    if (specializations !== undefined) {
      detailUpdates.push(`specializations = $${paramIndex}`);
      params.push(specializations || null);
      paramIndex++;
    }

    if (detailUpdates.length > 0) {
      params.push(req.params.id);
      const { rows } = await pool.query(
        `UPDATE organization_details SET ${detailUpdates.join(', ')} WHERE organization_id = $${paramIndex}
         RETURNING *`,
        params
      );

      if (!rows.length) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Log action
      await pool.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, 'UPDATE_ORGANIZATION', 'organizations', req.params.id, JSON.stringify({ name, type, location, email })]
      );

      res.json({ organization: rows[0], message: 'Organization updated successfully' });
    } else {
      res.status(400).json({ error: 'No fields to update' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// DELETE - Remove organization
router.delete('/:id/remove', authRequired, isAdmin, async (req, res) => {
  try {
    // Delete related data
    await pool.query('DELETE FROM organization_services WHERE organization_id = $1', [req.params.id]);
    await pool.query('DELETE FROM verification_documents WHERE organization_id = $1', [req.params.id]);
    await pool.query('DELETE FROM organization_details WHERE organization_id = $1', [req.params.id]);

    // Delete organization
    const { rows } = await pool.query(
      'DELETE FROM organizations WHERE id = $1 RETURNING id, name',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'REMOVE_ORGANIZATION', 'organizations', req.params.id]
    );

    res.json({ message: 'Organization removed permanently' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove organization' });
  }
});

// DELETE - Suspend organization (Soft delete)
router.put('/:id/suspend', authRequired, isAdmin, async (req, res) => {
  const { suspension_reason } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE organization_details
       SET verification_status = $1, suspension_reason = $2, suspended_at = NOW()
       WHERE organization_id = $3
       RETURNING *`,
      ['suspended', suspension_reason || null, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'SUSPEND_ORGANIZATION', 'organizations', req.params.id, JSON.stringify({ reason: suspension_reason })]
    );

    res.json({ organization: rows[0], message: 'Organization suspended' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to suspend organization' });
  }
});

// UPDATE - Unsuspend organization
router.put('/:id/unsuspend', authRequired, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE organization_details
       SET verification_status = $1, suspended_at = NULL
       WHERE organization_id = $2
       RETURNING *`,
      ['approved', req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'UNSUSPEND_ORGANIZATION', 'organizations', req.params.id]
    );

    res.json({ organization: rows[0], message: 'Organization unsuspended' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unsuspend organization' });
  }
});

module.exports = router;
