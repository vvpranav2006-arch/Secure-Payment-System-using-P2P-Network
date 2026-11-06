const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const accountRoutes = require('./account.routes');

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'paypulse-p2p-wallet-api',
  });
});

// Route Mounts
router.use('/auth', authRoutes);
router.use('/account', accountRoutes);

module.exports = router;

