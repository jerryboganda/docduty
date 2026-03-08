import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/routes/app_routes.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/features/admin/controllers/admin_dashboard_controller.dart';

class AdminDashboardView extends GetView<AdminDashboardController> {
  const AdminDashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      body: SafeArea(
        child: Obx(() {
          if (controller.isLoading.value &&
              controller.dashboard.value == null) {
            return const ShimmerLoading(itemCount: 4);
          }

          if (controller.error.isNotEmpty) {
            return ErrorRetryWidget(
                message: controller.error.value,
                onRetry: () => controller.loadDashboard());
          }

          final d = controller.dashboard.value;

          return RefreshIndicator(
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              await controller.refresh();
            },
            color: const Color(0xFF0165FC),
            child: ListView(
              padding: EdgeInsets.all(Get.width / 25),
              children: [
                Text("Admin Dashboard",
                    style: TextStyle(
                        fontFamily: "Gilroy",
                        fontSize: Get.height / 35,
                        fontWeight: FontWeight.w600,
                        color: controller.notifier.text)),
                SizedBox(height: Get.height / 40),
                // Stats Grid
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: Get.height / 70,
                  crossAxisSpacing: Get.width / 30,
                  childAspectRatio: 1.4,
                  children: [
                    _statCard(
                        "Pending Verifications",
                        '${d?.pendingVerifications ?? 0}',
                        Icons.verified_user,
                        Colors.amber),
                    _statCard("Open Disputes", '${d?.openDisputes ?? 0}',
                        Icons.gavel, Colors.red),
                    _statCard("Pending Payouts", '${d?.pendingPayouts ?? 0}',
                        Icons.payments, Colors.teal),
                    _statCard(
                        "Suspicious Attendance",
                        '${d?.suspiciousAttendance ?? 0}',
                        Icons.warning,
                        Colors.orange),
                  ],
                ),
                SizedBox(height: Get.height / 30),
                // Quick Actions
                SectionHeader(title: "Quick Actions"),
                SizedBox(height: Get.height / 60),
                Wrap(
                  spacing: Get.width / 30,
                  runSpacing: Get.height / 70,
                  children: [
                    _actionChip("Verification Queue", Icons.verified_user,
                        () => Get.offNamed(Routes.ADMIN_VERIFICATIONS)),
                    _actionChip("Disputes", Icons.gavel,
                        () => Get.offNamed(Routes.ADMIN_DISPUTES)),
                    _actionChip("Payouts", Icons.payments,
                        () => Get.offNamed(Routes.ADMIN_PAYOUTS)),
                    _actionChip("Settings", Icons.settings,
                        () => Get.toNamed(Routes.SETTINGS)),
                  ],
                ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _statCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: EdgeInsets.all(Get.width / 25),
      decoration: BoxDecoration(
        color: controller.notifier.cardBg,
        borderRadius: BorderRadius.circular(Get.height / 50),
        border: Border.all(color: controller.notifier.getfillborder),
        boxShadow: controller.notifier.shadowSm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: EdgeInsets.all(Get.width / 50),
            decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(Get.height / 80)),
            child: Icon(icon, color: color, size: Get.height / 45),
          ),
          CountUpText(
              end: int.tryParse(value) ?? 0,
              style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 40,
                  fontWeight: FontWeight.w700,
                  color: controller.notifier.text)),
          Text(title,
              style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 65,
                  color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _actionChip(String label, IconData icon, VoidCallback onTap) {
    return PressableScale(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
            horizontal: Get.width / 25, vertical: Get.height / 80),
        decoration: BoxDecoration(
          color: const Color(0xFF0165FC).withOpacity(0.08),
          borderRadius: BorderRadius.circular(Get.height / 50),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: const Color(0xFF0165FC), size: Get.height / 50),
            SizedBox(width: Get.width / 50),
            Text(label,
                style: TextStyle(
                    fontFamily: "Gilroy",
                    fontSize: Get.height / 60,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF0165FC))),
          ],
        ),
      ),
    );
  }
}
