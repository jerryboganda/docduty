import 'package:get/get.dart';
import 'package:docduty/features/auth/controllers/complete_profile_controller.dart';

class CompleteProfileBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<CompleteProfileController>(() => CompleteProfileController());
  }
}
