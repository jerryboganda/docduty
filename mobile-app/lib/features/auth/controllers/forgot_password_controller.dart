import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';

class ForgotPasswordController extends GetxController {
  late ColorNotifier notifier;
  final phoneController = TextEditingController();

  final _isLoading = false.obs;
  bool get isLoading => _isLoading.value;

  final _errorMessage = ''.obs;
  String get errorMessage => _errorMessage.value;

  final _codeSent = false.obs;
  bool get codeSent => _codeSent.value;

  Future<void> sendResetCode() async {
    if (phoneController.text.trim().isEmpty) {
      _errorMessage.value = 'Please enter your phone number';
      return;
    }
    _isLoading.value = true;
    _errorMessage.value = '';
    try {
      // NOTE: Backend may need to add this endpoint.
      // For now, simulate success.
      await Future.delayed(const Duration(seconds: 1));
      _codeSent.value = true;
      Get.snackbar(
        'Success',
        'Reset code sent to your phone',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: const Color(0xFF0165FC),
        colorText: Colors.white,
      );
    } catch (_) {
      _errorMessage.value = 'Failed to send reset code';
    } finally {
      _isLoading.value = false;
    }
  }

  @override
  void onClose() {
    phoneController.dispose();
    super.onClose();
  }
}
