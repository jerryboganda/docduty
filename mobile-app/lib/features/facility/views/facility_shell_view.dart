import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/features/facility/controllers/facility_shell_controller.dart';
import 'package:docduty/features/facility/views/facility_dashboard_view.dart';
import 'package:docduty/features/facility/views/facility_shifts_view.dart';
import 'package:docduty/features/facility/views/facility_bookings_view.dart';
import 'package:docduty/features/shared/views/messages_list_view.dart';
import 'package:docduty/features/facility/views/facility_profile_view.dart';

class FacilityShellView extends GetView<FacilityShellController> {
  const FacilityShellView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    final pages = [
      const FacilityDashboardView(),
      const FacilityShiftsView(),
      const FacilityBookingsView(),
      const MessagesListView(),
      const FacilityProfileView(),
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
                controller.changePage(index);
              },
              type: BottomNavigationBarType.fixed,
              backgroundColor: Colors.transparent,
              selectedItemColor: const Color(0xFF0165FC),
              unselectedItemColor: Colors.grey,
              selectedLabelStyle: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 65,
                fontWeight: FontWeight.w600,
              ),
              unselectedLabelStyle: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 70,
              ),
              elevation: 0,
              items: [
                const BottomNavigationBarItem(
                  icon: Icon(Icons.dashboard_outlined),
                  activeIcon: Icon(Icons.dashboard),
                  label: 'Dashboard',
                ),
                const BottomNavigationBarItem(
                  icon: Icon(Icons.work_outline),
                  activeIcon: Icon(Icons.work),
                  label: 'Shifts',
                ),
                const BottomNavigationBarItem(
                  icon: Icon(Icons.calendar_today_outlined),
                  activeIcon: Icon(Icons.calendar_today),
                  label: 'Bookings',
                ),
                BottomNavigationBarItem(
                  icon: Badge(
                    isLabelVisible: controller.unreadCount > 0,
                    label: Text('${controller.unreadCount}'),
                    child: const Icon(Icons.chat_bubble_outline),
                  ),
                  activeIcon: const Icon(Icons.chat_bubble),
                  label: 'Messages',
                ),
                const BottomNavigationBarItem(
                  icon: Icon(Icons.person_outline),
                  activeIcon: Icon(Icons.person),
                  label: 'Profile',
                ),
              ],
            ),
          ),
        ));
  }
}
