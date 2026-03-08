import 'package:get/get.dart';
import 'package:docduty/features/facility/controllers/facility_shell_controller.dart';
import 'package:docduty/features/facility/controllers/facility_dashboard_controller.dart';
import 'package:docduty/features/facility/controllers/facility_shifts_controller.dart';
import 'package:docduty/features/facility/controllers/facility_bookings_controller.dart';
import 'package:docduty/features/facility/controllers/facility_profile_controller.dart';
import 'package:docduty/features/shared/controllers/messages_list_controller.dart';

class FacilityShellBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut(() => FacilityShellController());
    Get.lazyPut(() => FacilityDashboardController());
    Get.lazyPut(() => FacilityShiftsController());
    Get.lazyPut(() => FacilityBookingsController());
    Get.lazyPut(() => MessagesListController());
    Get.lazyPut(() => FacilityProfileController());
  }
}
