const test = require('node:test');
const assert = require('node:assert/strict');
const { toSubunits, fromSubunits, formatCurrency } = require('../src/utils/currency');

test('Currency Subunit Conversion & Precision Suite', async (t) => {
  await t.test('converts major units to integer paise accurately without float errors', () => {
    // Classic IEEE 754 float failure: 19.99 * 100 = 1998.9999999999998
    assert.equal(toSubunits(19.99), 1999);
    assert.equal(toSubunits('19.99'), 1999);
    assert.equal(toSubunits(5000), 500000);
    assert.equal(toSubunits(0.01), 1);
    assert.equal(toSubunits(150.75), 15075);
  });

  await t.test('rejects invalid or negative monetary values', () => {
    assert.throws(() => toSubunits(-50), /Invalid monetary amount/);
    assert.throws(() => toSubunits('abc'), /Invalid monetary amount/);
  });

  await t.test('converts paise subunits back to major unit float', () => {
    assert.equal(fromSubunits(1999), 19.99);
    assert.equal(fromSubunits(500000), 5000.0);
    assert.equal(fromSubunits(1), 0.01);
  });

  await t.test('enforces that subunits must be integer values', () => {
    assert.throws(() => fromSubunits(1999.5), /Subunits must be an integer/);
  });

  await t.test('formats currency properly into INR localized string', () => {
    const formatted = formatCurrency(500000, 'INR');
    assert.match(formatted, /5,000\.00/);
  });
});

