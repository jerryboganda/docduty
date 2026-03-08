import { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownRight, Clock, 
  RefreshCw, XCircle, Building2, CheckCircle, AlertTriangle, X
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';

type ViewState = 'loading' | 'empty' | 'error' | 'success';

interface Transaction {
  id: string;
  type: 'Earning' | 'Payout' | 'Penalty';
  amount: string;
  date: string;
  desc: string;
  status: string;
}

interface WalletBalance {
  available: number;
  escrow: number;
  total_earned: number;
}

export default function DoctorWallet() {
  const toast = useToast();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<WalletBalance>({ available: 0, escrow: 0, total_earned: 0 });
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      setViewState('loading');
      const [balData, txData] = await Promise.all([
        api.get('/wallets/balance'),
        api.get('/wallets/transactions?limit=50'),
      ]);
      setBalance({
        available: balData.availablePkr || balData.balancePkr || balData.available || balData.balance || 0,
        escrow: balData.heldPkr || balData.escrow || balData.pending || 0,
        total_earned: balData.totalEarnedPkr || balData.total_earned || balData.lifetime || 0,
      });
      const txns: Transaction[] = (txData.transactions || []).map((t: any) => {
        const amt = t.amount_pkr ?? t.amount ?? 0;
        const isCredit = t.direction === 'credit' || t.type === 'earning' || t.type === 'deposit';
        const isPenalty = t.type === 'penalty' || t.type === 'deduction';
        const isPayout = t.type === 'payout' || t.type === 'withdrawal';
        return {
          id: t.id,
          type: isPenalty ? 'Penalty' : isPayout ? 'Payout' : 'Earning',
          amount: `${isCredit && !isPenalty ? '+' : '-'}Rs. ${Math.abs(amt).toLocaleString()}`,
          date: t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
          desc: t.description || t.shift_title || t.reference || 'Transaction',
          status: t.status === 'completed' ? 'Available' : t.status === 'pending' ? 'Processing' : t.status || 'Available',
        };
      });
      setTransactions(txns);
      setViewState(txns.length === 0 ? 'empty' : 'success');
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
      setViewState('error');
    }
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const handlePayout = async () => {
    try {
      setSubmitting(true);
      await api.post('/wallets/payout', { amountPkr: parseInt(payoutAmount) });
      setPayoutModalOpen(false);
      setPayoutAmount('');
      toast.success('Payout requested', 'Your payout is being processed.');
      fetchWallet();
    } catch (err: any) {
      toast.error('Payout Failed', err.message || 'Payout request failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading wallet data...</p>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load wallet</h2>
        <p className="text-slate-500 text-center max-w-md">We encountered an error while fetching your balances and transactions.</p>
        <button onClick={fetchWallet} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Wallet & Payouts</h1>
          <p className="text-sm text-slate-500">Manage your earnings and request withdrawals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-600/20 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <p className="text-emerald-100 font-medium mb-1 relative z-10">Available Balance</p>
          <p className="text-4xl font-bold mb-6 relative z-10">Rs. {balance.available.toLocaleString()}</p>
          <button onClick={() => setPayoutModalOpen(true)} className="w-full py-2.5 bg-white text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-50 transition-colors relative z-10">
            Request Payout
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-medium text-slate-500">Pending Escrow</p>
            </div>
            <p className="text-xl font-bold text-slate-900">Rs. {balance.escrow.toLocaleString()}</p>
          </div>
          <p className="text-xs text-slate-500 mt-4">Funds held for upcoming/active shifts.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-medium text-slate-500">Total Earned</p>
            </div>
            <p className="text-xl font-bold text-slate-900">Rs. {balance.total_earned.toLocaleString()}</p>
          </div>
          <p className="text-xs text-slate-500 mt-4">Lifetime earnings on DocDuty.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
          <button onClick={() => { /* already showing all */ }} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View All</button>
        </div>

        {viewState === 'empty' ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No transactions yet</h3>
            <p className="text-slate-500 text-center max-w-sm">
              Your earnings and payouts will appear here once you complete shifts.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map(txn => (
              <div key={txn.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    txn.type === 'Earning' ? 'bg-emerald-100 text-emerald-600' :
                    txn.type === 'Payout' ? 'bg-blue-100 text-blue-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {txn.type === 'Earning' ? <ArrowDownRight className="w-5 h-5" /> : 
                     txn.type === 'Payout' ? <ArrowUpRight className="w-5 h-5" /> :
                     <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{txn.desc}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{txn.date}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        txn.status === 'Available' ? 'text-emerald-600' :
                        txn.status === 'Processing' ? 'text-amber-600' :
                        'text-slate-500'
                      }`}>{txn.status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-bold ${
                    txn.type === 'Earning' ? 'text-emerald-600' : 'text-slate-900'
                  }`}>{txn.amount}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout Modal */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Request Payout</h3>
              <button onClick={() => setPayoutModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex justify-between items-center p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-sm font-medium text-emerald-800">Available Balance</span>
                <span className="text-lg font-bold text-emerald-700">Rs. {balance.available.toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Withdrawal Amount (PKR)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 text-lg font-bold border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="0"
                    max="999999"
                  />
                  <span className="absolute left-4 top-3.5 text-slate-500 font-medium">Rs.</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500">Min. Rs. 5,000</span>
                  <button onClick={() => setPayoutAmount(String(balance.available))} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">Withdraw All</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Transfer Method</label>
                <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                      <Building2 className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">HBL Bank</p>
                      <p className="text-xs text-slate-500">**** **** 1234</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
              </div>

              <button 
                disabled={!payoutAmount || parseInt(payoutAmount) < 5000 || parseInt(payoutAmount) > balance.available || submitting}
                onClick={handlePayout}
                className={`w-full py-3 font-bold rounded-xl transition-colors shadow-sm ${
                  payoutAmount && parseInt(payoutAmount) >= 5000 && parseInt(payoutAmount) <= balance.available && !submitting
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Processing...' : 'Confirm Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
