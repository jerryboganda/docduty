import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/services/services.dart';

class AdminDisputesController extends GetxController {
  late ColorNotifier notifier;

  final _disputeService = Get.find<DisputeService>();

  final disputes = <Dispute>[].obs;
  final isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    loadDisputes();
  }

  Future<void> loadDisputes() async {
    try {
      isLoading(true);
      final result = await _disputeService.getDisputes();
      disputes.assignAll(result.data);
    } catch (_) {
    } finally {
      isLoading(false);
    }
  }

  Future<void> resolveDispute(
      String id, String resolution, String? payout) async {
    try {
      await _disputeService.resolveDispute(id,
          resolution: resolution, decision: payout ?? '');
      await loadDisputes();
      Get.snackbar('Success', 'Dispute resolved',
          backgroundColor: const Color(0xFF4CAF50), colorText: Colors.white);
    } catch (e) {
      Get.snackbar('Error', e.toString(),
          backgroundColor: Colors.red, colorText: Colors.white);
    }
  }

  Future<void> refresh() => loadDisputes();
}
