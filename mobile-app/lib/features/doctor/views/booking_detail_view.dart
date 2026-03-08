import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:intl/intl.dart';
import 'package:docduty/shared/routes/app_routes.dart';
import 'package:docduty/features/doctor/controllers/booking_detail_controller.dart';

class BookingDetailView extends GetView<BookingDetailController> {
  const BookingDetailView({super.key});

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
          "Booking Details",
          style: TextStyle(
            fontFamily: "Gilroy",
            color: controller.notifier.text,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: Obx(() {
        if (controller.isLoading) {
          return const ShimmerLoading(itemCount: 5);
        }

        if (controller.error.isNotEmpty) {
          return ErrorRetryWidget(
            message: controller.error,
            onRetry: () => controller.loadBooking(),
          );
        }

        final booking = controller.booking.value;
        if (booking == null) return const SizedBox.shrink();

        return SingleChildScrollView(
          padding: EdgeInsets.all(Get.width / 25),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      booking.shiftTitle ?? 'Booking',
                      style: TextStyle(
                        fontFamily: "Gilroy",
                        fontSize: Get.height / 35,
                        fontWeight: FontWeight.w700,
                        color: controller.notifier.text,
                      ),
                    ),
                  ),
                  StatusBadge(
                    label: booking.status.toUpperCase(),
                    color: controller.notifier.statusColor(booking.status),
                  ),
                ],
              ),
              SizedBox(height: Get.height / 60),
              Text(
                booking.facilityName ?? '',
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 48,
                  color: const Color(0xFF0165FC),
                ),
              ),
              SizedBox(height: Get.height / 30),
              // Booking Info
              InfoRow(
                  label: "Date",
                  value: booking.shiftStartTime != null
                      ? DateFormat('MMM dd, yyyy')
                          .format(DateTime.parse(booking.shiftStartTime!))
                      : ''),
              InfoRow(
                  label: "Time",
                  value:
                      '${booking.shiftStartTime != null ? DateFormat('hh:mm a').format(DateTime.parse(booking.shiftStartTime!)) : ''} - ${booking.shiftEndTime != null ? DateFormat('hh:mm a').format(DateTime.parse(booking.shiftEndTime!)) : ''}'),
              InfoRow(
                label: "Amount",
                value: 'PKR ${booking.totalPricePkr.toStringAsFixed(0)}',
                valueColor: const Color(0xFF0165FC),
              ),
              InfoRow(label: "Booking ID", value: '#${booking.id}'),
              SizedBox(height: Get.height / 30),
              // Attendance Section
              Text(
                "Attendance",
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 42,
                  fontWeight: FontWeight.w600,
                  color: controller.notifier.text,
                ),
              ),
              SizedBox(height: Get.height / 60),
              // Attendance Buttons
              if (booking.status == 'confirmed' ||
                  booking.status == 'active') ...[
                Obx(() {
                  final hasCheckedIn = controller.attendanceLog
                      .any((e) => e.eventType == 'check_in');
                  final hasCheckedOut = controller.attendanceLog
                      .any((e) => e.eventType == 'check_out');

                  return Column(
                    children: [
                      if (!hasCheckedIn)
                        Row(
                          children: [
                            Expanded(
                              child: SizedBox(
                                height: Get.height / 17,
                                child: ElevatedButton(
                                  onPressed: controller.isChecking
                                      ? () {}
                                      : () => controller.checkIn(),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF4CAF50),
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(
                                            Get.height / 20)),
                                    shadowColor: Colors.transparent,
                                  ),
                                  child: Text(
                                    controller.isChecking
                                        ? "Checking in..."
                                        : "Check In (GPS)",
                                    style: TextStyle(
                                        fontFamily: "Gilroy",
                                        color: Colors.white,
                                        fontSize: Get.height / 55,
                                        fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ),
                            ),
                            SizedBox(width: Get.width / 30),
                            SizedBox(
                              height: Get.height / 17,
                              child: ElevatedButton.icon(
                                onPressed: controller.isChecking
                                    ? null
                                    : () => Get.toNamed(
                                          Routes.DOCTOR_ATTENDANCE,
                                          arguments: {'bookingId': booking.id},
                                        ),
                                icon: const Icon(Icons.qr_code_scanner,
                                    color: Colors.white),
                                label: Text(
                                  "QR",
                                  style: TextStyle(
                                    fontFamily: "Gilroy",
                                    color: Colors.white,
                                    fontSize: Get.height / 55,
                                  ),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF0165FC),
                                  shape: RoundedRectangleBorder(
                                    borderRadius:
                                        BorderRadius.circular(Get.height / 20),
                                  ),
                                  shadowColor: Colors.transparent,
                                ),
                              ),
                            ),
                          ],
                        ),
                      if (hasCheckedIn && !hasCheckedOut) ...[
                        SizedBox(height: Get.height / 60),
                        SizedBox(
                          width: Get.width,
                          height: Get.height / 17,
                          child: ElevatedButton(
                            onPressed: controller.isChecking
                                ? () {}
                                : () => controller.checkOut(),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange,
                              shape: RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(Get.height / 20)),
                              shadowColor: Colors.transparent,
                            ),
                            child: Text(
                              controller.isChecking
                                  ? "Checking out..."
                                  : "Check Out",
                              style: TextStyle(
                                  fontFamily: "Gilroy",
                                  color: Colors.white,
                                  fontSize: Get.height / 55,
                                  fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                      ],
                      if (hasCheckedIn && hasCheckedOut)
                        Container(
                          width: Get.width,
                          padding: EdgeInsets.all(Get.width / 25),
                          decoration: BoxDecoration(
                            color: const Color(0xFF4CAF50).withOpacity(0.1),
                            borderRadius:
                                BorderRadius.circular(Get.height / 60),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle,
                                  color: Color(0xFF4CAF50)),
                              SizedBox(width: Get.width / 30),
                              Text(
                                "Attendance Completed",
                                style: TextStyle(
                                  fontFamily: "Gilroy",
                                  fontSize: Get.height / 55,
                                  color: const Color(0xFF4CAF50),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  );
                }),
              ],
              SizedBox(height: Get.height / 30),
              // Attendance Log
              if (controller.attendanceLog.isNotEmpty) ...[
                Text(
                  "Attendance Log",
                  style: TextStyle(
                    fontFamily: "Gilroy",
                    fontSize: Get.height / 48,
                    fontWeight: FontWeight.w600,
                    color: controller.notifier.text,
                  ),
                ),
                SizedBox(height: Get.height / 80),
                ...controller.attendanceLog.map((event) => Container(
                      margin: EdgeInsets.only(bottom: Get.height / 100),
                      padding: EdgeInsets.all(Get.width / 30),
                      decoration: BoxDecoration(
                        color: controller.notifier.cardBg,
                        borderRadius: BorderRadius.circular(Get.height / 80),
                        border: Border.all(
                            color: controller.notifier.getfillborder),
                        boxShadow: controller.notifier.shadowSm,
                      ),
                      child: Row(
                        children: [
                          Icon(
                            event.eventType == 'check_in'
                                ? Icons.login
                                : Icons.logout,
                            color: event.eventType == 'check_in'
                                ? const Color(0xFF4CAF50)
                                : Colors.orange,
                          ),
                          SizedBox(width: Get.width / 30),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  event.eventType == 'check_in'
                                      ? 'Checked In'
                                      : 'Checked Out',
                                  style: TextStyle(
                                    fontFamily: "Gilroy",
                                    fontSize: Get.height / 55,
                                    fontWeight: FontWeight.w600,
                                    color: controller.notifier.text,
                                  ),
                                ),
                                Text(
                                  event.recordedAt ?? '',
                                  style: TextStyle(
                                    fontFamily: "Gilroy",
                                    fontSize: Get.height / 65,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )),
              ],
              SizedBox(height: Get.height / 30),
              // Actions
              if (booking.status == 'completed') ...[
                Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: Get.height / 17,
                        child: ElevatedButton(
                          onPressed: () => Get.toNamed(Routes.DOCTOR_RATINGS,
                              arguments: {'bookingId': booking.id}),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0165FC),
                            shape: RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.circular(Get.height / 20)),
                            shadowColor: Colors.transparent,
                          ),
                          child: Text(
                            "Rate Facility",
                            style: TextStyle(
                                fontFamily: "Gilroy",
                                color: Colors.white,
                                fontSize: Get.height / 55,
                                fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: Get.width / 30),
                    Expanded(
                      child: SizedBox(
                        height: Get.height / 17,
                        child: ElevatedButton(
                          onPressed: () => Get.toNamed(Routes.DISPUTE_RAISE,
                              arguments: {'bookingId': booking.id}),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.orange,
                            shape: RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.circular(Get.height / 20)),
                            shadowColor: Colors.transparent,
                          ),
                          child: Text(
                            "Raise Dispute",
                            style: TextStyle(
                                fontFamily: "Gilroy",
                                color: Colors.white,
                                fontSize: Get.height / 55,
                                fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
              SizedBox(height: Get.height / 20),
            ],
          ),
        );
      }),
    );
  }
}
