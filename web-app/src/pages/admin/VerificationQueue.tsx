import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, CheckCircle, XCircle, Clock, 
  ChevronRight, FileText, UserCircle, Building2, RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

type Tab = 'doctors' | 'facilities';

export default function VerificationQueue() {
  const [activeTab, setActiveTab] = useState<Tab>('doctors');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'resubmit' | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [auditNote, setAuditNote] = useState('');
  const [reasonTemplate, setReasonTemplate] = useState('Blurry or unreadable document');
  const [submitting, setSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/verifications?status=pending_review');
      setItems(data.users || []);
    } catch (err) {
      console.error('Failed to fetch verifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const doctors = items.filter((u: any) => u.role === 'doctor');
  const facilities = items.filter((u: any) => u.role === 'facility_admin');
  const data = activeTab === 'doctors' ? doctors : facilities;
  const filteredData = data.filter((item: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = (item.full_name || item.facility_name || '').toLowerCase();
    const city = (item.city_name || '').toLowerCase();
    return name.includes(s) || city.includes(s) || item.id?.toLowerCase().includes(s);
  });

  const handleAction = async () => {
    if (!selectedItem || !actionModal) return;
    try {
      setSubmitting(true);
      const decision = actionModal === 'approve' ? 'verified' : 'rejected';
      const reason = actionModal !== 'approve' ? (reasonTemplate + (auditNote ? ` — ${auditNote}` : '')) : auditNote;
      await api.put(`/admin/verifications/${selectedItem.id}`, { decision, reason });
      setActionModal(null);
      setSelectedItem(null);
      setAuditNote('');
      fetchQueue();
    } catch (err) {
      console.error('Verification action failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading verification queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 flex flex-col h-[calc(100vh-6rem)]">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Verification Queue</h1>
        <p className="text-sm text-slate-500">Review and approve KYC and license documents.</p>
      </div>

      {!selectedItem ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          {/* Tabs & Filters */}
          <div className="border-b border-slate-200 bg-slate-50/50">
            <div className="flex border-b border-slate-200">
              <button 
                onClick={() => setActiveTab('doctors')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === 'doctors' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                Doctors ({doctors.length})
              </button>
              <button 
                onClick={() => setActiveTab('facilities')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === 'facilities' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                Facilities ({facilities.length})
              </button>
            </div>
            <div className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by name, ID, or city..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                />
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center justify-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                <Filter className="w-4 h-4" /> Filters
              </button>
            </div>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredData.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                    {activeTab === 'doctors' ? <UserCircle className="w-5 h-5 text-slate-500" /> : <Building2 className="w-5 h-5 text-slate-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{item.full_name || item.facility_name || item.phone}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        item.verification_status === 'pending_review' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {item.verification_status === 'pending_review' ? 'Pending' : item.verification_status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{item.id?.slice(0, 8)} • {item.city_name || 'N/A'} • {activeTab === 'doctors' ? (item.specialty_name || 'General') : 'Facility'}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Registered {new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Review Screen */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-base font-bold text-slate-900">Review: {selectedItem.full_name || selectedItem.facility_name || selectedItem.phone}</h2>
                <p className="text-xs text-slate-500">{selectedItem.id?.slice(0, 8)} • {activeTab === 'doctors' ? 'Doctor' : 'Facility'}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
              {selectedItem.verification_status === 'pending_review' ? 'Pending' : selectedItem.verification_status}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Profile Summary & Checklist */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Profile Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Name</span>
                    <span className="font-medium text-slate-900">{selectedItem.full_name || selectedItem.facility_name || selectedItem.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">City</span>
                    <span className="font-medium text-slate-900">{selectedItem.city_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">{activeTab === 'doctors' ? 'Specialty' : 'Type'}</span>
                    <span className="font-medium text-slate-900">{activeTab === 'doctors' ? (selectedItem.specialty_name || 'General') : 'Facility'}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-500">{activeTab === 'doctors' ? 'PMDC No.' : 'Reg. No.'}</span>
                    <span className="font-medium text-slate-900">{selectedItem.pmdc_license || selectedItem.registration_number || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Verification Checklist</h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Identity Document Matches</span>
                      <p className="text-xs text-slate-500">Name and photo match profile.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">License is Valid</span>
                      <p className="text-xs text-slate-500">Not expired, matches registry.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    <div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">No Disciplinary Actions</span>
                      <p className="text-xs text-slate-500">Checked against public records.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Document Viewer */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" /> Submitted Documents
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Identity (CNIC)</span>
                    <button onClick={() => toast.info('Document viewer will open here when document storage is configured')} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">View Full</button>
                  </div>
                  <div className="aspect-[3/2] flex items-center justify-center p-4">
                    <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 bg-white">
                      [Document Image Placeholder]
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Medical License</span>
                    <button onClick={() => toast.info('Document viewer will open here when document storage is configured')} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">View Full</button>
                  </div>
                  <div className="aspect-[3/2] flex items-center justify-center p-4">
                    <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 bg-white">
                      [Document Image Placeholder]
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row gap-3 justify-end">
            <button 
              onClick={() => setActionModal('reject')}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button 
              onClick={() => setActionModal('resubmit')}
              className="px-4 py-2 bg-white border border-amber-200 text-amber-700 text-sm font-bold rounded-lg hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" /> Request Resubmission
            </button>
            <button 
              onClick={() => setActionModal('approve')}
              className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 capitalize">{actionModal} Verification</h3>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              
              {actionModal !== 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason Template</label>
                  <select 
                    value={reasonTemplate}
                    onChange={(e) => setReasonTemplate(e.target.value)}
                    className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>Blurry or unreadable document</option>
                    <option>Document expired</option>
                    <option>Name mismatch</option>
                    <option>Other (specify below)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Audit Note (Internal)</label>
                <textarea 
                  rows={3}
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Add notes for the audit log..."
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setActionModal(null)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAction}
                  disabled={submitting}
                  className={`flex-1 py-3 text-white font-bold rounded-xl transition-colors shadow-sm ${
                    actionModal === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' :
                    actionModal === 'reject' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' :
                    'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  } ${submitting ? 'opacity-50' : ''}`}
                >
                  {submitting ? 'Processing...' : `Confirm ${actionModal}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
