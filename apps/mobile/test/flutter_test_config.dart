import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

/// Auto-loaded by `flutter test`. The test runner doesn't register pubspec
/// fonts into the font manager, so we load the bundled Space Grotesk variable
/// font here. This makes golden tests render real glyphs (faithful proof)
/// rather than fallback tofu boxes, and keeps them deterministic offline.
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  final loader = FontLoader('Space Grotesk')
    ..addFont(rootBundle.load('assets/fonts/SpaceGrotesk-VariableFont_wght.ttf'));
  await loader.load();
  await testMain();
}
