const authService = require('../services/auth.service');
const accountService = require('../services/account.service');
const { sendSuccess } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, 201, 'User registered successfully and wallet initialized', result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    return sendSuccess(res, 200, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const balanceData = await accountService.getBalance(req.user._id);
    const userProfile = {
      id: req.user._id,
      fullName: req.user.fullName,
      username: req.user.username,
      email: req.user.email,
      phone: req.user.phone,
      isPinSet: req.user.isPinSet,
      createdAt: req.user.createdAt,
      account: balanceData,
    };
    return sendSuccess(res, 200, 'User profile retrieved successfully', userProfile);
  } catch (error) {
    next(error);
  }
};

const setPin = async (req, res, next) => {
  try {
    const { pin, password } = req.body;
    const result = await authService.setTransactionPin(req.user._id, pin, password);
    return sendSuccess(res, 200, result.message, { isPinSet: result.isPinSet });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  setPin,
};

