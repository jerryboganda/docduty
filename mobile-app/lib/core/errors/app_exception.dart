/// Typed exceptions for DocDuty mobile app.
/// Maps backend error patterns to user-friendly handling.

class AppException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  AppException(this.message, {this.statusCode, this.data});

  @override
  String toString() => 'AppException($statusCode): $message';
}

/// Thrown on network connectivity issues.
class NetworkException extends AppException {
  NetworkException(
      [String message = 'No internet connection. Please check your network.'])
      : super(message, statusCode: 0);
}

/// Thrown on 401 when refresh also fails — user must re-login.
class AuthException extends AppException {
  AuthException([String message = 'Session expired. Please sign in again.'])
      : super(message, statusCode: 401);
}

/// Thrown on 403 — user doesn't have the required role.
class ForbiddenException extends AppException {
  ForbiddenException(
      [String message = 'You do not have permission to perform this action.'])
      : super(message, statusCode: 403);
}

/// Thrown on 422 / 400 — validation failed.
class ValidationException extends AppException {
  ValidationException(String message) : super(message, statusCode: 422);
}

/// Thrown on 404 — resource not found.
class NotFoundException extends AppException {
  NotFoundException([String message = 'The requested resource was not found.'])
      : super(message, statusCode: 404);
}

/// Thrown on 429 — rate limited.
class RateLimitException extends AppException {
  RateLimitException(
      [String message = 'Too many requests. Please try again later.'])
      : super(message, statusCode: 429);
}

/// Thrown on 5xx server errors.
class ServerException extends AppException {
  ServerException([String message = 'Server error. Please try again later.'])
      : super(message, statusCode: 500);
}
