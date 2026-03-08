import 'package:get/get.dart';
import 'package:docduty/core/network/api_client.dart';
import 'package:docduty/core/models/models.dart';

/// Dispute service — raise, manage, and resolve disputes.
class DisputeService extends GetxService {
  final ApiClient _api = Get.find<ApiClient>();

  Future<Dispute> raiseDispute({
    required String bookingId,
    required String type,
    required String description,
  }) async {
    final res = await _api.post('/disputes', data: {
      'bookingId': bookingId,
      'type': type,
      'description': description,
    });
    return Dispute.fromJson(res['dispute'] ?? res);
  }

  Future<PaginatedResponse<Dispute>> getDisputes({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
    };
    final res = await _api.get('/disputes', queryParameters: params);
    return PaginatedResponse.fromJson(
        res, (json) => Dispute.fromJson(json), 'disputes');
  }

  Future<Dispute> getDisputeDetail(String disputeId) async {
    final res = await _api.get('/disputes/$disputeId');
    return Dispute.fromJson(res['dispute'] ?? res);
  }

  Future<void> addEvidence(
    String disputeId, {
    required String type,
    required String content,
  }) async {
    await _api.post('/disputes/$disputeId/evidence', data: {
      'type': type,
      'content': content,
    });
  }

  Future<void> resolveDispute(
    String disputeId, {
    required String resolution,
    required String decision,
    double? refundAmount,
  }) async {
    await _api.put('/disputes/$disputeId/resolve', data: {
      'resolution': resolution,
      'decision': decision,
      if (refundAmount != null) 'refundAmount': refundAmount,
    });
  }
}
