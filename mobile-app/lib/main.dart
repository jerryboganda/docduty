import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';

import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/routes/app_pages.dart';
import 'package:docduty/core/network/api_client.dart';
import 'package:docduty/core/storage/secure_storage.dart';
import 'package:docduty/core/services/services.dart';
import 'package:docduty/core/services/connectivity_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ─── Global error handling ──────────────────────────────
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    debugPrint('FlutterError: ${details.exceptionAsString()}');
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    debugPrint('Unhandled error: $error\n$stack');
    return true;
  };

  // Lock portrait orientation
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // ─── Core singletons ────────────────────────────────────
  Get.put<SecureStorage>(SecureStorage(), permanent: true);
  Get.put<ApiClient>(ApiClient(), permanent: true);
  final authService = Get.put<AuthService>(AuthService(), permanent: true);
  await authService.init();

  // ─── Connectivity monitoring ────────────────────────────
  Get.put<ConnectivityService>(ConnectivityService(), permanent: true);

  // ─── Lazy domain services ───────────────────────────────
  Get.lazyPut<ReferenceService>(() => ReferenceService(), fenix: true);
  Get.lazyPut<ShiftService>(() => ShiftService(), fenix: true);
  Get.lazyPut<BookingService>(() => BookingService(), fenix: true);
  Get.lazyPut<WalletService>(() => WalletService(), fenix: true);
  Get.lazyPut<MessageService>(() => MessageService(), fenix: true);
  Get.lazyPut<NotificationService>(() => NotificationService(), fenix: true);
  Get.lazyPut<RatingService>(() => RatingService(), fenix: true);
  Get.lazyPut<DisputeService>(() => DisputeService(), fenix: true);
  Get.lazyPut<FacilityService>(() => FacilityService(), fenix: true);
  Get.lazyPut<AdminService>(() => AdminService(), fenix: true);
  Get.lazyPut<UploadService>(() => UploadService(), fenix: true);

  runApp(const DocDutyApp());
}

class DocDutyApp extends StatelessWidget {
  const DocDutyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ColorNotifier()),
      ],
      child: GetMaterialApp(
        title: "DocDuty",
        initialRoute: AppPages.INITIAL,
        getPages: AppPages.routes,
        debugShowCheckedModeBanner: false,
        defaultTransition: Transition.cupertino,
        transitionDuration: const Duration(milliseconds: 300),
        customTransition: _DocDutyTransition(),
        theme: ThemeData(
          useMaterial3: false,
          splashColor: Colors.transparent,
          highlightColor: Colors.transparent,
          hoverColor: Colors.transparent,
          fontFamily: "Gilroy",
          appBarTheme: const AppBarTheme(
            elevation: 0,
            centerTitle: true,
            scrolledUnderElevation: 0,
          ),
        ),
      ),
    );
  }
}

/// Custom page transition: slide up + fade — feels premium & iOS-native.
class _DocDutyTransition extends CustomTransition {
  @override
  Widget buildTransition(
    BuildContext context,
    Curve? curve,
    Alignment? alignment,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final tween = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).chain(CurveTween(curve: Curves.easeOutCubic));

    return FadeTransition(
      opacity: animation,
      child: SlideTransition(
        position: animation.drive(tween),
        child: child,
      ),
    );
  }
}
