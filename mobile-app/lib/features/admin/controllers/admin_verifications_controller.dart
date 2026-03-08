import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/services/services.dart';

class AdminVerificationsController extends GetxController {
  late ColorNotifier notifier;

  final _adminService = Get.find<AdminService>();

  final pendingList = <User>[].obs;
  final isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    loadPending();
  }

  Future<void> loadPending() async {
    try {
      isLoading(true);
      final result = await _adminService.getPendingVerifications();
      pendingList.assignAll(result.data);
    } catch (_) {
    } finally {
      isLoading(false);
    }
  }

  Future<void> approve(String userId) async {
    try {
      await _adminService.approveVerification(userId);
      pendingList.removeWhere((u) => u.id == userId);
      Get.snackbar('Success', 'User verified',
          backgroundColor: const Color(0xFF4CAF50), colorText: Colors.white);
    } catch (e) {
      Get.snackbar('Error', e.toString(),
          backgroundColor: Colors.red, colorText: Colors.white);
    }
  }

  Future<void> reject(String userId, String reason) async {
    try {
      await _adminService.rejectVerification(userId, reason);
      pendingList.removeWhere((u) => u.id == userId);
      Get.snackbar('Done', 'Verification rejected');
    } catch (e) {
      Get.snackbar('Error', e.toString(),
          backgroundColor: Colors.red, colorText: Colors.white);
    }
  }

  Future<void> refresh() => loadPending();
}
