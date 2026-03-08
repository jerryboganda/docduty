import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/shared/routes/app_routes.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/features/doctor/controllers/shift_feed_controller.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:intl/intl.dart';

class ShiftFeedView extends GetView<ShiftFeedController> {
  const ShiftFeedView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildFilterChips(),
            Expanded(child: _buildShiftList()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: Get.width / 25,
        vertical: Get.height / 60,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Hello, ${controller.userName.split(' ').first} 👋",
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 40,
                  fontWeight: FontWeight.w600,
                  color: controller.notifier.text,
                ),
              ),
              SizedBox(height: Get.height / 200),
              Text(
                "Find your next shift",
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 60,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
          Row(
            children: [
              PressableScale(
                onTap: () => Get.toNamed(Routes.NOTIFICATIONS),
                child: Stack(
                  children: [
                    Image.asset(
                      "assets/images/bell.png",
                      height: Get.height / 35,
                      color: controller.notifier.text,
                    ),
                    Obx(() {
                      if (controller.unreadNotifications == 0) {
                        return const SizedBox.shrink();
                      }
                      return Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            '${controller.unreadNotifications}',
                            style: TextStyle(
                              fontFamily: "Gilroy",
                              color: Colors.white,
                              fontSize: Get.height / 80,
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    final urgencies = ['critical', 'urgent', 'normal'];
    return SizedBox(
      height: Get.height / 18,
      child: Obx(
        () => ListView(
          scrollDirection: Axis.horizontal,
          padding: EdgeInsets.symmetric(horizontal: Get.width / 25),
          children: [
            _filterChip('All', controller.selectedUrgency == null, () {
              controller.selectedUrgency = null;
            }),
            ...urgencies.map((u) => _filterChip(
                  u[0].toUpperCase() + u.substring(1),
                  controller.selectedUrgency == u,
                  () => controller.selectedUrgency = u,
                )),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(String label, bool selected, VoidCallback onTap) {
    return PressableScale(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
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
                    color: const Color(0xFF0165FC).withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : [],
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontFamily: "Gilroy",
              color: selected ? Colors.white : controller.notifier.text,
              fontSize: Get.height / 60,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildShiftList() {
    return Obx(() {
      if (controller.isLoading) {
        return const ShimmerLoading(itemCount: 5);
      }

      if (controller.error.isNotEmpty) {
        return ErrorRetryWidget(
          message: controller.error,
          onRetry: () => controller.loadShifts(),
        );
      }

      if (controller.shifts.isEmpty) {
        return const EmptyStateWidget(
          title: 'No Shifts Available',
          subtitle: 'Check back later for new shift opportunities',
          icon: Icons.work_off_outlined,
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
          itemCount: controller.shifts.length + (controller.hasMore ? 1 : 0),
          separatorBuilder: (_, __) => SizedBox(height: Get.height / 70),
          itemBuilder: (context, index) {
            if (index == controller.shifts.length) {
              controller.loadMore();
              return Center(
                child: Padding(
                  padding: EdgeInsets.all(Get.height / 40),
                  child: SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: controller.notifier.primaryBlue,
                    ),
                  ),
                ),
              );
            }
            return AnimatedListItem(
              index: index,
              child: _shiftCard(controller.shifts[index]),
            );
          },
        ),
      );
    });
  }

  Widget _shiftCard(Shift shift) {
    final urgencyColor = controller.notifier.urgencyColor(shift.urgency);
    return TappableCard(
      onTap: () => Get.toNamed(
        Routes.DOCTOR_SHIFT_DETAIL,
        arguments: {'shiftId': shift.id},
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  shift.title,
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
                label: shift.urgency.toUpperCase(),
                color: urgencyColor,
                small: true,
              ),
            ],
          ),
          SizedBox(height: Get.height / 100),
          // Facility name
          Text(
            shift.facilityName ?? 'Healthcare Facility',
            style: TextStyle(
              fontFamily: "Gilroy",
              fontSize: Get.height / 55,
              color: const Color(0xFF0165FC),
            ),
          ),
          SizedBox(height: Get.height / 80),
          // Details row
          Row(
            children: [
              Icon(Icons.calendar_today_outlined,
                  size: Get.height / 60, color: Colors.grey),
              SizedBox(width: Get.width / 60),
              Text(
                DateFormat('MMM dd, yyyy')
                    .format(DateTime.parse(shift.startTime)),
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 60,
                  color: controller.notifier.subtitleText,
                ),
              ),
              SizedBox(width: Get.width / 20),
              Icon(Icons.access_time,
                  size: Get.height / 60, color: Colors.grey),
              SizedBox(width: Get.width / 60),
              Text(
                '${DateFormat('hh:mm a').format(DateTime.parse(shift.startTime))} - ${DateFormat('hh:mm a').format(DateTime.parse(shift.endTime))}',
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 60,
                  color: controller.notifier.subtitleText,
                ),
              ),
            ],
          ),
          SizedBox(height: Get.height / 100),
          // Location & Rate
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.location_on_outlined,
                      size: Get.height / 60, color: Colors.grey),
                  SizedBox(width: Get.width / 60),
                  Text(
                    shift.locationName ?? 'Location TBD',
                    style: TextStyle(
                      fontFamily: "Gilroy",
                      fontSize: Get.height / 60,
                      color: controller.notifier.subtitleText,
                    ),
                  ),
                ],
              ),
              PkrAmount(
                amount: shift.totalPricePkr,
                fontSize: Get.height / 50,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF0165FC),
              ),
            ],
          ),
          // Posted time
          SizedBox(height: Get.height / 100),
          Text(
            shift.createdAt != null
                ? timeago.format(DateTime.parse(shift.createdAt!))
                : '',
            style: TextStyle(
              fontFamily: "Gilroy",
              fontSize: Get.height / 70,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }
}
