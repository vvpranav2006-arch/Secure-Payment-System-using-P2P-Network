const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5050,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/secure_p2p_wallet',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secure_fintech_jwt_secret_key_change_in_prod_!#$2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  INITIAL_ONBOARDING_BALANCE: parseInt(process.env.INITIAL_ONBOARDING_BALANCE, 10) || 500000, // 500,000 paise = ₹5,000.00
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

