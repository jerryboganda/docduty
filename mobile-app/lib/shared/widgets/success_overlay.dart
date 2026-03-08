import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

/// Full-screen success overlay with animated checkmark + confetti.
/// Shows a celebration after key actions (booking confirmed, payout requested).
///
/// ```dart
/// SuccessOverlay.show(
///   context,
///   title: 'Booking Confirmed!',
///   subtitle: 'Your shift has been booked successfully.',
///   onDismiss: () => Get.offAllNamed('/home'),
/// );
/// ```
class SuccessOverlay extends StatefulWidget {
  final String title;
  final String subtitle;
  final VoidCallback? onDismiss;
  final Duration displayDuration;

  const SuccessOverlay({
    super.key,
    required this.title,
    required this.subtitle,
    this.onDismiss,
    this.displayDuration = const Duration(seconds: 2),
  });

  /// Convenience method to show the overlay as a full-screen dialog.
  static Future<void> show(
    BuildContext context, {
    required String title,
    required String subtitle,
    VoidCallback? onDismiss,
  }) {
    HapticFeedback.mediumImpact();
    return showGeneralDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black54,
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, anim1, anim2) => SuccessOverlay(
        title: title,
        subtitle: subtitle,
        onDismiss: onDismiss,
      ),
      transitionBuilder: (context, anim1, anim2, child) {
        return FadeTransition(
          opacity: anim1,
          child: ScaleTransition(
            scale: CurvedAnimation(parent: anim1, curve: Curves.easeOutBack),
            child: child,
          ),
        );
      },
    );
  }

  @override
  State<SuccessOverlay> createState() => _SuccessOverlayState();
}

class _SuccessOverlayState extends State<SuccessOverlay>
    with TickerProviderStateMixin {
  late final AnimationController _checkController;
  late final AnimationController _confettiController;
  late final Animation<double> _checkScale;
  late final Animation<double> _checkOpacity;

  @override
  void initState() {
    super.initState();

    _checkController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _confettiController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _checkScale = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _checkController, curve: Curves.elasticOut),
    );
    _checkOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _checkController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );

    _checkController.forward();
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) _confettiController.forward();
    });

    // Auto-dismiss
    Future.delayed(widget.displayDuration, () {
      if (mounted) {
        Navigator.of(context).pop();
        widget.onDismiss?.call();
      }
    });
  }

  @override
  void dispose() {
    _checkController.dispose();
    _confettiController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Animated checkmark circle
            AnimatedBuilder(
              animation: _checkController,
              builder: (context, child) => Transform.scale(
                scale: _checkScale.value,
                child: Opacity(
                  opacity: _checkOpacity.value,
                  child: Container(
                    width: Get.width / 4,
                    height: Get.width / 4,
                    decoration: const BoxDecoration(
                      color: Color(0xFF22C55E),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check_rounded,
                      color: Colors.white,
                      size: Get.width / 7,
                    ),
                  ),
                ),
              ),
            ),

            SizedBox(height: Get.height / 30),

            // Title
            Text(
              widget.title,
              style: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 35,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),

            SizedBox(height: Get.height / 80),

            // Subtitle
            Padding(
              padding: EdgeInsets.symmetric(horizontal: Get.width / 8),
              child: Text(
                widget.subtitle,
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 55,
                  color: Colors.white70,
                ),
                textAlign: TextAlign.center,
              ),
            ),

            SizedBox(height: Get.height / 20),

            // Mini confetti particles
            SizedBox(
              width: Get.width * 0.6,
              height: 60,
              child: AnimatedBuilder(
                animation: _confettiController,
                builder: (context, _) => CustomPaint(
                  painter: _ConfettiPainter(
                    progress: _confettiController.value,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Lightweight confetti painter — no external packages needed.
class _ConfettiPainter extends CustomPainter {
  final double progress;
  final List<_ConfettiParticle> _particles;

  _ConfettiPainter({required this.progress})
      : _particles = List.generate(
          20,
          (i) => _ConfettiParticle(i),
        );

  @override
  void paint(Canvas canvas, Size size) {
    for (final p in _particles) {
      final paint = Paint()
        ..color = p.color.withOpacity((1 - progress).clamp(0.0, 1.0))
        ..style = PaintingStyle.fill;

      final x = size.width * p.xRatio + sin(progress * pi * 2 + p.phase) * 20;
      final y = size.height * p.yStart + progress * size.height * p.speed;

      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(center: Offset(x, y), width: p.w, height: p.h),
          const Radius.circular(2),
        ),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

class _ConfettiParticle {
  late final double xRatio;
  late final double yStart;
  late final double speed;
  late final double phase;
  late final double w;
  late final double h;
  late final Color color;

  static const _colors = [
    Color(0xFF0165FC),
    Color(0xFF22C55E),
    Color(0xFFF59E0B),
    Color(0xFFEF4444),
    Color(0xFF8B5CF6),
    Color(0xFFEC4899),
  ];

  _ConfettiParticle(int index) {
    final rng = Random(index * 42);
    xRatio = rng.nextDouble();
    yStart = rng.nextDouble() * -0.5;
    speed = 0.5 + rng.nextDouble() * 1.5;
    phase = rng.nextDouble() * pi * 2;
    w = 4 + rng.nextDouble() * 6;
    h = 3 + rng.nextDouble() * 5;
    color = _colors[rng.nextInt(_colors.length)];
  }
}
