const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Middleware to verify transaction PIN before critical operations (e.g. money transfer)
 */
const verifyTransactionPin = async (req, res, next) => {
  try {
    const pin = req.body.pin || req.headers['x-transaction-pin'];

    if (!pin) {
      return next(new AppError('Transaction PIN is required to authorize this transfer.', 400));
    }

    // Explicitly load the pinHash which is marked select: false
    const user = await User.findById(req.user._id).select('+pinHash');
    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    if (!user.isPinSet || !user.pinHash) {
      return next(
        new AppError('Transaction PIN is not set. Please set your PIN in Security Settings before transferring funds.', 400)
      );
    }

    // Verify PIN against bcrypt hash with automatic failed-attempt counting & lockout
    try {
      await user.verifyPin(pin);
    } catch (pinError) {
      return next(new AppError(pinError.message, 403));
    }

    // Attach updated user state
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = verifyTransactionPin;

