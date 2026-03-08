import { useState, useEffect, useCallback } from 'react';
import { 
  Save, Clock, AlertTriangle, DollarSign, 
  History, CheckCircle, XCircle, RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';

export default function PoliciesFees() {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendance' | 'cancellation' | 'fees'>('attendance');
  const [policies, setPolicies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [auditNote, setAuditNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/policies');
      const map: Record<string, string> = {};
      (data.policies || []).forEach((p: any) => { map[p.key] = p.value; });
      setPolicies(map);
    } catch (err) {
      console.error('Failed to fetch policies:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const updatePolicy = (key: string, value: string) => {
    setPolicies(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const keys = Object.keys(policies);
      for (const key of keys) {
        await api.put(`/admin/policies/${key}`, { value: policies[key], auditNote });
      }
      setSaveModalOpen(false);
      setAuditNote('');
      fetchPolicies();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const p = (key: string, fallback: string = '0') => policies[key] || fallback;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading policies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Policies & Fees</h1>
          <p className="text-sm text-slate-500">Configure platform rules, thresholds, and commission structures.</p>
        </div>
        <button 
          onClick={() => setSaveModalOpen(true)}
          className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
        
        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/50 flex overflow-x-auto">
          <button 
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'attendance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Attendance Windows
          </button>
          <button 
            onClick={() => setActiveTab('cancellation')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'cancellation' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Cancellations & Penalties
          </button>
          <button 
            onClick={() => setActiveTab('fees')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'fees' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Commissions & Fees
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {activeTab === 'attendance' && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-6">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" /> Check-in/out Windows
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Early Check-in Allowed (mins)</label>
                    <input type="number" value={p('early_checkin_mins', '15')} onChange={(e) => updatePolicy('early_checkin_mins', e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <p className="text-xs text-slate-500 mt-1">How early a doctor can scan the QR before shift start.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Late Check-in Grace Period (mins)</label>
                    <input type="number" value={p('late_checkin_grace_mins', '15')} onChange={(e) => updatePolicy('late_checkin_grace_mins', e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <p className="text-xs text-slate-500 mt-1">After this, the shift is marked as a No-Show.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Late Check-out Grace Period (mins)</label>
                    <input type="number" value={p('late_checkout_grace_mins', '30')} onChange={(e) => updatePolicy('late_checkout_grace_mins', e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <p className="text-xs text-slate-500 mt-1">Time allowed after shift end to complete check-out.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cancellation' && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-6">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-indigo-600" /> Cancellation Penalties
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-900">&gt; 24 Hours Before Shift</p>
                      <p className="text-xs text-slate-500">Standard cancellation</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">Penalty:</span>
                      <input type="number" value={p('cancel_24h_penalty', '0')} onChange={(e) => updatePolicy('cancel_24h_penalty', e.target.value)} className="w-20 p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 text-center outline-none" />
                      <span className="text-sm font-medium text-slate-700">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-900">12 - 24 Hours Before Shift</p>
                      <p className="text-xs text-slate-500">Late cancellation</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">Penalty:</span>
                      <input type="number" value={p('cancel_12_24h_penalty', '25')} onChange={(e) => updatePolicy('cancel_12_24h_penalty', e.target.value)} className="w-20 p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 text-center outline-none" />
                      <span className="text-sm font-medium text-slate-700">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-900">&lt; 12 Hours Before Shift</p>
                      <p className="text-xs text-slate-500">Critical cancellation</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">Penalty:</span>
                      <input type="number" value={p('cancel_lt12h_penalty', '50')} onChange={(e) => updatePolicy('cancel_lt12h_penalty', e.target.value)} className="w-20 p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 text-center outline-none" />
                      <span className="text-sm font-medium text-slate-700">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-red-900">No-Show</p>
                      <p className="text-xs text-red-700">Failure to attend without cancellation</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-800">Penalty:</span>
                      <input type="number" value={p('noshow_penalty', '100')} onChange={(e) => updatePolicy('noshow_penalty', e.target.value)} className="w-20 p-2 text-sm border border-red-200 rounded-lg bg-white text-red-900 text-center outline-none" />
                      <span className="text-sm font-medium text-red-800">%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">No-Show Suspension Threshold (Strikes)</label>
                  <input type="number" value={p('noshow_suspension_threshold', '3')} onChange={(e) => updatePolicy('noshow_suspension_threshold', e.target.value)} className="w-32 p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <p className="text-xs text-slate-500 mt-1">Number of no-shows before automatic account suspension.</p>
                </div>
              </div>
            )}

            {activeTab === 'fees' && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-6">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" /> Platform Fees & Commissions
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Facility Commission (%)</label>
                    <input type="number" value={p('facility_commission_pct', '10')} onChange={(e) => updatePolicy('facility_commission_pct', e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <p className="text-xs text-slate-500 mt-1">Fee charged to facility on top of shift pay.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Doctor Commission (%)</label>
                    <input type="number" value={p('doctor_commission_pct', '0')} onChange={(e) => updatePolicy('doctor_commission_pct', e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <p className="text-xs text-slate-500 mt-1">Fee deducted from doctor's payout.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Expedited Payout Fee (%)</label>
                    <input type="number" value={p('expedited_payout_fee_pct', '2.5')} onChange={(e) => updatePolicy('expedited_payout_fee_pct', e.target.value)} step="0.1" className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <p className="text-xs text-slate-500 mt-1">Fee for instant/early withdrawal requests.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Minimum Payout Amount (PKR)</label>
                    <input type="number" value={p('min_payout_pkr', '5000')} onChange={(e) => updatePolicy('min_payout_pkr', e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" /> Version History
                </h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {[
                  { v: 'v2.4', date: 'Current Active', author: 'System Admin', active: true },
                  { v: 'v2.3', date: 'Jan 15, 2026', author: 'Ops Manager', active: false },
                  { v: 'v2.2', date: 'Nov 01, 2025', author: 'System Admin', active: false },
                  { v: 'v2.1', date: 'Aug 20, 2025', author: 'System Admin', active: false },
                ].map((ver, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold ${ver.active ? 'text-indigo-600' : 'text-slate-900'}`}>
                        {ver.v}
                      </span>
                      {ver.active && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{ver.date}</p>
                    <p className="text-xs text-slate-400 mt-1">Modified by {ver.author}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Save Confirmation Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Confirm Policy Changes</h3>
              <button onClick={() => setSaveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                <p className="text-sm font-medium flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  You are about to modify core platform policies. These changes will take effect immediately for all NEW bookings. Existing bookings will honor the policy active at the time of booking.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Audit Note (Required)</label>
                <textarea 
                  rows={3}
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Describe what changed and why..."
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setSaveModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-2 ${saving ? 'opacity-50' : ''}`}
                >
                  <CheckCircle className="w-4 h-4" /> {saving ? 'Saving...' : 'Confirm & Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
