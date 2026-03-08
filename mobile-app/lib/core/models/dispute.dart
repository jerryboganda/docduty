/// Dispute and DisputeEvidence models.
/// Maps to disputes and dispute_evidence tables.

class Dispute {
  final String id;
  final String bookingId;
  final String raisedBy;
  final String raisedAgainst;
  final String type;
  final String? description;
  final String status;
  final String? resolutionType;
  final String? resolutionNotes;
  final String? resolvedBy;
  final String? resolvedAt;
  final String? createdAt;

  // Joined data
  final String? raisedByName;
  final String? raisedByPhone;
  final String? raisedAgainstName;
  final String? raisedAgainstPhone;
  final String? shiftTitle;
  final List<DisputeEvidence>? evidence;
  final List<dynamic>? attendanceEvents;

  Dispute({
    required this.id,
    required this.bookingId,
    required this.raisedBy,
    required this.raisedAgainst,
    required this.type,
    this.description,
    required this.status,
    this.resolutionType,
    this.resolutionNotes,
    this.resolvedBy,
    this.resolvedAt,
    this.createdAt,
    this.raisedByName,
    this.raisedByPhone,
    this.raisedAgainstName,
    this.raisedAgainstPhone,
    this.shiftTitle,
    this.evidence,
    this.attendanceEvents,
  });

  factory Dispute.fromJson(Map<String, dynamic> json) {
    List<DisputeEvidence>? evidence;
    if (json['evidence'] is List) {
      evidence = (json['evidence'] as List)
          .map((e) => DisputeEvidence.fromJson(e))
          .toList();
    }

    return Dispute(
      id: json['id'] ?? '',
      bookingId: json['booking_id'] ?? json['bookingId'] ?? '',
      raisedBy: json['raised_by'] ?? json['raisedBy'] ?? '',
      raisedAgainst: json['raised_against'] ?? json['raisedAgainst'] ?? '',
      type: json['type'] ?? '',
      description: json['description'],
      status: json['status'] ?? 'open',
      resolutionType: json['resolution_type'] ?? json['resolutionType'],
      resolutionNotes: json['resolution_notes'] ?? json['resolutionNotes'],
      resolvedBy: json['resolved_by'] ?? json['resolvedBy'],
      resolvedAt: json['resolved_at'] ?? json['resolvedAt'],
      createdAt: json['created_at'] ?? json['createdAt'],
      raisedByName: json['raised_by_name'] ?? json['raisedByName'],
      raisedByPhone: json['raised_by_phone'] ?? json['raisedByPhone'],
      raisedAgainstName:
          json['raised_against_name'] ?? json['raisedAgainstName'],
      raisedAgainstPhone:
          json['raised_against_phone'] ?? json['raisedAgainstPhone'],
      shiftTitle: json['shift_title'] ?? json['shiftTitle'],
      evidence: evidence,
      attendanceEvents: json['attendanceEvents'] ?? json['attendance_events'],
    );
  }

  bool get isOpen => status == 'open';
  bool get isUnderReview => status == 'under_review';
  bool get isResolved => status == 'resolved';
  bool get isDismissed => status == 'dismissed';
}

class DisputeEvidence {
  final String id;
  final String disputeId;
  final String type;
  final String? content;
  final String submittedBy;
  final String? submittedByName;
  final String? createdAt;

  DisputeEvidence({
    required this.id,
    required this.disputeId,
    required this.type,
    this.content,
    required this.submittedBy,
    this.submittedByName,
    this.createdAt,
  });

  factory DisputeEvidence.fromJson(Map<String, dynamic> json) =>
      DisputeEvidence(
        id: json['id'] ?? '',
        disputeId: json['dispute_id'] ?? json['disputeId'] ?? '',
        type: json['type'] ?? '',
        content: json['content'],
        submittedBy: json['submitted_by'] ?? json['submittedBy'] ?? '',
        submittedByName: json['submitted_by_name'] ?? json['submittedByName'],
        createdAt: json['created_at'] ?? json['createdAt'],
      );
}
