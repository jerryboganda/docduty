import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/widgets/buttons.dart';
import 'package:docduty/features/shared/controllers/chat_detail_controller.dart';

class ChatDetailView extends GetView<ChatDetailController> {
  const ChatDetailView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: controller.notifier.getBgColor,
      body: Column(
        children: [
          // Custom AppBar
          Container(
            padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
            decoration: const BoxDecoration(
              color: Color(0xFF0165FC),
              borderRadius: BorderRadius.vertical(
                bottom: Radius.circular(25),
              ),
            ),
            child: Padding(
              padding: EdgeInsets.symmetric(
                horizontal: Get.width / 40,
                vertical: Get.height / 60,
              ),
              child: Row(
                children: [
                  MyBackButtons(context),
                  SizedBox(width: Get.width / 50),
                  Container(
                    height: Get.height / 23,
                    width: Get.height / 23,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade400,
                      shape: BoxShape.circle,
                    ),
                    child: controller.otherUserAvatar != null &&
                            controller.otherUserAvatar!.isNotEmpty
                        ? ClipOval(
                            child: Image.network(
                              controller.otherUserAvatar!,
                              fit: BoxFit.cover,
                            ),
                          )
                        : Icon(Icons.person,
                            color: Colors.white, size: Get.height / 40),
                  ),
                  SizedBox(width: Get.width / 40),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          controller.otherUserName,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: Get.height / 50,
                            fontFamily: "Gilroy",
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          "Online",
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: Get.height / 65,
                            fontFamily: "Gilroy",
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Messages
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value && controller.messages.isEmpty) {
                return const ShimmerLoading(itemCount: 6);
              }

              if (controller.messages.isEmpty) {
                return Center(
                  child: Text(
                    'No messages yet.\nSend the first message!',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: "Gilroy",
                      fontSize: Get.height / 55,
                      color: Colors.grey,
                    ),
                  ),
                );
              }

              return ListView.builder(
                controller: controller.scrollController,
                padding: EdgeInsets.all(Get.width / 25),
                itemCount: controller.messages.length,
                itemBuilder: (context, index) {
                  final msg = controller.messages[index];
                  final isMine = msg.senderId == controller.currentUserId;
                  return AnimatedListItem(
                    index: index,
                    child: _chatBubble(msg, isMine),
                  );
                },
              );
            }),
          ),
          // Input
          Container(
            padding: EdgeInsets.only(
              left: Get.width / 25,
              right: Get.width / 50,
              bottom: MediaQuery.of(context).padding.bottom + Get.height / 100,
              top: Get.height / 100,
            ),
            decoration: BoxDecoration(
              color: controller.notifier.getBgColor,
              border: Border(
                top: BorderSide(color: controller.notifier.getfillborder),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: EdgeInsets.symmetric(horizontal: Get.width / 30),
                    decoration: BoxDecoration(
                      color: controller.notifier.isDark
                          ? const Color(0xff161616)
                          : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(Get.height / 30),
                    ),
                    child: TextField(
                      controller: controller.messageController,
                      style: TextStyle(
                        fontFamily: "Gilroy",
                        fontSize: Get.height / 55,
                        color: controller.notifier.text,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        hintStyle: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 55,
                          color: Colors.grey,
                        ),
                        border: InputBorder.none,
                        contentPadding:
                            EdgeInsets.symmetric(vertical: Get.height / 80),
                      ),
                      onSubmitted: (_) => controller.sendMessage(),
                    ),
                  ),
                ),
                SizedBox(width: Get.width / 50),
                Obx(() => PressableScale(
                      onTap: controller.isSending.value
                          ? null
                          : controller.sendMessage,
                      child: Container(
                        height: Get.height / 20,
                        width: Get.height / 20,
                        decoration: const BoxDecoration(
                          color: Color(0xFF0165FC),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.send,
                          color: Colors.white,
                          size: Get.height / 45,
                        ),
                      ),
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _chatBubble(dynamic msg, bool isMine) {
    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          bottom: Get.height / 100,
          left: isMine ? Get.width / 6 : 0,
          right: isMine ? 0 : Get.width / 6,
        ),
        padding: EdgeInsets.symmetric(
          horizontal: Get.width / 25,
          vertical: Get.height / 100,
        ),
        decoration: BoxDecoration(
          color: isMine ? const Color(0xFF0165FC) : const Color(0xFFE8E8EE),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(Get.height / 50),
            topRight: Radius.circular(Get.height / 50),
            bottomLeft: isMine ? Radius.circular(Get.height / 50) : Radius.zero,
            bottomRight:
                isMine ? Radius.zero : Radius.circular(Get.height / 50),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              msg.content ?? '',
              style: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 55,
                color: isMine ? Colors.white : Colors.black87,
              ),
            ),
            SizedBox(height: Get.height / 200),
            Text(
              msg.createdAt ?? '',
              style: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 80,
                color: isMine ? Colors.white70 : Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
