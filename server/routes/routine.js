const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

const DEFAULT_TASKS = ['brushing', 'breakfast', 'school', 'play', 'sleep'];

function todayDate() {
  const d = new Date();
  // YYYY-MM-DD in local server time
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// GET /api/routine/today  → returns map of taskKey → completed
router.get('/today', authRequired, async (req, res) => {
  const date = todayDate();
  try {
    const { rows } = await pool.query(
      'SELECT task_key, completed FROM routine_logs WHERE user_id = $1 AND log_date = $2',
      [req.user.id, date]
    );
    const map = {};
    DEFAULT_TASKS.forEach((t) => { map[t] = false; });
    rows.forEach((r) => { map[r.task_key] = r.completed; });
    const completed = Object.values(map).filter(Boolean).length;
    res.json({ date, tasks: map, completed, total: DEFAULT_TASKS.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch routine' });
  }
});

// POST /api/routine/toggle  { task_key }
router.post('/toggle', authRequired, async (req, res) => {
  const { task_key } = req.body || {};
  if (!task_key || !DEFAULT_TASKS.includes(task_key)) {
    return res.status(400).json({ error: 'Invalid task_key' });
  }
  const date = todayDate();
  try {
    // upsert + flip
    const existing = await pool.query(
      'SELECT id, completed FROM routine_logs WHERE user_id = $1 AND task_key = $2 AND log_date = $3',
      [req.user.id, task_key, date]
    );
    if (existing.rowCount) {
      const newVal = !existing.rows[0].completed;
      await pool.query('UPDATE routine_logs SET completed = $1 WHERE id = $2',
        [newVal, existing.rows[0].id]);
      return res.json({ task_key, completed: newVal });
    }
    await pool.query(
      'INSERT INTO routine_logs (user_id, task_key, log_date, completed) VALUES ($1,$2,$3,true)',
      [req.user.id, task_key, date]
    );
    res.json({ task_key, completed: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle task' });
  }
});

module.exports = router;
