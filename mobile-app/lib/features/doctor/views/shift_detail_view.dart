import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:intl/intl.dart';
import 'package:docduty/features/doctor/controllers/shift_detail_controller.dart';

class ShiftDetailView extends GetView<ShiftDetailController> {
  const ShiftDetailView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: controller.notifier.text),
          onPressed: () => Get.back(),
        ),
        title: Text(
          "Shift Details",
          style: TextStyle(
            fontFamily: "Gilroy",
            color: controller.notifier.text,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: Obx(() {
        if (controller.isLoading) {
          return const ShimmerLoading(itemCount: 4);
        }

        if (controller.error.isNotEmpty) {
          return ErrorRetryWidget(
            message: controller.error,
            onRetry: () => controller.loadShift(),
          );
        }

        final shift = controller.shift.value;
        if (shift == null) {
          return const EmptyStateWidget(
            title: 'Shift Not Found',
            subtitle: 'This shift may have been removed',
          );
        }

        return SingleChildScrollView(
          padding: EdgeInsets.all(Get.width / 25),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title & Urgency
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      shift.title,
                      style: TextStyle(
                        fontFamily: "Gilroy",
                        fontSize: Get.height / 35,
                        fontWeight: FontWeight.w700,
                        color: controller.notifier.text,
                      ),
                    ),
                  ),
                  StatusBadge(
                    label: shift.urgency.toUpperCase(),
                    color: controller.notifier.urgencyColor(shift.urgency),
                  ),
                ],
              ),
              SizedBox(height: Get.height / 80),
              Text(
                shift.facilityName ?? 'Healthcare Facility',
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 48,
                  color: const Color(0xFF0165FC),
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: Get.height / 40),
              // Info Rows
              _infoSection("Schedule", [
                InfoRow(
                    label: "Date",
                    value: DateFormat('MMM dd, yyyy')
                        .format(DateTime.parse(shift.startTime))),
                InfoRow(
                    label: "Time",
                    value:
                        '${DateFormat('hh:mm a').format(DateTime.parse(shift.startTime))} - ${DateFormat('hh:mm a').format(DateTime.parse(shift.endTime))}'),
                InfoRow(
                    label: "Duration",
                    value:
                        '${DateTime.parse(shift.endTime).difference(DateTime.parse(shift.startTime)).inHours}h'),
              ]),
              SizedBox(height: Get.height / 40),
              _infoSection("Location", [
                InfoRow(label: "Address", value: shift.locationName ?? 'TBD'),
                if (shift.locationAddress != null)
                  InfoRow(label: "Details", value: shift.locationAddress!),
              ]),
              SizedBox(height: Get.height / 40),
              _infoSection("Compensation", [
                InfoRow(
                  label: "Rate",
                  value: 'PKR ${shift.totalPricePkr.toStringAsFixed(0)}',
                  valueColor: const Color(0xFF0165FC),
                ),
                InfoRow(
                  label: "Total",
                  value: 'PKR ${shift.totalPricePkr.toStringAsFixed(0)}',
                  valueColor: const Color(0xFF0165FC),
                ),
              ]),
              if (shift.description != null &&
                  shift.description!.isNotEmpty) ...[
                SizedBox(height: Get.height / 40),
                _infoSection("Description", []),
                Text(
                  shift.description!,
                  style: TextStyle(
                    fontFamily: "Gilroy",
                    fontSize: Get.height / 55,
                    color: controller.notifier.text,
                    height: 1.5,
                  ),
                ),
              ],
              if (shift.skills != null && shift.skills!.isNotEmpty) ...[
                SizedBox(height: Get.height / 40),
                _infoSection("Required Skills", []),
                Wrap(
                  spacing: Get.width / 50,
                  runSpacing: Get.height / 100,
                  children: shift.skills!.map((s) {
                    return Chip(
                      label: Text(
                        s.skillName ?? 'Skill',
                        style: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 65,
                          color: const Color(0xFF0165FC),
                        ),
                      ),
                      backgroundColor: const Color(0xFF0165FC).withOpacity(0.1),
                      side: BorderSide.none,
                    );
                  }).toList(),
                ),
              ],
              SizedBox(height: Get.height / 25),
              // Apply Section
              if (shift.status == 'open') ...[
                SectionHeader(title: "Apply to this Shift"),
                SizedBox(height: Get.height / 60),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text("Counter Rate (PKR/hr) — Optional",
                      style: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 60,
                          color: controller.notifier.text)),
                  SizedBox(height: Get.height / 120),
                  TextField(
                    controller: controller.counterRateController,
                    keyboardType: TextInputType.number,
                    style: TextStyle(
                        fontFamily: "Gilroy", color: controller.notifier.text),
                    decoration: InputDecoration(
                      hintText: "Leave blank to accept listed rate",
                      hintStyle:
                          TextStyle(fontFamily: "Gilroy", color: Colors.grey),
                      filled: true,
                      fillColor: controller.notifier.cardBg,
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(Get.height / 60),
                          borderSide: BorderSide(
                              color: controller.notifier.getfillborder)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(Get.height / 60),
                          borderSide: BorderSide(
                              color: controller.notifier.getfillborder)),
                    ),
                  ),
                ]),
                SizedBox(height: Get.height / 50),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text("Message (Optional)",
                      style: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 60,
                          color: controller.notifier.text)),
                  SizedBox(height: Get.height / 120),
                  TextField(
                    controller: controller.messageController,
                    keyboardType: TextInputType.multiline,
                    style: TextStyle(
                        fontFamily: "Gilroy", color: controller.notifier.text),
                    decoration: InputDecoration(
                      hintText: "Brief message to the facility...",
                      hintStyle:
                          TextStyle(fontFamily: "Gilroy", color: Colors.grey),
                      filled: true,
                      fillColor: controller.notifier.cardBg,
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(Get.height / 60),
                          borderSide: BorderSide(
                              color: controller.notifier.getfillborder)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(Get.height / 60),
                          borderSide: BorderSide(
                              color: controller.notifier.getfillborder)),
                    ),
                  ),
                ]),
                SizedBox(height: Get.height / 30),
                Obx(
                  () => SizedBox(
                    width: Get.width,
                    height: Get.height / 17,
                    child: ElevatedButton(
                      onPressed: controller.isApplying
                          ? () {}
                          : () => controller.applyToShift(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0165FC),
                        shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(Get.height / 20)),
                        shadowColor: Colors.transparent,
                      ),
                      child: Text(
                        controller.isApplying ? "Submitting..." : "Apply Now",
                        style: TextStyle(
                            fontFamily: "Gilroy",
                            color: const Color(0xFFFFFFFF),
                            fontSize: Get.height / 55,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
              ],
              SizedBox(height: Get.height / 20),
            ],
          ),
        );
      }),
    );
  }

  Widget _infoSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontFamily: "Gilroy",
            fontSize: Get.height / 48,
            fontWeight: FontWeight.w600,
            color: controller.notifier.text,
          ),
        ),
        SizedBox(height: Get.height / 100),
        ...children,
      ],
    );
  }
}
