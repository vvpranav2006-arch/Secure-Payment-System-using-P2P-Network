const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const env = require('../config/env');

/**
 * Generate standard JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Register a new user and initialize virtual bank balance
 */
const register = async (userData) => {
  const { fullName, username, email, phone, password, pin } = userData;

  // 1. Check for existing unique fields
  const existingUser = await User.findOne({
    $or: [{ username }, { email }, { phone }],
  });

  if (existingUser) {
    if (existingUser.username === username) throw new AppError('Username is already taken', 409);
    if (existingUser.email === email) throw new AppError('Email is already registered', 409);
    if (existingUser.phone === phone) throw new AppError('Phone number is already registered', 409);
  }

  // 2. Hash password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // 3. Hash transaction PIN if provided
  let pinHash = null;
  let isPinSet = false;
  if (pin) {
    const pinSalt = await bcrypt.genSalt(12);
    pinHash = await bcrypt.hash(pin.toString(), pinSalt);
    isPinSet = true;
  }

  // 4. Create User and initialize virtual Account with default balance
  const session = await mongoose.startSession().catch(() => null);

  let user, account;

  // Use session if replica set is active, otherwise perform sequence safely
  if (session && mongoose.connection.client.topology && mongoose.connection.client.topology.description.type !== 'Single') {
    await session.withTransaction(async () => {
      [user] = await User.create(
        [
          {
            fullName,
            username,
            email,
            phone,
            passwordHash,
            pinHash,
            isPinSet,
          },
        ],
        { session }
      );

      [account] = await Account.create(
        [
          {
            userId: user._id,
            balance: env.INITIAL_ONBOARDING_BALANCE,
            currency: 'INR',
            status: 'ACTIVE',
          },
        ],
        { session }
      );

      // Audit log: Initial onboarding credit
      await Transaction.create(
        [
          {
            referenceId: `INIT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            senderId: user._id,
            receiverId: user._id,
            senderAccountId: account._id,
            receiverAccountId: account._id,
            amount: env.INITIAL_ONBOARDING_BALANCE,
            currency: 'INR',
            status: 'SUCCESS',
            type: 'INITIAL_CREDIT',
            notes: 'Virtual onboarding bank credit bonus',
            senderBalanceBefore: 0,
            senderBalanceAfter: env.INITIAL_ONBOARDING_BALANCE,
            receiverBalanceBefore: 0,
            receiverBalanceAfter: env.INITIAL_ONBOARDING_BALANCE,
          },
        ],
        { session }
      );
    });
    session.endSession();
  } else {
    // Fallback for standalone dev instances
    user = await User.create({
      fullName,
      username,
      email,
      phone,
      passwordHash,
      pinHash,
      isPinSet,
    });

    account = await Account.create({
      userId: user._id,
      balance: env.INITIAL_ONBOARDING_BALANCE,
      currency: 'INR',
      status: 'ACTIVE',
    });

    await Transaction.create({
      referenceId: `INIT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      senderId: user._id,
      receiverId: user._id,
      senderAccountId: account._id,
      receiverAccountId: account._id,
      amount: env.INITIAL_ONBOARDING_BALANCE,
      currency: 'INR',
      status: 'SUCCESS',
      type: 'INITIAL_CREDIT',
      notes: 'Virtual onboarding bank credit bonus',
      senderBalanceBefore: 0,
      senderBalanceAfter: env.INITIAL_ONBOARDING_BALANCE,
      receiverBalanceBefore: 0,
      receiverBalanceAfter: env.INITIAL_ONBOARDING_BALANCE,
    });
  }

  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isPinSet: user.isPinSet,
    },
    account: {
      id: account._id,
      balance: account.balance,
      currency: account.currency,
      status: account.status,
    },
    token,
  };
};

/**
 * Authenticate user with username, email, or phone
 */
const login = async (identifier, password) => {
  const user = await User.findOne({
    $or: [
      { username: identifier.toLowerCase() },
      { email: identifier.toLowerCase() },
      { phone: identifier },
    ],
  }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid credentials. User not found.', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials. Incorrect password.', 401);
  }

  const account = await Account.findOne({ userId: user._id });
  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isPinSet: user.isPinSet,
    },
    account: account
      ? {
          id: account._id,
          balance: account.balance,
          currency: account.currency,
          status: account.status,
        }
      : null,
    token,
  };
};

/**
 * Set or Update transaction PIN
 */
const setTransactionPin = async (userId, pin, password) => {
  const user = await User.findById(userId).select('+passwordHash +pinHash');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError('Incorrect account password. Cannot update PIN.', 403);
  }

  await user.setPin(pin);
  await user.save();

  return {
    isPinSet: true,
    message: 'Transaction PIN configured successfully.',
  };
};

module.exports = {
  register,
  login,
  setTransactionPin,
  generateToken,
};

