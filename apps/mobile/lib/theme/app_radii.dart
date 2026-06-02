import 'package:flutter/widgets.dart';

/// Corner radii. Mirrors the `--radius-*` tokens in
/// `packages/design/styles/tokens.css`.
abstract final class AppRadii {
  static const double sm = 6;
  static const double md = 10;
  static const double cell = 12; // puzzle cell
  static const double lg = 16;
  static const double xl = 22; // large cards / sheets
  static const double full = 999; // pills

  // Ready-to-use BorderRadius helpers.
  static const smR = BorderRadius.all(Radius.circular(sm));
  static const mdR = BorderRadius.all(Radius.circular(md));
  static const cellR = BorderRadius.all(Radius.circular(cell));
  static const lgR = BorderRadius.all(Radius.circular(lg));
  static const xlR = BorderRadius.all(Radius.circular(xl));
  static const fullR = BorderRadius.all(Radius.circular(full));
}
