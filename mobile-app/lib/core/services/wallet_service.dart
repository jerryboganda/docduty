import 'package:get/get.dart';
import 'package:docduty/core/network/api_client.dart';
import 'package:docduty/core/models/models.dart';

/// Wallet service — balances, ledger, payouts, deposits.
class WalletService extends GetxService {
  final ApiClient _api = Get.find<ApiClient>();

  Future<Wallet> getWallet() async {
    final res = await _api.get('/wallets/me');
    return Wallet.fromJson(res['wallet'] ?? res);
  }

  Future<WalletBalance> getBalance() async {
    final res = await _api.get('/wallets/balance');
    return WalletBalance.fromJson(res);
  }

  Future<PaginatedResponse<LedgerTransaction>> getLedger({
    int page = 1,
    int limit = 20,
    String? type,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (type != null) 'type': type,
    };
    final res = await _api.get('/wallets/ledger', queryParameters: params);
    return PaginatedResponse.fromJson(
        res, (json) => LedgerTransaction.fromJson(json), 'transactions');
  }

  Future<Payout> requestPayout(double amount, String bankDetails) async {
    final res = await _api.post('/wallets/payout', data: {
      'amount': amount,
      'bankDetails': bankDetails,
    });
    return Payout.fromJson(res['payout'] ?? res);
  }

  Future<void> deposit(double amount, String paymentMethod) async {
    await _api.post('/wallets/deposit', data: {
      'amount': amount,
      'paymentMethod': paymentMethod,
    });
  }

  Future<List<Payout>> getPayoutHistory() async {
    final res = await _api.get('/wallets/payouts');
    return ((res['payouts'] ?? []) as List)
        .map((j) => Payout.fromJson(j))
        .toList();
  }
}
