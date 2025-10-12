const { Server } = require('socket.io');

let io;

function init(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    socket.on('authenticate', (payload) => {
      try {
        const { token, userId } = payload || {};
        // Token verification is expected to happen on API calls; here we only segment rooms by userId
        if (userId) socket.join(`user:${userId}`);
      } catch (_) {}
    });
  });
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { init, getIO };
