import 'package:flutter/material.dart';

import '../theme/app_layout.dart';
import '../theme/app_spacing.dart';
import '../theme/app_theme.dart';
import '../theme/app_typography.dart';
import 'halve_icon_button.dart';

/// A lightweight screen header: optional leading back button, a title, and an
/// optional trailing widget. Title is centered on iOS, left-aligned on Android
/// (platform convention, matching the wireframe). Not a Material AppBar — keeps
/// the calm, flat Halve chrome (no elevation/tint).
class HalveTopBar extends StatelessWidget {
  const HalveTopBar({
    super.key,
    this.title,
    this.onBack,
    this.trailing,
    this.leading,
  });

  final String? title;

  /// If non-null, a back chevron is shown that calls this.
  final VoidCallback? onBack;

  /// Overrides [onBack]'s default back button when you need a custom leading.
  final Widget? leading;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final isAndroid = Theme.of(context).platform == TargetPlatform.android;

    final lead = leading ??
        (onBack != null
            ? HalveIconButton(
                semanticLabel: 'Back',
                onPressed: onBack,
                child: const Icon(Icons.chevron_left),
              )
            : null);

    final titleWidget = title == null
        ? null
        : Text(
            title!,
            style: AppTypography.h3.copyWith(color: c.fg1),
          );

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s2,
        vertical: AppSpacing.s1,
      ),
      child: SizedBox(
        height: AppLayout.topBarHeight,
        child: isAndroid
            ? Row(
                children: [
                  if (lead != null) lead else const SizedBox(width: AppSpacing.s2),
                  if (titleWidget != null) ...[
                    const SizedBox(width: AppSpacing.s1),
                    Expanded(child: titleWidget),
                  ] else
                    const Spacer(),
                  ?trailing,
                ],
              )
            : Stack(
                alignment: Alignment.center,
                children: [
                  ?titleWidget,
                  Row(
                    children: [
                      ?lead,
                      const Spacer(),
                      ?trailing,
                    ],
                  ),
                ],
              ),
      ),
    );
  }
}
