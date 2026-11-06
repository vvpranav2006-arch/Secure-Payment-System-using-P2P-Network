const crypto = require('crypto');
const IdempotencyRecord = require('../models/IdempotencyRecord');
const AppError = require('../utils/AppError');

/**
 * Enterprise Idempotency Middleware for Financial Transactions
 * Guarantees that duplicate requests with the same Idempotency-Key are safely deduplicated.
 */
const idempotency = async (req, res, next) => {
  const key = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

  if (!key) {
    return next(new AppError('Idempotency-Key header is required for payment transactions to prevent double-spending.', 400));
  }

  // Calculate request payload hash to prevent key reuse with different parameters
  const payloadToHash = JSON.stringify({
    body: req.body,
    userId: req.user?._id?.toString(),
    path: req.originalUrl,
  });
  const requestHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');

  try {
    const existingRecord = await IdempotencyRecord.findOne({ key, userId: req.user._id });

    if (existingRecord) {
      // 1. Mismatched payload: Same key used for different transfer details
      if (existingRecord.requestHash !== requestHash) {
        return next(
          new AppError('Idempotency-Key was already used for a different request payload. Use a new unique key.', 422)
        );
      }

      // 2. Request is currently in flight
      if (existingRecord.status === 'IN_PROGRESS') {
        return res.status(409).json({
          success: false,
          message: 'A transfer request with this Idempotency-Key is currently being processed. Please do not retry immediately.',
        });
      }

      // 3. Resolved transaction: Return cached response directly
      if (existingRecord.status === 'RESOLVED') {
        res.setHeader('X-Idempotency-Replay', 'true');
        return res.status(existingRecord.responseCode).json(existingRecord.responseBody);
      }
    }

    // Create IN_PROGRESS idempotency entry with 24-hour TTL
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const newRecord = await IdempotencyRecord.create({
      key,
      userId: req.user._id,
      endpoint: req.originalUrl,
      requestHash,
      status: 'IN_PROGRESS',
      expiresAt,
    });

    // Intercept res.json to capture response and update idempotency status
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      const statusCode = res.statusCode || 200;

      // Update asynchronously to avoid blocking client response
      IdempotencyRecord.findByIdAndUpdate(newRecord._id, {
        status: statusCode >= 200 && statusCode < 400 ? 'RESOLVED' : 'REJECTED',
        responseCode: statusCode,
        responseBody: body,
      }).catch((err) => {
        console.error('[Idempotency] Failed to resolve idempotency record:', err);
      });

      return originalJson(body);
    };

    req.idempotencyKey = key;
    next();
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key collision
      return res.status(409).json({
        success: false,
        message: 'Concurrent transfer with this Idempotency-Key is already running.',
      });
    }
    next(error);
  }
};

module.exports = idempotency;

