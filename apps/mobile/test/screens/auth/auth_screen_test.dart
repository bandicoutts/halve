import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:halve/data/repositories/auth_repository.dart';
import 'package:halve/providers/providers.dart';
import 'package:halve/screens/auth/auth_screen.dart';
import 'package:halve/theme/theme.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// ─── Fakes / mocks ────────────────────────────────────────────────────────────

class MockAuthRepository extends Mock implements AuthRepository {}

// ─── Pump helper ──────────────────────────────────────────────────────────────

typedef PumpResult = ({
  GoRouter router,
  MockAuthRepository auth,
  StreamController<AuthState> authStream,
});

Future<PumpResult> pumpAuth(
  WidgetTester tester, {
  Exception? signInError,
}) async {
  final auth = MockAuthRepository();
  final authStream = StreamController<AuthState>.broadcast();

  if (signInError != null) {
    when(() => auth.signInWithMagicLink(any())).thenThrow(signInError);
  } else {
    when(() => auth.signInWithMagicLink(any())).thenAnswer((_) async {});
  }

  final router = GoRouter(
    initialLocation: '/settings',
    routes: [
      GoRoute(
        path: '/settings',
        builder: (_, _) => const Scaffold(body: Text('SETTINGS')),
      ),
      GoRoute(
        path: '/auth',
        builder: (_, _) => const AuthScreen(),
      ),
    ],
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(auth),
        authStateProvider.overrideWith((_) => authStream.stream),
      ],
      child: MaterialApp.router(
        theme: AppTheme.light(),
        routerConfig: router,
      ),
    ),
  );
  await tester.pumpAndSettle();

  // Push auth screen on top of settings.
  router.push('/auth');
  await tester.pumpAndSettle();

  // Auth screen should be visible.
  expect(find.byType(AuthScreen), findsOneWidget);

  return (router: router, auth: auth, authStream: authStream);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

void main() {
  group('AuthScreen — email step', () {
    testWidgets('Continue is disabled when no email is entered', (tester) async {
      await pumpAuth(tester);

      // HalveButton is disabled (opacity 0.4) when onPressed == null.
      final continueText = find.text('Continue');
      expect(continueText, findsOneWidget);

      final opacity = tester.widget<Opacity>(
        find.ancestor(of: continueText, matching: find.byType(Opacity)).first,
      );
      expect(opacity.opacity, closeTo(0.4, 0.01));
    });

    testWidgets('Continue is disabled for an invalid email', (tester) async {
      await pumpAuth(tester);

      await tester.enterText(find.byType(TextField), 'notanemail');
      await tester.pump();

      final opacity = tester.widget<Opacity>(
        find.ancestor(
          of: find.text('Continue'),
          matching: find.byType(Opacity),
        ).first,
      );
      expect(opacity.opacity, closeTo(0.4, 0.01));
    });

    testWidgets('Continue enables once a valid email is entered', (tester) async {
      await pumpAuth(tester);

      await tester.enterText(find.byType(TextField), 'hello@example.com');
      await tester.pump();

      final opacity = tester.widget<Opacity>(
        find.ancestor(
          of: find.text('Continue'),
          matching: find.byType(Opacity),
        ).first,
      );
      expect(opacity.opacity, closeTo(1.0, 0.01));
    });

    testWidgets('tapping Continue calls signInWithMagicLink with the entered email',
        (tester) async {
      final (:auth, :authStream, :router) = await pumpAuth(tester);
      addTearDown(authStream.close);

      await tester.enterText(find.byType(TextField), 'test@example.com');
      await tester.pump();
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      verify(() => auth.signInWithMagicLink('test@example.com')).called(1);
    });

    testWidgets('tapping Continue with invalid email does not call signInWithMagicLink',
        (tester) async {
      final (:auth, :authStream, :router) = await pumpAuth(tester);
      addTearDown(authStream.close);

      // No email entered — tap Continue (it's "disabled"/transparent but still in tree).
      await tester.tap(find.text('Continue'), warnIfMissed: false);
      await tester.pumpAndSettle();

      verifyNever(() => auth.signInWithMagicLink(any()));
    });

    testWidgets('successful Continue transitions to sent step and shows the email',
        (tester) async {
      final (:auth, :authStream, :router) = await pumpAuth(tester);
      addTearDown(authStream.close);

      await tester.enterText(find.byType(TextField), 'user@halve.today');
      await tester.pump();
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Sent step heading.
      expect(find.text('Check your email'), findsOneWidget);
      // The submitted email is in the RichText body span.
      expect(
        find.byWidgetPredicate(
          (w) =>
              w is RichText &&
              w.text.toPlainText().contains('user@halve.today'),
        ),
        findsWidgets,
      );
      // Email input is gone.
      expect(find.byType(TextField), findsNothing);
    });

    testWidgets('error from signInWithMagicLink shows an inline error message',
        (tester) async {
      final (:auth, :authStream, :router) = await pumpAuth(
        tester,
        signInError: Exception('network error'),
      );
      addTearDown(authStream.close);

      await tester.enterText(find.byType(TextField), 'err@example.com');
      await tester.pump();
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      // Error message should appear; still on the email step.
      expect(find.textContaining('No connection'), findsOneWidget);
      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('rate-limit error maps to a friendly message', (tester) async {
      final (:auth, :authStream, :router) = await pumpAuth(
        tester,
        signInError: Exception('rate limit exceeded'),
      );
      addTearDown(authStream.close);

      await tester.enterText(find.byType(TextField), 'rate@example.com');
      await tester.pump();
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      expect(find.textContaining('Too many attempts'), findsOneWidget);
    });
  });

  group('AuthScreen — sent step', () {
    // Helper: pump to sent step.
    Future<PumpResult> pumpSent(WidgetTester tester) async {
      final result = await pumpAuth(tester);
      await tester.enterText(find.byType(TextField), 'sent@example.com');
      await tester.pump();
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
      expect(find.text('Check your email'), findsOneWidget);
      return result;
    }

    testWidgets('resend button shows cooldown text immediately after tap',
        (tester) async {
      final (:auth, :authStream, :router) = await pumpSent(tester);
      addTearDown(authStream.close);

      await tester.tap(find.text("Didn't get it? Resend"));
      await tester.pump();

      expect(find.text('Link sent again'), findsOneWidget);
    });

    testWidgets('resend button returns to original label after 2.5s', (tester) async {
      final (:auth, :authStream, :router) = await pumpSent(tester);
      addTearDown(authStream.close);

      await tester.tap(find.text("Didn't get it? Resend"));
      await tester.pump();
      expect(find.text('Link sent again'), findsOneWidget);

      // Advance past the 2500ms cooldown.
      await tester.pump(const Duration(milliseconds: 2600));

      expect(find.text("Didn't get it? Resend"), findsOneWidget);
      expect(find.text('Link sent again'), findsNothing);
    });

    testWidgets('resend calls signInWithMagicLink again', (tester) async {
      final (:auth, :authStream, :router) = await pumpSent(tester);
      addTearDown(authStream.close);

      clearInteractions(auth);

      await tester.tap(find.text("Didn't get it? Resend"));
      await tester.pumpAndSettle();

      verify(() => auth.signInWithMagicLink('sent@example.com')).called(1);
    });
  });

  group('AuthScreen — sign-in event', () {
    testWidgets('authStateProvider signedIn event pops the screen back to Settings',
        (tester) async {
      final (:auth, :authStream, :router) = await pumpAuth(tester);
      addTearDown(authStream.close);

      // Confirm auth screen is visible.
      expect(find.byType(AuthScreen), findsOneWidget);
      expect(find.text('SETTINGS'), findsNothing);

      // Emit a sign-in event (simulates the deep-link callback completing).
      authStream.add(const AuthState(AuthChangeEvent.signedIn, null));
      await tester.pumpAndSettle();

      // Auth screen should have popped; settings is back.
      expect(find.byType(AuthScreen), findsNothing);
      expect(find.text('SETTINGS'), findsOneWidget);
    });

    testWidgets('non-signedIn auth events do not pop the screen', (tester) async {
      final (:auth, :authStream, :router) = await pumpAuth(tester);
      addTearDown(authStream.close);

      authStream.add(const AuthState(AuthChangeEvent.tokenRefreshed, null));
      await tester.pumpAndSettle();

      // Still on auth screen.
      expect(find.byType(AuthScreen), findsOneWidget);
    });
  });
}
