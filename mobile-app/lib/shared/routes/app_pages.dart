import 'package:get/get.dart';
import 'package:docduty/shared/routes/app_routes.dart';
import 'package:docduty/shared/routes/middleware.dart';

import 'package:docduty/features/auth/bindings/splash_binding.dart';
import 'package:docduty/features/auth/views/splash_view.dart';
import 'package:docduty/features/auth/bindings/welcome_binding.dart';
import 'package:docduty/features/auth/views/welcome_view.dart';
import 'package:docduty/features/auth/bindings/sign_in_binding.dart';
import 'package:docduty/features/auth/views/sign_in_view.dart';
import 'package:docduty/features/auth/bindings/create_account_binding.dart';
import 'package:docduty/features/auth/views/create_account_view.dart';
import 'package:docduty/features/auth/bindings/complete_profile_binding.dart';
import 'package:docduty/features/auth/views/complete_profile_view.dart';
import 'package:docduty/features/auth/bindings/forgot_password_binding.dart';
import 'package:docduty/features/auth/views/forgot_password_view.dart';

import 'package:docduty/features/doctor/bindings/doctor_shell_binding.dart';
import 'package:docduty/features/doctor/views/doctor_shell_view.dart';
import 'package:docduty/features/doctor/views/shift_detail_view.dart';
import 'package:docduty/features/doctor/controllers/shift_detail_controller.dart';
import 'package:docduty/features/doctor/views/booking_detail_view.dart';
import 'package:docduty/features/doctor/controllers/booking_detail_controller.dart';
import 'package:docduty/features/doctor/views/doctor_wallet_view.dart';
import 'package:docduty/features/doctor/controllers/doctor_wallet_controller.dart';
import 'package:docduty/features/doctor/views/payout_request_view.dart';
import 'package:docduty/features/doctor/controllers/payout_request_controller.dart';

import 'package:docduty/features/facility/bindings/facility_shell_binding.dart';
import 'package:docduty/features/facility/views/facility_shell_view.dart';
import 'package:docduty/features/facility/views/create_shift_view.dart';
import 'package:docduty/features/facility/controllers/create_shift_controller.dart';
import 'package:docduty/features/facility/views/facility_shift_detail_view.dart';
import 'package:docduty/features/facility/controllers/facility_shift_detail_controller.dart';
import 'package:docduty/features/facility/views/location_management_view.dart';
import 'package:docduty/features/facility/controllers/location_management_controller.dart';

import 'package:docduty/features/admin/bindings/admin_shell_binding.dart';
import 'package:docduty/features/admin/views/admin_shell_view.dart';

import 'package:docduty/features/shared/views/messages_list_view.dart';
import 'package:docduty/features/shared/controllers/messages_list_controller.dart';
import 'package:docduty/features/shared/views/chat_detail_view.dart';
import 'package:docduty/features/shared/controllers/chat_detail_controller.dart';
import 'package:docduty/features/shared/views/notifications_view.dart';
import 'package:docduty/features/shared/controllers/notifications_controller.dart';
import 'package:docduty/features/shared/views/edit_profile_view.dart';
import 'package:docduty/features/shared/controllers/edit_profile_controller.dart';
import 'package:docduty/features/shared/views/settings_view.dart';
import 'package:docduty/features/shared/controllers/settings_controller.dart';
import 'package:docduty/features/shared/views/change_password_view.dart';
import 'package:docduty/features/shared/controllers/change_password_controller.dart';
import 'package:docduty/features/shared/views/raise_dispute_view.dart';
import 'package:docduty/features/shared/controllers/raise_dispute_controller.dart';
import 'package:docduty/features/shared/views/help_center_view.dart';
import 'package:docduty/features/shared/views/privacy_policy_view.dart';

class AppPages {
  AppPages._();

  static const INITIAL = Routes.SPLASH;

  static final routes = <GetPage>[
    GetPage(
      name: Routes.SPLASH,
      page: () => const SplashView(),
      binding: SplashBinding(),
    ),
    GetPage(
      name: Routes.WELCOME,
      page: () => const WelcomeView(),
      binding: WelcomeBinding(),
      middlewares: [GuestGuard()],
    ),
    GetPage(
      name: Routes.SIGN_IN,
      page: () => const SignInView(),
      binding: SignInBinding(),
      middlewares: [GuestGuard()],
    ),
    GetPage(
      name: Routes.CREATE_ACCOUNT,
      page: () => const CreateAccountView(),
      binding: CreateAccountBinding(),
      middlewares: [GuestGuard()],
    ),
    GetPage(
      name: Routes.COMPLETE_PROFILE,
      page: () => const CompleteProfileView(),
      binding: CompleteProfileBinding(),
    ),
    GetPage(
      name: Routes.FORGOT_PASSWORD,
      page: () => const ForgotPasswordView(),
      binding: ForgotPasswordBinding(),
      middlewares: [GuestGuard()],
    ),

    GetPage(
      name: Routes.DOCTOR_SHELL,
      page: () => const DoctorShellView(),
      binding: DoctorShellBinding(),
      middlewares: [AuthGuard(), RoleGuard('doctor')],
    ),
    GetPage(
      name: Routes.DOCTOR_SHIFT_DETAIL,
      page: () => const ShiftDetailView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<ShiftDetailController>(() => ShiftDetailController());
      }),
      middlewares: [AuthGuard(), RoleGuard('doctor')],
    ),
    GetPage(
      name: Routes.DOCTOR_BOOKING_DETAIL,
      page: () => const BookingDetailView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<BookingDetailController>(() => BookingDetailController());
      }),
      middlewares: [AuthGuard(), RoleGuard('doctor')],
    ),
    GetPage(
      name: Routes.DOCTOR_WALLET,
      page: () => const DoctorWalletView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<DoctorWalletController>(() => DoctorWalletController());
      }),
      middlewares: [AuthGuard(), RoleGuard('doctor')],
    ),
    GetPage(
      name: Routes.DOCTOR_WALLET_PAYOUT,
      page: () => const PayoutRequestView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<PayoutRequestController>(() => PayoutRequestController());
      }),
      middlewares: [AuthGuard(), RoleGuard('doctor')],
    ),

    GetPage(
      name: Routes.FACILITY_SHELL,
      page: () => const FacilityShellView(),
      binding: FacilityShellBinding(),
      middlewares: [AuthGuard(), RoleGuard('facility_admin')],
    ),
    GetPage(
      name: Routes.FACILITY_CREATE_SHIFT,
      page: () => const CreateShiftView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<CreateShiftController>(() => CreateShiftController());
      }),
      middlewares: [AuthGuard(), RoleGuard('facility_admin')],
    ),
    GetPage(
      name: Routes.FACILITY_SHIFT_DETAIL,
      page: () => const FacilityShiftDetailView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<FacilityShiftDetailController>(
          () => FacilityShiftDetailController(),
        );
      }),
      middlewares: [AuthGuard(), RoleGuard('facility_admin')],
    ),
    GetPage(
      name: Routes.FACILITY_LOCATIONS,
      page: () => const LocationManagementView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<LocationManagementController>(
          () => LocationManagementController(),
        );
      }),
      middlewares: [AuthGuard(), RoleGuard('facility_admin')],
    ),

    GetPage(
      name: Routes.ADMIN_SHELL,
      page: () => const AdminShellView(),
      binding: AdminShellBinding(),
      middlewares: [AuthGuard(), RoleGuard('platform_admin')],
    ),
    GetPage(
      name: Routes.ADMIN_DASHBOARD,
      page: () => const AdminShellView(),
      binding: AdminShellBinding(),
      middlewares: [AuthGuard(), RoleGuard('platform_admin')],
    ),
    GetPage(
      name: Routes.ADMIN_VERIFICATIONS,
      page: () => const AdminShellView(),
      binding: AdminShellBinding(),
      middlewares: [AuthGuard(), RoleGuard('platform_admin')],
    ),
    GetPage(
      name: Routes.ADMIN_DISPUTES,
      page: () => const AdminShellView(),
      binding: AdminShellBinding(),
      middlewares: [AuthGuard(), RoleGuard('platform_admin')],
    ),
    GetPage(
      name: Routes.ADMIN_PAYOUTS,
      page: () => const AdminShellView(),
      binding: AdminShellBinding(),
      middlewares: [AuthGuard(), RoleGuard('platform_admin')],
    ),

    GetPage(
      name: Routes.MESSAGES,
      page: () => const MessagesListView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<MessagesListController>(() => MessagesListController());
      }),
      middlewares: [AuthGuard()],
    ),
    GetPage(
      name: Routes.MESSAGE_CHAT,
      page: () => const ChatDetailView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<ChatDetailController>(() => ChatDetailController());
      }),
      middlewares: [AuthGuard()],
    ),
    GetPage(
      name: Routes.NOTIFICATIONS,
      page: () => const NotificationsView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<NotificationsController>(() => NotificationsController());
      }),
      middlewares: [AuthGuard()],
    ),
    GetPage(
      name: Routes.DOCTOR_EDIT_PROFILE,
      page: () => const EditProfileView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<EditProfileController>(() => EditProfileController());
      }),
      middlewares: [AuthGuard()],
    ),
    GetPage(
      name: Routes.SETTINGS,
      page: () => const SettingsView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<SettingsController>(() => SettingsController());
      }),
      middlewares: [AuthGuard()],
    ),
    GetPage(
      name: Routes.CHANGE_PASSWORD,
      page: () => const ChangePasswordView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<ChangePasswordController>(
          () => ChangePasswordController(),
        );
      }),
      middlewares: [AuthGuard()],
    ),
    GetPage(
      name: Routes.DISPUTE_RAISE,
      page: () => const RaiseDisputeView(),
      binding: BindingsBuilder(() {
        Get.lazyPut<RaiseDisputeController>(() => RaiseDisputeController());
      }),
      middlewares: [AuthGuard()],
    ),
    GetPage(
      name: Routes.HELP_CENTER,
      page: () => const HelpCenterView(),
      middlewares: [AuthGuard()],
    ),
    GetPage(
      name: Routes.PRIVACY_POLICY,
      page: () => const PrivacyPolicyView(),
    ),
  ];
}
