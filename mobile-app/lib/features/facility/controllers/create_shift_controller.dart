import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/services.dart';
import 'package:docduty/core/models/models.dart';

class CreateShiftController extends GetxController {
  late ColorNotifier notifier;

  final _shiftService = Get.find<ShiftService>();
  final _referenceService = Get.find<ReferenceService>();

  final titleController = TextEditingController();
  final descriptionController = TextEditingController();
  final rateController = TextEditingController();
  final slotsController = TextEditingController(text: '1');

  final selectedDate = Rxn<DateTime>();
  final startTime = Rxn<TimeOfDay>();
  final endTime = Rxn<TimeOfDay>();
  final selectedUrgency = 'normal'.obs;
  final selectedSpecialty = Rxn<String>();
  final selectedClinicalRole = Rxn<String>();
  final selectedSkills = <String>[].obs;
  final selectedLocationId = Rxn<String>();

  final specialties = <Specialty>[].obs;
  final clinicalRoles = <ClinicalRole>[].obs;
  final skills = <Skill>[].obs;
  final locations = <FacilityLocation>[].obs;

  final isLoading = false.obs;
  final isSubmitting = false.obs;

  @override
  void onInit() {
    super.onInit();
    _loadReferenceData();
  }

  Future<void> _loadReferenceData() async {
    try {
      isLoading(true);
      await _referenceService.loadSpecialties();
      specialties.assignAll(_referenceService.specialties);
      await _referenceService.loadClinicalRoles();
      clinicalRoles.assignAll(_referenceService.clinicalRoles);
      await _referenceService.loadSkills();
      skills.assignAll(_referenceService.skills);
      final facilityService = Get.find<FacilityService>();
      final locs = await facilityService.getLocations();
      locations.assignAll(locs);
    } catch (_) {
    } finally {
      isLoading(false);
    }
  }

  Future<void> pickDate(BuildContext context) async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (date != null) selectedDate.value = date;
  }

  Future<void> pickStartTime(BuildContext context) async {
    final time = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 8, minute: 0),
    );
    if (time != null) startTime.value = time;
  }

  Future<void> pickEndTime(BuildContext context) async {
    final time = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 17, minute: 0),
    );
    if (time != null) endTime.value = time;
  }

  String _formatTime(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  Future<void> submitShift() async {
    if (titleController.text.trim().isEmpty) {
      Get.snackbar('Error', 'Title is required',
          backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }
    if (selectedDate.value == null ||
        startTime.value == null ||
        endTime.value == null) {
      Get.snackbar('Error', 'Date and times are required',
          backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }
    if (rateController.text.trim().isEmpty) {
      Get.snackbar('Error', 'Rate per hour is required',
          backgroundColor: Colors.red, colorText: Colors.white);
      return;
    }

    try {
      isSubmitting(true);
      final date = selectedDate.value!.toIso8601String().split('T')[0];
      final start = _formatTime(startTime.value!);
      final end = _formatTime(endTime.value!);
      await _shiftService.createShift({
        'title': titleController.text.trim(),
        'description': descriptionController.text.trim(),
        'startTime': '${date}T$start:00',
        'endTime': '${date}T$end:00',
        'totalPricePkr': double.parse(rateController.text.trim()),
        'urgency': selectedUrgency.value,
        if (selectedSpecialty.value != null)
          'specialtyId': selectedSpecialty.value,
        if (selectedClinicalRole.value != null)
          'roleId': selectedClinicalRole.value,
        if (selectedSkills.isNotEmpty) 'skillIds': selectedSkills.toList(),
        if (selectedLocationId.value != null)
          'facilityLocationId': selectedLocationId.value,
      });
      Get.snackbar('Success', 'Shift posted successfully!',
          backgroundColor: const Color(0xFF4CAF50), colorText: Colors.white);
      Get.back();
    } catch (e) {
      Get.snackbar('Error', e.toString(),
          backgroundColor: Colors.red, colorText: Colors.white);
    } finally {
      isSubmitting(false);
    }
  }

  @override
  void onClose() {
    titleController.dispose();
    descriptionController.dispose();
    rateController.dispose();
    slotsController.dispose();
    super.onClose();
  }
}
