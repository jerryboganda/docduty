/**
 * Seed reference and demo data for DocDuty.
 * Reference data is always idempotent. Demo data is development/test only.
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { env } from '../config.js';
import { getDb } from './schema.js';

const UUID_NAMESPACE = '4d7f2c8d-5f6f-4e9a-b8ba-b8d990c5fd61';

function deterministicId(scope: string, value: string): string {
  return uuidv5(`${scope}:${value}`, UUID_NAMESPACE);
}

export async function seedReferenceData(): Promise<void> {
  if (!env.seedReferenceData) {
    return;
  }

  const db = getDb();

  await db.transaction(async () => {
    const provinceNames = [
      'Punjab',
      'Sindh',
      'Khyber Pakhtunkhwa',
      'Balochistan',
      'Islamabad Capital Territory',
      'Azad Kashmir',
      'Gilgit-Baltistan',
    ];

    for (const name of provinceNames) {
      await db.prepare(`
        INSERT INTO provinces (id, name)
        VALUES (?, ?)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      `).run(deterministicId('province', name), name);
    }

    const provinces = await db.prepare<{ id: string; name: string }>('SELECT id, name FROM provinces').all();
    const provinceIds = Object.fromEntries(provinces.map((province) => [province.name, province.id]));

    const cityData: Array<[string, string]> = [
      ['Islamabad', 'Islamabad Capital Territory'],
      ['Rawalpindi', 'Punjab'],
      ['Lahore', 'Punjab'],
      ['Faisalabad', 'Punjab'],
      ['Multan', 'Punjab'],
      ['Gujranwala', 'Punjab'],
      ['Sialkot', 'Punjab'],
      ['Bahawalpur', 'Punjab'],
      ['Sargodha', 'Punjab'],
      ['Sahiwal', 'Punjab'],
      ['Karachi', 'Sindh'],
      ['Hyderabad', 'Sindh'],
      ['Sukkur', 'Sindh'],
      ['Larkana', 'Sindh'],
      ['Peshawar', 'Khyber Pakhtunkhwa'],
      ['Abbottabad', 'Khyber Pakhtunkhwa'],
      ['Mardan', 'Khyber Pakhtunkhwa'],
      ['Swat', 'Khyber Pakhtunkhwa'],
      ['Quetta', 'Balochistan'],
      ['Turbat', 'Balochistan'],
      ['Muzaffarabad', 'Azad Kashmir'],
      ['Mirpur', 'Azad Kashmir'],
      ['Gilgit', 'Gilgit-Baltistan'],
      ['Skardu', 'Gilgit-Baltistan'],
    ];

    for (const [cityName, provinceName] of cityData) {
      await db.prepare(`
        INSERT INTO cities (id, name, province_id)
        VALUES (?, ?, ?)
        ON CONFLICT (name, province_id) DO UPDATE SET name = EXCLUDED.name
      `).run(
        deterministicId('city', `${provinceName}:${cityName}`),
        cityName,
        provinceIds[provinceName],
      );
    }

    const specialties = [
      'General Medicine',
      'General Surgery',
      'Pediatrics',
      'Gynecology & Obstetrics',
      'Orthopedics',
      'Cardiology',
      'Neurology',
      'Dermatology',
      'Ophthalmology',
      'ENT (Otolaryngology)',
      'Urology',
      'Nephrology',
      'Pulmonology',
      'Gastroenterology',
      'Psychiatry',
      'Anesthesiology',
      'Radiology',
      'Pathology',
      'Emergency Medicine',
      'Family Medicine',
      'Internal Medicine',
      'Oncology',
      'Endocrinology',
    ];

    for (const name of specialties) {
      await db.prepare(`
        INSERT INTO specialties (id, name)
        VALUES (?, ?)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      `).run(deterministicId('specialty', name), name);
    }

    const roles = [
      'House Officer',
      'Medical Officer',
      'Registrar',
      'Senior Registrar',
      'Assistant Professor',
      'Associate Professor',
      'Professor',
      'Consultant',
      'Resident',
      'Fellow',
      'Locum Consultant',
    ];

    for (const name of roles) {
      await db.prepare(`
        INSERT INTO roles (id, name)
        VALUES (?, ?)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      `).run(deterministicId('role', name), name);
    }

    const skills = [
      'BLS Certified',
      'ACLS Certified',
      'Ventilator Management',
      'Intubation',
      'Central Line Placement',
      'Chest Tube Insertion',
      'Lumbar Puncture',
      'Suturing',
      'Fracture Management',
      'ECG Interpretation',
      'Ultrasound (Point of Care)',
      'IV Cannulation',
      'Blood Gas Analysis',
      'Neonatal Resuscitation',
      'Trauma Management',
      'Wound Care',
    ];

    for (const name of skills) {
      await db.prepare(`
        INSERT INTO skills (id, name)
        VALUES (?, ?)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      `).run(deterministicId('skill', name), name);
    }

    const policies: Array<[string, string, string]> = [
      ['checkin_window_before_min', '15', 'Minutes before shift start that check-in is allowed'],
      ['checkin_window_after_min', '15', 'Minutes after shift start before no-show is triggered'],
      ['checkout_window_before_min', '10', 'Minutes before shift end that checkout is allowed'],
      ['checkout_window_after_min', '30', 'Minutes after shift end that checkout is allowed'],
      ['no_show_threshold_min', '15', 'Minutes after start to auto-flag no-show'],
      ['cancel_24h_refund_pct', '100', 'Refund percentage for cancellations >24h before shift'],
      ['cancel_2_24h_refund_pct', '50', 'Refund percentage for cancellations 2-24h before shift'],
      ['cancel_under_2h_refund_pct', '0', 'Refund percentage for cancellations <2h before shift'],
      ['platform_commission_pct', '10', 'Default platform commission percentage'],
      ['min_platform_fee_pkr', '200', 'Minimum platform fee in PKR'],
      ['max_reliability_score', '100', 'Maximum reliability score'],
      ['no_show_reliability_penalty', '15', 'Reliability score decrease per no-show'],
      ['late_checkin_reliability_penalty', '5', 'Reliability score decrease per late check-in'],
      ['completion_reliability_bonus', '1', 'Reliability score increase per completed shift'],
      ['cancel_reliability_penalty', '10', 'Reliability score decrease per cancellation by doctor'],
      ['noshow_penalty_fee_pkr', '500', 'Financial penalty charged to doctor for no-show (PKR)'],
      ['dispute_penalty_fee_pkr', '500', 'Financial penalty charged to doctor for dispute resolution penalty (PKR)'],
      ['geofence_default_radius_m', '200', 'Default geofence radius in meters'],
      ['qr_rotation_interval_min', '5', 'Default QR rotation interval in minutes'],
    ];

    for (const [key, value, description] of policies) {
      await db.prepare(`
        INSERT INTO policy_config (id, key, value, description)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          description = EXCLUDED.description
      `).run(deterministicId('policy', key), key, value, description);
    }
  })();

  console.log('[Seed] Reference data ensured');

  if (env.seedDemoData) {
    await seedDemoData();
  }
}

async function seedDemoData(): Promise<void> {
  const db = getDb();
  const existingUsers = await db.prepare<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM users WHERE phone = '03001234567'"
  ).get();

  if ((existingUsers?.count ?? 0) > 0) {
    console.log('[Seed] Demo data already seeded, skipping');
    return;
  }

  const passwordHash = await bcrypt.hash('test123', 10);

  const islamabad = await db.prepare<{ id: string }>("SELECT id FROM cities WHERE name = 'Islamabad'").get();
  const lahore = await db.prepare<{ id: string }>("SELECT id FROM cities WHERE name = 'Lahore'").get();
  const karachi = await db.prepare<{ id: string }>("SELECT id FROM cities WHERE name = 'Karachi'").get();
  const genMed = await db.prepare<{ id: string }>("SELECT id FROM specialties WHERE name = 'General Medicine'").get();
  const surgery = await db.prepare<{ id: string }>("SELECT id FROM specialties WHERE name = 'General Surgery'").get();
  const emergency = await db.prepare<{ id: string }>("SELECT id FROM specialties WHERE name = 'Emergency Medicine'").get();
  const pediatrics = await db.prepare<{ id: string }>("SELECT id FROM specialties WHERE name = 'Pediatrics'").get();
  const medOfficer = await db.prepare<{ id: string }>("SELECT id FROM roles WHERE name = 'Medical Officer'").get();
  const registrar = await db.prepare<{ id: string }>("SELECT id FROM roles WHERE name = 'Registrar'").get();
  const blsCert = await db.prepare<{ id: string }>("SELECT id FROM skills WHERE name = 'BLS Certified'").get();
  const aclsCert = await db.prepare<{ id: string }>("SELECT id FROM skills WHERE name = 'ACLS Certified'").get();
  const intubation = await db.prepare<{ id: string }>("SELECT id FROM skills WHERE name = 'Intubation'").get();

  await db.transaction(async () => {
    const facilityUserId = uuidv4();
    await db.prepare(`
      INSERT INTO users (id, phone, email, role, password_hash, status, verification_status)
      VALUES (?, '03001234567', 'shifa@docduty.pk', 'facility_admin', ?, 'active', 'verified')
    `).run(facilityUserId, passwordHash);

    const facilityId = uuidv4();
    await db.prepare(`
      INSERT INTO facility_accounts (id, user_id, name, registration_number, type, city_id, verification_status)
      VALUES (?, ?, 'Shifa International Hospital', 'REG-ISB-001', 'hospital', ?, 'verified')
    `).run(facilityId, facilityUserId, islamabad?.id || null);

    const loc1Id = uuidv4();
    await db.prepare(`
      INSERT INTO facility_locations (id, facility_id, name, address, latitude, longitude, geofence_radius_m, qr_secret, qr_rotate_interval_min)
      VALUES (?, ?, 'Main Building - Emergency', 'H-8/4, Pitras Bukhari Road, Islamabad', 33.6938, 73.0490, 200, ?, 5)
    `).run(loc1Id, facilityId, `shifa-emergency-secret-${uuidv4().slice(0, 8)}`);

    const loc2Id = uuidv4();
    await db.prepare(`
      INSERT INTO facility_locations (id, facility_id, name, address, latitude, longitude, geofence_radius_m, qr_secret, qr_rotate_interval_min)
      VALUES (?, ?, 'OPD Block', 'H-8/4, Pitras Bukhari Road, Islamabad', 33.6940, 73.0492, 150, ?, 5)
    `).run(loc2Id, facilityId, `shifa-opd-secret-${uuidv4().slice(0, 8)}`);

    await db.prepare('INSERT INTO wallets (id, user_id, balance_pkr, total_spent_pkr) VALUES (?, ?, 500000, 0)')
      .run(uuidv4(), facilityUserId);

    const facility2UserId = uuidv4();
    await db.prepare(`
      INSERT INTO users (id, phone, email, role, password_hash, status, verification_status)
      VALUES (?, '03009876543', 'akuh@docduty.pk', 'facility_admin', ?, 'active', 'verified')
    `).run(facility2UserId, passwordHash);

    const facility2Id = uuidv4();
    await db.prepare(`
      INSERT INTO facility_accounts (id, user_id, name, registration_number, type, city_id, verification_status)
      VALUES (?, ?, 'Aga Khan University Hospital', 'REG-KHI-001', 'hospital', ?, 'verified')
    `).run(facility2Id, facility2UserId, karachi?.id || null);

    const loc3Id = uuidv4();
    await db.prepare(`
      INSERT INTO facility_locations (id, facility_id, name, address, latitude, longitude, geofence_radius_m, qr_secret, qr_rotate_interval_min)
      VALUES (?, ?, 'Main Campus - Ward 5', 'Stadium Road, Karachi', 24.8918, 67.0741, 250, ?, 5)
    `).run(loc3Id, facility2Id, `akuh-ward5-secret-${uuidv4().slice(0, 8)}`);

    await db.prepare('INSERT INTO wallets (id, user_id, balance_pkr, total_spent_pkr) VALUES (?, ?, 1000000, 0)')
      .run(uuidv4(), facility2UserId);

    const doc1UserId = uuidv4();
    await db.prepare(`
      INSERT INTO users (id, phone, email, role, password_hash, status, verification_status)
      VALUES (?, '03111111111', 'dr.ahmed@docduty.pk', 'doctor', ?, 'active', 'verified')
    `).run(doc1UserId, passwordHash);

    const doc1ProfileId = uuidv4();
    await db.prepare(`
      INSERT INTO doctor_profiles (id, user_id, full_name, cnic, pmdc_license, specialty_id, city_id, coverage_radius_km, availability_status, bio, experience_years, reliability_score, rating_avg, rating_count, total_shifts_completed)
      VALUES (?, ?, 'Dr. Ahmed Khan', '35201-1234567-1', 'PMDC-12345', ?, ?, 50, 'available', 'Experienced general physician with 8 years of practice in Islamabad.', 8, 95.0, 4.7, 15, 42)
    `).run(doc1ProfileId, doc1UserId, genMed?.id || null, islamabad?.id || null);

    if (blsCert) {
      await db.prepare('INSERT INTO doctor_skills (doctor_id, skill_id) VALUES (?, ?)').run(doc1ProfileId, blsCert.id);
    }
    if (aclsCert) {
      await db.prepare('INSERT INTO doctor_skills (doctor_id, skill_id) VALUES (?, ?)').run(doc1ProfileId, aclsCert.id);
    }

    await db.prepare('INSERT INTO wallets (id, user_id, balance_pkr, total_earned_pkr) VALUES (?, ?, 75000, 350000)')
      .run(uuidv4(), doc1UserId);

    const doc2UserId = uuidv4();
    await db.prepare(`
      INSERT INTO users (id, phone, email, role, password_hash, status, verification_status)
      VALUES (?, '03222222222', 'dr.fatima@docduty.pk', 'doctor', ?, 'active', 'verified')
    `).run(doc2UserId, passwordHash);

    const doc2ProfileId = uuidv4();
    await db.prepare(`
      INSERT INTO doctor_profiles (id, user_id, full_name, cnic, pmdc_license, specialty_id, city_id, coverage_radius_km, availability_status, bio, experience_years, reliability_score, rating_avg, rating_count, total_shifts_completed)
      VALUES (?, ?, 'Dr. Fatima Rizvi', '35202-7654321-2', 'PMDC-67890', ?, ?, 30, 'available', 'Emergency medicine specialist, ACLS certified.', 5, 98.0, 4.9, 23, 67)
    `).run(doc2ProfileId, doc2UserId, emergency?.id || null, islamabad?.id || null);

    if (blsCert) {
      await db.prepare('INSERT INTO doctor_skills (doctor_id, skill_id) VALUES (?, ?)').run(doc2ProfileId, blsCert.id);
    }
    if (aclsCert) {
      await db.prepare('INSERT INTO doctor_skills (doctor_id, skill_id) VALUES (?, ?)').run(doc2ProfileId, aclsCert.id);
    }
    if (intubation) {
      await db.prepare('INSERT INTO doctor_skills (doctor_id, skill_id) VALUES (?, ?)').run(doc2ProfileId, intubation.id);
    }

    await db.prepare('INSERT INTO wallets (id, user_id, balance_pkr, total_earned_pkr) VALUES (?, ?, 120000, 580000)')
      .run(uuidv4(), doc2UserId);

    const doc3UserId = uuidv4();
    await db.prepare(`
      INSERT INTO users (id, phone, email, role, password_hash, status, verification_status)
      VALUES (?, '03333333333', 'dr.hassan@docduty.pk', 'doctor', ?, 'active', 'pending_review')
    `).run(doc3UserId, passwordHash);

    const doc3ProfileId = uuidv4();
    await db.prepare(`
      INSERT INTO doctor_profiles (id, user_id, full_name, cnic, pmdc_license, specialty_id, city_id, coverage_radius_km, availability_status, bio, experience_years)
      VALUES (?, ?, 'Dr. Hassan Ali', '35101-9876543-3', 'PMDC-11111', ?, ?, 40, 'available', 'Junior surgeon seeking locum opportunities.', 3)
    `).run(doc3ProfileId, doc3UserId, surgery?.id || null, lahore?.id || null);

    await db.prepare('INSERT INTO wallets (id, user_id) VALUES (?, ?)').run(uuidv4(), doc3UserId);

    const adminUserId = uuidv4();
    await db.prepare(`
      INSERT INTO users (id, phone, email, role, password_hash, status, verification_status)
      VALUES (?, '03000000000', 'admin@docduty.pk', 'platform_admin', ?, 'active', 'verified')
    `).run(adminUserId, passwordHash);

    await db.prepare('INSERT INTO wallets (id, user_id) VALUES (?, ?)').run(uuidv4(), adminUserId);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const shift1Id = uuidv4();
    const s1Start = new Date(tomorrow); s1Start.setHours(8, 0, 0, 0);
    const s1End = new Date(tomorrow); s1End.setHours(14, 0, 0, 0);
    await db.prepare(`
      INSERT INTO shifts (id, poster_id, facility_location_id, type, title, description, department, role_id, specialty_id, start_time, end_time, total_price_pkr, platform_fee_pkr, payout_pkr, urgency, status, visibility, city_id, counter_offer_allowed)
      VALUES (?, ?, ?, 'replacement', 'Emergency Duty Cover', 'Need a doctor to cover emergency department morning shift. Must have ACLS certification.', 'Emergency', ?, ?, ?, ?, 12000, 1200, 10800, 'urgent', 'open', 'city', ?, ?)
    `).run(shift1Id, facilityUserId, loc1Id, medOfficer?.id || null, emergency?.id || null, s1Start, s1End, islamabad?.id || null, true);

    await db.prepare(`INSERT INTO offers (id, shift_id, doctor_id, type, status) VALUES (?, ?, ?, 'dispatch', 'pending')`)
      .run(uuidv4(), shift1Id, doc2UserId);
    await db.prepare(`INSERT INTO notifications (id, user_id, type, title, body, data) VALUES (?, ?, 'shift_offer', 'New Shift Available', 'Emergency Duty Cover - PKR 10,800', ?)`)
      .run(uuidv4(), doc2UserId, { shiftId: shift1Id });

    const shift2Id = uuidv4();
    const s2Start = new Date(dayAfter); s2Start.setHours(9, 0, 0, 0);
    const s2End = new Date(dayAfter); s2End.setHours(17, 0, 0, 0);
    await db.prepare(`
      INSERT INTO shifts (id, poster_id, facility_location_id, type, title, description, department, role_id, specialty_id, start_time, end_time, total_price_pkr, platform_fee_pkr, payout_pkr, urgency, status, visibility, city_id, counter_offer_allowed)
      VALUES (?, ?, ?, 'vacancy', 'OPD General Medicine Slot', 'Regular OPD coverage needed. Full day shift.', 'General OPD', ?, ?, ?, ?, 8000, 800, 7200, 'normal', 'open', 'city', ?, ?)
    `).run(shift2Id, facilityUserId, loc2Id, medOfficer?.id || null, genMed?.id || null, s2Start, s2End, islamabad?.id || null, true);

    await db.prepare(`INSERT INTO offers (id, shift_id, doctor_id, type, status) VALUES (?, ?, ?, 'dispatch', 'pending')`)
      .run(uuidv4(), shift2Id, doc1UserId);

    const shift3Id = uuidv4();
    const s3Start = new Date(nextWeek); s3Start.setHours(20, 0, 0, 0);
    const s3End = new Date(nextWeek); s3End.setHours(8, 0, 0, 0);
    s3End.setDate(s3End.getDate() + 1);
    await db.prepare(`
      INSERT INTO shifts (id, poster_id, facility_location_id, type, title, description, department, role_id, specialty_id, start_time, end_time, total_price_pkr, platform_fee_pkr, payout_pkr, urgency, status, visibility, city_id)
      VALUES (?, ?, ?, 'replacement', 'Night Duty - Emergency', 'Night shift coverage in ER.', 'Emergency', ?, ?, ?, ?, 15000, 1500, 13500, 'normal', 'booked', 'city', ?)
    `).run(shift3Id, facilityUserId, loc1Id, medOfficer?.id || null, emergency?.id || null, s3Start, s3End, islamabad?.id || null);

    const booking1Id = uuidv4();
    const offer1Id = uuidv4();
    await db.prepare(`INSERT INTO offers (id, shift_id, doctor_id, type, status, responded_at) VALUES (?, ?, ?, 'dispatch', 'accepted', ?)`)
      .run(offer1Id, shift3Id, doc1UserId, new Date());
    await db.prepare(`
      INSERT INTO bookings (id, shift_id, doctor_id, poster_id, offer_id, status, total_price_pkr, platform_fee_pkr, payout_pkr)
      VALUES (?, ?, ?, ?, ?, 'confirmed', 15000, 1500, 13500)
    `).run(booking1Id, shift3Id, doc1UserId, facilityUserId, offer1Id);

    const facilityWallet = await db.prepare<{ id: string }>('SELECT id FROM wallets WHERE user_id = ?').get(facilityUserId);
    if (facilityWallet) {
      await db.prepare('UPDATE wallets SET balance_pkr = balance_pkr - 15000, held_pkr = held_pkr + 15000 WHERE id = ?')
        .run(facilityWallet.id);
      await db.prepare(`
        INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
        VALUES (?, ?, ?, 'escrow_hold', 15000, 'debit', 'Escrow hold for night duty booking')
      `).run(uuidv4(), facilityWallet.id, booking1Id);
    }

    const shift4Id = uuidv4();
    const s4Start = new Date(lastWeek); s4Start.setHours(9, 0, 0, 0);
    const s4End = new Date(lastWeek); s4End.setHours(15, 0, 0, 0);
    await db.prepare(`
      INSERT INTO shifts (id, poster_id, facility_location_id, type, title, description, department, role_id, specialty_id, start_time, end_time, total_price_pkr, platform_fee_pkr, payout_pkr, urgency, status, visibility, city_id)
      VALUES (?, ?, ?, 'replacement', 'Morning General OPD Cover', 'Completed shift.', 'General OPD', ?, ?, ?, ?, 8000, 800, 7200, 'normal', 'completed', 'city', ?)
    `).run(shift4Id, facilityUserId, loc2Id, medOfficer?.id || null, genMed?.id || null, s4Start, s4End, islamabad?.id || null);

    const booking2Id = uuidv4();
    await db.prepare(`
      INSERT INTO bookings (id, shift_id, doctor_id, poster_id, status, total_price_pkr, platform_fee_pkr, payout_pkr, check_in_time, check_out_time)
      VALUES (?, ?, ?, ?, 'completed', 8000, 800, 7200, ?, ?)
    `).run(booking2Id, shift4Id, doc2UserId, facilityUserId, s4Start, s4End);

    await db.prepare(`
      INSERT INTO attendance_events (id, booking_id, user_id, event_type, latitude, longitude, geo_valid, qr_valid, recorded_at)
      VALUES (?, ?, ?, 'check_in', 33.6938, 73.0490, ?, ?, ?)
    `).run(uuidv4(), booking2Id, doc2UserId, true, true, s4Start);
    await db.prepare(`
      INSERT INTO attendance_events (id, booking_id, user_id, event_type, latitude, longitude, geo_valid, qr_valid, recorded_at)
      VALUES (?, ?, ?, 'check_out', 33.6939, 73.0491, ?, ?, ?)
    `).run(uuidv4(), booking2Id, doc2UserId, true, true, s4End);

    const doc2Wallet = await db.prepare<{ id: string }>('SELECT id FROM wallets WHERE user_id = ?').get(doc2UserId);
    if (facilityWallet && doc2Wallet) {
      await db.prepare(`
        INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
        VALUES (?, ?, ?, 'escrow_release', 8000, 'credit', 'Escrow released on completion')
      `).run(uuidv4(), facilityWallet.id, booking2Id);
      await db.prepare(`
        INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
        VALUES (?, ?, ?, 'platform_fee', 800, 'debit', 'Platform commission')
      `).run(uuidv4(), facilityWallet.id, booking2Id);
      await db.prepare(`
        INSERT INTO ledger_transactions (id, wallet_id, booking_id, type, amount_pkr, direction, description)
        VALUES (?, ?, ?, 'payout', 7200, 'credit', 'Shift completion payout')
      `).run(uuidv4(), doc2Wallet.id, booking2Id);
    }

    await db.prepare(`
      INSERT INTO ratings (id, booking_id, rater_id, rated_id, score, comment)
      VALUES (?, ?, ?, ?, 5, 'Excellent doctor, very professional and punctual.')
    `).run(uuidv4(), booking2Id, facilityUserId, doc2UserId);
    await db.prepare(`
      INSERT INTO ratings (id, booking_id, rater_id, rated_id, score, comment)
      VALUES (?, ?, ?, ?, 4, 'Good facility, well-organized department.')
    `).run(uuidv4(), booking2Id, doc2UserId, facilityUserId);

    await db.prepare(`
      INSERT INTO messages (id, booking_id, sender_id, content, created_at)
      VALUES (?, ?, ?, 'Hi, I will be arriving at 8:45 AM. Please share the QR code.', ?)
    `).run(uuidv4(), booking2Id, doc2UserId, lastWeek);
    await db.prepare(`
      INSERT INTO messages (id, booking_id, sender_id, content, created_at)
      VALUES (?, ?, ?, 'Great, the QR will be displayed at the ER reception. Thank you!', ?)
    `).run(uuidv4(), booking2Id, facilityUserId, new Date(lastWeek.getTime() + 5 * 60 * 1000));

    const shift5Id = uuidv4();
    const s5Start = new Date(dayAfter); s5Start.setHours(10, 0, 0, 0);
    const s5End = new Date(dayAfter); s5End.setHours(18, 0, 0, 0);
    await db.prepare(`
      INSERT INTO shifts (id, poster_id, facility_location_id, type, title, description, department, role_id, specialty_id, start_time, end_time, total_price_pkr, platform_fee_pkr, payout_pkr, urgency, status, visibility, city_id, counter_offer_allowed)
      VALUES (?, ?, ?, 'vacancy', 'Pediatrics Ward Coverage', 'Need a pediatrician for day shift coverage.', 'Pediatrics', ?, ?, ?, ?, 10000, 1000, 9000, 'normal', 'open', 'national', ?, ?)
    `).run(shift5Id, facility2UserId, loc3Id, registrar?.id || null, pediatrics?.id || null, s5Start, s5End, karachi?.id || null, true);

    await db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, data, is_read, created_at)
      VALUES (?, ?, 'booking_confirmed', 'Booking Confirmed', 'Your night duty shift has been accepted by Dr. Ahmed Khan.', ?, ?, ?)
    `).run(uuidv4(), facilityUserId, {}, true, new Date(now.getTime() - 24 * 60 * 60 * 1000));
    await db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, data, is_read, created_at)
      VALUES (?, ?, 'shift_offer', 'New Shift Available', 'OPD General Medicine Slot - PKR 7,200', ?, ?, ?)
    `).run(uuidv4(), doc1UserId, {}, false, new Date(now.getTime() - 2 * 60 * 60 * 1000));
    await db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, data, is_read, created_at)
      VALUES (?, ?, 'check_out', 'Shift Completed', 'Your OPD shift has been completed. Payment of PKR 7,200 has been processed.', ?, ?, ?)
    `).run(uuidv4(), doc2UserId, {}, true, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
  })();

  console.log('[Seed] Demo data seeded');
}
