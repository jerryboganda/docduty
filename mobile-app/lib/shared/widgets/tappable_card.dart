import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';

/// A premium card wrapper with elevation, border radius, scale-on-press
/// and haptic feedback. Replaces raw `GestureDetector → Container(BoxDecoration)`.
///
/// ```dart
/// TappableCard(
///   onTap: () => Get.toNamed('/shift/123'),
///   child: Row(...),
/// )
/// ```
class TappableCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double? borderRadius;
  final Color? backgroundColor;
  final BoxBorder? border;
  final List<BoxShadow>? boxShadow;
  final bool enableHaptic;

  const TappableCard({
    super.key,
    required this.child,
    this.onTap,
    this.onLongPress,
    this.padding,
    this.margin,
    this.borderRadius,
    this.backgroundColor,
    this.border,
    this.boxShadow,
    this.enableHaptic = true,
  });

  @override
  State<TappableCard> createState() => _TappableCardState();
}

class _TappableCardState extends State<TappableCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
      reverseDuration: const Duration(milliseconds: 200),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails _) => _controller.forward();
  void _onTapUp(TapUpDetails _) => _controller.reverse();
  void _onTapCancel() => _controller.reverse();

  void _onTap() {
    if (widget.enableHaptic) {
      HapticFeedback.lightImpact();
    }
    widget.onTap?.call();
  }

  @override
  Widget build(BuildContext context) {
    final notifier = Provider.of<ColorNotifier>(context, listen: false);
    final radius = widget.borderRadius ?? Get.height / 50;

    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) => Transform.scale(
        scale: _scaleAnimation.value,
        child: child,
      ),
      child: GestureDetector(
        onTapDown: widget.onTap != null ? _onTapDown : null,
        onTapUp: widget.onTap != null ? _onTapUp : null,
        onTapCancel: widget.onTap != null ? _onTapCancel : null,
        onTap: widget.onTap != null ? _onTap : null,
        onLongPress: widget.onLongPress,
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: widget.padding ?? EdgeInsets.all(Get.width / 25),
          margin: widget.margin ??
              EdgeInsets.symmetric(
                horizontal: Get.width / 25,
                vertical: Get.height / 150,
              ),
          decoration: BoxDecoration(
            color: widget.backgroundColor ?? notifier.cardBg,
            borderRadius: BorderRadius.circular(radius),
            border: widget.border ??
                Border.all(color: notifier.dividerColor.withOpacity(0.5)),
            boxShadow: widget.boxShadow ??
                [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
          ),
          child: widget.child,
        ),
      ),
    );
  }
}
