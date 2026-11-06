const { z } = require('zod');

const transferSchema = z.object({
  recipientIdentifier: z
    .string()
    .min(3, 'Recipient identifier (username, email, or phone) is required')
    .trim(),
  amount: z
    .number({ invalid_type_error: 'Amount must be a valid number' })
    .positive('Transfer amount must be strictly greater than 0')
    .min(1, 'Minimum transfer amount is ₹1.00')
    .max(1000000, 'Maximum single transfer limit is ₹1,000,000.00'),
  pin: z
    .string()
    .regex(/^\d{4,6}$/, 'Transaction PIN must be 4 to 6 numeric digits'),
  notes: z
    .string()
    .max(250, 'Notes cannot exceed 250 characters')
    .optional()
    .default(''),
});

const searchUserSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(50, 'Search query cannot exceed 50 characters')
    .trim(),
});

const historyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  type: z.enum(['ALL', 'SENT', 'RECEIVED']).default('ALL'),
  status: z.enum(['ALL', 'SUCCESS', 'FAILED', 'PENDING', 'REVERSED']).default('ALL'),
  search: z.string().optional(),
});

module.exports = {
  transferSchema,
  searchUserSchema,
  historyQuerySchema,
};

