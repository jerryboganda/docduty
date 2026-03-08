/// All route names for the DocDuty mobile app.
abstract class Routes {
  Routes._();

  // Common / Auth
  static const SPLASH = '/splash';
  static const WELCOME = '/welcome';
  static const ONBOARDING = '/onboarding';
  static const SIGN_IN = '/sign-in';
  static const CREATE_ACCOUNT = '/create-account';
  static const OTP_VERIFY = '/otp-verify';
  static const FORGOT_PASSWORD = '/forgot-password';
  static const RESET_PASSWORD = '/reset-password';
  static const COMPLETE_PROFILE = '/complete-profile';

  // Doctor Shell
  static const DOCTOR_SHELL = '/doctor';
  static const DOCTOR_SHIFTS = '/doctor/shifts';
  static const DOCTOR_SHIFT_DETAIL = '/doctor/shifts/detail';
  static const DOCTOR_SHIFT_APPLY = '/doctor/shifts/apply';
  static const DOCTOR_BOOKINGS = '/doctor/bookings';
  static const DOCTOR_BOOKING_DETAIL = '/doctor/bookings/detail';
  static const DOCTOR_ATTENDANCE = '/doctor/attendance';
  static const DOCTOR_WALLET = '/doctor/wallet';
  static const DOCTOR_WALLET_PAYOUT = '/doctor/wallet/payout';
  static const DOCTOR_PROFILE = '/doctor/profile';
  static const DOCTOR_EDIT_PROFILE = '/doctor/profile/edit';
  static const DOCTOR_RATINGS = '/doctor/ratings';

  // Facility Shell
  static const FACILITY_SHELL = '/facility';
  static const FACILITY_DASHBOARD = '/facility/dashboard';
  static const FACILITY_SHIFTS = '/facility/shifts';
  static const FACILITY_CREATE_SHIFT = '/facility/shifts/create';
  static const FACILITY_EDIT_SHIFT = '/facility/shifts/edit';
  static const FACILITY_SHIFT_DETAIL = '/facility/shifts/detail';
  static const FACILITY_SHIFT_OFFERS = '/facility/shifts/offers';
  static const FACILITY_BOOKINGS = '/facility/bookings';
  static const FACILITY_BOOKING_DETAIL = '/facility/bookings/detail';
  static const FACILITY_LOCATIONS = '/facility/locations';
  static const FACILITY_ADD_LOCATION = '/facility/locations/add';
  static const FACILITY_EDIT_LOCATION = '/facility/locations/edit';
  static const FACILITY_QR_CODE = '/facility/qr-code';
  static const FACILITY_WALLET = '/facility/wallet';
  static const FACILITY_PROFILE = '/facility/profile';

  // Platform Admin Shell
  static const ADMIN_SHELL = '/admin';
  static const ADMIN_DASHBOARD = '/admin/dashboard';
  static const ADMIN_VERIFICATIONS = '/admin/verifications';
  static const ADMIN_VERIFICATION_DETAIL = '/admin/verifications/detail';
  static const ADMIN_DISPUTES = '/admin/disputes';
  static const ADMIN_DISPUTE_DETAIL = '/admin/disputes/detail';
  static const ADMIN_USERS = '/admin/users';
  static const ADMIN_USER_DETAIL = '/admin/users/detail';
  static const ADMIN_PAYOUTS = '/admin/payouts';
  static const ADMIN_ANALYTICS = '/admin/analytics';
  static const ADMIN_AUDIT_LOG = '/admin/audit-log';
  static const ADMIN_POLICY_CONFIG = '/admin/policy-config';

  // Shared
  static const MESSAGES = '/messages';
  static const MESSAGE_CHAT = '/messages/chat';
  static const NOTIFICATIONS = '/notifications';
  static const DISPUTE_RAISE = '/disputes/raise';
  static const DISPUTE_DETAIL = '/disputes/detail';
  static const SETTINGS = '/settings';
  static const HELP_CENTER = '/help-center';
  static const PRIVACY_POLICY = '/privacy-policy';
  static const CHANGE_PASSWORD = '/change-password';

  /// Returns the default entry route for a given role.
  static String shellForRole(String role) {
    switch (role) {
      case 'doctor':
        return DOCTOR_SHELL;
      case 'facility_admin':
        return FACILITY_SHELL;
      case 'platform_admin':
        return ADMIN_DASHBOARD;
      default:
        return SIGN_IN;
    }
  }
}
