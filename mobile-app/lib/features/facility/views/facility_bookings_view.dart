import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/features/facility/controllers/facility_bookings_controller.dart';
import 'package:intl/intl.dart';

class FacilityBookingsView extends GetView<FacilityBookingsController> {
  const FacilityBookingsView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        automaticallyImplyLeading: false,
        title: Text(
          'Bookings',
          style: TextStyle(
            fontFamily: "Gilroy",
            color: controller.notifier.text,
            fontSize: Get.height / 40,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        bottom: TabBar(
          controller: controller.tabController,
          isScrollable: true,
          labelColor: const Color(0xFF0165FC),
          unselectedLabelColor: Colors.grey,
          indicatorColor: const Color(0xFF0165FC),
          labelStyle: TextStyle(
              fontFamily: "Gilroy",
              fontSize: Get.height / 60,
              fontWeight: FontWeight.w600),
          unselectedLabelStyle:
              TextStyle(fontFamily: "Gilroy", fontSize: Get.height / 60),
          tabs: controller.statusLabels.map((l) => Tab(text: l)).toList(),
        ),
      ),
      body: Obx(() {
        if (controller.isLoading.value && controller.bookings.isEmpty) {
          return const ShimmerLoading(itemCount: 5);
        }

        if (controller.bookings.isEmpty) {
          return const EmptyStateWidget(
            title: 'No Bookings',
            subtitle: 'Bookings will appear after shifts are filled',
            icon: Icons.calendar_month_outlined,
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            HapticFeedback.mediumImpact();
            await controller.refresh();
          },
          color: const Color(0xFF0165FC),
          child: ListView.builder(
            padding: EdgeInsets.all(Get.width / 25),
            itemCount: controller.bookings.length,
            itemBuilder: (context, index) {
              final booking = controller.bookings[index];
              return AnimatedListItem(
                index: index,
                child: TappableCard(
                  onTap: () => controller.goToDetail(booking.id),
                  margin: EdgeInsets.only(bottom: Get.height / 70),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              booking.doctorName ?? 'Doctor',
                              style: TextStyle(
                                fontFamily: "Gilroy",
                                fontSize: Get.height / 50,
                                fontWeight: FontWeight.w600,
                                color: controller.notifier.text,
                              ),
                            ),
                          ),
                          StatusBadge(
                              label: booking.status.toUpperCase(),
                              color: _statusColor(booking.status)),
                        ],
                      ),
                      SizedBox(height: Get.height / 100),
                      Text(
                        booking.shiftTitle ?? 'Shift',
                        style: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 55,
                          color: Colors.grey,
                        ),
                      ),
                      SizedBox(height: Get.height / 120),
                      Row(
                        children: [
                          Icon(Icons.calendar_today,
                              size: Get.height / 65, color: Colors.grey),
                          SizedBox(width: Get.width / 60),
                          Text(
                            booking.shiftStartTime != null
                                ? DateFormat('MMM dd').format(DateTime.tryParse(
                                        booking.shiftStartTime!) ??
                                    DateTime.now())
                                : '',
                            style: TextStyle(
                                fontFamily: "Gilroy",
                                fontSize: Get.height / 60,
                                color: Colors.grey),
                          ),
                          SizedBox(width: Get.width / 15),
                          PkrAmount(
                              amount: booking.totalPricePkr,
                              fontSize: Get.height / 55),
                          Text('/hr',
                              style: TextStyle(
                                  fontFamily: "Gilroy",
                                  fontSize: Get.height / 65,
                                  color: Colors.grey)),
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
