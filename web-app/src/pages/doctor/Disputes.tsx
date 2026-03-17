import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { 
  AlertTriangle, Search, Filter, 
  ChevronRight, RefreshCw, XCircle, Building2, Upload
} from 'lucide-react';
import { api } from '../../lib/api';
import { getErrorMessage } from '../../lib/support';
import type { ApiBooking, ApiDispute, DisputesResponse, BookingsResponse } from '../../types/api';

type ViewState = 'loading' | 'empty' | 'error' | 'success';

interface Dispute {
  id: string;
  bookingId: string;
  facility: string;
  type: string;
  status: string;
  date: string;
}

const STATUS_MAP: Record<string, string> = {
  open: 'Under Review', under_review: 'Under Review', resolved: 'Resolved', closed: 'Closed',
};

export default function DoctorDisputes() {
  const navigate = useNavigate();
  const toast = useToast();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [newDispute, setNewDispute] = useState({ booking_id: '', type: 'Payment Issue', description: '' });
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDisputes = useCallback(async () => {
    try {
      setViewState('loading');
      const data = await api.get<DisputesResponse>('/disputes?limit=50');
      const mapped: Dispute[] = (data.disputes || []).map((d: ApiDispute) => ({
        id: d.id,
        bookingId: d.booking_id || 'N/A',
        facility: d.respondent_name || 'Facility',
        type: d.type || 'General',
        status: STATUS_MAP[d.status] || d.status || 'Open',
        date: d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
      }));
      setDisputes(mapped);
      setViewState(mapped.length === 0 ? 'empty' : 'success');
    } catch (err) {
      setViewState('error');
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const data = await api.get<BookingsResponse>('/bookings?limit=50');
      setBookings(data.bookings || []);
    } catch (err) {
    }
  }, []);

  useEffect(() => { fetchDisputes(); fetchBookings(); }, [fetchDisputes, fetchBookings]);

  const handleCreateDispute = async () => {
    if (!newDispute.booking_id || !newDispute.description) return;
    try {
      setSubmitting(true);
      await api.post('/disputes', newDispute);
      setCreateModalOpen(false);
      setNewDispute({ booking_id: '', type: 'Payment Issue', description: '' });
      setEvidenceFiles([]);
      toast.success('Dispute created');
      fetchDisputes();
    } catch (err: unknown) {
      toast.error('Dispute Failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setEvidenceFiles(prev => [...prev, ...Array.from(files)]);
    }
    // Reset input so re-selecting the same file works
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const filteredDisputes = disputes.filter(d => {
    const matchesSearch = !search || d.id.toLowerCase().includes(search.toLowerCase()) || d.facility.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
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
        <h2 className="text-xl font-bold text-slate-900">Connection Error</h2>
        <p className="text-slate-500 text-center max-w-md">Unable to load disputes. Please check your connection.</p>
        <button onClick={() => fetchDisputes()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Disputes</h1>
          <p className="text-sm text-slate-500">Manage issues related to your bookings and payments.</p>
        </div>
        <button onClick={() => setCreateModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20">
          Raise New Dispute
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 bg-slate-50/50 border-b border-slate-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID or facility..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center justify-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${showFilters ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="px-4 pb-3 flex gap-3 flex-wrap border-b border-slate-200 bg-slate-50/50">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none">
              <option value="">All Statuses</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            {statusFilter && <button onClick={() => setStatusFilter('')} className="text-xs text-emerald-600 font-medium hover:underline">Clear</button>}
          </div>
        )}

        {viewState === 'empty' || filteredDisputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No active disputes</h3>
            <p className="text-slate-500 text-center max-w-sm">
              You haven't raised any disputes. If you have an issue with a booking, you can raise one here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDisputes.map(dispute => (
              <div key={dispute.id} onClick={() => navigate(`/doctor/disputes/${dispute.id}`)} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 mt-1">
                    <Building2 className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{dispute.type}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        dispute.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {dispute.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">{dispute.facility} • {dispute.bookingId}</p>
                    <p className="text-xs text-slate-500 mt-1">Raised on {dispute.date}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end sm:w-auto w-full border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                  <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                    View Details <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dispute Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Raise Dispute</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Booking</label>
                <select value={newDispute.booking_id} onChange={(e) => setNewDispute(p => ({ ...p, booking_id: e.target.value }))} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="">Select a booking...</option>
                  {bookings.map((b: ApiBooking) => (
                    <option key={b.id} value={b.id}>{b.id.slice(0, 8)} - {b.facility_name || 'Facility'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Dispute Type</label>
                <select value={newDispute.type} onChange={(e) => setNewDispute(p => ({ ...p, type: e.target.value }))} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option>Payment Issue</option>
                  <option>Duty Mismatch</option>
                  <option>Facility Issue</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea 
                  rows={4}
                  value={newDispute.description}
                  onChange={(e) => setNewDispute(p => ({ ...p, description: e.target.value }))}
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  placeholder="Please provide details about the issue..."
                ></textarea>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors"
                >
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <p className="text-sm font-medium text-slate-700">Upload Evidence (Optional)</p>
                  <p className="text-xs text-slate-500 mt-1">Screenshots, documents, etc.</p>
                </div>
                {evidenceFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {evidenceFiles.map((file, idx) => (
                      <div key={file.name} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm">
                        <span className="text-slate-700 truncate max-w-[200px]">{file.name}</span>
                        <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 ml-2 shrink-0">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                disabled={submitting || !newDispute.booking_id || !newDispute.description}
                onClick={handleCreateDispute}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
