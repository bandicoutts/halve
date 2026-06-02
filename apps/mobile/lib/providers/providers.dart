import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../data/haptics_service.dart';
import '../data/notification_service.dart';
import '../data/puzzle_cache.dart';
import '../data/repositories/repositories.dart';
import '../data/supabase_client.dart';
export '../data/theme_store.dart' show themeModeProvider, ThemeModeNotifier, themeModeKey, sharedPreferencesProvider;

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

/// Null in guest mode (no build-time Supabase creds). Consumers read the value
/// directly and guard on null rather than catching a thrown [StateError].
final puzzleRepositoryProvider = Provider<PuzzleRepository?>(
  (ref) => isSupabaseConfigured
      ? PuzzleRepository(ref.watch(supabaseClientProvider))
      : null,
);

/// Null in guest mode. See [puzzleRepositoryProvider].
final solveRepositoryProvider = Provider<SolveRepository?>(
  (ref) => isSupabaseConfigured
      ? SolveRepository(ref.watch(supabaseClientProvider))
      : null,
);

/// Null in guest mode. See [puzzleRepositoryProvider].
final profileRepositoryProvider = Provider<ProfileRepository?>(
  (ref) => isSupabaseConfigured
      ? ProfileRepository(ref.watch(supabaseClientProvider))
      : null,
);

/// The offline puzzle cache. Defaults to in-memory (no persistence) so the app
/// boots without [SharedPreferences]; `main.dart` overrides it with a
/// [PrefsPuzzleCache], and widget tests override it with a fake.
final puzzleCacheProvider = Provider<PuzzleCache>((ref) => InMemoryPuzzleCache());

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

final hapticsServiceProvider =
    Provider<HapticsService>((ref) => HapticsService.instance);

final notificationServiceProvider =
    Provider<NotificationService>((ref) => NotificationService.instance);
