const { verify } = require('../utils/jwt');
const { getPool } = require('../config/db');

function parseCookieToken(cookieHeader) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((item) => item.trim());
  const authPart = parts.find((item) => item.startsWith('auth_token='));
  if (!authPart) return null;
  return decodeURIComponent(authPart.slice('auth_token='.length));
}

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const bearerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
    const cookieToken = parseCookieToken(req.headers.cookie);
    const token = bearerToken || cookieToken;

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = verify(token);
    req.user = payload;
    req.db = await getPool(payload.accountType);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
