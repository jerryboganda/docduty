import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:permission_handler/permission_handler.dart';

/// Centralized permission request helpers with user-friendly dialogs.
class PermissionHelper {
  PermissionHelper._();

  /// Request location permission. Returns true if granted.
  static Future<bool> requestLocation() async {
    var status = await Permission.locationWhenInUse.status;
    if (status.isGranted) return true;

    status = await Permission.locationWhenInUse.request();
    if (status.isGranted) return true;

    if (status.isPermanentlyDenied) {
      _showSettingsDialog(
        title: 'Location Permission Required',
        message:
            'DocDuty needs location access to verify your attendance at the facility. Please enable it in Settings.',
      );
      return false;
    }

    Get.snackbar(
      'Permission Denied',
      'Location permission is required for attendance check-in.',
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.red.shade700,
      colorText: Colors.white,
    );
    return false;
  }

  /// Request camera permission. Returns true if granted.
  static Future<bool> requestCamera() async {
    var status = await Permission.camera.status;
    if (status.isGranted) return true;

    status = await Permission.camera.request();
    if (status.isGranted) return true;

    if (status.isPermanentlyDenied) {
      _showSettingsDialog(
        title: 'Camera Permission Required',
        message:
            'DocDuty needs camera access to scan QR codes for shift check-in. Please enable it in Settings.',
      );
      return false;
    }

    Get.snackbar(
      'Permission Denied',
      'Camera permission is required for QR code scanning.',
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.red.shade700,
      colorText: Colors.white,
    );
    return false;
  }

  /// Request photo library permission. Returns true if granted.
  static Future<bool> requestPhotos() async {
    var status = await Permission.photos.status;
    if (status.isGranted || status.isLimited) return true;

    status = await Permission.photos.request();
    if (status.isGranted || status.isLimited) return true;

    if (status.isPermanentlyDenied) {
      _showSettingsDialog(
        title: 'Photo Library Permission Required',
        message:
            'DocDuty needs photo library access to upload your profile picture. Please enable it in Settings.',
      );
      return false;
    }
    return false;
  }

  static void _showSettingsDialog({
    required String title,
    required String message,
  }) {
    Get.dialog(
      AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Get.back();
              openAppSettings();
            },
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }
}
