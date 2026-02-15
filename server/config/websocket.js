const { Server: IoServer } = require('socket.io');
const { verify } = require('../utils/jwt');
const { getPool } = require('./db');

let io;

async function computeBalanceForUser(accountType, userId) {
  const pool = await getPool(accountType);
  const [rows] = await pool.query('SELECT amount, direction FROM transactions WHERE userId = ?', [userId]);
  return (rows || []).reduce((balance, row) => {
    const amount = Number(row.amount || 0);
    return row.direction === 'credit' ? balance + amount : balance - amount;
  }, 0);
}

function getToken(socket) {
  const authHeader = socket.handshake.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  if (socket.handshake.auth && socket.handshake.auth.token) return socket.handshake.auth.token;
  return null;
}

function init(server) {
  io = new IoServer(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  io.use((socket, next) => {
    try {
      const token = getToken(socket);
      if (!token) return next(new Error('Authentication required'));
      const payload = verify(token);
      socket.data.user = payload;
      return next();
    } catch (error) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const { userId, accountType } = socket.data.user;
    socket.join(`user:${userId}`);

    try {
      const balance = await computeBalanceForUser(accountType, userId);
      socket.emit('balance_update', { balance });
    } catch (_) {}
  });
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { init, getIO };
