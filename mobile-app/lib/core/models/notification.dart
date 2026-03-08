/// AppNotification model. Maps to notifications table.

class AppNotification {
  final String id;
  final String userId;
  final String? type;
  final String? title;
  final String? body;
  final Map<String, dynamic>? data;
  final bool isRead;
  final String? createdAt;

  AppNotification({
    required this.id,
    required this.userId,
    this.type,
    this.title,
    this.body,
    this.data,
    required this.isRead,
    this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? data;
    if (json['data'] is Map) {
      data = Map<String, dynamic>.from(json['data']);
    } else if (json['data'] is String) {
      try {
        // Backend stores as JSON string
        data = null; // Parse if needed
      } catch (_) {}
    }

    return AppNotification(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? json['userId'] ?? '',
      type: json['type'],
      title: json['title'],
      body: json['body'],
      data: data,
      isRead: json['is_read'] == 1 ||
          json['is_read'] == true ||
          json['isRead'] == true,
      createdAt: json['created_at'] ?? json['createdAt'],
    );
  }
}
