/// Fixed structural dimensions that don't belong in the 8-point spacing scale.
/// Mirrors structural decisions in `docs/DESIGN.md` and the mobile wireframe.
abstract final class AppLayout {
  /// Height of the top bar chrome (HalveTopBar, _WinTopBar, iOS bottom nav
  /// content area). Hardcoded 52 in three separate places — kept here so a
  /// single change tracks all three.
  static const double topBarHeight = 52.0;

  /// Height of the primary pill button (HalveButton). Also used as the minimum
  /// height for footer status rows so layout doesn't shift between a button
  /// and a text status.
  static const double buttonHeight = 54.0;

  /// Horizontal content padding inside HalveButton.
  static const double buttonPadH = 28.0;

  /// Height of the solve-time area chart in StatsScreen.
  static const double statsChartHeight = 132.0;

  /// Cell size for the 4×4 guided board in the tutorial.
  static const double tutBoardCell = 56.0;

  /// Cell size for the win-state framed board in the tutorial.
  static const double tutWinBoardCell = 52.0;
}
