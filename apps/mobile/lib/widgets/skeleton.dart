import 'package:flutter/material.dart';

import '../theme/app_radii.dart';
import '../theme/app_theme.dart';

/// A loading placeholder block — a calm breathing fade (opacity 1 ↔ 0.42 over
/// 1.5s), never a sweeping shimmer (anti-AI-aesthetic guardrail). Filled with
/// `bgSunken`. Mirrors the web `.hv-skel` helper.
class Skeleton extends StatefulWidget {
  const Skeleton({
    super.key,
    this.width,
    this.height,
    this.borderRadius = AppRadii.smR,
  });

  final double? width;
  final double? height;
  final BorderRadius borderRadius;

  @override
  State<Skeleton> createState() => _SkeletonState();
}

class _SkeletonState extends State<Skeleton> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _opacity = Tween<double>(begin: 1.0, end: 0.42).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: context.halveColors.bgSunken,
          borderRadius: widget.borderRadius,
        ),
      ),
    );
  }
}
