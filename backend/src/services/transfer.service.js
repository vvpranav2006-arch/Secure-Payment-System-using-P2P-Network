const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AppError = require('../utils/AppError');
const { toSubunits, fromSubunits, formatCurrency } = require('../utils/currency');

/**
 * Generates an auditable, human-readable Unique Transaction Reference ID
 * Example: TXN-20261106-9A8B7C
 */
const generateReferenceId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TXN-${dateStr}-${randomHex}`;
};

/**
 * Execute Atomic P2P Money Transfer with ACID guarantees, Race Condition Prevention,
 * and Subunit Precision
 *
 * @param {Object} params
 * @param {string} params.senderUserId
 * @param {string} params.recipientIdentifier (username, email, or phone)
 * @param {number} params.amountInMajorUnit (e.g. 500.50)
 * @param {string} params.notes
 * @param {string} params.idempotencyKey
 */
const executeTransfer = async ({
  senderUserId,
  recipientIdentifier,
  amountInMajorUnit,
  notes = '',
  idempotencyKey,
}) => {
  // 1. Convert amount to strictly validated integer subunits (paise)
  const amountInSubunits = toSubunits(amountInMajorUnit);

  if (amountInSubunits <= 0) {
    throw new AppError('Transfer amount must be greater than zero.', 400);
  }

  // 2. Resolve sender and recipient
  const sender = await User.findById(senderUserId);
  if (!sender) {
    throw new AppError('Sender account not found.', 404);
  }

  const cleanRecipientId = recipientIdentifier.trim().toLowerCase();
  const recipient = await User.findOne({
    $or: [
      { username: cleanRecipientId },
      { email: cleanRecipientId },
      { phone: recipientIdentifier.trim() },
    ],
  });

  if (!recipient) {
    throw new AppError(
      `Recipient "${recipientIdentifier}" not found. Verify the username, email, or phone.`,
      404
    );
  }

  // Prevent self-transfer
  if (sender._id.toString() === recipient._id.toString()) {
    throw new AppError('Self-transfers are not allowed. You cannot send money to yourself.', 400);
  }

  // 3. Resolve accounts
  const senderAccountDoc = await Account.findOne({ userId: sender._id });
  const recipientAccountDoc = await Account.findOne({ userId: recipient._id });

  if (!senderAccountDoc) throw new AppError('Sender wallet account not found.', 404);
  if (!recipientAccountDoc) throw new AppError('Recipient wallet account not found.', 404);

  if (senderAccountDoc.status !== 'ACTIVE') {
    throw new AppError(`Your account is currently ${senderAccountDoc.status.toLowerCase()}. Transfers disabled.`, 403);
  }
  if (recipientAccountDoc.status !== 'ACTIVE') {
    throw new AppError(`Recipient account is ${recipientAccountDoc.status.toLowerCase()}. Cannot accept funds.`, 400);
  }

  // 4. Initial balance pre-check
  if (senderAccountDoc.balance < amountInSubunits) {
    throw new AppError(
      `Insufficient funds. Available balance: ${formatCurrency(senderAccountDoc.balance)}. Required: ${formatCurrency(amountInSubunits)}.`,
      400
    );
  }

  const referenceId = generateReferenceId();

  // 5. Check if Mongo Replica Set is available for ACID Multi-Document Transactions
  const isReplicaSet =
    mongoose.connection.client.topology &&
    mongoose.connection.client.topology.description.type !== 'Single';

  if (isReplicaSet) {
    // -------------------------------------------------------------
    // ACID TRANSACTION ENGINE (MongoDB Replica Set / Production)
    // -------------------------------------------------------------
    const session = await mongoose.startSession();
    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });

    try {
      // Step A: Atomic Debit with strict DB-level $gte condition to prevent negative balance
      const updatedSenderAccount = await Account.findOneAndUpdate(
        {
          _id: senderAccountDoc._id,
          balance: { $gte: amountInSubunits }, // Prevents race condition double-spending!
          status: 'ACTIVE',
        },
        {
          $inc: { balance: -amountInSubunits, version: 1 },
        },
        {
          session,
          new: true,
        }
      );

      if (!updatedSenderAccount) {
        throw new AppError('Insufficient balance or concurrent transaction in progress. Transfer aborted.', 400);
      }

      // Step B: Atomic Credit to recipient
      const updatedRecipientAccount = await Account.findOneAndUpdate(
        {
          _id: recipientAccountDoc._id,
          status: 'ACTIVE',
        },
        {
          $inc: { balance: amountInSubunits, version: 1 },
        },
        {
          session,
          new: true,
        }
      );

      if (!updatedRecipientAccount) {
        throw new AppError('Recipient wallet inactive or unavailable. Transfer rolled back.', 400);
      }

      // Step C: Ledger Recording
      const [transactionRecord] = await Transaction.create(
        [
          {
            referenceId,
            idempotencyKey,
            senderId: sender._id,
            receiverId: recipient._id,
            senderAccountId: senderAccountDoc._id,
            receiverAccountId: recipientAccountDoc._id,
            amount: amountInSubunits,
            currency: 'INR',
            status: 'SUCCESS',
            type: 'P2P_TRANSFER',
            notes,
            senderBalanceBefore: senderAccountDoc.balance,
            senderBalanceAfter: updatedSenderAccount.balance,
            receiverBalanceBefore: recipientAccountDoc.balance,
            receiverBalanceAfter: updatedRecipientAccount.balance,
          },
        ],
        { session }
      );

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      return {
        transaction: {
          referenceId: transactionRecord.referenceId,
          amount: transactionRecord.amount,
          amountFormatted: formatCurrency(transactionRecord.amount),
          currency: transactionRecord.currency,
          status: transactionRecord.status,
          type: transactionRecord.type,
          notes: transactionRecord.notes,
          sender: {
            id: sender._id,
            fullName: sender.fullName,
            username: sender.username,
          },
          receiver: {
            id: recipient._id,
            fullName: recipient.fullName,
            username: recipient.username,
          },
          senderBalanceAfter: updatedSenderAccount.balance,
          senderBalanceAfterFormatted: formatCurrency(updatedSenderAccount.balance),
          createdAt: transactionRecord.createdAt,
        },
      };
    } catch (err) {
      // Rollback on any failure
      await session.abortTransaction();
      session.endSession();

      // Log failed transaction record outside transaction
      await Transaction.create({
        referenceId,
        idempotencyKey,
        senderId: sender._id,
        receiverId: recipient._id,
        senderAccountId: senderAccountDoc._id,
        receiverAccountId: recipientAccountDoc._id,
        amount: amountInSubunits,
        currency: 'INR',
        status: 'FAILED',
        type: 'P2P_TRANSFER',
        notes,
        failureReason: err.message,
      }).catch(() => {});

      throw err;
    }
  } else {
    // -------------------------------------------------------------
    // STANDALONE ENVIRONMENT ENGINE (Atomic $inc with Compensating Rollback)
    // -------------------------------------------------------------
    // Atomic debit with conditional check
    const updatedSenderAccount = await Account.findOneAndUpdate(
      {
        _id: senderAccountDoc._id,
        balance: { $gte: amountInSubunits },
        status: 'ACTIVE',
      },
      {
        $inc: { balance: -amountInSubunits, version: 1 },
      },
      { new: true }
    );

    if (!updatedSenderAccount) {
      throw new AppError('Insufficient balance or concurrent transaction in progress. Transfer aborted.', 400);
    }

    // Attempt credit
    let updatedRecipientAccount;
    try {
      updatedRecipientAccount = await Account.findOneAndUpdate(
        {
          _id: recipientAccountDoc._id,
          status: 'ACTIVE',
        },
        {
          $inc: { balance: amountInSubunits, version: 1 },
        },
        { new: true }
      );

      if (!updatedRecipientAccount) {
        throw new Error('Recipient wallet is not active.');
      }
    } catch (creditError) {
      // Compensating action: refund sender
      await Account.findByIdAndUpdate(senderAccountDoc._id, {
        $inc: { balance: amountInSubunits, version: 1 },
      });

      await Transaction.create({
        referenceId,
        idempotencyKey,
        senderId: sender._id,
        receiverId: recipient._id,
        senderAccountId: senderAccountDoc._id,
        receiverAccountId: recipientAccountDoc._id,
        amount: amountInSubunits,
        currency: 'INR',
        status: 'FAILED',
        type: 'P2P_TRANSFER',
        notes,
        failureReason: creditError.message,
      });

      throw new AppError(`Transfer failed during credit step: ${creditError.message}. Funds refunded.`, 500);
    }

    // Ledger record
    const transactionRecord = await Transaction.create({
      referenceId,
      idempotencyKey,
      senderId: sender._id,
      receiverId: recipient._id,
      senderAccountId: senderAccountDoc._id,
      receiverAccountId: recipientAccountDoc._id,
      amount: amountInSubunits,
      currency: 'INR',
      status: 'SUCCESS',
      type: 'P2P_TRANSFER',
      notes,
      senderBalanceBefore: senderAccountDoc.balance,
      senderBalanceAfter: updatedSenderAccount.balance,
      receiverBalanceBefore: recipientAccountDoc.balance,
      receiverBalanceAfter: updatedRecipientAccount.balance,
    });

    return {
      transaction: {
        referenceId: transactionRecord.referenceId,
        amount: transactionRecord.amount,
        amountFormatted: formatCurrency(transactionRecord.amount),
        currency: transactionRecord.currency,
        status: transactionRecord.status,
        type: transactionRecord.type,
        notes: transactionRecord.notes,
        sender: {
          id: sender._id,
          fullName: sender.fullName,
          username: sender.username,
        },
        receiver: {
          id: recipient._id,
          fullName: recipient.fullName,
          username: recipient.username,
        },
        senderBalanceAfter: updatedSenderAccount.balance,
        senderBalanceAfterFormatted: formatCurrency(updatedSenderAccount.balance),
        createdAt: transactionRecord.createdAt,
      },
    };
  }
};

module.exports = {
  executeTransfer,
  generateReferenceId,
};

