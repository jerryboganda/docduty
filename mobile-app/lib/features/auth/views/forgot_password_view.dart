import 'package:docduty/widgets/custombutton.dart';
import 'package:docduty/widgets/my_text_field.dart';
import 'package:docduty/widgets/buttons.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/features/auth/controllers/forgot_password_controller.dart';

class ForgotPasswordView extends GetView<ForgotPasswordController> {
  const ForgotPasswordView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      body: Obx(
        () => LoadingOverlay(
          isLoading: controller.isLoading,
          child: SafeArea(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: Get.width / 30),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    height: Get.height / 15,
                    width: Get.height / 15,
                    child: MyBackButtons(context),
                  ),
                  SizedBox(height: Get.height / 30),
                  Text(
                    "Forgot Password",
                    style: TextStyle(
                      fontSize: Get.height / 30,
                      fontFamily: "Gilroy",
                      color: controller.notifier.text,
                    ),
                  ),
                  SizedBox(height: Get.height / 80),
                  Text(
                    "Enter your phone number to receive a password reset code",
                    style: TextStyle(
                      fontFamily: "Gilroy",
                      color: Colors.grey,
                      fontSize: Get.height / 65,
                    ),
                  ),
                  SizedBox(height: Get.height / 30),
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
                        borderRadius: BorderRadius.circular(Get.height / 80),
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
                  MyTextField(
                    hintText: "03XX-XXXXXXX",
                    titletext: "Phone Number",
                    controller: controller.phoneController,
                    type: TextInputType.phone,
                  ),
                  SizedBox(height: Get.height / 20),
                  SizedBox(
                    width: Get.width,
                    height: Get.height / 17,
                    child: CustomButton(
                      text: "Send Reset Code",
                      radius: BorderRadius.circular(Get.height / 20),
                      onPressed: () => controller.sendResetCode(),
                      color: const Color(0xFF0165FC),
                      textcolor: const Color(0xFFFFFFFF),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
