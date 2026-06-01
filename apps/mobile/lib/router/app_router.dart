import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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

/// Builds the app's [GoRouter]. The Home/Archive/Stats tabs are a
/// [StatefulShellRoute] (each branch keeps its own navigation state); the
/// full-screen routes (Play, Practice, Settings, Auth, Tutorial, First-run)
/// are pushed on top, OUTSIDE the shell — so the bottom tab bar is simply
/// absent there (the Play board owns the screen).
GoRouter createAppRouter({String initialLocation = Routes.home}) {
  return GoRouter(
    initialLocation: initialLocation,
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [GoRoute(path: Routes.home, builder: (_, _) => const HomeScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: Routes.archive, builder: (_, _) => const ArchiveScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: Routes.stats, builder: (_, _) => const StatsScreen())],
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
        pageBuilder: (_, state) => _fade(
          state,
          WinScreen(
            result: state.extra is PlayResult ? state.extra! as PlayResult : null,
          ),
        ),
      ),
      GoRoute(
        path: Routes.practice,
        pageBuilder: (_, state) => _fade(state, const PracticeScreen()),
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
        path: Routes.settings,
        pageBuilder: (_, state) => _fade(state, const SettingsScreen()),
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
      opacity: animation.drive(
        CurveTween(curve: const Cubic(0.4, 0, 0.2, 1)),
      ),
      child: child,
    ),
  );
}

/// The tab shell: hosts the active branch and the anchored bottom nav.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.halveColors.bg,
      body: navigationShell,
      bottomNavigationBar: HalveBottomNav(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) => navigationShell.goBranch(
          index,
          // Re-tapping the active tab pops it back to its root.
          initialLocation: index == navigationShell.currentIndex,
        ),
      ),
    );
  }
}
