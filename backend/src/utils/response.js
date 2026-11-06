/**
 * Standard API Response Formatter
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const payload = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
  };
  return res.status(statusCode).json(payload);
};

const sendError = (res, statusCode = 500, message = 'Internal Server Error', details = null) => {
  const payload = {
    success: false,
    message,
    ...(details !== null && { details }),
  };
  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError,
};

