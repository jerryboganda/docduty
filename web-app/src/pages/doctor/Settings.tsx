import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, MapPin, Shield, LogOut, ChevronRight, 
  RefreshCw, XCircle, Smartphone, Mail, User, Check, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

type ViewState = 'loading' | 'error' | 'success';

export default function DoctorSettings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToast();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [locationConsent, setLocationConsent] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setViewState('loading');
      const data = await api.get('/users/preferences');
      setPushNotifs(!!data.push_notifications);
      setEmailNotifs(!!data.email_notifications);
      setSmsNotifs(!!data.sms_notifications);
      setLocationConsent(!!data.show_online_status);
      setViewState('success');
    } catch (err) {
      console.error('Failed to load preferences:', err);
      setViewState('error');
    }
  }, []);

  useEffect(() => { fetchPreferences(); }, [fetchPreferences]);

  const togglePreference = async (field: string, currentValue: boolean, setter: (v: boolean) => void) => {
    const newValue = !currentValue;
    setter(newValue);
    setSavingField(field);
    try {
      await api.put('/users/preferences', { [field]: newValue });
    } catch (err) {
      setter(currentValue); // revert on failure
      toast.error('Failed to save preference');
    } finally {
      setSavingField(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading settings...</p>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load settings</h2>
        <p className="text-slate-500 text-center max-w-md">We encountered an error while fetching your account preferences.</p>
        <button onClick={fetchPreferences} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Manage your notifications, privacy, and account.</p>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* Notifications Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-400" />
            <h2 className="text-base font-bold text-slate-900">Notification Preferences</h2>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Push Notifications</p>
                  <p className="text-xs text-slate-500">Instant alerts for new shifts and messages.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {savingField === 'push_notifications' && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
                <button 
                  onClick={() => togglePreference('push_notifications', pushNotifs, setPushNotifs)}
                  disabled={savingField === 'push_notifications'}
                  className={`w-11 h-6 rounded-full transition-colors relative ${pushNotifs ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${pushNotifs ? 'translate-x-5' : 'translate-x-0'}`}></span>
                </button>
              </div>
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Email Updates</p>
                  <p className="text-xs text-slate-500">Daily summaries and payout confirmations.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {savingField === 'email_notifications' && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
                <button 
                  onClick={() => togglePreference('email_notifications', emailNotifs, setEmailNotifs)}
                  disabled={savingField === 'email_notifications'}
                  className={`w-11 h-6 rounded-full transition-colors relative ${emailNotifs ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${emailNotifs ? 'translate-x-5' : 'translate-x-0'}`}></span>
                </button>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-600">SMS</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">SMS Alerts</p>
                  <p className="text-xs text-slate-500">Urgent shift offers and attendance reminders.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {savingField === 'sms_notifications' && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
                <button 
                  onClick={() => togglePreference('sms_notifications', smsNotifs, setSmsNotifs)}
                  disabled={savingField === 'sms_notifications'}
                  className={`w-11 h-6 rounded-full transition-colors relative ${smsNotifs ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${smsNotifs ? 'translate-x-5' : 'translate-x-0'}`}></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-400" />
            <h2 className="text-base font-bold text-slate-900">Privacy & Permissions</h2>
          </div>
          <div className="p-4 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Location Services</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                  Allow DocDuty to access your location while using the app. This is required for Geofence attendance verification and finding nearby shifts.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-2">
              {savingField === 'show_online_status' && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
              <button 
                onClick={() => togglePreference('show_online_status', locationConsent, setLocationConsent)}
                disabled={savingField === 'show_online_status'}
                className={`w-11 h-6 rounded-full transition-colors relative ${locationConsent ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${locationConsent ? 'translate-x-5' : 'translate-x-0'}`}></span>
              </button>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <User className="w-5 h-5 text-slate-400" />
            <h2 className="text-base font-bold text-slate-900">Account Actions</h2>
          </div>
          <div className="divide-y divide-slate-100">
            <button onClick={() => navigate('/doctor/profile')} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
              <div>
                <p className="text-sm font-bold text-slate-900">Edit Profile</p>
                <p className="text-xs text-slate-500">Update your credentials and details.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <button onClick={() => navigate('/contact')} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
              <div>
                <p className="text-sm font-bold text-slate-900">Help & Support</p>
                <p className="text-xs text-slate-500">Contact DocDuty operations team.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <button 
              onClick={handleLogout}
              className="w-full p-4 flex items-center gap-3 hover:bg-red-50 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-600">Log Out</p>
                <p className="text-xs text-red-500/70">Sign out of your account on this device.</p>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
