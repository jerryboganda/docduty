import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/services.dart';

class ChangePasswordController extends GetxController {
  late ColorNotifier notifier;

  final _authService = Get.find<AuthService>();

  final oldPasswordController = TextEditingController();
  final newPasswordController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  final isLoading = false.obs;
  final obscureOld = true.obs;
  final obscureNew = true.obs;
  final obscureConfirm = true.obs;

  void toggleOld() => obscureOld.value = !obscureOld.value;
  void toggleNew() => obscureNew.value = !obscureNew.value;
  void toggleConfirm() => obscureConfirm.value = !obscureConfirm.value;

  Future<void> changePassword() async {
    final oldPwd = oldPasswordController.text.trim();
    final newPwd = newPasswordController.text.trim();
    final confirmPwd = confirmPasswordController.text.trim();

    if (oldPwd.isEmpty || newPwd.isEmpty || confirmPwd.isEmpty) {
      Get.snackbar('Error', 'All fields are required',
          backgroundColor: Colors.red.shade100);
      return;
    }

    if (newPwd.length < 8) {
      Get.snackbar('Error', 'Password must be at least 8 characters',
          backgroundColor: Colors.red.shade100);
      return;
    }

    if (newPwd != confirmPwd) {
      Get.snackbar('Error', 'Passwords do not match',
          backgroundColor: Colors.red.shade100);
      return;
    }

    try {
      isLoading.value = true;
      await _authService.changePassword(oldPwd, newPwd);
      Get.back();
      Get.snackbar('Success', 'Password changed successfully',
          backgroundColor: Colors.green.shade100);
    } catch (e) {
      Get.snackbar('Error', e.toString(), backgroundColor: Colors.red.shade100);
    } finally {
      isLoading.value = false;
    }
  }

  @override
  void onClose() {
    oldPasswordController.dispose();
    newPasswordController.dispose();
    confirmPasswordController.dispose();
    super.onClose();
  }
}
