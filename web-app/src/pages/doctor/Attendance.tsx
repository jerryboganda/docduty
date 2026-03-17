import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MapPin, Clock, QrCode, CheckCircle, 
  AlertTriangle, Activity, Map, XCircle, RefreshCw, Loader2
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { getErrorMessage } from '../../lib/support';
import type { ApiAttendanceEvent, ApiBooking, BookingsResponse } from '../../types/api';

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
  checkInRaw: Date | null;
}

interface GpsPosition {
  latitude: number;
  longitude: number;
}

function getEventType(event: ApiAttendanceEvent): string {
  return event?.event_type || '';
}

function getEventTimestamp(event: ApiAttendanceEvent): string | null {
  return event?.recorded_at || null;
}

function formatElapsed(checkInDate: Date): string {
  const elapsed = Math.max(0, Date.now() - checkInDate.getTime());
  const hours = Math.floor(elapsed / 3_600_000);
  const mins = Math.floor((elapsed % 3_600_000) / 60_000);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function calcElapsedFraction(checkInDate: Date, shiftDurationHours: number): number {
  const elapsed = Math.max(0, Date.now() - checkInDate.getTime());
  const totalMs = shiftDurationHours * 3_600_000;
  return Math.min(1, elapsed / totalMs);
}

export default function DoctorAttendance() {
  const toast = useToast();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [attendanceState, setAttendanceState] = useState<AttendanceState>('Check-in');
  const [shift, setShift] = useState<ActiveShift | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gps, setGps] = useState<GpsPosition | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [elapsedStr, setElapsedStr] = useState('00:00');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request real GPS position
  const requestGps = useCallback((): Promise<GpsPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      setGpsLoading(true);
      setGpsError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setGps(position);
          setGpsLoading(false);
          resolve(position);
        },
        (err) => {
          setGpsError(err.message);
          setGpsLoading(false);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  }, []);

  // Start elapsed timer when checked in
  useEffect(() => {
    if (attendanceState === 'In Progress' && shift?.checkInRaw) {
      const tick = () => setElapsedStr(formatElapsed(shift.checkInRaw!));
      tick();
      timerRef.current = setInterval(tick, 30_000); // update every 30s
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [attendanceState, shift?.checkInRaw]);

  const fetchActiveShift = useCallback(async () => {
    try {
      setViewState('loading');
      const data = await api.get<BookingsResponse>('/bookings?status=confirmed,in_progress&limit=10');
      const bookings = data.bookings || [];
      // find the booking that's today or currently active
      const activeBooking = bookings.find((b: ApiBooking) => b.status === 'in_progress') || bookings[0];
      if (!activeBooking) {
        setShift(null);
        setViewState('empty');
        return;
      }
      const start = activeBooking.start_time ? new Date(activeBooking.start_time) : null;
      const end = activeBooking.end_time ? new Date(activeBooking.end_time) : null;

      // Check attendance events
      let bookingDetail: ApiBooking | null = null;
      try {
        bookingDetail = await api.get<ApiBooking>(`/bookings/${activeBooking.id}`);
      } catch (err) {
      }
      const attEvents = bookingDetail?.attendanceEvents || [];
      const checkInEvent = attEvents.find((e: ApiAttendanceEvent) => getEventType(e) === 'check_in');
      const checkOutEvent = attEvents.find((e: ApiAttendanceEvent) => getEventType(e) === 'check_out');

      setShift({
        id: activeBooking.shift_id || activeBooking.id,
        bookingId: activeBooking.id,
        facility: activeBooking.facility_name || 'Facility',
        role: activeBooking.specialty_name || activeBooking.shift_title || 'General',
        location: activeBooking.location_name || 'N/A',
        startTime: start ? start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--',
        endTime: end ? end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--',
        date: start ? `Today, ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Today',
        checkInTime: checkInEvent && getEventTimestamp(checkInEvent)
          ? new Date(getEventTimestamp(checkInEvent) as string).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : null,
        checkInRaw: checkInEvent && getEventTimestamp(checkInEvent) ? new Date(getEventTimestamp(checkInEvent) as string) : null,
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
      setViewState('error');
    }
  }, []);

  useEffect(() => { fetchActiveShift(); }, [fetchActiveShift]);

  const handleCheckIn = async () => {
    if (!shift) return;
    try {
      setSubmitting(true);
      // Get real GPS position
      let position: GpsPosition;
      try {
        position = await requestGps();
      } catch {
        toast.error('GPS Required', 'Please enable location services to check in.');
        setSubmitting(false);
        return;
      }
      // TODO: Integrate QR scanner — for now prompt user
      // In production, this would open a camera-based QR scanner
      const qrCode = prompt('Scan or enter the facility QR code:');
      if (!qrCode || !qrCode.trim()) {
        toast.error('QR code is required for check-in');
        setSubmitting(false);
        return;
      }
      await api.post('/attendance/check-in', {
        bookingId: shift.bookingId,
        qrCode: qrCode.trim(),
        latitude: position.latitude,
        longitude: position.longitude,
      });
      const now = new Date();
      setAttendanceState('In Progress');
      setShift(prev => prev ? {
        ...prev,
        checkInTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        checkInRaw: now,
      } : prev);
      toast.success('Checked in successfully');
    } catch (err: unknown) {
      toast.error('Check-in Failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!shift) return;
    try {
      setSubmitting(true);
      let position: GpsPosition;
      try {
        position = await requestGps();
      } catch {
        toast.error('GPS Required', 'Please enable location services to check out.');
        setSubmitting(false);
        return;
      }
      const qrCode = prompt('Scan or enter the facility QR code:');
      if (!qrCode || !qrCode.trim()) {
        toast.error('QR code is required for check-out');
        setSubmitting(false);
        return;
      }
      await api.post('/attendance/check-out', {
        bookingId: shift.bookingId,
        qrCode: qrCode.trim(),
        latitude: position.latitude,
        longitude: position.longitude,
      });
      setAttendanceState('Check-in');
      toast.success('Checked out successfully');
      fetchActiveShift();
    } catch (err: unknown) {
      toast.error('Check-out Failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePresenceRefresh = async () => {
    if (!shift) return;
    try {
      const data = await api.get<{ events: ApiAttendanceEvent[] }>(`/attendance/${shift.bookingId}`);
      const events = data?.events || [];
      const checkOutEvent = events.find((e: ApiAttendanceEvent) => getEventType(e) === 'check_out');
      if (checkOutEvent) {
        setAttendanceState('Check-out');
      }
      toast.success('Attendance refreshed');
    } catch (err: unknown) {
      toast.error('Refresh Failed', getErrorMessage(err));
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
                  <div className={`border rounded-xl p-5 flex flex-col items-center justify-center text-center ${
                    gps ? 'border-emerald-200 bg-emerald-50' : gpsError ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'
                  }`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      gps ? 'bg-emerald-100 text-emerald-600' : gpsError ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {gpsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Map className="w-6 h-6" />}
                    </div>
                    <h3 className={`text-sm font-bold mb-1 ${gps ? 'text-emerald-900' : gpsError ? 'text-red-900' : 'text-slate-900'}`}>
                      {gpsLoading ? 'Detecting Location...' : gps ? 'Location Detected' : gpsError ? 'Location Error' : 'Location Required'}
                    </h3>
                    <p className={`text-xs ${gps ? 'text-emerald-700' : gpsError ? 'text-red-600' : 'text-slate-500'}`}>
                      {gps ? 'GPS position acquired for geofence check.' : gpsError || 'Tap Check-in to share your location.'}
                    </p>
                    {!gps && !gpsLoading && (
                      <button onClick={() => requestGps().catch(() => {})} className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                        Detect Location
                      </button>
                    )}
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
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeDashoffset={Math.round(283 * (1 - (shift?.checkInRaw ? calcElapsedFraction(shift.checkInRaw, 12) : 0)))} strokeLinecap="round" />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-slate-900">{elapsedStr}</span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Hours Elapsed</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 w-full flex items-center justify-center gap-2 text-emerald-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-sm">Checked in at {shift.checkInTime || '--'}</span>
                </div>

                <div className="w-full space-y-3 pt-4">
                  <button onClick={handlePresenceRefresh} className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" /> Refresh Attendance Status
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
                    <span className="text-sm font-bold text-slate-900">{shift.checkInTime || '--'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Current Time</span>
                    <span className="text-sm font-bold text-slate-900">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Total Duration</span>
                    <span className="text-sm font-bold text-emerald-600">{shift.checkInRaw ? formatElapsed(shift.checkInRaw) : '--'}h</span>
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
