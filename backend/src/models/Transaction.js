const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    receiverAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      validate: {
        validator: function (val) {
          return Number.isInteger(val) && val > 0;
        },
        message: 'Amount must be a positive integer in subunits (paise)',
      },
    },
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR'],
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REVERSED'],
      default: 'PENDING',
      index: true,
    },
    type: {
      type: String,
      enum: ['P2P_TRANSFER', 'INITIAL_CREDIT', 'REFUND'],
      default: 'P2P_TRANSFER',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [250, 'Notes cannot exceed 250 characters'],
      default: '',
    },
    senderBalanceBefore: {
      type: Number,
    },
    senderBalanceAfter: {
      type: Number,
    },
    receiverBalanceBefore: {
      type: Number,
    },
    receiverBalanceAfter: {
      type: Number,
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for performant passbook filtering and queries
transactionSchema.index({ senderId: 1, createdAt: -1 });
transactionSchema.index({ receiverId: 1, createdAt: -1 });
transactionSchema.index({ senderId: 1, status: 1 });
transactionSchema.index({ receiverId: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

