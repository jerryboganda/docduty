import 'dart:async';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/auth_service.dart';
import 'package:docduty/shared/routes/app_routes.dart';

class SplashController extends GetxController {
  late ColorNotifier notifier;
  final AuthService _auth = Get.find<AuthService>();

  @override
  void onInit() {
    super.onInit();
    _navigate();
  }

  Future<void> _navigate() async {
    // Show splash for at least 2 seconds.
    await Future.delayed(const Duration(seconds: 2));

    if (_auth.isLoggedIn) {
      // Route to the correct role shell.
      Get.offAllNamed(Routes.shellForRole(_auth.userRole));
    } else {
      Get.offAllNamed(Routes.WELCOME);
    }
  }
}
