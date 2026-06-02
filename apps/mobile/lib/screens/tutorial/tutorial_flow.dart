import 'package:flutter/material.dart';

import '../../data/models/models.dart';
import '../../engine/validator.dart' as validator;
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';
import 'teach_board.dart';
import 'tut_fixture.dart';

/// Teach-by-doing on a single 4×4: a two-symbol intro, the three rules (no
/// crowding, half-and-half, read the edges) each with ✓/✗ examples, then a
/// guided forced move into a free solve. Skippable at every step. A faithful
/// port of `TutorialFlow` in the wireframe `tutorial.jsx`; reuses the on-device
/// [validator] for live conflict feedback during the solve.
class TutorialFlow extends StatefulWidget {
  const TutorialFlow({
    super.key,
    required this.onSkip,
    required this.onComplete,
  });

  /// Skip the tutorial entirely (every step shows a Skip link).
  final VoidCallback onSkip;

  /// The guided solve finished — advance to the "you've got it" beat.
  final VoidCallback onComplete;

  @override
  State<TutorialFlow> createState() => _TutorialFlowState();
}

class _TutorialFlowState extends State<TutorialFlow> {
  static const _steps = 5;

  int _step = 0;

  /// Guided solve: 0 = the one forced move is pending, 1 = free solve.
  int _gphase = 0;
  bool _completed = false;

  late final Grid _cells = _clone(Tut4.givens);
  Set<validator.Coord> _violations = const {};

  static Grid _clone(Grid g) => [for (final row in g) List<Cell>.from(row)];

  bool get _solved {
    for (var r = 0; r < Tut4.n; r++) {
      for (var c = 0; c < Tut4.n; c++) {
        if (_cells[r][c] != Tut4.solution[r][c]) return false;
      }
    }
    return true;
  }

  void _tapGuide() {
    setState(() {
      _cells[Tut4.guide.r][Tut4.guide.c] = Tut4.guide.val;
      _gphase = 1;
      _violations = validator.findViolations(_cells, Tut4.edges);
    });
  }

  void _tapFree(int r, int c) {
    if (Tut4.givens[r][c] != null) return; // locked given
    setState(() {
      _cells[r][c] = validator.cycle(_cells[r][c]);
      _violations = validator.findViolations(_cells, Tut4.edges);
    });
    if (_solved && !_completed) {
      _completed = true;
      final delay = context.reduceMotion
          ? Duration.zero
          : const Duration(milliseconds: 420);
      Future<void>.delayed(delay, () {
        if (mounted) widget.onComplete();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeScaffold(
      safeBottom: true,
      body: Column(
        children: [
          // Header: progress dots + skip.
          Padding(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.s5, AppSpacing.s2, AppSpacing.s4, 0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _Progress(count: _steps, index: _step),
                _SkipLink(onTap: widget.onSkip),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.s5, vertical: AppSpacing.s3),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 380),
                  child: _StepBody(
                    step: _step,
                    gphase: _gphase,
                    cells: _cells,
                    violations: _violations,
                    onTapGuide: _tapGuide,
                    onTapFree: _tapFree,
                  ),
                ),
              ),
            ),
          ),
          // Footer: the step's primary action / status line.
          Padding(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.s5, AppSpacing.s3, AppSpacing.s5, AppSpacing.s4),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 380),
              child: _StepFooter(
                step: _step,
                gphase: _gphase,
                violationCount: _violations.length,
                onNext: () => setState(() => _step++),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// The per-step title + body content.
class _StepBody extends StatelessWidget {
  const _StepBody({
    required this.step,
    required this.gphase,
    required this.cells,
    required this.violations,
    required this.onTapGuide,
    required this.onTapFree,
  });

  final int step;
  final int gphase;
  final Grid cells;
  final Set<validator.Coord> violations;
  final VoidCallback onTapGuide;
  final void Function(int r, int c) onTapFree;

  @override
  Widget build(BuildContext context) {
    final (title, body) = switch (step) {
      0 => ('Two symbols', _intro(context)),
      1 => ('No crowding', _noCrowding(context)),
      2 => ('Half and half', _halfAndHalf(context)),
      3 => ('Read the edges', _readEdges(context)),
      _ => (gphase == 0 ? 'Your turn' : 'Finish it', _guided(context)),
    };

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          title,
          textAlign: TextAlign.center,
          style: AppTypography.h1.copyWith(
            fontSize: 30,
            height: 1.1,
            letterSpacing: -0.75, // -0.025em
            color: context.halveColors.fg1,
          ),
        ),
        const SizedBox(height: AppSpacing.s4 + 2),
        body,
      ],
    );
  }

  Widget _intro(BuildContext context) {
    final c = context.halveColors;
    Widget labelled(Widget symbol, String label) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            symbol,
            const SizedBox(height: AppSpacing.s3),
            Text(label, style: AppTypography.small.copyWith(color: c.fg3)),
          ],
        );
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            labelled(const SymbolDisc(size: 72), 'Disc'),
            const SizedBox(width: 30),
            labelled(const SymbolRing(size: 72), 'Ring'),
          ],
        ),
        const SizedBox(height: AppSpacing.s6),
        const _Copy(
          'Halve is played with a disc and a ring. Every square holds one or '
          'the other — one fills the space, the other defines it.',
        ),
      ],
    );
  }

  Widget _noCrowding(BuildContext context) {
    return const Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _Copy(
          'No more than two of the same symbol may touch — across a row or '
          'down a column.',
        ),
        SizedBox(height: AppSpacing.s4),
        _DemoBox(children: [
          _RuleStrip(cells: [(0, false), (0, false), (1, false)], good: true),
          _RuleStrip(cells: [(0, true), (0, true), (0, true)], good: false),
        ]),
      ],
    );
  }

  Widget _halfAndHalf(BuildContext context) {
    return const Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _Copy(
          'Each row and column holds an equal count of each symbol. That '
          'balance is what Halve means.',
        ),
        SizedBox(height: AppSpacing.s4),
        _DemoBox(children: [
          _RuleStrip(
              cells: [(0, false), (1, false), (0, false), (1, false)],
              good: true),
          _RuleStrip(
              cells: [(0, true), (1, false), (0, true), (0, true)],
              good: false),
        ]),
      ],
    );
  }

  Widget _readEdges(BuildContext context) {
    return const Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _Copy(
          'A sign between two squares is a clue. = means they match; '
          '≠ means they differ.',
        ),
        SizedBox(height: AppSpacing.s4),
        _DemoBox(children: [
          _RuleStrip(
              cells: [(0, false), (0, false)],
              signAfter: 0,
              signKind: EdgeSign.eq,
              good: true),
          _RuleStrip(
              cells: [(0, false), (1, false)],
              signAfter: 0,
              signKind: EdgeSign.ne,
              good: true),
          _RuleStrip(
              cells: [(0, true), (1, true)],
              signAfter: 0,
              signKind: EdgeSign.eq,
              good: false),
        ]),
      ],
    );
  }

  Widget _guided(BuildContext context) {
    final guided = gphase == 0;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _Copy(
          guided
              ? "This square's column already holds two discs, and the ≠ clue "
                  'rules out another. It can only be a ring — tap it.'
              : 'Every square is forced the same way — no guessing. Finish the '
                  'grid.',
        ),
        const SizedBox(height: AppSpacing.s5),
        TeachBoard(
          cells: cells,
          givens: Tut4.givens,
          edges: Tut4.edges,
          cellSize: AppLayout.tutBoardCell,
          gap: AppSpacing.s4,
          violations: guided ? const <validator.Coord>{} : violations,
          highlight: guided ? {(Tut4.guide.r, Tut4.guide.c)} : const {},
          dimRest: guided,
          onTap: guided ? (_, _) => onTapGuide() : onTapFree,
          tappable: guided
              ? (r, c) => r == Tut4.guide.r && c == Tut4.guide.c
              : (r, c) => Tut4.givens[r][c] == null,
        ),
      ],
    );
  }
}

/// The footer changes per step: a primary button for the lesson steps, a status
/// line for the guided solve.
class _StepFooter extends StatelessWidget {
  const _StepFooter({
    required this.step,
    required this.gphase,
    required this.violationCount,
    required this.onNext,
  });

  final int step;
  final int gphase;
  final int violationCount;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    if (step < 4) {
      return HalveButton(
        label: step == 3 ? 'Got it' : 'Next',
        full: true,
        onPressed: onNext,
      );
    }
    final c = context.halveColors;
    final String status;
    if (gphase == 0) {
      status = 'Tap the highlighted square';
    } else if (violationCount > 0) {
      status = '$violationCount square${violationCount == 1 ? '' : 's'} '
          'in conflict';
    } else {
      status = 'Place a disc or ring in every square';
    }
    return SizedBox(
      height: AppLayout.buttonHeight,
      child: Center(
        child: Text(
          status,
          textAlign: TextAlign.center,
          style: AppTypography.small.copyWith(color: c.fg3),
        ),
      ),
    );
  }
}

/// The "you've got it" beat after the first solve — quiet, no celebration
/// overkill. A framed keepsake of the solved 4×4. Mirrors `TutorialWin`.
class TutorialWin extends StatelessWidget {
  const TutorialWin({
    super.key,
    required this.onContinue,
    this.continueLabel = 'Continue',
  });

  final VoidCallback onContinue;
  final String continueLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final reduceMotion = context.reduceMotion;
    final solvedCells = [for (final row in Tut4.solution) [...row]];

    return SafeScaffold(
      safeBottom: true,
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.s5, vertical: AppSpacing.s5),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 380),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TweenAnimationBuilder<double>(
                        tween: Tween(begin: reduceMotion ? 1.0 : 0.7, end: 1.0),
                        duration: reduceMotion
                            ? Duration.zero
                            : const Duration(milliseconds: 600),
                        curve: const Cubic(0.34, 1.56, 0.64, 1),
                        builder: (_, s, child) =>
                            Transform.scale(scale: s, child: child),
                        child: const HalveMark(size: 46),
                      ),
                      const SizedBox(height: AppSpacing.s5),
                      Text(
                        "You've got it",
                        textAlign: TextAlign.center,
                        style: AppTypography.h1.copyWith(
                          fontSize: 32,
                          letterSpacing: -0.8,
                          color: c.fg1,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.s2),
                      const _Copy(
                        'Solved by pure deduction — exactly how every Halve is '
                        'meant to go.',
                      ),
                      const SizedBox(height: AppSpacing.s6),
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.s5),
                        decoration: BoxDecoration(
                          color: c.surface,
                          border: Border.all(color: c.hairline),
                          borderRadius: AppRadii.xlR,
                          boxShadow: context.halveShadows.md,
                        ),
                        child: TeachBoard(
                          cells: solvedCells,
                          givens: Tut4.solution, // all "given" → no entered shadow
                          edges: const [],
                          cellSize: AppLayout.tutWinBoardCell,
                          gap: 9,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.s5, AppSpacing.s3, AppSpacing.s5, AppSpacing.s4),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 380),
              child: HalveButton(
                label: continueLabel,
                full: true,
                onPressed: onContinue,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── small shared pieces ──────────────────────────────────────────────────

/// Centered teaching paragraph.
class _Copy extends StatelessWidget {
  const _Copy(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      textAlign: TextAlign.center,
      style: AppTypography.body.copyWith(
        height: 1.55,
        color: context.halveColors.fg2,
      ),
    );
  }
}

/// The bordered card that frames the ✓/✗ rule examples.
class _DemoBox extends StatelessWidget {
  const _DemoBox({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s5, vertical: AppSpacing.s4 + 4),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border.all(color: c.hairline),
        borderRadius: AppRadii.lgR,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) const SizedBox(height: AppSpacing.s3 + 2),
            children[i],
          ],
        ],
      ),
    );
  }
}

/// One example row: a strip of display cells (optionally with an inline edge
/// sign) and a trailing ✓/✗ verdict.
class _RuleStrip extends StatelessWidget {
  const _RuleStrip({
    required this.cells,
    required this.good,
    this.signAfter,
    this.signKind,
  });

  /// Each `(value, isViolation)`.
  final List<(int, bool)> cells;
  final bool good;
  final int? signAfter;
  final EdgeSign? signKind;

  static const _cell = 46.0;

  @override
  Widget build(BuildContext context) {
    const signSize = _cell * 0.42;
    final strip = <Widget>[];
    for (var i = 0; i < cells.length; i++) {
      if (i > 0) strip.add(const SizedBox(width: 12));
      strip.add(TeachCell(
        value: cells[i].$1,
        size: _cell,
        violation: cells[i].$2,
      ));
      if (signAfter == i && signKind != null) {
        strip
          ..add(const SizedBox(width: 6))
          ..add(EqNeBadge(sign: signKind!, size: signSize))
          ..add(const SizedBox(width: 6));
      }
    }
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(mainAxisSize: MainAxisSize.min, children: strip),
        const SizedBox(width: AppSpacing.s3 + 2),
        _GoodBad(good: good),
      ],
    );
  }
}

class _GoodBad extends StatelessWidget {
  const _GoodBad({required this.good});

  final bool good;

  static const double size = 26;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: good ? c.correctTint : c.wrongTint,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Icon(
        good ? Icons.check_rounded : Icons.close_rounded,
        size: size * 0.6,
        color: good ? c.correct : c.wrong,
      ),
    );
  }
}

/// The step progress dots — the current one widens to an accent bar.
class _Progress extends StatelessWidget {
  const _Progress({required this.count, required this.index});

  final int count;
  final int index;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < count; i++) ...[
          if (i > 0) const SizedBox(width: 6),
          AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeInOut,
            height: 6,
            width: i == index ? 20 : 6,
            decoration: BoxDecoration(
              color: i <= index ? c.accent : c.hairline2,
              borderRadius: AppRadii.fullR,
            ),
          ),
        ],
      ],
    );
  }
}

class _SkipLink extends StatelessWidget {
  const _SkipLink({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        constraints: const BoxConstraints(minHeight: 44),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s1),
        alignment: Alignment.center,
        child: Text(
          'Skip',
          style: AppTypography.small.copyWith(
            color: c.fg3,
            fontWeight: FontWeight.w500,
            fontVariations: const [FontVariation('wght', 500)],
          ),
        ),
      ),
    );
  }
}
