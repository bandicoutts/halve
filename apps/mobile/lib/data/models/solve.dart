/// Solve-related models: a recorded solve row, and the typed result of the
/// `record_solve` RPC.
library;

/// One row from the `solves` table. Streaks/stats are DERIVED from these rows
/// (never denormalized — project rule).
class SolveRow {
  const SolveRow({
    required this.solvedAt,
    required this.durationMs,
    required this.usedHint,
    required this.localDate,
    this.puzzleId,
  });

  final DateTime solvedAt;
  final int durationMs;
  final bool usedHint;

  /// The player's local calendar day (`yyyy-MM-dd`), the basis for streaks.
  /// Null for legacy rows recorded before `local_date` existed.
  final String? localDate;

  /// Present when selected (e.g. for archive intersection); often omitted.
  final String? puzzleId;

  static SolveRow fromRow(Map<String, Object?> row) {
    return SolveRow(
      solvedAt: DateTime.parse(row['solved_at']! as String),
      durationMs: (row['duration_ms']! as num).toInt(),
      usedHint: (row['used_hint'] as bool?) ?? false,
      localDate: row['local_date'] as String?,
      puzzleId: row['puzzle_id'] as String?,
    );
  }
}

/// The outcome of `record_solve`. The RPC returns
/// `{ok:true}` / `{ok:true, alreadySolved:true}` / `{ok:false, error:...}`.
/// A client-side network/transport failure is surfaced as
/// [RecordSolveResult.network] so the Win screen can offer a retry.
class RecordSolveResult {
  const RecordSolveResult({
    required this.ok,
    this.alreadySolved = false,
    this.error,
  });

  final bool ok;
  final bool alreadySolved;

  /// Backend error code (e.g. `grid_mismatch`, `not_authenticated`) or the
  /// sentinel `network` for a transport failure. Null on success.
  final String? error;

  /// True only for a transport failure the caller can retry.
  bool get isNetworkError => error == networkError;

  static const networkError = 'network';

  /// Parse the RPC's jsonb payload. Unexpected shapes degrade to a generic
  /// failure rather than throwing.
  static RecordSolveResult fromRpc(Object? data) {
    if (data is Map) {
      final ok = data['ok'] == true;
      return RecordSolveResult(
        ok: ok,
        alreadySolved: data['alreadySolved'] == true,
        error: ok ? null : (data['error'] as String?) ?? 'unknown',
      );
    }
    return const RecordSolveResult(ok: false, error: 'unknown');
  }

  static const RecordSolveResult networkFailure =
      RecordSolveResult(ok: false, error: networkError);

  Map<String, dynamic> toJson() => {
        'ok': ok,
        'alreadySolved': alreadySolved,
        if (error != null) 'error': error,
      };

  factory RecordSolveResult.fromJson(Map<String, dynamic> j) =>
      RecordSolveResult(
        ok: j['ok'] as bool,
        alreadySolved: (j['alreadySolved'] as bool?) ?? false,
        error: j['error'] as String?,
      );
}
