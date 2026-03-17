import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Clock, MapPin, 
  UserCircle, CheckCircle, RefreshCw, XCircle, ChevronRight,
  Map, QrCode
} from 'lucide-react';
import { api } from '../lib/api';
import type { ApiBooking, BookingsResponse } from '../types/api';

type ViewState = 'loading' | 'empty' | 'error' | 'success';

interface AttendanceRecord {
  id: string;
  doctor: string;
  shift: string;
  location: string;
  startTime: string;
  status: string;
  geo: string;
  qr: string;
  bookingId: string;
}

export default function Attendance() {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAttendance = useCallback(async () => {
    try {
      setViewState('loading');
      // Get bookings that are confirmed or in progress (today's attendance)
      const data = await api.get<BookingsResponse>('/bookings?limit=100');
      const mapped: AttendanceRecord[] = (data.bookings || [])
        .filter((b: ApiBooking) => ['confirmed', 'in_progress'].includes(b.status))
        .map((b: ApiBooking) => {
          const start = b.start_time ? new Date(b.start_time) : null;
          const hasCheckIn = b.status === 'in_progress';
          // NOTE: Geo/QR verification status is derived from booking status (in_progress implies check-in occurred).
          // The /bookings list endpoint does not return individual attendance_events with geo_valid/qr_valid fields.
          // For precise verification data, the booking detail page fetches attendance events directly.
          const checkedInVerified = Boolean(b.checkin_verified);
          return {
            id: b.id,
            doctor: b.doctor_name || 'Unknown Doctor',
            shift: b.specialty_name || b.shift_title || 'General',
            location: b.location_name || 'N/A',
            startTime: start ? start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A',
            status: hasCheckIn ? 'Checked In' : 'Pending',
            geo: checkedInVerified ? 'Verified' : hasCheckIn ? 'Pending Verification' : 'Not Scanned',
            qr: checkedInVerified ? 'Verified' : hasCheckIn ? 'Pending Verification' : 'Not Scanned',
            bookingId: b.id,
          };
        });
      setRecords(mapped);
      setViewState(mapped.length === 0 ? 'empty' : 'success');
    } catch (err) {
      setViewState('error');
    }
  }, []);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const filteredRecords = records.filter(r => {
    const matchesSearch = !searchQuery || 
      r.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.shift.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Checked In': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Checked Out': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pending': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Issue Flagged': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading attendance data...</p>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load attendance</h2>
        <p className="text-slate-500 text-center max-w-md">We encountered an error while fetching today's attendance records.</p>
        <button onClick={() => fetchAttendance()} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Today's Attendance</h1>
          <p className="text-sm text-slate-500">View real-time check-in and check-out statuses for your facility.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 bg-slate-50/50 border-b border-slate-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by doctor name or shift..." 
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
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary">
              <option value="">All Statuses</option>
              <option value="Checked In">Checked In</option>
              <option value="Pending">Pending</option>
            </select>
            {statusFilter && <button onClick={() => setStatusFilter('')} className="text-xs text-primary font-medium hover:underline">Clear</button>}
          </div>
        )}

        {viewState === 'empty' || filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No attendance records today</h3>
            <p className="text-slate-500 text-center max-w-sm">
              There are no shifts scheduled for today, or no doctors have checked in yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredRecords.map(record => (
              <div key={record.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0 border border-slate-200">
                    <UserCircle className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{record.doctor}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">{record.shift}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Start: {record.startTime}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {record.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-auto w-full border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Map className={`w-3.5 h-3.5 ${record.geo === 'Verified' ? 'text-emerald-500' : record.geo === 'Not Verified' ? 'text-red-500' : 'text-slate-400'}`} />
                      <span className={record.geo === 'Verified' ? 'text-emerald-700' : record.geo === 'Not Verified' ? 'text-red-700' : 'text-slate-500'}>
                        Geo: {record.geo}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <QrCode className={`w-3.5 h-3.5 ${record.qr === 'Verified' ? 'text-emerald-500' : record.qr === 'Invalid' ? 'text-red-500' : 'text-slate-400'}`} />
                      <span className={record.qr === 'Verified' ? 'text-emerald-700' : record.qr === 'Invalid' ? 'text-red-700' : 'text-slate-500'}>
                        QR: {record.qr}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/facility/attendance/${record.id}`)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View Details">
                    <ChevronRight className="w-5 h-5" />
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

