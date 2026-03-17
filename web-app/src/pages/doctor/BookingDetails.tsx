import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Building2, 
  MessageSquare, AlertTriangle, Star, XCircle, Map, RefreshCw, X
} from 'lucide-react';
import { api } from '../../lib/api';
import { getErrorMessage } from '../../lib/support';
import type { ApiAttendanceEvent, ApiBooking } from '../../types/api';

function getEventType(event: ApiAttendanceEvent): string {
  return event?.event_type || '';
}

function getEventTimestamp(event: ApiAttendanceEvent): string | null {
  return event?.recorded_at || null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Upcoming', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' },
};

interface BookingData {
  id: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  facility: { name: string; rating: string | null; address: string; phone: string; latitude: number | null; longitude: number | null };
  shift: { id: string; role: string; date: string; time: string; location: string; pay: string };
  timeline: { step: string; time: string; status: 'completed' | 'pending' }[];
}

export default function DoctorBookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get<{ booking: ApiBooking & { attendanceEvents?: ApiAttendanceEvent[] } }>(`/bookings/${id}`);
      const b = data.booking;
      const start = b.start_time ? new Date(b.start_time) : null;
      const end = b.end_time ? new Date(b.end_time) : null;
      const sm = STATUS_MAP[b.status] || STATUS_MAP.confirmed;

      // Build timeline from attendance events
      const events: { step: string; time: string; status: 'completed' | 'pending' }[] = [];
      events.push({ step: 'Confirmed', time: b.created_at ? new Date(b.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '--', status: 'completed' });
      const attEvents = b.attendanceEvents || [];
      const checkIn = attEvents.find((e: ApiAttendanceEvent) => getEventType(e) === 'check_in');
      const checkOut = attEvents.find((e: ApiAttendanceEvent) => getEventType(e) === 'check_out');
      events.push({
        step: 'Check-in',
        time: checkIn && getEventTimestamp(checkIn)
          ? new Date(getEventTimestamp(checkIn) as string).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })
          : '--',
        status: checkIn ? 'completed' : 'pending',
      });
      events.push({ step: 'In progress', time: checkIn ? 'Active' : '--', status: checkIn && !checkOut ? 'completed' : 'pending' });
      events.push({
        step: 'Check-out',
        time: checkOut && getEventTimestamp(checkOut)
          ? new Date(getEventTimestamp(checkOut) as string).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })
          : '--',
        status: checkOut ? 'completed' : 'pending',
      });
      events.push({ step: 'Completed', time: b.status === 'completed' ? 'Yes' : '--', status: b.status === 'completed' ? 'completed' : 'pending' });
      events.push({ step: 'Paid', time: b.status === 'completed' ? 'Settled' : '--', status: b.status === 'completed' ? 'completed' : 'pending' });

      setBooking({
        id: b.id,
        status: b.status,
        statusLabel: sm.label,
        statusColor: sm.color,
        facility: {
          name: b.facility_name || 'Facility',
          rating: b.facility_rating ? String(b.facility_rating) : null,
          address: b.location_address || b.location_name || 'N/A',
          phone: 'N/A',
          latitude: b.latitude ?? null,
          longitude: b.longitude ?? null,
        },
        shift: {
          id: b.shift_id,
          role: b.specialty_name || b.shift_title || 'General',
          date: start ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
          time: start && end ? `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}` : 'N/A',
          location: b.location_name || 'N/A',
          pay: `Rs. ${(b.payout_pkr || 0).toLocaleString()} (Net)`,
        },
        timeline: events,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const handleCancel = async () => {
    if (!booking) return;
    try {
      setCancelling(true);
      await api.put(`/bookings/${booking.id}/cancel`, { reason: cancelReason || 'Doctor cancelled' });
      setCancelModalOpen(false);
      toast.success('Booking cancelled');
      navigate('/doctor/bookings');
    } catch (err: unknown) {
      toast.error('Cancel Failed', getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load booking</h2>
        <p className="text-slate-500 text-center max-w-md">{error || 'Booking not found.'}</p>
        <button onClick={fetchBooking} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">Retry</button>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/doctor/bookings" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </Link>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${booking.statusColor}`}>
          {booking.statusLabel}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{booking.facility.name}</h2>
              {booking.facility.rating && (
              <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-medium text-slate-900">{booking.facility.rating}</span>
                <span>Facility Rating</span>
              </div>
              )}
            </div>
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {booking.facility.address}
            </p>
          </div>
        </div>

        <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm border-b border-slate-100">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Role</p>
              <p className="font-medium text-slate-900">{booking.shift.role}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Date & Time</p>
              <p className="font-medium text-slate-900 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> {booking.shift.date}</p>
              <p className="font-medium text-slate-900 flex items-center gap-1.5 mt-1"><Clock className="w-4 h-4 text-slate-400" /> {booking.shift.time}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Location / Ward</p>
              <p className="font-medium text-slate-900 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {booking.shift.location}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Expected Net Pay</p>
              <p className="font-bold text-emerald-600 text-lg">{booking.shift.pay}</p>
            </div>
          </div>
        </div>

        <div className="py-6 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Booking Timeline</h3>
          <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
            {booking.timeline.map((item, idx) => (
              <div key={`${item.step}-${item.time}`} className="relative pl-6">
                <div className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 bg-white ${
                  item.status === 'completed' ? 'border-emerald-500' : 'border-slate-300'
                }`}>
                  {item.status === 'completed' && <div className="w-2 h-2 m-0.5 bg-emerald-500 rounded-full"></div>}
                </div>
                <p className={`text-sm font-medium ${item.status === 'completed' ? 'text-slate-900' : 'text-slate-400'}`}>{item.step}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.time}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 space-y-3">
          <div className="flex gap-3">
            <button onClick={() => {
              const lat = booking.facility.latitude;
              const lng = booking.facility.longitude;
              const url = lat && lng
                ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.facility.address)}`;
              window.open(url, '_blank');
            }} className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
              <Map className="w-4 h-4" /> Get Directions
            </button>
            <Link to="/doctor/messages" className="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" /> Message Facility
            </Link>
          </div>
          <div className="flex gap-3">
            <Link to="/doctor/disputes" className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Raise Dispute
            </Link>
            <button onClick={() => setCancelModalOpen(true)} className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" /> Cancel Booking
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Cancel Booking</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for cancellation</label>
                  <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="">Select a reason...</option>
                    <option value="Personal Emergency">Personal Emergency</option>
                    <option value="Transportation Issue">Transportation Issue</option>
                    <option value="Health Issue">Health Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                  <p className="font-semibold mb-1 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Cancellation Penalty</p>
                  <p>Cancelling within 24 hours of the shift start time will result in a penalty fee and negatively impact your reliability score.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setCancelModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Keep Booking
                </button>
                <button 
                  disabled={cancelling}
                  onClick={handleCancel}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
