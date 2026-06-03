import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/app_typography.dart';

/// Accent-tinted circle with the uppercased first character of [name].
class HalveMonogram extends StatelessWidget {
  const HalveMonogram({super.key, required this.name, this.size = 48});

  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: c.accentTint,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: AppTypography.tabular(
          AppTypography.h2.copyWith(
            color: c.accent,
            fontSize: size * 0.44,
            fontWeight: FontWeight.w600,
            height: 1,
          ),
        ),
      ),
    );
  }
}
