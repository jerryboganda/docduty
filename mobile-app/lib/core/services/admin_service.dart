import 'package:get/get.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/network/api_client.dart';

/// Admin service for the active mobile admin surfaces.
class AdminService extends GetxService {
  final ApiClient _api = Get.find<ApiClient>();

  Future<AdminDashboard> getDashboard() async {
    final res = await _api.get('/admin/dashboard');
    return AdminDashboard.fromJson(res);
  }

  Future<PaginatedResponse<User>> getPendingVerifications({
    int page = 1,
    int limit = 20,
  }) async {
    final res = await _api.get('/admin/verifications', queryParameters: {
      'page': page,
      'limit': limit,
      'status': 'pending_review',
    });
    return PaginatedResponse.fromJson(
      res,
      (json) => User.fromJson(json),
      'users',
    );
  }

  Future<void> approveVerification(String userId) async {
    await _api.put('/admin/verifications/$userId', data: {
      'decision': 'verified',
    });
  }

  Future<void> rejectVerification(String userId, String reason) async {
    await _api.put('/admin/verifications/$userId', data: {
      'decision': 'rejected',
      'reason': reason,
    });
  }

  Future<PaginatedResponse<Payout>> getPendingPayouts({
    int page = 1,
    int limit = 20,
  }) async {
    final res = await _api.get('/admin/payouts', queryParameters: {
      'page': page,
      'limit': limit,
      'status': 'pending',
    });
    return PaginatedResponse.fromJson(
      res,
      (json) => Payout.fromJson(json),
      'payouts',
    );
  }

  Future<void> approvePayout(String payoutId) async {
    await _api.put('/admin/payouts/$payoutId/process', data: {
      'status': 'completed',
    });
  }

  Future<void> rejectPayout(String payoutId, String reason) async {
    await _api.put('/admin/payouts/$payoutId/process', data: {
      'status': 'failed',
      'paymentReference': reason,
    });
  }
}
