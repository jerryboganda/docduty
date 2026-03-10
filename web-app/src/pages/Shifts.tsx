import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { 
  Search, Filter, MoreVertical, Calendar, Clock, MapPin, 
  DollarSign, Users, AlertCircle, CheckCircle, XCircle, 
  RefreshCw, Plus, ChevronRight, Edit, Trash2, Eye
} from 'lucide-react';
import { api } from '../lib/api';
import { SHIFT_STATUS_TAB, getShiftTabColor } from '../lib/statusMaps';

type TabType = 'Drafts' | 'Open' | 'In Dispatch' | 'Filled' | 'Completed' | 'Cancelled';
type ViewState = 'loading' | 'empty' | 'error' | 'success';

const TABS: TabType[] = ['Open', 'In Dispatch', 'Filled', 'Drafts', 'Completed', 'Cancelled'];

interface ShiftItem {
  id: string;
  title: string;
  dept: string;
  date: string;
  time: string;
  location: string;
  pay: string;
  status: string;
  applicants: number;
  doctor?: string;
}

export default function Shifts() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('Open');
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [shiftToCancel, setShiftToCancel] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState('');

  const loadShifts = useCallback(async () => {
    setViewState('loading');
    try {
      const data = await api.get<any>('/shifts');
      const rawShifts = data?.shifts || data || [];
      const mapped: ShiftItem[] = (Array.isArray(rawShifts) ? rawShifts : []).map((s: any) => {
        const start = s.start_time ? new Date(s.start_time) : null;
        const end = s.end_time ? new Date(s.end_time) : null;
        const statusMap = SHIFT_STATUS_TAB;
        return {
          id: s.id,
          title: s.role || 'Shift',
          dept: s.department || s.type || 'General',
          date: start ? start.toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
          time: start && end ? `${start.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}` : 'TBD',
          location: s.location_name || 'Facility',
          pay: s.offered_rate ? `Rs. ${Number(s.offered_rate).toLocaleString()}` : 'TBD',
          status: statusMap[s.status] || s.status || 'Open',
          applicants: s.offers_count || 0,
          doctor: s.doctor_name,
        };
      });
      
      setShifts(mapped);
      setViewState(mapped.length === 0 ? 'empty' : 'success');
    } catch {
      setViewState('error');
    }
  }, []);

  useEffect(() => { loadShifts(); }, [loadShifts]);

  const filteredShifts = shifts.filter(s => {
    if (s.status !== activeTab) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.dept.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.location.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCancelClick = (id: string) => {
    setShiftToCancel(id);
    setCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!shiftToCancel) return;
    try {
      await api.put(`/shifts/${shiftToCancel}/cancel`);
      setCancelModalOpen(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      loadShifts();
    } catch (err: any) {
      setCancelModalOpen(false);
      toast.error('Failed to cancel shift', err.message || 'Please try again');
    }
  };

  const getStatusColor = (status: string) => getShiftTabColor(status);

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading shifts...</p>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load shifts</h2>
        <p className="text-slate-500 text-center max-w-md">We encountered an error while fetching your shifts. Please try again.</p>
        <button onClick={loadShifts} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manage Shifts</h1>
          <p className="text-sm text-slate-500">View and manage all your facility's shift postings.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/facility/post" className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Post New Shift
          </Link>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex overflow-x-auto hide-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab 
                    ? 'border-primary text-primary bg-primary/5' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab}
                <span className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-500'
                }`}>
                  {shifts.filter(s => s.status === tab).length}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 flex flex-col sm:flex-row gap-3 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by role, department, or ID..." 
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
            <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary">
              <option value="">All Urgencies</option>
              <option value="urgent">Urgent</option>
              <option value="standard">Standard</option>
            </select>
            {urgencyFilter && <button onClick={() => setUrgencyFilter('')} className="text-xs text-primary font-medium hover:underline">Clear</button>}
          </div>
        )}
      </div>

      {/* Content Area */}
      {viewState === 'empty' || filteredShifts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No {activeTab.toLowerCase()} shifts</h3>
          <p className="text-slate-500 text-center max-w-sm mb-6">
            You don't have any shifts in this category right now.
          </p>
          {activeTab === 'Open' && (
            <Link to="/facility/post" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
              Post a Shift
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="p-4">Shift Details</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Location & Pay</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Applicants</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredShifts.map(shift => (
                  <tr key={shift.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{shift.title}</span>
                        <span className="text-xs text-slate-500">{shift.dept} • {shift.id}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col text-sm text-slate-600">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {shift.date}</span>
                        <span className="flex items-center gap-1.5 mt-0.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {shift.time}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col text-sm text-slate-600">
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {shift.location}</span>
                        <span className="flex items-center gap-1.5 mt-0.5 font-medium text-slate-900"><DollarSign className="w-3.5 h-3.5 text-slate-400" /> {shift.pay}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(shift.status)}`}>
                        {shift.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {shift.doctor ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span className="text-sm font-medium text-slate-900">{shift.doctor}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          <Users className="w-4 h-4 text-slate-400" />
                          {shift.applicants} Offers
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/facility/shifts/${shift.id}`)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {(shift.status === 'Drafts' || shift.status === 'Open') && (
                          <button onClick={() => navigate(`/facility/shifts/${shift.id}`)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {['Drafts', 'Open', 'In Dispatch'].includes(shift.status) && (
                          <button onClick={() => handleCancelClick(shift.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Cancel Shift">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredShifts.map(shift => (
              <div key={shift.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1.5 border ${getStatusColor(shift.status)}`}>
                      {shift.status}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{shift.title}</h3>
                    <p className="text-xs text-slate-500">{shift.dept} • {shift.id}</p>
                  </div>
                  <button onClick={() => navigate(`/facility/shifts/${shift.id}`)} className="p-1 text-slate-400 hover:text-slate-600">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{shift.date}</span></div>
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{shift.time}</span></div>
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{shift.location}</span></div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-900"><DollarSign className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{shift.pay}</span></div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  {shift.doctor ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-slate-900">{shift.doctor}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      <Users className="w-4 h-4 text-slate-400" />
                      {shift.applicants} Offers
                    </div>
                  )}
                  <button onClick={() => navigate(`/facility/shifts/${shift.id}`)} className="text-sm font-medium text-primary flex items-center gap-1">
                    Details <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Shift?</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to cancel shift <strong>{shiftToCancel}</strong>? This action cannot be undone and may incur cancellation fees if within 24 hours.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setCancelModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Keep Shift
                </button>
                <button 
                  onClick={confirmCancel}
                  className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  Cancel Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">Shift cancelled successfully.</span>
        </div>
      )}
    </div>
  );
}


