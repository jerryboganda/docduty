/**
 * Shared TypeScript interfaces for DocDuty API responses.
 * Derived from the PostgreSQL schema (migrations 001–003).
 *
 * NOTE: These represent the *wire format* returned by the API — field names
 * use snake_case as they come directly from the database rows.
 */

/* ------------------------------------------------------------------ */
/*  Reference / lookup tables                                         */
/* ------------------------------------------------------------------ */

export interface ApiSkill {
  id: string;
  name: string;
}

export interface ApiSpecialty {
  id: string;
  name: string;
}

export interface ApiCity {
  id: string;
  name: string;
  province_id: string;
}

/* ------------------------------------------------------------------ */
/*  Users                                                              */
/* ------------------------------------------------------------------ */

export type UserRole = 'doctor' | 'facility_admin' | 'platform_admin';
export type UserStatus = 'pending' | 'active' | 'suspended' | 'banned';
export type VerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'rejected';

export interface ApiUser {
  id: string;
  phone: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  verification_status: VerificationStatus;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  /** Joined from doctor_profiles / facility_accounts */
  full_name?: string;
  facility_name?: string;
  specialty?: string;
  specialty_name?: string;
  city?: string;
  city_name?: string;
  pmdc_license?: string;
  cnic?: string;
  facility_type?: string;
  is_active?: boolean;
  rating?: number;
  reliability?: number;
  flags?: number;
  /** Profile sub-object returned by /auth/me */
  profile?: ApiDoctorProfile | ApiFacilityAccount;
}

export interface ApiDoctorProfile {
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
  specialty_name?: string;
  city_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiFacilityAccount {
  id: string;
  user_id: string;
  name: string;
  registration_number: string | null;
  type: 'hospital' | 'clinic' | 'lab' | 'other';
  city_id: string | null;
  verification_status: VerificationStatus;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Shifts                                                             */
/* ------------------------------------------------------------------ */

export type ShiftStatus = 'open' | 'booked' | 'in_progress' | 'completed' | 'cancelled' | 'expired' | 'dispatching';

export interface ApiShift {
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
  status: ShiftStatus;
  visibility: 'city' | 'national';
  requirements: string | null;
  city_id: string | null;
  counter_offer_allowed: boolean;
  created_at: string;
  updated_at: string;
  /* Joined fields */
  offers_count?: number;
  facility_name?: string;
  location_name?: string;
  location_address?: string;
  city_name?: string;
  specialty_name?: string;
  distance_km?: number | null;
  offer_expires_at?: string | null;
  offers?: ApiOffer[];
  skills?: ApiSkill[];
  required_skills?: ApiSkill[];
  latitude?: number;
  longitude?: number;
  role?: string;
  offered_rate?: number;
  doctor_name?: string;
}

/* ------------------------------------------------------------------ */
/*  Offers                                                             */
/* ------------------------------------------------------------------ */

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn' | 'declined' | 'sent' | 'counter';

export interface ApiOffer {
  id: string;
  shift_id: string;
  doctor_id: string;
  type: 'dispatch' | 'counter';
  counter_amount_pkr: number | null;
  status: OfferStatus;
  dispatched_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at?: string;
  /* Joined fields */
  doctor_name?: string;
  sent?: string;
}

/* ------------------------------------------------------------------ */
/*  Bookings                                                           */
/* ------------------------------------------------------------------ */

export type BookingStatus =
  | 'pending_payment' | 'confirmed' | 'in_progress' | 'completed'
  | 'cancelled' | 'no_show' | 'disputed' | 'resolved';

export interface ApiBooking {
  id: string;
  shift_id: string;
  doctor_id: string;
  poster_id: string;
  offer_id: string | null;
  status: BookingStatus;
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
  /* Joined fields */
  shift_title?: string;
  doctor_name?: string;
  facility_name?: string;
  start_time?: string;
  end_time?: string;
  location_name?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  facility_rating?: number | null;
  specialty_name?: string;
  doctor_reliability?: number;
  reliability_score?: number;
  doctor_rating?: number;
  shift_role?: string;
  role?: string;
  offered_rate?: number;
  checkin_verified?: boolean;
  attendanceEvents?: ApiAttendanceEvent[];
}

/* ------------------------------------------------------------------ */
/*  Attendance                                                         */
/* ------------------------------------------------------------------ */

export type AttendanceEventType = 'check_in' | 'check_out' | 'presence_ping';

export interface ApiAttendanceEvent {
  id: string;
  booking_id: string;
  user_id: string;
  event_type: AttendanceEventType;
  latitude: number | null;
  longitude: number | null;
  geo_valid: boolean;
  qr_code_scanned: string | null;
  qr_valid: boolean;
  device_info: Record<string, unknown> | null;
  mock_location_detected: boolean;
  admin_override: boolean;
  admin_override_by: string | null;
  admin_override_reason: string | null;
  recorded_at: string;
  /** Alternate/alias field returned by some API endpoints */
  geo_verified?: boolean;
  qr_verified?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Wallets & Ledger                                                   */
/* ------------------------------------------------------------------ */

export interface ApiWallet {
  id: string;
  user_id: string;
  balance_pkr: number;
  held_pkr: number;
  total_earned_pkr: number;
  total_spent_pkr: number;
  created_at: string;
  updated_at: string;
  /* Joined for admin payouts view */
  full_name?: string;
  phone?: string;
}

export type LedgerType = 'escrow_hold' | 'escrow_release' | 'platform_fee' | 'payout' | 'refund' | 'penalty' | 'deposit' | 'withdrawal';
export type LedgerDirection = 'credit' | 'debit';

export interface ApiLedgerTransaction {
  id: string;
  wallet_id: string;
  booking_id: string | null;
  type: LedgerType;
  amount_pkr: number;
  direction: LedgerDirection;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Payouts                                                            */
/* ------------------------------------------------------------------ */

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ApiPayout {
  id: string;
  wallet_id: string;
  amount_pkr: number;
  status: PayoutStatus;
  payment_method: string | null;
  payment_reference: string | null;
  requested_at: string;
  processed_at: string | null;
  created_at: string;
  /* Joined */
  full_name?: string;
  phone?: string;
}

/* ------------------------------------------------------------------ */
/*  Disputes                                                           */
/* ------------------------------------------------------------------ */

export type DisputeType = 'no_show' | 'late' | 'duty_mismatch' | 'facility_issue' | 'payment' | 'other';
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';
export type ResolutionType = 'full_payout' | 'partial_payout' | 'full_refund' | 'partial_refund' | 'penalty' | 'dismissed' | 'no_action';

export interface ApiDispute {
  id: string;
  booking_id: string;
  raised_by: string;
  raised_against: string;
  type: DisputeType;
  description: string;
  status: DisputeStatus;
  resolution_type: ResolutionType | null;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  /* Joined */
  raiser_name?: string;
  respondent_name?: string;
  shift_title?: string;
  booking_status?: string;
  attendanceEvents?: ApiAttendanceEvent[];
  raised_by_phone?: string;
}

/* ------------------------------------------------------------------ */
/*  Ratings                                                            */
/* ------------------------------------------------------------------ */

export interface ApiRating {
  id: string;
  booking_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment: string | null;
  tags?: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Notifications                                                      */
/* ------------------------------------------------------------------ */

export interface ApiNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: string | Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Messages                                                           */
/* ------------------------------------------------------------------ */

export interface ApiMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  /** Joined */
  sender_name?: string;
}

export interface ApiConversation {
  booking_id: string;
  other_user_name: string;
  other_user_id: string;
  last_message: string;
  last_message_at: string;
  shift_title?: string;
}

/* ------------------------------------------------------------------ */
/*  Audit Logs                                                         */
/* ------------------------------------------------------------------ */

export interface ApiAuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user_name?: string;
  user_phone?: string;
}

/* ------------------------------------------------------------------ */
/*  Facility Locations                                                 */
/* ------------------------------------------------------------------ */

export interface ApiFacilityLocation {
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
  /** Joined fields returned by admin endpoints */
  facility_name?: string;
  location_name?: string;
  qr_rotation_minutes?: number;
  geofence_radius?: number;
  require_geofence?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Doctor Verifications                                               */
/* ------------------------------------------------------------------ */

export type DoctorVerificationStatus =
  | 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW'
  | 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUIRED' | 'REVERIFICATION_REQUIRED';

export interface ApiDoctorVerification {
  id: string;
  doctor_user_id: string;
  current_status: DoctorVerificationStatus;
  submission_version: number;
  draft_data_json: Record<string, unknown>;
  submitted_snapshot_json: Record<string, unknown> | null;
  missing_items_json: unknown[];
  flagged_items_json: unknown[];
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
  created_at: string;
  updated_at: string;
  /* Joined fields */
  doctor_name?: string;
  doctor_phone?: string;
  documents?: ApiVerificationDocument[];
  audit?: ApiVerificationAuditEntry[];
  /** Additional joined fields from user/doctor profile */
  full_name?: string;
  phone?: string;
  email?: string;
  specialty_name?: string;
  city_name?: string;
  pmdc_license?: string;
}

export interface ApiVerificationDocument {
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

export interface ApiVerificationAuditEntry {
  id: string;
  verification_id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Policy Config                                                      */
/* ------------------------------------------------------------------ */

export interface ApiPolicyConfig {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Common API response wrappers                                       */
/* ------------------------------------------------------------------ */

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}

export interface NotificationsResponse {
  notifications: ApiNotification[];
  total: number;
}

export interface ConversationsResponse {
  conversations: ApiConversation[];
}

export interface MessagesResponse {
  messages: ApiMessage[];
}

export interface ShiftsResponse {
  shifts: ApiShift[];
}

export interface BookingsResponse {
  bookings: ApiBooking[];
}

export interface DisputesResponse {
  disputes: ApiDispute[];
}

export interface RatingsResponse {
  ratings: ApiRating[];
}

export interface UsersResponse {
  users: ApiUser[];
}

export interface PayoutsResponse {
  payouts: ApiPayout[];
}

export interface AuditLogsResponse {
  logs: ApiAuditLog[];
  total: number;
}

export interface AnalyticsResponse {
  totalDoctors: number;
  totalFacilities: number;
  totalShifts: number;
  totalBookings: number;
  totalRevenue: number;
  platformFees: number;
  completionRate: number;
  avgRating: number;
  disputeRate: number;
  timeSeries: TimeSeriesPoint[];
  topDoctors: TopDoctor[];
}

export interface TimeSeriesPoint {
  date: string;
  shifts: number;
  bookings: number;
  revenue: number;
}

export interface TopDoctor {
  name: string;
  shifts: number;
  rating: number;
  reliability: number;
  /** Alternate fields returned by some analytics endpoints */
  total_ratings?: number;
  avg_rating?: number;
}

export interface AdminDashboardResponse {
  stats: Record<string, number>;
  recent_verifications: AdminDashboardVerification[];
  recent_disputes: AdminDashboardDispute[];
  alerts: AdminDashboardAlert[];
}

export interface AdminDashboardVerification {
  name: string;
  type: string;
  time: string;
}

export interface AdminDashboardDispute {
  id: string;
  type: string;
  time: string;
  status?: string;
}

export interface AdminDashboardAlert {
  type: string;
  msg: string;
}

export interface WalletResponse {
  wallet: ApiWallet;
  transactions?: ApiLedgerTransaction[];
}

export interface SkillsResponse {
  skills: ApiSkill[];
}

export interface SpecialtiesResponse {
  specialties: ApiSpecialty[];
}

export interface FacilityLocationsResponse {
  locations: ApiFacilityLocation[];
  facilities?: ApiFacilityLocation[];
}

export interface AuthMeResponse {
  user: ApiUser;
}

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

export interface IntegrationsResponse {
  stripe: { masked_key: string; connected: boolean };
  twilio: { masked_sid: string; connected: boolean };
}

export interface VerificationsResponse {
  verifications: ApiDoctorVerification[];
}

export interface VerificationDetailResponse {
  verification: ApiDoctorVerification;
  documents: ApiVerificationDocument[];
  audit: ApiVerificationAuditEntry[];
}

export interface PoliciesResponse {
  policies: ApiPolicyConfig[];
}

/** Lucide icon component type — used instead of `any` for icon props */
export type LucideIcon = import('react').ComponentType<{ className?: string }>;
