import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/features/doctor/views/shift_feed_view.dart';
import 'package:docduty/features/doctor/views/doctor_bookings_view.dart';
import 'package:docduty/features/doctor/views/doctor_wallet_view.dart';
import 'package:docduty/features/doctor/views/doctor_profile_view.dart';
import 'package:docduty/features/shared/views/messages_list_view.dart';

class DoctorShellController extends GetxController {
  late ColorNotifier notifier;

  final _selectedIndex = 0.obs;
  int get selectedIndex => _selectedIndex.value;
  set selectedIndex(int v) => _selectedIndex.value = v;

  final List<Widget> tabs = const [
    ShiftFeedView(),
    DoctorBookingsView(),
    MessagesListView(),
    DoctorWalletView(),
    DoctorProfileView(),
  ];
}
