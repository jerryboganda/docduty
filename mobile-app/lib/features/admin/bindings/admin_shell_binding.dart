import 'package:get/get.dart';
import 'package:docduty/features/admin/controllers/admin_shell_controller.dart';
import 'package:docduty/features/admin/controllers/admin_dashboard_controller.dart';
import 'package:docduty/features/admin/controllers/admin_verifications_controller.dart';
import 'package:docduty/features/admin/controllers/admin_disputes_controller.dart';
import 'package:docduty/features/admin/controllers/admin_payouts_controller.dart';
import 'package:docduty/features/admin/controllers/admin_more_controller.dart';

class AdminShellBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut(() => AdminShellController());
    Get.lazyPut(() => AdminDashboardController());
    Get.lazyPut(() => AdminVerificationsController());
    Get.lazyPut(() => AdminDisputesController());
    Get.lazyPut(() => AdminPayoutsController());
    Get.lazyPut(() => AdminMoreController());
  }
}
