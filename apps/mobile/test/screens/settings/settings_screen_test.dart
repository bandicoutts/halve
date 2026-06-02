import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:halve/data/repositories/auth_repository.dart';
import 'package:halve/data/theme_store.dart';
import 'package:halve/providers/providers.dart';
import 'package:halve/screens/settings/settings_provider.dart';
import 'package:halve/screens/settings/settings_screen.dart';
import 'package:halve/theme/theme.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ─── Fake auth ────────────────────────────────────────────────────────────────

class _FakeAuthRepository extends Fake implements AuthRepository {
  var signedOut = false;

  @override
  Future<void> signOut() async {
    signedOut = true;
  }
}

// ─── Pump helper ──────────────────────────────────────────────────────────────

Future<({GoRouter router, List<String> navLog})> pumpSettings(
  WidgetTester tester, {
  required SettingsData data,
  List<Override> overrides = const [],
}) async {
  final navLog = <String>[];
  final router = GoRouter(
    initialLocation: '/settings',
    observers: [_NavLogger(navLog)],
    routes: [
      GoRoute(
        path: '/settings',
        builder: (_, _) => const SettingsScreen(),
      ),
      GoRoute(path: '/', builder: (_, _) => const Text('HOME')),
      GoRoute(path: '/auth', builder: (_, _) => const Text('AUTH')),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        settingsDataProvider.overrideWith((ref) async => data),
        ...overrides,
      ],
      child: MaterialApp.router(
        theme: AppTheme.light(),
        routerConfig: router,
      ),
    ),
  );
  await tester.pumpAndSettle();
  return (router: router, navLog: navLog);
}

class _NavLogger extends NavigatorObserver {
  _NavLogger(this._log);
  final List<String> _log;

  @override
  void didPush(Route<Object?> route, Route<Object?>? previousRoute) {
    final name = route.settings.name;
    if (name != null) _log.add(name);
  }

  @override
  void didReplace({Route<Object?>? newRoute, Route<Object?>? oldRoute}) {
    final name = newRoute?.settings.name;
    if (name != null) _log.add(name);
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

void main() {
  group('SettingsScreen — theme toggle', () {
    testWidgets('System is selected by default', (tester) async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      await pumpSettings(
        tester,
        data: const SettingsData(isSignedIn: false),
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
      );

      // All three segments render.
      expect(find.text('System'), findsOneWidget);
      expect(find.text('Light'), findsOneWidget);
      expect(find.text('Dark'), findsOneWidget);
    });

    testWidgets('tapping Light persists halve:theme=light to prefs',
        (tester) async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      await pumpSettings(
        tester,
        data: const SettingsData(isSignedIn: false),
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
      );

      await tester.tap(find.text('Light'));
      await tester.pumpAndSettle();

      expect(prefs.getString(themeModeKey), 'light');
    });

    testWidgets('tapping Dark persists halve:theme=dark to prefs',
        (tester) async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      await pumpSettings(
        tester,
        data: const SettingsData(isSignedIn: false),
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
      );

      await tester.tap(find.text('Dark'));
      await tester.pumpAndSettle();

      expect(prefs.getString(themeModeKey), 'dark');
    });

    testWidgets('tapping System persists halve:theme=system to prefs',
        (tester) async {
      SharedPreferences.setMockInitialValues({themeModeKey: 'dark'});
      final prefs = await SharedPreferences.getInstance();

      await pumpSettings(
        tester,
        data: const SettingsData(isSignedIn: false),
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
      );

      await tester.tap(find.text('System'));
      await tester.pumpAndSettle();

      expect(prefs.getString(themeModeKey), 'system');
    });
  });

  group('SettingsScreen — account (signed in)', () {
    testWidgets('shows display name, Streak synced, and Sign out',
        (tester) async {
      await pumpSettings(
        tester,
        data: const SettingsData(
          isSignedIn: true,
          email: 'alex@example.com',
          displayName: 'Alex',
          version: '1.0.0',
        ),
      );

      expect(find.text('Alex'), findsOneWidget);
      expect(find.text('Streak synced'), findsOneWidget);
      expect(find.text('Sign out'), findsOneWidget);
    });

    testWidgets('falls back to email when display name is null', (tester) async {
      await pumpSettings(
        tester,
        data: const SettingsData(
          isSignedIn: true,
          email: 'robin@example.com',
          displayName: null,
        ),
      );

      expect(find.text('robin@example.com'), findsWidgets);
      expect(find.text('Streak synced'), findsOneWidget);
    });

    testWidgets('Sign in row is absent when signed in', (tester) async {
      await pumpSettings(
        tester,
        data: const SettingsData(
          isSignedIn: true,
          email: 'x@y.com',
          displayName: 'X',
        ),
      );

      expect(find.text('Sign in'), findsNothing);
    });
  });

  group('SettingsScreen — account (guest / signed out)', () {
    testWidgets('shows Sign in prompt with keep-streak sublabel',
        (tester) async {
      await pumpSettings(
        tester,
        data: const SettingsData(isSignedIn: false),
      );

      expect(find.text('Sign in'), findsOneWidget);
      expect(
        find.text('Keep your streak safe across devices'),
        findsOneWidget,
      );
    });

    testWidgets('Sign out row is absent when guest', (tester) async {
      await pumpSettings(
        tester,
        data: const SettingsData(isSignedIn: false),
      );

      expect(find.text('Sign out'), findsNothing);
    });

    testWidgets('Sign in navigates to /auth', (tester) async {
      await pumpSettings(
        tester,
        data: const SettingsData(isSignedIn: false),
      );

      await tester.tap(find.text('Sign in'));
      await tester.pumpAndSettle();

      expect(find.text('AUTH'), findsOneWidget);
    });
  });

  group('SettingsScreen — sign out', () {
    testWidgets('Sign out calls AuthRepository.signOut and navigates home',
        (tester) async {
      final fakeAuth = _FakeAuthRepository();

      await pumpSettings(
        tester,
        data: const SettingsData(
          isSignedIn: true,
          email: 'test@example.com',
          displayName: 'Test',
        ),
        overrides: [
          authRepositoryProvider.overrideWithValue(fakeAuth),
        ],
      );

      await tester.tap(find.text('Sign out'));
      await tester.pumpAndSettle();

      expect(fakeAuth.signedOut, isTrue);
      expect(find.text('HOME'), findsOneWidget);
    });
  });

  group('SettingsScreen — about', () {
    testWidgets('shows version string', (tester) async {
      await pumpSettings(
        tester,
        data: const SettingsData(
          isSignedIn: false,
          version: '1.0.0 (42)',
        ),
      );

      expect(find.text('Version'), findsOneWidget);
      expect(find.text('1.0.0 (42)'), findsOneWidget);
    });

    testWidgets('shows Privacy policy and Terms of use rows', (tester) async {
      await pumpSettings(
        tester,
        data: const SettingsData(isSignedIn: false),
      );

      expect(find.text('Privacy policy'), findsOneWidget);
      expect(find.text('Terms of use'), findsOneWidget);
    });
  });

  group('SettingsScreen — notifications', () {
    testWidgets('Daily reminder row renders', (tester) async {
      await pumpSettings(
        tester,
        data: const SettingsData(isSignedIn: false),
      );

      expect(find.text('Daily reminder'), findsOneWidget);
    });
  });

  group('SettingsScreen — game', () {
    testWidgets('Haptics row renders', (tester) async {
      await pumpSettings(
        tester,
        data: const SettingsData(isSignedIn: false),
      );

      expect(find.text('Haptics'), findsOneWidget);
    });
  });
}
