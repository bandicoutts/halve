import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase project credentials, injected at build time via
/// `--dart-define=SUPABASE_URL=… --dart-define=SUPABASE_ANON_KEY=…`.
const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

/// Dev-only test account credentials (dart-define via env.json). Both are
/// empty strings in release builds / when not set — the dev button is hidden.
const devEmail = String.fromEnvironment('DEV_EMAIL');
const devPassword = String.fromEnvironment('DEV_PASSWORD');

/// The magic-link redirect target. Custom scheme for now (works without server
/// association files); a universal/App Link is added before public launch.
/// See `apps/mobile/AUTH-DEEPLINK-SETUP.md`. Must exactly match an entry in the
/// Supabase Auth redirect allow-list.
const authRedirectUrl = 'halve://auth-callback';

/// Whether build-time credentials are present. When false the app runs as a
/// guest with no backend (Supabase is never initialised) — see `main.dart`.
bool get isSupabaseConfigured =>
    supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

/// Initialise Supabase if configured. No-op (returns false) otherwise, so
/// `flutter run` works without env. Safe to call once at startup.
Future<bool> initSupabase() async {
  if (!isSupabaseConfigured) return false;
  await Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );
  return true;
}

/// The active client. Throws if accessed before [initSupabase] succeeded —
/// callers in guest mode must guard on [isSupabaseConfigured] first.
SupabaseClient get supabase => Supabase.instance.client;
