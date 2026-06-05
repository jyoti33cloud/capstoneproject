const router = require('express').Router();
const pool = require('../db');

// GET /api/specialists?type=specialist|center|all&q=
router.get('/', async (req, res) => {
  const { type = 'all', q = '' } = req.query;
  try {
    let sql = 'SELECT * FROM specialists WHERE 1=1';
    const params = [];
    if (type !== 'all') {
      params.push(type);
      sql += ` AND type = $${params.length}`;
    }
    if (q.trim()) {
      params.push(`%${q.trim()}%`);
      sql += ` AND (name ILIKE $${params.length} OR location ILIKE $${params.length} OR specialty ILIKE $${params.length})`;
    }
    sql += ' ORDER BY rating DESC, id ASC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch specialists' });
  }
});

// GET /api/specialists/:id
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM specialists WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

module.exports = router;
