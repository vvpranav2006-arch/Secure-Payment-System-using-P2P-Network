import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import WalletBalanceCard from '../components/WalletBalanceCard';
import UserSearch from '../components/UserSearch';
import TransactionHistory from '../components/TransactionHistory';
import TransferModal from '../components/TransferModal';
import ReceiptModal from '../components/ReceiptModal';
import SetPinModal from '../components/SetPinModal';
import { useAuth } from '../context/AuthContext';
import { accountApi } from '../api/accountApi';
import { Shield, Zap, Lock, RefreshCw } from 'lucide-react';

const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const [balanceData, setBalanceData] = useState({
    balanceInSubunits: user?.account?.balance || 500000,
    currency: user?.account?.currency || 'INR',
  });
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Modals state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSetPinModalOpen, setIsSetPinModalOpen] = useState(false);

  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState(null);
  const [selectedTransactionForReceipt, setSelectedTransactionForReceipt] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Fetch updated balance from backend
  const fetchBalance = useCallback(async () => {
    try {
      setBalanceLoading(true);
      const res = await accountApi.getBalance();
      if (res?.data) {
        setBalanceData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // When a user is selected from the Search & Pay widget
  const handleSelectUserFromSearch = (targetUser) => {
    setSelectedUserForTransfer(targetUser);
    setIsTransferModalOpen(true);
  };

  // When a money transfer completes successfully
  const handleTransferSuccess = (transactionData) => {
    setSelectedTransactionForReceipt(transactionData);
    setIsReceiptModalOpen(true);
    // Refresh balance and ledger history immediately
    fetchBalance();
    refreshUser();
    setHistoryRefreshKey((k) => k + 1);
  };

  // When user clicks a transaction in the passbook table
  const handleSelectTransactionFromHistory = (txn) => {
    setSelectedTransactionForReceipt(txn);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar onOpenSetPin={() => setIsSetPinModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top FinTech Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center space-x-2">
                <span>Active Wallet Security Status</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
              </p>
              <p className="text-[11px] text-slate-400">
                MongoDB Replica Set ACID Transactions • Idempotency Keys • Subunit Precision
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant P2P</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>PIN Authorization</span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid: Left Card & Search, Right Passbook History */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Wallet Balance & User Search (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <WalletBalanceCard
              balance={balanceData.balanceInSubunits}
              currency={balanceData.currency}
              loading={balanceLoading}
              onRefresh={fetchBalance}
              onOpenTransfer={() => {
                setSelectedUserForTransfer(null);
                setIsTransferModalOpen(true);
              }}
              onOpenSetPin={() => setIsSetPinModalOpen(true)}
              isPinSet={user?.isPinSet}
            />

            <UserSearch onSelectUser={handleSelectUserFromSearch} />
          </div>

          {/* Right Column: Transaction History / Passbook (7 cols) */}
          <div className="lg:col-span-7">
            <TransactionHistory
              onSelectTransaction={handleSelectTransactionFromHistory}
              refreshTrigger={historyRefreshKey}
            />
          </div>
        </div>
      </main>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        selectedUser={selectedUserForTransfer}
        currentBalance={balanceData.balanceInSubunits}
        isPinSet={user?.isPinSet}
        onTransferSuccess={handleTransferSuccess}
        onOpenSetPin={() => setIsSetPinModalOpen(true)}
      />

      {/* Digital Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={selectedTransactionForReceipt}
      />

      {/* Set Transaction PIN Modal */}
      <SetPinModal
        isOpen={isSetPinModalOpen}
        onClose={() => setIsSetPinModalOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;

