import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/widgets/pressable_scale.dart';

/// Primary action button matching the DocDuty UI kit design pattern.
/// Wrapped in PressableScale for premium press feedback + haptic.
class CustomButton extends StatelessWidget {
  final String text;
  final BorderRadius radius;
  final VoidCallback onPressed;
  final Color color;
  final Color textcolor;

  const CustomButton({
    super.key,
    required this.text,
    required this.radius,
    required this.onPressed,
    required this.color,
    required this.textcolor,
  });

  @override
  Widget build(BuildContext context) {
    return PressableScale(
      onTap: () {
        HapticFeedback.lightImpact();
        onPressed();
      },
      child: Container(
        width: double.infinity,
        height: Get.height / 15,
        decoration: BoxDecoration(
          color: color,
          borderRadius: radius,
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: Text(
            text,
            style: TextStyle(
              fontFamily: "Gilroy",
              color: textcolor,
              fontSize: Get.height / 55,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}
