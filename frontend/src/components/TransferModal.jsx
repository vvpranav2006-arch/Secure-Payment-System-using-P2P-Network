import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, ArrowRight, Loader2, AlertCircle, KeyRound, Lock } from 'lucide-react';
import { accountApi } from '../api/accountApi';
import { generateIdempotencyKey } from '../utils/idempotency';
import { formatCurrency } from '../utils/formatters';

const TransferModal = ({ isOpen, onClose, selectedUser, currentBalance = 0, isPinSet, onTransferSuccess, onOpenSetPin }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [pin, setPin] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync selected user from search
  useEffect(() => {
    if (selectedUser) {
      setRecipient(selectedUser.username || selectedUser.phone || selectedUser.email || '');
    }
  }, [selectedUser]);

  // Generate a new unique idempotency key every time modal opens or resets
  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateIdempotencyKey());
      setError(null);
      setPin('');
      if (!selectedUser) {
        setRecipient('');
      }
      setAmount('');
      setNotes('');
    }
  }, [isOpen, selectedUser]);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amount) || 0;
  const amountInPaise = Math.round(numericAmount * 100);
  const balanceAfter = currentBalance - amountInPaise;
  const isInsufficient = numericAmount > 0 && amountInPaise > currentBalance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!recipient.trim()) {
      setError('Please provide a recipient username, email, or phone number.');
      return;
    }

    if (!amount || numericAmount <= 0) {
      setError('Please enter a valid transfer amount greater than 0.');
      return;
    }

    if (isInsufficient) {
      setError('Insufficient wallet balance to complete this transfer.');
      return;
    }

    if (!pin || pin.length < 4) {
      setError('Please enter your 4-6 digit Transaction PIN.');
      return;
    }

    try {
      setLoading(true);

      const response = await accountApi.transfer({
        recipientIdentifier: recipient.trim(),
        amount: numericAmount,
        pin,
        notes: notes.trim(),
        idempotencyKey,
      });

      // Transfer succeeded
      onTransferSuccess(response.data.transaction);
      onClose();
    } catch (err) {
      console.error('Transfer failed:', err);
      setError(err.message || 'Payment execution failed. Please verify your PIN and try again.');
      // Keep same idempotency key if network glitch, but if user explicitly re-submits after error they can retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">P2P Payment Transfer</h3>
              <p className="text-[11px] text-slate-400">ACID Atomic Transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Unset Alert */}
        {!isPinSet && (
          <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>You must set a Transaction PIN before sending money.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSetPin();
              }}
              className="underline font-semibold hover:text-white"
            >
              Set Now
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Recipient Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Pay To (Username, Email, or Phone)
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. rahul_sharma, user@gmail.com"
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              required
            />
          </div>

          {/* Amount in INR */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">Amount (INR)</label>
              <span className="text-[11px] text-slate-400">
                Balance: {formatCurrency(currentBalance)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={loading}
                className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-800 border text-base font-semibold font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                  isInsufficient
                    ? 'border-rose-500/80 focus:ring-rose-500/50'
                    : 'border-slate-700 focus:ring-emerald-500/50 focus:border-emerald-500'
                }`}
                required
              />
            </div>

            {/* Live Subunit & Balance Calculation */}
            {numericAmount > 0 && (
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">
                  = {amountInPaise.toLocaleString('en-IN')} paise
                </span>
                <span className={isInsufficient ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                  {isInsufficient
                    ? 'Exceeds available balance'
                    : `Remaining: ${formatCurrency(balanceAfter)}`}
                </span>
              </div>
            )}
          </div>

          {/* Notes / Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Add a Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dinner share, rent, groceries"
              maxLength={250}
              disabled={loading}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          {/* Transaction PIN Input */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Transaction PIN</span>
              </label>
              <span className="text-[10px] text-slate-400">4-6 digits</span>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              disabled={loading || !isPinSet}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-center tracking-[0.5em] font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              required
            />
          </div>

          {/* Idempotency Footer Info */}
          <div className="bg-slate-950/60 rounded-lg p-2 text-[10px] text-slate-500 flex items-center justify-between font-mono">
            <span>Idempotency-Key:</span>
            <span className="truncate max-w-[200px] text-slate-400">{idempotencyKey.slice(0, 18)}...</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/3 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || isInsufficient || !isPinSet}
              className="w-2/3 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Transfer...</span>
                </>
              ) : (
                <>
                  <span>Authorize & Pay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;

