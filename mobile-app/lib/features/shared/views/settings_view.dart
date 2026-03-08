import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/widgets/buttons.dart';
import 'package:docduty/features/shared/controllers/settings_controller.dart';

class SettingsView extends GetView<SettingsController> {
  const SettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        title: Text('Settings',
            style: TextStyle(
                fontFamily: "Gilroy",
                color: controller.notifier.text,
                fontSize: Get.height / 40,
                fontWeight: FontWeight.w600)),
        centerTitle: true,
        leading: MyBackButtons(context),
      ),
      body: ListView(
        padding: EdgeInsets.all(Get.width / 30),
        children: [
          // Notification preferences section
          _sectionTitle("Notifications"),
          SizedBox(height: Get.height / 80),
          _toggleTile("Push Notifications", controller.pushNotifications),
          _toggleTile("Email Notifications", controller.emailNotifications),
          _toggleTile("SMS Notifications", controller.smsNotifications),

          SizedBox(height: Get.height / 30),

          // Menu items
          _sectionTitle("General"),
          SizedBox(height: Get.height / 80),
          ...controller.menuItems.map((item) => _menuTile(
                item['icon'] as IconData,
                item['title'] as String,
                () => controller.navigateTo(item['route'] as String),
              )),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Text(title,
        style: TextStyle(
            fontFamily: "Gilroy",
            color: controller.notifier.text,
            fontSize: Get.height / 48,
            fontWeight: FontWeight.w600));
  }

  Widget _toggleTile(String title, RxBool value) {
    return Container(
      margin: EdgeInsets.only(bottom: Get.height / 100),
      padding: EdgeInsets.symmetric(
          horizontal: Get.width / 30, vertical: Get.height / 80),
      decoration: BoxDecoration(
        color: controller.notifier.cardBg,
        borderRadius: BorderRadius.circular(Get.height / 60),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title,
              style: TextStyle(
                  fontFamily: "Gilroy",
                  color: controller.notifier.text,
                  fontSize: Get.height / 55)),
          Obx(() => CupertinoSwitch(
                value: value.value,
                activeColor: const Color(0xFF0165FC),
                onChanged: (v) => value.value = v,
              )),
        ],
      ),
    );
  }

  Widget _menuTile(IconData icon, String title, VoidCallback onTap) {
    return InkWell(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        margin: EdgeInsets.only(bottom: Get.height / 100),
        padding: EdgeInsets.symmetric(
            horizontal: Get.width / 30, vertical: Get.height / 55),
        decoration: BoxDecoration(
          color: controller.notifier.cardBg,
          borderRadius: BorderRadius.circular(Get.height / 60),
        ),
        child: Row(
          children: [
            Icon(icon,
                color: controller.notifier.subtitleText, size: Get.height / 38),
            SizedBox(width: Get.width / 25),
            Expanded(
              child: Text(title,
                  style: TextStyle(
                      fontFamily: "Gilroy",
                      color: controller.notifier.text,
                      fontSize: Get.height / 55)),
            ),
            Icon(Icons.arrow_forward_ios,
                color: controller.notifier.subtitleText, size: Get.height / 55),
          ],
        ),
      ),
    );
  }
}
