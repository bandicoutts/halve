import 'package:flutter/material.dart';

import '../theme/app_radii.dart';
import '../theme/app_theme.dart';
import '../theme/app_typography.dart';

enum HalveButtonVariant {
  /// Solid amber accent fill — the single primary action on a screen.
  primary,

  /// Transparent with a hairline border — secondary actions.
  secondary,
}

/// The primary pill button. Confirms a press with a calm scale-to-0.97
/// (no ripple, no hover — mobile-first), matching the motion rules in
/// `docs/DESIGN.md`. Ported from the web/app primitive (`symbols.jsx`).
class HalveButton extends StatefulWidget {
  const HalveButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = HalveButtonVariant.primary,
    this.full = false,
    this.leadingIcon,
  });

  final String label;
  final VoidCallback? onPressed;
  final HalveButtonVariant variant;

  /// Stretch to fill the available width.
  final bool full;

  /// Optional leading icon (e.g. a Lucide-style glyph or symbol), sized ~19.
  final Widget? leadingIcon;

  @override
  State<HalveButton> createState() => _HalveButtonState();
}

class _HalveButtonState extends State<HalveButton> {
  bool _pressed = false;

  bool get _enabled => widget.onPressed != null;

  void _setPressed(bool value) {
    if (!_enabled) return;
    if (_pressed != value) setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final isPrimary = widget.variant == HalveButtonVariant.primary;

    final Color bg;
    final Color fg;
    final BoxBorder? border;
    if (isPrimary) {
      bg = _pressed ? c.accentStrong : c.accent;
      fg = c.onAccent;
      border = null;
    } else {
      bg = Colors.transparent;
      fg = c.fg1;
      border = Border.all(
        color: _pressed ? c.fg3 : c.hairline2,
        width: 1.5,
      );
    }

    return Opacity(
      opacity: _enabled ? 1 : 0.4,
      child: GestureDetector(
        onTapDown: (_) => _setPressed(true),
        onTapUp: (_) => _setPressed(false),
        onTapCancel: () => _setPressed(false),
        onTap: widget.onPressed,
        child: AnimatedScale(
          scale: _pressed ? 0.97 : 1.0,
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOut,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            curve: Curves.easeInOut,
            height: 54,
            width: widget.full ? double.infinity : null,
            padding: const EdgeInsets.symmetric(horizontal: 28),
            decoration: BoxDecoration(
              color: bg,
              border: border,
              borderRadius: AppRadii.fullR,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (widget.leadingIcon != null) ...[
                  IconTheme.merge(
                    data: IconThemeData(color: fg, size: 19),
                    child: widget.leadingIcon!,
                  ),
                  const SizedBox(width: 8),
                ],
                Text(
                  widget.label,
                  style: AppTypography.body.copyWith(
                    fontSize: 16.5,
                    fontWeight: FontWeight.w500,
                    fontVariations: const [FontVariation('wght', 500)],
                    height: 1.0,
                    letterSpacing: -0.165, // -0.01em
                    color: fg,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
