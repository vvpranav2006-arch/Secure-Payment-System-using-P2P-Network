const { z } = require('zod');

const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .toLowerCase()
    .trim(),
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^\+?[0-9]{10,15}$/, 'Phone number must contain only numbers and optional leading +')
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password cannot exceed 64 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&#]/, 'Password must contain at least one special character (@$!%*?&#)'),
  pin: z
    .string()
    .regex(/^\d{4,6}$/, 'Transaction PIN must be 4 or 6 numeric digits')
    .optional(),
});

const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Identifier (username, email, or phone) is required')
    .trim(),
  password: z.string().min(1, 'Password is required'),
});

const setPinSchema = z
  .object({
    pin: z.string().regex(/^\d{4,6}$/, 'PIN must be between 4 and 6 numeric digits'),
    confirmPin: z.string(),
    password: z.string().min(1, 'Current password is required to verify identity'),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PIN and Confirm PIN must match",
    path: ['confirmPin'],
  });

module.exports = {
  registerSchema,
  loginSchema,
  setPinSchema,
};

