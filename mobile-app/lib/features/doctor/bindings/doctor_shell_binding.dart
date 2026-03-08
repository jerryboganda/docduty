import 'package:get/get.dart';
import 'package:docduty/features/doctor/controllers/doctor_shell_controller.dart';
import 'package:docduty/features/doctor/controllers/shift_feed_controller.dart';
import 'package:docduty/features/doctor/controllers/doctor_bookings_controller.dart';
import 'package:docduty/features/doctor/controllers/doctor_wallet_controller.dart';
import 'package:docduty/features/doctor/controllers/doctor_profile_controller.dart';
import 'package:docduty/features/shared/controllers/messages_list_controller.dart';

class DoctorShellBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<DoctorShellController>(() => DoctorShellController());
    Get.lazyPut<ShiftFeedController>(() => ShiftFeedController());
    Get.lazyPut<DoctorBookingsController>(() => DoctorBookingsController());
    Get.lazyPut<DoctorWalletController>(() => DoctorWalletController());
    Get.lazyPut<DoctorProfileController>(() => DoctorProfileController());
    Get.lazyPut<MessagesListController>(() => MessagesListController());
  }
}
