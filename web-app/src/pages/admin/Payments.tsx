import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, DollarSign, Download, ChevronRight, 
  CheckCircle, Clock, AlertTriangle, FileText, RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import { exportToCsv } from '../../lib/csv';

export default function PaymentsOversight() {
  const [selectedSettlement, setSelectedSettlement] = useState<any | null>(null);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/payouts');
      setSettlements((data.payouts || []).map((p: any) => ({
        id: p.id,
        shortId: p.id?.slice(0, 8),
        bookingId: p.wallet_id?.slice(0, 8) || 'N/A',
        facility: 'Platform',
        doctor: p.full_name || p.phone || 'Doctor',
        amount: p.amount_pkr || 0,
        status: p.status === 'completed' ? 'Settled' : p.status === 'processing' ? 'Processing' : p.status === 'failed' ? 'Failed' : 'Pending',
        date: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rawId: p.id,
      })));
    } catch (err) {
      console.error('Failed to fetch payouts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const filteredSettlements = settlements.filter(s => {
    if (statusFilter && s.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.shortId?.toLowerCase().includes(q) || s.doctor?.toLowerCase().includes(q) || s.facility?.toLowerCase().includes(q);
  });

  const handleRetry = async () => {
    if (!selectedSettlement) return;
    try {
      setRetrying(true);
      await api.put(`/admin/payouts/${selectedSettlement.rawId}/process`, { status: 'processing' });
      fetchPayouts();
      setSelectedSettlement(null);
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payments Oversight</h1>
          <p className="text-sm text-slate-500">Monitor escrow, settlements, and payout statuses.</p>
        </div>
        <button onClick={() => exportToCsv('docduty-payout-ledger.csv', settlements)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
          <Download className="w-4 h-4" /> Export Ledger
        </button>
      </div>

      {!selectedSettlement ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          {/* Filters */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by ID, facility, or doctor..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center justify-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>
          {showFilters && (
            <div className="px-4 pb-3 flex gap-3 flex-wrap border-b border-slate-200 bg-slate-50/50">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none">
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Settled">Settled</option>
                <option value="Failed">Failed</option>
              </select>
              {statusFilter && <button onClick={() => setStatusFilter('')} className="text-xs text-indigo-600 font-medium hover:underline">Clear</button>}
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredSettlements.map((settlement) => (
              <div 
                key={settlement.id} 
                onClick={() => setSelectedSettlement(settlement)}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${
                    settlement.status === 'Settled' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                    settlement.status === 'Failed' ? 'bg-red-50 border-red-200 text-red-600' :
                    settlement.status === 'Processing' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                    'bg-amber-50 border-amber-200 text-amber-600'
                  }`}>
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{settlement.id}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        settlement.status === 'Settled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        settlement.status === 'Failed' ? 'bg-red-50 text-red-700 border-red-200' :
                        settlement.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {settlement.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{settlement.facility} → {settlement.doctor}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {settlement.date} • {settlement.bookingId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-900">Rs {settlement.amount.toLocaleString()}</span>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Settlement Detail Screen */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedSettlement(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedSettlement.id}</h2>
                <p className="text-xs text-slate-500">{selectedSettlement.bookingId}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                selectedSettlement.status === 'Settled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                selectedSettlement.status === 'Failed' ? 'bg-red-50 text-red-700 border-red-200' :
                selectedSettlement.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {selectedSettlement.status}
              </span>
              <button onClick={() => { const data = selectedSettlement; if (data) { const blob = new Blob([`Receipt #${data.shortId}\nDoctor: ${data.doctor}\nFacility: ${data.facility}\nAmount: ${data.amount}\nStatus: ${data.status}\nDate: ${data.date}`], {type: 'text/plain'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `receipt-${data.shortId}.txt`; a.click(); URL.revokeObjectURL(url); }}} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <Download className="w-4 h-4" /> Receipt
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Left Column: Ledger */}
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> Ledger Breakdown
                </h3>
                
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Gross Shift Pay</span>
                    <span className="text-slate-900">Rs 15,000.00</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Platform Fee (10%)</span>
                    <span className="text-red-600">- Rs 1,500.00</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Facility Escrow Held</span>
                    <span className="text-slate-900">Rs 16,500.00</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Doctor Payout (Net)</span>
                    <span className="text-emerald-600">+ Rs 15,000.00</span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-base">
                    <span className="text-slate-900">Net Settlement</span>
                    <span className="text-slate-900">Rs 15,000.00</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Transaction Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Idempotency Key</span>
                    <span className="font-mono text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">idem_9x8c7v6b5n4m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gateway Ref</span>
                    <span className="font-mono text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">ch_1N4b5c6d7e8f9g0h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Initiated At</span>
                    <span className="text-slate-900">Feb 26, 2026 14:30:00 UTC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Status & Actions */}
            <div className="space-y-6">
              
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Payout Status</h3>
                
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-slate-900 text-sm">Escrow Funded</div>
                        <div className="text-xs text-slate-500">Feb 20</div>
                      </div>
                      <p className="text-xs text-slate-500">Facility payment secured.</p>
                    </div>
                  </div>
                  
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-slate-900 text-sm">Shift Completed</div>
                        <div className="text-xs text-slate-500">Feb 25</div>
                      </div>
                      <p className="text-xs text-slate-500">Attendance verified automatically.</p>
                    </div>
                  </div>

                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-amber-100 text-amber-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-amber-900 text-sm">Payout Processing</div>
                        <div className="text-xs text-amber-700">Pending</div>
                      </div>
                      <p className="text-xs text-amber-800">Transfer initiated to doctor's bank.</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedSettlement.status === 'Failed' && (
                <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                  <h3 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Failure Reason
                  </h3>
                  <p className="text-xs text-red-800 leading-relaxed mb-3">
                    Bank transfer rejected. Invalid account details provided by the doctor.
                  </p>
                  <button 
                    onClick={handleRetry}
                    disabled={retrying}
                    className={`w-full py-2 bg-white border border-red-200 text-red-700 text-sm font-bold rounded-lg hover:bg-red-100 transition-colors ${retrying ? 'opacity-50' : ''}`}>
                    {retrying ? 'Retrying...' : 'Retry Payout'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
