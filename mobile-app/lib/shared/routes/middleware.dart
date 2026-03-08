import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/core/services/auth_service.dart';
import 'package:docduty/shared/routes/app_routes.dart';

/// Middleware that requires authentication — redirects to sign-in if no session.
class AuthGuard extends GetMiddleware {
  @override
  int? get priority => 1;

  @override
  RouteSettings? redirect(String? route) {
    final auth = Get.find<AuthService>();
    if (!auth.isLoggedIn) {
      return const RouteSettings(name: Routes.SIGN_IN);
    }
    return null;
  }
}

/// Middleware that requires a specific role.
class RoleGuard extends GetMiddleware {
  final String requiredRole;
  RoleGuard(this.requiredRole);

  @override
  int? get priority => 2;

  @override
  RouteSettings? redirect(String? route) {
    final auth = Get.find<AuthService>();
    if (!auth.isLoggedIn) {
      return const RouteSettings(name: Routes.SIGN_IN);
    }
    if (auth.userRole != requiredRole) {
      return RouteSettings(name: Routes.shellForRole(auth.userRole));
    }
    return null;
  }
}

/// Middleware that redirects authenticated users away from auth screens.
class GuestGuard extends GetMiddleware {
  @override
  int? get priority => 1;

  @override
  RouteSettings? redirect(String? route) {
    final auth = Get.find<AuthService>();
    if (auth.isLoggedIn) {
      return RouteSettings(name: Routes.shellForRole(auth.userRole));
    }
    return null;
  }
}
