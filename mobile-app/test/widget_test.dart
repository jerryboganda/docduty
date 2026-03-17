import 'package:flutter_test/flutter_test.dart';
import 'package:docduty/shared/routes/app_pages.dart';
import 'package:docduty/shared/routes/app_routes.dart';

void main() {
  test('role shell routing returns correct entry points', () {
    expect(Routes.shellForRole('doctor'), Routes.DOCTOR_SHELL);
    expect(Routes.shellForRole('facility_admin'), Routes.FACILITY_SHELL);
    expect(Routes.shellForRole('platform_admin'), Routes.ADMIN_DASHBOARD);
    expect(Routes.shellForRole('unknown_role'), Routes.SIGN_IN);
  });

  test('critical role routes are registered in AppPages', () {
    final routeNames = AppPages.routes.map((page) => page.name).toSet();

    expect(routeNames.contains(Routes.SPLASH), true);
    expect(routeNames.contains(Routes.SIGN_IN), true);
    expect(routeNames.contains(Routes.DOCTOR_SHELL), true);
    expect(routeNames.contains(Routes.FACILITY_SHELL), true);
    expect(routeNames.contains(Routes.ADMIN_DASHBOARD), true);
    expect(routeNames.contains(Routes.MESSAGES), true);
    expect(routeNames.contains(Routes.NOTIFICATIONS), true);
  });
}
