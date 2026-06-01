import 'package:flutter/material.dart';

/// Wraps [child] in a press-state that fades to 65% opacity on press.
/// Use for link-style interactive elements (inline text links, dismiss
/// buttons) where a full button scale would feel heavy. No ripple, no
/// hover — mobile-first, matching the brand motion rules.
class TapFade extends StatefulWidget {
  const TapFade({
    super.key,
    required this.onTap,
    required this.child,
    this.behavior = HitTestBehavior.opaque,
  });

  final VoidCallback? onTap;
  final Widget child;
  final HitTestBehavior behavior;

  @override
  State<TapFade> createState() => _TapFadeState();
}

class _TapFadeState extends State<TapFade> {
  bool _pressed = false;

  void _setPressed(bool v) {
    if (widget.onTap == null) return;
    if (_pressed != v) setState(() => _pressed = v);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _setPressed(true),
      onTapUp: (_) => _setPressed(false),
      onTapCancel: () => _setPressed(false),
      onTap: widget.onTap,
      behavior: widget.behavior,
      child: AnimatedOpacity(
        opacity: _pressed ? 0.65 : 1.0,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}
