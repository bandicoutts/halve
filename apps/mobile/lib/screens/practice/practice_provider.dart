import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/models.dart';

/// The currently-selected difficulty on the Practice picker screen.
/// Auto-disposed so the picker resets to Medium each visit.
final selectedDifficultyProvider = StateProvider.autoDispose<Difficulty>(
  (ref) => Difficulty.medium,
);
