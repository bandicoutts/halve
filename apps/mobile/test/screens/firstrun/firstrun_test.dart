import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:halve/data/onboarding.dart';
import 'package:halve/screens/firstrun/firstrun.dart';
import 'package:halve/screens/tutorial/tutorial_flow.dart';
import 'package:halve/theme/theme.dart';

class FakeOnboardingStore implements OnboardingStore {
  bool onboarded = false;

  @override
  Future<bool> isOnboarded() async => onboarded;

  @override
  Future<void> setOnboarded() async => onboarded = true;
}

Future<FakeOnboardingStore> pumpFirstRun(WidgetTester tester) async {
  final store = FakeOnboardingStore();
  final router = GoRouter(
    initialLocation: '/firstrun',
    routes: [
      GoRoute(path: '/firstrun', builder: (_, _) => const FirstRunScreen()),
      GoRoute(
        path: '/',
        builder: (_, _) =>
            const Scaffold(body: Center(child: Text('HOME-MARKER'))),
      ),
      GoRoute(
        path: '/play',
        builder: (_, _) =>
            const Scaffold(body: Center(child: Text('PLAY-MARKER'))),
      ),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [onboardingStoreProvider.overrideWithValue(store)],
      child: MediaQuery(
        data: const MediaQueryData(disableAnimations: true),
        child: MaterialApp.router(
          theme: AppTheme.light(),
          routerConfig: router,
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
  return store;
}

void main() {
  testWidgets('first-run starts on the tutorial flow', (tester) async {
    await pumpFirstRun(tester);
    expect(find.byType(TutorialFlow), findsOneWidget);
    expect(find.text('Two symbols'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);
  });

  testWidgets('Skip marks the device onboarded and lands on Home',
      (tester) async {
    final store = await pumpFirstRun(tester);

    await tester.tap(find.text('Skip'));
    await tester.pumpAndSettle();

    expect(store.onboarded, isTrue);
    expect(find.text('HOME-MARKER'), findsOneWidget);
    expect(find.byType(TutorialFlow), findsNothing);
  });
}
