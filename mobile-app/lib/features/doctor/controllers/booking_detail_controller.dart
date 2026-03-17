import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:geolocator/geolocator.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/core/services/booking_service.dart';
import 'package:docduty/core/models/models.dart';

class BookingDetailController extends GetxController {
  late ColorNotifier notifier;
  final BookingService _bookingService = Get.find<BookingService>();

  final Rx<Booking?> booking = Rx<Booking?>(null);
  final RxList<AttendanceEvent> attendanceLog = <AttendanceEvent>[].obs;

  final _isLoading = true.obs;
  bool get isLoading => _isLoading.value;

  final _isChecking = false.obs;
  bool get isChecking => _isChecking.value;

  final _error = ''.obs;
  String get error => _error.value;

  String get bookingId {
    final args = Get.arguments;
    if (args is Map) return args['bookingId']?.toString() ?? '';
    if (args is String) return args;
    return '';
  }

  @override
  void onInit() {
    super.onInit();
    loadBooking();
  }

  Future<void> loadBooking() async {
    _isLoading.value = true;
    _error.value = '';
    try {
      booking.value = await _bookingService.getBookingDetail(bookingId);
      attendanceLog.value = await _bookingService.getAttendanceLog(bookingId);
    } catch (e) {
      _error.value = 'Failed to load booking details';
    } finally {
      _isLoading.value = false;
    }
  }

  Future<void> checkIn({String? qrToken}) async {
    _isChecking.value = true;
    try {
      final position = await _getLocation();
      await _bookingService.checkIn(
        bookingId,
        latitude: position.latitude,
        longitude: position.longitude,
        qrToken: qrToken,
      );
      Get.snackbar('Checked In', 'You have been checked in successfully',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: const Color(0xFF4CAF50),
          colorText: Colors.white);
      HapticFeedback.heavyImpact();
      if (Get.context != null) {
        SuccessOverlay.show(
          Get.context!,
          title: 'Checked In!',
          subtitle: 'Your shift has started. Have a great day!',
        );
      }
      await loadBooking();
    } catch (e) {
      Get.snackbar('Error', 'Check-in failed: ${e.toString()}',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white);
    } finally {
      _isChecking.value = false;
    }
  }

  Future<void> checkOut() async {
    _isChecking.value = true;
    try {
      final position = await _getLocation();
      await _bookingService.checkOut(
        bookingId,
        latitude: position.latitude,
        longitude: position.longitude,
      );
      Get.snackbar('Checked Out', 'You have been checked out successfully',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: const Color(0xFF4CAF50),
          colorText: Colors.white);
      HapticFeedback.heavyImpact();
      if (Get.context != null) {
        SuccessOverlay.show(
          Get.context!,
          title: 'Checked Out!',
          subtitle: 'Great work! Your shift is complete.',
        );
      }
      await loadBooking();
    } catch (e) {
      Get.snackbar('Error', 'Check-out failed: ${e.toString()}',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white);
    } finally {
      _isChecking.value = false;
    }
  }

  Future<Position> _getLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permission denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permissions are permanently denied');
    }

    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }
}
