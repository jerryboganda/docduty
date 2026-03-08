import 'package:get/get.dart';
import 'package:docduty/core/network/api_client.dart';
import 'package:docduty/core/models/models.dart';

/// Notification service — fetch + poll notifications.
class NotificationService extends GetxService {
  final ApiClient _api = Get.find<ApiClient>();

  final RxList<AppNotification> notifications = <AppNotification>[].obs;
  final RxInt unreadCount = 0.obs;

  Future<void> fetchNotifications({int page = 1, int limit = 50}) async {
    final res = await _api.get('/notifications', queryParameters: {
      'page': page,
      'limit': limit,
    });
    final list = ((res['notifications'] ?? []) as List)
        .map((j) => AppNotification.fromJson(j))
        .toList();
    if (page == 1) {
      notifications.value = list;
    } else {
      notifications.addAll(list);
    }
    _countUnread();
  }

  Future<void> markAsRead(String notificationId) async {
    await _api.put('/notifications/$notificationId/read');
    final idx = notifications.indexWhere((n) => n.id == notificationId);
    if (idx != -1) {
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
      _countUnread();
    }
  }

  Future<void> markAllAsRead() async {
    await _api.put('/notifications/read-all');
    for (var i = 0; i < notifications.length; i++) {
      if (!notifications[i].isRead) {
        notifications[i] = AppNotification(
          id: notifications[i].id,
          userId: notifications[i].userId,
          type: notifications[i].type,
          title: notifications[i].title,
          body: notifications[i].body,
          data: notifications[i].data,
          isRead: true,
          createdAt: notifications[i].createdAt,
        );
      }
    }
    _countUnread();
  }

  void _countUnread() {
    unreadCount.value = notifications.where((n) => !n.isRead).length;
  }
}
