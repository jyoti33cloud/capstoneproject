const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

// POST /api/verification/upload - Upload verification document
router.post('/upload', authRequired, async (req, res) => {
  const { document_type, document_url } = req.body;

  if (!document_type || !document_url) {
    return res.status(400).json({ error: 'Document type and URL required' });
  }

  const validTypes = ['license', 'certificate', 'degree', 'registration'];
  if (!validTypes.includes(document_type)) {
    return res.status(400).json({ error: 'Invalid document type' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO verification_documents (user_id, document_type, document_url, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, document_type, document_url, 'pending']
    );

    res.status(201).json({ document: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// GET /api/verification/my-documents - Get user's verification documents
router.get('/my-documents', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM verification_documents WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ documents: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /api/verification/status - Get verification status
router.get('/status', authRequired, async (req, res) => {
  try {
    const { rows: profileRows } = await pool.query(
      `SELECT is_verified, verification_status FROM therapist_profiles WHERE user_id = $1`,
      [req.user.id]
    );

    const { rows: docRows } = await pool.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
              SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
              SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM verification_documents WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({
      profile_status: profileRows[0] || { is_verified: false, verification_status: 'not_started' },
      documents_summary: docRows[0] || { total: 0, pending: 0, verified: 0, rejected: 0 }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// DELETE /api/verification/document/:id - Delete uploaded document
router.delete('/document/:id', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM verification_documents WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
