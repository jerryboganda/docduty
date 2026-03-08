import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/services/services.dart';

class ChatDetailController extends GetxController {
  late ColorNotifier notifier;

  final _messageService = Get.find<MessageService>();
  final _authService = Get.find<AuthService>();

  final messages = <Message>[].obs;
  final isLoading = false.obs;
  final isSending = false.obs;
  final messageController = TextEditingController();
  final scrollController = ScrollController();

  late String bookingId;
  String otherUserName = '';
  String? otherUserAvatar;

  String get currentUserId => _authService.userId;

  @override
  void onInit() {
    super.onInit();
    final args = Get.arguments as Map<String, dynamic>? ?? {};
    bookingId = args['bookingId']?.toString() ?? '';
    otherUserName = args['otherUserName'] ?? 'User';
    otherUserAvatar = args['otherUserAvatar'];
    loadMessages();
  }

  Future<void> loadMessages() async {
    try {
      isLoading(true);
      final result = await _messageService.getMessages(bookingId);
      messages.assignAll(result);
      await _messageService.markAsRead(bookingId);
      _scrollToBottom();
    } catch (_) {
    } finally {
      isLoading(false);
    }
  }

  Future<void> sendMessage() async {
    final text = messageController.text.trim();
    if (text.isEmpty) return;

    try {
      isSending(true);
      messageController.clear();
      final msg = await _messageService.sendMessage(bookingId, text);
      messages.add(msg);
      _scrollToBottom();
    } catch (e) {
      Get.snackbar('Error', 'Failed to send message',
          backgroundColor: Colors.red, colorText: Colors.white);
    } finally {
      isSending(false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (scrollController.hasClients) {
        scrollController.animateTo(
          scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void onClose() {
    messageController.dispose();
    scrollController.dispose();
    super.onClose();
  }
}
