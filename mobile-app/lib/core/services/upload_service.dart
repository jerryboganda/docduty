import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:docduty/core/network/api_client.dart';

/// Upload service — avatar and file uploads.
class UploadService extends GetxService {
  final ApiClient _api = Get.find<ApiClient>();

  /// Upload avatar image — returns the URL.
  Future<String> uploadAvatar(XFile file) async {
    final res = await _api.upload(
      '/uploads/avatar',
      bytes: await file.readAsBytes(),
      filename: file.name,
      fieldName: 'avatar',
    );
    return res['url'] ?? res['avatarUrl'] ?? '';
  }

  /// Upload generic file.
  Future<String> uploadFile(XFile file, {String fieldName = 'file'}) async {
    final res = await _api.upload(
      '/uploads/file',
      bytes: await file.readAsBytes(),
      filename: file.name,
      fieldName: fieldName,
    );
    return res['url'] ?? '';
  }
}
