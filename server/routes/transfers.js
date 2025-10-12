const express = require('express');
const auth = require('../middleware/auth');
const { getIO } = require('../config/websocket');
const { getPool } = require('../config/db');

const router = express.Router();

async function computeBalance(pool, userId) {
  // returns number
  // pool.query returns [rows]
  try {
    const [rows] = await pool.query('SELECT amount, direction FROM transactions WHERE userId = ?', [userId]);
    let bal = 0;
    for (const r of rows) {
      const amt = Number(r.amount || 0);
      if (r.direction === 'credit') bal += amt;
      else bal -= amt;
    }
    return bal;
  } catch (e) {
    // if pool is in-memory store where query returns directly (no array)
    if (Array.isArray(pool)) return 0;
    // fallback: try calling pool.query as function that returns array directly
    try {
      const rows = await pool.query('SELECT amount, direction FROM transactions WHERE userId = ?', [userId]);
      const iter = Array.isArray(rows) ? rows[0] || [] : rows;
      let bal = 0;
      for (const r of iter) {
        const amt = Number(r.amount || 0);
        if (r.direction === 'credit') bal += amt;
        else bal -= amt;
      }
      return bal;
    } catch (_) {
      return 0;
    }
  }
}

router.post('/', auth, async (req, res, next) => {
  try {
    const { amount: rawAmount, currency = 'USD', receiverEmail, receiverAccountType, description = 'Transfer' } = req.body || {};
    const amount = Number(rawAmount || 0);
    if (!amount || !receiverEmail || !receiverAccountType) return res.status(400).json({ error: { code: 'MISSING_FIELDS', details: 'amount, receiverEmail and receiverAccountType required' } });
    if (!['personal','business'].includes(receiverAccountType)) return res.status(400).json({ error: { code: 'INVALID_RECEIVER_TYPE', details: 'receiverAccountType must be personal or business' } });
    if (amount <= 0) return res.status(400).json({ error: { code: 'INVALID_AMOUNT', details: 'amount must be > 0' } });

    const senderId = req.user.userId;
    const senderPool = req.db;

    // Lookup receiver in their respective database
    const receiverPool = await getPool(receiverAccountType);
    const [rrows] = await receiverPool.query('SELECT id, email FROM users WHERE email = ? LIMIT 1', [receiverEmail]);
    const receiver = rrows && rrows[0];
    if (!receiver) return res.status(404).json({ error: { code: 'RECEIVER_NOT_FOUND', details: 'Receiver not found' } });

    // Check balance
    const senderBal = await computeBalance(senderPool, senderId);
    if (senderBal < amount) return res.status(400).json({ error: { code: 'INSUFFICIENT_FUNDS', details: `Balance ${senderBal.toFixed(2)} is less than transfer amount ${amount.toFixed(2)}` } });

    // Record sender transaction (debit, Posted)
    const [senderTxRes] = await senderPool.query(
      'INSERT INTO transactions (userId, counterpartyUserId, amount, currency, status, direction, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [senderId, receiver.id, amount, currency, 'Posted', 'debit', description]
    );

    let receiverTxRes;
    try {
      // Record receiver transaction (credit, Pending)
      [receiverTxRes] = await receiverPool.query(
        'INSERT INTO transactions (userId, counterpartyUserId, amount, currency, status, direction, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [receiver.id, senderId, amount, currency, 'Pending', 'credit', description]
      );
    } catch (e) {
      // Compensate: mark sender tx as Failed
      try {
        await senderPool.query('UPDATE transactions SET status = ? WHERE id = ?', ['Failed', senderTxRes.insertId]);
        await senderPool.query('INSERT INTO notifications (userId, type, message) VALUES (?, ?, ?)', [senderId, 'transfer_failed', `Transfer of ${currency} ${amount.toFixed(2)} to ${receiverEmail} failed`]);
      } catch (_) {}
      return res.status(502).json({ error: { code: 'RECEIVER_INSERT_FAILED', details: 'Failed to record receiver transaction; sender transaction rolled back' } });
    }

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

    res.json({ senderTransactionId: senderTxRes.insertId, receiverTransactionId: receiverTxRes.insertId, status: 'Posted' });
  } catch (e) { next(e); }
});

module.exports = router;
