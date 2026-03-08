import 'package:docduty/shared/routes/app_routes.dart';
import 'package:docduty/widgets/custombutton.dart';
import 'package:docduty/widgets/my_text_field.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:flutter/services.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/features/auth/controllers/create_account_controller.dart';

class CreateAccountView extends GetView<CreateAccountController> {
  const CreateAccountView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      body: Obx(
        () => LoadingOverlay(
          isLoading: controller.isLoading,
          message: 'Creating account...',
          child: SafeArea(
            child: SingleChildScrollView(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: Get.width / 30),
                  child: Column(
                    children: [
                      SizedBox(height: Get.height / 20),
                      Image.asset("assets/images/group1.png", height: 60),
                      SizedBox(height: Get.height / 50),
                      Text(
                        "Create Account",
                        style: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 30,
                          color: controller.notifier.text,
                        ),
                      ),
                      SizedBox(height: Get.height / 90),
                      SizedBox(
                        width: Get.width / 1.6,
                        child: Text(
                          "Join DocDuty as a doctor or facility administrator.",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: "Gilroy",
                            color: Colors.grey,
                            fontSize: Get.height / 65,
                          ),
                        ),
                      ),
                      SizedBox(height: Get.height / 40),
                      // ─── Error Message ─────────────────────
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
                      // ─── Role Picker ───────────────────────
                      _buildRolePicker(),
                      SizedBox(height: Get.height / 50),
                      // ─── Form Fields ───────────────────────
                      MyTextField(
                        type: TextInputType.name,
                        hintText: "Full Name",
                        titletext: "Full Name",
                        controller: controller.fullNameController,
                      ),
                      SizedBox(height: Get.height / 50),
                      MyTextField(
                        hintText: "03XX-XXXXXXX",
                        titletext: "Phone Number",
                        type: TextInputType.phone,
                        controller: controller.phoneController,
                      ),
                      SizedBox(height: Get.height / 50),
                      MyTextField(
                        hintText: "email@example.com (optional)",
                        titletext: "Email",
                        type: TextInputType.emailAddress,
                        controller: controller.emailController,
                      ),
                      SizedBox(height: Get.height / 50),
                      Obx(
                        () => MyTextField(
                          titletext: "Password",
                          obscureText: controller.obscurePassword,
                          type: TextInputType.visiblePassword,
                          controller: controller.passwordController,
                          hintText: "*************",
                          suffixIcon: Container(
                            padding: const EdgeInsets.all(12),
                            height: Get.height / 80,
                            child: GestureDetector(
                              onTap: () {
                                controller.obscurePassword =
                                    !controller.obscurePassword;
                              },
                              child: Image.asset(
                                controller.obscurePassword
                                    ? "assets/images/eye-slash.png"
                                    : "assets/images/eye.png",
                              ),
                            ),
                          ),
                        ),
                      ),
                      // ─── Terms ─────────────────────────────
                      Row(
                        children: [
                          Obx(
                            () => Checkbox(
                              value: controller.agreedToTerms,
                              activeColor: const Color(0xFF0165FC),
                              onChanged: (v) {
                                controller.agreedToTerms = v ?? false;
                              },
                            ),
                          ),
                          RichText(
                            text: TextSpan(
                              text: "Agree with ",
                              style: TextStyle(
                                fontSize: Get.height / 60,
                                fontFamily: "Gilroy",
                                color: controller.notifier.text,
                                fontWeight: FontWeight.w400,
                              ),
                              children: const <TextSpan>[
                                TextSpan(
                                  text: "Terms & Conditions",
                                  style: TextStyle(
                                    fontFamily: "Gilroy",
                                    color: Color(0xFF0165FC),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: Get.height / 50),
                      // ─── Register Button ───────────────────
                      SizedBox(
                        width: Get.width,
                        height: Get.height / 17,
                        child: CustomButton(
                          text: "Sign Up",
                          radius: BorderRadius.circular(Get.height / 20),
                          onPressed: () => controller.register(),
                          color: const Color(0xFF0165FC),
                          textcolor: const Color(0xFFFFFFFF),
                        ),
                      ),
                      SizedBox(height: Get.height / 20),
                      RichText(
                        text: TextSpan(
                          text: "Already have an account? ",
                          style: TextStyle(
                            fontFamily: "Gilroy",
                            fontSize: Get.height / 63,
                            color: controller.notifier.text,
                            fontWeight: FontWeight.w400,
                          ),
                          children: <TextSpan>[
                            TextSpan(
                              text: 'Sign In',
                              style: const TextStyle(
                                color: Color(0xFF0165FC),
                              ),
                              recognizer: TapGestureRecognizer()
                                ..onTap = () {
                                  Get.toNamed(Routes.SIGN_IN);
                                },
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: Get.height / 30),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRolePicker() {
    return Obx(
      () => Row(
        children: controller.roles.map((role) {
          final isSelected = controller.selectedRole == role['value'];
          return Expanded(
            child: PressableScale(
              onTap: () {
                HapticFeedback.selectionClick();
                controller.selectedRole = role['value'] as String;
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: EdgeInsets.symmetric(horizontal: Get.width / 80),
                padding: EdgeInsets.symmetric(vertical: Get.height / 60),
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFF0165FC).withOpacity(0.1)
                      : controller.notifier.getBgColor,
                  border: Border.all(
                    color: isSelected
                        ? const Color(0xFF0165FC)
                        : controller.notifier.getfillborder,
                    width: isSelected ? 2 : 1,
                  ),
                  borderRadius: BorderRadius.circular(Get.height / 60),
                ),
                child: Column(
                  children: [
                    Icon(
                      role['icon'] as IconData,
                      color: isSelected ? const Color(0xFF0165FC) : Colors.grey,
                      size: Get.height / 30,
                    ),
                    SizedBox(height: Get.height / 100),
                    Text(
                      role['label'] as String,
                      style: TextStyle(
                        fontFamily: "Gilroy",
                        fontSize: Get.height / 60,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.w400,
                        color: isSelected
                            ? const Color(0xFF0165FC)
                            : controller.notifier.text,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
