import 'package:flutter/material.dart';

import '../theme/app_radii.dart';
import '../theme/app_theme.dart';

/// Presents [child] in a Halve-styled modal bottom sheet: `surfaceRaised`
/// background, 24px rounded top corners, a soft scrim, and a calm slide-up.
/// Platform-aware — shows a drag handle on iOS (the expected affordance there),
/// omits it on Android where the system back gesture dismisses.
Future<T?> showHalveBottomSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  bool isScrollControlled = false,
  double maxHeightFraction = 0.7,
}) {
  final c = context.halveColors;
  final isCupertino = Theme.of(context).platform == TargetPlatform.iOS ||
      Theme.of(context).platform == TargetPlatform.macOS;

  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: isScrollControlled,
    backgroundColor: c.surfaceRaised,
    barrierColor: Colors.black.withValues(alpha: 0.32),
    elevation: 0,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    constraints: BoxConstraints(
      maxHeight: MediaQuery.sizeOf(context).height * maxHeightFraction,
    ),
    builder: (context) => _HalveSheetBody(
      showHandle: isCupertino,
      child: Builder(builder: builder),
    ),
  );
}

class _HalveSheetBody extends StatelessWidget {
  const _HalveSheetBody({required this.child, required this.showHandle});

  final Widget child;
  final bool showHandle;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return SafeArea(
      top: false,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showHandle)
            Padding(
              padding: const EdgeInsets.only(top: 10, bottom: 4),
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: c.hairline2,
                  borderRadius: AppRadii.fullR,
                ),
              ),
            ),
          Flexible(child: child),
        ],
      ),
    );
  }
}
