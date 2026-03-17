import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { 
  ArrowLeft, AlertTriangle, FileText, 
  MessageSquare, CheckCircle, Clock, MapPin, ShieldAlert, XCircle, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import { getErrorMessage } from '../lib/support';
import type { ApiDispute, ApiAttendanceEvent } from '../types/api';

/** Extended dispute detail returned by GET /disputes/:id with joined booking fields */
type DisputeDetail = ApiDispute & {
  start_time?: string;
  end_time?: string;
  raised_against_name?: string;
  raised_against_phone?: string;
};

interface DisputeData {
  id: string;
  type: string;
  status: string;
  date: string;
  booking: { id: string; doctor: string; shift: string; date: string; time: string; };
  evidence: { geoStatus: string; qrStatus: string; checkIn: string; };
  resolution: string | null;
}

const STATUS_MAP: Record<string, string> = {
  open: 'Open', under_review: 'Under Review', resolved: 'Resolved', escalated: 'Escalated',
};

export default function DisputeDetails() {
  const { id } = useParams();
  const toast = useToast();
  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDispute = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<DisputeDetail>(`/disputes/${id}`);
      const start = data.start_time ? new Date(data.start_time) : null;
      const end = data.end_time ? new Date(data.end_time) : null;
      const firstAttendanceEvent = (data.attendanceEvents || [])[0];
      
      setDispute({
        id: data.id,
        type: data.type || 'General',
        status: STATUS_MAP[data.status] || data.status,
        date: new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        booking: {
          id: data.booking_id || 'N/A',
          doctor: data.raised_against_name || data.respondent_name || data.raised_against_phone || 'Unknown Doctor',
          shift: data.shift_title || 'General',
          date: start ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
          time: start && end ? `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}` : 'N/A',
        },
        evidence: {
          geoStatus: firstAttendanceEvent?.geo_valid ? 'Verified' : 'Not Verified',
          qrStatus: firstAttendanceEvent?.qr_valid ? 'Verified' : 'Not Verified',
          checkIn: firstAttendanceEvent?.recorded_at
            ? new Date(firstAttendanceEvent.recorded_at).toLocaleString()
            : '--',
        },
        resolution: data.resolution_notes || null,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDispute(); }, [fetchDispute]);

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) return;
    try {
      setSubmitting(true);
      await api.post(`/disputes/${id}/evidence`, { type: 'text', content: responseText });
      setResponseText('');
      toast.success('Evidence submitted');
      fetchDispute();
    } catch (err: unknown) {
      toast.error('Submission Failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading dispute details...</p>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load dispute</h2>
        <p className="text-slate-500 text-center max-w-md">{error}</p>
        <button onClick={fetchDispute} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">Retry</button>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-12 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/facility/disputes" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Disputes
        </Link>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-red-100 text-red-700 border-red-200">
          {dispute.status}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border border-red-200 shrink-0">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{dispute.id} • {dispute.type}</h1>
            <p className="text-sm text-slate-500">Filed on {dispute.date} for Booking <Link to={`/facility/bookings/${dispute.booking.id}`} className="text-primary hover:underline">{dispute.booking.id.substring(0, 8)}</Link></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Evidence & Resolution */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Evidence Panel (Read-only) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" /> Evidence Panel
              </h3>
              
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Doctor</p>
                    <p className="font-medium text-slate-900">{dispute.booking.doctor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Shift Details</p>
                    <p className="font-medium text-slate-900">{dispute.booking.shift}</p>
                    <p className="text-xs text-slate-500">{dispute.booking.date} • {dispute.booking.time}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Geofence Status</p>
                    <p className="font-medium text-red-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> {dispute.evidence.geoStatus}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">QR Status</p>
                    <p className="font-medium text-red-600 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> {dispute.evidence.qrStatus}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Check-in Time</p>
                    <p className="font-medium text-slate-900">{dispute.evidence.checkIn}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <Link to={`/facility/messages`} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                    <MessageSquare className="w-4 h-4" /> View Booking Chat Logs
                  </Link>
                </div>
              </div>
            </div>

            {/* Resolution Panel */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-400" /> Resolution Status
              </h3>
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-200 flex flex-col items-center justify-center text-center min-h-[120px]">
                <Clock className="w-8 h-8 text-amber-500 mb-2" />
                <p className="font-bold text-amber-900">Awaiting Ops Decision</p>
                <p className="text-sm text-amber-700 max-w-md mt-1">Our operations team is reviewing the evidence. A final decision will appear here within 24-48 hours.</p>
              </div>
            </div>

          </div>

          {/* Right Column: Facility Response Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" /> Facility Response
            </h3>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Provide additional details</label>
                <textarea 
                  rows={4} 
                  placeholder="Explain what happened from your perspective..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full p-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary outline-none resize-none"
                ></textarea>
              </div>

              <button 
                onClick={handleSubmitResponse}
                disabled={submitting || !responseText.trim()}
                className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
