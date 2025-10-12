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

async function createPool(dbName) {
  if (!dbName) throw new Error('DB_NAME is required');
  const pool = mysql.createPool({ ...baseConfig, database: dbName });
  await ensureTables(pool);
  return pool;
}

async function ensureTables(pool) {
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

const pools = {};

async function getPool(accountType) {
  const dbName = resolveDbNameForType(accountType);
  if (!pools[dbName]) {
    pools[dbName] = await createPool(dbName);
  }
  return pools[dbName];
}

async function testConnection() {
  const mysql = require('mysql2/promise');
  const cfg = { ...baseConfig, database: process.env.DB_NAME };
  try {
    const conn = await mysql.createConnection(cfg);
    await conn.ping();
    await conn.end();
    return true;
  } catch (e) {
    throw new Error(`DB connection failed: ${e.message}`);
  }
}

module.exports = { getPool, testConnection };
