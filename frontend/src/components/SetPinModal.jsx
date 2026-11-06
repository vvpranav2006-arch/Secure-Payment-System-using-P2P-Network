import React, { useState } from 'react';
import { X, KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

const SetPinModal = ({ isOpen, onClose }) => {
  const { updateUserProfile, user } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (pin.length < 4 || pin.length > 6) {
      setError('PIN must be 4 to 6 numeric digits.');
      return;
    }

    if (pin !== confirmPin) {
      setError('PIN and Confirm PIN do not match.');
      return;
    }

    if (!password) {
      setError('Account password is required to authorize PIN change.');
      return;
    }

    try {
      setLoading(true);
      await authApi.setPin(pin, confirmPin, password);
      updateUserProfile({ isPinSet: true });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update PIN. Ensure your password is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {user?.isPinSet ? 'Change Transaction PIN' : 'Set Transaction PIN'}
              </h3>
              <p className="text-[11px] text-slate-400">Required for payment authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Transaction PIN configured successfully!</span>
            </div>
          )}

          {/* New PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              New PIN (4-6 digits)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              disabled={loading}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-center tracking-[0.5em] font-mono text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              required
            />
          </div>

          {/* Confirm PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Confirm PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              disabled={loading}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-center tracking-[0.5em] font-mono text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              required
            />
          </div>

          {/* Account Password Authorization */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Confirm Account Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter current login password"
              disabled={loading}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving PIN...</span>
              </>
            ) : (
              <span>Save Transaction PIN</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPinModal;

