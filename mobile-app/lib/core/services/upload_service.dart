import 'dart:io';
import 'package:get/get.dart';
import 'package:docduty/core/network/api_client.dart';

/// Upload service — avatar and file uploads.
class UploadService extends GetxService {
  final ApiClient _api = Get.find<ApiClient>();

  /// Upload avatar image — returns the URL.
  Future<String> uploadAvatar(String filePath) async {
    final res = await _api.upload('/uploads/avatar',
        file: File(filePath), fieldName: 'avatar');
    return res['url'] ?? res['avatarUrl'] ?? '';
  }

  /// Upload generic file.
  Future<String> uploadFile(String filePath,
      {String fieldName = 'file'}) async {
    final res = await _api.upload('/uploads/file',
        file: File(filePath), fieldName: fieldName);
    return res['url'] ?? '';
  }
}
