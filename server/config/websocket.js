const { Server } = require('socket.io');

const { Server } = require('socket.io');
const { getPool } = require('./db');
let io;

async function computeBalanceForUser(accountType, userId) {
  try {
    const pool = await getPool(accountType);
    const [rows] = await pool.query('SELECT amount, direction FROM transactions WHERE userId = ?', [userId]);
    let bal = 0;
    for (const r of (rows || [])) {
      const amt = Number(r.amount || 0);
      if (r.direction === 'credit') bal += amt;
      else bal -= amt;
    }
    return bal;
  } catch (e) {
    return 0;
  }
}

function init(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    socket.on('authenticate', async (payload) => {
      try {
        const { token, userId, accountType } = payload || {};
        if (userId) {
          socket.join(`user:${userId}`);
          // compute and send initial balance for this user
          if (accountType) {
            const bal = await computeBalanceForUser(accountType, userId);
            try { socket.emit('balance_update', { balance: bal }); } catch (_) {}
          }
        }
      } catch (err) {
        // ignore
      }
    });
  });
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { init, getIO };
