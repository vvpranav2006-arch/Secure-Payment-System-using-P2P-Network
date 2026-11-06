const rateLimit = require('express-rate-limit');

/**
 * General API Rate Limiter
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

/**
 * Sensitive Auth Rate Limiter (Brute-force protection for login/register)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * Transfer Rate Limiter (To prevent automated micro-transaction spam)
 */
const transferLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15, // Max 15 transfers per minute per IP/client
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Transfer rate limit exceeded. Please wait a minute before making another transfer.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  transferLimiter,
};

