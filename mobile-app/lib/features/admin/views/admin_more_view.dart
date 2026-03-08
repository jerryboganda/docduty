import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/features/admin/controllers/admin_more_controller.dart';

class AdminMoreView extends GetView<AdminMoreController> {
  const AdminMoreView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        automaticallyImplyLeading: false,
        title: Text('More',
            style: TextStyle(
                fontFamily: "Gilroy",
                color: controller.notifier.text,
                fontSize: Get.height / 40,
                fontWeight: FontWeight.w500)),
        centerTitle: true,
      ),
      body: ListView(
        padding: EdgeInsets.symmetric(horizontal: Get.width / 25),
        children: [
          // Dark mode toggle
          SizedBox(
            height: Get.height / 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                        controller.notifier.isDark
                            ? Icons.light_mode
                            : Icons.dark_mode,
                        color: const Color(0xFF0165FC),
                        size: Get.height / 45),
                    SizedBox(width: Get.width / 30),
                    Text(
                        controller.notifier.isDark ? "Light Mode" : "Dark Mode",
                        style: TextStyle(
                            color: controller.notifier.text,
                            fontFamily: "Gilroy",
                            fontSize: Get.height / 50)),
                  ],
                ),
                CupertinoSwitch(
                  value: controller.notifier.isDark,
                  activeColor: const Color(0xFF0165FC),
                  onChanged: (v) => controller.notifier.setIsDark = v,
                ),
              ],
            ),
          ),
          Divider(color: controller.notifier.getfillborder),
          // Menu items
          ...controller.menuItems.map((item) {
            return Column(
              children: [
                GestureDetector(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    controller.onMenuTap(item['route']);
                  },
                  child: Container(
                    decoration: const BoxDecoration(),
                    height: Get.height / 20,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(item['icon'] as IconData,
                                color: const Color(0xFF0165FC),
                                size: Get.height / 45),
                            SizedBox(width: Get.width / 30),
                            Text(item['title'] as String,
                                style: TextStyle(
                                    color: controller.notifier.text,
                                    fontFamily: "Gilroy",
                                    fontSize: Get.height / 50)),
                          ],
                        ),
                        Icon(Icons.arrow_forward_ios,
                            color: const Color(0xFF0165FC),
                            size: Get.height / 45),
                      ],
                    ),
                  ),
                ),
                Divider(color: controller.notifier.getfillborder),
              ],
            );
          }),
          // Logout
          GestureDetector(
            onTap: () {
              HapticFeedback.mediumImpact();
              controller.logout(context);
            },
            child: Container(
              decoration: const BoxDecoration(),
              height: Get.height / 20,
              child: Row(
                children: [
                  Icon(Icons.logout, color: Colors.red, size: Get.height / 45),
                  SizedBox(width: Get.width / 30),
                  Text("Log out",
                      style: TextStyle(
                          color: Colors.red,
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 50)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
