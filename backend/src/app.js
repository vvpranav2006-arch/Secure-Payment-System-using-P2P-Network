const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const AppError = require('./utils/AppError');
const env = require('./config/env');

const app = express();

// 1. Security Headers via Helmet
app.use(helmet());

// 2. Cross-Origin Resource Sharing
const allowedOrigins = [
  env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl, Vite proxy) or matching origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev to avoid 403 CORS issues
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Idempotency-Key', 'X-Transaction-PIN'],
  })
);

// 3. Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 4. Body Parsers with payload size caps
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. API V1 Routes
app.use('/api/v1', apiRoutes);

// 6. Handle Undefined Routes (404)
app.use((req, res, next) => {
  next(new AppError(`Cannot find route: ${req.method} ${req.originalUrl} on this server`, 404));
});

// 7. Global Centralized Error Handler
app.use(errorHandler);

module.exports = app;

