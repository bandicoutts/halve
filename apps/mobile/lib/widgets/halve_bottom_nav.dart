import 'package:flutter/material.dart';

import '../theme/app_spacing.dart';
import '../theme/app_theme.dart';
import '../theme/app_typography.dart';
import 'nav_glyphs.dart';

/// One bottom-nav destination.
class HalveNavItem {
  const HalveNavItem({required this.label, required this.glyphBuilder});
  final String label;

  /// Builds the tab glyph for a given active state.
  final Widget Function(bool active) glyphBuilder;
}

/// The Halve bottom tab bar — Today · Archive · Stats. Anchored (never
/// floating), platform-adaptive per the mobile wireframe (`app/screens/nav.jsx`):
///   • iOS    — bare labelled icons, active in accent.
///   • Android — Material 3 NavigationBar, active glyph seated in an
///     accent-tint pill.
/// Mounted only by the shell; the full-screen Play route lives outside the
/// shell, so the bar is simply absent there (no auto-hide logic needed).
class HalveBottomNav extends StatelessWidget {
  const HalveBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;

  static const items = <HalveNavItem>[
    HalveNavItem(
      label: 'Today',
      glyphBuilder: _todayGlyph,
    ),
    HalveNavItem(
      label: 'Archive',
      glyphBuilder: _archiveGlyph,
    ),
    HalveNavItem(
      label: 'Stats',
      glyphBuilder: _statsGlyph,
    ),
  ];

  static Widget _todayGlyph(bool a) => TodayGlyph(active: a);
  static Widget _archiveGlyph(bool a) => ArchiveGlyph(active: a);
  static Widget _statsGlyph(bool a) => StatsGlyph(active: a);

  @override
  Widget build(BuildContext context) {
    final platform = Theme.of(context).platform;
    final isAndroid = platform == TargetPlatform.android ||
        platform == TargetPlatform.fuchsia;
    return isAndroid ? _AndroidNavBar(this) : _IOSNavBar(this);
  }
}

/// Material 3 NavigationBar — active glyph in an accent-tint pill.
class _AndroidNavBar extends StatelessWidget {
  const _AndroidNavBar(this.nav);
  final HalveBottomNav nav;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return NavigationBarTheme(
      data: NavigationBarThemeData(
        backgroundColor: c.bg,
        indicatorColor: c.accentTint,
        elevation: 0,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return AppTypography.label.copyWith(
            fontSize: 11,
            letterSpacing: 0.11, // 0.01em
            fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
            color: selected ? c.fg1 : c.fg3,
          );
        }),
      ),
      child: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: c.hairline)),
        ),
        child: NavigationBar(
          selectedIndex: nav.currentIndex,
          onDestinationSelected: nav.onTap,
          height: 64,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: [
            for (var i = 0; i < HalveBottomNav.items.length; i++)
              NavigationDestination(
                icon: HalveBottomNav.items[i].glyphBuilder(false),
                selectedIcon: HalveBottomNav.items[i].glyphBuilder(true),
                label: HalveBottomNav.items[i].label,
              ),
          ],
        ),
      ),
    );
  }
}

/// iOS — bare labelled icons, hairline top border, active in accent.
class _IOSNavBar extends StatelessWidget {
  const _IOSNavBar(this.nav);
  final HalveBottomNav nav;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Container(
      decoration: BoxDecoration(
        color: c.bg,
        border: Border(top: BorderSide(color: c.hairline)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 52,
          child: Row(
            children: [
              for (var i = 0; i < HalveBottomNav.items.length; i++)
                Expanded(
                  child: _IOSTabItem(
                    item: HalveBottomNav.items[i],
                    active: nav.currentIndex == i,
                    onTap: () => nav.onTap(i),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _IOSTabItem extends StatelessWidget {
  const _IOSTabItem({
    required this.item,
    required this.active,
    required this.onTap,
  });
  final HalveNavItem item;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Semantics(
      button: true,
      selected: active,
      label: item.label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(height: 28, width: 28, child: item.glyphBuilder(active)),
            const SizedBox(height: AppSpacing.s1),
            Text(
              item.label,
              style: AppTypography.label.copyWith(
                fontSize: 11,
                letterSpacing: 0,
                fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                color: active ? c.fg1 : c.fg3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
