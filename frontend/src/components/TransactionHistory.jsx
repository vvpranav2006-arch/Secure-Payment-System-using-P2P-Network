import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { accountApi } from '../api/accountApi';
import { formatCurrency, formatDate } from '../utils/formatters';

const TransactionHistory = ({ onSelectTransaction, refreshTrigger }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [type, setType] = useState('ALL'); // ALL, SENT, RECEIVED
  const [status, setStatus] = useState('ALL'); // ALL, SUCCESS, FAILED
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit,
        type,
        status,
        ...(search.trim() && { search: search.trim() }),
      };

      const response = await accountApi.getTransactions(params);
      setTransactions(response.data || []);
      if (response.meta) {
        setPagination(response.meta);
      }
    } catch (err) {
      console.error('Failed to load transaction history:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, limit, type, status, search]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshTrigger]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header and Controls */}
      <div className="p-5 border-b border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Passbook & Transaction History</span>
            </h3>
            <p className="text-xs text-slate-400">Auditable double-entry ledger records</p>
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 self-start sm:self-auto">
            {['ALL', 'SENT', 'RECEIVED'].map((t) => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  type === t
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'ALL' ? 'All' : t === 'SENT' ? 'Sent (Debit)' : 'Received (Credit)'}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Reference ID (e.g. TXN-...) or notes"
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </form>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={status}
              onChange={handleStatusChange}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Table / List */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading ledger entries...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs flex flex-col items-center">
            <AlertCircle className="w-6 h-6 mb-2" />
            <p>{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-600 stroke-[1.5]" />
            <p className="font-semibold text-slate-300">No transactions found</p>
            <p className="text-[11px] text-slate-500">
              Transactions you send or receive will appear here with full passbook details.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Transaction / Party</th>
                <th className="py-3 px-4">Reference ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {transactions.map((txn) => {
                const isDebit = txn.direction === 'DEBIT';
                const isInitial = txn.type === 'INITIAL_CREDIT';
                const isSuccess = txn.status === 'SUCCESS';

                return (
                  <tr
                    key={txn.id}
                    onClick={() => onSelectTransaction(txn)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    {/* Direction & Party */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isInitial
                              ? 'bg-amber-500/20 text-amber-300'
                              : isDebit
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {isInitial ? (
                            <Sparkles className="w-4 h-4" />
                          ) : isDebit ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {isInitial
                              ? 'Onboarding Credit Bonus'
                              : isDebit
                              ? `Paid to ${txn.counterparty?.fullName || txn.counterparty?.username || 'User'}`
                              : `Received from ${txn.counterparty?.fullName || txn.counterparty?.username || 'User'}`}
                          </p>
                          {txn.notes && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              "{txn.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Reference ID */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {txn.referenceId}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {formatDate(txn.createdAt)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : txn.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isDebit ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isDebit ? '-' : '+'}
                        {formatCurrency(txn.amount, txn.currency)}
                      </span>
                    </td>

                    {/* Balance After */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300 text-[11px]">
                      {txn.balanceAfterFormatted || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing page <span className="font-semibold text-white">{page}</span> of{' '}
          <span className="font-semibold text-white">{pagination.totalPages || 1}</span> (
          {pagination.totalCount} total)
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevPage || loading}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNextPage || loading}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;

