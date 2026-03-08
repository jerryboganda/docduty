import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/features/admin/controllers/admin_disputes_controller.dart';

class AdminDisputesView extends GetView<AdminDisputesController> {
  const AdminDisputesView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        automaticallyImplyLeading: false,
        title: Text('Disputes',
            style: TextStyle(
                fontFamily: "Gilroy",
                color: controller.notifier.text,
                fontSize: Get.height / 40,
                fontWeight: FontWeight.w600)),
        centerTitle: true,
      ),
      body: Obx(() {
        if (controller.isLoading.value && controller.disputes.isEmpty) {
          return const ShimmerLoading(itemCount: 4);
        }

        if (controller.disputes.isEmpty) {
          return const EmptyStateWidget(
              title: 'No Disputes',
              subtitle: 'All clear!',
              icon: Icons.gavel_outlined);
        }

        return RefreshIndicator(
          onRefresh: () async {
            HapticFeedback.mediumImpact();
            await controller.refresh();
          },
          color: const Color(0xFF0165FC),
          child: ListView.builder(
            padding: EdgeInsets.all(Get.width / 25),
            itemCount: controller.disputes.length,
            itemBuilder: (context, index) {
              final dispute = controller.disputes[index];
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
                          Expanded(
                            child: Text('Dispute #${dispute.id}',
                                style: TextStyle(
                                    fontFamily: "Gilroy",
                                    fontSize: Get.height / 50,
                                    fontWeight: FontWeight.w600,
                                    color: controller.notifier.text)),
                          ),
                          StatusBadge(
                              label: dispute.status.toUpperCase(),
                              color: _disputeStatusColor(dispute.status)),
                        ],
                      ),
                      SizedBox(height: Get.height / 100),
                      InfoRow(label: 'Type', value: dispute.type),
                      InfoRow(label: 'Booking', value: '#${dispute.bookingId}'),
                      InfoRow(
                          label: 'Raised By',
                          value: dispute.raisedByName ?? 'User'),
                      if (dispute.description != null &&
                          dispute.description!.isNotEmpty) ...[
                        SizedBox(height: Get.height / 100),
                        Text(dispute.description!,
                            style: TextStyle(
                                fontFamily: "Gilroy",
                                fontSize: Get.height / 60,
                                color: Colors.grey),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis),
                      ],
                      if (dispute.status == 'open' ||
                          dispute.status == 'under_review') ...[
                        SizedBox(height: Get.height / 60),
                        SizedBox(
                          width: Get.width,
                          height: Get.height / 22,
                          child: ElevatedButton(
                            onPressed: () =>
                                _showResolveDialog(context, dispute.id),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0165FC),
                              shape: RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(Get.height / 30)),
                              shadowColor: Colors.transparent,
                            ),
                            child: Text("Resolve",
                                style: TextStyle(
                                    fontFamily: "Gilroy",
                                    color: Colors.white,
                                    fontSize: Get.height / 55,
                                    fontWeight: FontWeight.w600)),
                          ),
                        ),
                      ],
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

  Color _disputeStatusColor(String status) {
    switch (status) {
      case 'open':
        return Colors.orange;
      case 'under_review':
        return const Color(0xFF0165FC);
      case 'resolved':
        return const Color(0xFF4CAF50);
      case 'dismissed':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  void _showResolveDialog(BuildContext context, String disputeId) {
    final resolutionCtrl = TextEditingController();
    String payoutDecision = 'full_to_doctor';

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          backgroundColor: controller.notifier.getBgColor,
          title: Text('Resolve Dispute',
              style: TextStyle(
                  fontFamily: "Gilroy", color: controller.notifier.text)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: resolutionCtrl,
                style: TextStyle(
                    fontFamily: "Gilroy", color: controller.notifier.text),
                decoration:
                    const InputDecoration(hintText: 'Resolution notes...'),
                maxLines: 3,
              ),
              SizedBox(height: Get.height / 60),
              DropdownButton<String>(
                value: payoutDecision,
                isExpanded: true,
                dropdownColor: controller.notifier.getBgColor,
                items: const [
                  DropdownMenuItem(
                      value: 'full_to_doctor',
                      child: Text('Full to Doctor',
                          style: TextStyle(fontFamily: "Gilroy"))),
                  DropdownMenuItem(
                      value: 'full_to_facility',
                      child: Text('Full to Facility',
                          style: TextStyle(fontFamily: "Gilroy"))),
                  DropdownMenuItem(
                      value: 'split',
                      child: Text('Split 50/50',
                          style: TextStyle(fontFamily: "Gilroy"))),
                  DropdownMenuItem(
                      value: 'no_payout',
                      child: Text('No Payout',
                          style: TextStyle(fontFamily: "Gilroy"))),
                ],
                onChanged: (v) =>
                    setState(() => payoutDecision = v ?? payoutDecision),
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Get.back(),
                child: const Text('Cancel',
                    style: TextStyle(fontFamily: "Gilroy"))),
            TextButton(
              onPressed: () {
                Get.back();
                controller.resolveDispute(
                    disputeId, resolutionCtrl.text.trim(), payoutDecision);
              },
              child: const Text('Resolve',
                  style: TextStyle(
                      fontFamily: "Gilroy",
                      color: Color(0xFF0165FC),
                      fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }
}
