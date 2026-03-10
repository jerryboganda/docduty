import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { 
  ArrowLeft, Calendar, Clock, MapPin, DollarSign, 
  Activity, CheckCircle, AlertCircle, Copy, XCircle,
  MessageSquare, FileText, ChevronRight, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import { SHIFT_STATUS_LABEL } from '../lib/statusMaps';

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
  offers: any[];
}

const STATUS_DISPLAY = SHIFT_STATUS_LABEL;

export default function ShiftDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [showToast, setShowToast] = useState(false);
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchShift = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get(`/shifts/${id}`);
      const start = data.start_time ? new Date(data.start_time) : null;
      const end = data.end_time ? new Date(data.end_time) : null;
      const hours = start && end ? Math.round((end.getTime() - start.getTime()) / 3600000) : 0;
      const dateStr = start ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
      const timeStr = start && end
        ? `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} (${hours} hrs)`
        : 'N/A';

      // Get skills from the shift data
      let skills: string[] = (data.skills || []).map((sk: any) => sk.name || sk);

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
    } catch (err: any) {
      setError(err.message || 'Failed to load shift');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchShift(); }, [fetchShift]);

  const handleCancel = async () => {
    try {
      await api.put(`/shifts/${id}/cancel`);
      toast.success('Shift cancelled');
      navigate('/facility/shifts');
    } catch (err: any) {
      toast.error('Cancel Failed', err.message || 'Failed to cancel shift');
    }
  };

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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
            <button onClick={triggerToast} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Copy className="w-4 h-4" /> Duplicate
            </button>
            <button onClick={handleCancel} className="px-3 py-2 bg-white border border-slate-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2">
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
          
          {/* Dispatch Waves Indicator */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Dispatch Status
            </h3>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              
              {/* Wave 1 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg border border-emerald-200 bg-emerald-50 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-emerald-900 text-sm">Wave 1</h4>
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Completed</span>
                  </div>
                  <p className="text-xs text-emerald-700">Top 20 matched doctors notified.</p>
                </div>
              </div>

              {/* Wave 2 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg border border-primary/20 bg-primary/5 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-primary text-sm">Wave 2</h4>
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full animate-pulse">Active</span>
                  </div>
                  <p className="text-xs text-slate-600">Radius expanded to 15km.</p>
                </div>
              </div>

              {/* Wave 3 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white bg-slate-100 text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg border border-slate-200 bg-white shadow-sm opacity-60">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-500 text-sm">Wave 3</h4>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Pending</span>
                  </div>
                  <p className="text-xs text-slate-500">National urgent broadcast.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Offer Timeline Log */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Offer Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Offer sent to Dr. Ahmed Ali</p>
                  <p className="text-xs text-slate-500">Just now</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-300 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Wave 2 dispatch started</p>
                  <p className="text-xs text-slate-500">5 mins ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-300 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Offer declined by Dr. Sarah Khan</p>
                  <p className="text-xs text-slate-500">10 mins ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-300 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Shift published & Wave 1 started</p>
                  <p className="text-xs text-slate-500">15 mins ago</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">Shift duplicated successfully.</span>
        </div>
      )}
    </div>
  );
}
