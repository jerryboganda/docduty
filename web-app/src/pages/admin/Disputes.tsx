import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, AlertTriangle, ChevronRight, Clock, 
  MessageSquare, MapPin, QrCode, ShieldAlert, CheckCircle, XCircle, DollarSign, RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../lib/support';
import type { ApiDispute, ApiAttendanceEvent, DisputesResponse } from '../../types/api';

export default function DisputesCenter() {
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedDispute, setSelectedDispute] = useState<ApiDispute | null>(null);
  const [selectedDisputeDetail, setSelectedDisputeDetail] = useState<ApiDispute | null>(null);
  const [actionModal, setActionModal] = useState<'resolve' | 'moreInfo' | null>(null);
  const [disputes, setDisputes] = useState<ApiDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilterValue, setStatusFilterValue] = useState('');
  const [resolutionOutcome, setResolutionOutcome] = useState('full_refund');
  const [financialAdj, setFinancialAdj] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [auditNote, setAuditNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<DisputesResponse>('/disputes');
      setDisputes(data.disputes || []);
    } catch (err: unknown) {
      toast.error('Failed to load disputes', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  useEffect(() => {
    if (!selectedDispute?.id) {
      setSelectedDisputeDetail(null);
      return;
    }
    (async () => {
      try {
        const detail = await api.get<ApiDispute>(`/disputes/${selectedDispute.id}`);
        setSelectedDisputeDetail(detail);
      } catch {
        toast.error('Failed to load dispute details');
        setSelectedDisputeDetail(null);
      }
    })();
  }, [selectedDispute?.id]);

  const filteredDisputes = disputes.filter((d: ApiDispute) => {
    if (!search && !statusFilterValue) return true;
    const s = search.toLowerCase();
    const matchesSearch = !search || (d.id || '').toLowerCase().includes(s) || (d.type || '').toLowerCase().includes(s) ||
      (d.raised_by_phone || '').includes(s);
    const matchesStatus = !statusFilterValue || d.status === statusFilterValue;
    return matchesSearch && matchesStatus;
  });

  const handleConfirmAction = async () => {
    if (!selectedDispute) return;
    try {
      setSubmitting(true);
      if (actionModal === 'resolve') {
        const mergedNotes = [resolutionNotes, auditNote ? `[Audit] ${auditNote}` : ''].filter(Boolean).join('\n\n');
        await api.put(`/disputes/${selectedDispute.id}/resolve`, {
          resolutionType: resolutionOutcome,
          resolutionNotes: mergedNotes || null,
          ...(financialAdj ? { financialAdjustment: parseFloat(financialAdj) } : {}),
        });
      } else {
        await api.put(`/disputes/${selectedDispute.id}/review`);
        if (resolutionNotes.trim()) {
          await api.post(`/disputes/${selectedDispute.id}/evidence`, {
            type: 'text',
            content: resolutionNotes.trim(),
          });
        }
      }
      setActionModal(null);
      setSelectedDispute(null);
      setResolutionNotes('');
      setAuditNote('');
      setFinancialAdj('');
      fetchDisputes();
    } catch (err: unknown) {
      toast.error('Action failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const priorityFromStatus = (status: string) => {
    if (status === 'open') return 'High';
    if (status === 'under_review') return 'Medium';
    return 'Low';
  };

  const statusLabel = (status: string) => {
    if (status === 'open') return 'Open';
    if (status === 'under_review') return 'In Progress';
    if (status === 'resolved') return 'Resolved';
    return status;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading disputes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 flex flex-col h-[calc(100vh-6rem)]">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Disputes Center</h1>
        <p className="text-sm text-slate-500">Manage and resolve conflicts between facilities and doctors.</p>
      </div>

      {!selectedDispute ? (
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
              <select value={statusFilterValue} onChange={(e) => setStatusFilterValue(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none">
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
              </select>
              {statusFilterValue && <button onClick={() => setStatusFilterValue('')} className="text-xs text-indigo-600 font-medium hover:underline">Clear</button>}
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredDisputes.map((dispute) => {
              const priority = priorityFromStatus(dispute.status);
              const status = statusLabel(dispute.status);
              return (
              <div 
                key={dispute.id} 
                onClick={() => setSelectedDispute(dispute)}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 mt-1 ${
                    priority === 'High' ? 'bg-red-50 border-red-200 text-red-600' :
                    priority === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                    'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{dispute.id?.slice(0, 8)} • {dispute.type}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        status === 'Open' ? 'bg-red-50 text-red-700 border-red-200' :
                        status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Booking {dispute.booking_id?.slice(0, 8)} • {dispute.raised_by_phone || 'Unknown'}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(dispute.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Dispute Detail Screen */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedDispute(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedDispute.id?.slice(0, 8)} • {selectedDispute.type}</h2>
                <p className="text-xs text-slate-500">{selectedDispute.booking_id?.slice(0, 8)}</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              statusLabel(selectedDispute.status) === 'Open' ? 'bg-red-50 text-red-700 border-red-200' :
              statusLabel(selectedDispute.status) === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {statusLabel(selectedDispute.status)}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Left Column: Details & Evidence */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Dispute Summary */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Issue Description</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {selectedDisputeDetail?.description || 'No dispute description provided.'}
                  <br /><br />
                  <span className="text-xs font-bold text-slate-500">— Submitted by {selectedDispute.raised_by_phone || 'User'}</span>
                </p>
              </div>

              {/* Evidence Panel */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" /> Evidence & Telemetry
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  
                  {/* Geofence & QR */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-red-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 mb-1">Geofence Status</p>
                        <p className="text-xs text-slate-600">{selectedDisputeDetail?.attendanceEvents?.some((e: ApiAttendanceEvent) => e.geo_valid) ? 'At least one attendance event passed geofence validation.' : 'No attendance event passed geofence validation.'}</p>
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-start gap-3">
                      <QrCode className="w-5 h-5 text-red-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 mb-1">QR Scan</p>
                        <p className="text-xs text-slate-600">{selectedDisputeDetail?.attendanceEvents?.some((e: ApiAttendanceEvent) => e.qr_valid) ? 'Successful QR validation exists for this booking.' : 'No successful QR validation was recorded for this booking.'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Transcript Link */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-indigo-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">Booking Chat Transcript</p>
                        <p className="text-xs text-slate-500">Review conversation via role-specific booking messages.</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">No admin chat route</span>
                  </div>

                  {/* Timeline */}
                  <div className="border border-slate-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">System Timeline</h4>
                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-slate-300 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-2 rounded border border-slate-100 bg-slate-50 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-bold text-slate-900 text-xs">Shift Start Time</div>
                            <div className="text-[10px] text-slate-500">{selectedDisputeDetail?.start_time ? new Date(selectedDisputeDetail.start_time).toLocaleTimeString() : 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-red-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-2 rounded border border-red-100 bg-red-50 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-bold text-red-900 text-xs">{selectedDisputeDetail?.attendanceEvents?.some((e: ApiAttendanceEvent) => e.event_type === 'check_in') ? 'Check-in Recorded' : 'Check-in Window Missed'}</div>
                            <div className="text-[10px] text-red-700">{selectedDisputeDetail?.check_in_time ? new Date(selectedDisputeDetail.check_in_time).toLocaleTimeString() : 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Right Column: Resolution & Actions */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Resolution Form */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Resolution Actions</h3>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => setActionModal('moreInfo')}
                    className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Request More Info
                  </button>
                  
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-slate-500">Or</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActionModal('resolve')}
                    className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Resolve Dispute
                  </button>
                </div>
              </div>

              {/* Resolution Summary */}
              {selectedDispute.status === 'resolved' && (
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                  <h3 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Resolution Summary
                  </h3>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {selectedDisputeDetail?.resolution_notes || `Dispute resolved with outcome: ${selectedDisputeDetail?.resolution_type || 'N/A'}.`}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-2 font-medium">— Resolved on {selectedDisputeDetail?.resolved_at ? new Date(selectedDisputeDetail.resolved_at).toLocaleString() : 'N/A'}</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 capitalize">
                {actionModal === 'resolve' ? 'Resolve Dispute' : 'Request Info'}
              </h3>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              
              {actionModal === 'resolve' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Resolution Outcome</label>
                    <select 
                      value={resolutionOutcome}
                      onChange={(e) => setResolutionOutcome(e.target.value)}
                      className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="full_refund">Favor Facility (Full Refund)</option>
                      <option value="penalty">Favor Facility (Penalty + Adjustment)</option>
                      <option value="full_payout">Favor Doctor (Full Payout)</option>
                      <option value="partial_payout">Partial Payout</option>
                      <option value="partial_refund">Partial Refund</option>
                      <option value="dismissed">Dismiss</option>
                      <option value="no_action">No Action</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Financial Adjustment (Optional)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="number" 
                        placeholder="0.00"
                        value={financialAdj}
                        onChange={(e) => setFinancialAdj(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {actionModal === 'resolve' ? 'Resolution Notes (Sent to both parties)' : 'Message to Parties'}
                </label>
                <textarea 
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Explain the decision or what information is needed..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Audit Note (Internal Only)</label>
                <input 
                  type="text"                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}                  className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Required for audit logs..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setActionModal(null)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmAction}
                  disabled={submitting}
                  className={`flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 ${submitting ? 'opacity-50' : ''}`}
                >
                  {submitting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
