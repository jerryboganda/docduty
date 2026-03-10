CREATE TABLE doctor_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_status text NOT NULL CHECK (
    current_status IN (
      'NOT_STARTED',
      'IN_PROGRESS',
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
      'RESUBMISSION_REQUIRED',
      'REVERIFICATION_REQUIRED'
    )
  ),
  submission_version integer NOT NULL DEFAULT 1 CHECK (submission_version >= 1),
  draft_data_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_snapshot_json jsonb,
  missing_items_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  flagged_items_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  submitted_at timestamptz,
  review_started_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id),
  approved_at timestamptz,
  rejection_reason_code text,
  rejection_reason_text text,
  resubmission_reason_text text,
  user_visible_note text,
  internal_note text,
  resubmission_count integer NOT NULL DEFAULT 0 CHECK (resubmission_count >= 0),
  requires_reverification_at timestamptz,
  last_saved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctor_verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES doctor_verifications(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size_bytes integer NOT NULL CHECK (file_size_bytes >= 0),
  checksum_sha256 text NOT NULL,
  document_status text NOT NULL DEFAULT 'uploaded' CHECK (
    document_status IN ('uploaded', 'accepted', 'rejected', 'needs_reupload')
  ),
  review_note text,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  uploaded_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at timestamptz,
  replaced_at timestamptz
);

CREATE TABLE doctor_verification_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES doctor_verifications(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id),
  actor_role text,
  event_type text NOT NULL,
  old_status text,
  new_status text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO doctor_verifications (
  doctor_user_id,
  current_status,
  submission_version,
  submitted_at,
  reviewed_at,
  approved_at,
  created_at,
  updated_at
)
SELECT
  u.id,
  CASE u.verification_status
    WHEN 'verified' THEN 'APPROVED'
    WHEN 'pending_review' THEN 'SUBMITTED'
    WHEN 'rejected' THEN 'REJECTED'
    ELSE 'NOT_STARTED'
  END,
  1,
  CASE WHEN u.verification_status = 'pending_review' THEN u.updated_at ELSE NULL END,
  CASE WHEN u.verification_status IN ('verified', 'rejected') THEN u.updated_at ELSE NULL END,
  CASE WHEN u.verification_status = 'verified' THEN u.updated_at ELSE NULL END,
  u.created_at,
  u.updated_at
FROM users u
WHERE u.role = 'doctor'
ON CONFLICT (doctor_user_id) DO NOTHING;

CREATE INDEX idx_doctor_verifications_status ON doctor_verifications(current_status, updated_at DESC);
CREATE INDEX idx_doctor_verification_documents_verification ON doctor_verification_documents(verification_id, document_type);
CREATE INDEX idx_doctor_verification_audit_logs_verification ON doctor_verification_audit_logs(verification_id, created_at DESC);

CREATE TRIGGER set_doctor_verifications_updated_at
BEFORE UPDATE ON doctor_verifications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
