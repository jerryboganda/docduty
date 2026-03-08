import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/widgets/buttons.dart';
import 'package:docduty/features/shared/controllers/change_password_controller.dart';

class ChangePasswordView extends GetView<ChangePasswordController> {
  const ChangePasswordView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        title: Text('Change Password',
            style: TextStyle(
                fontFamily: "Gilroy",
                color: controller.notifier.text,
                fontSize: Get.height / 40,
                fontWeight: FontWeight.w600)),
        centerTitle: true,
        leading: MyBackButtons(context),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(Get.width / 25),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: Get.height / 40),
            _buildPasswordField(
                "Current Password",
                controller.oldPasswordController,
                controller.obscureOld,
                controller.toggleOld),
            SizedBox(height: Get.height / 50),
            _buildPasswordField(
                "New Password",
                controller.newPasswordController,
                controller.obscureNew,
                controller.toggleNew),
            SizedBox(height: Get.height / 50),
            _buildPasswordField(
                "Confirm Password",
                controller.confirmPasswordController,
                controller.obscureConfirm,
                controller.toggleConfirm),
            SizedBox(height: Get.height / 30),
            Text("Password must be at least 8 characters long",
                style: TextStyle(
                    fontFamily: "Gilroy",
                    color: controller.notifier.subtitleText,
                    fontSize: Get.height / 60)),
            SizedBox(height: Get.height / 15),
            Obx(() => SizedBox(
                  width: Get.width,
                  height: Get.height / 17,
                  child: AnimatedSubmitButton(
                    text: "Update Password",
                    isLoading: controller.isLoading.value,
                    onPressed: controller.changePassword,
                    color: const Color(0xFF0165FC),
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildPasswordField(String label, TextEditingController textController,
      RxBool obscure, VoidCallback toggle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(
                fontFamily: "Gilroy",
                color: controller.notifier.text,
                fontSize: Get.height / 55,
                fontWeight: FontWeight.w500)),
        SizedBox(height: Get.height / 100),
        Obx(() => Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(Get.height / 50),
                border: Border.all(color: controller.notifier.getfillborder),
              ),
              child: TextField(
                controller: textController,
                obscureText: obscure.value,
                style: TextStyle(
                    fontFamily: "Gilroy",
                    color: controller.notifier.text,
                    fontSize: Get.height / 55),
                decoration: InputDecoration(
                  contentPadding: EdgeInsets.symmetric(
                      horizontal: Get.width / 25, vertical: Get.height / 60),
                  border: InputBorder.none,
                  hintText: "••••••••",
                  hintStyle: TextStyle(
                      fontFamily: "Gilroy",
                      color: controller.notifier.subtitleText),
                  suffixIcon: IconButton(
                    icon: Icon(
                        obscure.value
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: controller.notifier.subtitleText,
                        size: Get.height / 40),
                    onPressed: toggle,
                  ),
                ),
              ),
            )),
      ],
    );
  }
}
