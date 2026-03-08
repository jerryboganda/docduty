import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/services/services.dart';
import 'package:docduty/shared/routes/app_routes.dart';

class MessagesListController extends GetxController {
  late ColorNotifier notifier;

  final _messageService = Get.find<MessageService>();

  final conversations = <Conversation>[].obs;
  final isLoading = false.obs;
  final error = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadConversations();
  }

  Future<void> loadConversations() async {
    try {
      isLoading(true);
      error('');
      final result = await _messageService.getConversations();
      conversations.assignAll(result);
    } catch (e) {
      error(e.toString());
    } finally {
      isLoading(false);
    }
  }

  Future<void> refresh() => loadConversations();

  void openChat(Conversation conv) {
    Get.toNamed(Routes.MESSAGE_CHAT, arguments: {
      'bookingId': conv.bookingId,
      'otherUserName': conv.otherPartyName,
      'otherUserAvatar': conv.otherPartyAvatar,
    });
  }
}
