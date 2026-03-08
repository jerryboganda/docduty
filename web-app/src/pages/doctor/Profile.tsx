import { useState, useEffect, useCallback } from 'react';
import { 
  User, Shield, FileText, MapPin, Clock, 
  CheckCircle, AlertTriangle, UploadCloud, RefreshCw, XCircle
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import AvatarUpload from '../../components/AvatarUpload';

type ViewState = 'loading' | 'error' | 'success';
type VerificationStatus = 'Pending' | 'Approved' | 'Rejected';

export default function DoctorProfile() {
  const { user } = useAuth();
  const toast = useToast();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('Pending');
  const [radius, setRadius] = useState(15);
  const [saving, setSaving] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    city: 'Karachi',
    specialty: 'ER Physician',
    pmdc_number: '',
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [allSkills, setAllSkills] = useState<{ id: string; name: string }[]>([]);
  const [availability, setAvailability] = useState<boolean[]>([true, true, true, true, true, false, false]);

  const fetchProfile = useCallback(async () => {
    try {
      setViewState('loading');
      const [profileData, skillsData] = await Promise.all([
        api.get('/users/profile'),
        api.get('/reference/skills').catch(() => ({ skills: [] })),
      ]);
      const p = profileData.user || profileData;
      const prof = p.profile || p;
      setForm({
        full_name: prof.full_name || p.full_name || '',
        phone: p.phone || prof.phone || '',
        email: p.email || prof.email || '',
        city: prof.city_name || prof.city || 'Karachi',
        specialty: prof.specialty_name || prof.specialty || 'ER Physician',
        pmdc_number: prof.pmdc_license || prof.pmdc_number || '',
      });
      setSkills((prof.skills || []).map((s: any) => s.name || s));
      setAllSkills(skillsData.skills || []);
      // Map verification status
      const vs = p.verification_status || prof.verification_status || 'pending';
      setVerificationStatus(vs === 'approved' || vs === 'verified' ? 'Approved' : vs === 'rejected' ? 'Rejected' : 'Pending');
      setViewState('success');
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setViewState('error');
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      // Find skill IDs from names for the API
      const skillIds = skills.map(sName => {
        const found = allSkills.find(s => s.name === sName);
        return found ? found.id : sName;
      });
      await api.put('/users/profile', {
        fullName: form.full_name,
        pmdcLicense: form.pmdc_number,
        email: form.email,
        skillIds,
        coverageRadiusKm: radius,
      });
      toast.success('Profile saved successfully');
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const removeSkill = (skillName: string) => {
    setSkills(prev => prev.filter(s => s !== skillName));
  };

  const addSkill = (skillName: string) => {
    if (!skills.includes(skillName)) {
      setSkills(prev => [...prev, skillName]);
    }
    setShowSkillPicker(false);
  };

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading profile data...</p>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to load profile</h2>
        <p className="text-slate-500 text-center max-w-md">We encountered an error while fetching your profile information.</p>
        <button onClick={fetchProfile} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Profile & Verification</h1>
          <p className="text-sm text-slate-500">Manage your credentials, preferences, and availability.</p>
        </div>
      </div>

      {/* Verification Banner */}
      <div className={`rounded-xl p-4 flex items-start gap-3 border ${
        verificationStatus === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
        verificationStatus === 'Pending' ? 'bg-amber-50 border-amber-200 text-amber-800' :
        'bg-red-50 border-red-200 text-red-800'
      }`}>
        {verificationStatus === 'Approved' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" /> :
         verificationStatus === 'Pending' ? <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" /> :
         <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />}
        
        <div className="flex-1">
          <p className="font-semibold text-sm">
            {verificationStatus === 'Approved' ? 'Profile Verified' :
             verificationStatus === 'Pending' ? 'Verification Pending' :
             'Verification Rejected'}
          </p>
          <p className="text-xs mt-1">
            {verificationStatus === 'Approved' ? 'You are fully approved to accept shifts on DocDuty.' :
             verificationStatus === 'Pending' ? 'Our team is reviewing your documents. You will be notified once approved.' :
             'Your PMDC license upload was unclear. Please upload a high-resolution image.'}
          </p>
          
          {verificationStatus === 'Rejected' && (
            <button className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm" onClick={() => toast.success('Resubmission request sent. Our team will contact you.')}>
              Resubmit Documents
            </button>
          )}
        </div>
      </div>

      {/* Profile Picture */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-slate-400" /> Profile Picture
          </h2>
          <AvatarUpload
            currentAvatarUrl={user?.avatarUrl}
            userName={form.full_name || 'Doctor'}
            size="xl"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-slate-400" /> Personal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
              <select value={form.city} onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                <option>Karachi</option>
                <option>Lahore</option>
                <option>Islamabad</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-slate-400" /> Professional Details
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Specialty / Role</label>
              <select value={form.specialty} onChange={(e) => setForm(p => ({ ...p, specialty: e.target.value }))} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                <option>ER Physician</option>
                <option>ICU Specialist</option>
                <option>General Ward MO</option>
                <option>Pediatrician</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Skills & Certifications</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700 flex items-center gap-1">
                    {skill} <button onClick={() => removeSkill(skill)} className="text-slate-400 hover:text-red-500"><XCircle className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <button onClick={() => setShowSkillPicker(!showSkillPicker)} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">+ Add Skill</button>
              {showSkillPicker && (
                <div className="mt-2 p-2 border border-slate-200 rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto">
                  {allSkills.filter(s => !skills.includes(s.name)).map(s => (
                    <button key={s.id} onClick={() => addSkill(s.name)} className="block w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors">
                      {s.name}
                    </button>
                  ))}
                  {allSkills.filter(s => !skills.includes(s.name)).length === 0 && (
                    <p className="px-3 py-2 text-xs text-slate-400">All skills added</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">PMDC Number</label>
                <input type="text" value={form.pmdc_number} onChange={(e) => setForm(p => ({ ...p, pmdc_number: e.target.value }))} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Upload License / CNIC</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center text-center bg-white hover:bg-slate-50 transition-colors cursor-pointer">
                  <UploadCloud className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-xs font-medium text-slate-600">Click to upload document</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-slate-400" /> Preferences & Availability
          </h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">Work Radius</label>
                <span className="text-sm font-bold text-emerald-600">{radius} km</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Weekly Availability</label>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div key={day} className="flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">{day}</span>
                    <button onClick={() => { const next = [...availability]; next[i] = !next[i]; setAvailability(next); }} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      availability[i] ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}>
                      {availability[i] ? '✓' : ''}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">Tap days to toggle your general availability for shift matching.</p>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
