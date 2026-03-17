import 'dart:io' show Platform;

/// Environment configuration for DocDuty mobile app.
/// API base URL and feature flags are configured here.
class Env {
  Env._();

  /// Compile-time override for API base URL.
  /// Pass --dart-define=API_BASE_URL=https://your-api.com/api at build time.
  static const String _apiBaseUrlOverride = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  /// Base URL for the DocDuty REST API.
  /// Uses compile-time override if set, otherwise detects platform:
  /// - Android emulator: 10.0.2.2
  /// - iOS simulator / desktop: localhost
  static String get apiBaseUrl {
    if (_apiBaseUrlOverride.isNotEmpty) return _apiBaseUrlOverride;
    final host = Platform.isAndroid ? '10.0.2.2' : 'localhost';
    return 'http://$host:3001/api';
  }

  /// Soketi/Pusher realtime configuration
  static const String soketiHost = String.fromEnvironment(
    'SOKETI_HOST',
    defaultValue: 'localhost',
  );
  static const int soketiPort = int.fromEnvironment(
    'SOKETI_PORT',
    defaultValue: 6001,
  );
  static const String soketiAppKey = String.fromEnvironment(
    'SOKETI_APP_KEY',
    defaultValue: 'app-key',
  );
  static const bool enableRealtime = bool.fromEnvironment(
    'ENABLE_REALTIME',
    defaultValue: false,
  );

  /// Google Maps API key
  static const String googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
    defaultValue: '',
  );

  /// Feature flags
  static const bool enableDebugLogging = bool.fromEnvironment(
    'DEBUG_LOGGING',
    defaultValue: true,
  );

  /// Polling intervals (milliseconds)
  static const int notificationPollInterval = 30000; // 30 seconds
  static const int messagePollInterval = 10000; // 10 seconds

  /// Pagination defaults
  static const int defaultPageSize = 20;
  static const int shiftFeedLimit = 50;
}
