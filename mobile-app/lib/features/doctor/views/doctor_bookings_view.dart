import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/shared/routes/app_routes.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/features/doctor/controllers/doctor_bookings_controller.dart';

class DoctorBookingsView extends GetView<DoctorBookingsController> {
  const DoctorBookingsView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      body: SafeArea(
        child: Column(
          children: [
            // Title
            Padding(
              padding: EdgeInsets.all(Get.width / 25),
              child: Row(
                children: [
                  Text(
                    "My Bookings",
                    style: TextStyle(
                      fontFamily: "Gilroy",
                      fontSize: Get.height / 35,
                      fontWeight: FontWeight.w600,
                      color: controller.notifier.text,
                    ),
                  ),
                ],
              ),
            ),
            // Tab Bar
            SizedBox(
              height: Get.height / 18,
              child: Obx(
                () => ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: EdgeInsets.symmetric(horizontal: Get.width / 25),
                  itemCount: controller.tabLabels.length,
                  itemBuilder: (context, index) {
                    final selected = controller.selectedTab == index;
                    return PressableScale(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        controller.selectedTab = index;
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeInOut,
                        margin: EdgeInsets.only(right: Get.width / 40),
                        padding: EdgeInsets.symmetric(
                          horizontal: Get.width / 20,
                          vertical: Get.height / 80,
                        ),
                        decoration: BoxDecoration(
                          color: selected
                              ? const Color(0xFF0165FC)
                              : controller.notifier.getBgColor,
                          borderRadius: BorderRadius.circular(Get.height / 40),
                          border: Border.all(
                            color: selected
                                ? const Color(0xFF0165FC)
                                : controller.notifier.getfillborder,
                          ),
                          boxShadow: selected
                              ? [
                                  BoxShadow(
                                    color: const Color(0xFF0165FC)
                                        .withOpacity(0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : [],
                        ),
                        child: Center(
                          child: Text(
                            controller.tabLabels[index],
                            style: TextStyle(
                              fontFamily: "Gilroy",
                              color: selected
                                  ? Colors.white
                                  : controller.notifier.text,
                              fontSize: Get.height / 60,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            SizedBox(height: Get.height / 80),
            // Bookings List
            Expanded(
              child: Obx(() {
                if (controller.isLoading) {
                  return const ShimmerLoading(itemCount: 4);
                }

                if (controller.error.isNotEmpty) {
                  return ErrorRetryWidget(
                    message: controller.error,
                    onRetry: () => controller.loadBookings(),
                  );
                }

                if (controller.bookings.isEmpty) {
                  return EmptyStateWidget(
                    title:
                        'No ${controller.tabLabels[controller.selectedTab]} Bookings',
                    subtitle: 'Your bookings will appear here',
                    icon: Icons.calendar_today_outlined,
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    HapticFeedback.mediumImpact();
                    await controller.refresh();
                  },
                  color: const Color(0xFF0165FC),
                  child: ListView.separated(
                    padding: EdgeInsets.symmetric(
                      horizontal: Get.width / 25,
                      vertical: Get.height / 80,
                    ),
                    itemCount: controller.bookings.length,
                    separatorBuilder: (_, __) =>
                        SizedBox(height: Get.height / 70),
                    itemBuilder: (context, index) {
                      return AnimatedListItem(
                        index: index,
                        child: _bookingCard(controller.bookings[index]),
                      );
                    },
                  ),
                );
              }),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bookingCard(Booking booking) {
    return TappableCard(
      onTap: () => Get.toNamed(
        Routes.DOCTOR_BOOKING_DETAIL,
        arguments: {'bookingId': booking.id},
      ),
      margin: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  booking.shiftTitle ?? 'Shift Booking',
                  style: TextStyle(
                    fontFamily: "Gilroy",
                    fontSize: Get.height / 48,
                    fontWeight: FontWeight.w600,
                    color: controller.notifier.text,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              StatusBadge(
                label: booking.status.toUpperCase(),
                color: controller.notifier.statusColor(booking.status),
                small: true,
              ),
            ],
          ),
          SizedBox(height: Get.height / 100),
          Text(
            booking.facilityName ?? 'Facility',
            style: TextStyle(
              fontFamily: "Gilroy",
              fontSize: Get.height / 55,
              color: const Color(0xFF0165FC),
            ),
          ),
          SizedBox(height: Get.height / 80),
          Row(
            children: [
              Icon(Icons.calendar_today_outlined,
                  size: Get.height / 60, color: Colors.grey),
              SizedBox(width: Get.width / 60),
              Text(
                booking.shiftStartTime ?? '',
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 60,
                  color: controller.notifier.subtitleText,
                ),
              ),
              SizedBox(width: Get.width / 15),
              PkrAmount(
                amount: booking.totalPricePkr,
                fontSize: Get.height / 55,
                color: controller.notifier.text,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
