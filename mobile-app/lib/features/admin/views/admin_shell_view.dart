import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/routes/app_routes.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/features/admin/controllers/admin_shell_controller.dart';
import 'package:docduty/features/admin/views/admin_dashboard_view.dart';
import 'package:docduty/features/admin/views/admin_verifications_view.dart';
import 'package:docduty/features/admin/views/admin_disputes_view.dart';
import 'package:docduty/features/admin/views/admin_payouts_view.dart';
import 'package:docduty/features/admin/views/admin_more_view.dart';

class AdminShellView extends GetView<AdminShellController> {
  const AdminShellView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.syncRoute(Get.currentRoute);
    });

    final pages = [
      const AdminDashboardView(),
      const AdminVerificationsView(),
      const AdminDisputesView(),
      const AdminPayoutsView(),
      const AdminMoreView(),
    ];

    return Obx(() => Scaffold(
          body: IndexedStack(
            index: controller.currentIndex.value,
            children: pages,
          ),
          bottomNavigationBar: Container(
            decoration: BoxDecoration(
              color: controller.notifier.getBgColor,
              boxShadow: controller.notifier.shadowLg,
            ),
            child: BottomNavigationBar(
              currentIndex: controller.currentIndex.value,
              onTap: (index) {
                HapticFeedback.selectionClick();
                final route = index == 1
                    ? Routes.ADMIN_VERIFICATIONS
                    : index == 2
                        ? Routes.ADMIN_DISPUTES
                        : index == 3
                            ? Routes.ADMIN_PAYOUTS
                            : Routes.ADMIN_DASHBOARD;
                Get.offNamed(route);
              },
              type: BottomNavigationBarType.fixed,
              backgroundColor: Colors.transparent,
              selectedItemColor: const Color(0xFF0165FC),
              unselectedItemColor: Colors.grey,
              selectedLabelStyle: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 65,
                  fontWeight: FontWeight.w600),
              unselectedLabelStyle:
                  TextStyle(fontFamily: "Gilroy", fontSize: Get.height / 70),
              elevation: 0,
              items: const [
                BottomNavigationBarItem(
                    icon: Icon(Icons.dashboard_outlined),
                    activeIcon: Icon(Icons.dashboard),
                    label: 'Dashboard'),
                BottomNavigationBarItem(
                    icon: Icon(Icons.verified_user_outlined),
                    activeIcon: Icon(Icons.verified_user),
                    label: 'Verify'),
                BottomNavigationBarItem(
                    icon: Icon(Icons.gavel_outlined),
                    activeIcon: Icon(Icons.gavel),
                    label: 'Disputes'),
                BottomNavigationBarItem(
                    icon: Icon(Icons.payments_outlined),
                    activeIcon: Icon(Icons.payments),
                    label: 'Payouts'),
                BottomNavigationBarItem(
                    icon: Icon(Icons.more_horiz),
                    activeIcon: Icon(Icons.more_horiz),
                    label: 'More'),
              ],
            ),
          ),
        ));
  }
}
