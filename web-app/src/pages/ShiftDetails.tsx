import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { 
  ArrowLeft, Calendar, Clock, MapPin, DollarSign, 
  Activity, CheckCircle, AlertCircle, Copy, XCircle,
  MessageSquare, FileText, ChevronRight, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import { getErrorMessage } from '../lib/support';
import { SHIFT_STATUS_LABEL } from '../lib/statusMaps';
import type { ApiOffer, ApiSkill, ApiShift } from '../types/api';

interface ShiftData {
  id: string;
  title: string;
  department: string;
  type: string;
  status: string;
  date: string;
  time: string;
  location: string;
  pay: string;
  skills: string[];
  notes: string;
  offers: ApiOffer[];
}

const STATUS_DISPLAY = SHIFT_STATUS_LABEL;

export default function ShiftDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchShift = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get<ApiShift>(`/shifts/${id}`);
      const start = data.start_time ? new Date(data.start_time) : null;
      const end = data.end_time ? new Date(data.end_time) : null;
      const hours = start && end ? Math.round((end.getTime() - start.getTime()) / 3600000) : 0;
      const dateStr = start ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
      const timeStr = start && end
        ? `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} (${hours} hrs)`
        : 'N/A';

      // Get skills from the shift data
      let skills: string[] = (data.skills || []).map((sk: ApiSkill) => sk.name);

      setShift({
        id: data.id,
        title: data.specialty_name || data.title || 'Shift',
        department: data.department || 'General',
        type: data.type === 'replacement' ? 'Replacement' : data.urgency === 'critical' ? 'Replacement (Urgent)' : data.type || 'Standard',
        status: STATUS_DISPLAY[data.status] || data.status,
        date: dateStr,
        time: timeStr,
        location: data.location_name ? `${data.facility_name || 'Facility'} - ${data.location_name}` : 'N/A',
        pay: `Rs. ${(data.total_price_pkr || 0).toLocaleString()}`,
        skills,
        notes: data.description || 'No additional notes.',
        offers: data.offers || [],
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchShift(); }, [fetchShift]);

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await api.put(`/shifts/${id}/cancel`);
      setCancelModalOpen(false);
      toast.success('Shift cancelled');
      navigate('/facility/shifts');
    } catch (err: unknown) {
      toast.error('Cancel Failed', getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const handleDuplicate = async () => {
    if (!shift) return;
    try {
      // Fetch the original shift data to get all fields for duplication
      const original = await api.get<ApiShift>(`/shifts/${id}`);
      const newShift = await api.post<{ id: string }>('/shifts', {
        specialtyId: original.specialty_id,
        facilityLocationId: original.facility_location_id,
        type: original.type,
        urgency: original.urgency,
        startTime: original.start_time,
        endTime: original.end_time,
        offeredRate: original.offered_rate,
        description: original.description,
        department: original.department,
        requiredSkills: (original.skills || []).map((sk: ApiSkill) => sk.id),
      });
      toast.success('Shift duplicated successfully');
      navigate(`/facility/shifts/${newShift.id}`);
    } catch (err: unknown) {
      toast.error('Duplicate Failed', getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading shift details...</p>
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load shift</h2>
        <p className="text-slate-500 text-center max-w-md">{error || 'Shift not found'}</p>
        <button onClick={fetchShift} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/facility/shifts" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Shifts
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-slate-900">{shift.title}</h1>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-100 text-amber-700 border-amber-200">
                {shift.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">{shift.department} • {shift.id} • {shift.type}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDuplicate} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Copy className="w-4 h-4" /> Duplicate
            </button>
            <button onClick={() => setCancelModalOpen(true)} className="px-3 py-2 bg-white border border-slate-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Info Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    <Calendar className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date</p>
                    <p className="text-sm font-semibold text-slate-900">{shift.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    <Clock className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Time</p>
                    <p className="text-sm font-semibold text-slate-900">{shift.time}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    <MapPin className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Location</p>
                    <p className="text-sm font-semibold text-slate-900">{shift.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pay</p>
                    <p className="text-sm font-bold text-emerald-600">{shift.pay}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 sm:p-6 bg-slate-50 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {shift.skills.map(skill => (
                    <span key={skill} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Duty Notes</p>
                <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200">{shift.notes}</p>
              </div>
            </div>
          </div>

          {/* Booked Doctor (Mock Empty State for 'In Dispatch') */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col items-center justify-center text-center min-h-[160px]">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
              <Activity className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Awaiting Doctor</h3>
            <p className="text-sm text-slate-500 max-w-[250px]">
              This shift is currently in dispatch. We will notify you once a doctor accepts.
            </p>
          </div>

        </div>

        {/* Right Column: Dispatch & Timeline */}
        <div className="space-y-6">
          
          {/* Dispatch Status */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Dispatch Status
            </h3>
            
            {shift.offers.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <Activity className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No offers dispatched yet.</p>
                <p className="text-xs text-slate-400 mt-1">Offers will appear here once doctors are notified.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Total Offers Sent</span>
                  <span className="font-bold text-slate-900">{shift.offers.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Accepted</span>
                  <span className="font-bold text-emerald-600">{shift.offers.filter((o: ApiOffer) => o.status === 'accepted').length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Declined</span>
                  <span className="font-bold text-red-600">{shift.offers.filter((o: ApiOffer) => o.status === 'declined' || o.status === 'rejected').length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Pending</span>
                  <span className="font-bold text-amber-600">{shift.offers.filter((o: ApiOffer) => o.status === 'pending' || o.status === 'sent').length}</span>
                </div>
              </div>
            )}
          </div>

          {/* Offer Timeline Log */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Offer Timeline
            </h3>
            {shift.offers.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No offer activity yet.</p>
            ) : (
              <div className="space-y-4">
                {shift.offers.map((offer: ApiOffer, idx: number) => {
                  const statusLabel = offer.status === 'accepted' ? 'Accepted'
                    : offer.status === 'declined' || offer.status === 'rejected' ? 'Declined'
                    : offer.status === 'counter' ? 'Counter offered'
                    : 'Offer sent';
                  const dotColor = offer.status === 'accepted' ? 'bg-emerald-500'
                    : offer.status === 'declined' || offer.status === 'rejected' ? 'bg-red-400'
                    : offer.status === 'counter' ? 'bg-amber-400'
                    : idx === 0 ? 'bg-primary' : 'bg-slate-300';
                  const timeStr = offer.updated_at || offer.created_at
                    ? new Date(offer.updated_at || offer.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
                    : '';
                  return (
                    <div key={offer.id || idx} className="flex gap-3">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${dotColor} shrink-0`}></div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{statusLabel} — {offer.doctor_name || `Doctor ${(offer.doctor_id || '').slice(0, 6)}`}</p>
                        {timeStr && <p className="text-xs text-slate-500">{timeStr}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Cancel Shift?</h3>
              <button onClick={() => setCancelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">This action cannot be undone.</p>
                  <p>Cancelling this shift will notify all dispatched doctors and any accepted bookings will be terminated. A cancellation fee may apply if the shift is within 24 hours.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Keep Shift
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
