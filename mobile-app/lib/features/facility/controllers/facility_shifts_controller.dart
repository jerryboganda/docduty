import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/services/services.dart';
import 'package:docduty/shared/routes/app_routes.dart';

class FacilityShiftsController extends GetxController
    with GetSingleTickerProviderStateMixin {
  late ColorNotifier notifier;
  late TabController tabController;

  final _shiftService = Get.find<ShiftService>();

  final myShifts = <Shift>[].obs;
  final isLoading = false.obs;
  final selectedStatus = 'open'.obs;

  final statusTabs = [
    'open',
    'filled',
    'in_progress',
    'completed',
    'cancelled'
  ];
  final statusLabels = [
    'Open',
    'Filled',
    'In Progress',
    'Completed',
    'Cancelled'
  ];

  @override
  void onInit() {
    super.onInit();
    tabController = TabController(length: statusTabs.length, vsync: this);
    tabController.addListener(() {
      if (!tabController.indexIsChanging) {
        selectedStatus.value = statusTabs[tabController.index];
        loadShifts();
      }
    });
    loadShifts();
  }

  Future<void> loadShifts() async {
    try {
      isLoading(true);
      final result =
          await _shiftService.getMyShifts(status: selectedStatus.value);
      myShifts.assignAll(result.data);
    } catch (_) {
    } finally {
      isLoading(false);
    }
  }

  Future<void> refresh() => loadShifts();

  void goToCreateShift() => Get.toNamed(Routes.FACILITY_CREATE_SHIFT);

  void goToShiftDetail(String id) =>
      Get.toNamed(Routes.FACILITY_SHIFT_DETAIL, arguments: {'shiftId': id});

  @override
  void onClose() {
    tabController.dispose();
    super.onClose();
  }
}
