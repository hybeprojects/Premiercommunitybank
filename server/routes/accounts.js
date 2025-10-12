const express = require('express');
const auth = require('../middleware/auth');
const { getClientAccounts, getClientById } = require('../utils/fineractClient');

const router = express.Router();

router.get('/overview', auth, async (req, res, next) => {
  try {
    const { fineractClientId } = req.user;
    if (!fineractClientId) return res.json({ client: null, accounts: [] });
    const [client, accounts] = await Promise.all([
      getClientById(fineractClientId),
      getClientAccounts(fineractClientId)
    ]);
    res.json({ client, accounts });
  } catch (e) { next(e); }
});

module.exports = router;
