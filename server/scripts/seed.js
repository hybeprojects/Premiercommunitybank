const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');

async function ensureUser(pool, { email, password, fullName, accountType }) {
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (rows && rows[0]) return rows[0];
  const hash = await bcrypt.hash(password, 10);
  const [res] = await pool.query('INSERT INTO users (email, password_hash, full_name, accountType) VALUES (?, ?, ?, ?)', [email, hash, fullName, accountType]);
  return { id: res.insertId, email };
}

async function seed() {
  try {
    // personal users
    const personalPool = await getPool('personal');
    const p1 = await ensureUser(personalPool, { email: 'personal1@example.com', password: 'Password123!', fullName: 'Personal One', accountType: 'personal' });
    const p2 = await ensureUser(personalPool, { email: 'personal2@example.com', password: 'Password123!', fullName: 'Personal Two', accountType: 'personal' });

    // business user
    const businessPool = await getPool('business');
    const b1 = await ensureUser(businessPool, { email: 'business@example.com', password: 'Password123!', fullName: 'Business Corp', accountType: 'business' });

    // seed a big balance for business
    await businessPool.query('INSERT INTO transactions (userId, amount, currency, status, direction, description) VALUES (?, ?, ?, ?, ?, ?)', [b1.id, 500000, 'USD', 'Completed', 'credit', 'Seed balance']);

    console.log('Seeding complete:', { personal: [p1.email, p2.email], business: b1.email });
    process.exit(0);
  } catch (e) {
    console.error('Seeding failed', e);
    process.exit(1);
  }
}

seed();
