const express = require('express');
const auth = require('../middleware/auth');
const { getIO } = require('../config/websocket');

const router = express.Router();

router.post('/', auth, async (req, res, next) => {
  try {
    const { amount, currency = 'USD', receiverEmail, receiverAccountType, description = 'Transfer' } = req.body || {};
    if (!amount || !receiverEmail || !receiverAccountType) return res.status(400).json({ error: 'Missing fields' });
    if (!['personal','business'].includes(receiverAccountType)) return res.status(400).json({ error: 'Invalid receiverAccountType' });

    const senderId = req.user.userId;
    const senderPool = req.db;

    // Lookup receiver in their respective database
    const { getPool } = require('../config/db');
    const receiverPool = await getPool(receiverAccountType);
    const [rrows] = await receiverPool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [receiverEmail]);
    const receiver = rrows[0];
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    // Record sender transaction (debit, Posted)
    const [senderTxRes] = await senderPool.query(
      'INSERT INTO transactions (userId, counterpartyUserId, amount, currency, status, direction, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [senderId, receiver.id, amount, currency, 'Posted', 'debit', description]
    );

    // Record receiver transaction (credit, Pending)
    const [receiverTxRes] = await receiverPool.query(
      'INSERT INTO transactions (userId, counterpartyUserId, amount, currency, status, direction, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [receiver.id, senderId, amount, currency, 'Pending', 'credit', description]
    );

    // Notify both parties
    const [senderNotif] = await senderPool.query(
      'INSERT INTO notifications (userId, type, message) VALUES (?, ?, ?)',
      [senderId, 'transfer', `Sent ${currency} ${Number(amount).toFixed(2)} to ${receiverEmail}`]
    );
    const [receiverNotif] = await receiverPool.query(
      'INSERT INTO notifications (userId, type, message) VALUES (?, ?, ?)',
      [receiver.id, 'transfer', `Incoming ${currency} ${Number(amount).toFixed(2)} from ${req.user.email}`]
    );

    const io = getIO();
    io.to(`user:${senderId}`).emit('notification', { id: senderNotif.insertId, type: 'transfer' });
    io.to(`user:${receiver.id}`).emit('notification', { id: receiverNotif.insertId, type: 'transfer' });

    // Simulate pending -> completed after 10s for receiver
    setTimeout(async () => {
      try {
        await receiverPool.query('UPDATE transactions SET status = ? WHERE id = ?', ['Completed', receiverTxRes.insertId]);
        io.to(`user:${receiver.id}`).emit('transaction_update', { id: receiverTxRes.insertId, status: 'Completed' });
      } catch (_) {}
    }, 10_000);

    res.json({
      senderTransactionId: senderTxRes.insertId,
      receiverTransactionId: receiverTxRes.insertId,
      status: 'Posted'
    });
  } catch (e) { next(e); }
});

module.exports = router;
