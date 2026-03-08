import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

/// A submit button that shows loading state with smooth transition.
/// Replaces the pattern: `isLoading ? CircularProgressIndicator : CustomButton`.
///
/// ```dart
/// AnimatedSubmitButton(
///   text: 'Confirm Booking',
///   isLoading: controller.isSubmitting.value,
///   onPressed: controller.submit,
///   color: notifier.primaryBlue,
/// )
/// ```
class AnimatedSubmitButton extends StatelessWidget {
  final String text;
  final bool isLoading;
  final VoidCallback? onPressed;
  final Color color;
  final Color textColor;
  final double? width;
  final BorderRadius? borderRadius;

  const AnimatedSubmitButton({
    super.key,
    required this.text,
    required this.isLoading,
    required this.onPressed,
    this.color = const Color(0xFF0165FC),
    this.textColor = Colors.white,
    this.width,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.circular(Get.height / 50);

    return GestureDetector(
      onTap: isLoading
          ? null
          : () {
              HapticFeedback.lightImpact();
              onPressed?.call();
            },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        width: isLoading ? Get.height / 13 : (width ?? double.infinity),
        height: Get.height / 15,
        decoration: BoxDecoration(
          color: isLoading ? color.withOpacity(0.8) : color,
          borderRadius:
              isLoading ? BorderRadius.circular(Get.height / 15) : radius,
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.3),
              blurRadius: isLoading ? 4 : 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: isLoading
                ? SizedBox(
                    key: const ValueKey('loading'),
                    width: Get.height / 35,
                    height: Get.height / 35,
                    child: const CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation(Colors.white),
                    ),
                  )
                : Text(
                    text,
                    key: ValueKey('text_$text'),
                    style: TextStyle(
                      fontFamily: "Gilroy",
                      color: textColor,
                      fontSize: Get.height / 55,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}
