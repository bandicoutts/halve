import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:halve/main.dart';
import 'package:halve/widgets/widgets.dart';

void main() {
  Future<void> pumpApp(WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: HalveApp()));
    await tester.pumpAndSettle();
  }

  testWidgets('bottom tabs switch branches', (tester) async {
    await pumpApp(tester);

    // Starts on Home.
    expect(find.text("Today's puzzle"), findsOneWidget);
    expect(find.byType(HalveBottomNav), findsOneWidget);

    // Switch to Archive.
    await tester.tap(find.text('Archive'));
    await tester.pumpAndSettle();
    expect(find.text('Past puzzles'), findsOneWidget);

    // Switch to Stats.
    await tester.tap(find.text('Stats'));
    await tester.pumpAndSettle();
    expect(find.text('Your stats'), findsOneWidget);

    // The tab bar stays mounted across branch switches.
    expect(find.byType(HalveBottomNav), findsOneWidget);
  });

  testWidgets('Play route hides the tab bar', (tester) async {
    await pumpApp(tester);

    await tester.tap(find.text('Play today'));
    await tester.pumpAndSettle();

    expect(find.text('Play board'), findsOneWidget);
    // Play is a full-screen route outside the shell → no bottom nav.
    expect(find.byType(HalveBottomNav), findsNothing);

    // Back returns to the shell (tab bar reappears).
    await tester.tap(find.bySemanticsLabel('Back'));
    await tester.pumpAndSettle();
    expect(find.byType(HalveBottomNav), findsOneWidget);
  });
}
