const router = require('express').Router();
const pool = require('../db');
const { authRequired } = require('../middleware/auth');

const CHECKLIST_ITEMS = [
  { key: 'diagnosis_confirmation', label: 'Get formal autism diagnosis from qualified professional' },
  { key: 'medical_records', label: 'Organize medical and diagnostic records' },
  { key: 'school_notification', label: 'Inform school about child\'s autism' },
  { key: 'iep_plan', label: 'Develop Individual Education Plan (IEP)' },
  { key: 'therapy_plan', label: 'Create therapy/intervention plan' },
  { key: 'disability_id_application', label: 'Apply for government disability ID card' },
  { key: 'disability_id_received', label: 'Receive disability ID card' },
  { key: 'allowance_registration', label: 'Register for disability allowance/pension' },
  { key: 'school_support', label: 'Arrange school support services' },
  { key: 'therapist_contact', label: 'Establish contact with qualified therapist' },
  { key: 'parent_support', label: 'Join parent support group' },
  { key: 'financial_assistance', label: 'Explore financial assistance programs' },
  { key: 'communication_tools', label: 'Identify communication tools/methods' },
  { key: 'accessibility_home', label: 'Make home modifications for accessibility' },
  { key: 'family_training', label: 'Complete family caregiver training' },
];

// GET /api/disability-checklist
router.get('/', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT item_key, completed FROM disability_checklist WHERE user_id = $1',
      [req.user.id]
    );

    const completed = rows.reduce((acc, row) => {
      acc[row.item_key] = row.completed;
      return acc;
    }, {});

    const checklist = CHECKLIST_ITEMS.map(item => ({
      key: item.key,
      label: item.label,
      completed: completed[item.key] || false,
    }));

    res.json(checklist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

// POST /api/disability-checklist/:key
router.post('/:key', authRequired, async (req, res) => {
  const { completed } = req.body;
  const { key } = req.params;

  if (!CHECKLIST_ITEMS.find(item => item.key === key)) {
    return res.status(400).json({ error: 'Invalid checklist item' });
  }

  try {
    await pool.query(
      `INSERT INTO disability_checklist (user_id, item_key, completed)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, item_key) DO UPDATE SET completed = $3`,
      [req.user.id, key, completed]
    );
    res.json({ ok: true, key, completed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update checklist' });
  }
});

module.exports = router;
