import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/services/services.dart';

class FacilityShiftDetailController extends GetxController {
  late ColorNotifier notifier;

  final _shiftService = Get.find<ShiftService>();

  final shift = Rxn<Shift>();
  final offers = <Offer>[].obs;
  final isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    final args = Get.arguments as Map<String, dynamic>? ?? {};
    final shiftId = args['shiftId']?.toString() ?? '';
    if (shiftId.isNotEmpty) loadShiftDetail(shiftId);
  }

  Future<void> loadShiftDetail(String id) async {
    try {
      isLoading(true);
      final result = await _shiftService.getShiftDetail(id);
      shift.value = result;
      final offerList = await _shiftService.getShiftOffers(id);
      offers.assignAll(offerList);
    } catch (_) {
    } finally {
      isLoading(false);
    }
  }

  Future<void> acceptOffer(String offerId) async {
    try {
      final shiftId = shift.value!.id;
      await _shiftService.acceptOffer(offerId);
      Get.snackbar('Success', 'Offer accepted!',
          backgroundColor: const Color(0xFF4CAF50), colorText: Colors.white);
      await loadShiftDetail(shiftId);
    } catch (e) {
      Get.snackbar('Error', e.toString(),
          backgroundColor: Colors.red, colorText: Colors.white);
    }
  }

  Future<void> rejectOffer(String offerId) async {
    try {
      await _shiftService.rejectOffer(offerId);
      offers.removeWhere((o) => o.id == offerId);
      Get.snackbar('Done', 'Offer rejected');
    } catch (e) {
      Get.snackbar('Error', e.toString(),
          backgroundColor: Colors.red, colorText: Colors.white);
    }
  }

  Future<void> cancelShift() async {
    try {
      await _shiftService.cancelShift(shift.value!.id, 'Cancelled by facility');
      Get.snackbar('Success', 'Shift cancelled',
          backgroundColor: Colors.orange, colorText: Colors.white);
      Get.back();
    } catch (e) {
      Get.snackbar('Error', e.toString(),
          backgroundColor: Colors.red, colorText: Colors.white);
    }
  }
}
