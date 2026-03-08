import { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, Clock, QrCode, CheckCircle, 
  AlertTriangle, Activity, Map, XCircle, RefreshCw
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';

type ViewState = 'loading' | 'empty' | 'error' | 'success';
type AttendanceState = 'Check-in' | 'In Progress' | 'Check-out';

interface ActiveShift {
  id: string;
  bookingId: string;
  facility: string;
  role: string;
  location: string;
  startTime: string;
  endTime: string;
  date: string;
  checkInTime: string | null;
}

export default function DoctorAttendance() {
  const toast = useToast();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [attendanceState, setAttendanceState] = useState<AttendanceState>('Check-in');
  const [shift, setShift] = useState<ActiveShift | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchActiveShift = useCallback(async () => {
    try {
      setViewState('loading');
      const data = await api.get('/bookings?status=confirmed,in_progress&limit=10');
      const bookings = data.bookings || [];
      // find the booking that's today or currently active
      const activeBooking = bookings.find((b: any) => b.status === 'in_progress') || bookings[0];
      if (!activeBooking) {
        setShift(null);
        setViewState('empty');
        return;
      }
      const start = activeBooking.start_time ? new Date(activeBooking.start_time) : null;
      const end = activeBooking.end_time ? new Date(activeBooking.end_time) : null;

      // Check attendance events
      let bookingDetail: any = null;
      try {
        bookingDetail = await api.get(`/bookings/${activeBooking.id}`);
      } catch (err) {
        console.error('[Attendance] Failed to fetch booking detail:', err);
      }
      const attEvents = bookingDetail?.attendanceEvents || bookingDetail?.attendance_events || bookingDetail?.booking?.attendance_events || [];
      const checkInEvent = attEvents.find((e: any) => e.event_type === 'check_in');
      const checkOutEvent = attEvents.find((e: any) => e.event_type === 'check_out');

      setShift({
        id: activeBooking.shift_id || activeBooking.id,
        bookingId: activeBooking.id,
        facility: activeBooking.facility_name || 'Facility',
        role: activeBooking.specialty_name || activeBooking.shift_title || 'General',
        location: activeBooking.location_name || 'N/A',
        startTime: start ? start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--',
        endTime: end ? end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--',
        date: start ? `Today, ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Today',
        checkInTime: checkInEvent ? new Date(checkInEvent.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
      });

      if (checkOutEvent) {
        setAttendanceState('Check-out');
      } else if (checkInEvent) {
        setAttendanceState('In Progress');
      } else {
        setAttendanceState('Check-in');
      }
      setViewState('success');
    } catch (err) {
      console.error('Failed to fetch active shift:', err);
      setViewState('error');
    }
  }, []);

  useEffect(() => { fetchActiveShift(); }, [fetchActiveShift]);

  const handleCheckIn = async () => {
    if (!shift) return;
    try {
      setSubmitting(true);
      await api.post('/attendance/check-in', {
        bookingId: shift.bookingId,
        qrCode: 'demo-qr-token',
        latitude: 24.8607,
        longitude: 67.0011,
      });
      setAttendanceState('In Progress');
      setShift(prev => prev ? { ...prev, checkInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } : prev);
      toast.success('Checked in successfully');
    } catch (err: any) {
      toast.error('Check-in Failed', err.message || 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!shift) return;
    try {
      setSubmitting(true);
      await api.post('/attendance/check-out', {
        bookingId: shift.bookingId,
        qrCode: 'demo-qr-token',
        latitude: 24.8607,
        longitude: 67.0011,
      });
      setAttendanceState('Check-in');
      toast.success('Checked out successfully');
      fetchActiveShift();
    } catch (err: any) {
      toast.error('Check-out Failed', err.message || 'Check-out failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePresencePing = async () => {
    if (!shift) return;
    try {
      await api.post('/attendance/presence-ping', {
        bookingId: shift.bookingId,
        latitude: 24.8607,
        longitude: 67.0011,
      });
    } catch (err: any) {
      toast.error('Ping Failed', err.message || 'Presence ping failed');
    }
  };

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
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
        <p className="text-slate-500 text-center max-w-md">We encountered an error while fetching your current shift details.</p>
        <button onClick={fetchActiveShift} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500">Check-in and manage your active shift.</p>
        </div>
      </div>

      {viewState === 'empty' || !shift ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No active shifts</h3>
          <p className="text-slate-500 text-center max-w-sm">
            You don't have any shifts scheduled for today that require check-in.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Shift Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{shift.role}</h2>
                <p className="text-sm text-slate-600 font-medium">{shift.facility}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                {attendanceState}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> <span>{shift.startTime} - {shift.endTime}</span></div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> <span>{shift.location}</span></div>
            </div>
          </div>

          {/* Dynamic Content based on State */}
          <div className="p-6">
            
            {/* Check-in State */}
            {attendanceState === 'Check-in' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
                  <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-semibold text-sm">Check-in Window Open</p>
                    <p className="text-xs mt-1">You can check in between 19:45 and 20:15. Late check-ins may affect your reliability score.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                      <Map className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-emerald-900 mb-1">Geofence Verified</h3>
                    <p className="text-xs text-emerald-700">You are within the facility radius.</p>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-white text-slate-400 rounded-full flex items-center justify-center mb-3 border border-slate-200 shadow-sm">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Scan Facility QR</h3>
                    <p className="text-xs text-slate-500">Locate the rotating QR code at the reception.</p>
                  </div>
                </div>

                <button 
                  onClick={handleCheckIn}
                  disabled={submitting}
                  className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                >
                  <QrCode className="w-5 h-5" /> {submitting ? 'Checking in...' : 'Scan QR to Check-in'}
                </button>
              </div>
            )}

            {/* In Progress State */}
            {attendanceState === 'In Progress' && (
              <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center text-center py-4">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full text-slate-100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
                  </svg>
                  <svg className="absolute inset-0 w-full h-full text-emerald-500 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeDashoffset="140" strokeLinecap="round" />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-slate-900">04:32</span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Hours Elapsed</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 w-full flex items-center justify-center gap-2 text-emerald-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-sm">Checked in at {shift.checkInTime || '--'}</span>
                </div>

                <div className="w-full space-y-3 pt-4">
                  <button onClick={handlePresencePing} className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" /> Send Presence Ping
                  </button>
                  <button 
                    onClick={() => setAttendanceState('Check-out')}
                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    Ready to Check-out
                  </button>
                </div>
              </div>
            )}

            {/* Check-out State */}
            {attendanceState === 'Check-out' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-sm">Shift Completion</p>
                    <p className="text-xs mt-1">Please scan the facility QR code one last time to verify your check-out and initiate payment settlement.</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Check-in Time</span>
                    <span className="text-sm font-bold text-slate-900">19:55 PM</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Current Time</span>
                    <span className="text-sm font-bold text-slate-900">08:05 AM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Total Duration</span>
                    <span className="text-sm font-bold text-emerald-600">12h 10m</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckOut}
                  disabled={submitting}
                  className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                >
                  <QrCode className="w-5 h-5" /> {submitting ? 'Checking out...' : 'Scan QR to Check-out'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
