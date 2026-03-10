import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/auth_service.dart';
import 'package:docduty/core/services/reference_service.dart';
import 'package:docduty/core/services/upload_service.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/shared/routes/app_routes.dart';

class CompleteProfileController extends GetxController {
  late ColorNotifier notifier;
  final AuthService _auth = Get.find<AuthService>();
  final ReferenceService _ref = Get.find<ReferenceService>();
  final UploadService _upload = Get.find<UploadService>();

  // Common
  final fullNameController = TextEditingController();
  final _selectedImage = Rx<XFile?>(null);
  final _selectedImageBytes = Rx<Uint8List?>(null);
  XFile? get selectedImage => _selectedImage.value;
  Uint8List? get selectedImageBytes => _selectedImageBytes.value;
  final picker = ImagePicker();

  // Doctor-specific
  final _selectedSpecialty = Rx<String?>(null);
  String? get selectedSpecialty => _selectedSpecialty.value;
  set selectedSpecialty(String? v) => _selectedSpecialty.value = v;

  final _selectedClinicalRole = Rx<String?>(null);
  String? get selectedClinicalRole => _selectedClinicalRole.value;
  set selectedClinicalRole(String? v) => _selectedClinicalRole.value = v;

  final _selectedSkills = <String>[].obs;
  List<String> get selectedSkills => _selectedSkills;

  final yearsExpController = TextEditingController();
  final pmdcController = TextEditingController();
  final bioController = TextEditingController();

  // Facility-specific
  final facilityNameController = TextEditingController();
  final registrationController = TextEditingController();
  final _selectedProvince = Rx<String?>(null);
  String? get selectedProvince => _selectedProvince.value;
  set selectedProvince(String? v) {
    _selectedProvince.value = v;
    if (v != null) _loadCities(v);
  }

  final _selectedCity = Rx<String?>(null);
  String? get selectedCity => _selectedCity.value;
  set selectedCity(String? v) => _selectedCity.value = v;

  // State
  final _isLoading = false.obs;
  bool get isLoading => _isLoading.value;

  final _errorMessage = ''.obs;
  String get errorMessage => _errorMessage.value;

  String get userRole => _auth.userRole;

  List<Province> get provinces => _ref.provinces;
  List<City> get cities => _ref.cities;
  List<Specialty> get specialties => _ref.specialties;
  List<ClinicalRole> get clinicalRoles => _ref.clinicalRoles;
  List<Skill> get skills => _ref.skills;

  @override
  void onInit() {
    super.onInit();
    fullNameController.text = _auth.currentUser.value?.fullName ?? '';
    _ref.loadAll();
  }

  Future<void> _loadCities(String provinceId) async {
    await _ref.getCitiesByProvince(provinceId);
  }

  Future<void> pickImage(ImageSource source) async {
    try {
      final picked = await picker.pickImage(source: source);
      if (picked != null) {
        _selectedImage.value = picked;
        _selectedImageBytes.value = await picked.readAsBytes();
      }
    } catch (_) {
      _errorMessage.value =
          'Unable to access that image in the browser. Please try another file.';
    }
  }

  void showImagePicker(BuildContext context) {
    if (kIsWeb) {
      Get.bottomSheet(
        Container(
          width: Get.width,
          padding: EdgeInsets.all(Get.width / 18),
          decoration: BoxDecoration(
            color: notifier.getcontainer,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(Get.height / 35),
              topRight: Radius.circular(Get.height / 35),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Upload a profile photo',
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 45,
                  color: notifier.text,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: Get.height / 90),
              Text(
                'Browser mode currently supports file upload from your device.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 60,
                  color: Colors.grey,
                ),
              ),
              SizedBox(height: Get.height / 40),
              SizedBox(
                width: Get.width,
                child: ElevatedButton(
                  onPressed: () {
                    pickImage(ImageSource.gallery);
                    Get.back();
                  },
                  child: const Text('Choose Photo'),
                ),
              ),
            ],
          ),
        ),
      );
      return;
    }

    Get.bottomSheet(
      Container(
        height: Get.height / 9,
        width: Get.width,
        decoration: BoxDecoration(
          color: notifier.getcontainer,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(Get.height / 35),
            topRight: Radius.circular(Get.height / 35),
          ),
        ),
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: Get.height / 50),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _imagePickerOption(Icons.photo, "Gallery", () {
                pickImage(ImageSource.gallery);
                Get.back();
              }),
              SizedBox(width: Get.width / 10),
              _imagePickerOption(Icons.camera, "Camera", () {
                pickImage(ImageSource.camera);
                Get.back();
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _imagePickerOption(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: EdgeInsets.all(Get.width / 60),
            decoration: const BoxDecoration(
              color: Color(0xFF0165FC),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white),
          ),
          SizedBox(height: Get.height / 120),
          Text(
            label,
            style: TextStyle(
              fontSize: Get.height / 60,
              fontFamily: "Gilroy",
              color: notifier.text,
              fontWeight: FontWeight.w300,
            ),
          ),
        ],
      ),
    );
  }

  void toggleSkill(String skillId) {
    if (_selectedSkills.contains(skillId)) {
      _selectedSkills.remove(skillId);
    } else {
      _selectedSkills.add(skillId);
    }
  }

  Future<void> completeProfile() async {
    _isLoading.value = true;
    _errorMessage.value = '';

    try {
      // Upload avatar if selected.
      String? avatarUrl;
      if (selectedImage != null) {
        avatarUrl = await _upload.uploadAvatar(selectedImage!);
      }

      final data = <String, dynamic>{
        'fullName': fullNameController.text.trim(),
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
      };

      if (userRole == 'doctor') {
        data['specialtyId'] = selectedSpecialty;
        data['experienceYears'] = int.tryParse(yearsExpController.text) ?? 0;
        data['pmdcLicense'] = pmdcController.text.trim();
        data['bio'] = bioController.text.trim();
        data['skillIds'] = selectedSkills;
      } else if (userRole == 'facility_admin') {
        data['name'] = facilityNameController.text.trim();
        data['registrationNumber'] = registrationController.text.trim();
        data['cityId'] = selectedCity;
      }

      await _auth.updateProfile(data);
      await _auth.fetchCurrentUser();

      Get.offAllNamed(Routes.shellForRole(userRole));
    } catch (e) {
      _errorMessage.value = 'Failed to update profile. Please try again.';
    } finally {
      _isLoading.value = false;
    }
  }

  @override
  void onClose() {
    fullNameController.dispose();
    yearsExpController.dispose();
    pmdcController.dispose();
    bioController.dispose();
    facilityNameController.dispose();
    registrationController.dispose();
    super.onClose();
  }
}
