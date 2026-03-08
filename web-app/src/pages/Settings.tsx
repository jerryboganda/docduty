import { useState, useEffect, useCallback } from 'react';
import { 
  Building2, MapPin, Users, Bell, Shield, 
  Plus, Edit2, Trash2, RefreshCw, XCircle, CheckCircle,
  Smartphone, Mail, Loader2
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import AvatarUpload from '../components/AvatarUpload';

type ViewState = 'loading' | 'error' | 'success';

interface FacilityProfile {
  facilityName: string;
  email: string;
  registrationNumber: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  geofenceRadius: number;
  qrActive: boolean;
}

function NotificationsTab() {
  const toast = useToast();
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/users/preferences');
        setPushNotifs(!!data.push_notifications);
        setEmailNotifs(!!data.email_notifications);
        setSmsNotifs(!!data.sms_notifications);
        setMarketingEmails(!!data.marketing_emails);
      } catch {
        // defaults are fine
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const toggle = async (field: string, current: boolean, setter: (v: boolean) => void) => {
    const next = !current;
    setter(next);
    setSavingField(field);
    try {
      await api.put('/users/preferences', { [field]: next });
    } catch {
      setter(current);
      toast.error('Failed to save preference');
    } finally {
      setSavingField(null);
    }
  };

  if (!loaded) return <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 text-primary animate-spin" /></div>;

  const items = [
    { key: 'push_notifications', label: 'Push Notifications', desc: 'Instant alerts for new bookings, cancellations, and messages.', icon: <Smartphone className="w-5 h-5 text-slate-600" />, value: pushNotifs, setter: setPushNotifs },
    { key: 'email_notifications', label: 'Email Notifications', desc: 'Daily digests, payment receipts, and shift summaries.', icon: <Mail className="w-5 h-5 text-slate-600" />, value: emailNotifs, setter: setEmailNotifs },
    { key: 'sms_notifications', label: 'SMS Alerts', desc: 'Critical alerts for attendance reminders and urgent cancellations.', icon: <span className="text-xs font-bold text-slate-600">SMS</span>, value: smsNotifs, setter: setSmsNotifs },
    { key: 'marketing_emails', label: 'Marketing & Updates', desc: 'Product updates, new features, and platform announcements.', icon: <Bell className="w-5 h-5 text-slate-600" />, value: marketingEmails, setter: setMarketingEmails },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Notification Preferences</h2>
        <p className="text-sm text-slate-500">Choose how you want to be notified about platform activity.</p>
      </div>
      <div className="space-y-1 divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
        {items.map(item => (
          <div key={item.key} className="p-4 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">{item.icon}</div>
              <div>
                <p className="text-sm font-bold text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {savingField === item.key && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
              <button
                onClick={() => toggle(item.key, item.value, item.setter)}
                disabled={savingField === item.key}
                className={`w-11 h-6 rounded-full transition-colors relative ${item.value ? 'bg-primary' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${item.value ? 'translate-x-5' : 'translate-x-0'}`}></span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [activeTab, setActiveTab] = useState('Profile');
  const [profile, setProfile] = useState<FacilityProfile>({ facilityName: '', email: '', registrationNumber: '' });
  const [locations, setLocations] = useState<Location[]>([]);
  const [saving, setSaving] = useState(false);

  const TABS = ['Profile', 'Locations', 'Presets', 'Notifications', 'Team'];

  const fetchSettings = useCallback(async () => {
    try {
      setViewState('loading');
      const data = await api.get('/users/profile');
      setProfile({
        facilityName: data.profile?.name || data.profile?.facility_name || data.profile?.full_name || user?.profile?.facilityName || '',
        email: data.email || '',
        registrationNumber: data.profile?.registration_number || 'N/A',
      });
      // Fetch locations
      try {
        const locData = await api.get('/facilities/locations');
        setLocations((locData.locations || []).map((l: any) => ({
          id: l.id,
          name: l.name,
          address: l.address || '',
          geofenceRadius: l.geofence_radius_m || 200,
          qrActive: !!l.qr_secret,
        })));
      } catch {
        setLocations((data.profile?.locations || []).map((l: any) => ({
          id: l.id,
          name: l.name,
          address: l.address || '',
          geofenceRadius: l.geofence_radius_m || 200,
          qrActive: !!l.qr_secret,
        })));
      }
      setViewState('success');
    } catch (err) {
      console.error('Failed to load settings:', err);
      setViewState('error');
    }
  }, [user]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await api.put('/users/profile', { name: profile.facilityName, email: profile.email });
      toast.success('Profile saved successfully');
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
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
        <p className="text-slate-500 text-center max-w-md">We encountered an error while fetching your facility configuration.</p>
        <button onClick={() => fetchSettings()} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Facility Settings</h1>
          <p className="text-sm text-slate-500">Manage your hospital profile, locations, and team access.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 p-4">
          <nav className="flex md:flex-col gap-1 overflow-x-auto hide-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab === 'Profile' && <Building2 className="w-4 h-4" />}
                {tab === 'Locations' && <MapPin className="w-4 h-4" />}
                {tab === 'Presets' && <Shield className="w-4 h-4" />}
                {tab === 'Notifications' && <Bell className="w-4 h-4" />}
                {tab === 'Team' && <Users className="w-4 h-4" />}
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 lg:p-8">
          
          {/* Profile Tab */}
          {activeTab === 'Profile' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Facility Profile</h2>
                <p className="text-sm text-slate-500">Update your hospital's basic information and registration details.</p>
              </div>

              {/* Facility Avatar / Logo */}
              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <AvatarUpload
                  currentAvatarUrl={user?.avatarUrl}
                  userName={profile.facilityName || 'Facility'}
                  size="lg"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Facility Name</label>
                    <input type="text" value={profile.facilityName} onChange={(e) => setProfile({...profile, facilityName: e.target.value})} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Registration Number</label>
                    <input type="text" value={profile.registrationNumber} disabled className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed" />
                    <p className="text-xs text-slate-500 mt-1">Contact support to change registration details.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Contact Email</label>
                    <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Registration Documents</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                      <p className="text-sm font-medium text-slate-900">Documents Verified</p>
                      <p className="text-xs text-slate-500 mt-1">Your facility is approved to post shifts.</p>
                      <button onClick={() => toast.info('Documents available in admin portal')} className="mt-4 text-sm font-medium text-primary hover:underline">View Uploaded Docs</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 flex justify-end">
                <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Locations Tab */}
          {activeTab === 'Locations' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1">Locations & Geofencing</h2>
                  <p className="text-sm text-slate-500">Manage campuses, wards, and attendance verification settings.</p>
                </div>
              </div>

              <div className="space-y-4">
                {locations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MapPin className="w-12 h-12 text-slate-300 mb-3" />
                    <h3 className="text-base font-bold text-slate-900 mb-1">No locations configured</h3>
                    <p className="text-sm text-slate-500 max-w-sm">Locations are managed by DocDuty operations. Contact support to add or update your facility locations.</p>
                  </div>
                ) : (
                  locations.map((loc) => (
                    <div key={loc.id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${loc.qrActive ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                            <MapPin className={`w-5 h-5 ${loc.qrActive ? 'text-blue-600' : 'text-slate-500'}`} />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900">{loc.name}</h3>
                            <p className="text-sm text-slate-500">{loc.address || 'No address on file'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Geofence Radius</p>
                          <p className="text-sm font-bold text-slate-900">{loc.geofenceRadius}m</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Rotating QR Code</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${loc.qrActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {loc.qrActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'Notifications' && (
            <NotificationsTab />
          )}

          {/* Placeholder for other tabs */}
          {['Presets', 'Team'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-full py-16 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                {activeTab === 'Presets' && <Shield className="w-8 h-8" />}
                {activeTab === 'Team' && <Users className="w-8 h-8" />}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{activeTab} Settings</h3>
              <p className="text-slate-500 text-center max-w-sm">
                Configuration options for {activeTab.toLowerCase()} will appear here.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
