const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const { formatCurrency, fromSubunits } = require('../utils/currency');

/**
 * Get account balance and status for authenticated user
 */
const getBalance = async (userId) => {
  const account = await Account.findOne({ userId });
  if (!account) {
    throw new AppError('Wallet account not found.', 404);
  }

  return {
    accountId: account._id,
    balanceInSubunits: account.balance,
    balanceMajor: fromSubunits(account.balance),
    formattedBalance: formatCurrency(account.balance, account.currency),
    currency: account.currency,
    status: account.status,
    lastUpdated: account.updatedAt,
  };
};

/**
 * Search users by username, email, or phone number (excluding self)
 */
const searchUsers = async (query, currentUserId) => {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const cleanQuery = query.trim();
  const searchRegex = new RegExp(cleanQuery, 'i');

  const users = await User.find({
    _id: { $ne: currentUserId },
    $or: [
      { username: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { fullName: searchRegex },
    ],
  })
    .select('fullName username email phone')
    .limit(10)
    .lean();

  return users.map((u) => ({
    id: u._id,
    fullName: u.fullName,
    username: u.username,
    email: u.email,
    phone: u.phone,
  }));
};

/**
 * Get Paginated Passbook & Transaction History with advanced filtering
 */
const getTransactionHistory = async (userId, { page = 1, limit = 10, type = 'ALL', status = 'ALL', search = '' }) => {
  const skip = (page - 1) * limit;

  // Base filter: user must be either sender or receiver
  const filter = {
    $or: [{ senderId: userId }, { receiverId: userId }],
  };

  // Filter by transaction direction
  if (type === 'SENT') {
    filter.$or = [{ senderId: userId }];
  } else if (type === 'RECEIVED') {
    filter.$or = [{ receiverId: userId }];
  }

  // Filter by status
  if (status && status !== 'ALL') {
    filter.status = status;
  }

  // Search by referenceId or notes
  if (search && search.trim()) {
    filter.$and = [
      {
        $or: [
          { referenceId: new RegExp(search.trim(), 'i') },
          { notes: new RegExp(search.trim(), 'i') },
        ],
      },
    ];
  }

  const [transactions, totalCount] = await Promise.all([
    Transaction.find(filter)
      .populate('senderId', 'fullName username email phone')
      .populate('receiverId', 'fullName username email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  const formattedTransactions = transactions.map((t) => {
    const isSender = t.senderId?._id?.toString() === userId.toString();
    const isInitial = t.type === 'INITIAL_CREDIT';

    return {
      id: t._id,
      referenceId: t.referenceId,
      amount: t.amount,
      amountMajor: fromSubunits(t.amount),
      amountFormatted: formatCurrency(t.amount, t.currency),
      currency: t.currency,
      status: t.status,
      type: t.type,
      direction: isInitial ? 'CREDIT' : isSender ? 'DEBIT' : 'CREDIT',
      notes: t.notes,
      counterparty: isSender ? t.receiverId : t.senderId,
      sender: t.senderId,
      receiver: t.receiverId,
      balanceAfter: isSender ? t.senderBalanceAfter : t.receiverBalanceAfter,
      balanceAfterFormatted: (isSender ? t.senderBalanceAfter : t.receiverBalanceAfter) != null
        ? formatCurrency(isSender ? t.senderBalanceAfter : t.receiverBalanceAfter, t.currency)
        : null,
      failureReason: t.failureReason,
      createdAt: t.createdAt,
    };
  });

  return {
    transactions: formattedTransactions,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      currentPage: page,
      limit,
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get single transaction details by reference ID or Mongo ID
 */
const getTransactionDetails = async (identifier, userId) => {
  const query = identifier.startsWith('TXN-') || identifier.startsWith('INIT-')
    ? { referenceId: identifier }
    : { _id: identifier };

  const transaction = await Transaction.findOne(query)
    .populate('senderId', 'fullName username email phone')
    .populate('receiverId', 'fullName username email phone')
    .lean();

  if (!transaction) {
    throw new AppError('Transaction not found.', 404);
  }

  // Security: Ensure requester is either sender or receiver
  const isSender = transaction.senderId?._id?.toString() === userId.toString();
  const isReceiver = transaction.receiverId?._id?.toString() === userId.toString();

  if (!isSender && !isReceiver) {
    throw new AppError('Unauthorized to view this transaction.', 403);
  }

  return {
    ...transaction,
    amountMajor: fromSubunits(transaction.amount),
    amountFormatted: formatCurrency(transaction.amount, transaction.currency),
    direction: isSender ? 'DEBIT' : 'CREDIT',
    counterparty: isSender ? transaction.receiverId : transaction.senderId,
  };
};

module.exports = {
  getBalance,
  searchUsers,
  getTransactionHistory,
  getTransactionDetails,
};

