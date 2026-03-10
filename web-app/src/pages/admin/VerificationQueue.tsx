import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock, FileText, RefreshCw, Search, UserCircle, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

const STATUS_OPTIONS = ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMISSION_REQUIRED', 'APPROVED', 'REJECTED', 'REVERIFICATION_REQUIRED'] as const;

function humanize(value: string) {
  return value.replace(/_/g, ' ');
}

export default function VerificationQueue() {
  const toast = useToast();
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('SUBMITTED');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [internalNote, setInternalNote] = useState('');
  const [userVisibleNote, setUserVisibleNote] = useState('');
  const [reasonCode, setReasonCode] = useState('incomplete_required_evidence');

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get(`/admin/verifications?status=${status}&search=${encodeURIComponent(search)}`);
      setItems(data.verifications || []);
    } catch (err) {
      console.error('Failed to fetch verification queue:', err);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  const fetchDetail = useCallback(async (verificationId: string) => {
    const data = await api.get(`/admin/verifications/${verificationId}`);
    setDetail(data);
    setInternalNote(data.verification?.internal_note || '');
    setUserVisibleNote(data.verification?.user_visible_note || '');
  }, []);

  useEffect(() => {
    void fetchQueue();
  }, [fetchQueue]);

  const filtered = useMemo(() => items, [items]);

  const runAction = async (action: 'claim' | 'approve' | 'reject' | 'resubmit') => {
    if (!selected) return;
    try {
      setSubmitting(true);
      if (action === 'claim') {
        await api.post(`/admin/verifications/${selected.id}/claim`);
      } else if (action === 'approve') {
        await api.post(`/admin/verifications/${selected.id}/approve`, { userVisibleNote: userVisibleNote || 'Your doctor account is now verified. You can use all staffing features.', internalNote });
      } else if (action === 'reject') {
        await api.post(`/admin/verifications/${selected.id}/reject`, { rejectionReasonCode: reasonCode, rejectionReasonText: userVisibleNote || 'Your verification could not be approved.', internalNote, userVisibleNote });
      } else {
        const flaggedItems = (detail?.documents || []).filter((doc: any) => doc.document_status === 'needs_reupload').map((doc: any) => ({ documentType: doc.document_type }));
        await api.post(`/admin/verifications/${selected.id}/request-resubmission`, { userVisibleNote: userVisibleNote || 'Please update the flagged information and re-upload the required documents.', internalNote, resubmissionReasonText: userVisibleNote, flaggedItems });
      }
      toast.success('Verification updated');
      await fetchQueue();
      await fetchDetail(selected.id);
    } catch (err: any) {
      toast.error('Action Failed', err.message || 'Unable to update verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !selected) {
    return <div className="flex flex-col items-center justify-center h-[60vh] space-y-4"><RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" /><p className="text-slate-500 font-medium">Loading verification queue...</p></div>;
  }

  return (
    <div className="space-y-5 pb-8 flex flex-col h-[calc(100vh-6rem)]">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Doctor Verification Queue</h1>
        <p className="text-sm text-slate-500">Review doctor submissions, request corrections, and approve verified clinicians.</p>
      </div>

      {!selected ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="border-b border-slate-200 p-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by doctor, phone, email, or PMDC..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map((option) => (
                <button key={option} onClick={() => setStatus(option)} className={`px-3 py-2 rounded-full text-xs font-bold border transition-colors ${status === option ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {humanize(option)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filtered.map((item) => (
              <button key={item.id} onClick={() => { setSelected(item); void fetchDetail(item.id); }} className="w-full p-4 hover:bg-slate-50 transition-colors text-left flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                    <UserCircle className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">{item.full_name || item.phone}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">
                        {humanize(item.current_status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{item.specialty_name || 'General'} | {item.city_name || 'N/A'} | PMDC: {item.pmdc_license || 'N/A'}</p>
                    <p className="text-xs text-slate-400 mt-1">Submitted {item.submitted_at ? new Date(item.submitted_at).toLocaleString() : 'not yet submitted'}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-indigo-600">Open</span>
              </button>
            ))}
            {!filtered.length && <div className="p-10 text-center text-slate-500">No verification cases found for this queue.</div>}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <button onClick={() => { setSelected(null); setDetail(null); }} className="text-sm font-medium text-slate-500 hover:text-slate-900">Back to queue</button>
              <h2 className="mt-2 text-lg font-bold text-slate-900">{selected.full_name || selected.phone}</h2>
              <p className="text-xs text-slate-500">{humanize(selected.current_status)} | {selected.specialty_name || 'General'} | {selected.city_name || 'N/A'}</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">{humanize(selected.current_status)}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-900">Profile Summary</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><span className="text-slate-500">Phone</span><span className="font-medium text-slate-900">{detail?.verification?.phone || selected.phone}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-slate-500">Email</span><span className="font-medium text-slate-900">{detail?.verification?.email || 'N/A'}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-slate-500">PMDC</span><span className="font-medium text-slate-900">{detail?.verification?.pmdc_license || selected.pmdc_license || 'N/A'}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-slate-500">Submitted</span><span className="font-medium text-slate-900">{detail?.verification?.submitted_at ? new Date(detail.verification.submitted_at).toLocaleString() : 'N/A'}</span></div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900">Reviewer Notes</h3>
                <textarea rows={4} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none" placeholder="Internal audit or governance notes" />
                <textarea rows={4} value={userVisibleNote} onChange={(e) => setUserVisibleNote(e.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none" placeholder="Doctor-facing review note or action request" />
                <select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                  <option value="incomplete_required_evidence">Incomplete required evidence</option>
                  <option value="invalid_pmdc">Invalid PMDC</option>
                  <option value="expired_pmdc">Expired PMDC</option>
                  <option value="document_mismatch">Document mismatch</option>
                  <option value="suspected_fraud">Suspected fraud</option>
                </select>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> Uploaded Documents</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(detail?.documents || []).map((doc: any) => (
                    <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 p-4 hover:border-indigo-300 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{humanize(doc.document_type)}</p>
                          <p className="text-xs text-slate-500 mt-1">{doc.file_name}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${doc.document_status === 'accepted' ? 'text-emerald-700' : doc.document_status === 'needs_reupload' ? 'text-amber-700' : 'text-slate-500'}`}>
                          {humanize(doc.document_status)}
                        </span>
                      </div>
                    </a>
                  ))}
                  {!detail?.documents?.length && <div className="text-sm text-slate-500">No documents uploaded yet.</div>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900">Audit Trail</h3>
                <div className="mt-4 space-y-3">
                  {(detail?.audit || []).map((entry: any) => (
                    <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">{humanize(entry.event_type)}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row gap-3 justify-end">
            <button onClick={() => void runAction('claim')} disabled={submitting} className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Clock className="w-4 h-4 inline mr-2" />Claim Review</button>
            <button onClick={() => void runAction('resubmit')} disabled={submitting} className="px-4 py-2 border border-amber-200 rounded-lg font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50"><Clock className="w-4 h-4 inline mr-2" />Request Resubmission</button>
            <button onClick={() => void runAction('reject')} disabled={submitting} className="px-4 py-2 border border-red-200 rounded-lg font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"><XCircle className="w-4 h-4 inline mr-2" />Reject</button>
            <button onClick={() => void runAction('approve')} disabled={submitting} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50"><CheckCircle className="w-4 h-4 inline mr-2" />Approve</button>
          </div>
        </div>
      )}
    </div>
  );
}

