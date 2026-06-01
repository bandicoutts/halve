// Phase 1 smoke test: the app boots and renders the holding screen.
// Replaced/expanded with real widget tests from Phase 2 onward.

import 'package:flutter_test/flutter_test.dart';

import 'package:halve/main.dart';

void main() {
  testWidgets('HalveApp boots and renders the holding screen',
      (WidgetTester tester) async {
    await tester.pumpWidget(const HalveApp());

    expect(find.text('Halve'), findsOneWidget);
  });
}
