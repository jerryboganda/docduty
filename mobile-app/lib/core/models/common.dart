/// Common response wrappers for API calls.

class PaginatedResponse<T> {
  final List<T> data;
  final int total;
  final int page;
  final int limit;

  PaginatedResponse({
    required this.data,
    required this.total,
    required this.page,
    required this.limit,
  });

  bool get hasMore => (page * limit) < total;
  int get totalPages => (total / limit).ceil();

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
    String dataKey,
  ) {
    final items =
        (json[dataKey] as List?)?.map((e) => fromJsonT(e)).toList() ?? [];
    return PaginatedResponse(
      data: items,
      total: json['total'] ?? json['pagination']?['total'] ?? items.length,
      page: json['page'] ?? json['pagination']?['page'] ?? 1,
      limit: json['limit'] ?? json['pagination']?['limit'] ?? 20,
    );
  }
}

class AuthResponse {
  final Map<String, dynamic> user;
  final String accessToken;
  final String refreshToken;

  AuthResponse({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
        user: json['user'] is Map<String, dynamic> ? json['user'] : {},
        accessToken: json['accessToken'] ?? '',
        refreshToken: json['refreshToken'] ?? '',
      );
}

/// Admin dashboard stats
class AdminDashboard {
  final int pendingVerifications;
  final int openDisputes;
  final int pendingPayouts;
  final int suspiciousAttendance;
  final List<dynamic>? recentVerifications;
  final List<dynamic>? recentDisputes;
  final List<dynamic>? alerts;

  AdminDashboard({
    required this.pendingVerifications,
    required this.openDisputes,
    required this.pendingPayouts,
    required this.suspiciousAttendance,
    this.recentVerifications,
    this.recentDisputes,
    this.alerts,
  });

  factory AdminDashboard.fromJson(Map<String, dynamic> json) => AdminDashboard(
        pendingVerifications:
            json['pendingVerifications'] ?? json['pending_verifications'] ?? 0,
        openDisputes: json['openDisputes'] ?? json['open_disputes'] ?? 0,
        pendingPayouts: json['pendingPayouts'] ?? json['pending_payouts'] ?? 0,
        suspiciousAttendance:
            json['suspiciousAttendance'] ?? json['suspicious_attendance'] ?? 0,
        recentVerifications:
            json['recentVerifications'] ?? json['recent_verifications'],
        recentDisputes: json['recentDisputes'] ?? json['recent_disputes'],
        alerts: json['alerts'],
      );
}

/// Admin analytics response
class AdminAnalytics {
  final Map<String, dynamic> raw;

  AdminAnalytics({required this.raw});

  factory AdminAnalytics.fromJson(Map<String, dynamic> json) =>
      AdminAnalytics(raw: json);

  dynamic operator [](String key) => raw[key];
}

/// Audit log entry
class AuditLog {
  final String id;
  final String? userId;
  final String action;
  final String? entityType;
  final String? entityId;
  final String? oldValue;
  final String? newValue;
  final String? ipAddress;
  final String? createdAt;
  final String? userName;

  AuditLog({
    required this.id,
    this.userId,
    required this.action,
    this.entityType,
    this.entityId,
    this.oldValue,
    this.newValue,
    this.ipAddress,
    this.createdAt,
    this.userName,
  });

  factory AuditLog.fromJson(Map<String, dynamic> json) => AuditLog(
        id: json['id'] ?? '',
        userId: json['user_id'] ?? json['userId'],
        action: json['action'] ?? '',
        entityType: json['entity_type'] ?? json['entityType'],
        entityId: json['entity_id'] ?? json['entityId'],
        oldValue: json['old_value'] ?? json['oldValue'],
        newValue: json['new_value'] ?? json['newValue'],
        ipAddress: json['ip_address'] ?? json['ipAddress'],
        createdAt: json['created_at'] ?? json['createdAt'],
        userName: json['user_name'] ?? json['userName'],
      );
}
