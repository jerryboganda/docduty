import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/widgets/buttons.dart';
import 'package:docduty/features/shared/controllers/raise_dispute_controller.dart';

class RaiseDisputeView extends GetView<RaiseDisputeController> {
  const RaiseDisputeView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        title: Text('Raise Dispute',
            style: TextStyle(
                fontFamily: "Gilroy",
                color: controller.notifier.text,
                fontSize: Get.height / 40,
                fontWeight: FontWeight.w600)),
        centerTitle: true,
        leading: MyBackButtons(context),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(Get.width / 25),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Info card
            Container(
              padding: EdgeInsets.all(Get.width / 25),
              decoration: BoxDecoration(
                color: const Color(0xFF0165FC).withOpacity(0.08),
                borderRadius: BorderRadius.circular(Get.height / 60),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline,
                      color: const Color(0xFF0165FC), size: Get.height / 35),
                  SizedBox(width: Get.width / 30),
                  Expanded(
                    child: Text(
                        "Disputes are reviewed by our team within 24-48 hours. Please provide as much detail as possible.",
                        style: TextStyle(
                            fontFamily: "Gilroy",
                            color: const Color(0xFF0165FC),
                            fontSize: Get.height / 60)),
                  ),
                ],
              ),
            ),

            SizedBox(height: Get.height / 30),

            // Reason selection
            Text("Select Reason",
                style: TextStyle(
                    fontFamily: "Gilroy",
                    color: controller.notifier.text,
                    fontSize: Get.height / 48,
                    fontWeight: FontWeight.w600)),
            SizedBox(height: Get.height / 60),

            Obx(() => Wrap(
                  spacing: Get.width / 40,
                  runSpacing: Get.height / 80,
                  children: controller.disputeReasons.map((reason) {
                    final selected = controller.selectedReason.value == reason;
                    return PressableScale(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        controller.selectReason(reason);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        padding: EdgeInsets.symmetric(
                            horizontal: Get.width / 25,
                            vertical: Get.height / 70),
                        decoration: BoxDecoration(
                          color: selected
                              ? const Color(0xFF0165FC)
                              : controller.notifier.cardBg,
                          borderRadius: BorderRadius.circular(Get.height / 30),
                          border: Border.all(
                              color: selected
                                  ? const Color(0xFF0165FC)
                                  : controller.notifier.getfillborder),
                        ),
                        child: Text(reason,
                            style: TextStyle(
                                fontFamily: "Gilroy",
                                color: selected
                                    ? Colors.white
                                    : controller.notifier.text,
                                fontSize: Get.height / 58,
                                fontWeight: selected
                                    ? FontWeight.w600
                                    : FontWeight.w400)),
                      ),
                    );
                  }).toList(),
                )),

            SizedBox(height: Get.height / 30),

            // Description
            Text("Describe the Issue",
                style: TextStyle(
                    fontFamily: "Gilroy",
                    color: controller.notifier.text,
                    fontSize: Get.height / 48,
                    fontWeight: FontWeight.w600)),
            SizedBox(height: Get.height / 60),

            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(Get.height / 50),
                border: Border.all(color: controller.notifier.getfillborder),
              ),
              child: TextField(
                controller: controller.descriptionController,
                maxLines: 6,
                style: TextStyle(
                    fontFamily: "Gilroy",
                    color: controller.notifier.text,
                    fontSize: Get.height / 55),
                decoration: InputDecoration(
                  contentPadding: EdgeInsets.all(Get.width / 25),
                  border: InputBorder.none,
                  hintText: "Please provide details about the issue...",
                  hintStyle: TextStyle(
                      fontFamily: "Gilroy",
                      color: controller.notifier.subtitleText),
                ),
              ),
            ),

            SizedBox(height: Get.height / 15),

            // Submit button
            Obx(() => SizedBox(
                  width: Get.width,
                  height: Get.height / 17,
                  child: AnimatedSubmitButton(
                    text: "Submit Dispute",
                    isLoading: controller.isLoading.value,
                    onPressed: controller.submitDispute,
                    color: const Color(0xFF0165FC),
                  ),
                )),
          ],
        ),
      ),
    );
  }
}
