import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/services.dart';
import 'package:docduty/shared/routes/app_routes.dart';

class AdminMoreController extends GetxController {
  late ColorNotifier notifier;

  final _authService = Get.find<AuthService>();

  List<Map<String, dynamic>> get menuItems => [
        {
          'icon': Icons.dashboard_customize,
          'title': 'Dashboard',
          'route': Routes.ADMIN_DASHBOARD
        },
        {
          'icon': Icons.verified_user,
          'title': 'Verification Queue',
          'route': Routes.ADMIN_VERIFICATIONS
        },
        {
          'icon': Icons.payments,
          'title': 'Payouts',
          'route': Routes.ADMIN_PAYOUTS
        },
        {'icon': Icons.settings, 'title': 'Settings', 'route': Routes.SETTINGS},
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
      ];

  void onMenuTap(String route) => Get.offNamed(route);

  Future<void> logout(BuildContext context) async {
    showModalBottomSheet(
      context: context,
      backgroundColor: notifier.getBgColor,
      shape: RoundedRectangleBorder(
          borderRadius:
              BorderRadius.vertical(top: Radius.circular(Get.height / 30))),
      builder: (_) => Padding(
        padding: EdgeInsets.all(Get.width / 15),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text("Logout",
                style: TextStyle(
                    fontFamily: "Gilroy",
                    fontSize: Get.height / 35,
                    fontWeight: FontWeight.w600,
                    color: Colors.red)),
            SizedBox(height: Get.height / 60),
            Divider(color: notifier.getfillborder),
            SizedBox(height: Get.height / 60),
            Text("Are you sure you want to log out?",
                style: TextStyle(
                    fontFamily: "Gilroy",
                    fontSize: Get.height / 50,
                    color: notifier.text)),
            SizedBox(height: Get.height / 30),
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: Get.height / 17,
                    child: ElevatedButton(
                      onPressed: () => Get.back(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: notifier.isDark
                            ? const Color(0xff161616)
                            : Colors.grey.shade200,
                        shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(Get.height / 20)),
                        shadowColor: Colors.transparent,
                      ),
                      child: Text("Cancel",
                          style: TextStyle(
                              fontFamily: "Gilroy",
                              fontSize: Get.height / 50,
                              color: notifier.text,
                              fontWeight: FontWeight.w600)),
                    ),
                  ),
                ),
                SizedBox(width: Get.width / 25),
                Expanded(
                  child: SizedBox(
                    height: Get.height / 17,
                    child: ElevatedButton(
                      onPressed: () async {
                        Get.back();
                        await _authService.logout();
                        Get.offAllNamed(Routes.WELCOME);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0165FC),
                        shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(Get.height / 20)),
                        shadowColor: Colors.transparent,
                      ),
                      child: Text("Yes, Logout",
                          style: TextStyle(
                              fontFamily: "Gilroy",
                              fontSize: Get.height / 50,
                              color: Colors.white,
                              fontWeight: FontWeight.w600)),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: Get.height / 50),
          ],
        ),
      ),
    );
  }
}
