import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { 
  MapPin, Clock, DollarSign, AlertCircle, Timer, 
  Filter, Search, ChevronRight, RefreshCw, XCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import { getErrorMessage } from '../../lib/support';
import { useDoctorVerification } from '../../hooks/useDoctorVerification';
import type { ApiShift, ApiSkill, ShiftsResponse } from '../../types/api';

type ViewState = 'loading' | 'empty' | 'error' | 'success';

interface Offer {
  id: string;
  facility: string;
  role: string;
  date: string;
  time: string;
  pay: string;
  distance: string | null;
  urgency: string;
  requirements: string[];
  expires: string | null;
}

export default function DoctorHome() {
  const toast = useToast();
  const { summary } = useDoctorVerification();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const fetchOffers = useCallback(async () => {
    try {
      setViewState('loading');
      const data = await api.get<ShiftsResponse>('/shifts/feed?limit=50');
      const mapped: Offer[] = (data.shifts || []).map((s: ApiShift) => {
        const start = s.start_time ? new Date(s.start_time) : null;
        const end = s.end_time ? new Date(s.end_time) : null;
        const dateStr = start ? (start.toDateString() === new Date().toDateString() ? 'Today' : start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) : 'N/A';
        const timeStr = start && end ? `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}` : 'N/A';
        const requirementsSource = s.skills ?? s.required_skills ?? [];
        const requirements: string[] = Array.isArray(requirementsSource)
          ? requirementsSource.map((req: ApiSkill | string) => (typeof req === 'string' ? req : req?.name)).filter(Boolean) as string[]
          : [];
        // Compute distance from API data or leave unknown
        const distanceStr = s.distance_km != null
          ? `${Number(s.distance_km).toFixed(1)} km`
          : null;

        // Compute time-until-expiry from offer_expires_at or start_time
        let expiresStr: string | null = null;
        const expiresAt = s.offer_expires_at;
        if (expiresAt) {
          const diffMs = new Date(expiresAt).getTime() - Date.now();
          if (diffMs > 0) {
            const diffMins = Math.round(diffMs / 60000);
            expiresStr = diffMins >= 60
              ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`
              : `${diffMins}m`;
          } else {
            expiresStr = 'Expired';
          }
        } else if (start) {
          const diffMs = start.getTime() - Date.now();
          if (diffMs > 0) {
            const diffHrs = Math.floor(diffMs / 3600000);
            const diffMins = Math.round((diffMs % 3600000) / 60000);
            expiresStr = diffHrs > 0
              ? `${diffHrs}h ${diffMins}m`
              : `${diffMins}m`;
          }
        }

        return {
          id: s.id,
          facility: s.facility_name || 'Facility',
          role: s.specialty_name || s.title || 'General',
          date: dateStr,
          time: timeStr,
          pay: `Rs. ${(s.payout_pkr || 0).toLocaleString()}`,
          distance: distanceStr,
          urgency: s.urgency === 'critical' ? 'Urgent' : s.urgency === 'urgent' ? 'High' : 'Standard',
          requirements,
          expires: expiresStr,
        };
      });
      setOffers(mapped);
      setViewState(mapped.length === 0 ? 'empty' : 'success');
    } catch (err) {
      setViewState('error');
    }
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const filteredOffers = offers.filter(o => {
    if (activeFilter === 'urgent') return o.urgency === 'Urgent' || o.urgency === 'High';
    if (activeFilter === 'high_pay') return parseInt(o.pay.replace(/[^\d]/g, '')) >= 15000;
    return true;
  });

  const handleAccept = async (shiftId: string) => {
    if (!summary?.canApply) {
      toast.error('Verification Required', summary?.blockingReason || 'Complete verification before accepting shifts.');
      return;
    }
    try {
      await api.post('/bookings/accept', { shiftId });
      toast.success('Shift accepted!', 'Check your bookings for details.');
      fetchOffers();
    } catch (err: unknown) {
      toast.error('Accept Failed', getErrorMessage(err));
    }
  };

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium">Finding shifts near you...</p>
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
        <p className="text-slate-500 text-center max-w-md">Unable to load shift offers. Please check your connection.</p>
        <button onClick={() => fetchOffers()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Shift Offers</h1>
          <p className="text-sm text-slate-500">Available shifts matching your profile and radius.</p>
        </div>
      </div>

      {summary && !summary.canApply && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold">{summary.title}</p>
              <p className="mt-1 text-sm text-amber-800">{summary.blockingReason}</p>
            </div>
            <Link to="/doctor/profile" className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-bold text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors">
              {summary.primaryCta}
            </Link>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        <button onClick={() => setActiveFilter('all')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap shadow-sm border ${activeFilter === 'all' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
          All Shifts
        </button>
        <button onClick={() => setActiveFilter('urgent')} className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap border ${activeFilter === 'urgent' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
          Urgent Only
        </button>
        <button onClick={() => setActiveFilter('high_pay')} className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap border ${activeFilter === 'high_pay' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
          High Pay
        </button>
      </div>

      {/* Offers List */}
      {viewState === 'empty' || filteredOffers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No offers right now</h3>
          <p className="text-slate-500 text-center max-w-sm">
            We'll notify you when new shifts match your profile and location.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOffers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-300 transition-colors">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {offer.urgency === 'Urgent' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                          <AlertCircle className="w-3 h-3" /> Urgent
                        </span>
                      )}
                      {offer.expires && (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${
                          offer.expires === 'Expired'
                            ? 'text-red-600 bg-red-50 border-red-100'
                            : 'text-amber-600 bg-amber-50 border-amber-100'
                        }`}>
                          <Timer className="w-3 h-3" /> {offer.expires === 'Expired' ? 'Expired' : `Expires in ${offer.expires}`}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{offer.role}</h3>
                    <p className="text-sm text-slate-600 font-medium">{offer.facility}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600">{offer.pay}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> <span>{offer.date} • {offer.time}</span></div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> <span>{offer.distance ? `${offer.distance} away` : 'Distance N/A'}</span></div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {offer.requirements.map(req => (
                    <span key={req} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600">
                      {req}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Link to={`/doctor/shifts/${offer.id}`} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors text-center">
                    View Details
                  </Link>
                  <button
                    onClick={() => handleAccept(offer.id)}
                    disabled={!summary?.canApply}
                    title={!summary?.canApply ? summary?.blockingReason || '' : 'Accept Shift'}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors shadow-sm ${
                      summary?.canApply
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {summary?.canApply ? 'Accept Shift' : 'Verify to Apply'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
