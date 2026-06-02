import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../data/prefs_keys.dart';
import '../../providers/providers.dart';
import '../../router/app_router.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_theme.dart';
import '../../theme/app_typography.dart';
import '../../theme/breakpoints.dart';
import '../../widgets/widgets.dart';
import 'settings_provider.dart';

// ─── Primitive widgets ────────────────────────────────────────────────────────

/// iOS-style custom toggle switch matching the wireframe's `HvToggle`.
class _HvSwitch extends StatelessWidget {
  const _HvSwitch({required this.on, required this.onToggle});

  final bool on;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final s = context.halveShadows;
    return GestureDetector(
      onTap: onToggle,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        width: 51,
        height: 31,
        decoration: BoxDecoration(
          color: on ? c.accent : c.hairline2,
          borderRadius: AppRadii.fullR,
        ),
        padding: const EdgeInsets.all(2),
        alignment: on ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          width: 27,
          height: 27,
          decoration: BoxDecoration(
            color: c.surfaceRaised,
            shape: BoxShape.circle,
            boxShadow: s.sm,
          ),
        ),
      ),
    );
  }
}

/// Segmented control for System / Light / Dark theme selection.
class _ThemeSegment extends ConsumerWidget {
  const _ThemeSegment();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.halveColors;
    final s = context.halveShadows;
    final mode = ref.watch(themeModeProvider);

    const options = [
      (label: 'System', mode: ThemeMode.system),
      (label: 'Light', mode: ThemeMode.light),
      (label: 'Dark', mode: ThemeMode.dark),
    ];

    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: c.bgSunken,
        borderRadius: AppRadii.fullR,
      ),
      padding: const EdgeInsets.all(3),
      child: Row(
        children: options.map((opt) {
          final active = opt.mode == mode;
          return Expanded(
            child: GestureDetector(
              onTap: () =>
                  ref.read(themeModeProvider.notifier).setMode(opt.mode),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                curve: Curves.easeOut,
                decoration: BoxDecoration(
                  color: active ? c.surfaceRaised : Colors.transparent,
                  borderRadius: AppRadii.fullR,
                  boxShadow: active ? s.sm : null,
                ),
                alignment: Alignment.center,
                child: Text(
                  opt.label,
                  style: AppTypography.small.copyWith(
                    color: active ? c.fg1 : c.fg3,
                    fontWeight:
                        active ? FontWeight.w600 : FontWeight.w400,
                    letterSpacing: -0.14,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

/// Small chevron arrow. [direction]: 1 = right (default), -1 = left.
class _ChevronIcon extends StatelessWidget {
  const _ChevronIcon({this.color, this.direction = 1, this.size = 18});

  final Color? color;
  final int direction;
  final double size;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return CustomPaint(
      size: Size(size, size),
      painter: _ChevronPainter(
          color: color ?? c.fg3, direction: direction),
    );
  }
}

class _ChevronPainter extends CustomPainter {
  _ChevronPainter({required this.color, this.direction = 1});
  final Color color;
  final int direction;

  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.75
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..isAntiAlias = true;
    final cx = size.width / 2;
    final cy = size.height / 2;
    if (direction > 0) {
      canvas.drawLine(Offset(cx - 2.5, cy - 4.5), Offset(cx + 2.5, cy), p);
      canvas.drawLine(Offset(cx + 2.5, cy), Offset(cx - 2.5, cy + 4.5), p);
    } else {
      canvas.drawLine(Offset(cx + 2.5, cy - 4.5), Offset(cx - 2.5, cy), p);
      canvas.drawLine(Offset(cx - 2.5, cy), Offset(cx + 2.5, cy + 4.5), p);
    }
  }

  @override
  bool shouldRepaint(_ChevronPainter old) =>
      old.color != color || old.direction != direction;
}

/// Account avatar — accent-tint circle with the first letter of [name].
class _AvatarInitial extends StatelessWidget {
  const _AvatarInitial(this.name);

  final String name;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: c.accentTint,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: AppTypography.small.copyWith(
          color: c.accent,
          fontWeight: FontWeight.w600,
          height: 1,
        ),
      ),
    );
  }
}

// ─── Section / row components ─────────────────────────────────────────────────

/// A grouped settings section with an eyebrow label and a card-like container.
class _SettingsSection extends StatelessWidget {
  const _SettingsSection(this.title, {required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(
                left: AppSpacing.s1, bottom: AppSpacing.s2),
            child: Text(
              title.toUpperCase(),
              style: AppTypography.label.copyWith(color: c.fg3),
            ),
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: AppRadii.lgR,
              border: Border.all(color: c.hairline),
            ),
            child: ClipRRect(
              borderRadius: AppRadii.lgR,
              child: Column(
                children: [
                  for (var i = 0; i < children.length; i++) ...[
                    if (i > 0)
                      Divider(
                        height: 1,
                        thickness: 1,
                        color: c.hairline,
                        indent: 0,
                        endIndent: 0,
                      ),
                    children[i],
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// A single row inside a [_SettingsSection]. Press state dims to bgSunken when
/// [onTap] is provided.
class _SettingsRow extends StatefulWidget {
  const _SettingsRow({
    required this.label,
    this.sublabel,
    this.leading,
    this.trailing,
    this.onTap,
    this.destructive = false,
    this.child,
  });

  final String label;
  final String? sublabel;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool destructive;

  /// Optional widget rendered below the main row content (e.g. the theme
  /// segmented control or the time-picker). Gets 14px bottom padding.
  final Widget? child;

  @override
  State<_SettingsRow> createState() => _SettingsRowState();
}

class _SettingsRowState extends State<_SettingsRow> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;

    return GestureDetector(
      onTapDown:
          widget.onTap != null ? (_) => setState(() => _pressed = true) : null,
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        color: _pressed && widget.onTap != null ? c.bgSunken : c.surface,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.s4, vertical: 14),
              child: Row(
                children: [
                  if (widget.leading != null) ...[
                    widget.leading!,
                    const SizedBox(width: AppSpacing.s3),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.label,
                          style: AppTypography.body.copyWith(
                            color: widget.destructive ? c.wrong : c.fg1,
                            letterSpacing: -0.16,
                            height: 1.25,
                          ),
                        ),
                        if (widget.sublabel != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            widget.sublabel!,
                            style: AppTypography.small.copyWith(
                                color: c.fg3, height: 1.3),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (widget.trailing != null) ...[
                    const SizedBox(width: AppSpacing.s2),
                    widget.trailing!,
                  ],
                ],
              ),
            ),
            if (widget.child != null)
              Padding(
                padding: const EdgeInsets.only(
                    left: AppSpacing.s4,
                    right: AppSpacing.s4,
                    bottom: 14),
                child: widget.child,
              ),
          ],
        ),
      ),
    );
  }
}

/// Time picker row inside the Notifications section when reminder is on.
class _TimePickerRow extends StatelessWidget {
  const _TimePickerRow({
    required this.hour,
    required this.ampm,
    required this.onDecrease,
    required this.onIncrease,
    required this.onToggleAmpm,
  });

  final int hour;
  final String ampm;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;
  final VoidCallback onToggleAmpm;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final label = '${hour.toString().padLeft(2, '0')}:00';
    return Row(
      children: [
        Text('Time', style: AppTypography.small.copyWith(color: c.fg3)),
        const Spacer(),
        _StepButton(
          onTap: onDecrease,
          child: _ChevronIcon(direction: -1, size: 14, color: c.fg2),
        ),
        const SizedBox(width: AppSpacing.s2),
        Text(
          label,
          style: AppTypography.tabular(
            AppTypography.body.copyWith(
                color: c.fg1, fontWeight: FontWeight.w600),
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(width: AppSpacing.s2),
        _StepButton(
          onTap: onIncrease,
          child: _ChevronIcon(direction: 1, size: 14, color: c.fg2),
        ),
        const SizedBox(width: AppSpacing.s2),
        _StepButton(
          onTap: onToggleAmpm,
          minWidth: 38,
          child: Text(
            ampm,
            style: AppTypography.small.copyWith(
                color: c.fg2, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

class _StepButton extends StatefulWidget {
  const _StepButton({
    required this.child,
    required this.onTap,
    this.minWidth = 32,
  });

  final Widget child;
  final VoidCallback onTap;
  final double minWidth;

  @override
  State<_StepButton> createState() => _StepButtonState();
}

class _StepButtonState extends State<_StepButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
        child: Center(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 100),
            height: 32,
            constraints: BoxConstraints(minWidth: widget.minWidth),
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s2),
            decoration: BoxDecoration(
              color: _pressed ? c.bgSunken : Colors.transparent,
              border: Border.all(color: c.hairline2),
              borderRadius: AppRadii.fullR,
            ),
            alignment: Alignment.center,
            child: widget.child,
          ),
        ),
      ),
    );
  }
}

// ─── Settings screen ──────────────────────────────────────────────────────────

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  SharedPreferences? _prefs;
  bool _reminderOn = false;
  int _reminderHour = 8;
  String _reminderAmpm = 'am';
  bool _haptics = true;

  @override
  void initState() {
    super.initState();
    _loadLocalPrefs();
  }

  Future<void> _loadLocalPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (!mounted) return;
      _prefs = prefs;
      setState(() {
        _reminderOn = prefs.getBool(prefKeyReminder) ?? false;
        _reminderHour = prefs.getInt(prefKeyReminderHour) ?? 8;
        _reminderAmpm = prefs.getString(prefKeyReminderAmpm) ?? 'am';
        _haptics = prefs.getBool(prefKeyHaptics) ?? true;
      });
    } catch (_) {}
  }

  Future<void> _setReminder(bool on) async {
    setState(() => _reminderOn = on);
    try {
      await _prefs?.setBool(prefKeyReminder, on);
      if (on) {
        await ref.read(notificationServiceProvider).scheduleDaily(_reminderHour, _reminderAmpm);
      } else {
        await ref.read(notificationServiceProvider).cancelReminder();
      }
    } catch (_) {}
  }

  Future<void> _setReminderHour(int hour) async {
    setState(() => _reminderHour = hour);
    try {
      await _prefs?.setInt(prefKeyReminderHour, hour);
      if (_reminderOn) {
        await ref.read(notificationServiceProvider).scheduleDaily(hour, _reminderAmpm);
      }
    } catch (_) {}
  }

  Future<void> _setReminderAmpm(String ampm) async {
    setState(() => _reminderAmpm = ampm);
    try {
      await _prefs?.setString(prefKeyReminderAmpm, ampm);
      if (_reminderOn) {
        await ref.read(notificationServiceProvider).scheduleDaily(_reminderHour, ampm);
      }
    } catch (_) {}
  }

  Future<void> _setHaptics(bool on) async {
    setState(() => _haptics = on);
    ref.read(hapticsServiceProvider).configure(on);
    try {
      await _prefs?.setBool(prefKeyHaptics, on);
    } catch (_) {}
  }

  Future<void> _signOut() async {
    try {
      await ref.read(authRepositoryProvider).signOut();
    } catch (_) {}
    if (mounted) context.go(Routes.home);
  }

  Future<void> _confirmSignOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text(
            'You\'ll need to sign in again to sync your streak.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
    if (confirmed == true) await _signOut();
  }

  Future<void> _editDisplayName(String current) async {
    final controller = TextEditingController(text: current);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Display name'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Your name'),
          textCapitalization: TextCapitalization.words,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    final newName = controller.text.trim();
    if (newName.isEmpty) return;
    final userId = ref.read(currentUserProvider)?.id;
    if (userId == null) return;
    try {
      await ref.read(profileRepositoryProvider)?.updateDisplayName(userId, newName);
      ref.invalidate(settingsDataProvider);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final settingsAsync = ref.watch(settingsDataProvider);
    final c = context.halveColors;

    return SafeScaffold(
      safeBottom: true,
      body: Column(
        children: [
          HalveTopBar(title: 'Settings', onBack: () => context.pop()),
          Expanded(
            child: settingsAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, _) => Center(
                child: Text(
                  'Could not load settings.',
                  style: AppTypography.small.copyWith(color: c.fg3),
                ),
              ),
              data: (data) => _SettingsContent(
                data: data,
                reminderOn: _reminderOn,
                reminderHour: _reminderHour,
                reminderAmpm: _reminderAmpm,
                haptics: _haptics,
                onReminderToggle: () => _setReminder(!_reminderOn),
                onReminderHourDecrease: () =>
                    _setReminderHour((_reminderHour - 2) % 12 + 1),
                onReminderHourIncrease: () =>
                    _setReminderHour(_reminderHour % 12 + 1),
                onReminderAmpmToggle: () =>
                    _setReminderAmpm(_reminderAmpm == 'am' ? 'pm' : 'am'),
                onHapticsToggle: () => _setHaptics(!_haptics),
                onSignOut: _confirmSignOut,
                onEditDisplayName: _editDisplayName,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Scrollable content (pumped directly in tests) ────────────────────────────

class _SettingsContent extends StatelessWidget {
  const _SettingsContent({
    required this.data,
    required this.reminderOn,
    required this.reminderHour,
    required this.reminderAmpm,
    required this.haptics,
    required this.onReminderToggle,
    required this.onReminderHourDecrease,
    required this.onReminderHourIncrease,
    required this.onReminderAmpmToggle,
    required this.onHapticsToggle,
    required this.onSignOut,
    required this.onEditDisplayName,
  });

  final SettingsData data;
  final bool reminderOn;
  final int reminderHour;
  final String reminderAmpm;
  final bool haptics;
  final VoidCallback onReminderToggle;
  final VoidCallback onReminderHourDecrease;
  final VoidCallback onReminderHourIncrease;
  final VoidCallback onReminderAmpmToggle;
  final VoidCallback onHapticsToggle;
  final VoidCallback onSignOut;
  final void Function(String current) onEditDisplayName;

  @override
  Widget build(BuildContext context) {
    final c = context.halveColors;
    final bottomInset = MediaQuery.viewPaddingOf(context).bottom;
    final hPad = context.hPagePad;

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        hPad,
        AppSpacing.s4,
        hPad,
        AppSpacing.s4 + bottomInset,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Appearance ────────────────────────────────────────────────
          const _SettingsSection(
            'Appearance',
            children: [
              _SettingsRow(
                label: 'Theme',
                child: _ThemeSegment(),
              ),
            ],
          ),

          // ── Notifications ─────────────────────────────────────────────
          _SettingsSection(
            'Notifications',
            children: [
              _SettingsRow(
                label: 'Daily reminder',
                sublabel: reminderOn
                    ? '${reminderHour.toString().padLeft(2, '0')}:00 $reminderAmpm'
                    : 'Off',
                trailing:
                    _HvSwitch(on: reminderOn, onToggle: onReminderToggle),
                child: reminderOn
                    ? _TimePickerRow(
                        hour: reminderHour,
                        ampm: reminderAmpm,
                        onDecrease: onReminderHourDecrease,
                        onIncrease: onReminderHourIncrease,
                        onToggleAmpm: onReminderAmpmToggle,
                      )
                    : null,
              ),
            ],
          ),

          // ── Game ──────────────────────────────────────────────────────
          _SettingsSection(
            'Game',
            children: [
              _SettingsRow(
                label: 'Haptics',
                sublabel: haptics ? 'On' : 'Off',
                trailing:
                    _HvSwitch(on: haptics, onToggle: onHapticsToggle),
              ),
            ],
          ),

          // ── Account ───────────────────────────────────────────────────
          _SettingsSection(
            'Account',
            children: data.isSignedIn
                ? [
                    _SettingsRow(
                      leading: _AvatarInitial(data.accountLabel),
                      label: data.displayName ?? data.email ?? 'Account',
                      sublabel: data.email ?? 'Streak synced',
                      trailing: const _ChevronIcon(),
                      onTap: () => onEditDisplayName(
                          data.displayName ?? data.email ?? ''),
                    ),
                    _SettingsRow(
                      label: 'Sign out',
                      destructive: true,
                      trailing: _ChevronIcon(color: c.wrong),
                      onTap: onSignOut,
                    ),
                  ]
                : [
                    _SettingsRow(
                      label: 'Sign in',
                      sublabel:
                          'Keep your streak safe across devices',
                      trailing: const _ChevronIcon(),
                      onTap: () => context.push(Routes.auth),
                    ),
                  ],
          ),

          // ── About ─────────────────────────────────────────────────────
          _SettingsSection(
            'About',
            children: [
              _SettingsRow(
                label: 'Version',
                trailing: data.version != null
                    ? Text(
                        data.version!,
                        style: AppTypography.tabular(
                          AppTypography.small.copyWith(color: c.fg3),
                        ),
                      )
                    : null,
              ),
              _SettingsRow(
                label: 'Privacy policy',
                trailing: const _ChevronIcon(),
                onTap: () => launchUrl(
                  Uri.parse('https://halve.today/privacy'),
                  mode: LaunchMode.externalApplication,
                ),
              ),
              _SettingsRow(
                label: 'Terms of use',
                trailing: const _ChevronIcon(),
                onTap: () => launchUrl(
                  Uri.parse('https://halve.today/terms'),
                  mode: LaunchMode.externalApplication,
                ),
              ),
              _SettingsRow(
                label: 'Help & feedback',
                trailing: const _ChevronIcon(),
                onTap: () => launchUrl(
                  Uri.parse('mailto:support@halve.today'),
                  mode: LaunchMode.externalApplication,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
