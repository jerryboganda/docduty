import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/services.dart';

class EditProfileController extends GetxController {
  late ColorNotifier notifier;

  final _authService = Get.find<AuthService>();

  final nameController = TextEditingController();
  final phoneController = TextEditingController();
  final emailController = TextEditingController();
  final isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    final user = _authService.currentUser.value;
    if (user != null) {
      nameController.text = user.fullName;
      phoneController.text = user.phone;
      emailController.text = user.email ?? '';
    }
  }

  Future<void> saveProfile() async {
    try {
      isLoading(true);
      await _authService.updateProfile({
        'fullName': nameController.text.trim(),
        'phone': phoneController.text.trim(),
      });
      Get.snackbar('Success', 'Profile updated',
          backgroundColor: const Color(0xFF4CAF50), colorText: Colors.white);
      Get.back();
    } catch (e) {
      Get.snackbar('Error', e.toString(),
          backgroundColor: Colors.red, colorText: Colors.white);
    } finally {
      isLoading(false);
    }
  }

  @override
  void onClose() {
    nameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    super.onClose();
  }
}
