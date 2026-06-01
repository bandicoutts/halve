import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../data/repositories/repositories.dart';
import '../data/supabase_client.dart';

/// The active Supabase client. Reading this in guest mode (no build-time creds)
/// throws — callers gate UI on [isSignedInProvider] / [authStateProvider],
/// which both degrade gracefully without a client.
final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  if (!isSupabaseConfigured) {
    throw StateError(
      'Supabase is not configured — running in guest mode. '
      'Pass --dart-define SUPABASE_URL / SUPABASE_ANON_KEY to enable the backend.',
    );
  }
  return supabase;
});

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(supabaseClientProvider).auth),
);

final puzzleRepositoryProvider = Provider<PuzzleRepository>(
  (ref) => PuzzleRepository(ref.watch(supabaseClientProvider)),
);

final solveRepositoryProvider = Provider<SolveRepository>(
  (ref) => SolveRepository(ref.watch(supabaseClientProvider)),
);

/// Auth lifecycle stream. In guest mode (no client) it simply never emits.
final authStateProvider = StreamProvider<AuthState>((ref) {
  if (!isSupabaseConfigured) return const Stream<AuthState>.empty();
  return ref.watch(authRepositoryProvider).onAuthStateChange;
});

/// The signed-in user, or null when playing as a guest. Re-evaluates on every
/// auth change.
final currentUserProvider = Provider<User?>((ref) {
  if (!isSupabaseConfigured) return null;
  ref.watch(authStateProvider); // rebuild when auth changes
  return ref.watch(authRepositoryProvider).currentUser;
});

/// Convenience: whether a real account is signed in.
final isSignedInProvider = Provider<bool>(
  (ref) => ref.watch(currentUserProvider) != null,
);
