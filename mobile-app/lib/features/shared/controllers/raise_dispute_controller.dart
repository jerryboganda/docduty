import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/services.dart';

class RaiseDisputeController extends GetxController {
  late ColorNotifier notifier;

  final _disputeService = Get.find<DisputeService>();

  final reasonController = TextEditingController();
  final descriptionController = TextEditingController();
  final isLoading = false.obs;

  late String bookingId;

  final disputeReasons = [
    'Payment issue',
    'Shift cancellation',
    'No-show by facility',
    'Incorrect booking details',
    'Safety concern',
    'Other',
  ];

  final selectedReason = ''.obs;

  @override
  void onInit() {
    super.onInit();
    bookingId = Get.arguments?['bookingId'] ?? '';
  }

  void selectReason(String reason) {
    selectedReason.value = reason;
    reasonController.text = reason;
  }

  Future<void> submitDispute() async {
    if (selectedReason.value.isEmpty) {
      Get.snackbar('Error', 'Please select a reason',
          backgroundColor: Colors.red.shade100);
      return;
    }

    if (descriptionController.text.trim().isEmpty) {
      Get.snackbar('Error', 'Please describe the issue',
          backgroundColor: Colors.red.shade100);
      return;
    }

    try {
      isLoading.value = true;
      await _disputeService.raiseDispute(
        bookingId: bookingId,
        type: selectedReason.value,
        description: descriptionController.text.trim(),
      );
      Get.back();
      Get.snackbar(
          'Dispute Raised', 'Your dispute has been submitted for review',
          backgroundColor: Colors.green.shade100);
    } catch (e) {
      Get.snackbar('Error', e.toString(), backgroundColor: Colors.red.shade100);
    } finally {
      isLoading.value = false;
    }
  }

  @override
  void onClose() {
    reasonController.dispose();
    descriptionController.dispose();
    super.onClose();
  }
}
