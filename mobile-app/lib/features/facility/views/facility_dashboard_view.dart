import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/features/facility/controllers/facility_dashboard_controller.dart';

class FacilityDashboardView extends GetView<FacilityDashboardController> {
  const FacilityDashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      body: SafeArea(
        child: Obx(() {
          if (controller.isLoading.value && controller.stats.isEmpty) {
            return const ShimmerLoading(itemCount: 4);
          }

          if (controller.error.isNotEmpty) {
            return ErrorRetryWidget(
              message: controller.error.value,
              onRetry: () => controller.loadStats(),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              await controller.refresh();
            },
            color: const Color(0xFF0165FC),
            child: ListView(
              padding: EdgeInsets.all(Get.width / 25),
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Welcome back,",
                          style: TextStyle(
                            fontFamily: "Gilroy",
                            fontSize: Get.height / 55,
                            color: Colors.grey,
                          ),
                        ),
                        Text(
                          controller.facilityName,
                          style: TextStyle(
                            fontFamily: "Gilroy",
                            fontSize: Get.height / 38,
                            fontWeight: FontWeight.w600,
                            color: controller.notifier.text,
                          ),
                        ),
                      ],
                    ),
                    GestureDetector(
                      onTap: () {},
                      child: Container(
                        padding: EdgeInsets.all(Get.width / 35),
                        decoration: BoxDecoration(
                          color: controller.notifier.cardBg,
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: controller.notifier.getfillborder),
                        ),
                        child: Icon(Icons.notifications_outlined,
                            color: controller.notifier.text,
                            size: Get.height / 40),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: Get.height / 35),
                // Quick Stats Grid
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: Get.height / 70,
                  crossAxisSpacing: Get.width / 30,
                  childAspectRatio: 1.4,
                  children: [
                    _statCard(
                        "Active Shifts",
                        '${controller.stats['activeShifts'] ?? 0}',
                        Icons.work,
                        const Color(0xFF0165FC)),
                    _statCard(
                        "Active Bookings",
                        '${controller.stats['activeBookings'] ?? 0}',
                        Icons.calendar_today,
                        const Color(0xFF4CAF50)),
                    _statCard(
                        "Pending Offers",
                        '${controller.stats['pendingOffers'] ?? 0}',
                        Icons.pending_actions,
                        Colors.orange),
                    _statCard(
                        "Monthly Spend",
                        'PKR ${controller.stats['monthlySpend'] ?? 0}',
                        Icons.account_balance_wallet,
                        Colors.purple),
                  ],
                ),
                SizedBox(height: Get.height / 30),
                // Quick Actions
                SectionHeader(title: "Quick Actions"),
                SizedBox(height: Get.height / 60),
                Row(
                  children: [
                    Expanded(
                      child: _actionCard(
                        "Post Shift",
                        Icons.add_circle_outline,
                        () => controller.goToShifts(),
                      ),
                    ),
                    SizedBox(width: Get.width / 30),
                    Expanded(
                      child: _actionCard(
                        "Manage Locations",
                        Icons.location_on_outlined,
                        () => controller.goToLocations(),
                      ),
                    ),
                    SizedBox(width: Get.width / 30),
                    Expanded(
                      child: _actionCard(
                        "QR Codes",
                        Icons.qr_code,
                        () => controller.goToQrCodes(),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: Get.height / 30),
                // Recent Activity
                SectionHeader(title: "Recent Activity"),
                SizedBox(height: Get.height / 60),
                if (controller.stats['recentBookings'] != null)
                  ...((controller.stats['recentBookings'] as List)
                      .take(5)
                      .map((b) => Container(
                            margin: EdgeInsets.only(bottom: Get.height / 100),
                            padding: EdgeInsets.all(Get.width / 30),
                            decoration: BoxDecoration(
                              color: controller.notifier.cardBg,
                              borderRadius:
                                  BorderRadius.circular(Get.height / 70),
                              border: Border.all(
                                  color: controller.notifier.getfillborder),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: EdgeInsets.all(Get.width / 40),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF0165FC)
                                        .withOpacity(0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(Icons.person,
                                      color: const Color(0xFF0165FC),
                                      size: Get.height / 45),
                                ),
                                SizedBox(width: Get.width / 30),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        b['doctorName'] ?? 'Doctor',
                                        style: TextStyle(
                                          fontFamily: "Gilroy",
                                          fontSize: Get.height / 55,
                                          fontWeight: FontWeight.w500,
                                          color: controller.notifier.text,
                                        ),
                                      ),
                                      Text(
                                        b['status'] ?? '',
                                        style: TextStyle(
                                          fontFamily: "Gilroy",
                                          fontSize: Get.height / 65,
                                          color: Colors.grey,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                StatusBadge(
                                    label: (b['status'] ?? '').toUpperCase(),
                                    color: _statusColor(b['status'] ?? '')),
                              ],
                            ),
                          )))
                else
                  const EmptyStateWidget(
                    title: 'No Recent Activity',
                    subtitle: 'Post your first shift to get started',
                    icon: Icons.history,
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
              borderRadius: BorderRadius.circular(Get.height / 80),
            ),
            child: Icon(icon, color: color, size: Get.height / 45),
          ),
          CountUpText(
            end: int.tryParse(value) ?? 0,
            style: TextStyle(
              fontFamily: "Gilroy",
              fontSize: Get.height / 40,
              fontWeight: FontWeight.w700,
              color: controller.notifier.text,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontFamily: "Gilroy",
              fontSize: Get.height / 65,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionCard(String title, IconData icon, VoidCallback onTap) {
    return PressableScale(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(vertical: Get.height / 50),
        decoration: BoxDecoration(
          color: const Color(0xFF0165FC).withOpacity(0.08),
          borderRadius: BorderRadius.circular(Get.height / 60),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF0165FC), size: Get.height / 35),
            SizedBox(height: Get.height / 120),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 70,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF0165FC),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'open':
        return Colors.orange;
      case 'confirmed':
      case 'active':
        return const Color(0xFF0165FC);
      case 'completed':
      case 'settled':
        return const Color(0xFF4CAF50);
      case 'cancelled':
      case 'no_show':
        return Colors.red;
      case 'pending':
        return Colors.amber;
      default:
        return Colors.grey;
    }
  }
}
