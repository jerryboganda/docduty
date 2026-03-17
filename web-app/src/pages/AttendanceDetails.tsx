import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, UserCircle, Clock, CheckCircle, 
  XCircle, AlertTriangle, Map, QrCode, Activity, AlertCircle, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import { getErrorMessage } from '../lib/support';
import type { ApiAttendanceEvent, ApiBooking } from '../types/api';

function getEventType(event: ApiAttendanceEvent): string {
  return event?.event_type || '';
}

function getEventTimestamp(event: ApiAttendanceEvent): string | null {
  return event?.recorded_at || null;
}

interface AttendanceData {
  id: string;
  status: string;
  doctor: string;
  shift: string;
  location: string;
  date: string;
  scheduledStart: string;
  scheduledEnd: string;
  checkInTime: string;
  checkOutTime: string;
  geoStatus: string;
  qrStatus: string;
  pings: { time: string; status: string }[];
}

export default function AttendanceDetails() {
  const { id } = useParams();
  const [record, setRecord] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      // The id here is a booking id; fetch booking details which include attendance events
      const data = await api.get<ApiBooking>(`/bookings/${id}`);
      const start = data.start_time ? new Date(data.start_time) : null;
      const end = data.end_time ? new Date(data.end_time) : null;
      const checkIn = (data.attendanceEvents || []).find((e: ApiAttendanceEvent) => getEventType(e) === 'check_in');
      const checkOut = (data.attendanceEvents || []).find((e: ApiAttendanceEvent) => getEventType(e) === 'check_out');
      const pings = (data.attendanceEvents || [])
        .filter((e: ApiAttendanceEvent) => getEventType(e) === 'presence_ping')
        .map((e: ApiAttendanceEvent) => ({
          time: getEventTimestamp(e)
            ? new Date(getEventTimestamp(e) as string).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '--',
          status: (e.geo_valid || e.geo_verified) ? 'Verified' : 'Not Verified',
        }));

      setRecord({
        id: data.id,
        status: data.status === 'in_progress' ? 'Checked In' : data.status === 'completed' ? 'Checked Out' : 'Pending',
        doctor: data.doctor_name || 'Unknown Doctor',
        shift: data.specialty_name || data.shift_title || 'General',
        location: data.location_name || 'N/A',
        date: start ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        scheduledStart: start ? start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A',
        scheduledEnd: end ? end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A',
        checkInTime: checkIn && getEventTimestamp(checkIn)
          ? new Date(getEventTimestamp(checkIn) as string).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          : '--',
        checkOutTime: checkOut && getEventTimestamp(checkOut)
          ? new Date(getEventTimestamp(checkOut) as string).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          : '--',
        geoStatus: (checkIn?.geo_valid || checkIn?.geo_verified) ? 'Verified' : 'Not Verified',
        qrStatus: (checkIn?.qr_valid || checkIn?.qr_verified) ? 'Verified' : 'Not Verified',
        pings,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading attendance details...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load attendance</h2>
        <p className="text-slate-500 text-center max-w-md">{error}</p>
        <button onClick={fetchDetails} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">Retry</button>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-12 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/facility/attendance" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Attendance
        </Link>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-blue-100 text-blue-700 border-blue-200">
          {record.status}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
            <UserCircle className="w-10 h-10 text-slate-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{record.doctor}</h1>
            <p className="text-sm text-slate-500">{record.shift} • {record.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Timestamps */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Timestamps</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" /> Scheduled Start
                </div>
                <span className="font-medium text-slate-900">{record.scheduledStart}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Actual Check-in
                </div>
                <span className="font-bold text-emerald-700">{record.checkInTime}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" /> Scheduled End
                </div>
                <span className="font-medium text-slate-900">{record.scheduledEnd}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" /> Actual Check-out
                </div>
                <span className="font-medium text-slate-400">{record.checkOutTime}</span>
              </div>
            </div>
          </div>

          {/* Verification Signals */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Verification Signals</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  record.geoStatus === 'Verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Geofence Status</p>
                  <p className={`text-sm font-medium mt-0.5 ${
                    record.geoStatus === 'Verified' ? 'text-emerald-600' : 'text-red-600'
                  }`}>{record.geoStatus}</p>
                  <p className="text-xs text-slate-500 mt-1">Doctor's device location matched the facility coordinates during check-in.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  record.qrStatus === 'Verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">QR Code Status</p>
                  <p className={`text-sm font-medium mt-0.5 ${
                    record.qrStatus === 'Verified' ? 'text-emerald-600' : 'text-red-600'
                  }`}>{record.qrStatus}</p>
                  <p className="text-xs text-slate-500 mt-1">Doctor successfully scanned the rotating facility QR code.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Presence Pings (Optional) */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" /> Presence Pings
          </h3>
          <div className="flex flex-wrap gap-3">
            {record.pings.map((ping, idx) => (
              <div key={ping.time} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-slate-600">{ping.time}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 border-dashed rounded-lg text-xs text-slate-400">
              Awaiting next ping...
            </div>
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Admin override is NOT a facility action. Contact support for overrides.</span>
        </div>
        <Link to="/facility/disputes" className="w-full sm:w-auto px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" /> Flag Attendance Issue
        </Link>
      </div>
    </div>
  );
}
