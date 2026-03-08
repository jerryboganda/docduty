import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/features/facility/controllers/facility_shifts_controller.dart';
import 'package:intl/intl.dart';

class FacilityShiftsView extends GetView<FacilityShiftsController> {
  const FacilityShiftsView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        automaticallyImplyLeading: false,
        title: Text(
          'My Shifts',
          style: TextStyle(
            fontFamily: "Gilroy",
            color: controller.notifier.text,
            fontSize: Get.height / 40,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () => controller.goToCreateShift(),
            icon: const Icon(Icons.add_circle, color: Color(0xFF0165FC)),
          ),
        ],
        bottom: TabBar(
          controller: controller.tabController,
          isScrollable: true,
          labelColor: const Color(0xFF0165FC),
          unselectedLabelColor: Colors.grey,
          indicatorColor: const Color(0xFF0165FC),
          labelStyle: TextStyle(
            fontFamily: "Gilroy",
            fontSize: Get.height / 60,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: TextStyle(
            fontFamily: "Gilroy",
            fontSize: Get.height / 60,
          ),
          tabs: controller.statusLabels.map((l) => Tab(text: l)).toList(),
        ),
      ),
      body: Obx(() {
        if (controller.isLoading.value && controller.myShifts.isEmpty) {
          return const ShimmerLoading(itemCount: 5);
        }

        if (controller.myShifts.isEmpty) {
          return EmptyStateWidget(
            title: 'No ${controller.selectedStatus.value} shifts',
            subtitle: 'Tap + to post a new shift',
            icon: Icons.work_off_outlined,
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
            itemCount: controller.myShifts.length,
            itemBuilder: (context, index) {
              final shift = controller.myShifts[index];
              return AnimatedListItem(
                index: index,
                child: TappableCard(
                  onTap: () => controller.goToShiftDetail(shift.id),
                  margin: EdgeInsets.only(bottom: Get.height / 70),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              shift.title,
                              style: TextStyle(
                                fontFamily: "Gilroy",
                                fontSize: Get.height / 50,
                                fontWeight: FontWeight.w600,
                                color: controller.notifier.text,
                              ),
                            ),
                          ),
                          StatusBadge(
                              label: shift.status.toUpperCase(),
                              color: _statusColor(shift.status)),
                        ],
                      ),
                      SizedBox(height: Get.height / 100),
                      Row(
                        children: [
                          Icon(Icons.calendar_today,
                              size: Get.height / 60, color: Colors.grey),
                          SizedBox(width: Get.width / 60),
                          Text(
                            DateFormat('MMM dd, yyyy').format(
                                DateTime.tryParse(shift.startTime) ??
                                    DateTime.now()),
                            style: TextStyle(
                              fontFamily: "Gilroy",
                              fontSize: Get.height / 60,
                              color: Colors.grey,
                            ),
                          ),
                          SizedBox(width: Get.width / 15),
                          Icon(Icons.access_time,
                              size: Get.height / 60, color: Colors.grey),
                          SizedBox(width: Get.width / 60),
                          Text(
                            '${DateFormat('hh:mm a').format(DateTime.tryParse(shift.startTime) ?? DateTime.now())} - ${DateFormat('hh:mm a').format(DateTime.tryParse(shift.endTime) ?? DateTime.now())}',
                            style: TextStyle(
                              fontFamily: "Gilroy",
                              fontSize: Get.height / 60,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: Get.height / 120),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'PKR ${shift.totalPricePkr}/hr',
                            style: TextStyle(
                              fontFamily: "Gilroy",
                              fontSize: Get.height / 50,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF0165FC),
                            ),
                          ),
                          Text(
                            '${shift.offers?.length ?? 0} applicants',
                            style: TextStyle(
                              fontFamily: "Gilroy",
                              fontSize: Get.height / 60,
                              color: Colors.grey,
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
      floatingActionButton: FloatingActionButton(
        onPressed: () => controller.goToCreateShift(),
        backgroundColor: const Color(0xFF0165FC),
        child: const Icon(Icons.add, color: Colors.white),
      ),
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
