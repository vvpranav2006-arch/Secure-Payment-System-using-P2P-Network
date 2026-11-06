import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Copy, Check, X, Shield, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDate, copyToClipboard } from '../utils/formatters';

const ReceiptModal = ({ isOpen, onClose, transaction }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleCopyRef = async () => {
    const success = await copyToClipboard(transaction.referenceId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSuccess = transaction.status === 'SUCCESS';
  const isDebit = transaction.direction === 'DEBIT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative">
        {/* Top Decorative Header */}
        <div className={`p-6 text-center ${isSuccess ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-lg">
            {isSuccess ? (
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>
            )}
          </div>
          <h3 className="text-lg font-bold text-white">
            {isSuccess ? 'Payment Successful' : 'Payment Failed'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatDate(transaction.createdAt)}
          </p>

          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white font-mono">
              {formatCurrency(transaction.amount, transaction.currency)}
            </span>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              {transaction.amount} paise
            </div>
          </div>
        </div>

        {/* Receipt Details Card */}
        <div className="p-5 space-y-3.5 text-xs">
          {/* Reference ID Row */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Transaction Reference ID
              </p>
              <p className="font-mono text-xs font-bold text-white tracking-wide">
                {transaction.referenceId}
              </p>
            </div>
            <button
              onClick={handleCopyRef}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              title="Copy Reference ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Transfer Participants */}
          <div className="space-y-2 border-t border-b border-slate-800 py-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Transfer Type</span>
              <span className="font-medium text-white">{transaction.type || 'P2P_TRANSFER'}</span>
            </div>

            {transaction.sender && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Paid By</span>
                <span className="font-medium text-white">
                  {transaction.sender.fullName || transaction.sender.username || 'Wallet'}
                </span>
              </div>
            )}

            {transaction.receiver && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Received By</span>
                <span className="font-medium text-emerald-400 font-semibold">
                  {transaction.receiver.fullName || transaction.receiver.username}
                </span>
              </div>
            )}

            {transaction.notes && (
              <div className="flex justify-between items-start pt-1">
                <span className="text-slate-400">Note</span>
                <span className="font-medium text-slate-200 text-right max-w-[200px] break-words">
                  "{transaction.notes}"
                </span>
              </div>
            )}

            {transaction.balanceAfter !== undefined && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400">Updated Wallet Balance</span>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(transaction.balanceAfter, transaction.currency)}
                </span>
              </div>
            )}

            {transaction.failureReason && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                Reason: {transaction.failureReason}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center space-x-1 text-[11px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secured with MongoDB Multi-Document ACID Transactions</span>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;

