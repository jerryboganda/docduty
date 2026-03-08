/// App-wide constants for DocDuty.
class AppConstants {
  AppConstants._();

  /// App branding
  static const String appName = 'DocDuty';
  static const String appTagline = 'Healthcare Staffing Marketplace';

  /// Secure storage keys
  static const String accessTokenKey = 'docduty_access_token';
  static const String refreshTokenKey = 'docduty_refresh_token';
  static const String userIdKey = 'docduty_user_id';
  static const String userRoleKey = 'docduty_user_role';
  static const String onboardingCompleteKey = 'docduty_onboarding_complete';

  /// Pakistan phone validation regex
  static final RegExp pakistanPhoneRegex = RegExp(r'^(\+92|0)3\d{9}$');

  /// User roles
  static const String roleDoctor = 'doctor';
  static const String roleFacilityAdmin = 'facility_admin';
  static const String rolePlatformAdmin = 'platform_admin';

  /// User statuses
  static const String statusPending = 'pending';
  static const String statusActive = 'active';
  static const String statusSuspended = 'suspended';
  static const String statusBanned = 'banned';

  /// Verification statuses
  static const String verificationUnverified = 'unverified';
  static const String verificationPendingReview = 'pending_review';
  static const String verificationVerified = 'verified';
  static const String verificationRejected = 'rejected';

  /// Shift types
  static const String shiftTypeReplacement = 'replacement';
  static const String shiftTypeVacancy = 'vacancy';

  /// Shift statuses
  static const String shiftStatusOpen = 'open';
  static const String shiftStatusBooked = 'booked';
  static const String shiftStatusInProgress = 'in_progress';
  static const String shiftStatusCompleted = 'completed';
  static const String shiftStatusCancelled = 'cancelled';
  static const String shiftStatusExpired = 'expired';

  /// Booking statuses
  static const String bookingPendingPayment = 'pending_payment';
  static const String bookingConfirmed = 'confirmed';
  static const String bookingInProgress = 'in_progress';
  static const String bookingCompleted = 'completed';
  static const String bookingCancelled = 'cancelled';
  static const String bookingNoShow = 'no_show';
  static const String bookingDisputed = 'disputed';
  static const String bookingResolved = 'resolved';

  /// Urgency levels
  static const String urgencyNormal = 'normal';
  static const String urgencyUrgent = 'urgent';
  static const String urgencyCritical = 'critical';

  /// Offer types
  static const String offerTypeDispatch = 'dispatch';
  static const String offerTypeCounter = 'counter';

  /// Offer statuses
  static const String offerPending = 'pending';
  static const String offerAccepted = 'accepted';
  static const String offerRejected = 'rejected';
  static const String offerExpired = 'expired';
  static const String offerWithdrawn = 'withdrawn';

  /// Dispute types
  static const String disputeNoShow = 'no_show';
  static const String disputeLate = 'late';
  static const String disputeDutyMismatch = 'duty_mismatch';
  static const String disputeFacilityIssue = 'facility_issue';
  static const String disputePayment = 'payment';
  static const String disputeOther = 'other';

  /// Dispute statuses
  static const String disputeOpen = 'open';
  static const String disputeUnderReview = 'under_review';
  static const String disputeResolved = 'resolved';
  static const String disputeDismissed = 'dismissed';

  /// Resolution types
  static const String resolutionFullPayout = 'full_payout';
  static const String resolutionPartialPayout = 'partial_payout';
  static const String resolutionFullRefund = 'full_refund';
  static const String resolutionPartialRefund = 'partial_refund';
  static const String resolutionPenalty = 'penalty';
  static const String resolutionDismissed = 'dismissed';
  static const String resolutionNoAction = 'no_action';

  /// Ledger transaction types
  static const String ledgerEscrowHold = 'escrow_hold';
  static const String ledgerEscrowRelease = 'escrow_release';
  static const String ledgerPlatformFee = 'platform_fee';
  static const String ledgerPayout = 'payout';
  static const String ledgerRefund = 'refund';
  static const String ledgerPenalty = 'penalty';
  static const String ledgerDeposit = 'deposit';
  static const String ledgerWithdrawal = 'withdrawal';

  /// Attendance event types
  static const String attendanceCheckIn = 'check_in';
  static const String attendanceCheckOut = 'check_out';
  static const String attendancePresencePing = 'presence_ping';

  /// Payout statuses
  static const String payoutPending = 'pending';
  static const String payoutProcessing = 'processing';
  static const String payoutCompleted = 'completed';
  static const String payoutFailed = 'failed';

  /// Availability statuses
  static const String availabilityAvailable = 'available';
  static const String availabilityBusy = 'busy';
  static const String availabilityOffline = 'offline';

  /// Facility types
  static const String facilityHospital = 'hospital';
  static const String facilityClinic = 'clinic';
  static const String facilityLab = 'lab';
  static const String facilityOther = 'other';

  /// Visibility options
  static const String visibilityCity = 'city';
  static const String visibilityNational = 'national';

  /// Max limits
  static const double maxPayoutAmount = 500000;
  static const double maxDepositAmount = 1000000;
}
