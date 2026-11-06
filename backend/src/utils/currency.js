/**
 * FinTech Currency Precision & Subunit Utilities
 * All financial transactions store monetary values strictly in integer subunits (paise/cents)
 * to eliminate binary floating point representation issues (IEEE 754).
 */

const SUBUNIT_MULTIPLIER = 100; // 100 paise = 1 INR / 100 cents = 1 USD

/**
 * Converts major currency amount (e.g. 150.75 INR) to integer subunits (15075 paise).
 * Safe against decimal rounding inaccuracies using string splitting or epsilon rounding.
 */
const toSubunits = (amount) => {
  if (typeof amount === 'string') {
    amount = parseFloat(amount.trim());
  }
  if (isNaN(amount) || amount < 0) {
    throw new Error('Invalid monetary amount provided');
  }
  // Use Math.round to avoid 19.99 * 100 = 1998.9999999999998
  return Math.round(amount * SUBUNIT_MULTIPLIER);
};

/**
 * Converts integer subunits (15075 paise) to major currency float (150.75).
 */
const fromSubunits = (subunits) => {
  if (typeof subunits !== 'number' || !Number.isInteger(subunits)) {
    throw new Error('Subunits must be an integer');
  }
  return Number((subunits / SUBUNIT_MULTIPLIER).toFixed(2));
};

/**
 * Formats integer subunits into localized currency string (e.g., "₹1,500.00").
 */
const formatCurrency = (subunits, currency = 'INR', locale = 'en-IN') => {
  const majorValue = fromSubunits(subunits);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(majorValue);
};

module.exports = {
  SUBUNIT_MULTIPLIER,
  toSubunits,
  fromSubunits,
  formatCurrency,
};

