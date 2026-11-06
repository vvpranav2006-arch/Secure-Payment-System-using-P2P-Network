import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, UserCheck, Phone, Mail, ArrowUpRight, X } from 'lucide-react';
import { accountApi } from '../api/accountApi';

const UserSearch = ({ onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await accountApi.searchUsers(query.trim());
        setResults(response.data || []);
      } catch (err) {
        console.error('Failed to search users:', err);
        setResults([]);
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <span>Search & Pay</span>
        </h3>
        <span className="text-[11px] text-slate-400">P2P Instant Transfer</span>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Username, Email, or Phone..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
        ) : query ? (
          <button
            onClick={handleClear}
            className="text-slate-400 hover:text-white absolute right-3.5 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Search Results */}
      {query.trim().length > 0 && (
        <div className="mt-3 divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-72 overflow-y-auto">
          {results.length > 0 ? (
            results.map((recipient) => (
              <div
                key={recipient.id}
                className="flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                    {recipient.fullName?.charAt(0) || recipient.username?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <p className="text-sm font-semibold text-white">{recipient.fullName}</p>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                      <span>@{recipient.username}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{recipient.phone}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectUser(recipient)}
                  className="flex items-center space-x-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                >
                  <span>Pay</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : hasSearched && !loading ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              No registered wallet users found matching "{query}".
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default UserSearch;

