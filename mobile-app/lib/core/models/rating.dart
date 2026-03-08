/// Rating model. Maps to ratings table.

class Rating {
  final String id;
  final String bookingId;
  final String raterId;
  final String ratedId;
  final int score;
  final String? comment;
  final String? createdAt;

  // Joined fields
  final String? raterName;
  final String? ratedName;
  final String? shiftTitle;

  Rating({
    required this.id,
    required this.bookingId,
    required this.raterId,
    required this.ratedId,
    required this.score,
    this.comment,
    this.createdAt,
    this.raterName,
    this.ratedName,
    this.shiftTitle,
  });

  factory Rating.fromJson(Map<String, dynamic> json) => Rating(
        id: json['id'] ?? '',
        bookingId: json['booking_id'] ?? json['bookingId'] ?? '',
        raterId: json['rater_id'] ?? json['raterId'] ?? '',
        ratedId: json['rated_id'] ?? json['ratedId'] ?? '',
        score: json['score'] ?? 0,
        comment: json['comment'],
        createdAt: json['created_at'] ?? json['createdAt'],
        raterName: json['rater_name'] ?? json['raterName'],
        ratedName: json['rated_name'] ?? json['ratedName'],
        shiftTitle: json['shift_title'] ?? json['shiftTitle'],
      );

  Map<String, dynamic> toJson() => {
        'bookingId': bookingId,
        'ratedId': ratedId,
        'score': score,
        if (comment != null) 'comment': comment,
      };
}
