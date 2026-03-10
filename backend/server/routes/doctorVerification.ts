import { Router, type Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config.js';
import { getDb } from '../database/schema.js';
import { authMiddleware, type AuthRequest, requireRole } from '../middleware/auth.js';
import {
  appendVerificationAuditLog,
  getDoctorVerificationDocuments,
  getDoctorVerificationSummary,
  getOrCreateDoctorVerification,
  syncLegacyUserVerificationStatus,
} from '../utils/doctorVerification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('doctor'));

const DOCUMENTS_DIR = path.join(env.uploadsDir, 'verification-documents');
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

const ALLOWED_DOC_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
const ALLOWED_DOC_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const MAX_DOC_SIZE = 10 * 1024 * 1024;
const PUBLIC_API_URL = (process.env.PUBLIC_API_URL || '').trim().replace(/\/$/, '');
const REQUIRED_DOCUMENT_TYPES = ['pmdc_certificate', 'mbbs_degree', 'cnic_front', 'cnic_back', 'profile_photo'] as const;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_DOC_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_DOC_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_DOC_MIME_TYPES)[number])) {
      cb(new Error(`Invalid file type. Allowed: ${ALLOWED_DOC_MIME_TYPES.join(', ')}`));
      return;
    }

    const extension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_DOC_EXTENSIONS.includes(extension)) {
      cb(new Error(`Invalid file extension. Allowed: ${ALLOWED_DOC_EXTENSIONS.join(', ')}`));
      return;
    }

    cb(null, true);
  },
});

function buildDocumentUrl(filename: string): string {
  const relativePath = `/api/uploads/verification-documents/${filename}`;
  return PUBLIC_API_URL ? `${PUBLIC_API_URL}${relativePath}` : relativePath;
}

function sanitizeVerificationDraft(input: Record<string, unknown>) {
  const step = typeof input.step === 'string' ? input.step : null;
  return {
    personalIdentity: typeof input.personalIdentity === 'object' && input.personalIdentity ? input.personalIdentity : {},
    professionalPractice: typeof input.professionalPractice === 'object' && input.professionalPractice ? input.professionalPractice : {},
    education: typeof input.education === 'object' && input.education ? input.education : {},
    declaration: typeof input.declaration === 'object' && input.declaration ? input.declaration : {},
    step,
  };
}

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => String(entry || '').trim())
    .filter(Boolean);
}

function computeMissingItems(draftData: Record<string, any>, documents: Array<Record<string, any>>, email: string | null, avatarUrl: string | null): string[] {
  const personal = draftData.personalIdentity || {};
  const professional = draftData.professionalPractice || {};
  const education = draftData.education || {};

  const docsByType = new Set(documents.map((document) => String(document.document_type)));
  const missing: string[] = [];

  if (!String(personal.legalFullName || '').trim()) missing.push('personalIdentity.legalFullName');
  if (!String(personal.dateOfBirth || '').trim()) missing.push('personalIdentity.dateOfBirth');
  if (!String(personal.cnicNumber || '').trim()) missing.push('personalIdentity.cnicNumber');
  if (!email?.trim()) missing.push('personalIdentity.email');
  if (!avatarUrl && !docsByType.has('profile_photo')) missing.push('documents.profile_photo');

  if (!String(professional.currentDesignation || '').trim()) missing.push('professionalPractice.currentDesignation');
  if (!String(professional.primarySpecialty || '').trim()) missing.push('professionalPractice.primarySpecialty');
  if (!String(professional.pmdcRegistrationNumber || '').trim()) missing.push('professionalPractice.pmdcRegistrationNumber');
  if (!String(professional.currentPracticeCity || '').trim()) missing.push('professionalPractice.currentPracticeCity');
  if (normalizeArray(professional.preferredWorkCities).length === 0) missing.push('professionalPractice.preferredWorkCities');

  if (!String(education.mbbsInstitution || '').trim()) missing.push('education.mbbsInstitution');
  if (!String(education.mbbsGraduationYear || '').trim()) missing.push('education.mbbsGraduationYear');
  if (!String(education.houseJobStatus || '').trim()) missing.push('education.houseJobStatus');
  if (!Boolean((draftData.declaration || {}).confirmsAccuracy)) missing.push('declaration.confirmsAccuracy');
  if (!Boolean((draftData.declaration || {}).confirmsGenuineDocuments)) missing.push('declaration.confirmsGenuineDocuments');
  if (!Boolean((draftData.declaration || {}).consentsToReview)) missing.push('declaration.consentsToReview');

  for (const type of REQUIRED_DOCUMENT_TYPES) {
    if (type === 'profile_photo' && avatarUrl) {
      continue;
    }
    if (!docsByType.has(type)) {
      missing.push(`documents.${type}`);
    }
  }

  const specialistClaim = String(professional.primarySpecialty || '').trim().toLowerCase();
  const requiresPostgraduate = specialistClaim && !['general physician', 'mbbs doctor', 'medical officer', 'er physician'].includes(specialistClaim);
  if (requiresPostgraduate && !docsByType.has('postgraduate_certificate')) {
    missing.push('documents.postgraduate_certificate');
  }

  return missing;
}

async function getDoctorContext(userId: string) {
  const db = getDb();
  const user = await db.prepare<any>(`
    SELECT id, phone, email, avatar_url, created_at
    FROM users
    WHERE id = ?
  `).get(userId);
  const profile = await db.prepare<any>(`
    SELECT dp.*, sp.name AS specialty_name, c.name AS city_name
    FROM doctor_profiles dp
    LEFT JOIN specialties sp ON sp.id = dp.specialty_id
    LEFT JOIN cities c ON c.id = dp.city_id
    WHERE dp.user_id = ?
  `).get(userId);

  return { user, profile };
}

router.get('/verification-summary', asyncHandler(async (req: AuthRequest, res: Response) => {
  const summary = await getDoctorVerificationSummary(req.user!.userId);
  res.json(summary);
}));

router.get('/verification-draft', asyncHandler(async (req: AuthRequest, res: Response) => {
  const verification = await getOrCreateDoctorVerification(req.user!.userId);
  const documents = await getDoctorVerificationDocuments(verification.id);
  const context = await getDoctorContext(req.user!.userId);

  res.json({
    verificationId: verification.id,
    status: verification.current_status,
    submissionVersion: verification.submission_version,
    lastSavedAt: verification.last_saved_at,
    draftData: verification.draft_data_json || {},
    submittedSnapshot: verification.submitted_snapshot_json || null,
    missingItems: verification.missing_items_json || [],
    flaggedItems: verification.flagged_items_json || [],
    documents,
    profile: context.profile,
    user: context.user,
  });
}));

router.get('/verification-history', asyncHandler(async (req: AuthRequest, res: Response) => {
  const verification = await getOrCreateDoctorVerification(req.user!.userId);
  const audit = await getDb().prepare(`
    SELECT *
    FROM doctor_verification_audit_logs
    WHERE verification_id = ?
    ORDER BY created_at DESC
  `).all(verification.id);

  res.json({ history: audit });
}));

router.post('/verification-draft', asyncHandler(async (req: AuthRequest, res: Response) => {
  const verification = await getOrCreateDoctorVerification(req.user!.userId);
  if (verification.current_status === 'SUBMITTED' || verification.current_status === 'UNDER_REVIEW' || verification.current_status === 'APPROVED') {
    res.status(409).json({ error: 'Verification draft cannot be edited in the current state.' });
    return;
  }

  const sanitized = sanitizeVerificationDraft(req.body || {});
  const context = await getDoctorContext(req.user!.userId);
  const documents = await getDoctorVerificationDocuments(verification.id);
  const missingItems = computeMissingItems(sanitized, documents as Array<Record<string, any>>, context.user?.email || null, context.user?.avatar_url || null);
  const nextStatus = verification.current_status === 'NOT_STARTED' ? 'IN_PROGRESS' : verification.current_status;

  const updated = await getDb().prepare(`
    UPDATE doctor_verifications
    SET draft_data_json = ?, current_status = ?, missing_items_json = ?, last_saved_at = CURRENT_TIMESTAMP
    WHERE id = ?
    RETURNING *
  `).get(JSON.stringify(sanitized), nextStatus, JSON.stringify(missingItems), verification.id);

  await syncLegacyUserVerificationStatus(req.user!.userId, updated.current_status);
  await appendVerificationAuditLog({
    verificationId: verification.id,
    actorUserId: req.user!.userId,
    actorRole: req.user!.role,
    eventType: 'draft_saved',
    oldStatus: verification.current_status,
    newStatus: updated.current_status,
    metadata: { step: sanitized.step, missingItems },
  });

  res.json({
    message: 'Verification draft saved',
    verificationId: verification.id,
    status: updated.current_status,
    lastSavedAt: updated.last_saved_at,
    missingItems,
  });
}));

router.post('/verification-documents', upload.single('document'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const verification = await getOrCreateDoctorVerification(req.user!.userId);
  if (!req.file) {
    res.status(400).json({ error: 'A verification document is required.' });
    return;
  }
  if (verification.current_status === 'SUBMITTED' || verification.current_status === 'UNDER_REVIEW' || verification.current_status === 'APPROVED') {
    res.status(409).json({ error: 'Documents cannot be changed in the current verification state.' });
    return;
  }

  const documentType = String(req.body.documentType || '').trim();
  if (!documentType) {
    res.status(400).json({ error: 'documentType is required' });
    return;
  }

  const extension = path.extname(req.file.originalname).toLowerCase() || '.pdf';
  const filename = `${req.user!.userId}_${documentType}_${crypto.randomBytes(8).toString('hex')}${extension}`;
  const destination = path.join(DOCUMENTS_DIR, filename);
  await fsp.writeFile(destination, req.file.buffer);

  const checksum = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
  await getDb().prepare(`
    UPDATE doctor_verification_documents
    SET replaced_at = CURRENT_TIMESTAMP
    WHERE verification_id = ? AND document_type = ? AND replaced_at IS NULL
  `).run(verification.id, documentType);

  const document = await getDb().prepare(`
    INSERT INTO doctor_verification_documents (
      verification_id, document_type, file_url, file_name, mime_type, file_size_bytes, checksum_sha256, uploaded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).get(
    verification.id,
    documentType,
    buildDocumentUrl(filename),
    req.file.originalname,
    req.file.mimetype,
    req.file.size,
    checksum,
    req.user!.userId,
  );

  const context = await getDoctorContext(req.user!.userId);
  const documents = await getDoctorVerificationDocuments(verification.id);
  const missingItems = computeMissingItems(verification.draft_data_json || {}, documents as Array<Record<string, any>>, context.user?.email || null, context.user?.avatar_url || null);
  await getDb().prepare(`
    UPDATE doctor_verifications
    SET current_status = ?, missing_items_json = ?, last_saved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    verification.current_status === 'NOT_STARTED' ? 'IN_PROGRESS' : verification.current_status,
    JSON.stringify(missingItems),
    verification.id,
  );
  await syncLegacyUserVerificationStatus(
    req.user!.userId,
    verification.current_status === 'NOT_STARTED' ? 'IN_PROGRESS' : verification.current_status,
  );

  await appendVerificationAuditLog({
    verificationId: verification.id,
    actorUserId: req.user!.userId,
    actorRole: req.user!.role,
    eventType: 'document_uploaded',
    oldStatus: verification.current_status,
    newStatus: verification.current_status === 'NOT_STARTED' ? 'IN_PROGRESS' : verification.current_status,
    metadata: { documentType, fileName: req.file.originalname },
  });

  res.status(201).json({
    message: 'Verification document uploaded',
    document,
    missingItems,
  });
}));

router.post('/verification-submit', asyncHandler(async (req: AuthRequest, res: Response) => {
  const verification = await getOrCreateDoctorVerification(req.user!.userId);
  if (!['IN_PROGRESS', 'RESUBMISSION_REQUIRED', 'REVERIFICATION_REQUIRED', 'NOT_STARTED'].includes(verification.current_status)) {
    res.status(409).json({ error: 'Verification cannot be submitted in the current state.' });
    return;
  }

  const context = await getDoctorContext(req.user!.userId);
  const documents = await getDoctorVerificationDocuments(verification.id);
  const draftData = sanitizeVerificationDraft((verification.draft_data_json || {}) as Record<string, unknown>);
  const missingItems = computeMissingItems(draftData, documents as Array<Record<string, any>>, context.user?.email || null, context.user?.avatar_url || null);

  if (missingItems.length > 0) {
    await getDb().prepare(`
      UPDATE doctor_verifications
      SET missing_items_json = ?, current_status = 'IN_PROGRESS', last_saved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(missingItems), verification.id);
    await syncLegacyUserVerificationStatus(req.user!.userId, 'IN_PROGRESS');
    res.status(422).json({
      error: 'Verification submission is incomplete.',
      missingItems,
    });
    return;
  }

  const snapshot = {
    user: {
      id: context.user.id,
      phone: context.user.phone,
      email: context.user.email,
      avatarUrl: context.user.avatar_url,
    },
    profile: context.profile,
    draftData,
    documents,
    attestationAcceptedAt: new Date().toISOString(),
  };

  const updated = await getDb().prepare(`
    UPDATE doctor_verifications
    SET
      current_status = 'SUBMITTED',
      submitted_snapshot_json = ?,
      submitted_at = CURRENT_TIMESTAMP,
      review_started_at = NULL,
      reviewed_at = NULL,
      reviewed_by = NULL,
      approved_at = NULL,
      rejection_reason_code = NULL,
      rejection_reason_text = NULL,
      resubmission_reason_text = NULL,
      user_visible_note = NULL,
      missing_items_json = '[]'::jsonb,
      flagged_items_json = '[]'::jsonb,
      internal_note = NULL
    WHERE id = ?
    RETURNING *
  `).get(JSON.stringify(snapshot), verification.id);

  await syncLegacyUserVerificationStatus(req.user!.userId, 'SUBMITTED');
  await getDb().prepare(`
    INSERT INTO notifications (id, user_id, type, title, body, data)
    VALUES (?, ?, 'verification_update', 'Verification Submitted', ?, ?)
  `).run(
    uuidv4(),
    req.user!.userId,
    'Your verification has been submitted successfully. We will notify you after review.',
    JSON.stringify({ verificationId: verification.id, status: 'SUBMITTED' }),
  );
  await appendVerificationAuditLog({
    verificationId: verification.id,
    actorUserId: req.user!.userId,
    actorRole: req.user!.role,
    eventType: 'verification_submitted',
    oldStatus: verification.current_status,
    newStatus: updated.current_status,
    metadata: { submissionVersion: updated.submission_version },
  });

  res.json({
    message: 'Verification submitted successfully',
    verificationId: verification.id,
    status: updated.current_status,
    submittedAt: updated.submitted_at,
  });
}));

router.post('/verification-withdraw', asyncHandler(async (req: AuthRequest, res: Response) => {
  const verification = await getOrCreateDoctorVerification(req.user!.userId);
  if (verification.current_status !== 'SUBMITTED') {
    res.status(409).json({ error: 'Only submitted verification applications can be withdrawn.' });
    return;
  }

  const updated = await getDb().prepare(`
    UPDATE doctor_verifications
    SET current_status = 'IN_PROGRESS', review_started_at = NULL, submitted_at = NULL, last_saved_at = CURRENT_TIMESTAMP
    WHERE id = ?
    RETURNING *
  `).get(verification.id);

  await syncLegacyUserVerificationStatus(req.user!.userId, updated.current_status);
  await appendVerificationAuditLog({
    verificationId: verification.id,
    actorUserId: req.user!.userId,
    actorRole: req.user!.role,
    eventType: 'verification_withdrawn',
    oldStatus: verification.current_status,
    newStatus: updated.current_status,
  });

  res.json({
    message: 'Verification submission withdrawn',
    status: updated.current_status,
  });
}));

export const doctorVerificationRouter = router;
