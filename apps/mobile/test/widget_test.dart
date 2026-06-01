// Smoke test: the app boots into the tab shell on the Home branch.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:halve/main.dart';

void main() {
  testWidgets('HalveApp boots into Home', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: HalveApp()));
    await tester.pumpAndSettle();

    expect(find.text("Today's puzzle"), findsOneWidget);
    expect(find.text('Halve'), findsOneWidget); // wordmark in the top bar
  });
}
