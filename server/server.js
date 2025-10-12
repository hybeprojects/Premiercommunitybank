const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { init: initWebsocket } = require('./config/websocket');
const rateLimit = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const accountsRoutes = require('./routes/accounts');
const transfersRoutes = require('./routes/transfers');
const notificationsRoutes = require('./routes/notifications');
const transactionsRoutes = require('./routes/transactions');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());

// Simple request logger (masking sensitive fields)
app.use((req, res, next) => {
  try {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '***REDACTED***';
    if (safeBody.confirmPassword) safeBody.confirmPassword = '***REDACTED***';
    console.log(`[req] ${req.method} ${req.originalUrl} body=${JSON.stringify(safeBody)}`);
  } catch (e) {
    console.error('Failed to log request', e);
  }
  next();
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'premierbank-server', env: process.env.NODE_ENV || 'development' });
});

// Global lightweight rate limit
app.use('/api/', rateLimit({ windowMs: 60_000, max: 300 }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/transactions', transactionsRoutes);

// Error handler
app.use(errorHandler);

const server = http.createServer(app);
initWebsocket(server);

// Check DB connectivity on startup
const { testConnection } = require('./config/db');
(async () => {
  try {
    await testConnection();
    console.log('DB connection OK');
  } catch (err) {
    console.error('DB connectivity check failed:', err.message || err);
    // do not exit; continue but the app will likely fail for DB ops
  }
})();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`API server listening on :${PORT}`);
});
