import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/features/doctor/controllers/doctor_shell_controller.dart';

class DoctorShellView extends GetView<DoctorShellController> {
  const DoctorShellView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      body: Obx(
        () => IndexedStack(
          index: controller.selectedIndex,
          children: controller.tabs,
        ),
      ),
      bottomNavigationBar: Obx(
        () => Container(
          decoration: BoxDecoration(
            color: controller.notifier.getBgColor,
            boxShadow: controller.notifier.shadowLg,
          ),
          child: BottomNavigationBar(
            backgroundColor: Colors.transparent,
            currentIndex: controller.selectedIndex,
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
            selectedItemColor: const Color(0xFF0165FC),
            type: BottomNavigationBarType.fixed,
            onTap: (value) {
              HapticFeedback.selectionClick();
              controller.selectedIndex = value;
            },
            elevation: 0,
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.work_outline),
                activeIcon: Icon(Icons.work),
                label: 'Shifts',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.calendar_today_outlined),
                activeIcon: Icon(Icons.calendar_today),
                label: 'Bookings',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.chat_bubble_outline),
                activeIcon: Icon(Icons.chat_bubble),
                label: 'Messages',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.account_balance_wallet_outlined),
                activeIcon: Icon(Icons.account_balance_wallet),
                label: 'Wallet',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person_outline),
                activeIcon: Icon(Icons.person),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
