import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Calendar, Clock, MapPin, 
  UserCircle, CheckCircle, AlertCircle, RefreshCw, XCircle, ChevronRight, ShieldCheck
} from 'lucide-react';
import { api } from '../lib/api';
import { BOOKING_STATUS_LABEL, getBookingTabColor } from '../lib/statusMaps';

type TabType = 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled' | 'No-show flagged';
type ViewState = 'loading' | 'empty' | 'error' | 'success';

const TABS: TabType[] = ['Upcoming', 'In Progress', 'Completed', 'Cancelled', 'No-show flagged'];

const TAB_TO_STATUS: Record<TabType, string> = {
  'Upcoming': 'confirmed',
  'In Progress': 'in_progress',
  'Completed': 'completed',
  'Cancelled': 'cancelled',
  'No-show flagged': 'no_show',
};

const STATUS_TO_TAB: Record<string, TabType> = Object.fromEntries(
  Object.entries(BOOKING_STATUS_LABEL).map(([k, v]) => [k, v as TabType])
) as Record<string, TabType>;

interface Booking {
  id: string;
  doctor: string;
  role: string;
  date: string;
  time: string;
  location: string;
  status: TabType;
  reliability: string;
}

export default function Bookings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('Upcoming');
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');

  const fetchBookings = useCallback(async () => {
    try {
      setViewState('loading');
      const data = await api.get('/bookings?limit=100');
      const mapped: Booking[] = (data.bookings || []).map((b: any) => {
        const start = b.start_time ? new Date(b.start_time) : null;
        const end = b.end_time ? new Date(b.end_time) : null;
        const dateStr = start ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
        const timeStr = start && end
          ? `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`
          : 'N/A';
        return {
          id: b.id,
          doctor: b.doctor_name || 'Unknown Doctor',
          role: b.specialty_name || b.shift_title || 'General',
          date: dateStr,
          time: timeStr,
          location: b.location_name || 'N/A',
          status: STATUS_TO_TAB[b.status] || 'Upcoming',
          reliability: b.doctor_reliability ? `${b.doctor_reliability}%` : 'N/A',
        };
      });
      setBookings(mapped);
      setViewState(mapped.length === 0 ? 'empty' : 'success');
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setViewState('error');
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filteredBookings = bookings.filter(b => {
    const matchesTab = b.status === activeTab;
    const matchesSearch = !searchQuery || 
      b.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !locationFilter || b.location === locationFilter;
    return matchesTab && matchesSearch && matchesLocation;
  });

  const getStatusColor = (status: string) => getBookingTabColor(status);

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading bookings...</p>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load bookings</h2>
        <p className="text-slate-500 text-center max-w-md">We encountered an error while fetching your bookings. Please try again.</p>
        <button onClick={() => fetchBookings()} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500">Manage all filled shifts and doctor assignments.</p>
        </div>
      </div>

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
                  {bookings.filter(b => b.status === tab).length}
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
              placeholder="Search by doctor name, role, or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary">
              <option value="">All Locations</option>
              {[...new Set(bookings.map(b => b.location).filter(Boolean))].map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
            {locationFilter && <button onClick={() => setLocationFilter('')} className="text-xs text-primary font-medium hover:underline">Clear</button>}
          </div>
        )}
      </div>

      {viewState === 'empty' || filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
            <UserCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No {activeTab.toLowerCase()} bookings</h3>
          <p className="text-slate-500 text-center max-w-sm mb-6">
            There are currently no bookings in this status.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <UserCircle className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{booking.doctor}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>Reliability: {booking.reliability}</span>
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{booking.role}</p>
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /> <span>{booking.date}</span></div>
                <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400" /> <span>{booking.time}</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> <span>{booking.location}</span></div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button onClick={() => navigate(`/facility/bookings/${booking.id}`)} className="w-full py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
                  View Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


