import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/booking_service.dart';
import 'package:docduty/core/models/models.dart';

class DoctorBookingsController extends GetxController {
  late ColorNotifier notifier;
  final BookingService _bookingService = Get.find<BookingService>();

  final RxList<Booking> bookings = <Booking>[].obs;
  final _isLoading = true.obs;
  bool get isLoading => _isLoading.value;

  final _error = ''.obs;
  String get error => _error.value;

  final _selectedTab = 0.obs;
  int get selectedTab => _selectedTab.value;
  set selectedTab(int v) {
    _selectedTab.value = v;
    loadBookings();
  }

  final tabs = ['upcoming', 'active', 'completed', 'cancelled'];
  final tabLabels = ['Upcoming', 'Active', 'Completed', 'Cancelled'];

  String get currentStatus => tabs[selectedTab];

  @override
  void onInit() {
    super.onInit();
    loadBookings();
  }

  Future<void> loadBookings() async {
    _isLoading.value = true;
    _error.value = '';
    try {
      final result = await _bookingService.getBookings(status: currentStatus);
      bookings.value = result.data;
    } catch (e) {
      _error.value = 'Failed to load bookings';
    } finally {
      _isLoading.value = false;
    }
  }

  Future<void> refresh() async {
    await loadBookings();
  }
}
