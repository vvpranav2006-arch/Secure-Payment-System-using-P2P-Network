const mongoose = require('mongoose');

const idempotencyRecordSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    requestHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'RESOLVED', 'REJECTED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    responseCode: {
      type: Number,
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB automatic TTL cleanup after expiration!
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user + key lookups
idempotencyRecordSchema.index({ userId: 1, key: 1 });

module.exports = mongoose.model('IdempotencyRecord', idempotencyRecordSchema);

