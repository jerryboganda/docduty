import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/schema.js';

export const DOCTOR_VERIFICATION_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'RESUBMISSION_REQUIRED',
  'REVERIFICATION_REQUIRED',
] as const;

export type DoctorVerificationStatus = (typeof DOCTOR_VERIFICATION_STATUSES)[number];

export type DoctorVerificationRecord = {
  id: string;
  doctor_user_id: string;
  current_status: DoctorVerificationStatus;
  submission_version: number;
  draft_data_json: Record<string, unknown>;
  submitted_snapshot_json: Record<string, unknown> | null;
  missing_items_json: string[];
  flagged_items_json: Array<Record<string, unknown>>;
  submitted_at: string | null;
  review_started_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  approved_at: string | null;
  rejection_reason_code: string | null;
  rejection_reason_text: string | null;
  resubmission_reason_text: string | null;
  user_visible_note: string | null;
  internal_note: string | null;
  resubmission_count: number;
  requires_reverification_at: string | null;
  last_saved_at: string | null;
  created_at: string;
  updated_at: string;
};

type SummaryDescriptor = {
  badge: string;
  title: string;
  description: string;
  primaryCta: string;
  canApply: boolean;
  canEditVerification: boolean;
  canSubmitDocuments: boolean;
};

export class VerificationRequiredError extends Error {
  statusCode = 403;

  constructor(message = 'Doctor verification is required before this action can be completed.') {
    super(message);
    this.name = 'VerificationRequiredError';
  }
}

export function mapLegacyUserStatusToCanonical(value: string | null | undefined): DoctorVerificationStatus {
  switch (value) {
    case 'verified':
      return 'APPROVED';
    case 'pending_review':
      return 'SUBMITTED';
    case 'rejected':
      return 'REJECTED';
    default:
      return 'NOT_STARTED';
  }
}

export function mapCanonicalStatusToLegacy(value: DoctorVerificationStatus): 'unverified' | 'pending_review' | 'verified' | 'rejected' {
  switch (value) {
    case 'APPROVED':
      return 'verified';
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return 'pending_review';
    case 'REJECTED':
      return 'rejected';
    default:
      return 'unverified';
  }
}

export function getSummaryDescriptor(status: DoctorVerificationStatus): SummaryDescriptor {
  switch (status) {
    case 'IN_PROGRESS':
      return {
        badge: 'Verification Draft',
        title: 'Verification Draft',
        description: 'Your verification draft is saved. Finish it to unlock shift applications and staffing actions.',
        primaryCta: 'Continue Verification',
        canApply: false,
        canEditVerification: true,
        canSubmitDocuments: true,
      };
    case 'SUBMITTED':
      return {
        badge: 'Submitted',
        title: 'Verification Submitted',
        description: 'Your documents were received successfully. You cannot apply for shifts until review is complete.',
        primaryCta: 'View Submission',
        canApply: false,
        canEditVerification: false,
        canSubmitDocuments: false,
      };
    case 'UNDER_REVIEW':
      return {
        badge: 'Under Review',
        title: 'Under Review',
        description: 'Our team is actively reviewing your credentials. You will be notified as soon as a decision is made.',
        primaryCta: 'View Status',
        canApply: false,
        canEditVerification: false,
        canSubmitDocuments: false,
      };
    case 'APPROVED':
      return {
        badge: 'Verified Doctor',
        title: 'Verified Doctor',
        description: 'Your doctor account is approved and fully active for staffing workflows on DocDuty.',
        primaryCta: 'Browse Shifts',
        canApply: true,
        canEditVerification: false,
        canSubmitDocuments: false,
      };
    case 'REJECTED':
      return {
        badge: 'Verification Rejected',
        title: 'Verification Unsuccessful',
        description: 'Your verification could not be approved. Please contact support if you need further guidance.',
        primaryCta: 'Contact Support',
        canApply: false,
        canEditVerification: false,
        canSubmitDocuments: false,
      };
    case 'RESUBMISSION_REQUIRED':
      return {
        badge: 'Action Required',
        title: 'Action Required',
        description: 'Your verification needs updates before it can be approved. Review the flagged items and resubmit.',
        primaryCta: 'Fix & Resubmit',
        canApply: false,
        canEditVerification: true,
        canSubmitDocuments: true,
      };
    case 'REVERIFICATION_REQUIRED':
      return {
        badge: 'Reverification Required',
        title: 'Reverification Required',
        description: 'Your credentials need to be refreshed before you can continue applying for new shifts.',
        primaryCta: 'Start Reverification',
        canApply: false,
        canEditVerification: true,
        canSubmitDocuments: true,
      };
    case 'NOT_STARTED':
    default:
      return {
        badge: 'Verification Required',
        title: 'Verification Required',
        description: 'Complete your doctor verification to start applying for shifts, bookings, and staffing opportunities.',
        primaryCta: 'Start Verification',
        canApply: false,
        canEditVerification: true,
        canSubmitDocuments: true,
      };
  }
}

export async function appendVerificationAuditLog(options: {
  verificationId: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  eventType: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  await db.prepare(`
    INSERT INTO doctor_verification_audit_logs (
      id, verification_id, actor_user_id, actor_role, event_type, old_status, new_status, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    options.verificationId,
    options.actorUserId || null,
    options.actorRole || null,
    options.eventType,
    options.oldStatus || null,
    options.newStatus || null,
    JSON.stringify(options.metadata || {}),
  );
}

export async function syncLegacyUserVerificationStatus(userId: string, status: DoctorVerificationStatus): Promise<void> {
  const db = getDb();
  await db.prepare(`
    UPDATE users
    SET verification_status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(mapCanonicalStatusToLegacy(status), userId);
}

export async function getOrCreateDoctorVerification(userId: string): Promise<DoctorVerificationRecord> {
  const db = getDb();
  let verification = await db.prepare<DoctorVerificationRecord>(`
    SELECT *
    FROM doctor_verifications
    WHERE doctor_user_id = ?
  `).get(userId);

  if (verification) {
    return verification;
  }

  const user = await db.prepare<{ verification_status: string }>(`
    SELECT verification_status
    FROM users
    WHERE id = ?
  `).get(userId);

  const status = mapLegacyUserStatusToCanonical(user?.verification_status);
  verification = await db.prepare<DoctorVerificationRecord>(`
    INSERT INTO doctor_verifications (doctor_user_id, current_status)
    VALUES (?, ?)
    RETURNING *
  `).get(userId, status);

  if (!verification) {
    throw new Error('Failed to initialize doctor verification record');
  }

  await appendVerificationAuditLog({
    verificationId: verification.id,
    actorUserId: userId,
    actorRole: 'doctor',
    eventType: 'verification_initialized',
    newStatus: status,
  });

  return verification;
}

export async function getDoctorVerificationDocuments(verificationId: string) {
  const db = getDb();
  return db.prepare(`
    SELECT *
    FROM doctor_verification_documents
    WHERE verification_id = ?
    ORDER BY uploaded_at DESC
  `).all(verificationId);
}

export async function getDoctorVerificationSummary(userId: string) {
  const verification = await getOrCreateDoctorVerification(userId);
  const descriptor = getSummaryDescriptor(verification.current_status);
  const documents = await getDoctorVerificationDocuments(verification.id);

  return {
    verificationId: verification.id,
    status: verification.current_status,
    submissionVersion: verification.submission_version,
    lastSavedAt: verification.last_saved_at,
    submittedAt: verification.submitted_at,
    reviewStartedAt: verification.review_started_at,
    reviewedAt: verification.reviewed_at,
    approvedAt: verification.approved_at,
    reviewerId: verification.reviewed_by,
    reviewerNote: verification.user_visible_note,
    internalNote: verification.internal_note,
    rejectionReasonCode: verification.rejection_reason_code,
    rejectionReasonText: verification.rejection_reason_text,
    resubmissionReasonText: verification.resubmission_reason_text,
    missingItems: verification.missing_items_json || [],
    flaggedItems: verification.flagged_items_json || [],
    badge: descriptor.badge,
    title: descriptor.title,
    description: descriptor.description,
    primaryCta: descriptor.primaryCta,
    canApply: descriptor.canApply,
    canEditVerification: descriptor.canEditVerification,
    canSubmitDocuments: descriptor.canSubmitDocuments,
    blockingReason: descriptor.canApply
      ? null
      : 'Doctor verification is required before you can apply for shifts, confirm bookings, or participate in staffing workflows.',
    documents,
    draftData: verification.draft_data_json || {},
    submittedSnapshot: verification.submitted_snapshot_json || null,
  };
}

export async function requireApprovedDoctorVerification(userId: string): Promise<void> {
  const verification = await getOrCreateDoctorVerification(userId);
  if (verification.current_status !== 'APPROVED') {
    throw new VerificationRequiredError();
  }
}
