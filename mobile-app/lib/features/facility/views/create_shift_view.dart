import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/widgets/buttons.dart';
import 'package:docduty/widgets/my_text_field.dart';
import 'package:docduty/features/facility/controllers/create_shift_controller.dart';
import 'package:intl/intl.dart';

class CreateShiftView extends GetView<CreateShiftController> {
  const CreateShiftView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        title: Text(
          'Post New Shift',
          style: TextStyle(
            fontFamily: "Gilroy",
            color: controller.notifier.text,
            fontSize: Get.height / 40,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        leading: MyBackButtons(context),
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const ShimmerLoading(itemCount: 4);
        }

        return SingleChildScrollView(
          padding: EdgeInsets.all(Get.width / 25),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MyTextField(
                titletext: "Shift Title",
                type: TextInputType.text,
                hintText: "e.g. Night Shift - Emergency Ward",
                controller: controller.titleController,
              ),
              SizedBox(height: Get.height / 50),
              MyTextField(
                titletext: "Description",
                type: TextInputType.multiline,
                hintText: "Describe the shift requirements...",
                controller: controller.descriptionController,
              ),
              SizedBox(height: Get.height / 50),
              // Date picker
              _sectionTitle("Date"),
              GestureDetector(
                onTap: () => controller.pickDate(context),
                child: Obx(() => Container(
                      width: Get.width,
                      padding: EdgeInsets.all(Get.width / 25),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(Get.height / 60),
                        border: Border.all(
                            color: controller.notifier.getfillborder),
                      ),
                      child: Text(
                        controller.selectedDate.value != null
                            ? DateFormat('EEEE, MMM dd, yyyy')
                                .format(controller.selectedDate.value!)
                            : 'Select date',
                        style: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 55,
                          color: controller.selectedDate.value != null
                              ? controller.notifier.text
                              : Colors.grey,
                        ),
                      ),
                    )),
              ),
              SizedBox(height: Get.height / 50),
              // Time pickers
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _sectionTitle("Start Time"),
                        GestureDetector(
                          onTap: () => controller.pickStartTime(context),
                          child: Obx(() => _timeBox(
                                controller.startTime.value?.format(context) ??
                                    'Start',
                              )),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(width: Get.width / 25),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _sectionTitle("End Time"),
                        GestureDetector(
                          onTap: () => controller.pickEndTime(context),
                          child: Obx(() => _timeBox(
                                controller.endTime.value?.format(context) ??
                                    'End',
                              )),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              SizedBox(height: Get.height / 50),
              MyTextField(
                titletext: "Rate per Hour (PKR)",
                type: TextInputType.number,
                hintText: "e.g. 2500",
                controller: controller.rateController,
              ),
              SizedBox(height: Get.height / 50),
              MyTextField(
                titletext: "Slots Needed",
                type: TextInputType.number,
                hintText: "1",
                controller: controller.slotsController,
              ),
              SizedBox(height: Get.height / 50),
              // Urgency
              _sectionTitle("Urgency"),
              Obx(() => Row(
                    children: ['normal', 'urgent', 'critical'].map((u) {
                      final isSelected = controller.selectedUrgency.value == u;
                      return Expanded(
                        child: PressableScale(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            controller.selectedUrgency.value = u;
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            margin: EdgeInsets.only(right: Get.width / 40),
                            padding:
                                EdgeInsets.symmetric(vertical: Get.height / 80),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? const Color(0xFF0165FC)
                                  : controller.notifier.cardBg,
                              borderRadius:
                                  BorderRadius.circular(Get.height / 60),
                              border: Border.all(
                                color: isSelected
                                    ? const Color(0xFF0165FC)
                                    : controller.notifier.getfillborder,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                u[0].toUpperCase() + u.substring(1),
                                style: TextStyle(
                                  fontFamily: "Gilroy",
                                  fontSize: Get.height / 60,
                                  fontWeight: FontWeight.w500,
                                  color: isSelected
                                      ? Colors.white
                                      : controller.notifier.text,
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  )),
              SizedBox(height: Get.height / 50),
              // Specialty dropdown
              if (controller.specialties.isNotEmpty) ...[
                _sectionTitle("Required Specialty"),
                Obx(() => _dropdown(
                      value: controller.selectedSpecialty.value,
                      items: controller.specialties
                          .map((s) => DropdownMenuItem(
                                value: s.name,
                                child: Text(s.name,
                                    style:
                                        const TextStyle(fontFamily: "Gilroy")),
                              ))
                          .toList(),
                      onChanged: (v) => controller.selectedSpecialty.value = v,
                      hint: 'Any specialty',
                    )),
                SizedBox(height: Get.height / 50),
              ],
              // Location dropdown
              if (controller.locations.isNotEmpty) ...[
                _sectionTitle("Location"),
                Obx(() => _dropdown(
                      value: controller.selectedLocationId.value?.toString(),
                      items: controller.locations
                          .map((l) => DropdownMenuItem(
                                value: l.id.toString(),
                                child: Text(l.name ?? 'Location ${l.id}',
                                    style:
                                        const TextStyle(fontFamily: "Gilroy")),
                              ))
                          .toList(),
                      onChanged: (v) => controller.selectedLocationId.value = v,
                      hint: 'Select location',
                    )),
                SizedBox(height: Get.height / 50),
              ],
              SizedBox(height: Get.height / 30),
              SizedBox(
                width: Get.width,
                height: Get.height / 17,
                child: Obx(() => AnimatedSubmitButton(
                      text: "Post Shift",
                      isLoading: controller.isSubmitting.value,
                      onPressed: controller.submitShift,
                      color: const Color(0xFF0165FC),
                    )),
              ),
              SizedBox(height: Get.height / 20),
            ],
          ),
        );
      }),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: EdgeInsets.only(bottom: Get.height / 100),
      child: Text(
        title,
        style: TextStyle(
          fontFamily: "Gilroy",
          fontSize: Get.height / 55,
          fontWeight: FontWeight.w500,
          color: controller.notifier.text,
        ),
      ),
    );
  }

  Widget _timeBox(String text) {
    return Container(
      width: Get.width,
      padding: EdgeInsets.all(Get.width / 25),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(Get.height / 60),
        border: Border.all(color: controller.notifier.getfillborder),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontFamily: "Gilroy",
          fontSize: Get.height / 55,
          color: text.contains(':') ? controller.notifier.text : Colors.grey,
        ),
      ),
    );
  }

  Widget _dropdown({
    String? value,
    required List<DropdownMenuItem<String>> items,
    required Function(String?) onChanged,
    required String hint,
  }) {
    return Container(
      width: Get.width,
      padding: EdgeInsets.symmetric(horizontal: Get.width / 25),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(Get.height / 60),
        border: Border.all(color: controller.notifier.getfillborder),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          items: items,
          onChanged: onChanged,
          hint: Text(hint,
              style: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 55,
                color: Colors.grey,
              )),
          isExpanded: true,
          dropdownColor: controller.notifier.getBgColor,
          style: TextStyle(
            fontFamily: "Gilroy",
            fontSize: Get.height / 55,
            color: controller.notifier.text,
          ),
        ),
      ),
    );
  }
}
