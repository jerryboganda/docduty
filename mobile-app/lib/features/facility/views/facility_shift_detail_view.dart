import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/widgets/buttons.dart';
import 'package:docduty/features/facility/controllers/facility_shift_detail_controller.dart';
import 'package:intl/intl.dart';

class FacilityShiftDetailView extends GetView<FacilityShiftDetailController> {
  const FacilityShiftDetailView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        title: Text('Shift Details',
            style: TextStyle(
              fontFamily: "Gilroy",
              color: controller.notifier.text,
              fontSize: Get.height / 40,
              fontWeight: FontWeight.w600,
            )),
        centerTitle: true,
        leading: MyBackButtons(context),
      ),
      body: Obx(() {
        if (controller.isLoading.value && controller.shift.value == null) {
          return const ShimmerLoading(itemCount: 4);
        }

        final shift = controller.shift.value;
        if (shift == null) {
          return ErrorRetryWidget(
            message: 'Shift not found',
            onRetry: () {
              final args = Get.arguments as Map<String, dynamic>? ?? {};
              controller.loadShiftDetail(args['shiftId']?.toString() ?? '');
            },
          );
        }

        return ListView(
          padding: EdgeInsets.all(Get.width / 25),
          children: [
            // Shift Info Card
            Container(
              padding: EdgeInsets.all(Get.width / 20),
              decoration: BoxDecoration(
                color: controller.notifier.cardBg,
                borderRadius: BorderRadius.circular(Get.height / 50),
                border: Border.all(color: controller.notifier.getfillborder),
                boxShadow: controller.notifier.shadowSm,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(shift.title,
                            style: TextStyle(
                              fontFamily: "Gilroy",
                              fontSize: Get.height / 38,
                              fontWeight: FontWeight.w600,
                              color: controller.notifier.text,
                            )),
                      ),
                      StatusBadge(
                          label: shift.status.toUpperCase(),
                          color: _statusColor(shift.status)),
                    ],
                  ),
                  SizedBox(height: Get.height / 60),
                  InfoRow(
                      label: 'Date',
                      value: DateFormat('EEEE, MMM dd, yyyy').format(
                          DateTime.tryParse(shift.startTime) ??
                              DateTime.now())),
                  InfoRow(
                      label: 'Time',
                      value:
                          '${DateFormat('hh:mm a').format(DateTime.tryParse(shift.startTime) ?? DateTime.now())} - ${DateFormat('hh:mm a').format(DateTime.tryParse(shift.endTime) ?? DateTime.now())}'),
                  InfoRow(label: 'Rate', value: 'PKR ${shift.totalPricePkr}'),
                  InfoRow(label: 'Urgency', value: shift.urgency.capitalize!),
                  if (shift.specialtyName != null)
                    InfoRow(label: 'Specialty', value: shift.specialtyName!),
                  if (shift.description != null &&
                      shift.description!.isNotEmpty) ...[
                    SizedBox(height: Get.height / 80),
                    Text(shift.description!,
                        style: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 55,
                          color: Colors.grey,
                        )),
                  ],
                ],
              ),
            ),
            SizedBox(height: Get.height / 40),
            // Offers Section
            SectionHeader(
                title: "Applicants & Offers (${controller.offers.length})"),
            SizedBox(height: Get.height / 80),
            if (controller.offers.isEmpty)
              const EmptyStateWidget(
                title: 'No Applications Yet',
                subtitle: 'Doctors will apply to your shift soon',
                icon: Icons.people_outline,
              )
            else
              ...controller.offers.map((offer) => Container(
                    margin: EdgeInsets.only(bottom: Get.height / 80),
                    padding: EdgeInsets.all(Get.width / 25),
                    decoration: BoxDecoration(
                      color: controller.notifier.cardBg,
                      borderRadius: BorderRadius.circular(Get.height / 60),
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
                              height: Get.height / 18,
                              width: Get.height / 18,
                              decoration: BoxDecoration(
                                color: controller.notifier.isDark
                                    ? const Color(0xff161616)
                                    : Colors.grey.shade200,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(Icons.person,
                                  color: Colors.grey, size: Get.height / 30),
                            ),
                            SizedBox(width: Get.width / 30),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(offer.doctorName ?? 'Doctor',
                                      style: TextStyle(
                                        fontFamily: "Gilroy",
                                        fontSize: Get.height / 50,
                                        fontWeight: FontWeight.w600,
                                        color: controller.notifier.text,
                                      )),
                                  Text(offer.type,
                                      style: TextStyle(
                                        fontFamily: "Gilroy",
                                        fontSize: Get.height / 60,
                                        color: Colors.grey,
                                      )),
                                ],
                              ),
                            ),
                            StatusBadge(
                                label: offer.status.toUpperCase(),
                                color: _statusColor(offer.status)),
                          ],
                        ),
                        if (offer.counterAmountPkr != null) ...[
                          SizedBox(height: Get.height / 100),
                          Text('Counter: PKR ${offer.counterAmountPkr}',
                              style: TextStyle(
                                fontFamily: "Gilroy",
                                fontSize: Get.height / 55,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF0165FC),
                              )),
                        ],
                        if (offer.status == 'pending') ...[
                          SizedBox(height: Get.height / 60),
                          Row(
                            children: [
                              Expanded(
                                child: SizedBox(
                                  height: Get.height / 22,
                                  child: ElevatedButton(
                                    onPressed: () =>
                                        controller.acceptOffer(offer.id),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF4CAF50),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(
                                            Get.height / 30),
                                      ),
                                      shadowColor: Colors.transparent,
                                    ),
                                    child: Text("Accept",
                                        style: TextStyle(
                                          fontFamily: "Gilroy",
                                          color: Colors.white,
                                          fontSize: Get.height / 55,
                                          fontWeight: FontWeight.w600,
                                        )),
                                  ),
                                ),
                              ),
                              SizedBox(width: Get.width / 25),
                              Expanded(
                                child: SizedBox(
                                  height: Get.height / 22,
                                  child: OutlinedButton(
                                    onPressed: () =>
                                        controller.rejectOffer(offer.id),
                                    style: OutlinedButton.styleFrom(
                                      side: const BorderSide(color: Colors.red),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(
                                            Get.height / 30),
                                      ),
                                    ),
                                    child: Text("Reject",
                                        style: TextStyle(
                                          fontFamily: "Gilroy",
                                          color: Colors.red,
                                          fontSize: Get.height / 55,
                                          fontWeight: FontWeight.w600,
                                        )),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  )),
            // Cancel shift
            if (shift.status == 'open') ...[
              SizedBox(height: Get.height / 30),
              SizedBox(
                width: Get.width,
                height: Get.height / 17,
                child: OutlinedButton(
                  onPressed: () => controller.cancelShift(),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.red),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(Get.height / 20),
                    ),
                  ),
                  child: Text("Cancel Shift",
                      style: TextStyle(
                        fontFamily: "Gilroy",
                        color: Colors.red,
                        fontSize: Get.height / 50,
                        fontWeight: FontWeight.w600,
                      )),
                ),
              ),
            ],
          ],
        );
      }),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'open':
        return Colors.orange;
      case 'confirmed':
      case 'active':
        return const Color(0xFF0165FC);
      case 'completed':
      case 'settled':
        return const Color(0xFF4CAF50);
      case 'cancelled':
      case 'no_show':
        return Colors.red;
      case 'pending':
        return Colors.amber;
      default:
        return Colors.grey;
    }
  }
}
