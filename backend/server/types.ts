// ─── Database Row Types ─────────────────────────────────────────────────────
// These interfaces map directly to database tables with snake_case field names.
// Generated from migrations: 001_initial_schema, 002_allow_adjustment_ledger_type,
// 003_doctor_verification_workflow.

// ─── Lookup Tables ──────────────────────────────────────────────────────────

export interface ProvinceRow {
  id: string;
  name: string;
  created_at: string;
}

export interface CityRow {
  id: string;
  name: string;
  province_id: string;
  created_at: string;
}

export interface SpecialtyRow {
  id: string;
  name: string;
  created_at: string;
}

export interface RoleRow {
  id: string;
  name: string;
  created_at: string;
}

export interface SkillRow {
  id: string;
  name: string;
  created_at: string;
}

// ─── Core Tables ────────────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  phone: string;
  email: string | null;
  role: 'doctor' | 'facility_admin' | 'platform_admin';
  status: 'pending' | 'active' | 'suspended' | 'banned';
  verification_status: 'unverified' | 'pending_review' | 'verified' | 'rejected';
  password_hash: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfileRow {
  id: string;
  user_id: string;
  full_name: string;
  cnic: string | null;
  pmdc_license: string | null;
  specialty_id: string | null;
  city_id: string | null;
  coverage_radius_km: number;
  availability_status: 'available' | 'busy' | 'offline';
  bio: string | null;
  experience_years: number;
  reliability_score: number;
  rating_avg: number;
  rating_count: number;
  total_shifts_completed: number;
  created_at: string;
  updated_at: string;
}

export interface DoctorSkillRow {
  doctor_id: string;
  skill_id: string;
}

export interface FacilityAccountRow {
  id: string;
  user_id: string;
  name: string;
  registration_number: string | null;
  type: 'hospital' | 'clinic' | 'lab' | 'other';
  city_id: string | null;
  verification_status: 'unverified' | 'pending_review' | 'verified' | 'rejected';
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface FacilityLocationRow {
  id: string;
  facility_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  geofence_radius_m: number;
  qr_secret: string | null;
  qr_rotate_interval_min: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Shifts & Bookings ──────────────────────────────────────────────────────

export interface ShiftRow {
  id: string;
  poster_id: string;
  facility_location_id: string | null;
  type: 'replacement' | 'vacancy';
  title: string;
  description: string | null;
  department: string | null;
  role_id: string | null;
  specialty_id: string | null;
  start_time: string;
  end_time: string;
  total_price_pkr: number;
  platform_fee_pkr: number;
  payout_pkr: number;
  urgency: 'normal' | 'urgent' | 'critical';
  status: 'open' | 'booked' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  visibility: 'city' | 'national';
  requirements: string | null;
  city_id: string | null;
  counter_offer_allowed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShiftSkillRow {
  shift_id: string;
  skill_id: string;
}

export interface OfferRow {
  id: string;
  shift_id: string;
  doctor_id: string;
  type: 'dispatch' | 'counter';
  counter_amount_pkr: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
  dispatched_at: string;
  responded_at: string | null;
  created_at: string;
}

export interface BookingRow {
  id: string;
  shift_id: string;
  doctor_id: string;
  poster_id: string;
  offer_id: string | null;
  status:
    | 'pending_payment'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show'
    | 'disputed'
    | 'resolved';
  total_price_pkr: number;
  platform_fee_pkr: number;
  payout_pkr: number;
  check_in_time: string | null;
  check_out_time: string | null;
  settled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  no_show_detected_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Attendance ─────────────────────────────────────────────────────────────

export interface AttendanceEventRow {
  id: string;
  booking_id: string;
  user_id: string;
  event_type: 'check_in' | 'check_out' | 'presence_ping';
  latitude: number | null;
  longitude: number | null;
  geo_valid: boolean;
  qr_code_scanned: string | null;
  qr_valid: boolean;
  device_info: unknown | null;
  mock_location_detected: boolean;
  admin_override: boolean;
  admin_override_by: string | null;
  admin_override_reason: string | null;
  recorded_at: string;
}

// ─── Financial ──────────────────────────────────────────────────────────────

export interface WalletRow {
  id: string;
  user_id: string;
  balance_pkr: number;
  held_pkr: number;
  total_earned_pkr: number;
  total_spent_pkr: number;
  created_at: string;
  updated_at: string;
}

export interface LedgerTransactionRow {
  id: string;
  wallet_id: string;
  booking_id: string | null;
  type:
    | 'escrow_hold'
    | 'escrow_release'
    | 'platform_fee'
    | 'payout'
    | 'refund'
    | 'penalty'
    | 'deposit'
    | 'withdrawal'
    | 'adjustment';
  amount_pkr: number;
  direction: 'credit' | 'debit';
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface PayoutRow {
  id: string;
  wallet_id: string;
  amount_pkr: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_method: string | null;
  payment_reference: string | null;
  requested_at: string;
  processed_at: string | null;
  created_at: string;
}

// ─── Disputes ───────────────────────────────────────────────────────────────

export interface DisputeRow {
  id: string;
  booking_id: string;
  raised_by: string;
  raised_against: string;
  type: 'no_show' | 'late' | 'duty_mismatch' | 'facility_issue' | 'payment' | 'other';
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  resolution_type:
    | 'full_payout'
    | 'partial_payout'
    | 'full_refund'
    | 'partial_refund'
    | 'penalty'
    | 'dismissed'
    | 'no_action'
    | null;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisputeEvidenceRow {
  id: string;
  dispute_id: string;
  type:
    | 'attendance_log'
    | 'geo_data'
    | 'qr_data'
    | 'device_signal'
    | 'chat_log'
    | 'statement'
    | 'document';
  content: string;
  submitted_by: string;
  created_at: string;
}

// ─── Ratings & Communication ────────────────────────────────────────────────

export interface RatingRow {
  id: string;
  booking_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: unknown | null;
  is_read: boolean;
  created_at: string;
}

export interface MessageRow {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

// ─── Admin & Audit ──────────────────────────────────────────────────────────

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: unknown | null;
  new_value: unknown | null;
  ip_address: string | null;
  created_at: string;
}

export interface PolicyConfigRow {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface OtpCodeRow {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  used: boolean;
  attempts: number;
  created_at: string;
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  device_info: string | null;
  expires_at: string;
  created_at: string;
}

// ─── Contact & Preferences ─────────────────────────────────────────────────

export interface ContactSubmissionRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

export interface UserPreferencesRow {
  user_id: string;
  push_notifications: boolean;
  sms_notifications: boolean;
  email_notifications: boolean;
  marketing_emails: boolean;
  profile_visibility: 'public' | 'verified_only' | 'private';
  show_online_status: boolean;
  updated_at: string;
}

// ─── Doctor Verification (migration 003) ────────────────────────────────────

export interface DoctorVerificationRow {
  id: string;
  doctor_user_id: string;
  current_status:
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'RESUBMISSION_REQUIRED'
    | 'REVERIFICATION_REQUIRED';
  submission_version: number;
  draft_data_json: unknown;
  submitted_snapshot_json: unknown | null;
  missing_items_json: unknown;
  flagged_items_json: unknown;
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
}

export interface DoctorVerificationDocumentRow {
  id: string;
  verification_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  checksum_sha256: string;
  document_status: 'uploaded' | 'accepted' | 'rejected' | 'needs_reupload';
  review_note: string | null;
  uploaded_by: string;
  uploaded_at: string;
  reviewed_at: string | null;
  replaced_at: string | null;
}

export interface DoctorVerificationAuditLogRow {
  id: string;
  verification_id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  metadata_json: unknown;
  created_at: string;
}

// ─── Helper Types ───────────────────────────────────────────────────────────

/** Slim row returned when fetching a single policy config value. */
export interface PolicyValueRow {
  value: string;
}

/** Parameter array for parameterized queries. */
export type QueryParams = unknown[];
