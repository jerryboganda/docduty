import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, AlertTriangle, 
  ChevronRight, CheckCircle, XCircle, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import type { ApiDispute, DisputesResponse } from '../types/api';

type ViewState = 'loading' | 'empty' | 'error' | 'success';

interface Dispute {
  id: string;
  type: string;
  booking: string;
  doctor: string;
  date: string;
  status: string;
}

const STATUS_MAP: Record<string, string> = {
  open: 'Open', under_review: 'Under Review', resolved: 'Resolved', escalated: 'Escalated',
};

export default function Disputes() {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchDisputes = useCallback(async () => {
    try {
      setViewState('loading');
      const data = await api.get<DisputesResponse>('/disputes?limit=100');
      const mapped: Dispute[] = (data.disputes || []).map((d: ApiDispute) => ({
        id: d.id.substring(0, 8).toUpperCase(),
        type: d.type || 'General',
        booking: d.booking_id ? d.booking_id.substring(0, 8).toUpperCase() : 'N/A',
        doctor: d.respondent_name || 'Unknown',
        date: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: STATUS_MAP[d.status] || d.status,
      }));
      setDisputes(mapped);
      setViewState(mapped.length === 0 ? 'empty' : 'success');
    } catch (err) {
      setViewState('error');
    }
  }, []);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Open': return 'bg-red-100 text-red-700 border-red-200';
      case 'Under Review': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading disputes...</p>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load disputes</h2>
        <p className="text-slate-500 text-center max-w-md">We encountered an error while fetching your dispute cases.</p>
        <button onClick={() => fetchDisputes()} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dispute Center</h1>
          <p className="text-sm text-slate-500">Manage and track issues related to shifts and attendance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/facility/bookings" className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
            <AlertTriangle className="w-4 h-4" />
            Create Dispute
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 bg-slate-50/50 border-b border-slate-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID, doctor, or booking..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="">All Types</option>
              <option value="No-show">No-show</option>
              <option value="Late Arrival">Late Arrival</option>
              <option value="Duty Mismatch">Duty Mismatch</option>
              <option value="Facility Issue">Facility Issue</option>
              <option value="Payment">Payment</option>
            </select>
          </div>
        </div>

        {(() => {
          const filtered = disputes.filter(d => {
            const matchesSearch = !searchQuery || d.id.toLowerCase().includes(searchQuery.toLowerCase()) || d.doctor.toLowerCase().includes(searchQuery.toLowerCase()) || d.booking.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = !statusFilter || d.status === statusFilter;
            const matchesType = !typeFilter || d.type.toLowerCase().includes(typeFilter.toLowerCase());
            return matchesSearch && matchesStatus && matchesType;
          });
          return filtered;
        })().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No active disputes</h3>
            <p className="text-slate-500 text-center max-w-sm">
              Great job! You don't have any open disputes right now.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {disputes.filter(d => {
              const matchesSearch = !searchQuery || d.id.toLowerCase().includes(searchQuery.toLowerCase()) || d.doctor.toLowerCase().includes(searchQuery.toLowerCase()) || d.booking.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesStatus = !statusFilter || d.status === statusFilter;
              const matchesType = !typeFilter || d.type.toLowerCase().includes(typeFilter.toLowerCase());
              return matchesSearch && matchesStatus && matchesType;
            }).map(dispute => (
              <div key={dispute.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                    dispute.status === 'Resolved' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                  }`}>
                    {dispute.status === 'Resolved' ? (
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{dispute.id} • {dispute.type}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(dispute.status)}`}>
                        {dispute.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">Booking: {dispute.booking} • {dispute.doctor}</p>
                    <p className="text-xs text-slate-500 mt-1">Filed on {dispute.date}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 sm:w-auto w-full border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                  <button onClick={() => navigate(`/facility/disputes/${dispute.id}`)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                    View Case <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

