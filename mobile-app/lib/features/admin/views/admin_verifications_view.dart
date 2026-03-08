import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/features/admin/controllers/admin_verifications_controller.dart';

class AdminVerificationsView extends GetView<AdminVerificationsController> {
  const AdminVerificationsView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        automaticallyImplyLeading: false,
        title: Text('Verifications',
            style: TextStyle(
                fontFamily: "Gilroy",
                color: controller.notifier.text,
                fontSize: Get.height / 40,
                fontWeight: FontWeight.w600)),
        centerTitle: true,
      ),
      body: Obx(() {
        if (controller.isLoading.value && controller.pendingList.isEmpty) {
          return const ShimmerLoading(itemCount: 5);
        }

        if (controller.pendingList.isEmpty) {
          return const EmptyStateWidget(
              title: 'All Clear',
              subtitle: 'No pending verifications',
              icon: Icons.check_circle_outline);
        }

        return RefreshIndicator(
          onRefresh: () async {
            HapticFeedback.mediumImpact();
            await controller.refresh();
          },
          color: const Color(0xFF0165FC),
          child: ListView.builder(
            padding: EdgeInsets.all(Get.width / 25),
            itemCount: controller.pendingList.length,
            itemBuilder: (context, index) {
              final user = controller.pendingList[index];
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
                        children: [
                          Container(
                            height: Get.height / 16,
                            width: Get.height / 16,
                            decoration: BoxDecoration(
                              color: controller.notifier.isDark
                                  ? const Color(0xff161616)
                                  : Colors.grey.shade200,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.person,
                                color: Colors.grey, size: Get.height / 30),
                          ),
                          SizedBox(width: Get.width / 25),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(user.fullName,
                                    style: TextStyle(
                                        fontFamily: "Gilroy",
                                        fontSize: Get.height / 50,
                                        fontWeight: FontWeight.w600,
                                        color: controller.notifier.text)),
                                Text(user.role,
                                    style: TextStyle(
                                        fontFamily: "Gilroy",
                                        fontSize: Get.height / 60,
                                        color: const Color(0xFF0165FC))),
                                if (user.phone.isNotEmpty)
                                  Text(user.phone,
                                      style: TextStyle(
                                          fontFamily: "Gilroy",
                                          fontSize: Get.height / 65,
                                          color: Colors.grey)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (user.doctorProfile?.pmdcLicense != null ||
                          user.facilityAccount?.registrationNumber != null) ...[
                        SizedBox(height: Get.height / 80),
                        Text(
                            'Reg: ${user.doctorProfile?.pmdcLicense ?? user.facilityAccount?.registrationNumber ?? ''}',
                            style: TextStyle(
                                fontFamily: "Gilroy",
                                fontSize: Get.height / 60,
                                color: Colors.grey)),
                      ],
                      SizedBox(height: Get.height / 60),
                      Row(
                        children: [
                          Expanded(
                            child: SizedBox(
                              height: Get.height / 22,
                              child: ElevatedButton(
                                onPressed: () => controller.approve(user.id),
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
                                onPressed: () =>
                                    _showRejectDialog(context, user.id),
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

  void _showRejectDialog(BuildContext context, String userId) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: controller.notifier.getBgColor,
        title: Text('Rejection Reason',
            style: TextStyle(
                fontFamily: "Gilroy", color: controller.notifier.text)),
        content: TextField(
          controller: reasonController,
          style:
              TextStyle(fontFamily: "Gilroy", color: controller.notifier.text),
          decoration: const InputDecoration(hintText: 'Enter reason...'),
          maxLines: 3,
        ),
        actions: [
          TextButton(
              onPressed: () => Get.back(),
              child:
                  const Text('Cancel', style: TextStyle(fontFamily: "Gilroy"))),
          TextButton(
            onPressed: () {
              Get.back();
              controller.reject(userId, reasonController.text.trim());
            },
            child: const Text('Reject',
                style: TextStyle(fontFamily: "Gilroy", color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
