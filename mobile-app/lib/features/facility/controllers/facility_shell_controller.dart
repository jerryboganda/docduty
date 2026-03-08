import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/services.dart';

class FacilityShellController extends GetxController {
  late ColorNotifier notifier;

  final currentIndex = 0.obs;

  final _notificationService = Get.find<NotificationService>();
  int get unreadCount => _notificationService.unreadCount.value;

  void changePage(int index) => currentIndex.value = index;
}
