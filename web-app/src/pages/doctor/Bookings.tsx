import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, MapPin, ChevronRight, 
  CheckCircle, AlertCircle, RefreshCw, XCircle, Building2
} from 'lucide-react';
import { api } from '../../lib/api';
import type { ApiBooking, BookingsResponse } from '../../types/api';

type TabType = 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
type ViewState = 'loading' | 'empty' | 'error' | 'success';

const TABS: TabType[] = ['Upcoming', 'In Progress', 'Completed', 'Cancelled'];

const STATUS_TO_TAB: Record<string, TabType> = {
  confirmed: 'Upcoming', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
};

interface Booking {
  id: string;
  facility: string;
  role: string;
  date: string;
  time: string;
  location: string;
  status: TabType;
  pay: string;
}

export default function DoctorBookings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('Upcoming');
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [bookings, setBookings] = useState<Booking[]>([]);

  const fetchBookings = useCallback(async () => {
    try {
      setViewState('loading');
      const data = await api.get<BookingsResponse>('/bookings?limit=100');
      const mapped: Booking[] = (data.bookings || []).map((b: ApiBooking) => {
        const start = b.start_time ? new Date(b.start_time) : null;
        const end = b.end_time ? new Date(b.end_time) : null;
        return {
          id: b.id,
          facility: b.facility_name || 'Facility',
          role: b.specialty_name || b.shift_title || 'General',
          date: start ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
          time: start && end ? `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}` : 'N/A',
          location: b.location_name || 'N/A',
          status: STATUS_TO_TAB[b.status] || 'Upcoming',
          pay: `Rs. ${(b.payout_pkr || 0).toLocaleString()}`,
        };
      });
      setBookings(mapped);
      setViewState(mapped.length === 0 ? 'empty' : 'success');
    } catch (err) {
      setViewState('error');
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filteredBookings = bookings.filter(b => b.status === activeTab);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Upcoming': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'In Progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Cancelled': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
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
        <h2 className="text-xl font-bold text-slate-900">Connection Error</h2>
        <p className="text-slate-500 text-center max-w-md">Unable to load bookings. Please check your connection.</p>
        <button onClick={() => fetchBookings()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Bookings</h1>
        <p className="text-sm text-slate-500">Manage your upcoming and past shifts.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-5 py-3.5 text-sm font-medium border-b-2 transition-colors flex-1 text-center ${
                activeTab === tab 
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No {activeTab.toLowerCase()} bookings</h3>
          <p className="text-slate-500 text-center max-w-sm mb-6">
            You don't have any shifts in this status.
          </p>
          {activeTab === 'Upcoming' && (
            <Link to="/doctor" className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
              Find Shifts
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <div key={booking.id} onClick={() => navigate(`/doctor/bookings/${booking.id}`)} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 hover:border-emerald-300 transition-colors cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 mt-1">
                    <Building2 className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{booking.role}</h3>
                    <p className="text-sm text-slate-600">{booking.facility}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> <span>{booking.date}</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> <span>{booking.time}</span></div>
                <div className="flex items-center gap-2 col-span-2"><MapPin className="w-4 h-4 text-slate-400" /> <span className="truncate">{booking.location}</span></div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <p className="font-bold text-emerald-600">{booking.pay}</p>
                <div className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                  Details <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
