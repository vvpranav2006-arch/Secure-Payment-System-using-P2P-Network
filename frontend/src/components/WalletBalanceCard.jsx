import React, { useState } from 'react';
import { Eye, EyeOff, RefreshCw, ArrowUpRight, KeyRound, Shield, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const WalletBalanceCard = ({ balance, currency, loading, onRefresh, onOpenTransfer, onOpenSetPin, isPinSet }) => {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-7">
      {/* Background Decorative FinTech Gradients */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Primary Wallet
            </span>
            <div className="flex items-center space-x-1 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>ACID Guaranteed</span>
            </div>
          </div>
        </div>

        {/* Currency & Refresh button */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
            {currency || 'INR'}
          </span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all disabled:opacity-50"
            title="Refresh balance"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Balance Amount Section */}
      <div className="relative z-10 mb-8">
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium mb-1.5">
          <span>Available Balance</span>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            title={showBalance ? 'Hide balance' : 'Show balance'}
          >
            {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>

        <div className="flex items-baseline space-x-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
            {showBalance ? (
              balance !== undefined ? formatCurrency(balance, currency) : '₹0.00'
            ) : (
              '••••••••'
            )}
          </h2>
          {showBalance && (
            <span className="text-xs text-slate-400 font-normal">
              ({balance || 0} paise)
            </span>
          )}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800">
        <button
          onClick={onOpenTransfer}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          <span>Send Money</span>
        </button>

        <button
          onClick={onOpenSetPin}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium border transition-all ${
            isPinSet
              ? 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-slate-600'
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>{isPinSet ? 'Manage PIN' : 'Set PIN (Required)'}</span>
        </button>
      </div>
    </div>
  );
};

export default WalletBalanceCard;

