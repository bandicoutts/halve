import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../data/haptics_service.dart';
import '../providers/providers.dart';
import '../screens/archive/archive_screen.dart';
import '../screens/auth/auth_screen.dart';
import '../screens/firstrun/firstrun.dart';
import '../screens/home/home_screen.dart';
import '../screens/play/play_screen.dart';
import '../screens/practice/practice_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/play/play_provider.dart';
import '../screens/stats/stats_screen.dart';
import '../screens/tutorial/tutorial_screen.dart';
import '../screens/win/win_screen.dart';
import '../theme/theme.dart';
import '../widgets/widgets.dart';

/// Canonical route paths + builders. Use these instead of bare strings so the
/// route surface stays in one place.
abstract final class Routes {
  static const home = '/';
  static const archive = '/archive';
  static const stats = '/stats';
  static const play = '/play';
  static const win = '/win';
  static const practice = '/practice';
  static const settings = '/settings';
  static const auth = '/auth';
  static const tutorial = '/tutorial';
  static const firstrun = '/firstrun';

  static String playDate(String date) => '/play/$date';
  static String practicePlay({required String difficulty}) =>
      '/practice/play?difficulty=$difficulty';
}

/// Routes that require a signed-in user. Any path listed here will redirect to
/// [Routes.auth] if [Supabase.instance.client.auth.currentUser] is null.
/// Extend this set when adding auth-gated screens (e.g. a leaderboard).
const _authRequired = <String>{};

/// Builds the app's [GoRouter]. The Home/Practice/Archive/Stats tabs are a
/// [StatefulShellRoute] (each branch keeps its own navigation state); the
/// full-screen routes (Play, Settings, Auth, Tutorial, First-run)
/// are pushed on top, OUTSIDE the shell — so the bottom tab bar is simply
/// absent there (the Play board owns the screen).
GoRouter createAppRouter({String initialLocation = Routes.home}) {
  return GoRouter(
    initialLocation: initialLocation,
    extraCodec: const _PlayResultCodec(),
    redirect: (_, state) {
      final requiresAuth = _authRequired.contains(state.matchedLocation);
      if (!requiresAuth) return null;
      final signedIn = Supabase.instance.client.auth.currentUser != null;
      return signedIn ? null : Routes.auth;
    },
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(path: Routes.home, builder: (_, _) => const HomeScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.practice,
                builder: (_, _) => const PracticeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.archive,
                builder: (_, _) => const ArchiveScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.stats,
                builder: (_, _) => const StatsScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: Routes.play,
        pageBuilder: (_, state) => _fade(state, const PlayScreen()),
      ),
      GoRoute(
        path: '/play/:date',
        pageBuilder: (_, state) =>
            _fade(state, PlayScreen(date: state.pathParameters['date'])),
      ),
      GoRoute(
        path: Routes.win,
        pageBuilder: (_, state) =>
            _fade(state, WinScreen(result: state.extra as PlayResult?)),
      ),
      GoRoute(
        path: '/practice/play',
        pageBuilder: (_, state) => _fade(
          state,
          PlayScreen(
            isPractice: true,
            difficulty: state.uri.queryParameters['difficulty'],
          ),
        ),
      ),
      GoRoute(
        path: Routes.auth,
        pageBuilder: (_, state) => _fade(state, const AuthScreen()),
      ),
      GoRoute(
        path: Routes.tutorial,
        pageBuilder: (_, state) => _fade(state, const TutorialScreen()),
      ),
      GoRoute(
        path: Routes.firstrun,
        pageBuilder: (_, state) => _fade(state, const FirstRunScreen()),
      ),
      GoRoute(
        path: Routes.settings,
        pageBuilder: (_, state) => _fade(state, const SettingsScreen()),
      ),
    ],
  );
}

/// 160ms calm fade — brand-canonical transition for all full-screen routes.
/// `Cubic(0.4, 0, 0.2, 1)` mirrors `cubic-bezier(0.4,0,0.2,1)` from DESIGN.md.
CustomTransitionPage<void> _fade(GoRouterState state, Widget child) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionDuration: const Duration(milliseconds: 160),
    reverseTransitionDuration: const Duration(milliseconds: 160),
    transitionsBuilder: (_, animation, _, child) => FadeTransition(
      opacity: animation.drive(CurveTween(curve: const Cubic(0.4, 0, 0.2, 1))),
      child: child,
    ),
  );
}

/// Serialises [PlayResult] through GoRouter's back-stack so Android process
/// death doesn't lose the win keepsake. Wraps the payload in a type-tagged map
/// so the decoder can distinguish it from any future extra types.
class _PlayResultCodec extends Codec<Object?, Object?> {
  const _PlayResultCodec();
  @override
  Converter<Object?, Object?> get encoder => const _PlayResultEncoder();
  @override
  Converter<Object?, Object?> get decoder => const _PlayResultDecoder();
}

class _PlayResultEncoder extends Converter<Object?, Object?> {
  const _PlayResultEncoder();
  @override
  Object? convert(Object? input) {
    if (input is PlayResult) {
      return {'type': 'PlayResult', 'data': input.toJson()};
    }
    return input;
  }
}

class _PlayResultDecoder extends Converter<Object?, Object?> {
  const _PlayResultDecoder();
  @override
  Object? convert(Object? input) {
    if (input is Map<String, dynamic> && input['type'] == 'PlayResult') {
      return PlayResult.fromJson(input['data'] as Map<String, dynamic>);
    }
    return input;
  }
}

/// The tab shell: hosts the persistent brand bar, the active branch, and the
/// anchored bottom nav.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: context.halveColors.bg,
      body: SafeArea(
        top: true,
        bottom: false,
        child: Column(
          children: [
            const _HalveShellBar(),
            Expanded(child: navigationShell),
          ],
        ),
      ),
      bottomNavigationBar: HalveBottomNav(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) {
          if (index != navigationShell.currentIndex) {
            unawaited(hapticsOnSelection());
          }
          navigationShell.goBranch(
            index,
            initialLocation: index == navigationShell.currentIndex,
          );
        },
      ),
    );
  }
}

/// Persistent brand bar shown across all shell tabs. Logo + name, centered.
class _HalveShellBar extends ConsumerWidget {
  const _HalveShellBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.halveColors;
    final mode = ref.watch(themeModeProvider);
    final currentUser = ref.watch(currentUserProvider);
    final email = currentUser?.email;
    final monogram = email == null || email.isEmpty
        ? null
        : email.characters.first.toUpperCase();
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 6),
      child: SizedBox(
        height: 44,
        child: Row(
          children: [
            TapFade(
              onTap: () => context.go(Routes.home),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const HalveMark(size: 20),
                  const SizedBox(width: 9),
                  Text(
                    'Halve',
                    style: AppTypography.wordmark.copyWith(color: c.fg1),
                  ),
                ],
              ),
            ),
            const Spacer(),
            _ShellCircleButton(
              label: 'Toggle theme',
              onTap: () {
                final next = mode == ThemeMode.dark
                    ? ThemeMode.light
                    : ThemeMode.dark;
                ref.read(themeModeProvider.notifier).setMode(next);
              },
              child: _ThemeGlyph(isDark: mode == ThemeMode.dark),
            ),
            const SizedBox(width: 10),
            _ShellCircleButton(
              label: 'Account',
              accented: true,
              onTap: () => context.push(Routes.settings),
              child: Text(
                monogram ?? '?',
                style: AppTypography.monoMicro.copyWith(
                  color: c.fg1,
                  letterSpacing: 0,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ShellCircleButton extends StatelessWidget {
  const _ShellCircleButton({
    required this.label,
    required this.onTap,
    required this.child,
    this.accented = false,
  });

  final String label;
  final VoidCallback onTap;
  final Widget child;
  final bool accented;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Semantics(
      button: true,
      label: label,
      child: TapFade(
        onTap: onTap,
        child: Container(
          width: 36,
          height: 36,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: accented ? c.surface : Colors.transparent,
            border: Border.all(color: accented ? c.accent : c.hairline2),
          ),
          child: child,
        ),
      ),
    );
  }
}

class _ThemeGlyph extends StatelessWidget {
  const _ThemeGlyph({required this.isDark});

  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return AnimatedRotation(
      turns: isDark ? 0 : 0.5,
      duration: context.reduceMotion
          ? Duration.zero
          : const Duration(milliseconds: 450),
      curve: const Cubic(0.34, 1.56, 0.5, 1),
      child: CustomPaint(
        size: const Size.square(15),
        painter: _ThemeGlyphPainter(color: c.fg1),
      ),
    );
  }
}

class _ThemeGlyphPainter extends CustomPainter {
  const _ThemeGlyphPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final stroke = Paint()
      ..color = color.withValues(alpha: 0.85)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..isAntiAlias = true;
    final fill = Paint()
      ..color = color.withValues(alpha: 0.85)
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;
    canvas.drawCircle(rect.center, size.width / 2 - 1, stroke);
    final half = Path()
      ..moveTo(rect.center.dx, 1)
      ..arcToPoint(
        Offset(rect.center.dx, size.height - 1),
        radius: Radius.circular(size.width / 2 - 1),
        clockwise: false,
      )
      ..close();
    canvas.drawPath(half, fill);
  }

  @override
  bool shouldRepaint(_ThemeGlyphPainter oldDelegate) =>
      oldDelegate.color != color;
}
