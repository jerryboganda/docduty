import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/services/services.dart';

class AdminPayoutsController extends GetxController {
  late ColorNotifier notifier;

  final _adminService = Get.find<AdminService>();

  final pendingPayouts = <Payout>[].obs;
  final isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    loadPayouts();
  }

  Future<void> loadPayouts() async {
    try {
      isLoading(true);
      final result = await _adminService.getPendingPayouts();
      pendingPayouts.assignAll(result.data);
    } catch (_) {
    } finally {
      isLoading(false);
    }
  }

  Future<void> approvePayout(String payoutId) async {
    try {
      await _adminService.approvePayout(payoutId);
      pendingPayouts.removeWhere((p) => p.id == payoutId);
      Get.snackbar('Success', 'Payout approved',
          backgroundColor: const Color(0xFF4CAF50), colorText: Colors.white);
    } catch (e) {
      Get.snackbar('Error', e.toString(),
          backgroundColor: Colors.red, colorText: Colors.white);
    }
  }

  Future<void> rejectPayout(String payoutId, String reason) async {
    try {
      await _adminService.rejectPayout(payoutId, reason);
      pendingPayouts.removeWhere((p) => p.id == payoutId);
      Get.snackbar('Done', 'Payout rejected');
    } catch (e) {
      Get.snackbar('Error', e.toString(),
          backgroundColor: Colors.red, colorText: Colors.white);
    }
  }

  Future<void> refresh() => loadPayouts();
}
