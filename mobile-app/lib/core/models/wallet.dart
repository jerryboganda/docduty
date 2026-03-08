/// Wallet, LedgerTransaction, Payout models.
/// Maps to wallets, ledger_transactions, payouts tables.

class Wallet {
  final String id;
  final String userId;
  final double balancePkr;
  final double heldPkr;
  final double totalEarnedPkr;
  final double totalSpentPkr;

  Wallet({
    required this.id,
    required this.userId,
    required this.balancePkr,
    required this.heldPkr,
    required this.totalEarnedPkr,
    required this.totalSpentPkr,
  });

  double get availablePkr => balancePkr - heldPkr;

  factory Wallet.fromJson(Map<String, dynamic> json) => Wallet(
        id: json['id'] ?? '',
        userId: json['user_id'] ?? json['userId'] ?? '',
        balancePkr: _toDouble(json['balance_pkr'] ?? json['balancePkr']) ?? 0,
        heldPkr: _toDouble(json['held_pkr'] ?? json['heldPkr']) ?? 0,
        totalEarnedPkr:
            _toDouble(json['total_earned_pkr'] ?? json['totalEarnedPkr']) ?? 0,
        totalSpentPkr:
            _toDouble(json['total_spent_pkr'] ?? json['totalSpentPkr']) ?? 0,
      );

  static double? _toDouble(dynamic val) {
    if (val == null) return null;
    if (val is double) return val;
    if (val is int) return val.toDouble();
    if (val is String) return double.tryParse(val);
    return null;
  }
}

class WalletBalance {
  final double balancePkr;
  final double heldPkr;
  final double availablePkr;
  final double totalEarnedPkr;
  final double totalSpentPkr;

  WalletBalance({
    required this.balancePkr,
    required this.heldPkr,
    required this.availablePkr,
    required this.totalEarnedPkr,
    required this.totalSpentPkr,
  });

  factory WalletBalance.fromJson(Map<String, dynamic> json) => WalletBalance(
        balancePkr:
            Wallet._toDouble(json['balancePkr'] ?? json['balance_pkr']) ?? 0,
        heldPkr: Wallet._toDouble(json['heldPkr'] ?? json['held_pkr']) ?? 0,
        availablePkr:
            Wallet._toDouble(json['availablePkr'] ?? json['available_pkr']) ??
                0,
        totalEarnedPkr: Wallet._toDouble(
                json['totalEarnedPkr'] ?? json['total_earned_pkr']) ??
            0,
        totalSpentPkr: Wallet._toDouble(
                json['totalSpentPkr'] ?? json['total_spent_pkr']) ??
            0,
      );
}

class LedgerTransaction {
  final String id;
  final String walletId;
  final String? bookingId;
  final String type;
  final double amountPkr;
  final String direction;
  final String? description;
  final String? referenceId;
  final String? shiftTitle;
  final String? createdAt;

  LedgerTransaction({
    required this.id,
    required this.walletId,
    this.bookingId,
    required this.type,
    required this.amountPkr,
    required this.direction,
    this.description,
    this.referenceId,
    this.shiftTitle,
    this.createdAt,
  });

  factory LedgerTransaction.fromJson(Map<String, dynamic> json) =>
      LedgerTransaction(
        id: json['id'] ?? '',
        walletId: json['wallet_id'] ?? json['walletId'] ?? '',
        bookingId: json['booking_id'] ?? json['bookingId'],
        type: json['type'] ?? '',
        amountPkr:
            Wallet._toDouble(json['amount_pkr'] ?? json['amountPkr']) ?? 0,
        direction: json['direction'] ?? '',
        description: json['description'],
        referenceId: json['reference_id'] ?? json['referenceId'],
        shiftTitle: json['shift_title'] ?? json['shiftTitle'],
        createdAt: json['created_at'] ?? json['createdAt'],
      );

  bool get isCredit => direction == 'credit';
  bool get isDebit => direction == 'debit';
}

class Payout {
  final String id;
  final String walletId;
  final double amountPkr;
  final String status;
  final String? paymentMethod;
  final String? paymentReference;
  final String? requestedAt;
  final String? processedAt;
  final String? createdAt;

  Payout({
    required this.id,
    required this.walletId,
    required this.amountPkr,
    required this.status,
    this.paymentMethod,
    this.paymentReference,
    this.requestedAt,
    this.processedAt,
    this.createdAt,
  });

  factory Payout.fromJson(Map<String, dynamic> json) => Payout(
        id: json['id'] ?? '',
        walletId: json['wallet_id'] ?? json['walletId'] ?? '',
        amountPkr:
            Wallet._toDouble(json['amount_pkr'] ?? json['amountPkr']) ?? 0,
        status: json['status'] ?? 'pending',
        paymentMethod: json['payment_method'] ?? json['paymentMethod'],
        paymentReference: json['payment_reference'] ?? json['paymentReference'],
        requestedAt: json['requested_at'] ?? json['requestedAt'],
        processedAt: json['processed_at'] ?? json['processedAt'],
        createdAt: json['created_at'] ?? json['createdAt'],
      );

  bool get isPending => status == 'pending';
  bool get isProcessing => status == 'processing';
  bool get isCompleted => status == 'completed';
  bool get isFailed => status == 'failed';
}
