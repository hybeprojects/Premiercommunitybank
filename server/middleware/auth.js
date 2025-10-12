const { verify } = require('../utils/jwt');
const { getPool } = require('../config/db');

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verify(token);
    req.user = payload;
    req.db = await getPool(payload.accountType);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
