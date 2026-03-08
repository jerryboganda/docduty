import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/shared/routes/app_routes.dart';
import 'package:docduty/features/doctor/controllers/doctor_wallet_controller.dart';

class DoctorWalletView extends GetView<DoctorWalletController> {
  const DoctorWalletView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      body: SafeArea(
        child: Obx(() {
          if (controller.isLoading) {
            return const ShimmerLoading(itemCount: 4);
          }

          if (controller.error.isNotEmpty) {
            return ErrorRetryWidget(
              message: controller.error,
              onRetry: () => controller.loadWallet(),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              await controller.refresh();
            },
            color: const Color(0xFF0165FC),
            child: ListView(
              padding: EdgeInsets.all(Get.width / 25),
              children: [
                Text(
                  "Wallet",
                  style: TextStyle(
                    fontFamily: "Gilroy",
                    fontSize: Get.height / 35,
                    fontWeight: FontWeight.w600,
                    color: controller.notifier.text,
                  ),
                ),
                SizedBox(height: Get.height / 40),
                // Balance Card
                Container(
                  width: Get.width,
                  padding: EdgeInsets.all(Get.width / 15),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0165FC), Color(0xFF0141A8)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(Get.height / 35),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0165FC).withOpacity(0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Available Balance",
                        style: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 55,
                          color: Colors.white70,
                        ),
                      ),
                      SizedBox(height: Get.height / 100),
                      Text(
                        'PKR ${(controller.balance.value?.availablePkr ?? 0).toStringAsFixed(0)}',
                        style: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 25,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(height: Get.height / 50),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _balanceItem("Pending",
                              controller.balance.value?.heldPkr ?? 0),
                          _balanceItem("Total Earned",
                              controller.balance.value?.totalEarnedPkr ?? 0),
                        ],
                      ),
                    ],
                  ),
                ),
                SizedBox(height: Get.height / 40),
                // Payout Button
                SizedBox(
                  width: Get.width,
                  height: Get.height / 17,
                  child: ElevatedButton(
                    onPressed: () => Get.toNamed(Routes.DOCTOR_WALLET_PAYOUT),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0165FC),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(Get.height / 20),
                      ),
                      shadowColor: Colors.transparent,
                    ),
                    child: Text(
                      "Request Payout",
                      style: TextStyle(
                        fontFamily: "Gilroy",
                        color: Colors.white,
                        fontSize: Get.height / 50,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                SizedBox(height: Get.height / 30),
                // Transaction History
                SectionHeader(title: "Recent Transactions"),
                SizedBox(height: Get.height / 80),
                if (controller.transactions.isEmpty)
                  EmptyStateWidget(
                    title: 'No Transactions Yet',
                    subtitle: 'Your earnings will appear here',
                    icon: Icons.receipt_long_outlined,
                  )
                else
                  ...controller.transactions.map((tx) => _transactionTile(tx)),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _balanceItem(String label, double amount) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontFamily: "Gilroy",
            fontSize: Get.height / 65,
            color: Colors.white60,
          ),
        ),
        Text(
          'PKR ${amount.toStringAsFixed(0)}',
          style: TextStyle(
            fontFamily: "Gilroy",
            fontSize: Get.height / 50,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _transactionTile(dynamic tx) {
    final isCredit = tx.type == 'earning' || tx.type == 'refund';
    return Container(
      margin: EdgeInsets.only(bottom: Get.height / 100),
      padding: EdgeInsets.all(Get.width / 30),
      decoration: BoxDecoration(
        color: controller.notifier.cardBg,
        borderRadius: BorderRadius.circular(Get.height / 70),
        border: Border.all(color: controller.notifier.getfillborder),
        boxShadow: controller.notifier.shadowSm,
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(Get.width / 40),
            decoration: BoxDecoration(
              color: isCredit
                  ? const Color(0xFF4CAF50).withOpacity(0.1)
                  : Colors.orange.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isCredit ? Icons.arrow_downward : Icons.arrow_upward,
              color: isCredit ? const Color(0xFF4CAF50) : Colors.orange,
              size: Get.height / 45,
            ),
          ),
          SizedBox(width: Get.width / 30),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx.description ?? tx.type ?? 'Transaction',
                  style: TextStyle(
                    fontFamily: "Gilroy",
                    fontSize: Get.height / 55,
                    fontWeight: FontWeight.w500,
                    color: controller.notifier.text,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  tx.createdAt ?? '',
                  style: TextStyle(
                    fontFamily: "Gilroy",
                    fontSize: Get.height / 65,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
          PkrAmount(
            amount: tx.amount ?? 0,
            showSign: true,
            color: isCredit ? const Color(0xFF4CAF50) : Colors.orange,
            fontSize: Get.height / 50,
          ),
        ],
      ),
    );
  }
}
