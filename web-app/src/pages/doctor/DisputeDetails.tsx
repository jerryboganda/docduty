import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { 
  ArrowLeft, AlertTriangle, FileText, 
  MessageSquare, CheckCircle, Clock, ShieldAlert, XCircle, RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import { getErrorMessage } from '../../lib/support';
import type { ApiDispute, ApiAttendanceEvent } from '../../types/api';

interface DisputeData {
  id: string;
  type: string;
  description: string;
  status: string;
  date: string;
  booking: { id: string; facility: string; shift: string; date: string; time: string; };
  evidence: { geoStatus: string; qrStatus: string; checkIn: string; };
  submittedEvidence: Array<{ id: string; type: string; content: string; date: string; }>;
  resolution: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  escalated: { label: 'Escalated', color: 'bg-red-100 text-red-700 border-red-200' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function DoctorDisputeDetails() {
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
      setError('');
      const data = await api.get<ApiDispute & { evidence?: Array<{ id: string; type: string; content: string; created_at?: string }> }>(`/disputes/${id}`);
      const firstAttendanceEvent = (data.attendanceEvents || [])[0];
      
      setDispute({
        id: data.id,
        type: data.type || 'General',
        description: data.description || '',
        status: data.status || 'open',
        date: new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        booking: {
          id: data.booking_id || 'N/A',
          facility: data.respondent_name || 'Facility',
          shift: data.shift_title || 'General',
          date: 'N/A',
          time: 'N/A',
        },
        evidence: {
          geoStatus: firstAttendanceEvent?.geo_valid ? 'Verified' : 'Not Verified',
          qrStatus: firstAttendanceEvent?.qr_valid ? 'Verified' : 'Not Verified',
          checkIn: firstAttendanceEvent?.recorded_at
            ? new Date(firstAttendanceEvent.recorded_at).toLocaleString()
            : '--',
        },
        submittedEvidence: (data.evidence || []).map((e: { id: string; type: string; content: string; created_at?: string }) => ({
          id: e.id,
          type: e.type,
          content: e.content,
          date: e.created_at ? new Date(e.created_at).toLocaleString() : 'N/A',
        })),
        resolution: data.resolution_notes || null,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDispute(); }, [fetchDispute]);

  const handleSubmitEvidence = async () => {
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

  const statusInfo = dispute ? (STATUS_MAP[dispute.status] || { label: dispute.status, color: 'bg-slate-100 text-slate-700 border-slate-200' }) : null;
  const isResolved = dispute?.status === 'resolved' || dispute?.status === 'closed';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
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
        <button onClick={fetchDispute} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">Retry</button>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-12 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/doctor/disputes" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Disputes
        </Link>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo?.color}`}>
          {statusInfo?.label}
        </span>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {/* Dispute Title */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border border-red-200 shrink-0">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{dispute.type}</h1>
            <p className="text-sm text-slate-500">
              Filed on {dispute.date} for Booking{' '}
              <Link to={`/doctor/bookings/${dispute.booking.id}`} className="text-emerald-600 hover:underline">
                {dispute.booking.id.substring(0, 8)}
              </Link>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Description */}
            {dispute.description && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Your Description
                </h3>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <p className="text-sm text-slate-700 leading-relaxed">{dispute.description}</p>
                </div>
              </div>
            )}

            {/* Evidence Panel */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" /> Shift & Attendance Evidence
              </h3>
              
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Facility</p>
                    <p className="font-medium text-slate-900">{dispute.booking.facility}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Shift Details</p>
                    <p className="font-medium text-slate-900">{dispute.booking.shift}</p>
                    <p className="text-xs text-slate-500">{dispute.booking.date} &bull; {dispute.booking.time}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Geofence Status</p>
                    <p className={`font-medium flex items-center gap-1 ${dispute.evidence.geoStatus === 'Verified' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {dispute.evidence.geoStatus === 'Verified' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {dispute.evidence.geoStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">QR Status</p>
                    <p className={`font-medium flex items-center gap-1 ${dispute.evidence.qrStatus === 'Verified' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {dispute.evidence.qrStatus === 'Verified' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {dispute.evidence.qrStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Check-in Time</p>
                    <p className="font-medium text-slate-900">{dispute.evidence.checkIn}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submitted Evidence */}
            {dispute.submittedEvidence.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" /> Submitted Evidence ({dispute.submittedEvidence.length})
                </h3>
                <div className="space-y-3">
                  {dispute.submittedEvidence.map((ev) => (
                    <div key={ev.id} className="bg-white rounded-lg p-4 border border-slate-200">
                      <p className="text-sm text-slate-700">{ev.content}</p>
                      <p className="text-xs text-slate-400 mt-2">{ev.date} &bull; {ev.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Status */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-400" /> Resolution Status
              </h3>
              {isResolved && dispute.resolution ? (
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <p className="font-bold text-emerald-900">Resolved</p>
                  </div>
                  <p className="text-sm text-emerald-800">{dispute.resolution}</p>
                </div>
              ) : (
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-200 flex flex-col items-center justify-center text-center min-h-[120px]">
                  <Clock className="w-8 h-8 text-amber-500 mb-2" />
                  <p className="font-bold text-amber-900">Awaiting Resolution</p>
                  <p className="text-sm text-amber-700 max-w-md mt-1">Our operations team is reviewing the evidence. A final decision will appear here within 24-48 hours.</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Submit Additional Evidence */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" /> Add Evidence
            </h3>
            
            {isResolved ? (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-center">
                <p className="text-sm text-slate-500">This dispute has been {dispute.status}. No further evidence can be submitted.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Provide additional details</label>
                  <textarea 
                    rows={4} 
                    placeholder="Add more context or details about the issue..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="w-full p-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>

                <button 
                  onClick={handleSubmitEvidence}
                  disabled={submitting || !responseText.trim()}
                  className="w-full py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Evidence'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
