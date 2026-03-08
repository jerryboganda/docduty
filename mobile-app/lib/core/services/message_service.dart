import 'package:get/get.dart';
import 'package:docduty/core/network/api_client.dart';
import 'package:docduty/core/models/models.dart';

/// Message service — conversations and real-time messaging.
class MessageService extends GetxService {
  final ApiClient _api = Get.find<ApiClient>();

  Future<List<Conversation>> getConversations() async {
    final res = await _api.get('/messages/conversations');
    return ((res['conversations'] ?? []) as List)
        .map((j) => Conversation.fromJson(j))
        .toList();
  }

  Future<List<Message>> getMessages(String bookingId, {int page = 1}) async {
    final res = await _api.get(
      '/messages/$bookingId',
      queryParameters: {'page': page},
    );
    return ((res['messages'] ?? []) as List)
        .map((j) => Message.fromJson(j))
        .toList();
  }

  Future<Message> sendMessage(String bookingId, String content,
      {String type = 'text'}) async {
    final res = await _api.post('/messages/$bookingId', data: {
      'content': content,
      'type': type,
    });
    return Message.fromJson(res['message'] ?? res);
  }

  Future<Conversation> startConversation(String otherUserId) async {
    final res = await _api.post('/messages/conversations', data: {
      'otherUserId': otherUserId,
    });
    return Conversation.fromJson(res['conversation'] ?? res);
  }

  Future<void> markAsRead(String bookingId) async {
    await _api.put('/messages/$bookingId/read');
  }
}
