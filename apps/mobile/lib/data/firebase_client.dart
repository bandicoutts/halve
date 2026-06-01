import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

import '../firebase_options.dart';

bool _initialized = false;

/// Whether Firebase was successfully initialised at startup. False when:
/// - firebase_options.dart still has placeholder values (pre-`flutterfire configure`)
/// - Firebase.initializeApp() threw for any other reason
bool get isFirebaseInitialized => _initialized;

/// Attempt Firebase init. Safe to call once at startup; swallows errors so the
/// app boots in guest mode (no push) when credentials are not yet configured.
Future<bool> initFirebase() async {
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    _initialized = true;
    return true;
  } catch (e) {
    debugPrint('Firebase init skipped (placeholder credentials or error): $e');
    return false;
  }
}
