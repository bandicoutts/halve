import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/models.dart';
import '../../router/app_router.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';
import 'practice_provider.dart';

/// Difficulty picker for Practice mode. Lets the player choose Easy / Medium /
/// Hard, then launches the practice play board via [Routes.practicePlay].
/// Matches the `PracticeScreen` wireframe in `app/screens/practice.jsx`.
class PracticeScreen extends ConsumerWidget {
  const PracticeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(selectedDifficultyProvider);
    final c = context.halveColors;

    return SafeScaffold(
      safeBottom: true,
      body: Column(
        children: [
          HalveTopBar(
            title: 'Practice',
            onBack: () => context.canPop() ? context.pop() : context.go(Routes.home),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.s5, AppSpacing.s5, AppSpacing.s5, AppSpacing.s3,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'DIFFICULTY',
                    style: AppTypography.label.copyWith(color: c.fg3),
                  ),
                  const SizedBox(height: AppSpacing.s3),
                  for (final diff in Difficulty.values) ...[
                    _DifficultyCard(
                      difficulty: diff,
                      selected: selected == diff,
                      onSelect: (d) =>
                          ref.read(selectedDifficultyProvider.notifier).state = d,
                    ),
                    if (diff != Difficulty.hard)
                      const SizedBox(height: AppSpacing.s2 + 2),
                  ],
                ],
              ),
            ),
          ),
          _PlayCta(selected: selected),
        ],
      ),
    );
  }
}

class _PlayCta extends StatelessWidget {
  const _PlayCta({required this.selected});

  final Difficulty selected;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Container(
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: c.hairline, width: 1)),
        color: c.bg,
      ),
      padding: EdgeInsets.fromLTRB(
        AppSpacing.s5,
        AppSpacing.s3,
        AppSpacing.s5,
        AppSpacing.s4 + MediaQuery.viewPaddingOf(context).bottom,
      ),
      child: HalveButton(
        label: 'Play',
        full: true,
        onPressed: () => context.push(
          Routes.practicePlay(difficulty: selected.wire),
        ),
      ),
    );
  }
}

class _DifficultyCard extends StatefulWidget {
  const _DifficultyCard({
    required this.difficulty,
    required this.selected,
    required this.onSelect,
  });

  final Difficulty difficulty;
  final bool selected;
  final ValueChanged<Difficulty> onSelect;

  @override
  State<_DifficultyCard> createState() => _DifficultyCardState();
}

class _DifficultyCardState extends State<_DifficultyCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final s = context.halveShadows;
    final selected = widget.selected;

    final bg = selected
        ? c.accentTint
        : _pressed
            ? c.bgSunken
            : c.surface;
    final borderColor = selected ? c.accent : c.hairline;
    final borderWidth = selected ? 2.0 : 1.0;

    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onSelect(widget.difficulty);
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s4 + 2,
          vertical: AppSpacing.s4,
        ),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: AppRadii.lgR,
          border: Border.all(color: borderColor, width: borderWidth),
          boxShadow: selected ? [] : s.sm,
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 120),
                    style: AppTypography.body.copyWith(
                      fontWeight: FontWeight.w600,
                      letterSpacing: -0.01 * 17,
                      color: selected ? c.accent : c.fg1,
                    ),
                    child: Text(widget.difficulty.label),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _desc(widget.difficulty),
                    style: AppTypography.small.copyWith(
                      fontSize: 13,
                      color: c.fg3,
                      height: 1.45,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.s4),
            _RadioDot(selected: selected),
          ],
        ),
      ),
    );
  }
}

class _RadioDot extends StatelessWidget {
  const _RadioDot({required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final borderColor = selected ? c.accent : c.hairline2;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 120),
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: selected ? c.accent : Colors.transparent,
        border: Border.all(color: borderColor, width: 2),
      ),
      child: selected
          ? CustomPaint(painter: _CheckPainter(color: c.onAccent))
          : null,
    );
  }
}

class _CheckPainter extends CustomPainter {
  const _CheckPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    // Checkmark: polyline 20 6 9 17 4 12 (scaled from 24×24 to size)
    final sx = size.width / 24;
    final sy = size.height / 24;
    final path = Path()
      ..moveTo(20 * sx, 6 * sy)
      ..lineTo(9 * sx, 17 * sy)
      ..lineTo(4 * sx, 12 * sy);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_CheckPainter old) => old.color != color;
}

String _desc(Difficulty d) => switch (d) {
      Difficulty.easy => 'More edge signs to guide you. Good for learning the rules.',
      Difficulty.medium =>
        'A balanced challenge — the same level as the daily puzzle.',
      Difficulty.hard => 'Fewer edge clues, more room to think.',
    };
