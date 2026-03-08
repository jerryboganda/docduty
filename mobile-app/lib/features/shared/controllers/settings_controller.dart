import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/routes/app_routes.dart';

class SettingsController extends GetxController {
  late ColorNotifier notifier;

  final pushNotifications = true.obs;
  final emailNotifications = true.obs;
  final smsNotifications = false.obs;

  final menuItems = <Map<String, dynamic>>[];

  @override
  void onInit() {
    super.onInit();
    menuItems.addAll([
      {
        'icon': Icons.lock_outline,
        'title': 'Change Password',
        'route': Routes.CHANGE_PASSWORD
      },
      {
        'icon': Icons.notifications_outlined,
        'title': 'Notification Preferences',
        'route': ''
      },
      {
        'icon': Icons.help_outline,
        'title': 'Help Center',
        'route': Routes.HELP_CENTER
      },
      {
        'icon': Icons.privacy_tip_outlined,
        'title': 'Privacy Policy',
        'route': Routes.PRIVACY_POLICY
      },
      {
        'icon': Icons.description_outlined,
        'title': 'Terms of Service',
        'route': Routes.PRIVACY_POLICY
      },
      {'icon': Icons.info_outline, 'title': 'About DocDuty', 'route': ''},
    ]);
  }

  void navigateTo(String route) {
    if (route.isNotEmpty) {
      Get.toNamed(route);
    }
  }
}
