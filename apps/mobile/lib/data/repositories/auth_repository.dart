import 'package:supabase_flutter/supabase_flutter.dart';

import '../supabase_client.dart';

/// Magic-link (OTP email) auth. Guest play is the default; sign-in is opt-in
/// (reached only from Settings → Account). Mirrors the web flow.
class AuthRepository {
  AuthRepository(this._auth);

  final GoTrueClient _auth;

  /// The signed-in user, or null when playing as a guest.
  User? get currentUser => _auth.currentUser;

  bool get isSignedIn => _auth.currentUser != null;

  /// Auth lifecycle events (sign-in via deep link, sign-out, token refresh).
  Stream<AuthState> get onAuthStateChange => _auth.onAuthStateChange;

  /// Send a magic link to [email]. The link reopens the app via the
  /// [authRedirectUrl] deep link, where supabase_flutter completes the session.
  /// Supabase only honours [authRedirectUrl] if it exactly matches an entry in
  /// the Auth redirect allow-list (see AUTH-DEEPLINK-SETUP.md).
  Future<void> signInWithMagicLink(String email) {
    return _auth.signInWithOtp(email: email, emailRedirectTo: authRedirectUrl);
  }

  /// Dev-only: email + password sign-in for emulator testing. The test account
  /// credentials come from dart-defines (DEV_EMAIL / DEV_PASSWORD in env.json).
  Future<void> signInWithPassword(String email, String password) {
    return _auth.signInWithPassword(email: email, password: password);
  }

  /// Sign out on THIS device only. `scope: local` is mandatory — the default
  /// (`global`) revokes every session on every device (global project rule).
  Future<void> signOut() => _auth.signOut(scope: SignOutScope.local);
}
