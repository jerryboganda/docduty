import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/features/admin/controllers/admin_payouts_controller.dart';

class AdminPayoutsView extends GetView<AdminPayoutsController> {
  const AdminPayoutsView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        automaticallyImplyLeading: false,
        title: Text('Pending Payouts',
            style: TextStyle(
                fontFamily: "Gilroy",
                color: controller.notifier.text,
                fontSize: Get.height / 40,
                fontWeight: FontWeight.w600)),
        centerTitle: true,
      ),
      body: Obx(() {
        if (controller.isLoading.value && controller.pendingPayouts.isEmpty) {
          return const ShimmerLoading(itemCount: 4);
        }

        if (controller.pendingPayouts.isEmpty) {
          return const EmptyStateWidget(
              title: 'No Pending Payouts',
              subtitle: 'All payouts processed',
              icon: Icons.payments_outlined);
        }

        return RefreshIndicator(
          onRefresh: () async {
            HapticFeedback.mediumImpact();
            await controller.refresh();
          },
          color: const Color(0xFF0165FC),
          child: ListView.builder(
            padding: EdgeInsets.all(Get.width / 25),
            itemCount: controller.pendingPayouts.length,
            itemBuilder: (context, index) {
              final payout = controller.pendingPayouts[index];
              return AnimatedListItem(
                index: index,
                child: Container(
                  margin: EdgeInsets.only(bottom: Get.height / 70),
                  padding: EdgeInsets.all(Get.width / 25),
                  decoration: BoxDecoration(
                    color: controller.notifier.cardBg,
                    borderRadius: BorderRadius.circular(Get.height / 50),
                    border:
                        Border.all(color: controller.notifier.getfillborder),
                    boxShadow: controller.notifier.shadowSm,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Payout #${payout.id}',
                              style: TextStyle(
                                  fontFamily: "Gilroy",
                                  fontSize: Get.height / 50,
                                  fontWeight: FontWeight.w600,
                                  color: controller.notifier.text)),
                          PkrAmount(
                              amount: payout.amountPkr,
                              fontSize: Get.height / 45,
                              color: const Color(0xFF0165FC)),
                        ],
                      ),
                      SizedBox(height: Get.height / 100),
                      InfoRow(
                          label: 'Method', value: payout.paymentMethod ?? ''),
                      InfoRow(
                          label: 'Reference',
                          value: payout.paymentReference ?? ''),
                      InfoRow(
                          label: 'Requested', value: payout.requestedAt ?? ''),
                      InfoRow(
                          label: 'Status', value: payout.status.toUpperCase()),
                      SizedBox(height: Get.height / 60),
                      Row(
                        children: [
                          Expanded(
                            child: SizedBox(
                              height: Get.height / 22,
                              child: ElevatedButton(
                                onPressed: () =>
                                    controller.approvePayout(payout.id),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF4CAF50),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(
                                          Get.height / 30)),
                                  shadowColor: Colors.transparent,
                                ),
                                child: Text("Approve",
                                    style: TextStyle(
                                        fontFamily: "Gilroy",
                                        color: Colors.white,
                                        fontSize: Get.height / 55,
                                        fontWeight: FontWeight.w600)),
                              ),
                            ),
                          ),
                          SizedBox(width: Get.width / 25),
                          Expanded(
                            child: SizedBox(
                              height: Get.height / 22,
                              child: OutlinedButton(
                                onPressed: () {
                                  final reasonCtrl = TextEditingController();
                                  showDialog(
                                    context: context,
                                    builder: (_) => AlertDialog(
                                      backgroundColor:
                                          controller.notifier.getBgColor,
                                      title: Text('Reject Reason',
                                          style: TextStyle(
                                              fontFamily: "Gilroy",
                                              color: controller.notifier.text)),
                                      content: TextField(
                                          controller: reasonCtrl,
                                          style: TextStyle(
                                              fontFamily: "Gilroy",
                                              color: controller.notifier.text)),
                                      actions: [
                                        TextButton(
                                            onPressed: () => Get.back(),
                                            child: const Text('Cancel')),
                                        TextButton(
                                          onPressed: () {
                                            Get.back();
                                            controller.rejectPayout(payout.id,
                                                reasonCtrl.text.trim());
                                          },
                                          child: const Text('Reject',
                                              style:
                                                  TextStyle(color: Colors.red)),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Colors.red),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(
                                          Get.height / 30)),
                                ),
                                child: Text("Reject",
                                    style: TextStyle(
                                        fontFamily: "Gilroy",
                                        color: Colors.red,
                                        fontSize: Get.height / 55,
                                        fontWeight: FontWeight.w600)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      }),
    );
  }
}
