const accountService = require('../services/account.service');
const transferService = require('../services/transfer.service');
const { sendSuccess } = require('../utils/response');

const getBalance = async (req, res, next) => {
  try {
    const data = await accountService.getBalance(req.user._id);
    return sendSuccess(res, 200, 'Account balance retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    const users = await accountService.searchUsers(query, req.user._id);
    return sendSuccess(res, 200, 'Users searched successfully', users);
  } catch (error) {
    next(error);
  }
};

const transferMoney = async (req, res, next) => {
  try {
    const { recipientIdentifier, amount, notes } = req.body;
    const idempotencyKey = req.idempotencyKey;

    const result = await transferService.executeTransfer({
      senderUserId: req.user._id,
      recipientIdentifier,
      amountInMajorUnit: amount,
      notes,
      idempotencyKey,
    });

    return sendSuccess(res, 200, 'Transfer completed successfully', result);
  } catch (error) {
    next(error);
  }
};

const getTransactionHistory = async (req, res, next) => {
  try {
    const { page, limit, type, status, search } = req.query;
    const result = await accountService.getTransactionHistory(req.user._id, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      type,
      status,
      search,
    });

    return sendSuccess(
      res,
      200,
      'Transaction history retrieved successfully',
      result.transactions,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await accountService.getTransactionDetails(id, req.user._id);
    return sendSuccess(res, 200, 'Transaction details retrieved successfully', transaction);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBalance,
  searchUsers,
  transferMoney,
  getTransactionHistory,
  getTransactionById,
};

