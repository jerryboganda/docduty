import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, UserCircle, Building2, ChevronRight, 
  ShieldAlert, Activity, Star, Ban, Unlock, FileText, XCircle, RefreshCw, Loader2
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { getErrorMessage } from '../../lib/support';
import type { ApiUser, ApiBooking, UsersResponse, BookingsResponse } from '../../types/api';

type Tab = 'doctors' | 'facilities';

interface RecentBookingView {
  id: string;
  shortId: string;
  date: string;
  time: string;
  status: string;
}

interface UserView {
  id: string;
  fullId: string;
  name: string;
  specialty: string;
  city: string;
  status: string;
  rating: number;
  reliability: string;
  flags: number;
  type: string;
}

interface UserStats {
  totalBookings: number;
  noShows: number;
  recentBookings: RecentBookingView[];
}

export default function Users() {
  const toast = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('doctors');
  const [selectedUser, setSelectedUser] = useState<UserView | null>(null);
  const [actionModal, setActionModal] = useState<'suspend' | 'unsuspend' | null>(null);
  const [users, setUsers] = useState<{ doctors: UserView[]; facilities: UserView[] }>({ doctors: [], facilities: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [auditNote, setAuditNote] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<UsersResponse>('/admin/users');
      const allUsers = data.users || [];
      const doctors = allUsers.filter((u: ApiUser) => u.role === 'doctor').map((u: ApiUser) => ({
        id: u.id?.slice(0, 8) || u.id,
        fullId: u.id,
        name: u.full_name || 'Unknown',
        specialty: u.specialty || 'General',
        city: u.city || 'N/A',
        status: u.is_active === false ? 'Suspended' : 'Active',
        rating: u.rating || 0,
        reliability: u.reliability ? `${u.reliability}%` : 'N/A',
        flags: u.flags || 0,
        type: 'Doctor',
      }));
      const facilities = allUsers.filter((u: ApiUser) => u.role === 'facility_admin').map((u: ApiUser) => ({
        id: u.id?.slice(0, 8) || u.id,
        fullId: u.id,
        name: u.full_name || u.facility_name || 'Unknown',
        type: 'Facility',
        city: u.city || 'N/A',
        status: u.is_active === false ? 'Suspended' : 'Active',
        rating: u.rating || 0,
        reliability: u.reliability ? `${u.reliability}%` : 'N/A',
        flags: u.flags || 0,
        specialty: u.facility_type || 'Hospital',
      }));
      setUsers({ doctors, facilities });
    } catch (err: unknown) {
      toast.error('Failed to load users', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const fetchUserStats = useCallback(async (userId: string) => {
    try {
      setStatsLoading(true);
      // Fetch a large sample of bookings and filter client-side for this user
      const data = await api.get<BookingsResponse>(`/bookings?limit=500`);
      const allBookings = data.bookings || [];
      const userBookings = allBookings.filter((b: ApiBooking) => b.doctor_id === userId || b.poster_id === userId);
      const noShows = userBookings.filter((b: ApiBooking) => b.status === 'no_show').length;
      const recent = userBookings.slice(0, 5).map((b: ApiBooking) => ({
        id: b.id,
        shortId: b.id?.slice(0, 8) || b.id,
        date: b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        time: b.start_time && b.end_time 
          ? `${new Date(b.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
          : 'N/A',
        status: b.status || 'pending',
      }));
      setUserStats({ totalBookings: userBookings.length, noShows, recentBookings: recent });
    } catch (err: unknown) {
      toast.error('Failed to load booking stats');
      setUserStats({ totalBookings: 0, noShows: 0, recentBookings: [] });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUser?.fullId) {
      fetchUserStats(selectedUser.fullId);
    } else {
      setUserStats(null);
    }
  }, [selectedUser, fetchUserStats]);

  const data = users[activeTab].filter(u => {
    const matchesSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase()) || u.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = async () => {
    if (!selectedUser || !actionModal) return;
    try {
      await api.put(`/admin/users/${selectedUser.fullId}/status`, {
        action: actionModal,
        reason: auditNote,
      });
      setActionModal(null);
      setSelectedUser(null);
      setAuditNote('');
      toast.success('User action completed');
      fetchUsers();
    } catch (err: unknown) {
      toast.error('Action Failed', getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 flex flex-col h-[calc(100vh-6rem)]">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500">Manage doctors and facilities on the platform.</p>
      </div>

      {!selectedUser ? (
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
                Doctors ({users.doctors.length})
              </button>
              <button 
                onClick={() => setActiveTab('facilities')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === 'facilities' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                Facilities ({users.facilities.length})
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
            {showFilters && (
              <div className="px-4 pb-3 flex gap-3 flex-wrap border-b border-slate-200 bg-slate-50/50">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none">
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
                {statusFilter && <button onClick={() => setStatusFilter('')} className="text-xs text-indigo-600 font-medium hover:underline">Clear</button>}
              </div>
            )}
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {data.map((user) => (
              <div 
                key={user.id} 
                onClick={() => setSelectedUser(user)}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                    {activeTab === 'doctors' ? <UserCircle className="w-5 h-5 text-slate-500" /> : <Building2 className="w-5 h-5 text-slate-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{user.name}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {user.status}
                      </span>
                      {user.flags > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> {user.flags} Flags
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{user.id} • {user.city} • {activeTab === 'doctors' ? user.specialty : user.type}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {user.rating}</span>
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-indigo-400" /> {user.reliability} Reliability</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* User Detail Screen */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedUser.name}</h2>
                <p className="text-xs text-slate-500">{selectedUser.id} • {activeTab === 'doctors' ? 'Doctor' : 'Facility'}</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              selectedUser.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {selectedUser.status}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Left Column: Stats & Info */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Performance Summary */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Performance Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <p className="text-xs text-slate-500 font-medium">Rating</p>
                    <p className="text-xl font-black text-slate-900 mt-1 flex items-center justify-center gap-1">
                      {selectedUser.rating} <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <p className="text-xs text-slate-500 font-medium">Reliability</p>
                    <p className="text-xl font-black text-slate-900 mt-1 flex items-center justify-center gap-1">
                      {selectedUser.reliability} <Activity className="w-4 h-4 text-indigo-400" />
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <p className="text-xs text-slate-500 font-medium">Total Bookings</p>
                    <p className="text-xl font-black text-slate-900 mt-1">
                      {statsLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /> : (userStats?.totalBookings ?? '--')}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <p className="text-xs text-slate-500 font-medium">No-shows</p>
                    <p className="text-xl font-black text-slate-900 mt-1 text-red-600">
                      {statsLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /> : (userStats?.noShows ?? '--')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Flags */}
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Risk Flags ({selectedUser.flags})
                </h3>
                {selectedUser.flags > 0 ? (
                  <p className="text-sm text-amber-800">
                    This user has {selectedUser.flags} active flag{selectedUser.flags > 1 ? 's' : ''}. Review their booking history and disputes for details.
                  </p>
                ) : (
                  <p className="text-sm text-amber-700/70 italic">No active risk flags.</p>
                )}
              </div>

            </div>

            {/* Right Column: History & Actions */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate('/admin/verifications')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" /> View Documents
                </button>
                <button onClick={() => navigate('/admin/disputes')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  View Disputes
                </button>
                <button onClick={() => navigate('/admin/payments')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  View Payouts
                </button>
                <div className="flex-1"></div>
                {selectedUser.status === 'Active' ? (
                  <button 
                    onClick={() => setActionModal('suspend')}
                    className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Ban className="w-4 h-4" /> Suspend User
                  </button>
                ) : (
                  <button 
                    onClick={() => setActionModal('unsuspend')}
                    className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 text-sm font-bold rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" /> Unsuspend User
                  </button>
                )}
              </div>

              {/* Booking History */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Recent Bookings</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {statsLoading ? (
                    <div className="p-8 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                  ) : (userStats?.recentBookings || []).length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">No bookings found.</div>
                  ) : (
                    (userStats?.recentBookings || []).map((b) => (
                      <div key={b.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{b.shortId}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{b.date} &bull; {b.time}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          b.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          b.status === 'no_show' ? 'bg-red-50 text-red-700 border-red-200' :
                          b.status === 'cancelled' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 capitalize">{actionModal} User</h3>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              
              <div className={`p-4 rounded-xl border ${actionModal === 'suspend' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                <p className="text-sm font-medium">
                  {actionModal === 'suspend' 
                    ? `You are about to suspend ${selectedUser.name}. They will not be able to accept new shifts or log in.`
                    : `You are about to unsuspend ${selectedUser.name}. Their account will be fully restored.`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason / Audit Note</label>
                <textarea 
                  rows={3}
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Required for audit logs..."
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
                  className={`flex-1 py-3 text-white font-bold rounded-xl transition-colors shadow-sm ${
                    actionModal === 'suspend' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  Confirm {actionModal}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
