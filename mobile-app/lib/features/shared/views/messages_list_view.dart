import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/features/shared/controllers/messages_list_controller.dart';
import 'package:timeago/timeago.dart' as timeago;

class MessagesListView extends GetView<MessagesListController> {
  const MessagesListView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: const Color(0xFF0165FC),
            elevation: 0,
            expandedHeight: Get.height / 7,
            collapsedHeight: Get.height / 15,
            toolbarHeight: Get.height / 15,
            pinned: true,
            floating: true,
            automaticallyImplyLeading: false,
            bottom: PreferredSize(
              preferredSize: const Size(0, 20),
              child: Container(),
            ),
            centerTitle: true,
            title: Text(
              'Messages',
              style: TextStyle(
                fontFamily: "Gilroy",
                color: Colors.white,
                fontSize: Get.height / 40,
                fontWeight: FontWeight.w500,
              ),
            ),
            flexibleSpace: Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned(
                  bottom: -2,
                  left: 0,
                  right: 0,
                  child: Container(
                    height: Get.height / 50,
                    decoration: BoxDecoration(
                      color: controller.notifier.getBgColor,
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(50),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          SliverToBoxAdapter(
            child: Obx(() {
              if (controller.isLoading.value &&
                  controller.conversations.isEmpty) {
                return SizedBox(
                  height: Get.height / 2,
                  child: const ShimmerLoading(itemCount: 6),
                );
              }

              if (controller.error.isNotEmpty) {
                return SizedBox(
                  height: Get.height / 2,
                  child: ErrorRetryWidget(
                    message: controller.error.value,
                    onRetry: () => controller.loadConversations(),
                  ),
                );
              }

              if (controller.conversations.isEmpty) {
                return SizedBox(
                  height: Get.height / 2,
                  child: const EmptyStateWidget(
                    title: 'No Messages Yet',
                    subtitle: 'Start a conversation from a booking',
                    icon: Icons.chat_bubble_outline,
                  ),
                );
              }

              return RefreshIndicator(
                onRefresh: () async {
                  HapticFeedback.mediumImpact();
                  await controller.refresh();
                },
                color: const Color(0xFF0165FC),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: EdgeInsets.symmetric(
                    horizontal: Get.width / 25,
                    vertical: Get.height / 40,
                  ),
                  itemCount: controller.conversations.length,
                  itemBuilder: (context, index) {
                    final conv = controller.conversations[index];
                    return AnimatedListItem(
                      index: index,
                      child: TappableCard(
                        onTap: () => controller.openChat(conv),
                        padding: EdgeInsets.symmetric(
                            horizontal: Get.width / 50,
                            vertical: Get.height / 80),
                        margin: EdgeInsets.zero,
                        child: SizedBox(
                          height: Get.height / 14,
                          child: Row(
                            children: [
                              // Avatar
                              Container(
                                height: Get.height / 15,
                                width: Get.height / 15,
                                decoration: BoxDecoration(
                                  color: controller.notifier.isDark
                                      ? const Color(0xff161616)
                                      : Colors.grey.shade200,
                                  shape: BoxShape.circle,
                                ),
                                child: conv.otherPartyAvatar != null &&
                                        conv.otherPartyAvatar!.isNotEmpty
                                    ? ClipOval(
                                        child: Image.network(
                                          conv.otherPartyAvatar!,
                                          fit: BoxFit.cover,
                                        ),
                                      )
                                    : Icon(Icons.person,
                                        color: Colors.grey,
                                        size: Get.height / 30),
                              ),
                              SizedBox(width: Get.width / 30),
                              Expanded(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      conv.otherPartyName ?? 'User',
                                      style: TextStyle(
                                        fontFamily: "Gilroy",
                                        color: controller.notifier.text,
                                        fontSize: Get.height / 55,
                                        fontWeight: conv.messageCount > 0
                                            ? FontWeight.w600
                                            : FontWeight.w400,
                                      ),
                                    ),
                                    SizedBox(height: Get.height / 200),
                                    Text(
                                      conv.lastMessage ?? '',
                                      overflow: TextOverflow.ellipsis,
                                      maxLines: 1,
                                      style: TextStyle(
                                        color: Colors.grey,
                                        fontFamily: "Gilroy",
                                        fontSize: Get.height / 70,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  if (conv.lastMessageAt != null)
                                    Text(
                                      timeago.format(
                                          DateTime.tryParse(
                                                  conv.lastMessageAt!) ??
                                              DateTime.now(),
                                          locale: 'en_short'),
                                      style: TextStyle(
                                        color: Colors.grey,
                                        fontSize: Get.height / 70,
                                        fontFamily: "Gilroy",
                                      ),
                                    ),
                                  if (conv.messageCount > 0) ...[
                                    SizedBox(height: Get.height / 150),
                                    Container(
                                      padding: EdgeInsets.all(Get.width / 80),
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF0165FC),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Text(
                                        '${conv.messageCount}',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: Get.height / 80,
                                          fontFamily: "Gilroy",
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                  separatorBuilder: (_, __) =>
                      SizedBox(height: Get.height / 50),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
