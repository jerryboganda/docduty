import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/wallet_service.dart';
import 'package:docduty/core/models/models.dart';

class DoctorWalletController extends GetxController {
  late ColorNotifier notifier;
  final WalletService _walletService = Get.find<WalletService>();

  final Rx<WalletBalance?> balance = Rx<WalletBalance?>(null);
  final RxList<LedgerTransaction> transactions = <LedgerTransaction>[].obs;

  final _isLoading = true.obs;
  bool get isLoading => _isLoading.value;

  final _error = ''.obs;
  String get error => _error.value;

  @override
  void onInit() {
    super.onInit();
    loadWallet();
  }

  Future<void> loadWallet() async {
    _isLoading.value = true;
    _error.value = '';
    try {
      balance.value = await _walletService.getBalance();
      final result = await _walletService.getLedger(limit: 50);
      transactions.value = result.data;
    } catch (e) {
      _error.value = 'Failed to load wallet';
    } finally {
      _isLoading.value = false;
    }
  }

  Future<void> refresh() async => loadWallet();
}
