/// Shift, ShiftSkill, Offer models.
/// Maps to shifts, shift_skills, offers tables.

class Shift {
  final String id;
  final String posterId;
  final String? posterName;
  final String? posterPhone;
  final String? facilityLocationId;
  final String? facilityName;
  final String? locationName;
  final String? locationAddress;
  final double? locationLatitude;
  final double? locationLongitude;
  final String type;
  final String title;
  final String? description;
  final String? department;
  final String? roleId;
  final String? roleName;
  final String? specialtyId;
  final String? specialtyName;
  final String startTime;
  final String endTime;
  final double totalPricePkr;
  final double platformFeePkr;
  final double payoutPkr;
  final String urgency;
  final String status;
  final String? visibility;
  final String? requirements;
  final String? cityId;
  final String? cityName;
  final bool? counterOfferAllowed;
  final String? createdAt;
  final List<ShiftSkill>? skills;
  final List<Offer>? offers;
  final Offer? myOffer;

  Shift({
    required this.id,
    required this.posterId,
    this.posterName,
    this.posterPhone,
    this.facilityLocationId,
    this.facilityName,
    this.locationName,
    this.locationAddress,
    this.locationLatitude,
    this.locationLongitude,
    required this.type,
    required this.title,
    this.description,
    this.department,
    this.roleId,
    this.roleName,
    this.specialtyId,
    this.specialtyName,
    required this.startTime,
    required this.endTime,
    required this.totalPricePkr,
    required this.platformFeePkr,
    required this.payoutPkr,
    required this.urgency,
    required this.status,
    this.visibility,
    this.requirements,
    this.cityId,
    this.cityName,
    this.counterOfferAllowed,
    this.createdAt,
    this.skills,
    this.offers,
    this.myOffer,
  });

  factory Shift.fromJson(Map<String, dynamic> json) {
    List<ShiftSkill>? skills;
    if (json['skills'] is List) {
      skills =
          (json['skills'] as List).map((s) => ShiftSkill.fromJson(s)).toList();
    }
    List<Offer>? offers;
    if (json['offers'] is List) {
      offers = (json['offers'] as List).map((o) => Offer.fromJson(o)).toList();
    }
    Offer? myOffer;
    if (json['myOffer'] is Map<String, dynamic>) {
      myOffer = Offer.fromJson(json['myOffer']);
    } else if (json['my_offer'] is Map<String, dynamic>) {
      myOffer = Offer.fromJson(json['my_offer']);
    }

    return Shift(
      id: json['id'] ?? '',
      posterId: json['poster_id'] ?? json['posterId'] ?? '',
      posterName: json['poster_name'] ?? json['posterName'],
      posterPhone: json['poster_phone'] ?? json['posterPhone'],
      facilityLocationId:
          json['facility_location_id'] ?? json['facilityLocationId'],
      facilityName: json['facility_name'] ?? json['facilityName'],
      locationName: json['location_name'] ?? json['locationName'],
      locationAddress: json['location_address'] ?? json['locationAddress'],
      locationLatitude:
          _toDouble(json['location_latitude'] ?? json['locationLatitude']),
      locationLongitude:
          _toDouble(json['location_longitude'] ?? json['locationLongitude']),
      type: json['type'] ?? 'replacement',
      title: json['title'] ?? '',
      description: json['description'],
      department: json['department'],
      roleId: json['role_id'] ?? json['roleId'],
      roleName: json['role_name'] ?? json['roleName'],
      specialtyId: json['specialty_id'] ?? json['specialtyId'],
      specialtyName: json['specialty_name'] ?? json['specialtyName'],
      startTime: json['start_time'] ?? json['startTime'] ?? '',
      endTime: json['end_time'] ?? json['endTime'] ?? '',
      totalPricePkr:
          _toDouble(json['total_price_pkr'] ?? json['totalPricePkr']) ?? 0,
      platformFeePkr:
          _toDouble(json['platform_fee_pkr'] ?? json['platformFeePkr']) ?? 0,
      payoutPkr: _toDouble(json['payout_pkr'] ?? json['payoutPkr']) ?? 0,
      urgency: json['urgency'] ?? 'normal',
      status: json['status'] ?? 'open',
      visibility: json['visibility'],
      requirements: json['requirements'],
      cityId: json['city_id'] ?? json['cityId'],
      cityName: json['city_name'] ?? json['cityName'],
      counterOfferAllowed: json['counter_offer_allowed'] == 1 ||
          json['counter_offer_allowed'] == true,
      createdAt: json['created_at'] ?? json['createdAt'],
      skills: skills,
      offers: offers,
      myOffer: myOffer,
    );
  }

  Map<String, dynamic> toJson() => {
        'title': title,
        'type': type,
        if (description != null) 'description': description,
        if (department != null) 'department': department,
        if (roleId != null) 'roleId': roleId,
        if (specialtyId != null) 'specialtyId': specialtyId,
        if (facilityLocationId != null)
          'facilityLocationId': facilityLocationId,
        'startTime': startTime,
        'endTime': endTime,
        'totalPricePkr': totalPricePkr,
        'urgency': urgency,
        if (visibility != null) 'visibility': visibility,
        if (requirements != null) 'requirements': requirements,
        if (cityId != null) 'cityId': cityId,
        'counterOfferAllowed': counterOfferAllowed ?? false,
      };

  bool get isOpen => status == 'open';
  bool get isUrgent => urgency == 'urgent' || urgency == 'critical';
  bool get isCritical => urgency == 'critical';

  static double? _toDouble(dynamic val) {
    if (val == null) return null;
    if (val is double) return val;
    if (val is int) return val.toDouble();
    if (val is String) return double.tryParse(val);
    return null;
  }
}

class ShiftSkill {
  final String? shiftId;
  final String skillId;
  final String? skillName;

  ShiftSkill({this.shiftId, required this.skillId, this.skillName});

  factory ShiftSkill.fromJson(Map<String, dynamic> json) => ShiftSkill(
        shiftId: json['shift_id'],
        skillId: json['skill_id'] ?? json['id'] ?? '',
        skillName: json['skill_name'] ?? json['name'],
      );
}

class Offer {
  final String id;
  final String shiftId;
  final String doctorId;
  final String? doctorName;
  final String? doctorPhone;
  final String type;
  final double? counterAmountPkr;
  final String status;
  final String? dispatchedAt;
  final String? respondedAt;
  final String? createdAt;

  Offer({
    required this.id,
    required this.shiftId,
    required this.doctorId,
    this.doctorName,
    this.doctorPhone,
    required this.type,
    this.counterAmountPkr,
    required this.status,
    this.dispatchedAt,
    this.respondedAt,
    this.createdAt,
  });

  factory Offer.fromJson(Map<String, dynamic> json) => Offer(
        id: json['id'] ?? '',
        shiftId: json['shift_id'] ?? json['shiftId'] ?? '',
        doctorId: json['doctor_id'] ?? json['doctorId'] ?? '',
        doctorName: json['doctor_name'] ?? json['doctorName'],
        doctorPhone: json['doctor_phone'] ?? json['doctorPhone'],
        type: json['type'] ?? 'dispatch',
        counterAmountPkr: Shift._toDouble(
            json['counter_amount_pkr'] ?? json['counterAmountPkr']),
        status: json['status'] ?? 'pending',
        dispatchedAt: json['dispatched_at'],
        respondedAt: json['responded_at'],
        createdAt: json['created_at'],
      );

  bool get isPending => status == 'pending';
  bool get isCounter => type == 'counter';
}
