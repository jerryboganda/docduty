/// User, DoctorProfile, FacilityAccount, FacilityLocation, UserPreferences models.
/// Maps to users, doctor_profiles, facility_accounts, facility_locations, user_preferences tables.

class User {
  final String id;
  final String phone;
  final String role;
  final String status;
  final String verificationStatus;
  final String? email;
  final String? avatarUrl;
  final String? createdAt;
  final String? updatedAt;
  final DoctorProfile? doctorProfile;
  final FacilityAccount? facilityAccount;

  User({
    required this.id,
    required this.phone,
    required this.role,
    required this.status,
    required this.verificationStatus,
    this.email,
    this.avatarUrl,
    this.createdAt,
    this.updatedAt,
    this.doctorProfile,
    this.facilityAccount,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    DoctorProfile? doctorProfile;
    FacilityAccount? facilityAccount;

    if (json['profile'] is Map<String, dynamic>) {
      final profile = json['profile'] as Map<String, dynamic>;
      if (json['role'] == 'doctor') {
        doctorProfile = DoctorProfile.fromJson(profile);
      } else if (json['role'] == 'facility_admin') {
        facilityAccount = FacilityAccount.fromJson(profile);
      }
    }
    if (json['doctorProfile'] is Map<String, dynamic>) {
      doctorProfile = DoctorProfile.fromJson(json['doctorProfile']);
    }
    if (json['facilityAccount'] is Map<String, dynamic>) {
      facilityAccount = FacilityAccount.fromJson(json['facilityAccount']);
    }

    return User(
      id: json['id'] ?? '',
      phone: json['phone'] ?? '',
      role: json['role'] ?? '',
      status: json['status'] ?? 'pending',
      verificationStatus: json['verification_status'] ??
          json['verificationStatus'] ??
          'unverified',
      email: json['email'],
      avatarUrl: json['avatar_url'] ?? json['avatarUrl'],
      createdAt: json['created_at'] ?? json['createdAt'],
      updatedAt: json['updated_at'] ?? json['updatedAt'],
      doctorProfile: doctorProfile,
      facilityAccount: facilityAccount,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        'role': role,
        'status': status,
        'verificationStatus': verificationStatus,
        if (email != null) 'email': email,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
      };

  bool get isDoctor => role == 'doctor';
  bool get isFacilityAdmin => role == 'facility_admin';
  bool get isPlatformAdmin => role == 'platform_admin';
  bool get isActive => status == 'active';
  bool get isVerified => verificationStatus == 'verified';

  /// Convenience — doctor fullName, facility name, or phone.
  String get fullName =>
      doctorProfile?.fullName ?? facilityAccount?.name ?? phone;
}

class DoctorProfile {
  final String? id;
  final String? userId;
  final String? fullName;
  final String? cnic;
  final String? pmdcLicense;
  final String? specialtyId;
  final String? specialtyName;
  final String? cityId;
  final String? cityName;
  final String? provinceName;
  final int? coverageRadiusKm;
  final String? availabilityStatus;
  final String? bio;
  final int? experienceYears;
  final double? reliabilityScore;
  final double? ratingAvg;
  final int? ratingCount;
  final int? totalShiftsCompleted;
  final List<String>? skillIds;
  final List<Map<String, dynamic>>? skills;

  DoctorProfile({
    this.id,
    this.userId,
    this.fullName,
    this.cnic,
    this.pmdcLicense,
    this.specialtyId,
    this.specialtyName,
    this.cityId,
    this.cityName,
    this.provinceName,
    this.coverageRadiusKm,
    this.availabilityStatus,
    this.bio,
    this.experienceYears,
    this.reliabilityScore,
    this.ratingAvg,
    this.ratingCount,
    this.totalShiftsCompleted,
    this.skillIds,
    this.skills,
  });

  factory DoctorProfile.fromJson(Map<String, dynamic> json) {
    List<String>? skillIds;
    List<Map<String, dynamic>>? skills;
    if (json['skills'] is List) {
      skills = (json['skills'] as List).cast<Map<String, dynamic>>();
      skillIds = skills
          .map((s) => s['id']?.toString() ?? s['skill_id']?.toString() ?? '')
          .toList();
    }
    if (json['skillIds'] is List) {
      skillIds = (json['skillIds'] as List).cast<String>();
    }

    return DoctorProfile(
      id: json['id'],
      userId: json['user_id'] ?? json['userId'],
      fullName: json['full_name'] ?? json['fullName'],
      cnic: json['cnic'],
      pmdcLicense: json['pmdc_license'] ?? json['pmdcLicense'],
      specialtyId: json['specialty_id'] ?? json['specialtyId'],
      specialtyName: json['specialty_name'] ?? json['specialtyName'],
      cityId: json['city_id'] ?? json['cityId'],
      cityName: json['city_name'] ?? json['cityName'],
      provinceName: json['province_name'] ?? json['provinceName'],
      coverageRadiusKm: json['coverage_radius_km'] ?? json['coverageRadiusKm'],
      availabilityStatus: json['availability_status'] ??
          json['availabilityStatus'] ??
          'available',
      bio: json['bio'],
      experienceYears: json['experience_years'] ?? json['experienceYears'],
      reliabilityScore:
          _toDouble(json['reliability_score'] ?? json['reliabilityScore']),
      ratingAvg: _toDouble(json['rating_avg'] ?? json['ratingAvg']),
      ratingCount: json['rating_count'] ?? json['ratingCount'],
      totalShiftsCompleted:
          json['total_shifts_completed'] ?? json['totalShiftsCompleted'],
      skillIds: skillIds,
      skills: skills,
    );
  }

  Map<String, dynamic> toJson() => {
        if (fullName != null) 'fullName': fullName,
        if (cnic != null) 'cnic': cnic,
        if (pmdcLicense != null) 'pmdcLicense': pmdcLicense,
        if (specialtyId != null) 'specialtyId': specialtyId,
        if (cityId != null) 'cityId': cityId,
        if (coverageRadiusKm != null) 'coverageRadiusKm': coverageRadiusKm,
        if (availabilityStatus != null)
          'availabilityStatus': availabilityStatus,
        if (bio != null) 'bio': bio,
        if (experienceYears != null) 'experienceYears': experienceYears,
        if (skillIds != null) 'skillIds': skillIds,
      };

  static double? _toDouble(dynamic val) {
    if (val == null) return null;
    if (val is double) return val;
    if (val is int) return val.toDouble();
    if (val is String) return double.tryParse(val);
    return null;
  }
}

class FacilityAccount {
  final String? id;
  final String? userId;
  final String? name;
  final String? registrationNumber;
  final String? type;
  final String? cityId;
  final String? cityName;
  final String? provinceName;
  final String? verificationStatus;
  final double? ratingAvg;
  final int? ratingCount;
  final List<FacilityLocation>? locations;

  FacilityAccount({
    this.id,
    this.userId,
    this.name,
    this.registrationNumber,
    this.type,
    this.cityId,
    this.cityName,
    this.provinceName,
    this.verificationStatus,
    this.ratingAvg,
    this.ratingCount,
    this.locations,
  });

  factory FacilityAccount.fromJson(Map<String, dynamic> json) {
    List<FacilityLocation>? locations;
    if (json['locations'] is List) {
      locations = (json['locations'] as List)
          .map((l) => FacilityLocation.fromJson(l))
          .toList();
    }

    return FacilityAccount(
      id: json['id'],
      userId: json['user_id'] ?? json['userId'],
      name: json['name'],
      registrationNumber:
          json['registration_number'] ?? json['registrationNumber'],
      type: json['type'],
      cityId: json['city_id'] ?? json['cityId'],
      cityName: json['city_name'] ?? json['cityName'],
      provinceName: json['province_name'] ?? json['provinceName'],
      verificationStatus:
          json['verification_status'] ?? json['verificationStatus'],
      ratingAvg:
          DoctorProfile._toDouble(json['rating_avg'] ?? json['ratingAvg']),
      ratingCount: json['rating_count'] ?? json['ratingCount'],
      locations: locations,
    );
  }

  Map<String, dynamic> toJson() => {
        if (name != null) 'name': name,
        if (registrationNumber != null)
          'registrationNumber': registrationNumber,
        if (type != null) 'type': type,
        if (cityId != null) 'cityId': cityId,
      };
}

class FacilityLocation {
  final String id;
  final String? facilityId;
  final String? name;
  final String? address;
  final double? latitude;
  final double? longitude;
  final int? geofenceRadiusM;
  final String? qrSecret;
  final int? qrRotateIntervalMin;
  final bool? isActive;
  final String? createdAt;

  FacilityLocation({
    required this.id,
    this.facilityId,
    this.name,
    this.address,
    this.latitude,
    this.longitude,
    this.geofenceRadiusM,
    this.qrSecret,
    this.qrRotateIntervalMin,
    this.isActive,
    this.createdAt,
  });

  factory FacilityLocation.fromJson(Map<String, dynamic> json) =>
      FacilityLocation(
        id: json['id'] ?? '',
        facilityId: json['facility_id'],
        name: json['name'],
        address: json['address'],
        latitude: DoctorProfile._toDouble(json['latitude']),
        longitude: DoctorProfile._toDouble(json['longitude']),
        geofenceRadiusM: json['geofence_radius_m'],
        qrSecret: json['qr_secret'],
        qrRotateIntervalMin: json['qr_rotate_interval_min'],
        isActive: json['is_active'] == 1 || json['is_active'] == true,
        createdAt: json['created_at'],
      );

  Map<String, dynamic> toJson() => {
        if (name != null) 'name': name,
        if (address != null) 'address': address,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (geofenceRadiusM != null) 'geofenceRadiusM': geofenceRadiusM,
      };
}

class UserPreferences {
  final bool pushNotifications;
  final bool smsNotifications;
  final bool emailNotifications;
  final bool marketingEmails;
  final String profileVisibility;
  final bool showOnlineStatus;

  UserPreferences({
    this.pushNotifications = true,
    this.smsNotifications = true,
    this.emailNotifications = true,
    this.marketingEmails = false,
    this.profileVisibility = 'public',
    this.showOnlineStatus = true,
  });

  factory UserPreferences.fromJson(Map<String, dynamic> json) =>
      UserPreferences(
        pushNotifications: json['push_notifications'] == 1 ||
            json['push_notifications'] == true,
        smsNotifications:
            json['sms_notifications'] == 1 || json['sms_notifications'] == true,
        emailNotifications: json['email_notifications'] == 1 ||
            json['email_notifications'] == true,
        marketingEmails:
            json['marketing_emails'] == 1 || json['marketing_emails'] == true,
        profileVisibility: json['profile_visibility'] ?? 'public',
        showOnlineStatus: json['show_online_status'] == 1 ||
            json['show_online_status'] == true,
      );

  Map<String, dynamic> toJson() => {
        'pushNotifications': pushNotifications,
        'smsNotifications': smsNotifications,
        'emailNotifications': emailNotifications,
        'marketingEmails': marketingEmails,
        'profileVisibility': profileVisibility,
        'showOnlineStatus': showOnlineStatus,
      };
}
