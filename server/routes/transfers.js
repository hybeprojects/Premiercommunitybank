const crypto = require('crypto');
const express = require('express');
const auth = require('../middleware/auth');
const { getIO } = require('../config/websocket');
const { getPool } = require('../config/db');

const router = express.Router();

async function computeBalance(pool, userId) {
  const [rows] = await pool.query('SELECT amount, direction FROM transactions WHERE userId = ?', [userId]);
  return (rows || []).reduce((balance, row) => {
    const amount = Number(row.amount || 0);
    return row.direction === 'credit' ? balance + amount : balance - amount;
  }, 0);
}

function normalizeIdempotencyKey(value) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return crypto.randomUUID();
}

router.post('/', auth, async (req, res, next) => {
  try {
    const { amount: rawAmount, currency = 'USD', receiverEmail, receiverAccountType, description = 'Transfer' } = req.body || {};
    const idempotencyKey = normalizeIdempotencyKey(req.headers['x-idempotency-key']);
    const amount = Number(rawAmount || 0);

    if (!amount || !receiverEmail || !receiverAccountType) {
      return res.status(400).json({ error: { code: 'MISSING_FIELDS', details: 'amount, receiverEmail and receiverAccountType required' } });
    }

    if (!['personal', 'business'].includes(receiverAccountType)) {
      return res.status(400).json({ error: { code: 'INVALID_RECEIVER_TYPE', details: 'receiverAccountType must be personal or business' } });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: { code: 'INVALID_AMOUNT', details: 'amount must be > 0' } });
    }

    const senderId = req.user.userId;
    const senderPool = req.db;
    const senderAccountType = req.user.accountType;

    const receiverPool = await getPool(receiverAccountType);
    const [receiverRows] = await receiverPool.query('SELECT id, email FROM users WHERE email = ? LIMIT 1', [String(receiverEmail).trim().toLowerCase()]);
    const receiver = receiverRows && receiverRows[0];
    if (!receiver) return res.status(404).json({ error: { code: 'RECEIVER_NOT_FOUND', details: 'Receiver not found' } });

    const [existingRows] = await senderPool.query('SELECT * FROM transfer_requests WHERE idempotencyKey = ? LIMIT 1', [idempotencyKey]);
    const existingTransfer = existingRows[0];
    if (existingTransfer && existingTransfer.status === 'Completed') {
      return res.json({
        senderTransactionId: existingTransfer.senderTransactionId,
        receiverTransactionId: existingTransfer.receiverTransactionId,
        status: existingTransfer.status,
        idempotencyKey
      });
    }

    const senderBalance = await computeBalance(senderPool, senderId);
    if (senderBalance < amount) {
      return res.status(400).json({ error: { code: 'INSUFFICIENT_FUNDS', details: `Balance ${senderBalance.toFixed(2)} is less than transfer amount ${amount.toFixed(2)}` } });
    }

    if (!existingTransfer) {
      await senderPool.query(
        `INSERT INTO transfer_requests
          (idempotencyKey, senderUserId, senderAccountType, receiverUserId, receiverAccountType, amount, currency, description, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Processing')`,
        [idempotencyKey, senderId, senderAccountType, receiver.id, receiverAccountType, amount, currency, description]
      );
    }

    const [senderTxRes] = await senderPool.query(
      'INSERT INTO transactions (userId, counterpartyUserId, amount, currency, status, direction, description, transferReference) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [senderId, receiver.id, amount, currency, 'Posted', 'debit', description, idempotencyKey]
    );

    try {
      const [receiverTxRes] = await receiverPool.query(
        'INSERT INTO transactions (userId, counterpartyUserId, amount, currency, status, direction, description, transferReference) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [receiver.id, senderId, amount, currency, 'Completed', 'credit', description, idempotencyKey]
      );

      await senderPool.query(
        `UPDATE transfer_requests
         SET status = 'Completed', senderTransactionId = ?, receiverTransactionId = ?, updated_at = CURRENT_TIMESTAMP
         WHERE idempotencyKey = ?`,
        [senderTxRes.insertId, receiverTxRes.insertId, idempotencyKey]
      );

      const [senderNotif] = await senderPool.query(
        'INSERT INTO notifications (userId, type, message) VALUES (?, ?, ?)',
        [senderId, 'transfer', `Sent ${currency} ${amount.toFixed(2)} to ${receiverEmail}`]
      );
      const [receiverNotif] = await receiverPool.query(
        'INSERT INTO notifications (userId, type, message) VALUES (?, ?, ?)',
        [receiver.id, 'transfer', `Incoming ${currency} ${amount.toFixed(2)} from ${req.user.email}`]
      );

      const io = getIO();
      io.to(`user:${senderId}`).emit('notification', { id: senderNotif.insertId, type: 'transfer' });
      io.to(`user:${receiver.id}`).emit('notification', { id: receiverNotif.insertId, type: 'transfer' });
      io.to(`user:${senderId}`).emit('transaction_created', { id: senderTxRes.insertId, status: 'Posted' });
      io.to(`user:${receiver.id}`).emit('transaction_created', { id: receiverTxRes.insertId, status: 'Completed' });

      const [senderBalanceNow, receiverBalanceNow] = await Promise.all([
        computeBalance(senderPool, senderId),
        computeBalance(receiverPool, receiver.id)
      ]);
      io.to(`user:${senderId}`).emit('balance_update', { balance: senderBalanceNow });
      io.to(`user:${receiver.id}`).emit('balance_update', { balance: receiverBalanceNow });

      return res.json({
        senderTransactionId: senderTxRes.insertId,
        receiverTransactionId: receiverTxRes.insertId,
        status: 'Completed',
        idempotencyKey
      });
    } catch (error) {
      await senderPool.query('UPDATE transactions SET status = ? WHERE id = ?', ['Failed', senderTxRes.insertId]);
      await senderPool.query(
        `UPDATE transfer_requests
         SET status = 'Failed', senderTransactionId = ?, errorCode = 'RECEIVER_INSERT_FAILED', errorDetails = ?, updated_at = CURRENT_TIMESTAMP
         WHERE idempotencyKey = ?`,
        [senderTxRes.insertId, error.message || 'Failed to record receiver transaction', idempotencyKey]
      );
      return res.status(502).json({ error: { code: 'RECEIVER_INSERT_FAILED', details: 'Failed to record receiver transaction; sender transaction marked failed' } });
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
