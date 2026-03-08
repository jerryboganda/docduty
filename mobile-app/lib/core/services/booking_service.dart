import 'package:get/get.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/network/api_client.dart';

/// Booking service for bookings and attendance.
class BookingService extends GetxService {
  final ApiClient _api = Get.find<ApiClient>();

  Future<PaginatedResponse<Booking>> getBookings({
    int page = 1,
    int limit = 20,
    String? status,
    String? role,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
    };
    final res = await _api.get('/bookings', queryParameters: params);
    return PaginatedResponse.fromJson(
      res,
      (json) => Booking.fromJson(json),
      'bookings',
    );
  }

  Future<Booking> getBookingDetail(String bookingId) async {
    final res = await _api.get('/bookings/$bookingId');
    return Booking.fromJson(res['booking'] ?? res);
  }

  Future<void> checkIn(
    String bookingId, {
    required double latitude,
    required double longitude,
    String? qrToken,
  }) async {
    await _api.post('/attendance/check-in', data: {
      'bookingId': bookingId,
      'latitude': latitude,
      'longitude': longitude,
      if (qrToken != null) 'qrCode': qrToken,
    });
  }

  Future<void> checkOut(
    String bookingId, {
    required double latitude,
    required double longitude,
  }) async {
    await _api.post('/attendance/check-out', data: {
      'bookingId': bookingId,
      'latitude': latitude,
      'longitude': longitude,
    });
  }

  Future<List<AttendanceEvent>> getAttendanceLog(String bookingId) async {
    final res = await _api.get('/attendance/$bookingId');
    return ((res['events'] ?? []) as List)
        .map((json) => AttendanceEvent.fromJson(json))
        .toList();
  }

  Future<void> cancelBooking(String bookingId, String reason) async {
    await _api.put('/bookings/$bookingId/cancel', data: {'reason': reason});
  }
}
