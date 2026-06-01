import 'package:flutter_test/flutter_test.dart';
import 'package:halve/data/models/models.dart';
import 'package:halve/data/repositories/repositories.dart';
import 'package:halve/data/supabase_client.dart';
import 'package:mocktail/mocktail.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class _MockGoTrue extends Mock implements GoTrueClient {}

void main() {
  group('RecordSolveResult.fromRpc', () {
    test('success', () {
      final r = RecordSolveResult.fromRpc({'ok': true});
      expect(r.ok, isTrue);
      expect(r.alreadySolved, isFalse);
      expect(r.error, isNull);
    });

    test('already solved is an idempotent success', () {
      final r = RecordSolveResult.fromRpc({'ok': true, 'alreadySolved': true});
      expect(r.ok, isTrue);
      expect(r.alreadySolved, isTrue);
    });

    test('backend failure carries the error code', () {
      final r = RecordSolveResult.fromRpc({'ok': false, 'error': 'grid_mismatch'});
      expect(r.ok, isFalse);
      expect(r.error, 'grid_mismatch');
      expect(r.isNetworkError, isFalse);
    });

    test('unexpected shape degrades to a generic failure', () {
      final r = RecordSolveResult.fromRpc('not a map');
      expect(r.ok, isFalse);
      expect(r.error, 'unknown');
    });

    test('networkFailure is retryable', () {
      expect(RecordSolveResult.networkFailure.ok, isFalse);
      expect(RecordSolveResult.networkFailure.isNetworkError, isTrue);
    });
  });

  group('RPC param builders', () {
    test('recordSolveParams maps to the SQL signature', () {
      final params = SolveRepository.recordSolveParams(
        puzzleId: 'p1',
        grid: const [
          [0, 1],
          [1, 0],
        ],
        durationMs: 167000,
        usedHint: false,
        localDate: '2026-06-01',
      );
      expect(params, {
        'p_puzzle_id': 'p1',
        'p_grid': const [
          [0, 1],
          [1, 0],
        ],
        'p_duration_ms': 167000,
        'p_used_hint': false,
        'p_local_date': '2026-06-01',
      });
    });

    test('practicePuzzleParams omits p_seq when null', () {
      expect(PuzzleRepository.practicePuzzleParams(Difficulty.hard),
          {'p_difficulty': 'hard'});
    });

    test('practicePuzzleParams includes p_seq when set', () {
      expect(
        PuzzleRepository.practicePuzzleParams(Difficulty.easy, seq: 7),
        {'p_difficulty': 'easy', 'p_seq': 7},
      );
    });
  });

  group('AuthRepository', () {
    late _MockGoTrue auth;
    late AuthRepository repo;

    setUpAll(() => registerFallbackValue(SignOutScope.local));

    setUp(() {
      auth = _MockGoTrue();
      repo = AuthRepository(auth);
    });

    test('signOut uses local scope (never global)', () async {
      when(() => auth.signOut(scope: any(named: 'scope')))
          .thenAnswer((_) async {});

      await repo.signOut();

      verify(() => auth.signOut(scope: SignOutScope.local)).called(1);
      verifyNever(() => auth.signOut(scope: SignOutScope.global));
    });

    test('signInWithMagicLink sends the deep-link redirect', () async {
      when(() => auth.signInWithOtp(
            email: any(named: 'email'),
            emailRedirectTo: any(named: 'emailRedirectTo'),
          )).thenAnswer((_) async {});

      await repo.signInWithMagicLink('player@example.com');

      verify(() => auth.signInWithOtp(
            email: 'player@example.com',
            emailRedirectTo: authRedirectUrl,
          )).called(1);
      expect(authRedirectUrl, 'halve://auth-callback');
    });
  });
}
