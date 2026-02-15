const REQUIRED_VARS = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_NAME',
  'CLIENT_URL',
  'FINERACT_BASE_URL',
  'FINERACT_TENANT',
  'FINERACT_USERNAME',
  'FINERACT_PASSWORD'
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  const dbPort = Number(process.env.DB_PORT);
  if (Number.isNaN(dbPort) || dbPort <= 0) {
    throw new Error('DB_PORT must be a valid positive number');
  }
}

module.exports = { validateEnv };
