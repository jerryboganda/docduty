import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getErrorMessage } from '../lib/support';
import { useAuth } from '../contexts/AuthContext';
import type { ApiVerificationDocument } from '../types/api';

export type DoctorVerificationStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED'
  | 'REVERIFICATION_REQUIRED';

export interface DoctorVerificationSummary {
  verificationId: string;
  status: DoctorVerificationStatus;
  submissionVersion: number;
  lastSavedAt: string | null;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  reviewerNote: string | null;
  internalNote?: string | null;
  rejectionReasonCode?: string | null;
  rejectionReasonText?: string | null;
  resubmissionReasonText?: string | null;
  missingItems: string[];
  flaggedItems: Array<Record<string, unknown>>;
  badge: string;
  title: string;
  description: string;
  primaryCta: string;
  canApply: boolean;
  canEditVerification: boolean;
  canSubmitDocuments: boolean;
  blockingReason: string | null;
  documents: ApiVerificationDocument[];
  draftData: Record<string, unknown>;
  submittedSnapshot: Record<string, unknown> | null;
}

export function useDoctorVerification() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DoctorVerificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!user && user.role === 'doctor');
  const [error, setError] = useState<string | null>(null);

  const userRole = user?.role;

  const refresh = useCallback(async () => {
    if (userRole !== 'doctor') {
      setSummary(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<DoctorVerificationSummary>('/doctor/verification-summary');
      setSummary(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    summary,
    isLoading,
    error,
    refresh,
  };
}
