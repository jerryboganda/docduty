/// Message and Conversation models. Maps to messages table.

class Message {
  final String id;
  final String bookingId;
  final String senderId;
  final String content;
  final String? senderName;
  final String? createdAt;

  Message({
    required this.id,
    required this.bookingId,
    required this.senderId,
    required this.content,
    this.senderName,
    this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) => Message(
        id: json['id'] ?? '',
        bookingId: json['booking_id'] ?? json['bookingId'] ?? '',
        senderId: json['sender_id'] ?? json['senderId'] ?? '',
        content: json['content'] ?? '',
        senderName: json['sender_name'] ?? json['senderName'],
        createdAt: json['created_at'] ?? json['createdAt'],
      );
}

class Conversation {
  final String bookingId;
  final String? otherPartyId;
  final String? otherPartyName;
  final String? otherPartyPhone;
  final String? otherPartyAvatar;
  final String? lastMessage;
  final String? lastMessageAt;
  final int messageCount;
  final String? shiftTitle;

  Conversation({
    required this.bookingId,
    this.otherPartyId,
    this.otherPartyName,
    this.otherPartyPhone,
    this.otherPartyAvatar,
    this.lastMessage,
    this.lastMessageAt,
    required this.messageCount,
    this.shiftTitle,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) => Conversation(
        bookingId: json['booking_id'] ?? json['bookingId'] ?? '',
        otherPartyId: json['other_party_id'] ?? json['otherPartyId'],
        otherPartyName: json['other_party_name'] ?? json['otherPartyName'],
        otherPartyPhone: json['other_party_phone'] ?? json['otherPartyPhone'],
        otherPartyAvatar:
            json['other_party_avatar'] ?? json['otherPartyAvatar'],
        lastMessage: json['last_message'] ?? json['lastMessage'],
        lastMessageAt: json['last_message_at'] ?? json['lastMessageAt'],
        messageCount: json['message_count'] ?? json['messageCount'] ?? 0,
        shiftTitle: json['shift_title'] ?? json['shiftTitle'],
      );
}
