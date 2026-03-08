import 'package:get/get.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/network/api_client.dart';

/// Facility service for active facility mobile surfaces.
class FacilityService extends GetxService {
  final ApiClient _api = Get.find<ApiClient>();

  Future<List<FacilityLocation>> getLocations() async {
    final res = await _api.get('/facilities/locations');
    return ((res['locations'] ?? []) as List)
        .map((json) => FacilityLocation.fromJson(json))
        .toList();
  }

  Future<FacilityLocation> addLocation(Map<String, dynamic> data) async {
    final res = await _api.post('/facilities/locations', data: data);
    return FacilityLocation.fromJson(res['location'] ?? res);
  }

  Future<FacilityLocation> updateLocation(
    String locationId,
    Map<String, dynamic> data,
  ) async {
    final res = await _api.put('/facilities/locations/$locationId', data: data);
    return FacilityLocation.fromJson(res['location'] ?? res);
  }

  Future<void> deleteLocation(String locationId) async {
    await _api.delete('/facilities/locations/$locationId');
  }

  Future<Map<String, dynamic>> getDashboardStats() async {
    return _api.get('/facilities/dashboard');
  }
}
