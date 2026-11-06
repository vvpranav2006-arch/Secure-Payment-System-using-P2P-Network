const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const { registerSchema, loginSchema, setPinSchema } = require('../validators/auth.validator');

// Public Auth Endpoints (Protected by Brute-Force Rate Limiter)
router.post('/register', authLimiter, validate(registerSchema, 'body'), authController.register);
router.post('/login', authLimiter, validate(loginSchema, 'body'), authController.login);

// Protected Auth Endpoints
router.get('/me', authenticate, authController.getMe);
router.post('/pin', authenticate, validate(setPinSchema, 'body'), authController.setPin);

module.exports = router;

