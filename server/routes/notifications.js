const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const [rows] = await req.db.query('SELECT * FROM notifications WHERE userId = ? ORDER BY id DESC LIMIT 200', [req.user.userId]);
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/read', auth, async (req, res, next) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' });
    await req.db.query(`UPDATE notifications SET is_read = 1 WHERE userId = ? AND id IN (${ids.map(() => '?').join(',')})`, [req.user.userId, ...ids]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/unread-count', auth, async (req, res, next) => {
  try {
    const [rows] = await req.db.query('SELECT COUNT(1) as cnt FROM notifications WHERE userId = ? AND is_read = 0', [req.user.userId]);
    res.json({ count: rows[0]?.cnt || 0 });
  } catch (e) { next(e); }
});

module.exports = router;
