import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/services.dart';

class PayoutRequestController extends GetxController {
  late ColorNotifier notifier;

  final _walletService = Get.find<WalletService>();

  final amountController = TextEditingController();
  final bankNameController = TextEditingController();
  final accountNumberController = TextEditingController();
  final accountTitleController = TextEditingController();

  final isLoading = false.obs;
  final availableBalance = 0.0.obs;
  final payoutHistory = <dynamic>[].obs;

  @override
  void onInit() {
    super.onInit();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      isLoading(true);
      final balance = await _walletService.getBalance();
      availableBalance.value = balance.availablePkr;
      final history = await _walletService.getPayoutHistory();
      payoutHistory.assignAll(history);
    } catch (_) {
    } finally {
      isLoading(false);
    }
  }

  Future<void> submitPayout() async {
    final amount = double.tryParse(amountController.text.trim());
    if (amount == null || amount <= 0) {
      Get.snackbar('Error', 'Enter a valid amount',
          backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }
    if (amount > availableBalance.value) {
      Get.snackbar('Error', 'Amount exceeds available balance',
          backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }
    if (bankNameController.text.trim().isEmpty ||
        accountNumberController.text.trim().isEmpty ||
        accountTitleController.text.trim().isEmpty) {
      Get.snackbar('Error', 'Please fill all bank details',
          backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    try {
      isLoading(true);
      final bankDetails =
          '${bankNameController.text.trim()} / ${accountNumberController.text.trim()} / ${accountTitleController.text.trim()}';
      await _walletService.requestPayout(amount, bankDetails);
      Get.snackbar('Success', 'Payout request submitted',
          backgroundColor: const Color(0xFF4CAF50), colorText: Colors.white);
      amountController.clear();
      await _loadData();
    } catch (e) {
      Get.snackbar('Error', e.toString(),
          backgroundColor: Colors.red, colorText: Colors.white);
    } finally {
      isLoading(false);
    }
  }

  @override
  void onClose() {
    amountController.dispose();
    bankNameController.dispose();
    accountNumberController.dispose();
    accountTitleController.dispose();
    super.onClose();
  }
}
