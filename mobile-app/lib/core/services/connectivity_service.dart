import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

/// Lightweight reachability check without relying on platform plugins.
class ConnectivityService extends GetxService {
  Timer? _pollTimer;

  final isOnline = true.obs;

  @override
  void onInit() {
    super.onInit();
    _refreshConnectivity();
    _pollTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => _refreshConnectivity(),
    );
  }

  Future<void> _refreshConnectivity() async {
    final online = await _hasInternetAccess();
    if (online == isOnline.value) {
      return;
    }

    isOnline.value = online;
    if (online) {
      _dismissOfflineBanner();
    } else {
      _showOfflineBanner();
    }
  }

  Future<bool> _hasInternetAccess() async {
    if (kIsWeb) {
      return true;
    }

    try {
      final result = await InternetAddress.lookup('example.com');
      return result.isNotEmpty && result.first.rawAddress.isNotEmpty;
    } on SocketException {
      return false;
    }
  }

  void _showOfflineBanner() {
    if (Get.isSnackbarOpen) {
      Get.closeAllSnackbars();
    }

    Get.rawSnackbar(
      message: 'No internet connection',
      icon: const Icon(Icons.wifi_off, color: Colors.white),
      backgroundColor: Colors.red.shade700,
      duration: const Duration(days: 1),
      isDismissible: false,
      snackPosition: SnackPosition.TOP,
      margin: const EdgeInsets.all(12),
      borderRadius: 8,
    );
  }

  void _dismissOfflineBanner() {
    if (Get.isSnackbarOpen) {
      Get.closeAllSnackbars();
    }

    Get.rawSnackbar(
      message: 'Back online',
      icon: const Icon(Icons.wifi, color: Colors.white),
      backgroundColor: Colors.green.shade700,
      duration: const Duration(seconds: 2),
      snackPosition: SnackPosition.TOP,
      margin: const EdgeInsets.all(12),
      borderRadius: 8,
    );
  }

  @override
  void onClose() {
    _pollTimer?.cancel();
    super.onClose();
  }
}
