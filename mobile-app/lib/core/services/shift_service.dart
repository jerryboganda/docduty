import 'package:get/get.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/network/api_client.dart';

/// Shift service for doctor and facility workflows.
class ShiftService extends GetxService {
  final ApiClient _api = Get.find<ApiClient>();

  Future<PaginatedResponse<Shift>> getAvailableShifts({
    int page = 1,
    int limit = 20,
    String? cityId,
    String? specialtyId,
    String? urgency,
    String? dateFrom,
    String? dateTo,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (cityId != null) 'cityId': cityId,
      if (specialtyId != null) 'specialtyId': specialtyId,
      if (urgency != null) 'urgency': urgency,
      if (dateFrom != null) 'startDate': dateFrom,
      if (dateTo != null) 'endDate': dateTo,
    };
    final res = await _api.get('/shifts', queryParameters: params);
    return PaginatedResponse.fromJson(
      res,
      (json) => Shift.fromJson(json),
      'shifts',
    );
  }

  Future<Shift> getShiftDetail(String shiftId) async {
    final res = await _api.get('/shifts/$shiftId');
    return Shift.fromJson(res['shift'] ?? res);
  }

  Future<void> applyToShift(
    String shiftId, {
    double? counterRate,
    String? message,
  }) async {
    if (counterRate != null) {
      await _api.post('/bookings/counter', data: {
        'shiftId': shiftId,
        'counterAmountPkr': counterRate,
        if (message != null && message.isNotEmpty) 'message': message,
      });
      return;
    }

    await _api.post('/bookings/accept', data: {
      'shiftId': shiftId,
    });
  }

  Future<Shift> createShift(Map<String, dynamic> data) async {
    final res = await _api.post('/shifts', data: data);
    return Shift.fromJson(res['shift'] ?? res);
  }

  Future<Shift> updateShift(String shiftId, Map<String, dynamic> data) async {
    final res = await _api.put('/shifts/$shiftId', data: data);
    return Shift.fromJson(res['shift'] ?? res);
  }

  Future<void> cancelShift(String shiftId, String reason) async {
    await _api.put('/shifts/$shiftId/cancel', data: {'reason': reason});
  }

  Future<PaginatedResponse<Shift>> getMyShifts({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
    };
    final res = await _api.get('/shifts', queryParameters: params);
    return PaginatedResponse.fromJson(
      res,
      (json) => Shift.fromJson(json),
      'shifts',
    );
  }

  Future<List<Offer>> getShiftOffers(String shiftId) async {
    final res = await _api.get('/shifts/$shiftId');
    return ((res['offers'] ?? []) as List)
        .map((json) => Offer.fromJson(json))
        .toList();
  }

  Future<void> acceptOffer(String offerId) async {
    await _api.put('/bookings/offers/$offerId/respond', data: {
      'action': 'accept',
    });
  }

  Future<void> rejectOffer(
    String offerId, {
    String? reason,
  }) async {
    await _api.put('/bookings/offers/$offerId/respond', data: {
      'action': 'reject',
      if (reason != null && reason.isNotEmpty) 'reason': reason,
    });
  }
}
