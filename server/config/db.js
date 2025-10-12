const mysql = require('mysql2/promise');

const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
};

function resolveDbNameForType(accountType) {
  const personal = process.env.DB_NAME_PERSONAL || process.env.DB_NAME;
  const business = process.env.DB_NAME_BUSINESS || process.env.DB_NAME;
  if (accountType === 'personal') return personal;
  if (accountType === 'business') return business;
  return process.env.DB_NAME;
}

// In-memory fallback stores per dbName
const inMemoryStores = {};
let useInMemoryByDefault = false;

function createInMemoryStore(dbName) {
  if (!inMemoryStores[dbName]) {
    inMemoryStores[dbName] = {
      users: [],
      transactions: [],
      notifications: [],
      nextIds: { users: 1, transactions: 1, notifications: 1 }
    };
  }
  const store = inMemoryStores[dbName];

  async function query(sql, params) {
    sql = String(sql || '').trim();
    params = Array.isArray(params) ? params : [];

    // Users SELECT by email
    if (/SELECT\s+id\s+FROM\s+users/i.test(sql) || /SELECT\s+\*\s+FROM\s+users/i.test(sql)) {
      const email = params[0];
      const rows = store.users.filter(u => u.email === email);
      return [rows];
    }

    if (/SELECT\s+\*\s+FROM\s+users\s+WHERE\s+email\s*=\s*\?/i.test(sql)) {
      const email = params[0];
      const rows = store.users.filter(u => u.email === email).map(u => ({
        id: u.id,
        email: u.email,
        password_hash: u.password_hash,
        full_name: u.full_name,
        accountType: u.accountType,
        fineractClientId: u.fineractClientId,
        primaryAccountId: u.primaryAccountId
      }));
      return [rows];
    }

    // INSERT INTO users
    if (/INSERT\s+INTO\s+users/i.test(sql)) {
      const [email, hash, fullName, accountType, fineractClientId, primaryAccountId] = params;
      const id = store.nextIds.users++;
      store.users.push({ id, email, password_hash: hash, full_name: fullName, accountType, fineractClientId, primaryAccountId });
      return [{ insertId: id }];
    }

    // Transactions INSERT
    if (/INSERT\s+INTO\s+transactions/i.test(sql)) {
      const [userId, counterpartyUserId, amount, currency, status, direction, description] = params;
      const id = store.nextIds.transactions++;
      store.transactions.push({ id, userId: Number(userId), counterpartyUserId: counterpartyUserId ? Number(counterpartyUserId) : null, amount: Number(amount), currency, status, direction, description, created_at: new Date(), updated_at: new Date() });
      return [{ insertId: id }];
    }

    // Select transactions by userId
    if (/SELECT\s+\*\s+FROM\s+transactions\s+WHERE\s+userId\s*=\s*\?/i.test(sql)) {
      const userId = Number(params[0]);
      const rows = store.transactions.filter(t => t.userId === userId).sort((a,b)=>b.id-a.id);
      return [rows];
    }

    // UPDATE transactions SET status = ? WHERE id = ?
    if (/UPDATE\s+transactions\s+SET\s+status\s*=\s*\?/i.test(sql)) {
      const [status, id] = params;
      const tx = store.transactions.find(t => t.id === Number(id));
      if (tx) { tx.status = status; tx.updated_at = new Date(); return [{ affectedRows: 1 }]; }
      return [{ affectedRows: 0 }];
    }

    // INSERT INTO notifications
    if (/INSERT\s+INTO\s+notifications/i.test(sql)) {
      const [userId, type, message] = params;
      const id = store.nextIds.notifications++;
      store.notifications.push({ id, userId: Number(userId), type, message, is_read: 0, created_at: new Date() });
      return [{ insertId: id }];
    }

    // SELECT notifications
    if (/SELECT\s+\*\s+FROM\s+notifications/i.test(sql)) {
      const userId = Number(params[0]);
      const rows = store.notifications.filter(n => n.userId === userId).sort((a,b)=>b.id-a.id);
      return [rows];
    }

    // UPDATE notifications SET is_read = 1 WHERE userId = ? AND id IN (...)
    if (/UPDATE\s+notifications\s+SET\s+is_read\s*=\s*1/i.test(sql)) {
      const userId = Number(params[0]);
      const ids = params.slice(1).map(Number);
      let changed = 0;
      store.notifications.forEach(n => { if (n.userId === userId && ids.includes(n.id)) { n.is_read = 1; changed++; } });
      return [{ affectedRows: changed }];
    }

    // Default no-op
    return [[]];
  }

  return { query };
}

async function createPool(dbName) {
  if (!dbName) throw new Error('DB_NAME is required');
  try {
    const pool = mysql.createPool({ ...baseConfig, database: dbName });
    await ensureTables(pool);
    return pool;
  } catch (e) {
    console.error('MySQL not available, using in-memory fallback for', dbName, e.message || e);
    useInMemoryByDefault = true;
    return createInMemoryStore(dbName);
  }
}

async function ensureTables(pool) {
  // If pool has getConnection, assume it's mysql pool
  if (typeof pool.getConnection === 'function') {
    const conn = await pool.getConnection();
    try {
      await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(191) NOT NULL UNIQUE,
      password_hash VARCHAR(191) NOT NULL,
      full_name VARCHAR(191) NOT NULL,
      accountType ENUM('personal','business') NOT NULL,
      fineractClientId VARCHAR(64) NULL,
      primaryAccountId VARCHAR(64) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);

      await conn.query(`CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      counterpartyUserId INT NULL,
      amount DECIMAL(14,2) NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'USD',
      status ENUM('Posted','Pending','Completed','Failed') NOT NULL,
      direction ENUM('debit','credit') NOT NULL,
      description VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX (userId),
      INDEX (counterpartyUserId)
    ) ENGINE=InnoDB`);

      await conn.query(`CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      message VARCHAR(255) NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (userId),
      INDEX (is_read)
    ) ENGINE=InnoDB`);
    } finally {
      conn.release();
    }
  }
}

const pools = {};

async function getPool(accountType) {
  const dbName = resolveDbNameForType(accountType);
  if (!pools[dbName]) {
    pools[dbName] = await createPool(dbName);
  }
  return pools[dbName];
}

async function testConnection() {
  const mysql2 = require('mysql2/promise');
  const cfg = { ...baseConfig, database: process.env.DB_NAME };
  try {
    const conn = await mysql2.createConnection(cfg);
    await conn.ping();
    await conn.end();
    return true;
  } catch (e) {
    useInMemoryByDefault = true;
    throw new Error(`DB connection failed: ${e.message}`);
  }
}

module.exports = { getPool, testConnection };
