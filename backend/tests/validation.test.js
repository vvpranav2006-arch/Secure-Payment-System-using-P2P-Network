const test = require('node:test');
const assert = require('node:assert/strict');
const { registerSchema, loginSchema, setPinSchema } = require('../src/validators/auth.validator');
const { transferSchema } = require('../src/validators/account.validator');

test('FinTech Zod Schema Validation Suite', async (t) => {
  await t.test('accepts valid registration payload', async () => {
    const valid = {
      fullName: 'Vikram Mehta',
      username: 'vikram_m',
      email: 'vikram@example.com',
      phone: '+919876543210',
      password: 'SecurePassword123!',
      pin: '1234',
    };
    const parsed = await registerSchema.parseAsync(valid);
    assert.equal(parsed.username, 'vikram_m');
    assert.equal(parsed.pin, '1234');
  });

  await t.test('rejects weak passwords missing uppercase, number, or special char', async () => {
    const weak = {
      fullName: 'Vikram Mehta',
      username: 'vikram_m',
      email: 'vikram@example.com',
      phone: '+919876543210',
      password: 'password', // weak
    };
    await assert.rejects(async () => {
      await registerSchema.parseAsync(weak);
    });
  });

  await t.test('rejects transfer with negative or 0 amount', async () => {
    const invalidTransfer = {
      recipientIdentifier: 'vikram_m',
      amount: -50,
      pin: '1234',
    };
    await assert.rejects(async () => {
      await transferSchema.parseAsync(invalidTransfer);
    });
  });

  await t.test('rejects transfer with non-numeric or short PIN', async () => {
    const invalidTransfer = {
      recipientIdentifier: 'vikram_m',
      amount: 500,
      pin: '12a', // non numeric / short
    };
    await assert.rejects(async () => {
      await transferSchema.parseAsync(invalidTransfer);
    });
  });

  await t.test('enforces PIN and confirmPin matching in setPinSchema', async () => {
    const mismatch = {
      pin: '1234',
      confirmPin: '5678',
      password: 'MyPassword123!',
    };
    await assert.rejects(async () => {
      await setPinSchema.parseAsync(mismatch);
    });
  });
});

