import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/shift_service.dart';
import 'package:docduty/core/services/auth_service.dart';
import 'package:docduty/core/services/notification_service.dart';
import 'package:docduty/core/models/models.dart';

class ShiftFeedController extends GetxController {
  late ColorNotifier notifier;
  final ShiftService _shiftService = Get.find<ShiftService>();
  final AuthService _auth = Get.find<AuthService>();
  final NotificationService _notif = Get.find<NotificationService>();

  final RxList<Shift> shifts = <Shift>[].obs;
  final _isLoading = true.obs;
  bool get isLoading => _isLoading.value;

  final _isRefreshing = false.obs;
  bool get isRefreshing => _isRefreshing.value;

  final _currentPage = 1.obs;
  final _hasMore = true.obs;
  bool get hasMore => _hasMore.value;

  final _error = ''.obs;
  String get error => _error.value;

  // Filters
  final _selectedUrgency = Rx<String?>(null);
  String? get selectedUrgency => _selectedUrgency.value;
  set selectedUrgency(String? v) {
    _selectedUrgency.value = v;
    refresh();
  }

  String get userName => _auth.currentUser.value?.fullName ?? 'Doctor';
  int get unreadNotifications => _notif.unreadCount.value;

  @override
  void onInit() {
    super.onInit();
    loadShifts();
    _notif.fetchNotifications();
  }

  Future<void> loadShifts() async {
    _isLoading.value = true;
    _error.value = '';
    _currentPage.value = 1;

    try {
      final result = await _shiftService.getAvailableShifts(
        page: 1,
        urgency: selectedUrgency,
      );
      shifts.value = result.data;
      _hasMore.value = result.data.length >= 20;
    } catch (e) {
      _error.value = 'Failed to load shifts';
    } finally {
      _isLoading.value = false;
    }
  }

  Future<void> loadMore() async {
    if (!hasMore || isLoading) return;

    _currentPage.value++;
    try {
      final result = await _shiftService.getAvailableShifts(
        page: _currentPage.value,
        urgency: selectedUrgency,
      );
      shifts.addAll(result.data);
      _hasMore.value = result.data.length >= 20;
    } catch (_) {
      _currentPage.value--;
    }
  }

  Future<void> refresh() async {
    _isRefreshing.value = true;
    await loadShifts();
    _isRefreshing.value = false;
  }
}
