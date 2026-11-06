import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, KeyRound, User as UserIcon } from 'lucide-react';

const Navbar = ({ onOpenSetPin }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">PayPulse</span>
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  P2P Secure
                </span>
              </div>
              <p className="text-xs text-slate-400">FinTech Digital Wallet</p>
            </div>
          </div>

          {/* User Profile & Actions */}
          {user && (
            <div className="flex items-center space-x-3">
              {/* PIN Status indicator */}
              <button
                onClick={onOpenSetPin}
                className={`flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                  user.isPinSet
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 animate-pulse'
                }`}
                title={user.isPinSet ? 'Change Transaction PIN' : 'Set required Transaction PIN'}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {user.isPinSet ? 'PIN Active' : 'Set PIN'}
                </span>
              </button>

              {/* User Pill */}
              <div className="flex items-center space-x-2.5 bg-slate-800/60 border border-slate-700/60 rounded-full px-3 py-1.5">
                <div className="w-7 h-7 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs uppercase">
                  {user.fullName?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-white leading-tight">
                    {user.fullName}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    @{user.username}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Log out of wallet"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

