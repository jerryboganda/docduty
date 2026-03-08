CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TABLE provinces (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cities (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  province_id uuid NOT NULL REFERENCES provinces(id),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name, province_id)
);

CREATE TABLE specialties (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skills (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id uuid PRIMARY KEY,
  phone text NOT NULL UNIQUE,
  email text,
  role text NOT NULL CHECK (role IN ('doctor', 'facility_admin', 'platform_admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending_review', 'verified', 'rejected')),
  password_hash text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctor_profiles (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  cnic text,
  pmdc_license text,
  specialty_id uuid REFERENCES specialties(id),
  city_id uuid REFERENCES cities(id),
  coverage_radius_km integer NOT NULL DEFAULT 50 CHECK (coverage_radius_km >= 0),
  availability_status text NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline')),
  bio text,
  experience_years integer NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
  reliability_score double precision NOT NULL DEFAULT 100.0 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  rating_avg double precision NOT NULL DEFAULT 0.0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count integer NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  total_shifts_completed integer NOT NULL DEFAULT 0 CHECK (total_shifts_completed >= 0),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctor_skills (
  doctor_id uuid NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (doctor_id, skill_id)
);

CREATE TABLE facility_accounts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  registration_number text,
  type text NOT NULL DEFAULT 'hospital' CHECK (type IN ('hospital', 'clinic', 'lab', 'other')),
  city_id uuid REFERENCES cities(id),
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending_review', 'verified', 'rejected')),
  rating_avg double precision NOT NULL DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count integer NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE facility_locations (
  id uuid PRIMARY KEY,
  facility_id uuid NOT NULL REFERENCES facility_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  geofence_radius_m integer NOT NULL DEFAULT 200 CHECK (geofence_radius_m > 0),
  qr_secret text,
  qr_rotate_interval_min integer NOT NULL DEFAULT 5 CHECK (qr_rotate_interval_min > 0),
  is_active boolean NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shifts (
  id uuid PRIMARY KEY,
  poster_id uuid NOT NULL REFERENCES users(id),
  facility_location_id uuid REFERENCES facility_locations(id),
  type text NOT NULL CHECK (type IN ('replacement', 'vacancy')),
  title text NOT NULL,
  description text,
  department text,
  role_id uuid REFERENCES roles(id),
  specialty_id uuid REFERENCES specialties(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  total_price_pkr integer NOT NULL CHECK (total_price_pkr >= 0),
  platform_fee_pkr integer NOT NULL DEFAULT 0 CHECK (platform_fee_pkr >= 0),
  payout_pkr integer NOT NULL DEFAULT 0 CHECK (payout_pkr >= 0),
  urgency text NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'booked', 'in_progress', 'completed', 'cancelled', 'expired')),
  visibility text NOT NULL DEFAULT 'city' CHECK (visibility IN ('city', 'national')),
  requirements text,
  city_id uuid REFERENCES cities(id),
  counter_offer_allowed boolean NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT shifts_time_window_chk CHECK (end_time > start_time),
  CONSTRAINT shifts_pricing_consistency_chk CHECK (platform_fee_pkr <= total_price_pkr AND payout_pkr = total_price_pkr - platform_fee_pkr)
);

CREATE TABLE shift_skills (
  shift_id uuid NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (shift_id, skill_id)
);

CREATE TABLE offers (
  id uuid PRIMARY KEY,
  shift_id uuid NOT NULL REFERENCES shifts(id),
  doctor_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('dispatch', 'counter')),
  counter_amount_pkr integer CHECK (counter_amount_pkr IS NULL OR counter_amount_pkr >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'withdrawn')),
  dispatched_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY,
  shift_id uuid NOT NULL REFERENCES shifts(id),
  doctor_id uuid NOT NULL REFERENCES users(id),
  poster_id uuid NOT NULL REFERENCES users(id),
  offer_id uuid REFERENCES offers(id),
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'disputed', 'resolved')),
  total_price_pkr integer NOT NULL CHECK (total_price_pkr >= 0),
  platform_fee_pkr integer NOT NULL CHECK (platform_fee_pkr >= 0),
  payout_pkr integer NOT NULL CHECK (payout_pkr >= 0),
  check_in_time timestamptz,
  check_out_time timestamptz,
  settled_at timestamptz,
  cancelled_by text,
  cancellation_reason text,
  no_show_detected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bookings_pricing_consistency_chk CHECK (platform_fee_pkr <= total_price_pkr AND payout_pkr = total_price_pkr - platform_fee_pkr)
);

CREATE TABLE attendance_events (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES bookings(id),
  user_id uuid NOT NULL REFERENCES users(id),
  event_type text NOT NULL CHECK (event_type IN ('check_in', 'check_out', 'presence_ping')),
  latitude double precision CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude double precision CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  geo_valid boolean NOT NULL DEFAULT FALSE,
  qr_code_scanned text,
  qr_valid boolean NOT NULL DEFAULT FALSE,
  device_info jsonb,
  mock_location_detected boolean NOT NULL DEFAULT FALSE,
  admin_override boolean NOT NULL DEFAULT FALSE,
  admin_override_by text,
  admin_override_reason text,
  recorded_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallets (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES users(id),
  balance_pkr integer NOT NULL DEFAULT 0 CHECK (balance_pkr >= 0),
  held_pkr integer NOT NULL DEFAULT 0 CHECK (held_pkr >= 0),
  total_earned_pkr integer NOT NULL DEFAULT 0 CHECK (total_earned_pkr >= 0),
  total_spent_pkr integer NOT NULL DEFAULT 0 CHECK (total_spent_pkr >= 0),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ledger_transactions (
  id uuid PRIMARY KEY,
  wallet_id uuid NOT NULL REFERENCES wallets(id),
  booking_id uuid REFERENCES bookings(id),
  type text NOT NULL CHECK (type IN ('escrow_hold', 'escrow_release', 'platform_fee', 'payout', 'refund', 'penalty', 'deposit', 'withdrawal')),
  amount_pkr integer NOT NULL CHECK (amount_pkr >= 0),
  direction text NOT NULL CHECK (direction IN ('credit', 'debit')),
  description text,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payouts (
  id uuid PRIMARY KEY,
  wallet_id uuid NOT NULL REFERENCES wallets(id),
  amount_pkr integer NOT NULL CHECK (amount_pkr > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method text,
  payment_reference text,
  requested_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disputes (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES bookings(id),
  raised_by uuid NOT NULL REFERENCES users(id),
  raised_against uuid NOT NULL REFERENCES users(id),
  type text NOT NULL CHECK (type IN ('no_show', 'late', 'duty_mismatch', 'facility_issue', 'payment', 'other')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
  resolution_type text CHECK (resolution_type IN ('full_payout', 'partial_payout', 'full_refund', 'partial_refund', 'penalty', 'dismissed', 'no_action')),
  resolution_notes text,
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispute_evidence (
  id uuid PRIMARY KEY,
  dispute_id uuid NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('attendance_log', 'geo_data', 'qr_data', 'device_signal', 'chat_log', 'statement', 'document')),
  content text NOT NULL,
  submitted_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ratings (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES bookings(id),
  rater_id uuid NOT NULL REFERENCES users(id),
  rated_id uuid NOT NULL REFERENCES users(id),
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (booking_id, rater_id)
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  is_read boolean NOT NULL DEFAULT FALSE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES bookings(id),
  sender_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otp_codes (
  id uuid PRIMARY KEY,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT FALSE,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  device_info text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE policy_config (
  id uuid PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_submissions (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  push_notifications boolean NOT NULL DEFAULT TRUE,
  sms_notifications boolean NOT NULL DEFAULT TRUE,
  email_notifications boolean NOT NULL DEFAULT TRUE,
  marketing_emails boolean NOT NULL DEFAULT FALSE,
  profile_visibility text NOT NULL DEFAULT 'verified_only' CHECK (profile_visibility IN ('public', 'verified_only', 'private')),
  show_online_status boolean NOT NULL DEFAULT TRUE,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_doctor_profiles_user ON doctor_profiles(user_id);
CREATE INDEX idx_doctor_profiles_specialty ON doctor_profiles(specialty_id);
CREATE INDEX idx_doctor_profiles_city ON doctor_profiles(city_id);
CREATE INDEX idx_facility_accounts_user ON facility_accounts(user_id);
CREATE INDEX idx_facility_locations_facility ON facility_locations(facility_id);
CREATE INDEX idx_facility_locations_active ON facility_locations(is_active);
CREATE INDEX idx_shifts_poster ON shifts(poster_id);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_city ON shifts(city_id);
CREATE INDEX idx_shifts_start_time ON shifts(start_time);
CREATE INDEX idx_shifts_created_at ON shifts(created_at DESC);
CREATE INDEX idx_shifts_status_start_time ON shifts(status, start_time);
CREATE INDEX idx_open_shifts_by_start ON shifts(start_time) WHERE status = 'open';
CREATE INDEX idx_bookings_shift ON bookings(shift_id);
CREATE INDEX idx_bookings_doctor ON bookings(doctor_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_poster ON bookings(poster_id);
CREATE INDEX idx_bookings_doctor_status ON bookings(doctor_id, status);
CREATE INDEX idx_bookings_poster_status ON bookings(poster_id, status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX idx_attendance_booking ON attendance_events(booking_id);
CREATE INDEX idx_attendance_event_type ON attendance_events(event_type);
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_ledger_wallet ON ledger_transactions(wallet_id);
CREATE INDEX idx_ledger_booking ON ledger_transactions(booking_id);
CREATE INDEX idx_ledger_created ON ledger_transactions(created_at DESC);
CREATE INDEX idx_ledger_type ON ledger_transactions(type);
CREATE INDEX idx_disputes_booking ON disputes(booking_id);
CREATE INDEX idx_disputes_raised_by ON disputes(raised_by);
CREATE INDEX idx_disputes_raised_against ON disputes(raised_against);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_created_at ON disputes(created_at DESC);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_messages_booking ON messages(booking_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_otp_phone ON otp_codes(phone);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_offers_shift ON offers(shift_id);
CREATE INDEX idx_offers_doctor ON offers(doctor_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_pending_offers_by_shift ON offers(shift_id, created_at DESC) WHERE status = 'pending';
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_wallet ON payouts(wallet_id);
CREATE INDEX idx_payouts_created_at ON payouts(created_at DESC);
CREATE INDEX idx_ratings_rated ON ratings(rated_id);
CREATE INDEX idx_contact_status ON contact_submissions(status);

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_doctor_profiles_updated_at
BEFORE UPDATE ON doctor_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_facility_accounts_updated_at
BEFORE UPDATE ON facility_accounts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_facility_locations_updated_at
BEFORE UPDATE ON facility_locations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_shifts_updated_at
BEFORE UPDATE ON shifts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_disputes_updated_at
BEFORE UPDATE ON disputes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_policy_config_updated_at
BEFORE UPDATE ON policy_config
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
