import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/services/services.dart';

class AdminDashboardController extends GetxController {
  late ColorNotifier notifier;

  final _adminService = Get.find<AdminService>();

  final dashboard = Rxn<AdminDashboard>();
  final isLoading = false.obs;
  final error = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadDashboard();
  }

  Future<void> loadDashboard() async {
    try {
      isLoading(true);
      error('');
      final result = await _adminService.getDashboard();
      dashboard.value = result;
    } catch (e) {
      error(e.toString());
    } finally {
      isLoading(false);
    }
  }

  Future<void> refresh() => loadDashboard();
}
