import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/services.dart';
import 'package:docduty/shared/routes/app_routes.dart';

class FacilityDashboardController extends GetxController {
  late ColorNotifier notifier;

  final _facilityService = Get.find<FacilityService>();
  final _authService = Get.find<AuthService>();

  final stats = <String, dynamic>{}.obs;
  final isLoading = false.obs;
  final error = ''.obs;

  String get facilityName =>
      _authService.currentUser.value?.facilityAccount?.name ?? 'My Facility';

  @override
  void onInit() {
    super.onInit();
    loadStats();
  }

  Future<void> loadStats() async {
    try {
      isLoading(true);
      error('');
      final result = await _facilityService.getDashboardStats();
      stats.assignAll(result);
    } catch (e) {
      error(e.toString());
    } finally {
      isLoading(false);
    }
  }

  Future<void> refresh() => loadStats();

  void goToShifts() => Get.toNamed(Routes.FACILITY_CREATE_SHIFT);
  void goToLocations() => Get.toNamed(Routes.FACILITY_LOCATIONS);
  void goToQrCodes() => Get.toNamed(Routes.FACILITY_QR_CODE);
}
