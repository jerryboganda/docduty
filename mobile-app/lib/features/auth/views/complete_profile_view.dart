import 'package:docduty/widgets/custombutton.dart';
import 'package:docduty/widgets/my_text_field.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/features/auth/controllers/complete_profile_controller.dart';

class CompleteProfileView extends GetView<CompleteProfileController> {
  const CompleteProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      body: Obx(
        () => LoadingOverlay(
          isLoading: controller.isLoading,
          message: 'Updating profile...',
          child: SafeArea(
            child: SingleChildScrollView(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 560),
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: Get.width / 30),
                    child: Column(
                      children: [
                        SizedBox(height: Get.height / 25),
                        Text(
                          "Complete Your Profile",
                          style: TextStyle(
                            fontFamily: "Gilroy",
                            fontSize: Get.height / 30,
                            color: controller.notifier.text,
                          ),
                        ),
                        SizedBox(height: Get.height / 80),
                        Text(
                          controller.userRole == 'doctor'
                              ? "Add your medical qualifications"
                              : "Set up your facility details",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: "Gilroy",
                            fontSize: Get.height / 65,
                            color: Colors.grey,
                          ),
                        ),
                        SizedBox(height: Get.height / 30),
                        // ─── Avatar ──────────────────────────
                        _buildAvatarPicker(context),
                        SizedBox(height: Get.height / 30),
                        // ─── Error ──────────────────────────
                        Obx(() {
                          if (controller.errorMessage.isEmpty) {
                            return const SizedBox.shrink();
                          }
                          return Container(
                            width: Get.width,
                            margin: EdgeInsets.only(bottom: Get.height / 50),
                            padding: EdgeInsets.all(Get.width / 30),
                            decoration: BoxDecoration(
                              color: Colors.red.shade50,
                              borderRadius:
                                  BorderRadius.circular(Get.height / 80),
                              border: Border.all(color: Colors.red.shade200),
                            ),
                            child: Text(
                              controller.errorMessage,
                              style: TextStyle(
                                fontFamily: "Gilroy",
                                color: Colors.red.shade700,
                                fontSize: Get.height / 60,
                              ),
                            ),
                          );
                        }),
                        // ─── Name ───────────────────────────
                        MyTextField(
                          controller: controller.fullNameController,
                          type: TextInputType.name,
                          hintText: "Full Name",
                          titletext: "Full Name",
                        ),
                        SizedBox(height: Get.height / 50),
                        // ─── Role-specific ──────────────────
                        if (controller.userRole == 'doctor')
                          ..._buildDoctorFields(),
                        if (controller.userRole == 'facility_admin')
                          ..._buildFacilityFields(),
                        SizedBox(height: Get.height / 30),
                        // ─── Submit ─────────────────────────
                        SizedBox(
                          width: Get.width,
                          height: Get.height / 17,
                          child: CustomButton(
                            text: "Complete Profile",
                            radius: BorderRadius.circular(Get.height / 20),
                            onPressed: () => controller.completeProfile(),
                            color: const Color(0xFF0165FC),
                            textcolor: const Color(0xFFFFFFFF),
                          ),
                        ),
                        SizedBox(height: Get.height / 20),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAvatarPicker(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Obx(
          () => controller.selectedImage == null ||
                  controller.selectedImageBytes == null
              ? Container(
                  padding: EdgeInsets.all(Get.height / 30),
                  height: Get.height / 6.5,
                  decoration: BoxDecoration(
                    color: controller.notifier.isDark
                        ? const Color(0xff161616)
                        : Colors.black12,
                    shape: BoxShape.circle,
                  ),
                  child: Image.asset(
                    "assets/images/user.png",
                    color: Colors.grey,
                    height: Get.height / 10,
                  ),
                )
              : Container(
                  height: Get.height / 6.5,
                  width: Get.height / 6.5,
                  decoration: const BoxDecoration(shape: BoxShape.circle),
                  child: ClipOval(
                    child: Image.memory(
                      controller.selectedImageBytes!,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
        ),
        Positioned(
          bottom: Get.height / 70,
          right: Get.width / 80,
          child: GestureDetector(
            onTap: () => controller.showImagePicker(context),
            child: Container(
              height: Get.height / 35,
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: controller.notifier.getBgColor,
                shape: BoxShape.circle,
              ),
              child: Container(
                padding: const EdgeInsets.all(5),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFF0165FC),
                ),
                child: Center(
                  child: Image.asset(
                    "assets/images/edit.png",
                    fit: BoxFit.cover,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  List<Widget> _buildDoctorFields() {
    return [
      // Specialty Dropdown
      Obx(() {
        final items = controller.specialties;
        return _buildDropdown<String>(
          title: "Specialty",
          value: controller.selectedSpecialty,
          items: items
              .map((s) => DropdownMenuItem(value: s.id, child: Text(s.name)))
              .toList(),
          onChanged: (v) => controller.selectedSpecialty = v,
        );
      }),
      SizedBox(height: Get.height / 50),
      // Clinical Role Dropdown
      Obx(() {
        final items = controller.clinicalRoles;
        return _buildDropdown<String>(
          title: "Clinical Role",
          value: controller.selectedClinicalRole,
          items: items
              .map((r) => DropdownMenuItem(value: r.id, child: Text(r.name)))
              .toList(),
          onChanged: (v) => controller.selectedClinicalRole = v,
        );
      }),
      SizedBox(height: Get.height / 50),
      MyTextField(
        controller: controller.yearsExpController,
        type: TextInputType.number,
        hintText: "5",
        titletext: "Years of Experience",
      ),
      SizedBox(height: Get.height / 50),
      MyTextField(
        controller: controller.pmdcController,
        type: TextInputType.text,
        hintText: "PMDC-XXXXX",
        titletext: "PMDC Number",
      ),
      SizedBox(height: Get.height / 50),
      MyTextField(
        controller: controller.bioController,
        type: TextInputType.multiline,
        hintText: "Brief professional bio...",
        titletext: "Bio",
      ),
      SizedBox(height: Get.height / 50),
      // Skills multi-select
      _buildSkillPicker(),
    ];
  }

  List<Widget> _buildFacilityFields() {
    return [
      MyTextField(
        controller: controller.facilityNameController,
        type: TextInputType.text,
        hintText: "Hospital / Clinic Name",
        titletext: "Facility Name",
      ),
      SizedBox(height: Get.height / 50),
      MyTextField(
        controller: controller.registrationController,
        type: TextInputType.text,
        hintText: "Registration Number",
        titletext: "Registration Number",
      ),
      SizedBox(height: Get.height / 50),
      // Province Dropdown
      Obx(() {
        return _buildDropdown<String>(
          title: "Province",
          value: controller.selectedProvince,
          items: controller.provinces
              .map((p) => DropdownMenuItem(value: p.id, child: Text(p.name)))
              .toList(),
          onChanged: (v) => controller.selectedProvince = v,
        );
      }),
      SizedBox(height: Get.height / 50),
      // City Dropdown
      Obx(() {
        return _buildDropdown<String>(
          title: "City",
          value: controller.selectedCity,
          items: controller.cities
              .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
              .toList(),
          onChanged: (v) => controller.selectedCity = v,
        );
      }),
    ];
  }

  Widget _buildDropdown<T>({
    required String title,
    required T? value,
    required List<DropdownMenuItem<T>> items,
    required void Function(T?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontFamily: "Gilroy",
            color: controller.notifier.text,
            fontSize: Get.height / 65,
          ),
        ),
        SizedBox(height: Get.height / 120),
        Container(
          width: Get.width,
          padding: EdgeInsets.symmetric(horizontal: Get.width / 30),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(Get.height / 90),
            border: Border.all(color: controller.notifier.getfillborder),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<T>(
              isExpanded: true,
              value: value,
              hint: Text(
                "Select $title",
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 65,
                  color: Colors.grey,
                ),
              ),
              dropdownColor: controller.notifier.getBgColor,
              style: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 65,
                color: controller.notifier.text,
              ),
              items: items,
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSkillPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Skills",
          style: TextStyle(
            fontFamily: "Gilroy",
            color: controller.notifier.text,
            fontSize: Get.height / 65,
          ),
        ),
        SizedBox(height: Get.height / 120),
        Obx(() {
          return Wrap(
            spacing: Get.width / 50,
            runSpacing: Get.height / 100,
            children: controller.skills.map((skill) {
              final selected = controller.selectedSkills.contains(skill.id);
              return FilterChip(
                label: Text(
                  skill.name,
                  style: TextStyle(
                    fontFamily: "Gilroy",
                    color: selected ? Colors.white : controller.notifier.text,
                    fontSize: Get.height / 65,
                  ),
                ),
                selected: selected,
                selectedColor: const Color(0xFF0165FC),
                backgroundColor: controller.notifier.getBgColor,
                checkmarkColor: Colors.white,
                side: BorderSide(
                  color: selected
                      ? const Color(0xFF0165FC)
                      : controller.notifier.getfillborder,
                ),
                onSelected: (_) => controller.toggleSkill(skill.id),
              );
            }).toList(),
          );
        }),
      ],
    );
  }
}
