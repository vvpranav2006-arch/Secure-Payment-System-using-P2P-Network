const AppError = require('../utils/AppError');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error in non-test environment
  if (env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  // 1. Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = new AppError(message, 404);
  }

  // 2. Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `A record with that ${duplicateField} already exists.`;
    error = new AppError(message, 409);
  }

  // 3. Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    error = new AppError('Database Validation Failed', 400, details);
  }

  // 4. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Authentication token has expired', 401);
  }

  // Final Response Payload
  const response = {
    success: false,
    message: error.message || 'Internal Server Error',
    ...(error.details && { details: error.details }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  return res.status(error.statusCode || 500).json(response);
};

module.exports = errorHandler;

