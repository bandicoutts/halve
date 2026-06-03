import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/models.dart';

/// Records solves via the server-authoritative `record_solve` RPC (the same
/// anti-cheat path as web — see supabase/migrations/…_record_solve.sql) and
/// reads solve history for stats/archive/streaks.
class SolveRepository {
  SolveRepository(this._client);

  final SupabaseClient _client;

  /// Record a completed solve. The RPC validates grid == solution, rejects
  /// future/dateless puzzles, and clamps `local_date` ±1 day. An already-solved
  /// puzzle returns `ok:true, alreadySolved:true` (idempotent). A transport
  /// failure becomes [RecordSolveResult.networkFailure] so the Win screen can
  /// offer a retry.
  Future<RecordSolveResult> recordSolve({
    required String puzzleId,
    required Grid grid,
    required int durationMs,
    required bool usedHint,
    required String localDate,
  }) async {
    try {
      final data = await _client.rpc<dynamic>(
        'record_solve',
        params: recordSolveParams(
          puzzleId: puzzleId,
          grid: grid,
          durationMs: durationMs,
          usedHint: usedHint,
          localDate: localDate,
        ),
      );
      return RecordSolveResult.fromRpc(data);
    } catch (e, st) {
      // Network / transport / auth error — retryable.
      debugPrint('recordSolve failed: $e\n$st');
      return RecordSolveResult.networkFailure;
    }
  }

  /// The RPC param map for `record_solve` (extracted for testing).
  static Map<String, Object?> recordSolveParams({
    required String puzzleId,
    required Grid grid,
    required int durationMs,
    required bool usedHint,
    required String localDate,
  }) =>
      {
        'p_puzzle_id': puzzleId,
        'p_grid': grid,
        'p_duration_ms': durationMs,
        'p_used_hint': usedHint,
        'p_local_date': localDate,
      };

  /// All of the user's solves, oldest first — the basis for streaks, stats, and
  /// archive intersection. RLS restricts rows to the caller.
  Future<List<SolveRow>> fetchSolves(String userId) async {
    final rows = await _client
        .from('solves')
        .select('puzzle_id, solved_at, duration_ms, used_hint, local_date')
        .eq('user_id', userId)
        .order('solved_at');
    return [for (final row in rows) SolveRow.fromRow(row)];
  }
}
