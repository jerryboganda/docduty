import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

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
  flaggedItems: Array<Record<string, any>>;
  badge: string;
  title: string;
  description: string;
  primaryCta: string;
  canApply: boolean;
  canEditVerification: boolean;
  canSubmitDocuments: boolean;
  blockingReason: string | null;
  documents: Array<Record<string, any>>;
  draftData: Record<string, any>;
  submittedSnapshot: Record<string, any> | null;
}

export function useDoctorVerification() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DoctorVerificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!user && user.role === 'doctor');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'doctor') {
      setSummary(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await api.get<DoctorVerificationSummary>('/doctor/verification-summary');
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load doctor verification');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
