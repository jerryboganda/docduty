import 'package:get/get.dart';
import 'package:docduty/core/network/api_client.dart';
import 'package:docduty/core/models/models.dart';

/// Rating service — submit and view ratings.
class RatingService extends GetxService {
  final ApiClient _api = Get.find<ApiClient>();

  Future<void> submitRating({
    required String bookingId,
    required String rateeId,
    required int score,
    String? comment,
  }) async {
    await _api.post('/ratings', data: {
      'bookingId': bookingId,
      'rateeId': rateeId,
      'score': score,
      if (comment != null) 'comment': comment,
    });
  }

  Future<List<Rating>> getRatingsForUser(String userId) async {
    final res = await _api.get('/ratings/user/$userId');
    return ((res['ratings'] ?? []) as List)
        .map((j) => Rating.fromJson(j))
        .toList();
  }

  Future<Map<String, dynamic>> getRatingSummary(String userId) async {
    final res = await _api.get('/ratings/user/$userId/summary');
    return res;
  }
}
