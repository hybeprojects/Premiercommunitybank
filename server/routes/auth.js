const express = require('express');
const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');
const { sign } = require('../utils/jwt');
const auth = require('../middleware/auth');

const router = express.Router();

function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  };
}

router.post('/register', async (req, res, next) => {
  try {
    let { email, password, fullName, accountType, fineractClientId = null, primaryAccountId = null } = req.body || {};
    email = typeof email === 'string' ? email.trim().toLowerCase() : email;
    fullName = typeof fullName === 'string' ? fullName.trim() : fullName;

    if (!email || !password || !fullName || !accountType) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', details: 'email, password, fullName and accountType are required' } });
    }
    if (!['personal', 'business'].includes(accountType)) {
      return res.status(400).json({ error: { code: 'INVALID_ACCOUNT_TYPE', details: 'accountType must be personal or business' } });
    }

    const pool = await getPool(accountType);
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) return res.status(409).json({ error: { code: 'EMAIL_EXISTS', details: 'Email already registered' } });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, accountType, fineractClientId, primaryAccountId) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hash, fullName, accountType, fineractClientId, primaryAccountId]
    );

    const userId = result.insertId;
    const token = sign({ userId, email, fullName, accountType, fineractClientId, primaryAccountId });
    res.cookie('auth_token', token, authCookieOptions());
    res.json({ user: { userId, email, fullName, accountType, fineractClientId, primaryAccountId } });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    let { email, password, accountType } = req.body || {};
    email = typeof email === 'string' ? email.trim().toLowerCase() : email;

    if (!email || !password || !accountType) {
      return res.status(400).json({ error: { code: 'MISSING_CREDENTIALS', details: 'email, password and accountType are required' } });
    }

    if (!['personal', 'business'].includes(accountType)) {
      return res.status(400).json({ error: { code: 'INVALID_ACCOUNT_TYPE', details: 'accountType must be personal or business' } });
    }

    const pool = await getPool(accountType);
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = rows[0];

    if (!user) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', details: 'Invalid email or password' } });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', details: 'Invalid email or password' } });

    const payload = {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      accountType: user.accountType,
      fineractClientId: user.fineractClientId,
      primaryAccountId: user.primaryAccountId
    };
    const token = sign(payload);
    res.cookie('auth_token', token, authCookieOptions());
    res.json({ user: payload });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', authCookieOptions());
  res.json({ ok: true });
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
