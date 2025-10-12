const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res, next) => {
  try {
    const [rows] = await req.db.query('SELECT * FROM transactions WHERE userId = ? ORDER BY id DESC LIMIT 500', [req.user.userId]);
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
