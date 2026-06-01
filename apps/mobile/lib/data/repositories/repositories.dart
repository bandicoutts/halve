/// Data repositories — the only layer that talks to Supabase. UI reads these
/// via Riverpod providers (lib/providers), never the client directly.
library;

export 'auth_repository.dart';
export 'puzzle_repository.dart';
export 'solve_repository.dart';
