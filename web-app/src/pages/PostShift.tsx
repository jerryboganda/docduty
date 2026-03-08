import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, DollarSign, Tag, Info, 
  AlertCircle, CheckCircle, X, ChevronDown, ShieldAlert,
  RefreshCw, XCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';

type ViewState = 'form' | 'loading' | 'error' | 'success';

export default function PostShift() {
  const toast = useToast();
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>('form');
  const [shiftType, setShiftType] = useState<'replacement' | 'vacancy'>('replacement');
  const [visibility, setVisibility] = useState<'city' | 'national'>('city');
  const [allowCounter, setAllowCounter] = useState(false);
  const [totalPay, setTotalPay] = useState<string>('15000');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [role, setRole] = useState('Emergency Room (ER) Physician');
  const [location, setLocation] = useState('Main Campus');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [createdShiftId, setCreatedShiftId] = useState<string | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string }[]>([]);
  const [availableLocations, setAvailableLocations] = useState<{ id: string; name: string; address?: string }[]>([]);

  // Load reference data from API
  useEffect(() => {
    // Skills
    api.get<any>('/reference/skills', true).then((data) => {
      const skills = data?.skills || data;
      if (skills && Array.isArray(skills)) {
        setAvailableSkills(skills.map((s: any) => s.name));
      } else {
        setAvailableSkills(['ACLS', 'BLS', 'PALS', 'ATLS', 'Intubation', 'Central Line', 'Ventilator Management']);
      }
    }).catch(() => {
      setAvailableSkills(['ACLS', 'BLS', 'PALS', 'ATLS', 'Intubation', 'Central Line', 'Ventilator Management']);
    });

    // Specialties/Roles
    api.get<any>('/reference/specialties', true).then((data) => {
      const specialties = data?.specialties || data;
      if (specialties && Array.isArray(specialties)) {
        setAvailableRoles(specialties.map((s: any) => ({ id: s.id, name: s.name })));
        if (specialties.length > 0) setRole(specialties[0].name);
      }
    }).catch(() => {
      setAvailableRoles([{ id: '1', name: 'Emergency Room (ER) Physician' }, { id: '2', name: 'ICU Specialist' }, { id: '3', name: 'General Ward Medical Officer' }, { id: '4', name: 'Pediatrician' }]);
    });

    // Facility Locations
    api.get<any>('/facilities/locations').then((data) => {
      const locations = data?.locations || data;
      if (locations && Array.isArray(locations)) {
        setAvailableLocations(locations.map((l: any) => ({ id: l.id, name: l.name, address: l.address })));
        if (locations.length > 0) setLocation(locations[0].name);
      }
    }).catch(() => {
      setAvailableLocations([{ id: '1', name: 'Main Campus' }]);
    });
    // Set default dates
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(20, 0, 0, 0);
    setStartDateTime(tomorrow.toISOString().slice(0, 16));
    setEndDateTime(tomorrowEnd.toISOString().slice(0, 16));
  }, []);

  const platformFeeRate = 0.10; // 10% per SSOT
  const numericPay = parseInt(totalPay.replace(/,/g, '') || '0', 10);
  const platformFee = Math.max(numericPay * platformFeeRate, 200);
  const doctorNet = numericPay - platformFee;

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handlePublish = async () => {
    const newErrors: Record<string, string> = {};
    if (!totalPay || numericPay < 1000) newErrors.pay = 'Minimum pay must be Rs. 1,000';
    if (!startDateTime) newErrors.start = 'Start date/time is required';
    if (!endDateTime) newErrors.end = 'End date/time is required';
    if (startDateTime && endDateTime && new Date(startDateTime) >= new Date(endDateTime)) {
      newErrors.end = 'End time must be after start time';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setViewState('loading');

    try {
      const data = await api.post<any>('/shifts', {
        role,
        type: shiftType,
        startTime: new Date(startDateTime).toISOString(),
        endTime: new Date(endDateTime).toISOString(),
        offeredRate: numericPay,
        visibility,
        allowCounterOffers: allowCounter,
        requiredSkills: selectedSkills,
        notes: notes || undefined,
      });

      setCreatedShiftId(data.id || data.shift?.id);
      setViewState('success');
    } catch (err: any) {
      setErrors({ api: err.message || 'Failed to publish shift' });
      setViewState('error');
    }
  };

  if (viewState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Publishing shift to eligible doctors...</p>
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Failed to publish shift</h2>
        <p className="text-slate-500 text-center max-w-md">There was an issue communicating with the server. Please try again.</p>
        <button onClick={() => setViewState('form')} className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Back to Form
        </button>
      </div>
    );
  }

  if (viewState === 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Shift Published!</h2>
        <p className="text-slate-500 text-center max-w-md">Your shift has been successfully posted. We are now notifying eligible doctors in your area.</p>
        <div className="flex gap-3 mt-4">
          <button onClick={() => { setViewState('form'); setCreatedShiftId(null); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
            Post Another
          </button>
          <Link to="/facility/shifts" className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
            View Open Shifts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-12">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Post a Shift</h1>
        <p className="text-sm text-slate-500">Create a new opportunity for verified doctors.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Form */}
        <div className="flex-1 space-y-8">
          
          {/* Section 1: Basic Details */}
          <section className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Basic Details</h2>
            
            {/* Shift Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Shift Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setShiftType('replacement')}
                  className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    shiftType === 'replacement' 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Replacement (Urgent)
                </button>
                <button 
                  type="button"
                  onClick={() => setShiftType('vacancy')}
                  className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    shiftType === 'vacancy' 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Vacancy (Planned)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Department/Role */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Department / Role</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-11 pl-3 pr-10 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent appearance-none outline-none"
                  >
                    {availableRoles.length > 0 ? availableRoles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    )) : (
                      <option>Loading...</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Facility Location</label>
                <div className="relative">
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent appearance-none outline-none"
                  >
                    {availableLocations.length > 0 ? availableLocations.map(loc => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    )) : (
                      <option>Loading...</option>
                    )}
                  </select>
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Required Skills & Certifications</label>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedSkills.includes(skill)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {skill}
                    {selectedSkills.includes(skill) && <X className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2: Schedule */}
          <section className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Schedule</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date & Time</label>
                <div className="relative">
                  <input 
                    type="datetime-local" 
                    aria-label="Start Date and Time"
                    className="w-full h-11 pl-10 pr-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                  />
                  <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date & Time</label>
                <div className="relative">
                  <input 
                    type="datetime-local" 
                    aria-label="End Date and Time"
                    className="w-full h-11 pl-10 pr-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                  />
                  <Clock className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Payment & Visibility */}
          <section className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Payment & Visibility</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Pay Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Total Pay (PKR)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={totalPay}
                      onChange={(e) => setTotalPay(e.target.value.replace(/\D/g, ''))}
                      className={`w-full h-11 pl-10 pr-3 text-sm border rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${
                        errors.pay ? 'border-red-500 focus:ring-red-500' : 'border-slate-200'
                      }`}
                      placeholder="e.g. 15000"
                    />
                    <span className="absolute left-3 top-3 text-slate-500 font-medium">Rs.</span>
                  </div>
                  {errors.pay && <p className="text-xs text-red-500 mt-1.5">{errors.pay}</p>}
                </div>

                {/* Breakdown */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Facility Pays (Escrow)</span>
                    <span className="font-medium text-slate-900">Rs. {numericPay.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Platform Fee (10%)</span>
                    <span>- Rs. {platformFee.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                    <span className="text-slate-900">Doctor Net Earnings</span>
                    <span className="text-emerald-600">Rs. {doctorNet.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Visibility & Toggles */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Visibility</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                      type="button"
                      onClick={() => setVisibility('city')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        visibility === 'city' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      City Wide
                    </button>
                    <button 
                      type="button"
                      onClick={() => setVisibility('national')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                        visibility === 'national' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      National (Urgent)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Allow Counter-Offers</p>
                    <p className="text-xs text-slate-500">Doctors can propose a different rate.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={allowCounter} onChange={() => setAllowCounter(!allowCounter)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Notes & Policies */}
          <section className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Notes & Policies</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Duty Notes (Optional)</label>
              <textarea 
                className="w-full p-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none min-h-[100px] resize-y"
                placeholder="Enter rules for duty, dress code, arrival instructions, or specific patient load expectations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
              <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-blue-900">Standard Platform Policies Apply</p>
                <ul className="list-disc pl-4 text-blue-800 space-y-1">
                  <li><strong>Cancellation:</strong> Full refund if cancelled &gt;24h before start. Partial fee applies within 24h.</li>
                  <li><strong>No-Show:</strong> Doctors failing to check-in via geofence/QR within 15 mins of start face penalties.</li>
                  <li><strong>Escrow:</strong> Funds are held securely and released only upon verified completion.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Preview & Actions */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="sticky top-24 space-y-6">
            
            {/* Preview Card */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Live Preview</h3>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider mb-2 ${
                        shiftType === 'replacement' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {shiftType}
                      </span>
                      <h4 className="text-lg font-bold text-slate-900 leading-tight">{role || 'Select Role'}</h4>
                      <p className="text-sm text-slate-500 mt-1">{location || 'Select Location'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">Rs. {doctorNet.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Net Pay</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{startDateTime ? new Date(startDateTime).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select Date'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>
                        {startDateTime && endDateTime
                          ? `${new Date(startDateTime).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })} - ${new Date(endDateTime).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })} (${Math.round((new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / 3600000)} hrs)`
                          : 'Select Time'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Required</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSkills.length > 0 ? selectedSkills.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700">
                        {skill}
                      </span>
                    )) : (
                      <span className="text-xs text-slate-400 italic">No specific skills selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex flex-col gap-3">
              <button onClick={handlePublish} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                Publish Shift
              </button>
              <div className="flex gap-3">
                <button onClick={() => { toast.success('Draft saved'); navigate('/facility/shifts'); }} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
                  Save Draft
                </button>
                <button onClick={() => navigate('/facility/shifts')} className="flex-1 py-2.5 bg-white border border-slate-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Sticky Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:hidden z-20 flex gap-3">
        <button onClick={() => { toast.success('Draft saved'); navigate('/facility/shifts'); }} className="px-4 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
          Draft
        </button>
        <button onClick={handlePublish} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
          Publish Shift
        </button>
      </div>
    </div>
  );
}
