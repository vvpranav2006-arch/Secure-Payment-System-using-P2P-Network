const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Account must belong to a user'],
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      required: [true, 'Account balance is required'],
      default: 500000, // 500,000 paise = ₹5,000.00
      validate: {
        validator: function (val) {
          return Number.isInteger(val) && val >= 0;
        },
        message: 'Balance must be a non-negative integer represented in subunits (paise)',
      },
    },
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR'],
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'FROZEN', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    version: {
      type: Number,
      default: 0,
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

// Explicit compound index for fast status and balance checks
accountSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Account', accountSchema);

