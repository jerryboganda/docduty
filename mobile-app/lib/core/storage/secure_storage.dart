import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:docduty/core/config/constants.dart';

/// Secure token and session storage for DocDuty.
/// Wraps flutter_secure_storage for platform-appropriate secure persistence.
class SecureStorage {
  static final SecureStorage _instance = SecureStorage._internal();
  factory SecureStorage() => _instance;
  SecureStorage._internal();

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  // --- Token Management ---

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: AppConstants.accessTokenKey, value: accessToken),
      _storage.write(key: AppConstants.refreshTokenKey, value: refreshToken),
    ]);
  }

  Future<String?> getAccessToken() async {
    return _storage.read(key: AppConstants.accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    return _storage.read(key: AppConstants.refreshTokenKey);
  }

  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: AppConstants.accessTokenKey, value: token);
  }

  // --- User Info ---

  Future<void> saveUserInfo({
    required String userId,
    required String role,
  }) async {
    await Future.wait([
      _storage.write(key: AppConstants.userIdKey, value: userId),
      _storage.write(key: AppConstants.userRoleKey, value: role),
    ]);
  }

  Future<String?> getUserId() async {
    return _storage.read(key: AppConstants.userIdKey);
  }

  Future<String?> getUserRole() async {
    return _storage.read(key: AppConstants.userRoleKey);
  }

  // --- Onboarding ---

  Future<void> setOnboardingComplete() async {
    await _storage.write(
      key: AppConstants.onboardingCompleteKey,
      value: 'true',
    );
  }

  Future<bool> isOnboardingComplete() async {
    final value = await _storage.read(key: AppConstants.onboardingCompleteKey);
    return value == 'true';
  }

  // --- Clear All ---

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: AppConstants.accessTokenKey),
      _storage.delete(key: AppConstants.refreshTokenKey),
    ]);
  }

  /// Check if user has a stored session
  Future<bool> hasSession() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
