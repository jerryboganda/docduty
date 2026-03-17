import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/shift_service.dart';
import 'package:docduty/core/models/models.dart';

class ShiftDetailController extends GetxController {
  late ColorNotifier notifier;
  final ShiftService _shiftService = Get.find<ShiftService>();

  final Rx<Shift?> shift = Rx<Shift?>(null);
  final _isLoading = true.obs;
  bool get isLoading => _isLoading.value;

  final _error = ''.obs;
  String get error => _error.value;

  final _isApplying = false.obs;
  bool get isApplying => _isApplying.value;

  final counterRateController = TextEditingController();
  final messageController = TextEditingController();

  String get shiftId {
    final args = Get.arguments;
    if (args is Map) return args['shiftId']?.toString() ?? '';
    if (args is String) return args;
    return '';
  }

  @override
  void onInit() {
    super.onInit();
    loadShift();
  }

  Future<void> loadShift() async {
    _isLoading.value = true;
    _error.value = '';
    try {
      shift.value = await _shiftService.getShiftDetail(shiftId);
    } catch (e) {
      _error.value = 'Failed to load shift details';
    } finally {
      _isLoading.value = false;
    }
  }

  Future<void> applyToShift() async {
    _isApplying.value = true;
    try {
      final counterRate = double.tryParse(counterRateController.text);
      final message = messageController.text.trim().isEmpty
          ? null
          : messageController.text.trim();
      await _shiftService.applyToShift(
        shiftId,
        counterRate: counterRate,
        message: message,
      );
      Get.snackbar(
        'Application Sent',
        'Your application has been submitted successfully',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: const Color(0xFF0165FC),
        colorText: Colors.white,
      );
      Get.back();
    } catch (e) {
      Get.snackbar(
        'Error',
        'Failed to apply. Please try again.',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    } finally {
      _isApplying.value = false;
    }
  }

  @override
  void onClose() {
    counterRateController.dispose();
    messageController.dispose();
    super.onClose();
  }
}
