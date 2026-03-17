import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { 
  ArrowLeft, MapPin, Clock, Calendar, DollarSign, 
  ShieldAlert, CheckCircle, Star, Info, X, RefreshCw, XCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import { getErrorMessage } from '../../lib/support';
import { useDoctorVerification } from '../../hooks/useDoctorVerification';
import type { ApiShift, ApiSkill } from '../../types/api';

interface ShiftData {
  id: string;
  facility: string;
  facilityRating: string | null;
  address: string;
  role: string;
  date: string;
  time: string;
  pay: string;
  distance: string;
  requirements: string[];
  notes: string;
  allowCounter: boolean;
}

export default function DoctorShiftDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { summary } = useDoctorVerification();
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchShift = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get<{ shift: ApiShift & { facility_rating?: number | null; notes?: string } }>(`/shifts/${id}`);
      const s = data.shift;
      const start = s.start_time ? new Date(s.start_time) : null;
      const end = s.end_time ? new Date(s.end_time) : null;
      const hours = start && end ? Math.round((end.getTime() - start.getTime()) / 3600000) : 0;
      setShift({
        id: s.id,
        facility: s.facility_name || 'Facility',
        facilityRating: s.facility_rating ? String(s.facility_rating) : null,
        address: s.location_address || s.location_name || 'N/A',
        role: s.specialty_name || s.title || 'General',
        date: start ? start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        time: start && end ? `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} (${hours} hrs)` : 'N/A',
        pay: `Rs. ${(s.payout_pkr || 0).toLocaleString()}`,
        distance: '—',
        requirements: (s.skills || s.required_skills || []).map((sk: ApiSkill | string) => typeof sk === 'string' ? sk : sk.name),
        notes: s.notes || 'No additional notes.',
        allowCounter: s.counter_offer_allowed !== false,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchShift(); }, [fetchShift]);

  const handleAccept = async () => {
    if (!shift) return;
    if (!summary?.canApply) {
      toast.error('Verification Required', summary?.blockingReason || 'Complete verification before accepting shifts.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/bookings/accept', { shiftId: shift.id, shift_id: shift.id });
      setAcceptModalOpen(false);
      toast.success('Shift accepted!', 'Check your bookings for details.');
      navigate('/doctor/bookings');
    } catch (err: unknown) {
      toast.error('Accept Failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCounter = async () => {
    if (!shift) return;
    if (!summary?.canApply) {
      toast.error('Verification Required', summary?.blockingReason || 'Complete verification before sending counter offers.');
      return;
    }
    const parsedAmount = Number.parseInt(counterAmount, 10);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      toast.error('Invalid amount', 'Enter a valid counter amount in PKR');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/bookings/counter', {
        shiftId: shift.id,
        shift_id: shift.id,
        counterAmountPkr: parsedAmount,
        proposed_amount: parsedAmount,
        note: counterNote,
      });
      setCounterModalOpen(false);
      setCounterAmount('');
      setCounterNote('');
      toast.success('Counter offer sent');
      navigate('/doctor');
    } catch (err: unknown) {
      toast.error('Counter Failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading shift details...</p>
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load shift</h2>
        <p className="text-slate-500 text-center max-w-md">{error || 'Shift not found.'}</p>
        <button onClick={fetchShift} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">Retry</button>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-12 space-y-6 max-w-4xl mx-auto">
      <Link to="/doctor" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Offers
      </Link>

      {summary && !summary.canApply && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold">{summary.title}</p>
              <p className="mt-1 text-sm text-amber-800">{summary.blockingReason}</p>
            </div>
            <Link to="/doctor/profile" className="shrink-0 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100 transition-colors">
              {summary.primaryCta}
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{shift.role}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-medium text-slate-600">{shift.facility}</p>
                {shift.facilityRating && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-amber-500" /> {shift.facilityRating}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-emerald-600">{shift.pay}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Net Payout</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <Calendar className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date & Time</p>
                <p className="text-sm font-semibold text-slate-900">{shift.date}</p>
                <p className="text-sm text-slate-600">{shift.time}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <MapPin className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Location</p>
                <p className="text-sm font-semibold text-slate-900">{shift.distance} away</p>
                <p className="text-sm text-slate-600">{shift.address}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Requirements</h3>
            <div className="flex flex-wrap gap-2">
              {shift.requirements.length > 0 ? shift.requirements.map(req => (
                <span key={req} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                  {req}
                </span>
              )) : (
                <span className="text-sm text-slate-500">No specific requirements listed</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Duty Notes</h3>
            <p className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed">
              {shift.notes}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-blue-900">Platform Policies</p>
              <ul className="list-disc pl-4 text-blue-800 space-y-1">
                <li><strong>Cancellation:</strong> Cancelling within 24h of start incurs a penalty and affects your reliability score.</li>
                <li><strong>No-Show:</strong> Failure to check-in via Geofence/QR within 15 mins of start may result in account suspension.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 flex gap-3 lg:static lg:bg-transparent lg:border-none lg:shadow-none lg:p-0">
        {shift.allowCounter && (
          <button
            onClick={() => setCounterModalOpen(true)}
            disabled={!summary?.canApply}
            className={`flex-1 py-3 font-bold rounded-xl transition-colors ${
              summary?.canApply
                ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {summary?.canApply ? 'Counter Offer' : 'Verify to Apply'}
          </button>
        )}
        <button
          onClick={() => setAcceptModalOpen(true)}
          disabled={!summary?.canApply}
          className={`flex-[2] py-3 font-bold rounded-xl transition-colors ${
            summary?.canApply
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {summary?.canApply ? 'Accept Shift' : 'Verify to Apply'}
        </button>
      </div>

      {/* Accept Modal */}
      {acceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Confirm Booking</h3>
              <button onClick={() => setAcceptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                <p className="text-sm text-slate-500 mb-1">Expected Payout</p>
                <p className="text-3xl font-bold text-emerald-600">{shift.pay}</p>
                <p className="text-xs text-slate-500 mt-2">Funds will be held in escrow and released upon completion.</p>
              </div>

              <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span className="text-sm text-slate-700 leading-relaxed">
                  I confirm my availability for this shift and agree to the DocDuty cancellation and no-show policies.
                </span>
              </label>

              <button 
                disabled={!agreed || submitting}
                onClick={handleAccept}
                className={`w-full py-3 font-bold rounded-xl transition-colors shadow-sm ${
                  agreed && !submitting ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Confirming...' : 'Confirm & Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {counterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Submit Counter Offer</h3>
              <button onClick={() => setCounterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Proposed Pay (PKR)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 text-lg font-bold border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="e.g. 20000"
                  />
                  <span className="absolute left-4 top-3.5 text-slate-500 font-medium">Rs.</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Original offer: {shift.pay}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Note to Facility (Optional)</label>
                <textarea 
                  rows={3}
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  placeholder="Briefly explain why you are requesting a higher rate..."
                ></textarea>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg flex gap-2 text-sm text-blue-800">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>If the facility accepts, you will be automatically booked for this shift.</p>
              </div>

              <button 
                disabled={!counterAmount || submitting}
                onClick={handleCounter}
                className={`w-full py-3 font-bold rounded-xl transition-colors shadow-sm ${
                  counterAmount && !submitting ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
