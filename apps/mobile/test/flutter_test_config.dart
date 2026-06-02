import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

// Tolerance for cross-platform font rendering differences. Skia on Linux and
// CoreText on macOS antialias text differently even with identical font files.
// 1.5% covers typical subpixel-hinting divergence without masking real changes.
const _kGoldenThreshold = 0.015;

/// Auto-loaded by `flutter test`.
/// 1. Loads bundled Space Grotesk so goldens render real glyphs, not tofu.
/// 2. Installs a tolerant golden comparator so minor cross-platform font
///    hinting differences (macOS CoreText vs Linux Skia) don't fail CI.
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  final loader = FontLoader('Space Grotesk')
    ..addFont(rootBundle.load('assets/fonts/SpaceGrotesk-VariableFont_wght.ttf'));
  await loader.load();

  if (goldenFileComparator is LocalFileComparator) {
    final current = goldenFileComparator as LocalFileComparator;
    goldenFileComparator = _TolerantComparator(current.basedir);
  }

  await testMain();
}

class _TolerantComparator extends GoldenFileComparator {
  _TolerantComparator(this.basedir);

  final Uri basedir;

  @override
  Future<bool> compare(Uint8List imageBytes, Uri golden) async {
    final goldenFile = _resolve(golden);
    if (!goldenFile.existsSync()) {
      throw TestFailure(
        'Golden file not found: ${goldenFile.path}\n'
        'Run `flutter test --update-goldens` to generate it.',
      );
    }

    final goldenBytes = await goldenFile.readAsBytes();
    final result = await GoldenFileComparator.compareLists(
      imageBytes,
      goldenBytes,
    );
    if (result.passed) return true;
    if (result.diffPercent <= _kGoldenThreshold) return true;

    final failurePath = goldenFile.path.replaceFirst('.png', '.failure.png');
    await File(failurePath).writeAsBytes(imageBytes);
    throw TestFailure(
      'Golden "${golden.path}" diff ${(result.diffPercent * 100).toStringAsFixed(2)}% '
      'exceeds threshold ${(_kGoldenThreshold * 100).toStringAsFixed(1)}%.\n'
      'Actual image → $failurePath\n'
      'Run `flutter test --update-goldens` to accept the new rendering.',
    );
  }

  @override
  Future<void> update(Uri golden, Uint8List imageBytes) async {
    final file = _resolve(golden);
    await file.parent.create(recursive: true);
    await file.writeAsBytes(imageBytes);
  }

  File _resolve(Uri golden) => File.fromUri(basedir.resolve(golden.path));
}
