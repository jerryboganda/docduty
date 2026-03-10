import 'package:dio/dio.dart';
import 'package:get/get.dart' hide Response, FormData, MultipartFile;
import 'package:docduty/core/config/env.dart';
import 'package:docduty/core/errors/app_exception.dart';
import 'package:docduty/core/storage/secure_storage.dart';

/// Dio-based REST API client for DocDuty.
/// Mirrors the web client pattern: bearer token injection, 401 refresh retry,
/// typed convenience methods.
class ApiClient extends GetxService {
  late final Dio _dio;
  final SecureStorage _storage = SecureStorage();
  bool _isRefreshing = false;

  @override
  void onInit() {
    super.onInit();
    _dio = Dio(BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Auth interceptor — injects bearer token + handles 401 refresh
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        if (!options.extra.containsKey('skipAuth')) {
          final token = await _storage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401 &&
            !error.requestOptions.extra.containsKey('isRetry') &&
            !error.requestOptions.extra.containsKey('skipAuth')) {
          // Attempt token refresh
          final refreshed = await _attemptRefresh();
          if (refreshed) {
            // Retry original request with new token
            final token = await _storage.getAccessToken();
            final opts = error.requestOptions;
            opts.headers['Authorization'] = 'Bearer $token';
            opts.extra['isRetry'] = true;
            try {
              final response = await _dio.fetch(opts);
              return handler.resolve(response);
            } catch (e) {
              return handler.reject(
                DioException(requestOptions: opts, error: e),
              );
            }
          } else {
            // Refresh failed — force logout
            await _storage.clearAll();
            Get.offAllNamed('/sign-in');
            return handler.reject(error);
          }
        }
        handler.next(error);
      },
    ));

    // Debug logging interceptor
    if (Env.enableDebugLogging) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (msg) => print('[API] $msg'),
      ));
    }
  }

  /// Attempt to refresh the access token using stored refresh token.
  Future<bool> _attemptRefresh() async {
    if (_isRefreshing) return false;
    _isRefreshing = true;
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await Dio(BaseOptions(
        baseUrl: Env.apiBaseUrl,
        headers: {'Content-Type': 'application/json'},
      )).post('/auth/refresh', data: {'refreshToken': refreshToken});

      if (response.statusCode == 200 && response.data['accessToken'] != null) {
        await _storage.saveAccessToken(response.data['accessToken']);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    } finally {
      _isRefreshing = false;
    }
  }

  // --- Convenience methods ---

  /// GET request. Returns response data.
  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
  }) async {
    try {
      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
        options: skipAuth ? Options(extra: {'skipAuth': true}) : null,
      );
      return _extractData(response);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// POST request. Returns response data.
  Future<Map<String, dynamic>> post(
    String path, {
    dynamic data,
    bool skipAuth = false,
  }) async {
    try {
      final response = await _dio.post(
        path,
        data: data,
        options: skipAuth ? Options(extra: {'skipAuth': true}) : null,
      );
      return _extractData(response);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// PUT request. Returns response data.
  Future<Map<String, dynamic>> put(
    String path, {
    dynamic data,
    bool skipAuth = false,
  }) async {
    try {
      final response = await _dio.put(
        path,
        data: data,
        options: skipAuth ? Options(extra: {'skipAuth': true}) : null,
      );
      return _extractData(response);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// DELETE request. Returns response data.
  Future<Map<String, dynamic>> delete(
    String path, {
    bool skipAuth = false,
  }) async {
    try {
      final response = await _dio.delete(
        path,
        options: skipAuth ? Options(extra: {'skipAuth': true}) : null,
      );
      return _extractData(response);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Upload a file (e.g., avatar). Uses multipart/form-data.
  Future<Map<String, dynamic>> upload(
    String path, {
    required List<int> bytes,
    required String filename,
    String fieldName = 'avatar',
  }) async {
    try {
      final formData = FormData.fromMap({
        fieldName: MultipartFile.fromBytes(
          bytes,
          filename: filename,
        ),
      });
      final response = await _dio.post(path, data: formData);
      return _extractData(response);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// Extract data from response — handles both `{data: ...}` wrapper and direct response.
  Map<String, dynamic> _extractData(Response response) {
    if (response.data is Map<String, dynamic>) {
      return response.data as Map<String, dynamic>;
    }
    return {'data': response.data};
  }

  /// Convert DioException to typed AppException.
  AppException _handleDioError(DioException error) {
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return NetworkException('Connection timed out. Please try again.');
    }

    if (error.type == DioExceptionType.connectionError) {
      return NetworkException();
    }

    final statusCode = error.response?.statusCode;
    final responseData = error.response?.data;
    final message = responseData is Map
        ? (responseData['error'] ?? responseData['message'] ?? '')
        : '';

    switch (statusCode) {
      case 400:
        return ValidationException(
            message.isNotEmpty ? message : 'Invalid request.');
      case 401:
        return AuthException(
            message.isNotEmpty ? message : 'Authentication failed.');
      case 403:
        return ForbiddenException(
            message.isNotEmpty ? message : 'Access denied.');
      case 404:
        return NotFoundException(message.isNotEmpty ? message : 'Not found.');
      case 429:
        return RateLimitException();
      default:
        if (statusCode != null && statusCode >= 500) {
          return ServerException();
        }
        return AppException(
          message.isNotEmpty ? message : 'An unexpected error occurred.',
          statusCode: statusCode,
        );
    }
  }
}
