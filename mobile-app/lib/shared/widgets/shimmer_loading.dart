import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';

/// Shimmer loading placeholder — replaces bare CircularProgressIndicator.
///
/// ```dart
/// // Show 5 shimmer rows while loading:
/// ShimmerLoading(itemCount: 5)
///
/// // Custom shimmer shape:
/// ShimmerLoading.custom(child: MyCustomShimmerLayout())
/// ```
class ShimmerLoading extends StatefulWidget {
  final int itemCount;
  final double? itemHeight;
  final Widget? customChild;

  const ShimmerLoading({
    super.key,
    this.itemCount = 5,
    this.itemHeight,
    this.customChild,
  });

  /// Factory for custom shimmer content.
  const ShimmerLoading.custom({
    super.key,
    required Widget child,
  })  : customChild = child,
        itemCount = 1,
        itemHeight = null;

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    _animation = Tween<double>(begin: -2, end: 2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final notifier = Provider.of<ColorNotifier>(context, listen: true);

    if (widget.customChild != null) {
      return AnimatedBuilder(
        animation: _animation,
        builder: (context, child) => ShaderMask(
          shaderCallback: (bounds) => LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              notifier.shimmerBase,
              notifier.shimmerHighlight,
              notifier.shimmerBase,
            ],
            stops: [
              (_animation.value - 1).clamp(0.0, 1.0),
              _animation.value.clamp(0.0, 1.0),
              (_animation.value + 1).clamp(0.0, 1.0),
            ],
            transform: _SlidingGradientTransform(_animation.value),
          ).createShader(bounds),
          blendMode: BlendMode.srcATop,
          child: widget.customChild,
        ),
      );
    }

    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      padding: EdgeInsets.symmetric(
        horizontal: Get.width / 25,
        vertical: Get.height / 80,
      ),
      itemCount: widget.itemCount,
      itemBuilder: (context, index) => AnimatedBuilder(
        animation: _animation,
        builder: (context, child) => Container(
          margin: EdgeInsets.only(bottom: Get.height / 80),
          padding: EdgeInsets.all(Get.width / 25),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(Get.height / 50),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                notifier.shimmerBase,
                notifier.shimmerHighlight,
                notifier.shimmerBase,
              ],
              stops: [
                (_animation.value - 1).clamp(0.0, 1.0),
                _animation.value.clamp(0.0, 1.0),
                (_animation.value + 1).clamp(0.0, 1.0),
              ],
              transform: _SlidingGradientTransform(_animation.value),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title placeholder
              Container(
                height: Get.height / 70,
                width: Get.width * 0.5,
                decoration: BoxDecoration(
                  color: notifier.shimmerBase.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              SizedBox(height: Get.height / 80),
              // Subtitle placeholder
              Container(
                height: Get.height / 80,
                width: Get.width * 0.35,
                decoration: BoxDecoration(
                  color: notifier.shimmerBase.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              SizedBox(height: Get.height / 100),
              // Tertiary line placeholder
              Container(
                height: Get.height / 80,
                width: Get.width * 0.6,
                decoration: BoxDecoration(
                  color: notifier.shimmerBase.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Custom gradient transform to slide the shimmer effect
class _SlidingGradientTransform extends GradientTransform {
  final double slidePercent;
  const _SlidingGradientTransform(this.slidePercent);

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    return Matrix4.translationValues(bounds.width * slidePercent, 0, 0);
  }
}
