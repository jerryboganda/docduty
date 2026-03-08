import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/features/auth/controllers/splash_controller.dart';

class SplashView extends GetView<SplashController> {
  const SplashView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.isDark
          ? const Color(0xff030303)
          : const Color(0xFF0165FC),
      body: Center(
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.0, end: 1.0),
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeOutCubic,
          builder: (context, value, child) {
            return Opacity(
              opacity: value,
              child: Transform.scale(
                scale: 0.8 + (0.2 * value),
                child: child,
              ),
            );
          },
          child: SizedBox(
            height: Get.height / 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.asset(
                  "assets/images/Group.png",
                  color: controller.notifier.getBgColor,
                ),
                SizedBox(width: Get.width / 40),
                Text(
                  "DocDuty",
                  style: TextStyle(
                    fontFamily: "Gilroy",
                    color: controller.notifier.getBgColor,
                    fontWeight: FontWeight.w500,
                    fontSize: Get.height / 30,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
