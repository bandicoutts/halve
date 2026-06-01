import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// A circular icon button for sparingly-used UI affordances (back, undo, hint,
/// share, settings, close). Houses a Lucide-style line glyph (~1.75px stroke)
/// passed as [child]. Confirms a press with a calm scale-to-0.94; disabled
/// renders at the hairline color. Ported from `symbols.jsx`.
class HalveIconButton extends StatefulWidget {
  const HalveIconButton({
    super.key,
    required this.child,
    required this.semanticLabel,
    this.onPressed,
    this.size = 48,
    this.active = false,
  });

  /// The icon glyph. Color + size are supplied via [IconTheme] / sizing.
  final Widget child;

  /// Accessibility label (e.g. "Undo", "Settings").
  final String semanticLabel;

  final VoidCallback? onPressed;

  /// Tap-target size (≥44 iOS / 48 Android). The glyph renders at ~44% of this.
  final double size;

  /// Selected state — tints the glyph + a hairline ring with the accent.
  final bool active;

  @override
  State<HalveIconButton> createState() => _HalveIconButtonState();
}

class _HalveIconButtonState extends State<HalveIconButton> {
  bool _pressed = false;

  bool get _enabled => widget.onPressed != null;

  void _setPressed(bool value) {
    if (!_enabled) return;
    if (_pressed != value) setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;

    final Color iconColor;
    if (!_enabled) {
      iconColor = c.hairline2;
    } else if (widget.active) {
      iconColor = c.accent;
    } else {
      iconColor = c.fg2;
    }

    return Semantics(
      button: true,
      enabled: _enabled,
      label: widget.semanticLabel,
      child: GestureDetector(
        onTapDown: (_) => _setPressed(true),
        onTapUp: (_) => _setPressed(false),
        onTapCancel: () => _setPressed(false),
        onTap: widget.onPressed,
        child: AnimatedScale(
          scale: _pressed ? 0.94 : 1.0,
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOut,
          child: Container(
            width: widget.size,
            height: widget.size,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _pressed ? c.bgSunken : Colors.transparent,
              border: widget.active
                  ? Border.all(color: c.accent, width: 1.5)
                  : null,
            ),
            child: IconTheme.merge(
              data: IconThemeData(color: iconColor, size: widget.size * 0.44),
              child: widget.child,
            ),
          ),
        ),
      ),
    );
  }
}
