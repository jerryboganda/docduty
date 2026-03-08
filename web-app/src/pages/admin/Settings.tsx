import { useState, useEffect, useCallback } from 'react';
import { 
  Settings, Shield, Users, Bell, Database, 
  Save, CheckCircle, XCircle, Key, Loader2
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../../lib/support';

export default function AdminSettings() {
  const toast = useToast();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'api'>('general');
  const [auditNote, setAuditNote] = useState('');
  const [saving, setSaving] = useState(false);

  // General settings state
  const [platformName, setPlatformName] = useState('DocDuty');
  const [supportEmail, setSupportEmail] = useState(SUPPORT_EMAIL);
  const [supportPhone, setSupportPhone] = useState(SUPPORT_PHONE);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Security state
  const [require2FA, setRequire2FA] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30 mins');

  // Notification alert toggles
  const [alerts, setAlerts] = useState([
    { key: 'verification', title: 'New Verification Request', desc: 'Notify ops team when a new doctor or facility registers.', enabled: true },
    { key: 'dispute', title: 'Dispute Opened', desc: 'Alert when a high-priority dispute is created.', enabled: true },
    { key: 'payout_failure', title: 'Payout Failure', desc: 'Notify finance when a settlement transfer fails.', enabled: true },
    { key: 'suspicious', title: 'Suspicious Activity', desc: 'Alert on multiple failed logins or geofence anomalies.', enabled: true },
  ]);

  // API key reveal state
  const [revealStripe, setRevealStripe] = useState(false);
  const [revealTwilio, setRevealTwilio] = useState(false);

  const toggleAlert = (key: string) => {
    setAlerts(prev => prev.map(a => a.key === key ? { ...a, enabled: !a.enabled } : a));
  };

  const handleSave = async () => {
    if (!auditNote.trim()) {
      toast.error('Audit note is required');
      return;
    }
    try {
      setSaving(true);
      
      // Save all settings as individual policy updates
      const settingsToSave = [
        { key: 'platform_name', value: platformName },
        { key: 'support_email', value: supportEmail },
        { key: 'support_phone', value: supportPhone },
        { key: 'maintenance_mode', value: maintenanceMode ? '1' : '0' },
        { key: 'require_2fa', value: require2FA ? '1' : '0' },
        { key: 'session_timeout', value: sessionTimeout },
        ...alerts.map(a => ({ key: `alert_${a.key}`, value: a.enabled ? '1' : '0' })),
      ];

      let savedCount = 0;
      for (const setting of settingsToSave) {
        try {
          await api.put(`/admin/policies/${setting.key}`, { value: setting.value, auditNote });
          savedCount++;
        } catch {
          // Policy key may not exist yet — skip gracefully
        }
      }

      toast.success(`Settings saved (${savedCount} policies updated)`);
      setSaveModalOpen(false);
      setAuditNote('');
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-8 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin Settings</h1>
          <p className="text-sm text-slate-500">Configure platform-wide settings, security, and integrations.</p>
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
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" /> General
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'security' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4" /> Security & Access
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'notifications' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" /> System Alerts
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'api' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4" /> Integrations
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
          
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-600" /> Platform Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Platform Name</label>
                    <input type="text" value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Support Email</label>
                    <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Support Phone</label>
                    <input type="tel" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Maintenance Mode</label>
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Enable Maintenance Mode</p>
                        <p className="text-xs text-slate-500">Temporarily disable access for all non-admin users.</p>
                      </div>
                      <button onClick={() => setMaintenanceMode(!maintenanceMode)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${maintenanceMode ? 'bg-red-500' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${maintenanceMode ? 'translate-x-6' : ''}`}></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" /> Security Policies
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Require 2FA for Admins</p>
                      <p className="text-xs text-slate-500">Mandatory two-factor authentication for all admin accounts.</p>
                    </div>
                    <button onClick={() => setRequire2FA(!require2FA)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${require2FA ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${require2FA ? 'translate-x-6' : ''}`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Session Timeout</p>
                      <p className="text-xs text-slate-500">Automatically log out inactive admin sessions.</p>
                    </div>
                    <select value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className="p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 outline-none">
                      <option>15 mins</option>
                      <option>30 mins</option>
                      <option>1 hour</option>
                      <option>4 hours</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" /> Admin Roles
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">Super Admin</span>
                    <span className="text-xs text-slate-500">Full Access</span>
                  </div>
                  <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">Ops Manager</span>
                    <span className="text-xs text-slate-500">Verifications, Disputes, Users</span>
                  </div>
                  <div className="p-4 bg-slate-50 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">Finance Auditor</span>
                    <span className="text-xs text-slate-500">Payments, Analytics (Read-only)</span>
                  </div>
                </div>
                <button onClick={() => toast.success('Role management coming soon')} className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2">
                  + Create New Role
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600" /> System Alerts (Email/SMS)
                </h3>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.key} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{alert.title}</p>
                        <p className="text-xs text-slate-500">{alert.desc}</p>
                      </div>
                      <button onClick={() => toggleAlert(alert.key)} className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${alert.enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${alert.enabled ? 'translate-x-6' : ''}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" /> API Keys & Webhooks
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 border border-slate-200 rounded-xl bg-white">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Payment Gateway (Stripe)</p>
                        <p className="text-xs text-slate-500">Used for escrow and settlements.</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                        Connected
                      </span>
                    </div>
                    <div className="relative">
                      <input 
                        type={revealStripe ? 'text' : 'password'}
                        defaultValue="sk_test_1234567890abcdef" 
                        className="w-full p-3 pr-20 text-sm font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 outline-none" 
                        readOnly
                      />
                      <button onClick={() => setRevealStripe(!revealStripe)} className="absolute right-2 top-2 px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded shadow-sm hover:bg-slate-50">
                        {revealStripe ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-xl bg-white">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900">SMS Provider (Twilio)</p>
                        <p className="text-xs text-slate-500">Used for OTPs and notifications.</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                        Connected
                      </span>
                    </div>
                    <div className="relative">
                      <input 
                        type={revealTwilio ? 'text' : 'password'}
                        defaultValue="AC1234567890abcdef" 
                        className="w-full p-3 pr-20 text-sm font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 outline-none" 
                        readOnly
                      />
                      <button onClick={() => setRevealTwilio(!revealTwilio)} className="absolute right-2 top-2 px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded shadow-sm hover:bg-slate-50">
                        {revealTwilio ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Save Confirmation Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Confirm Settings Update</h3>
              <button onClick={() => setSaveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-sm font-medium text-slate-700">
                  You are about to save changes to the platform settings. This action will be recorded in the audit log.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Audit Note (Required)</label>
                <textarea 
                  rows={3}
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Describe what settings were changed..."
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
                  <CheckCircle className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
