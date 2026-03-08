import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/services.dart';
import 'package:docduty/shared/routes/app_routes.dart';

class AdminShellController extends GetxController {
  late ColorNotifier notifier;

  final currentIndex = 0.obs;

  final _notificationService = Get.find<NotificationService>();
  int get unreadCount => _notificationService.unreadCount.value;

  void changePage(int index) => currentIndex.value = index;

  void syncRoute(String route) {
    switch (route) {
      case Routes.ADMIN_VERIFICATIONS:
        currentIndex.value = 1;
        break;
      case Routes.ADMIN_DISPUTES:
        currentIndex.value = 2;
        break;
      case Routes.ADMIN_PAYOUTS:
        currentIndex.value = 3;
        break;
      case Routes.ADMIN_SHELL:
      case Routes.ADMIN_DASHBOARD:
        currentIndex.value = 0;
        break;
      default:
        currentIndex.value = 4;
        break;
    }
  }
}
