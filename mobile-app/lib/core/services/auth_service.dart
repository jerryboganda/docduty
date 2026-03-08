import 'package:get/get.dart';
import 'package:docduty/core/network/api_client.dart';
import 'package:docduty/core/storage/secure_storage.dart';
import 'package:docduty/core/models/models.dart';

/// Centralized authentication service — manages login, register, tokens, user state.
class AuthService extends GetxService {
  final ApiClient _api = Get.find<ApiClient>();
  final SecureStorage _storage = SecureStorage();

  /// Reactive user — null if not logged in.
  final Rx<User?> currentUser = Rx<User?>(null);

  /// Derived convenience getters.
  bool get isLoggedIn => currentUser.value != null;
  String get userRole => currentUser.value?.role ?? '';
  String get userId => currentUser.value?.id ?? '';

  /// Initialize — check stored session on app start.
  Future<AuthService> init() async {
    final hasSession = await _storage.hasSession();
    if (hasSession) {
      try {
        await fetchCurrentUser();
      } catch (_) {
        await _storage.clearAll();
      }
    }
    return this;
  }

  /// Login with phone + password → returns user role for routing.
  Future<String> login(String phone, String password) async {
    final res = await _api.post('/auth/login', data: {
      'phone': phone,
      'password': password,
    });

    final user = User.fromJson(res['user'] ?? {});
    await _storage.saveTokens(
      accessToken: res['accessToken'] ?? '',
      refreshToken: res['refreshToken'] ?? '',
    );
    await _storage.saveUserInfo(userId: user.id, role: user.role);

    currentUser.value = user;
    return user.role;
  }

  /// Register a new account.
  Future<String> register({
    required String fullName,
    required String phone,
    required String password,
    required String role,
    String? email,
  }) async {
    final res = await _api.post('/auth/register', data: {
      'fullName': fullName,
      'phone': phone,
      'password': password,
      'role': role,
      if (email != null && email.isNotEmpty) 'email': email,
    });

    final user = User.fromJson(res['user'] ?? {});
    await _storage.saveTokens(
      accessToken: res['accessToken'] ?? '',
      refreshToken: res['refreshToken'] ?? '',
    );
    await _storage.saveUserInfo(userId: user.id, role: user.role);

    currentUser.value = user;
    return user.role;
  }

  /// Fetch the current user profile from the server.
  Future<void> fetchCurrentUser() async {
    final res = await _api.get('/auth/me');
    currentUser.value = User.fromJson(res['user'] ?? res);
  }

  /// Update profile (name, email, etc.).
  Future<void> updateProfile(Map<String, dynamic> data) async {
    await _api.put('/users/profile', data: data);
    await fetchCurrentUser();
  }

  /// Change password.
  Future<void> changePassword(
      String currentPassword, String newPassword) async {
    await _api.put('/auth/password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  /// Refresh token.
  Future<bool> refreshToken() async {
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) return false;

      final res = await _api.post('/auth/refresh', data: {
        'refreshToken': refreshToken,
      });
      await _storage.saveTokens(
        accessToken: res['accessToken'] ?? '',
        refreshToken: res['refreshToken'] ?? '',
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Logout — clear everything.
  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (_) {}
    await _storage.clearAll();
    currentUser.value = null;
  }

  /// Check if user profile is complete.
  bool get isProfileComplete {
    final user = currentUser.value;
    if (user == null) return false;
    if (user.role == 'doctor') {
      return user.doctorProfile != null &&
          user.doctorProfile!.specialtyId != null;
    }
    return true;
  }

  /// Get user's verification status.
  String get verificationStatus {
    final user = currentUser.value;
    if (user == null) return 'unverified';
    return user.verificationStatus;
  }

  /// Display name helper.
  String get displayName {
    final user = currentUser.value;
    if (user == null) return '';
    if (user.isDoctor) return user.doctorProfile?.fullName ?? user.phone;
    if (user.isFacilityAdmin) return user.facilityAccount?.name ?? user.phone;
    return user.phone;
  }
}
