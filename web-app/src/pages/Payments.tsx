import { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, Download, Filter, Search, 
  ArrowUpRight, ArrowDownRight, RefreshCw, XCircle,
  FileText, CheckCircle, AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { exportToCsv } from '../lib/csv';
import type { ApiLedgerTransaction } from '../types/api';

type ViewState = 'loading' | 'empty' | 'error' | 'success';

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: string;
  status: string;
  shift: string;
}

interface Summary {
  escrowHeld: number;
  pendingSettlement: number;
  settledThisWeek: number;
  refunds: number;
}

export default function Payments() {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ escrowHeld: 0, pendingSettlement: 0, settledThisWeek: 0, refunds: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const filteredTransactions = transactions.filter(t => {
    if (typeFilter && t.type !== typeFilter) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return t.id.toLowerCase().includes(q) || t.shift.toLowerCase().includes(q) || t.type.toLowerCase().includes(q);
  });

  const fetchPayments = useCallback(async () => {
    try {
      setViewState('loading');
      const walletData = await api.get<{ transactions: ApiLedgerTransaction[] }>('/wallets/transactions?limit=100');
      const txns: Transaction[] = (walletData.transactions || []).map((t: ApiLedgerTransaction) => ({
        id: t.id.substring(0, 8).toUpperCase(),
        date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: t.type === 'escrow_hold' ? 'Escrow Held' : t.type === 'escrow_release' ? 'Settlement' : t.type === 'platform_fee' ? 'Platform Fee' : t.type === 'deposit' ? 'Deposit' : t.type === 'refund' ? 'Refund' : t.type,
        amount: `${t.direction === 'debit' ? '-' : ''}Rs. ${Math.abs(t.amount_pkr).toLocaleString()}`,
        status: t.type === 'escrow_hold' ? 'Pending' : 'Settled',
        shift: t.description || 'N/A',
      }));

      // Get wallet balance for summary
      let walletBalance: { balancePkr?: number; heldPkr?: number; held_pkr?: number } = { balancePkr: 0, heldPkr: 0 };
      try {
        walletBalance = await api.get<{ balancePkr?: number; heldPkr?: number; held_pkr?: number }>('/wallets/balance');
      } catch { /* wallet may not exist yet */ }
      
      setSummary({
        escrowHeld: walletBalance.heldPkr || walletBalance.held_pkr || 0,
        pendingSettlement: txns.filter(t => t.status === 'Pending').reduce((sum, t) => sum + parseInt(t.amount.replace(/[^\d]/g, '') || '0'), 0),
        settledThisWeek: txns.filter(t => t.status === 'Settled' && !t.amount.startsWith('-')).reduce((sum, t) => sum + parseInt(t.amount.replace(/[^\d]/g, '') || '0'), 0),
        refunds: txns.filter(t => t.type === 'Refund').reduce((sum, t) => sum + parseInt(t.amount.replace(/[^\d]/g, '') || '0'), 0),
      });
      
      setTransactions(txns);
      setViewState(txns.length === 0 ? 'empty' : 'success');
    } catch (err) {
      setViewState('error');
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Settled': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Processed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading payment data...</p>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load payments</h2>
        <p className="text-slate-500 text-center max-w-md">We encountered an error while fetching your financial records.</p>
        <button onClick={() => fetchPayments()} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payments & Escrow</h1>
          <p className="text-sm text-slate-500">Manage escrow funds, settlements, and transaction history.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => exportToCsv('docduty-payments.csv', transactions)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-slate-500">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm font-medium">Escrow Held</span>
          </div>
          <p className="text-xl font-bold text-slate-900">Rs. {summary.escrowHeld.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Funds locked for upcoming shifts</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-slate-500">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium">Pending Settlement</span>
          </div>
          <p className="text-xl font-bold text-slate-900">Rs. {summary.pendingSettlement.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Processing to doctors</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-slate-500">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium">Settled This Week</span>
          </div>
          <p className="text-xl font-bold text-slate-900">Rs. {summary.settledThisWeek.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Completed settlements</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-slate-500">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium">Refunds</span>
          </div>
          <p className="text-xl font-bold text-slate-900">Rs. {summary.refunds.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Returned to facility balance</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 bg-slate-50/50 border-b border-slate-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search transactions by ID or shift..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center justify-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${showFilters ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
        {showFilters && (
          <div className="px-4 pb-3 flex gap-3 flex-wrap border-b border-slate-200 bg-slate-50/50">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary">
              <option value="">All Types</option>
              <option value="Escrow Held">Escrow Held</option>
              <option value="Settlement">Settlement</option>
              <option value="Platform Fee">Platform Fee</option>
              <option value="Refund">Refund</option>
            </select>
            {typeFilter && <button onClick={() => setTypeFilter('')} className="text-xs text-primary font-medium hover:underline">Clear</button>}
          </div>
        )}

        {viewState === 'empty' || filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No transactions found</h3>
            <p className="text-slate-500 text-center max-w-sm">
              {searchTerm ? 'No transactions match your search.' : 'Your transaction history will appear here once shifts are booked and settled.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table view */}
            <div className="overflow-x-auto hidden lg:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="p-4">Transaction ID & Date</th>
                    <th className="p-4">Type & Shift</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTransactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedTxn(txn)}>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{txn.id}</span>
                          <span className="text-xs text-slate-500">{txn.date}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{txn.type}</span>
                          <span className="text-xs text-slate-500">{txn.shift}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${txn.amount.startsWith('-') ? 'text-red-600' : 'text-emerald-600'}`}>
                          {txn.amount}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setSelectedTxn(txn)} className="text-primary hover:text-primary/80 transition-colors" title="View Details">
                          <FileText className="w-5 h-5 ml-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredTransactions.map(txn => (
                <div key={txn.id} className="p-4 hover:bg-slate-50 cursor-pointer flex items-center gap-3" onClick={() => setSelectedTxn(txn)}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${txn.amount.startsWith('-') ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    {txn.amount.startsWith('-') ? <ArrowDownRight className="w-5 h-5 text-red-500" /> : <ArrowUpRight className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-900 truncate">{txn.type}</span>
                      <span className={`font-bold text-sm shrink-0 ${txn.amount.startsWith('-') ? 'text-red-600' : 'text-emerald-600'}`}>{txn.amount}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-slate-500 truncate">{txn.shift}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(txn.status)}`}>{txn.status}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">{txn.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Booking Payment Detail Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Transaction Details</h3>
              <button onClick={() => setSelectedTxn(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Transaction ID</p>
                  <p className="font-bold text-slate-900">{selectedTxn.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Date</p>
                  <p className="font-medium text-slate-900">{selectedTxn.date}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Shift Reference</span>
                  <span className="text-slate-900 font-bold">{selectedTxn.shift}</span>
                </div>
                
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Pay Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Pay</span>
                    <span>Rs. {selectedTxn.amount.replace(/[^0-9,]/g, '') || '—'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Platform Fee (10%)</span>
                    <span className="text-red-600">Included</span>
                  </div>
                  {selectedTxn.type === 'Refund' && (
                    <div className="flex justify-between text-slate-600">
                      <span>Cancellation Penalty</span>
                      <span className="text-red-600">Applied per policy</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 mt-2">
                    <span>Net Amount</span>
                    <span className={selectedTxn.amount.startsWith('-') ? 'text-red-600' : 'text-emerald-600'}>
                      {selectedTxn.amount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-sm text-slate-600 font-medium">Escrow Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Released
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-sm text-slate-600 font-medium">Settlement Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${getStatusColor(selectedTxn.status)}`}>
                    {selectedTxn.status}
                  </span>
                </div>
              </div>

              {selectedTxn.type === 'Refund' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <p className="font-semibold mb-1">Refund Notes</p>
                  <p>Shift cancelled by facility &gt; 24hrs before start. Full refund issued minus standard processing fee.</p>
                </div>
              )}

            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setSelectedTxn(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

