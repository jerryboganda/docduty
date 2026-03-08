import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/widgets/buttons.dart';
import 'package:docduty/features/shared/controllers/notifications_controller.dart';
import 'package:timeago/timeago.dart' as timeago;

class NotificationsView extends GetView<NotificationsController> {
  const NotificationsView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        title: Text(
          'Notifications',
          style: TextStyle(
            fontFamily: "Gilroy",
            color: controller.notifier.text,
            fontSize: Get.height / 40,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        leading: MyBackButtons(context),
        actions: [
          TextButton(
            onPressed: () => controller.markAllAsRead(),
            child: Text(
              "Read All",
              style: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 55,
                color: const Color(0xFF0165FC),
              ),
            ),
          ),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading.value && controller.notifications.isEmpty) {
          return const ShimmerLoading(itemCount: 6);
        }

        if (controller.notifications.isEmpty) {
          return const EmptyStateWidget(
            title: 'No Notifications',
            subtitle: 'You\'re all caught up!',
            icon: Icons.notifications_none,
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            HapticFeedback.mediumImpact();
            await controller.refresh();
          },
          color: const Color(0xFF0165FC),
          child: ListView.separated(
            padding: EdgeInsets.all(Get.width / 25),
            itemCount: controller.notifications.length,
            itemBuilder: (context, index) {
              final n = controller.notifications[index];
              return AnimatedListItem(
                index: index,
                child: PressableScale(
                  onTap: () => controller.markAsRead(n.id),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    padding: EdgeInsets.all(Get.width / 25),
                    decoration: BoxDecoration(
                      color: n.isRead
                          ? controller.notifier.cardBg
                          : const Color(0xFF0165FC).withOpacity(0.05),
                      borderRadius: BorderRadius.circular(Get.height / 60),
                      border: Border.all(
                        color: n.isRead
                            ? controller.notifier.getfillborder
                            : const Color(0xFF0165FC).withOpacity(0.2),
                      ),
                      boxShadow: controller.notifier.shadowSm,
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: EdgeInsets.all(Get.width / 40),
                          decoration: BoxDecoration(
                            color: _iconColor(n.type).withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            _iconData(n.type),
                            color: _iconColor(n.type),
                            size: Get.height / 45,
                          ),
                        ),
                        SizedBox(width: Get.width / 30),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                n.title ?? n.type ?? 'Notification',
                                style: TextStyle(
                                  fontFamily: "Gilroy",
                                  fontSize: Get.height / 55,
                                  fontWeight: n.isRead
                                      ? FontWeight.w400
                                      : FontWeight.w600,
                                  color: controller.notifier.text,
                                ),
                              ),
                              SizedBox(height: Get.height / 200),
                              Text(
                                n.body ?? '',
                                style: TextStyle(
                                  fontFamily: "Gilroy",
                                  fontSize: Get.height / 65,
                                  color: Colors.grey,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              SizedBox(height: Get.height / 150),
                              if (n.createdAt != null)
                                Text(
                                  timeago.format(
                                      DateTime.tryParse(n.createdAt!) ??
                                          DateTime.now()),
                                  style: TextStyle(
                                    fontFamily: "Gilroy",
                                    fontSize: Get.height / 70,
                                    color: Colors.grey,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        if (!n.isRead)
                          Container(
                            width: Get.width / 50,
                            height: Get.width / 50,
                            decoration: const BoxDecoration(
                              color: Color(0xFF0165FC),
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            },
            separatorBuilder: (_, __) => SizedBox(height: Get.height / 100),
          ),
        );
      }),
    );
  }

  IconData _iconData(String? type) {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_completed':
        return Icons.calendar_today;
      case 'shift_offer':
      case 'shift_applied':
        return Icons.work_outline;
      case 'payment':
      case 'payout':
        return Icons.account_balance_wallet;
      case 'dispute':
        return Icons.gavel;
      case 'message':
        return Icons.chat_bubble_outline;
      case 'verification':
        return Icons.verified_user;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _iconColor(String? type) {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_completed':
        return const Color(0xFF4CAF50);
      case 'shift_offer':
      case 'shift_applied':
        return const Color(0xFF0165FC);
      case 'payment':
      case 'payout':
        return Colors.orange;
      case 'dispute':
        return Colors.red;
      default:
        return const Color(0xFF0165FC);
    }
  }
}
