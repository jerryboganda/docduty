import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';

/// Back button widget matching the DocDuty UI kit design pattern.
Widget MyBackButtons(BuildContext context) {
  final notifier = Provider.of<ColorNotifier>(context, listen: false);
  return IconButton(
    icon:
        Icon(Icons.arrow_back_ios, color: notifier.text, size: Get.height / 40),
    onPressed: () => Get.back(),
  );
}

/// Search button for AppBar actions.
Widget searchButton(BuildContext context) {
  final notifier = Provider.of<ColorNotifier>(context, listen: false);
  return IconButton(
    icon: Icon(Icons.search, color: notifier.text, size: Get.height / 35),
    onPressed: () {},
  );
}
