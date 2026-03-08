/// Booking and AttendanceEvent models.
/// Maps to bookings and attendance_events tables.

class Booking {
  final String id;
  final String shiftId;
  final String doctorId;
  final String posterId;
  final String? offerId;
  final String status;
  final double totalPricePkr;
  final double platformFeePkr;
  final double payoutPkr;
  final String? checkInTime;
  final String? checkOutTime;
  final String? settledAt;
  final String? cancelledBy;
  final String? cancellationReason;
  final String? noShowDetectedAt;
  final String? createdAt;
  final String? updatedAt;

  // Joined data
  final String? shiftTitle;
  final String? shiftStartTime;
  final String? shiftEndTime;
  final String? shiftDepartment;
  final String? shiftUrgency;
  final String? shiftType;
  final String? facilityName;
  final String? locationName;
  final String? locationAddress;
  final double? locationLatitude;
  final double? locationLongitude;
  final int? geofenceRadiusM;
  final String? doctorName;
  final String? doctorPhone;
  final String? posterName;
  final String? posterPhone;
  final String? specialtyName;
  final String? roleName;
  final List<AttendanceEvent>? attendanceEvents;

  Booking({
    required this.id,
    required this.shiftId,
    required this.doctorId,
    required this.posterId,
    this.offerId,
    required this.status,
    required this.totalPricePkr,
    required this.platformFeePkr,
    required this.payoutPkr,
    this.checkInTime,
    this.checkOutTime,
    this.settledAt,
    this.cancelledBy,
    this.cancellationReason,
    this.noShowDetectedAt,
    this.createdAt,
    this.updatedAt,
    this.shiftTitle,
    this.shiftStartTime,
    this.shiftEndTime,
    this.shiftDepartment,
    this.shiftUrgency,
    this.shiftType,
    this.facilityName,
    this.locationName,
    this.locationAddress,
    this.locationLatitude,
    this.locationLongitude,
    this.geofenceRadiusM,
    this.doctorName,
    this.doctorPhone,
    this.posterName,
    this.posterPhone,
    this.specialtyName,
    this.roleName,
    this.attendanceEvents,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    List<AttendanceEvent>? events;
    if (json['attendanceEvents'] is List) {
      events = (json['attendanceEvents'] as List)
          .map((e) => AttendanceEvent.fromJson(e))
          .toList();
    } else if (json['attendance_events'] is List) {
      events = (json['attendance_events'] as List)
          .map((e) => AttendanceEvent.fromJson(e))
          .toList();
    }

    return Booking(
      id: json['id'] ?? '',
      shiftId: json['shift_id'] ?? json['shiftId'] ?? '',
      doctorId: json['doctor_id'] ?? json['doctorId'] ?? '',
      posterId: json['poster_id'] ?? json['posterId'] ?? '',
      offerId: json['offer_id'] ?? json['offerId'],
      status: json['status'] ?? '',
      totalPricePkr:
          _toDouble(json['total_price_pkr'] ?? json['totalPricePkr']) ?? 0,
      platformFeePkr:
          _toDouble(json['platform_fee_pkr'] ?? json['platformFeePkr']) ?? 0,
      payoutPkr: _toDouble(json['payout_pkr'] ?? json['payoutPkr']) ?? 0,
      checkInTime: json['check_in_time'] ?? json['checkInTime'],
      checkOutTime: json['check_out_time'] ?? json['checkOutTime'],
      settledAt: json['settled_at'] ?? json['settledAt'],
      cancelledBy: json['cancelled_by'] ?? json['cancelledBy'],
      cancellationReason:
          json['cancellation_reason'] ?? json['cancellationReason'],
      noShowDetectedAt: json['no_show_detected_at'] ?? json['noShowDetectedAt'],
      createdAt: json['created_at'] ?? json['createdAt'],
      updatedAt: json['updated_at'] ?? json['updatedAt'],
      shiftTitle: json['shift_title'] ?? json['shiftTitle'],
      shiftStartTime: json['shift_start_time'] ?? json['shiftStartTime'],
      shiftEndTime: json['shift_end_time'] ?? json['shiftEndTime'],
      shiftDepartment: json['shift_department'] ?? json['shiftDepartment'],
      shiftUrgency: json['shift_urgency'] ?? json['shiftUrgency'],
      shiftType: json['shift_type'] ?? json['shiftType'],
      facilityName: json['facility_name'] ?? json['facilityName'],
      locationName: json['location_name'] ?? json['locationName'],
      locationAddress: json['location_address'] ?? json['locationAddress'],
      locationLatitude:
          _toDouble(json['location_latitude'] ?? json['locationLatitude']),
      locationLongitude:
          _toDouble(json['location_longitude'] ?? json['locationLongitude']),
      geofenceRadiusM: json['geofence_radius_m'] ?? json['geofenceRadiusM'],
      doctorName: json['doctor_name'] ?? json['doctorName'],
      doctorPhone: json['doctor_phone'] ?? json['doctorPhone'],
      posterName: json['poster_name'] ?? json['posterName'],
      posterPhone: json['poster_phone'] ?? json['posterPhone'],
      specialtyName: json['specialty_name'] ?? json['specialtyName'],
      roleName: json['role_name'] ?? json['roleName'],
      attendanceEvents: events,
    );
  }

  bool get isConfirmed => status == 'confirmed';
  bool get isInProgress => status == 'in_progress';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get isNoShow => status == 'no_show';
  bool get isDisputed => status == 'disputed';
  bool get isResolved => status == 'resolved';
  bool get isActive => isConfirmed || isInProgress;
  bool get isSettled => settledAt != null;
  bool get hasCheckedIn => checkInTime != null;
  bool get hasCheckedOut => checkOutTime != null;

  static double? _toDouble(dynamic val) {
    if (val == null) return null;
    if (val is double) return val;
    if (val is int) return val.toDouble();
    if (val is String) return double.tryParse(val);
    return null;
  }
}

class AttendanceEvent {
  final String id;
  final String bookingId;
  final String userId;
  final String eventType;
  final double? latitude;
  final double? longitude;
  final bool? geoValid;
  final String? qrCodeScanned;
  final bool? qrValid;
  final String? deviceInfo;
  final bool? mockLocationDetected;
  final bool? adminOverride;
  final String? adminOverrideBy;
  final String? adminOverrideReason;
  final String? recordedAt;

  AttendanceEvent({
    required this.id,
    required this.bookingId,
    required this.userId,
    required this.eventType,
    this.latitude,
    this.longitude,
    this.geoValid,
    this.qrCodeScanned,
    this.qrValid,
    this.deviceInfo,
    this.mockLocationDetected,
    this.adminOverride,
    this.adminOverrideBy,
    this.adminOverrideReason,
    this.recordedAt,
  });

  factory AttendanceEvent.fromJson(Map<String, dynamic> json) =>
      AttendanceEvent(
        id: json['id'] ?? '',
        bookingId: json['booking_id'] ?? json['bookingId'] ?? '',
        userId: json['user_id'] ?? json['userId'] ?? '',
        eventType: json['event_type'] ?? json['eventType'] ?? '',
        latitude: Booking._toDouble(json['latitude']),
        longitude: Booking._toDouble(json['longitude']),
        geoValid: json['geo_valid'] == 1 || json['geo_valid'] == true,
        qrCodeScanned: json['qr_code_scanned'],
        qrValid: json['qr_valid'] == 1 || json['qr_valid'] == true,
        deviceInfo: json['device_info'],
        mockLocationDetected: json['mock_location_detected'] == 1 ||
            json['mock_location_detected'] == true,
        adminOverride:
            json['admin_override'] == 1 || json['admin_override'] == true,
        adminOverrideBy: json['admin_override_by'],
        adminOverrideReason: json['admin_override_reason'],
        recordedAt: json['recorded_at'] ?? json['recordedAt'],
      );

  bool get isCheckIn => eventType == 'check_in';
  bool get isCheckOut => eventType == 'check_out';
  bool get isPresencePing => eventType == 'presence_ping';
}
