import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/services/services.dart';
import 'package:docduty/shared/routes/app_routes.dart';

class FacilityBookingsController extends GetxController
    with GetSingleTickerProviderStateMixin {
  late ColorNotifier notifier;
  late TabController tabController;

  final _bookingService = Get.find<BookingService>();

  final bookings = <Booking>[].obs;
  final isLoading = false.obs;
  final selectedStatus = 'confirmed'.obs;

  final statusTabs = [
    'confirmed',
    'active',
    'completed',
    'cancelled',
    'disputed'
  ];
  final statusLabels = [
    'Upcoming',
    'Active',
    'Completed',
    'Cancelled',
    'Disputed'
  ];

  @override
  void onInit() {
    super.onInit();
    tabController = TabController(length: statusTabs.length, vsync: this);
    tabController.addListener(() {
      if (!tabController.indexIsChanging) {
        selectedStatus.value = statusTabs[tabController.index];
        loadBookings();
      }
    });
    loadBookings();
  }

  Future<void> loadBookings() async {
    try {
      isLoading(true);
      final result =
          await _bookingService.getBookings(status: selectedStatus.value);
      bookings.assignAll(result.data);
    } catch (_) {
    } finally {
      isLoading(false);
    }
  }

  Future<void> refresh() => loadBookings();

  void goToDetail(String id) =>
      Get.toNamed(Routes.FACILITY_BOOKING_DETAIL, arguments: {'bookingId': id});

  @override
  void onClose() {
    tabController.dispose();
    super.onClose();
  }
}
