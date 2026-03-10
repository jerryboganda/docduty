import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, Award, Briefcase, Building2, Calendar, Camera, Check,
  CheckCircle, ChevronLeft, ChevronRight, ClipboardCheck, Clock, CreditCard,
  Eye, FileCheck2, FileText, GraduationCap, Hash, Mail, MapPin, RefreshCw,
  Send, Shield, ShieldCheck, Sparkles, Stethoscope, UploadCloud, User, X, XCircle,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import AvatarUpload from '../../components/AvatarUpload';
import { useDoctorVerification } from '../../hooks/useDoctorVerification';

type ViewState = 'loading' | 'error' | 'success';
type Step = 1 | 2 | 3 | 4 | 5;
type VerificationModalMode = 'edit' | 'readOnly';

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

const STEP_META = [
  { id: 'personal', label: 'Personal Identity', description: 'Name, DOB, CNIC & email', icon: User },
  { id: 'professional', label: 'Professional', description: 'Designation, specialty & PMDC', icon: Stethoscope },
  { id: 'education', label: 'Education', description: 'Medical qualifications', icon: GraduationCap },
  { id: 'documents', label: 'Documents', description: 'Upload required documents', icon: FileCheck2 },
  { id: 'declaration', label: 'Review & Submit', description: 'Confirm and submit', icon: ShieldCheck },
] as const;

const MISSING_ITEM_LABELS: Record<string, { label: string; step: Step }> = {
  'personalIdentity.legalFullName': { label: 'Legal Full Name', step: 1 },
  'personalIdentity.dateOfBirth': { label: 'Date of Birth', step: 1 },
  'personalIdentity.cnicNumber': { label: 'CNIC Number', step: 1 },
  'personalIdentity.email': { label: 'Email Address', step: 1 },
  'documents.profile_photo': { label: 'Profile Photo', step: 4 },
  'professionalPractice.currentDesignation': { label: 'Current Designation', step: 2 },
  'professionalPractice.primarySpecialty': { label: 'Primary Specialty', step: 2 },
  'professionalPractice.pmdcRegistrationNumber': { label: 'PMDC Registration #', step: 2 },
  'professionalPractice.currentPracticeCity': { label: 'Current Practice City', step: 2 },
  'professionalPractice.preferredWorkCities': { label: 'Preferred Work Cities', step: 2 },
  'education.mbbsInstitution': { label: 'MBBS Institution', step: 3 },
  'education.mbbsGraduationYear': { label: 'Graduation Year', step: 3 },
  'education.houseJobStatus': { label: 'House Job Status', step: 3 },
  'declaration.confirmsAccuracy': { label: 'Accuracy Confirmation', step: 5 },
  'declaration.confirmsGenuineDocuments': { label: 'Document Authenticity', step: 5 },
  'declaration.consentsToReview': { label: 'Review Consent', step: 5 },
  'documents.pmdc_certificate': { label: 'PMDC Certificate', step: 4 },
  'documents.mbbs_degree': { label: 'MBBS Degree', step: 4 },
  'documents.cnic_front': { label: 'CNIC Front', step: 4 },
  'documents.cnic_back': { label: 'CNIC Back', step: 4 },
  'documents.postgraduate_certificate': { label: 'Postgraduate Certificate', step: 4 },
};

const DOC_ICONS: Record<string, React.ComponentType<any>> = {
  pmdc_certificate: FileText,
  mbbs_degree: GraduationCap,
  cnic_front: CreditCard,
  cnic_back: CreditCard,
  profile_photo: Camera,
  postgraduate_certificate: Award,
};

const HOUSE_JOB_OPTIONS = [
  { value: 'Completed', label: 'Completed' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Not Started', label: 'Not Started' },
  { value: 'Exempt', label: 'Exempt' },
];

const containerVariants = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } },
};

function isStepComplete(s: Step, draft: any, docMap: Map<string, any>, avatarUrl?: string): boolean {
  const pi = draft?.personalIdentity || {};
  const pp = draft?.professionalPractice || {};
  const ed = draft?.education || {};
  const dc = draft?.declaration || {};
  switch (s) {
    case 1: return !!(pi.legalFullName && pi.dateOfBirth && pi.cnicNumber && pi.email);
    case 2: return !!(pp.currentDesignation && pp.primarySpecialty && pp.pmdcRegistrationNumber && pp.currentPracticeCity && (pp.preferredWorkCities || []).length > 0);
    case 3: return !!(ed.mbbsInstitution && ed.mbbsGraduationYear && ed.houseJobStatus);
    case 4: {
      const has = (t: string) => !!docMap.get(t) || (t === 'profile_photo' && !!avatarUrl);
      return has('pmdc_certificate') && has('mbbs_degree') && has('cnic_front') && has('cnic_back') && has('profile_photo');
    }
    case 5: return !!(dc.confirmsAccuracy && dc.confirmsGenuineDocuments && dc.consentsToReview);
  }
}

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
  const modalMode: VerificationModalMode = summary?.canEditVerification ? 'edit' : 'readOnly';
  const isReadOnly = modalMode === 'readOnly';
  const reviewData = useMemo(() => {
    if (isReadOnly && summary?.submittedSnapshot) {
      return {
        ...emptyDraft,
        ...summary.submittedSnapshot,
        personalIdentity: { ...emptyDraft.personalIdentity, ...(summary.submittedSnapshot.personalIdentity || {}) },
        professionalPractice: { ...emptyDraft.professionalPractice, ...(summary.submittedSnapshot.professionalPractice || {}) },
        education: { ...emptyDraft.education, ...(summary.submittedSnapshot.education || {}) },
        declaration: { ...emptyDraft.declaration, ...(summary.submittedSnapshot.declaration || {}) },
      };
    }

    return draft;
  }, [draft, isReadOnly, summary?.submittedSnapshot]);
  const lockedVerificationMessage = useMemo(() => {
    switch (summary?.status) {
      case 'SUBMITTED':
        return 'Your verification has already been submitted and is now read-only.';
      case 'UNDER_REVIEW':
        return 'Your verification is under review and cannot be changed right now.';
      case 'APPROVED':
        return 'Your doctor account is already verified. Documents cannot be changed unless reverification is requested.';
      case 'REJECTED':
        return 'This verification record is closed. Contact support if you need it reopened.';
      default:
        return 'This verification record is read-only in the current state.';
    }
  }, [summary?.status]);
  const verificationCtaLabel = useMemo(() => {
    if (!summary) return 'Start Verification';
    if (summary.canEditVerification) return summary.primaryCta || 'Start Verification';
    if (summary.status === 'APPROVED') return 'View Verification';
    if (summary.status === 'REJECTED') return 'View Status';
    return 'View Submission';
  }, [summary]);

  const banner = !summary ? ['bg-slate-50 border-slate-200 text-slate-800', <Clock key="i" className="w-5 h-5 text-slate-500 mt-0.5" />] :
    summary.status === 'APPROVED' ? ['bg-emerald-50 border-emerald-200 text-emerald-800', <CheckCircle key="i" className="w-5 h-5 text-emerald-600 mt-0.5" />] :
    summary.status === 'REJECTED' ? ['bg-red-50 border-red-200 text-red-800', <AlertTriangle key="i" className="w-5 h-5 text-red-600 mt-0.5" />] :
    ['bg-amber-50 border-amber-200 text-amber-800', <Clock key="i" className="w-5 h-5 text-amber-600 mt-0.5" />];

  const directionRef = useRef(0);
  const stepCompletion = useMemo(() => ({
    1: isStepComplete(1, reviewData, docMap, user?.avatarUrl),
    2: isStepComplete(2, reviewData, docMap, user?.avatarUrl),
    3: isStepComplete(3, reviewData, docMap, user?.avatarUrl),
    4: isStepComplete(4, reviewData, docMap, user?.avatarUrl),
    5: isStepComplete(5, reviewData, docMap, user?.avatarUrl),
  } as Record<Step, boolean>), [reviewData, docMap, user?.avatarUrl]);

  const openVerificationModal = () => {
    setStep(Number(reviewData?.step || 1) as Step);
    setWizardOpen(true);
  };

  const setStepOnly = (nextStep: Step) => {
    directionRef.current = nextStep > step ? 1 : -1;
    setStep(nextStep);
  };

  const updateDraft = (section: string, field: string, value: any) => {
    if (isReadOnly) return;
    setDraft((current: any) => ({ ...current, [section]: { ...current[section], [field]: value } }));
  };

  const saveDraft = async (nextStep: Step = step) => {
    if (!summary?.canEditVerification) {
      toast.error('Verification Locked', lockedVerificationMessage);
      return;
    }
    const payload = { ...draft, step: String(nextStep) };
    setDraft(payload);
    setStep(nextStep);
    await api.post('/doctor/verification-draft', payload);
    await refresh();
  };

  const goToStep = (nextStep: Step) => {
    if (isReadOnly) {
      setStepOnly(nextStep);
      return;
    }
    directionRef.current = nextStep > step ? 1 : -1;
    void saveDraft(nextStep);
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
    if (!summary?.canEditVerification) {
      toast.error('Verification Locked', lockedVerificationMessage);
      return;
    }
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
    if (!summary?.canSubmitDocuments) {
      toast.error('Verification Locked', lockedVerificationMessage);
      event.target.value = '';
      return;
    }
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
        <button onClick={openVerificationModal} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">{verificationCtaLabel}</button>
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Shield className="w-5 h-5 text-slate-400" /> Verification Status</h2><div className="mt-5 space-y-3"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current state</p><p className="mt-2 text-2xl font-bold text-slate-900">{summary?.badge || 'Verification Required'}</p><p className="mt-2 text-sm text-slate-600">{summary?.description}</p></div>{summary?.reviewerNote && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Reviewer note</p><p className="mt-2 text-sm text-amber-900">{summary.reviewerNote}</p></div>}<button onClick={openVerificationModal} className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">{verificationCtaLabel}</button></div></div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-400" /> Required Documents</h2><div className="mt-5 space-y-3">{visibleDocs.map(({ type, label, optional }) => { const present = !!docMap.get(type) || (type === 'profile_photo' && !!user?.avatarUrl); return <div key={type} className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">{label}</p><p className="text-xs text-slate-500">{optional ? 'Required only for specialist verification claims' : 'Required for verification review'}</p></div><span className={`text-xs font-bold uppercase tracking-[0.16em] ${present ? 'text-emerald-700' : 'text-slate-400'}`}>{present ? 'Uploaded' : optional ? 'Optional' : 'Missing'}</span></div>; })}</div></div>
        </div>
      </div>

      {wizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm p-4 overflow-y-auto flex items-center justify-center">
          <div className="w-full max-w-5xl rounded-[30px] border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-[linear-gradient(160deg,#f7fcfa_0%,#ebf6f0_48%,#fdfaf2_100%)] px-6 py-5 shrink-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Doctor Verification</p>
                <h2 className="mt-1.5 text-2xl font-bold text-slate-900">{summary?.title || 'Verification Required'}</h2>
              </div>
              <button onClick={() => setWizardOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-900 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Stepper */}
            <div className="px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-start">
                {STEP_META.map((meta, idx) => {
                  const sNum = (idx + 1) as Step;
                  const isActive = step === sNum;
                  const done = stepCompletion[sNum];
                  const Icon = meta.icon;
                  return (
                    <React.Fragment key={meta.id}>
                      {idx > 0 && <div className="flex-1 mt-[18px] mx-1"><div className={`h-0.5 rounded-full transition-all duration-500 ${stepCompletion[idx as Step] ? 'bg-emerald-400' : 'bg-slate-200'}`} /></div>}
                      <button onClick={() => goToStep(sNum)} className="flex flex-col items-center gap-1.5 min-w-[3rem] sm:min-w-[4.5rem] group">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${done ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-200' : isActive ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-emerald-100 scale-110' : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'}`}>
                          {done ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <span className="text-xs sm:text-sm font-bold">{sNum}</span>}
                        </div>
                        <div className={`flex flex-col items-center transition-colors ${isActive ? 'text-emerald-700' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[9px] sm:text-[10px] font-bold mt-0.5 whitespace-nowrap hidden sm:block">{meta.label}</span>
                        </div>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
              <p className="sm:hidden text-[11px] font-bold text-emerald-700 text-center mt-2">{STEP_META[step - 1].label} - {STEP_META[step - 1].description}</p>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {isReadOnly && (
                <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Verification record</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{summary?.badge || 'Verification Status'}</p>
                      <p className="mt-1 text-sm text-slate-600">{lockedVerificationMessage}</p>
                    </div>
                    <div className="text-xs text-slate-500 sm:text-right">
                      {summary?.submittedAt && <p>Submitted: {new Date(summary.submittedAt).toLocaleString()}</p>}
                      {summary?.approvedAt && <p>Approved: {new Date(summary.approvedAt).toLocaleString()}</p>}
                    </div>
                  </div>
                </div>
              )}
              <AnimatePresence mode="wait" custom={directionRef.current}>
                <motion.div key={step} custom={directionRef.current} initial={{ x: directionRef.current >= 0 ? 50 : -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: directionRef.current >= 0 ? -50 : 50, opacity: 0 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}>

                  {/* Step 1: Personal Identity */}
                  {step === 1 && (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <motion.div variants={fieldVariants} className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <User className="w-4 h-4 text-slate-400" /> Legal Full Name
                          {reviewData.personalIdentity.legalFullName ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto shrink-0" />}
                        </label>
                        <input value={reviewData.personalIdentity.legalFullName || ''} onChange={(e) => updateDraft('personalIdentity', 'legalFullName', e.target.value)} disabled={isReadOnly} placeholder="Dr. Muhammad Ali Khan" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                        <p className="text-[11px] text-slate-400">As it appears on your PMDC registration</p>
                      </motion.div>
                      <motion.div variants={fieldVariants} className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Calendar className="w-4 h-4 text-slate-400" /> Date of Birth
                          {reviewData.personalIdentity.dateOfBirth ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto shrink-0" />}
                        </label>
                        <input type="date" value={reviewData.personalIdentity.dateOfBirth || ''} onChange={(e) => updateDraft('personalIdentity', 'dateOfBirth', e.target.value)} disabled={isReadOnly} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                        <p className="text-[11px] text-slate-400">Used for identity verification only</p>
                      </motion.div>
                      <motion.div variants={fieldVariants} className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <CreditCard className="w-4 h-4 text-slate-400" /> CNIC Number
                          {reviewData.personalIdentity.cnicNumber ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto shrink-0" />}
                        </label>
                        <input value={reviewData.personalIdentity.cnicNumber || ''} onChange={(e) => updateDraft('personalIdentity', 'cnicNumber', e.target.value)} disabled={isReadOnly} placeholder="3410499475845" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                        <p className="text-[11px] text-slate-400">13-digit CNIC without dashes</p>
                      </motion.div>
                      <motion.div variants={fieldVariants} className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Mail className="w-4 h-4 text-slate-400" /> Email Address
                          {reviewData.personalIdentity.email ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto shrink-0" />}
                        </label>
                        <input type="email" value={reviewData.personalIdentity.email || ''} onChange={(e) => updateDraft('personalIdentity', 'email', e.target.value)} disabled={isReadOnly} placeholder="doctor@example.com" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                        <p className="text-[11px] text-slate-400">For verification correspondence</p>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Step 2: Professional Practice */}
                  {step === 2 && (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <motion.div variants={fieldVariants} className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Briefcase className="w-4 h-4 text-slate-400" /> Current Designation
                          {reviewData.professionalPractice.currentDesignation ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto shrink-0" />}
                        </label>
                        <input value={reviewData.professionalPractice.currentDesignation || ''} onChange={(e) => updateDraft('professionalPractice', 'currentDesignation', e.target.value)} disabled={isReadOnly} placeholder="Medical Officer" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                        <p className="text-[11px] text-slate-400">Your current professional title</p>
                      </motion.div>
                      <motion.div variants={fieldVariants} className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Stethoscope className="w-4 h-4 text-slate-400" /> Primary Specialty
                          {reviewData.professionalPractice.primarySpecialty ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto shrink-0" />}
                        </label>
                        <input value={reviewData.professionalPractice.primarySpecialty || ''} onChange={(e) => updateDraft('professionalPractice', 'primarySpecialty', e.target.value)} disabled={isReadOnly} placeholder="General Physician" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                        <p className="text-[11px] text-slate-400">Primary area of medical practice</p>
                      </motion.div>
                      <motion.div variants={fieldVariants} className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Hash className="w-4 h-4 text-slate-400" /> PMDC Registration #
                          {reviewData.professionalPractice.pmdcRegistrationNumber ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto shrink-0" />}
                        </label>
                        <input value={reviewData.professionalPractice.pmdcRegistrationNumber || ''} onChange={(e) => updateDraft('professionalPractice', 'pmdcRegistrationNumber', e.target.value)} disabled={isReadOnly} placeholder="12345-P" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                        <p className="text-[11px] text-slate-400">Pakistan Medical & Dental Council registration</p>
                      </motion.div>
                      <motion.div variants={fieldVariants} className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <MapPin className="w-4 h-4 text-slate-400" /> Current Practice City
                          {reviewData.professionalPractice.currentPracticeCity ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto shrink-0" />}
                        </label>
                        <input value={reviewData.professionalPractice.currentPracticeCity || ''} onChange={(e) => updateDraft('professionalPractice', 'currentPracticeCity', e.target.value)} disabled={isReadOnly} placeholder="Islamabad" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                        <p className="text-[11px] text-slate-400">City where you currently practice</p>
                      </motion.div>
                      <motion.div variants={fieldVariants} className="md:col-span-2 space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <MapPin className="w-4 h-4 text-slate-400" /> Preferred Work Cities
                          {(reviewData.professionalPractice.preferredWorkCities || []).length > 0 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto shrink-0" />}
                        </label>
                        <input value={(reviewData.professionalPractice.preferredWorkCities || []).join(', ')} onChange={(e) => updateDraft('professionalPractice', 'preferredWorkCities', e.target.value.split(',').map((v: string) => v.trim()).filter(Boolean))} disabled={isReadOnly} placeholder="Islamabad, Rawalpindi, Lahore" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                        <p className="text-[11px] text-slate-400">Comma-separated list of cities</p>
                        {(reviewData.professionalPractice.preferredWorkCities || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {reviewData.professionalPractice.preferredWorkCities.map((city: string) => (
                              <span key={city} className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">{city}</span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Step 3: Education */}
                  {step === 3 && (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <motion.div variants={fieldVariants} className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Building2 className="w-4 h-4 text-slate-400" /> MBBS Institution
                          {reviewData.education.mbbsInstitution ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto shrink-0" />}
                        </label>
                        <input value={reviewData.education.mbbsInstitution || ''} onChange={(e) => updateDraft('education', 'mbbsInstitution', e.target.value)} disabled={isReadOnly} placeholder="King Edward Medical University" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                        <p className="text-[11px] text-slate-400">Medical college where you completed MBBS</p>
                      </motion.div>
                      <motion.div variants={fieldVariants} className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Calendar className="w-4 h-4 text-slate-400" /> Graduation Year
                          {reviewData.education.mbbsGraduationYear ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto shrink-0" />}
                        </label>
                        <input type="number" value={reviewData.education.mbbsGraduationYear || ''} onChange={(e) => updateDraft('education', 'mbbsGraduationYear', e.target.value)} disabled={isReadOnly} placeholder="2020" min="1970" max="2030" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                        <p className="text-[11px] text-slate-400">Year of MBBS degree completion</p>
                      </motion.div>
                      <motion.div variants={fieldVariants} className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <ClipboardCheck className="w-4 h-4 text-slate-400" /> House Job Status
                          {reviewData.education.houseJobStatus ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" /> : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto shrink-0" />}
                        </label>
                        <select value={reviewData.education.houseJobStatus || ''} onChange={(e) => updateDraft('education', 'houseJobStatus', e.target.value)} disabled={isReadOnly} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none appearance-none bg-white disabled:bg-slate-50 disabled:text-slate-500">
                          <option value="">Select status</option>
                          {HOUSE_JOB_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <p className="text-[11px] text-slate-400">Mandatory one-year training after MBBS</p>
                      </motion.div>
                      <motion.div variants={fieldVariants} className="space-y-1.5">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Award className="w-4 h-4 text-slate-400" /> Postgraduate Qualification
                        </label>
                        <input value={reviewData.education.postgraduateQualification || ''} onChange={(e) => updateDraft('education', 'postgraduateQualification', e.target.value)} disabled={isReadOnly} placeholder="FCPS, MRCP, etc. (optional)" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                        <p className="text-[11px] text-slate-400">Leave blank if not applicable</p>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Step 4: Documents */}
                  {step === 4 && (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visibleDocs.map(({ type, label, optional }) => {
                        const existing = docMap.get(type);
                        const present = !!existing || (type === 'profile_photo' && !!user?.avatarUrl);
                        const DocIcon = DOC_ICONS[type] || FileText;
                        return (
                          <motion.div key={type} variants={fieldVariants} className={`rounded-2xl border-2 p-5 transition-all duration-300 group ${
                            uploading === type ? 'border-emerald-300 bg-emerald-50/50' :
                            present ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300' :
                            'border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                present ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'
                              }`}>
                                <DocIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                    uploading === type ? 'bg-emerald-100 text-emerald-700 animate-pulse' :
                                    present ? 'bg-emerald-100 text-emerald-700' :
                                    optional ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {uploading === type ? 'Uploading...' : present ? 'Uploaded' : optional ? 'Optional' : 'Required'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1.5">{present ? (existing?.file_name || 'Available from avatar') : optional ? 'Required for specialist claims only' : 'PDF, JPG, PNG, or WEBP - max 5 MB'}</p>
                              </div>
                            </div>
                            {isReadOnly ? (
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                  <Eye className="w-4 h-4" /> {present ? 'View-only record' : 'No document uploaded'}
                                </div>
                                {existing?.file_url && (
                                  <a href={existing.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                                    <FileText className="w-4 h-4" /> Open file
                                  </a>
                                )}
                              </div>
                            ) : (
                              <label className={`mt-3 flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${present ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`}>
                                <UploadCloud className="w-4 h-4" /> {present ? 'Replace document' : 'Upload document'}
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={(event) => void uploadDoc(type, event)} />
                              </label>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* Step 5: Declaration & Review */}
                  {step === 5 && (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
                      <motion.div variants={fieldVariants} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 mb-4">Review Summary</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {STEP_META.slice(0, 4).map((meta, idx) => {
                            const sNum = (idx + 1) as Step;
                            const done = stepCompletion[sNum];
                            const Icon = meta.icon;
                            return (
                              <button key={meta.id} onClick={() => goToStep(sNum)} className={`rounded-xl border p-3 text-center transition-colors hover:shadow-sm ${done ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                                <Icon className={`w-5 h-5 mx-auto ${done ? 'text-emerald-600' : 'text-amber-500'}`} />
                                <p className="text-[11px] font-bold mt-1.5 text-slate-700">{meta.label}</p>
                                <p className={`text-[10px] font-bold mt-0.5 ${done ? 'text-emerald-600' : 'text-amber-600'}`}>{done ? 'Complete' : 'Incomplete'}</p>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                      <motion.div variants={fieldVariants} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Identity</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{reviewData.personalIdentity.legalFullName || 'Not provided'}</p>
                          <p className="text-sm text-slate-600">{reviewData.personalIdentity.cnicNumber || 'CNIC missing'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Professional</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{reviewData.professionalPractice.currentDesignation || 'Not provided'}</p>
                          <p className="text-sm text-slate-600">{reviewData.professionalPractice.pmdcRegistrationNumber || 'PMDC missing'}</p>
                        </div>
                      </motion.div>
                      <motion.div variants={fieldVariants}>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 mb-3">Declaration</p>
                        <div className="space-y-3">
                          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                            <input type="checkbox" checked={!!reviewData.declaration.confirmsAccuracy} onChange={(e) => updateDraft('declaration', 'confirmsAccuracy', e.target.checked)} disabled={isReadOnly} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-70" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-slate-400" /><span className="text-sm font-semibold text-slate-900">Accuracy Confirmation</span></div>
                              <p className="text-[11px] text-slate-500 mt-0.5">I confirm the information provided is accurate and complete.</p>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                            <input type="checkbox" checked={!!reviewData.declaration.confirmsGenuineDocuments} onChange={(e) => updateDraft('declaration', 'confirmsGenuineDocuments', e.target.checked)} disabled={isReadOnly} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-70" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-slate-400" /><span className="text-sm font-semibold text-slate-900">Document Authenticity</span></div>
                              <p className="text-[11px] text-slate-500 mt-0.5">I confirm all uploaded documents are genuine and belong to me.</p>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                            <input type="checkbox" checked={!!reviewData.declaration.consentsToReview} onChange={(e) => updateDraft('declaration', 'consentsToReview', e.target.checked)} disabled={isReadOnly} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-70" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-slate-400" /><span className="text-sm font-semibold text-slate-900">Review Consent</span></div>
                              <p className="text-[11px] text-slate-500 mt-0.5">I consent to DocDuty reviewing my information and contacting me if needed.</p>
                            </div>
                          </label>
                        </div>
                      </motion.div>
                      {!isReadOnly && reviewData.declaration.confirmsAccuracy && reviewData.declaration.confirmsGenuineDocuments && reviewData.declaration.consentsToReview && !summary?.missingItems?.length && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                          <Sparkles className="w-8 h-8 text-emerald-600 mx-auto" />
                          <p className="mt-2 text-lg font-bold text-emerald-900">Ready to Submit!</p>
                          <p className="text-sm text-emerald-700 mt-1">All steps are complete. Submit your verification for admin review.</p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                </motion.div>
              </AnimatePresence>

              {/* Outstanding Items */}
              {!isReadOnly && summary?.missingItems?.length ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 mt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-bold text-amber-900">Outstanding items</p>
                    <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-100 rounded-full px-2.5 py-0.5">{summary.missingItems.length}</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(
                      summary.missingItems.reduce<Record<number, string[]>>((groups, item) => {
                        const info = MISSING_ITEM_LABELS[item];
                        const sNum = info?.step || 1;
                        if (!groups[sNum]) groups[sNum] = [];
                        groups[sNum].push(item);
                        return groups;
                      }, {})
                    ).map(([sNum, items]) => {
                      const meta = STEP_META[Number(sNum) - 1];
                      const Icon = meta.icon;
                      return (
                        <div key={sNum} className="flex items-start gap-2.5">
                          <button onClick={() => goToStep(Number(sNum) as Step)} className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-amber-700 hover:text-amber-900 mt-0.5 transition-colors">
                            <Icon className="w-3.5 h-3.5" />
                            {meta.label}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <div className="flex flex-wrap gap-1.5">
                            {(items as string[]).map((item) => (
                              <span key={item} className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium border border-amber-200 text-amber-800">{MISSING_ITEM_LABELS[item]?.label || item}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : null}
            </div>

            {/* Sticky Footer */}
            <div className="border-t border-slate-200 bg-white px-6 py-4 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500">Step {step} of 5{!isReadOnly && summary?.missingItems?.length ? ` - ${summary.missingItems.length} item${summary.missingItems.length !== 1 ? 's' : ''} remaining` : ''}</p>
                <div className="flex gap-1">
                  {([1, 2, 3, 4, 5] as Step[]).map((s) => (
                    <div key={s} className={`w-8 h-1 rounded-full transition-all duration-300 ${s === step ? 'bg-emerald-500' : stepCompletion[s] ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
                {isReadOnly ? (
                  <div className="text-sm text-slate-500">{lockedVerificationMessage}</div>
                ) : (
                  <button onClick={() => goToStep(step)} disabled={submitting} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">Save Draft</button>
                )}
                <div className="flex gap-3">
                  {step > 1 && (
                    <button onClick={() => goToStep((step - 1) as Step)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  )}
                  {step < 5 ? (
                    <button onClick={() => goToStep((step + 1) as Step)} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors flex items-center gap-2">
                      {isReadOnly ? 'Next' : 'Continue'} <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : isReadOnly ? (
                    <button onClick={() => setWizardOpen(false)} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors flex items-center gap-2">
                      Close
                    </button>
                  ) : (
                    <button onClick={() => void submit()} disabled={submitting} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                      {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit for Verification</>}
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}



