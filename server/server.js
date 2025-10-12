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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`API server listening on :${PORT}`);
});
