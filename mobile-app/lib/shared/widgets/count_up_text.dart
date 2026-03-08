import 'package:flutter/material.dart';

/// Animated counter that counts up from 0 to [end] value.
/// Used in dashboard stat cards for a premium feel.
class CountUpText extends StatefulWidget {
  final int end;
  final TextStyle? style;
  final Duration duration;
  final String prefix;
  final String suffix;

  const CountUpText({
    super.key,
    required this.end,
    this.style,
    this.duration = const Duration(milliseconds: 800),
    this.prefix = '',
    this.suffix = '',
  });

  @override
  State<CountUpText> createState() => _CountUpTextState();
}

class _CountUpTextState extends State<CountUpText>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _animation =
        CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);
    _controller.forward();
  }

  @override
  void didUpdateWidget(CountUpText oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.end != widget.end) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        final value = (_animation.value * widget.end).round();
        return Text(
          '${widget.prefix}$value${widget.suffix}',
          style: widget.style,
        );
      },
    );
  }
}
