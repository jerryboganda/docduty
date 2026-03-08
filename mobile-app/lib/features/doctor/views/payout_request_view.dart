import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/widgets/buttons.dart';
import 'package:docduty/widgets/my_text_field.dart';
import 'package:docduty/features/doctor/controllers/payout_request_controller.dart';

class PayoutRequestView extends GetView<PayoutRequestController> {
  const PayoutRequestView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        title: Text(
          'Request Payout',
          style: TextStyle(
            fontFamily: "Gilroy",
            color: controller.notifier.text,
            fontSize: Get.height / 40,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        leading: MyBackButtons(context),
      ),
      body: Obx(() {
        if (controller.isLoading.value && controller.payoutHistory.isEmpty) {
          return const ShimmerLoading(itemCount: 4);
        }

        return SingleChildScrollView(
          padding: EdgeInsets.all(Get.width / 25),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Available balance
              Container(
                width: Get.width,
                padding: EdgeInsets.all(Get.width / 18),
                decoration: BoxDecoration(
                  color: const Color(0xFF0165FC).withOpacity(0.08),
                  borderRadius: BorderRadius.circular(Get.height / 50),
                ),
                child: Column(
                  children: [
                    Text(
                      "Available for Payout",
                      style: TextStyle(
                        fontFamily: "Gilroy",
                        fontSize: Get.height / 55,
                        color: Colors.grey,
                      ),
                    ),
                    SizedBox(height: Get.height / 120),
                    Obx(() => Text(
                          'PKR ${controller.availableBalance.value.toStringAsFixed(0)}',
                          style: TextStyle(
                            fontFamily: "Gilroy",
                            fontSize: Get.height / 30,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0165FC),
                          ),
                        )),
                  ],
                ),
              ),
              SizedBox(height: Get.height / 30),
              MyTextField(
                titletext: "Amount (PKR)",
                type: TextInputType.number,
                hintText: "Enter payout amount",
                controller: controller.amountController,
              ),
              SizedBox(height: Get.height / 50),
              MyTextField(
                titletext: "Bank Name",
                type: TextInputType.text,
                hintText: "e.g. JazzCash, Easypaisa, HBL",
                controller: controller.bankNameController,
              ),
              SizedBox(height: Get.height / 50),
              MyTextField(
                titletext: "Account Number",
                type: TextInputType.number,
                hintText: "Enter account / wallet number",
                controller: controller.accountNumberController,
              ),
              SizedBox(height: Get.height / 50),
              MyTextField(
                titletext: "Account Title",
                type: TextInputType.text,
                hintText: "Name on account",
                controller: controller.accountTitleController,
              ),
              SizedBox(height: Get.height / 25),
              SizedBox(
                width: Get.width,
                height: Get.height / 17,
                child: AnimatedSubmitButton(
                  text: "Submit Payout Request",
                  isLoading: controller.isLoading.value,
                  onPressed: controller.submitPayout,
                  color: const Color(0xFF0165FC),
                ),
              ),
              SizedBox(height: Get.height / 25),
              // Payout History
              if (controller.payoutHistory.isNotEmpty) ...[
                SectionHeader(title: "Payout History"),
                SizedBox(height: Get.height / 80),
                ...controller.payoutHistory.map((p) => Container(
                      margin: EdgeInsets.only(bottom: Get.height / 100),
                      padding: EdgeInsets.all(Get.width / 30),
                      decoration: BoxDecoration(
                        color: controller.notifier.cardBg,
                        borderRadius: BorderRadius.circular(Get.height / 70),
                        border: Border.all(
                            color: controller.notifier.getfillborder),
                        boxShadow: controller.notifier.shadowSm,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'PKR ${(p.amount ?? 0).toStringAsFixed(0)}',
                                style: TextStyle(
                                  fontFamily: "Gilroy",
                                  fontSize: Get.height / 50,
                                  fontWeight: FontWeight.w600,
                                  color: controller.notifier.text,
                                ),
                              ),
                              Text(
                                p.createdAt ?? '',
                                style: TextStyle(
                                  fontFamily: "Gilroy",
                                  fontSize: Get.height / 65,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                          StatusBadge(
                              label: (p.status ?? 'pending').toUpperCase(),
                              color: p.isPending
                                  ? Colors.orange
                                  : p.isCompleted
                                      ? const Color(0xFF4CAF50)
                                      : Colors.red),
                        ],
                      ),
                    )),
              ],
            ],
          ),
        );
      }),
    );
  }
}
