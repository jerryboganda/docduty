import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { 
  ArrowLeft, Calendar, Clock, MapPin, UserCircle, 
  ShieldCheck, MessageSquare, AlertTriangle, Star, 
  Phone, Mail, XCircle, CheckCircle, RefreshCw
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

interface BookingData {
  id: string;
  status: string;
  doctor: { name: string; specialty: string; reliability: string; rating: string; skills: string[]; phone: string; email: string; };
  shift: { id: string; role: string; date: string; time: string; location: string; pay: string; };
  attendanceEvents: ApiAttendanceEvent[];
}

const STATUS_DISPLAY: Record<string, string> = {
  confirmed: 'Upcoming', in_progress: 'In Progress', completed: 'Completed',
  cancelled: 'Cancelled', no_show: 'No-show', pending_payment: 'Pending Payment',
};

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<ApiBooking>(`/bookings/${id}`);
      const start = data.start_time ? new Date(data.start_time) : null;
      const end = data.end_time ? new Date(data.end_time) : null;
      const dateStr = start ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
      const timeStr = start && end ? `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}` : 'N/A';
      
      setBooking({
        id: data.id,
        status: STATUS_DISPLAY[data.status] || data.status,
        doctor: {
          name: data.doctor_name || 'Unknown Doctor',
          specialty: data.specialty_name || data.shift_title || 'General',
          reliability: data.reliability_score ? `${data.reliability_score}%` : 'N/A',
          rating: data.doctor_rating ? data.doctor_rating.toFixed(1) : 'N/A',
          skills: [],
          phone: 'Contact via platform',
          email: 'Contact via platform',
        },
        shift: {
          id: data.shift_id,
          role: data.specialty_name || data.shift_title || 'General',
          date: dateStr,
          time: timeStr,
          location: data.location_name || 'N/A',
          pay: `Rs. ${(data.payout_pkr || 0).toLocaleString()} (Net)`,
        },
        attendanceEvents: data.attendanceEvents || [],
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const handleCancel = async () => {
    try {
      await api.put(`/bookings/${id}/cancel`, { reason: cancelReason || 'Cancelled by facility' });
      setCancelModalOpen(false);
      toast.success('Booking cancelled');
      navigate('/facility/bookings');
    } catch (err: unknown) {
      toast.error('Cancel Failed', getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load booking</h2>
        <p className="text-slate-500 text-center max-w-md">{error || 'Booking not found'}</p>
        <button onClick={fetchBooking} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const checkInEvent = booking.attendanceEvents.find((e: ApiAttendanceEvent) => getEventType(e) === 'check_in');
  const checkOutEvent = booking.attendanceEvents.find((e: ApiAttendanceEvent) => getEventType(e) === 'check_out');

  const timeline = [
    { step: 'Confirmed', time: booking.attendanceEvents.length > 0 ? 'Completed' : 'Completed', status: 'completed' as const },
    {
      step: 'Check-in',
      time: checkInEvent && getEventTimestamp(checkInEvent)
        ? new Date(getEventTimestamp(checkInEvent) as string).toLocaleString()
        : '--',
      status: checkInEvent ? 'completed' as const : 'pending' as const,
    },
    { step: 'In progress', time: booking.status === 'In Progress' ? 'Active' : '--', status: booking.status === 'In Progress' || booking.status === 'Completed' ? 'completed' as const : 'pending' as const },
    {
      step: 'Check-out',
      time: checkOutEvent && getEventTimestamp(checkOutEvent)
        ? new Date(getEventTimestamp(checkOutEvent) as string).toLocaleString()
        : '--',
      status: checkOutEvent ? 'completed' as const : 'pending' as const,
    },
    { step: 'Completed', time: booking.status === 'Completed' ? 'Done' : '--', status: booking.status === 'Completed' ? 'completed' as const : 'pending' as const },
  ];

  return (
    <div className="pb-24 lg:pb-12 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/facility/bookings" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </Link>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-blue-100 text-blue-700 border-blue-200">
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Doctor Profile Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                <UserCircle className="w-12 h-12 text-slate-400" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{booking.doctor.name}</h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" /> Approved Pool
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{booking.doctor.specialty}</p>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-medium text-slate-900">{booking.doctor.rating}</span>
                    <span className="text-slate-500">Rating</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium text-slate-900">{booking.doctor.reliability}</span>
                    <span className="text-slate-500">Reliability</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {booking.doctor.skills.map(skill => (
                    <span key={skill} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Shift Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Shift Summary</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
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
                  <p className="text-xs text-slate-500 mb-1">Location</p>
                  <p className="font-medium text-slate-900 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {booking.shift.location}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Expected Pay</p>
                  <p className="font-bold text-emerald-600">{booking.shift.pay}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Booking Timeline</h3>
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
              {timeline.map((item, idx) => (
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

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Actions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <Link to="/facility/messages" className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" /> Message Doctor
            </Link>
            <Link to="/facility/disputes" className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Raise Dispute
            </Link>
            <button disabled className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
              <Star className="w-4 h-4" /> Rate Doctor (After completion)
            </button>
            <div className="pt-3 border-t border-slate-100">
              <button onClick={() => setCancelModalOpen(true)} className="w-full py-2.5 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" /> Cancel Booking
              </button>
            </div>
          </div>

          {/* Contact Info (View Only) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Contact Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{booking.doctor.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="truncate">{booking.doctor.email}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Cancel Booking</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for cancellation</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="">Select a reason...</option>
                    <option>Shift no longer needed</option>
                    <option>Found internal coverage</option>
                    <option>Doctor requested cancellation</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <p className="font-semibold mb-1">Cancellation Policy Warning</p>
                  <p>Cancelling within 24 hours of the shift start time may incur a penalty fee as per platform policy.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setCancelModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Keep Booking
                </button>
                <button 
                  onClick={handleCancel}
                  disabled={!cancelReason}
                  className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
