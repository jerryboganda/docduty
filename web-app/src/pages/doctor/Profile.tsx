import { useCallback, useEffect, useMemo, useState } from 'react';
import React from 'react';
import { AlertTriangle, CheckCircle, Clock, FileText, RefreshCw, Shield, UploadCloud, User, X, XCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import AvatarUpload from '../../components/AvatarUpload';
import { useDoctorVerification } from '../../hooks/useDoctorVerification';

type ViewState = 'loading' | 'error' | 'success';
type Step = 1 | 2 | 3 | 4 | 5;

const DOCS = [
  { type: 'pmdc_certificate', label: 'PMDC certificate', optional: false },
  { type: 'mbbs_degree', label: 'MBBS degree', optional: false },
  { type: 'cnic_front', label: 'CNIC front', optional: false },
  { type: 'cnic_back', label: 'CNIC back', optional: false },
  { type: 'profile_photo', label: 'Profile photo', optional: false },
  { type: 'postgraduate_certificate', label: 'Postgraduate certificate', optional: true },
] as const;

const emptyDraft = {
  personalIdentity: { legalFullName: '', dateOfBirth: '', cnicNumber: '', gender: '', email: '' },
  professionalPractice: { currentDesignation: '', primarySpecialty: '', pmdcRegistrationNumber: '', currentPracticeCity: '', preferredWorkCities: [] as string[] },
  education: { mbbsInstitution: '', mbbsGraduationYear: '', houseJobStatus: '', postgraduateQualification: '' },
  declaration: { confirmsAccuracy: false, confirmsGenuineDocuments: false, consentsToReview: false },
  step: '1',
};

export default function DoctorProfile() {
  const { user } = useAuth();
  const toast = useToast();
  const { summary, isLoading: summaryLoading, refresh } = useDoctorVerification();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [draft, setDraft] = useState<any>(emptyDraft);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', city: '', specialty: '', pmdc_number: '' });
  const [skills, setSkills] = useState<string[]>([]);
  const [allSkills, setAllSkills] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    try {
      setViewState('loading');
      const [profileData, skillsData, verificationData] = await Promise.all([
        api.get('/users/profile'),
        api.get('/reference/skills').catch(() => ({ skills: [] })),
        api.get('/doctor/verification-draft'),
      ]);
      const p: any = (profileData as any).user || profileData;
      const prof = p.profile || p;
      const nextDraft = { ...emptyDraft, ...((verificationData as any).draftData || {}) };
      nextDraft.personalIdentity = { ...emptyDraft.personalIdentity, ...nextDraft.personalIdentity, legalFullName: nextDraft.personalIdentity.legalFullName || prof.full_name || '', email: nextDraft.personalIdentity.email || p.email || '', cnicNumber: nextDraft.personalIdentity.cnicNumber || prof.cnic || '' };
      nextDraft.professionalPractice = { ...emptyDraft.professionalPractice, ...nextDraft.professionalPractice, primarySpecialty: nextDraft.professionalPractice.primarySpecialty || prof.specialty_name || '', pmdcRegistrationNumber: nextDraft.professionalPractice.pmdcRegistrationNumber || prof.pmdc_license || '', currentPracticeCity: nextDraft.professionalPractice.currentPracticeCity || prof.city_name || '' };
      nextDraft.education = { ...emptyDraft.education, ...nextDraft.education };
      nextDraft.declaration = { ...emptyDraft.declaration, ...nextDraft.declaration };
      setDraft(nextDraft);
      setStep(Number(nextDraft.step || 1) as Step);
      setDocuments((verificationData as any).documents || []);
      setForm({ full_name: prof.full_name || '', email: p.email || '', phone: p.phone || '', city: prof.city_name || '', specialty: prof.specialty_name || '', pmdc_number: prof.pmdc_license || '' });
      setSkills((prof.skills || []).map((s: any) => s.name || s));
      setAllSkills(skillsData.skills || []);
      setViewState('success');
    } catch {
      setViewState('error');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (summary && ['NOT_STARTED', 'IN_PROGRESS', 'RESUBMISSION_REQUIRED', 'REVERIFICATION_REQUIRED'].includes(summary.status)) setWizardOpen(true); }, [summary]);

  const docMap = useMemo(() => {
    const map = new Map<string, any>();
    documents.forEach((doc) => { if (!doc.replaced_at) map.set(String(doc.document_type), doc); });
    return map;
  }, [documents]);
  const requiresPostgraduateDocument = useMemo(() => {
    const specialty = String(draft?.professionalPractice?.primarySpecialty || '').trim().toLowerCase();
    return Boolean(specialty) && !['general physician', 'mbbs doctor', 'medical officer', 'er physician'].includes(specialty);
  }, [draft]);
  const visibleDocs = useMemo(() => DOCS.filter((doc) => !doc.optional || requiresPostgraduateDocument), [requiresPostgraduateDocument]);

  const banner = !summary ? ['bg-slate-50 border-slate-200 text-slate-800', <Clock key="i" className="w-5 h-5 text-slate-500 mt-0.5" />] :
    summary.status === 'APPROVED' ? ['bg-emerald-50 border-emerald-200 text-emerald-800', <CheckCircle key="i" className="w-5 h-5 text-emerald-600 mt-0.5" />] :
    summary.status === 'REJECTED' ? ['bg-red-50 border-red-200 text-red-800', <AlertTriangle key="i" className="w-5 h-5 text-red-600 mt-0.5" />] :
    ['bg-amber-50 border-amber-200 text-amber-800', <Clock key="i" className="w-5 h-5 text-amber-600 mt-0.5" />];

  const updateDraft = (section: string, field: string, value: any) => setDraft((current: any) => ({ ...current, [section]: { ...current[section], [field]: value } }));

  const saveDraft = async (nextStep: Step = step) => {
    const payload = { ...draft, step: String(nextStep) };
    setDraft(payload);
    setStep(nextStep);
    await api.post('/doctor/verification-draft', payload);
    await refresh();
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const skillIds = skills.map((name) => allSkills.find((skill) => skill.name === name)?.id || name);
      await api.put('/users/profile', { fullName: form.full_name, pmdcLicense: form.pmdc_number, email: form.email, skillIds });
      toast.success('Profile saved successfully');
      await load();
      await refresh();
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      await saveDraft(step);
      await api.post('/doctor/verification-submit');
      toast.success('Verification submitted', 'Your verification is now awaiting review.');
      setWizardOpen(false);
      await load();
      await refresh();
    } catch (err: any) {
      toast.error('Submission Failed', err.message || 'Unable to submit verification');
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const uploadDoc = async (type: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', type);
    try {
      setUploading(type);
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL || '/api'}/doctor/verification-documents`, { method: 'POST', headers: { Authorization: `Bearer ${api.getAccessToken()}` }, body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Upload failed');
      toast.success('Document uploaded');
      await load();
      await refresh();
    } catch (err: any) {
      toast.error('Upload Failed', err.message || 'Unable to upload document');
    } finally {
      setUploading(null);
      event.target.value = '';
    }
  };

  if (viewState === 'loading' || summaryLoading) return <div className="flex flex-col items-center justify-center h-[60vh] space-y-4"><RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" /><p className="text-slate-500 font-medium">Loading profile data...</p></div>;
  if (viewState === 'error') return <div className="flex flex-col items-center justify-center h-[60vh] space-y-4"><XCircle className="w-10 h-10 text-red-600" /><p className="text-slate-500 font-medium">Failed to load profile.</p><button onClick={() => void load()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Retry</button></div>;

  return (
    <div className="space-y-5 pb-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-xl font-bold text-slate-900">Profile & Verification</h1><p className="text-sm text-slate-500">Manage your doctor profile and activation status.</p></div>
        <button onClick={() => setWizardOpen(true)} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">{summary?.primaryCta || 'Start Verification'}</button>
      </div>

      <div className={`rounded-2xl p-5 flex items-start gap-3 border ${banner[0]}`}>{banner[1]}<div className="flex-1"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"><p className="font-semibold text-sm">{summary?.title || 'Verification Required'}</p><span className="text-xs font-bold uppercase tracking-[0.18em] opacity-80">{summary?.badge || 'Verification Required'}</span></div><p className="text-sm mt-1">{summary?.description}</p>{!summary?.canApply && <p className="text-xs mt-3 font-medium">{summary?.blockingReason}</p>}</div></div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-5">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4"><User className="w-5 h-5 text-slate-400" /> Profile Picture</h2><AvatarUpload currentAvatarUrl={user?.avatarUrl} userName={form.full_name || 'Doctor'} size="xl" /></div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label><input value={form.full_name} onChange={(e) => setForm((c) => ({ ...c, full_name: e.target.value }))} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label><input value={form.phone} disabled className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label><input value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">City</label><input value={form.city} onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Specialty</label><input value={form.specialty} onChange={(e) => setForm((c) => ({ ...c, specialty: e.target.value }))} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">PMDC Number</label><input value={form.pmdc_number} onChange={(e) => setForm((c) => ({ ...c, pmdc_number: e.target.value }))} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg" /></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Skills & Certifications</label><div className="flex flex-wrap gap-2 mb-2">{skills.map((skill) => <span key={skill} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700">{skill}</span>)}</div><div className="flex flex-wrap gap-2">{allSkills.filter((skill) => !skills.includes(skill.name)).slice(0, 8).map((skill) => <button key={skill.id} onClick={() => setSkills((current) => [...current, skill.name])} className="px-3 py-1.5 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">+ {skill.name}</button>)}</div></div>
            <div className="flex justify-end"><button onClick={() => void saveProfile()} disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Profile'}</button></div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Shield className="w-5 h-5 text-slate-400" /> Verification Status</h2><div className="mt-5 space-y-3"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current state</p><p className="mt-2 text-2xl font-bold text-slate-900">{summary?.badge || 'Verification Required'}</p><p className="mt-2 text-sm text-slate-600">{summary?.description}</p></div>{summary?.reviewerNote && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Reviewer note</p><p className="mt-2 text-sm text-amber-900">{summary.reviewerNote}</p></div>}<button onClick={() => setWizardOpen(true)} className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">{summary?.primaryCta || 'Start Verification'}</button></div></div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-400" /> Required Documents</h2><div className="mt-5 space-y-3">{visibleDocs.map(({ type, label, optional }) => { const present = !!docMap.get(type) || (type === 'profile_photo' && !!user?.avatarUrl); return <div key={type} className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">{label}</p><p className="text-xs text-slate-500">{optional ? 'Required only for specialist verification claims' : 'Required for verification review'}</p></div><span className={`text-xs font-bold uppercase tracking-[0.16em] ${present ? 'text-emerald-700' : 'text-slate-400'}`}>{present ? 'Uploaded' : optional ? 'Optional' : 'Missing'}</span></div>; })}</div></div>
        </div>
      </div>

      {wizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="mx-auto my-6 max-w-5xl rounded-[30px] border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[linear-gradient(180deg,#f8fbfa_0%,#eef6f2_100%)] px-6 py-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Doctor Verification</p><h2 className="mt-2 text-2xl font-bold text-slate-900">{summary?.title || 'Verification Required'}</h2></div><button onClick={() => setWizardOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-white hover:text-slate-900"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2">{([1, 2, 3, 4, 5] as Step[]).map((item) => <button key={item} onClick={() => void saveDraft(item)} className={`rounded-full px-4 py-2 text-sm font-bold border ${step === item ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>Step {item}</button>)}</div>
              {step === 1 && <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input value={draft.personalIdentity.legalFullName || ''} onChange={(e) => updateDraft('personalIdentity', 'legalFullName', e.target.value)} placeholder="Legal full name" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input type="date" value={draft.personalIdentity.dateOfBirth || ''} onChange={(e) => updateDraft('personalIdentity', 'dateOfBirth', e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input value={draft.personalIdentity.cnicNumber || ''} onChange={(e) => updateDraft('personalIdentity', 'cnicNumber', e.target.value)} placeholder="CNIC number" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input value={draft.personalIdentity.email || ''} onChange={(e) => updateDraft('personalIdentity', 'email', e.target.value)} placeholder="Email address" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></div>}
              {step === 2 && <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input value={draft.professionalPractice.currentDesignation || ''} onChange={(e) => updateDraft('professionalPractice', 'currentDesignation', e.target.value)} placeholder="Current designation" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input value={draft.professionalPractice.primarySpecialty || ''} onChange={(e) => updateDraft('professionalPractice', 'primarySpecialty', e.target.value)} placeholder="Primary specialty" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input value={draft.professionalPractice.pmdcRegistrationNumber || ''} onChange={(e) => updateDraft('professionalPractice', 'pmdcRegistrationNumber', e.target.value)} placeholder="PMDC registration number" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input value={draft.professionalPractice.currentPracticeCity || ''} onChange={(e) => updateDraft('professionalPractice', 'currentPracticeCity', e.target.value)} placeholder="Current practice city" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input value={(draft.professionalPractice.preferredWorkCities || []).join(', ')} onChange={(e) => updateDraft('professionalPractice', 'preferredWorkCities', e.target.value.split(',').map((value: string) => value.trim()).filter(Boolean))} placeholder="Preferred work cities" className="md:col-span-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></div>}
              {step === 3 && <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input value={draft.education.mbbsInstitution || ''} onChange={(e) => updateDraft('education', 'mbbsInstitution', e.target.value)} placeholder="MBBS institution" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input value={draft.education.mbbsGraduationYear || ''} onChange={(e) => updateDraft('education', 'mbbsGraduationYear', e.target.value)} placeholder="MBBS graduation year" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input value={draft.education.houseJobStatus || ''} onChange={(e) => updateDraft('education', 'houseJobStatus', e.target.value)} placeholder="House job status" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input value={draft.education.postgraduateQualification || ''} onChange={(e) => updateDraft('education', 'postgraduateQualification', e.target.value)} placeholder="Postgraduate qualification" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></div>}
              {step === 4 && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{visibleDocs.map(({ type, label, optional }) => { const existing = docMap.get(type); const present = !!existing || (type === 'profile_photo' && !!user?.avatarUrl); return <label key={type} className="rounded-2xl border border-slate-200 p-4 cursor-pointer hover:border-emerald-300 transition-colors"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">{label}</p><p className="text-xs text-slate-500 mt-1">{present ? existing?.file_name || 'Available from avatar' : optional ? 'Optional unless you claim a specialist qualification' : 'Upload PDF, JPG, PNG, or WEBP'}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${present ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{uploading === type ? 'Uploading' : present ? 'Uploaded' : optional ? 'Optional' : 'Missing'}</span></div><div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700"><UploadCloud className="w-4 h-4" /> {present ? 'Replace Document' : 'Upload Document'}</div><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(event) => void uploadDoc(type, event)} /></label>; })}</div>}
              {step === 5 && <div className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 grid gap-3 md:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Identity</p><p className="mt-2 text-sm font-semibold text-slate-900">{draft.personalIdentity.legalFullName || 'Not provided'}</p><p className="text-sm text-slate-600">{draft.personalIdentity.cnicNumber || 'CNIC missing'}</p></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Professional</p><p className="mt-2 text-sm font-semibold text-slate-900">{draft.professionalPractice.currentDesignation || 'Not provided'}</p><p className="text-sm text-slate-600">{draft.professionalPractice.pmdcRegistrationNumber || 'PMDC missing'}</p></div></div><label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4"><input type="checkbox" checked={!!draft.declaration.confirmsAccuracy} onChange={(e) => updateDraft('declaration', 'confirmsAccuracy', e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600" /><span className="text-sm text-slate-700">I confirm the information provided is accurate.</span></label><label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4"><input type="checkbox" checked={!!draft.declaration.confirmsGenuineDocuments} onChange={(e) => updateDraft('declaration', 'confirmsGenuineDocuments', e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600" /><span className="text-sm text-slate-700">I confirm all uploaded documents are genuine and belong to me.</span></label><label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4"><input type="checkbox" checked={!!draft.declaration.consentsToReview} onChange={(e) => updateDraft('declaration', 'consentsToReview', e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600" /><span className="text-sm text-slate-700">I consent to DocDuty reviewing my information and contacting me if needed.</span></label></div>}
              {summary?.missingItems?.length ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"><p className="text-sm font-bold">Outstanding items</p><div className="mt-3 flex flex-wrap gap-2">{summary.missingItems.map((item) => <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium border border-amber-200">{item}</span>)}</div></div> : null}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button onClick={() => void saveDraft(step)} disabled={submitting} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Save Draft</button><div className="flex gap-3">{step > 1 && <button onClick={() => void saveDraft((step - 1) as Step)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Back</button>}{step < 5 ? <button onClick={() => void saveDraft((step + 1) as Step)} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">Continue</button> : <button onClick={() => void submit()} disabled={submitting} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit for Verification'}</button>}</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
