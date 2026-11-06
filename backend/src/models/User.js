const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    pinHash: {
      type: String,
      default: null,
      select: false,
    },
    isPinSet: {
      type: Boolean,
      default: false,
    },
    failedPinAttempts: {
      type: Number,
      default: 0,
    },
    pinLockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.pinHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound text index for user search by username, email, phone, or fullName
userSchema.index({ username: 'text', email: 'text', phone: 'text', fullName: 'text' });

/**
 * Compare plain candidate password with bcrypt hash
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Compare plain transaction PIN with bcrypt hash and enforce lockout policy
 */
userSchema.methods.verifyPin = async function (candidatePin) {
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_MINUTES = 15;

  // Check if PIN is currently locked
  if (this.pinLockedUntil && this.pinLockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((this.pinLockedUntil - new Date()) / (1000 * 60));
    throw new Error(`Transaction PIN is temporarily locked due to excessive failed attempts. Try again in ${remainingMinutes} minute(s).`);
  }

  if (!this.pinHash) {
    throw new Error('Transaction PIN has not been set yet. Please set your PIN first.');
  }

  const isMatch = await bcrypt.compare(candidatePin.toString(), this.pinHash);

  if (!isMatch) {
    this.failedPinAttempts += 1;
    if (this.failedPinAttempts >= MAX_FAILED_ATTEMPTS) {
      this.pinLockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      await this.save({ validateBeforeSave: false });
      throw new Error(`Incorrect PIN. Account locked for ${LOCKOUT_MINUTES} minutes due to ${MAX_FAILED_ATTEMPTS} failed attempts.`);
    }
    await this.save({ validateBeforeSave: false });
    const remaining = MAX_FAILED_ATTEMPTS - this.failedPinAttempts;
    throw new Error(`Incorrect PIN. ${remaining} attempt(s) remaining before temporary lockout.`);
  }

  // Reset failed attempts on successful verification
  if (this.failedPinAttempts > 0 || this.pinLockedUntil) {
    this.failedPinAttempts = 0;
    this.pinLockedUntil = null;
    await this.save({ validateBeforeSave: false });
  }

  return true;
};

/**
 * Hash and set new Transaction PIN
 */
userSchema.methods.setPin = async function (rawPin) {
  const salt = await bcrypt.genSalt(12);
  this.pinHash = await bcrypt.hash(rawPin.toString(), salt);
  this.isPinSet = true;
  this.failedPinAttempts = 0;
  this.pinLockedUntil = null;
};

module.exports = mongoose.model('User', userSchema);

