import 'package:flutter/material.dart';

/// Wraps a list item with a staggered slide-up + fade-in entrance animation.
/// Use inside ListView.builder to make each item animate in sequentially.
///
/// ```dart
/// ListView.builder(
///   itemCount: items.length,
///   itemBuilder: (ctx, i) => AnimatedListItem(
///     index: i,
///     child: MyListTile(item: items[i]),
///   ),
/// )
/// ```
class AnimatedListItem extends StatefulWidget {
  final int index;
  final Widget child;
  final Duration duration;
  final Duration? delay;
  final double slideOffset;

  const AnimatedListItem({
    super.key,
    required this.index,
    required this.child,
    this.duration = const Duration(milliseconds: 400),
    this.delay,
    this.slideOffset = 30.0,
  });

  @override
  State<AnimatedListItem> createState() => _AnimatedListItemState();
}

class _AnimatedListItemState extends State<AnimatedListItem>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );

    _slideAnimation = Tween<Offset>(
      begin: Offset(0, widget.slideOffset),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));

    // Stagger delay: each item starts 50ms after the previous, capped at 500ms
    final staggerDelay = widget.delay ??
        Duration(
          milliseconds: (widget.index * 50).clamp(0, 500),
        );

    Future.delayed(staggerDelay, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: AnimatedBuilder(
        animation: _slideAnimation,
        builder: (context, child) => Transform.translate(
          offset: _slideAnimation.value,
          child: child,
        ),
        child: widget.child,
      ),
    );
  }
}
