import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/supabase_client.dart';
import '../../providers/providers.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_theme.dart';
import '../../theme/app_typography.dart';
import '../../widgets/widgets.dart';

// Minimal email validation mirroring the wireframe regex (\S+@\S+\.\S+).
bool _isValidEmail(String v) => RegExp(r'\S+@\S+\.\S+').hasMatch(v.trim());

enum _AuthStep { email, sent }

/// Magic-link sign-in screen. Entered only from Settings → Account → "Sign in".
/// Two steps: email input → link-sent confirmation. No password, no social auth.
///
/// On sign-in (authStateProvider emits signedIn): pops back to the caller.
/// Does NOT push to a new destination — it is a modal that returns control.
class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  _AuthStep _step = _AuthStep.email;
  final _emailController = TextEditingController();
  bool _sending = false;
  String? _error;
  String _sentEmail = '';

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Listen for the deep-link callback completing sign-in → pop back to Settings.
    ref.listen<AsyncValue<AuthState>>(authStateProvider, (_, next) {
      next.whenData((state) {
        if (state.event == AuthChangeEvent.signedIn && mounted) {
          context.pop();
        }
      });
    });

    return SafeScaffold(
      safeBottom: true,
      body: Column(
        children: [
          // Top bar: back chevron only; no title (matches wireframe).
          HalveTopBar(onBack: () => context.pop()),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(28, 0, 28, 32),
              child: _step == _AuthStep.email
                  ? _EmailStep(
                      controller: _emailController,
                      sending: _sending,
                      error: _error,
                      onContinue: _handleContinue,
                      onDevSignIn: (kDebugMode && devEmail.isNotEmpty && devPassword.isNotEmpty)
                          ? _handleDevSignIn
                          : null,
                    )
                  : _SentStep(
                      email: _sentEmail,
                      onResend: _handleResend,
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleContinue() async {
    final email = _emailController.text.trim();
    if (!_isValidEmail(email) || _sending) return;
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).signInWithMagicLink(email);
      if (!mounted) return;
      setState(() {
        _sentEmail = email;
        _step = _AuthStep.sent;
        _sending = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _sending = false;
        _error = _friendlyError(e);
      });
    }
  }

  Future<void> _handleResend() async {
    if (_sentEmail.isEmpty) return;
    try {
      await ref.read(authRepositoryProvider).signInWithMagicLink(_sentEmail);
    } catch (_) {}
  }

  Future<void> _handleDevSignIn() async {
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await ref
          .read(authRepositoryProvider)
          .signInWithPassword(devEmail, devPassword);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = _friendlyError(e));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  String _friendlyError(Object e) {
    final msg = e.toString().toLowerCase();
    if (msg.contains('rate') || msg.contains('too many')) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    if (msg.contains('network') ||
        msg.contains('socket') ||
        msg.contains('connection')) {
      return 'No connection. Check your internet and try again.';
    }
    return 'Something went wrong. Please try again.';
  }
}

// ─── Email input step ─────────────────────────────────────────────────────────

class _EmailStep extends StatelessWidget {
  const _EmailStep({
    required this.controller,
    required this.sending,
    required this.error,
    required this.onContinue,
    this.onDevSignIn,
  });

  final TextEditingController controller;
  final bool sending;
  final String? error;
  final VoidCallback onContinue;

  /// Dev-only one-tap sign-in. Null in release / when DEV_EMAIL+DEV_PASSWORD
  /// are not set in env.json.
  final VoidCallback? onDevSignIn;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 44),
        // Visual anchor — 30px brand mark
        const HalveMark(size: 30),
        const SizedBox(height: 18),
        Text(
          'Sign in to keep your streak safe',
          style: AppTypography.h2.copyWith(color: c.fg1),
        ),
        const SizedBox(height: 10),
        Text(
          "We'll send a link to your email — no password needed.",
          style: AppTypography.small.copyWith(
            fontSize: 15,
            color: c.fg2,
            height: 1.55,
          ),
        ),
        const SizedBox(height: 36),
        // Eyebrow label
        Text(
          'EMAIL',
          style: AppTypography.label.copyWith(color: c.fg3),
        ),
        const SizedBox(height: 8),
        _EmailInput(
          controller: controller,
          enabled: !sending,
          onSubmit: onContinue,
        ),
        if (error != null) ...[
          const SizedBox(height: 8),
          Text(
            error!,
            style: AppTypography.small.copyWith(color: c.wrong),
          ),
        ],
        const SizedBox(height: 16),
        // Continue — disabled until valid email
        ValueListenableBuilder<TextEditingValue>(
          valueListenable: controller,
          builder: (context, value, _) {
            final valid = _isValidEmail(value.text);
            return HalveButton(
              label: sending ? 'Sending…' : 'Continue',
              full: true,
              onPressed: valid && !sending ? onContinue : null,
            );
          },
        ),
        // ── Dev-only one-tap sign-in ─────────────────────────────────────
        if (onDevSignIn != null) ...[
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(child: Divider(color: c.hairline2)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text('DEV', style: AppTypography.label.copyWith(color: c.fg3)),
              ),
              Expanded(child: Divider(color: c.hairline2)),
            ],
          ),
          const SizedBox(height: 16),
          HalveButton(
            label: sending ? 'Signing in…' : 'Sign in as test user',
            full: true,
            onPressed: sending ? null : onDevSignIn,
          ),
        ],
      ],
    );
  }
}

class _EmailInput extends StatelessWidget {
  const _EmailInput({
    required this.controller,
    required this.enabled,
    required this.onSubmit,
  });

  final TextEditingController controller;
  final bool enabled;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;

    return TextField(
      controller: controller,
      enabled: enabled,
      keyboardType: TextInputType.emailAddress,
      textInputAction: TextInputAction.done,
      autocorrect: false,
      enableSuggestions: false,
      onSubmitted: (_) {
        if (_isValidEmail(controller.text)) onSubmit();
      },
      style: AppTypography.body.copyWith(
        color: c.fg1,
        letterSpacing: -0.16,
      ),
      decoration: InputDecoration(
        hintText: 'you@example.com',
        hintStyle: AppTypography.body.copyWith(color: c.fg3),
        filled: true,
        fillColor: c.surface,
        // 15px vertical padding + ~24px line-height ≈ 54px total height.
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s4,
          vertical: 15,
        ),
        border: OutlineInputBorder(
          borderRadius: AppRadii.lgR,
          borderSide: BorderSide(color: c.hairline2, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppRadii.lgR,
          borderSide: BorderSide(color: c.hairline2, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppRadii.lgR,
          borderSide: BorderSide(color: c.accent, width: 1.5),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: AppRadii.lgR,
          borderSide: BorderSide(color: c.hairline2, width: 1.5),
        ),
      ),
    );
  }
}

// ─── Link-sent step ───────────────────────────────────────────────────────────

class _SentStep extends StatefulWidget {
  const _SentStep({required this.email, required this.onResend});

  final String email;
  final VoidCallback onResend;

  @override
  State<_SentStep> createState() => _SentStepState();
}

class _SentStepState extends State<_SentStep> {
  bool _resent = false;
  Timer? _resetTimer;

  @override
  void dispose() {
    _resetTimer?.cancel();
    super.dispose();
  }

  void _handleResend() {
    if (_resent) return;
    setState(() => _resent = true);
    widget.onResend();
    _resetTimer = Timer(const Duration(milliseconds: 2500), () {
      if (mounted) setState(() => _resent = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 44),
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(color: c.accentTint, shape: BoxShape.circle),
          alignment: Alignment.center,
          child: CustomPaint(
            size: const Size(22, 22),
            painter: _CheckPainter(color: c.accent),
          ),
        ),
        const SizedBox(height: 20),
        Text('Check your email', style: AppTypography.h2.copyWith(color: c.fg1)),
        const SizedBox(height: 10),
        RichText(
          text: TextSpan(
            style: AppTypography.small.copyWith(fontSize: 15, color: c.fg2, height: 1.55),
            children: [
              const TextSpan(text: 'We sent a link to '),
              TextSpan(
                text: widget.email,
                style: TextStyle(color: c.fg1, fontWeight: FontWeight.w500),
              ),
              const TextSpan(text: '. Tap it on this device to sign in.'),
            ],
          ),
        ),
        const SizedBox(height: 28),
        GestureDetector(
          onTap: _resent ? null : _handleResend,
          child: AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 150),
            style: AppTypography.small.copyWith(
              color: _resent ? c.fg3 : c.accent,
              letterSpacing: -0.14,
            ),
            child: Text(_resent ? 'Link sent again' : "Didn't get it? Resend"),
          ),
        ),
      ],
    );
  }
}

// ─── Check icon painter ───────────────────────────────────────────────────────

/// Polyline checkmark matching the wireframe SVG (`points="20 6 9 17 4 12"`
/// in a 24×24 viewbox), scaled to [size].
class _CheckPainter extends CustomPainter {
  const _CheckPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..isAntiAlias = true;
    final sx = size.width / 24;
    final sy = size.height / 24;
    final path = Path()
      ..moveTo(20 * sx, 6 * sy)
      ..lineTo(9 * sx, 17 * sy)
      ..lineTo(4 * sx, 12 * sy);
    canvas.drawPath(path, p);
  }

  @override
  bool shouldRepaint(_CheckPainter old) => old.color != color;
}
