import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/services/services.dart';

class NotificationsController extends GetxController {
  late ColorNotifier notifier;

  final _notificationService = Get.find<NotificationService>();

  final notifications = <AppNotification>[].obs;
  final isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    loadNotifications();
  }

  Future<void> loadNotifications() async {
    try {
      isLoading(true);
      await _notificationService.fetchNotifications();
      notifications.assignAll(_notificationService.notifications);
    } catch (_) {
    } finally {
      isLoading(false);
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _notificationService.markAsRead(id);
      final idx = notifications.indexWhere((n) => n.id == id);
      if (idx >= 0) {
        notifications[idx] = AppNotification(
          id: notifications[idx].id,
          userId: notifications[idx].userId,
          type: notifications[idx].type,
          title: notifications[idx].title,
          body: notifications[idx].body,
          data: notifications[idx].data,
          isRead: true,
          createdAt: notifications[idx].createdAt,
        );
      }
    } catch (_) {}
  }

  Future<void> markAllAsRead() async {
    try {
      await _notificationService.markAllAsRead();
      await loadNotifications();
    } catch (_) {}
  }

  Future<void> refresh() => loadNotifications();
}
