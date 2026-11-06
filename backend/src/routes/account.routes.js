const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const authenticate = require('../middlewares/auth.middleware');
const verifyTransactionPin = require('../middlewares/pin.middleware');
const idempotency = require('../middlewares/idempotency.middleware');
const validate = require('../middlewares/validation.middleware');
const { transferLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  transferSchema,
  searchUserSchema,
  historyQuerySchema,
} = require('../validators/account.validator');

// All account routes require authentication
router.use(authenticate);

// Real-time Balance
router.get('/balance', accountController.getBalance);

// Search Users for P2P Transfer (Debounced Autocomplete)
router.get('/users', validate(searchUserSchema, 'query'), accountController.searchUsers);

// Core P2P Money Transfer Route with ACID guarantees, PIN verification & Idempotency Key
router.post(
  '/transfer',
  transferLimiter,
  validate(transferSchema, 'body'),
  verifyTransactionPin,
  idempotency,
  accountController.transferMoney
);

// Passbook and Transaction History with Filters & Pagination
router.get('/transactions', validate(historyQuerySchema, 'query'), accountController.getTransactionHistory);

// Single Transaction / Receipt Details
router.get('/transactions/:id', accountController.getTransactionById);

module.exports = router;

