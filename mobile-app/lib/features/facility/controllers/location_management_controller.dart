import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/services/services.dart';

class LocationManagementController extends GetxController {
  late ColorNotifier notifier;

  final _facilityService = Get.find<FacilityService>();

  final locations = <FacilityLocation>[].obs;
  final isLoading = false.obs;

  // Add/Edit form
  final nameController = TextEditingController();
  final addressController = TextEditingController();
  final latController = TextEditingController();
  final lngController = TextEditingController();
  final radiusController = TextEditingController(text: '200');
  final isSubmitting = false.obs;
  final editingId = Rxn<String>();

  @override
  void onInit() {
    super.onInit();
    loadLocations();
  }

  Future<void> loadLocations() async {
    try {
      isLoading(true);
      final result = await _facilityService.getLocations();
      locations.assignAll(result);
    } catch (_) {
    } finally {
      isLoading(false);
    }
  }

  void openAddForm() {
    editingId.value = null;
    nameController.clear();
    addressController.clear();
    latController.clear();
    lngController.clear();
    radiusController.text = '200';
  }

  void openEditForm(FacilityLocation loc) {
    editingId.value = loc.id;
    nameController.text = loc.name ?? '';
    addressController.text = loc.address ?? '';
    latController.text = loc.latitude?.toString() ?? '';
    lngController.text = loc.longitude?.toString() ?? '';
    radiusController.text = loc.geofenceRadiusM?.toString() ?? '200';
  }

  Future<void> submitLocation() async {
    if (nameController.text.trim().isEmpty ||
        addressController.text.trim().isEmpty) {
      Get.snackbar('Error', 'Name and address are required',
          backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    try {
      isSubmitting(true);
      final data = {
        'name': nameController.text.trim(),
        'address': addressController.text.trim(),
        'latitude': double.tryParse(latController.text.trim()),
        'longitude': double.tryParse(lngController.text.trim()),
        'geofenceRadiusM': int.tryParse(radiusController.text.trim()) ?? 200,
      };

      if (editingId.value != null) {
        await _facilityService.updateLocation(editingId.value!, data);
      } else {
        await _facilityService.addLocation(data);
      }

      Get.snackbar('Success',
          editingId.value != null ? 'Location updated' : 'Location added',
          backgroundColor: const Color(0xFF4CAF50), colorText: Colors.white);
      await loadLocations();
      Get.back();
    } catch (e) {
      Get.snackbar('Error', e.toString(),
          backgroundColor: Colors.red, colorText: Colors.white);
    } finally {
      isSubmitting(false);
    }
  }

  Future<void> deleteLocation(String id) async {
    try {
      await _facilityService.deleteLocation(id);
      locations.removeWhere((l) => l.id == id);
      Get.snackbar('Done', 'Location deleted');
    } catch (e) {
      Get.snackbar('Error', e.toString(),
          backgroundColor: Colors.red, colorText: Colors.white);
    }
  }

  @override
  void onClose() {
    nameController.dispose();
    addressController.dispose();
    latController.dispose();
    lngController.dispose();
    radiusController.dispose();
    super.onClose();
  }
}
