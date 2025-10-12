const express = require('express');
const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');
const { sign } = require('../utils/jwt');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName, accountType, fineractClientId = null, primaryAccountId = null } = req.body || {};
    if (!email || !password || !fullName || !accountType) return res.status(400).json({ error: 'Missing fields' });
    if (!['personal', 'business'].includes(accountType)) return res.status(400).json({ error: 'Invalid accountType' });
    const pool = await getPool(accountType);
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, accountType, fineractClientId, primaryAccountId) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hash, fullName, accountType, fineractClientId, primaryAccountId]
    );
    const userId = result.insertId;
    const token = sign({ userId, email, fullName, accountType, fineractClientId, primaryAccountId });
    res.json({ token, user: { userId, email, fullName, accountType, fineractClientId, primaryAccountId } });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, accountType } = req.body || {};
    if (!email || !password || !accountType) return res.status(400).json({ error: 'Missing credentials' });
    if (!['personal', 'business'].includes(accountType)) return res.status(400).json({ error: 'Invalid accountType' });
    const pool = await getPool(accountType);
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = sign({ userId: user.id, email: user.email, fullName: user.full_name, accountType: user.accountType, fineractClientId: user.fineractClientId, primaryAccountId: user.primaryAccountId });
    res.json({ token, user: { userId: user.id, email: user.email, fullName: user.full_name, accountType: user.accountType, fineractClientId: user.fineractClientId, primaryAccountId: user.primaryAccountId } });
  } catch (e) { next(e); }
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
