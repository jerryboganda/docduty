import 'package:docduty/shared/routes/app_routes.dart';
import 'package:docduty/widgets/custombutton.dart';
import 'package:docduty/widgets/my_text_field.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/features/auth/controllers/sign_in_controller.dart';

class SignInView extends GetView<SignInController> {
  const SignInView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      body: Obx(
        () => LoadingOverlay(
          isLoading: controller.isLoading,
          message: 'Signing in...',
          child: SafeArea(
            child: SingleChildScrollView(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 520),
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: Get.width / 25,
                      vertical: Get.height / 35,
                    ),
                    child: Column(
                      children: [
                        SizedBox(height: Get.height / 15),
                        Image.asset("assets/images/group1.png", height: 60),
                        SizedBox(height: Get.height / 50),
                        Text(
                          "Sign In",
                          style: TextStyle(
                            fontSize: Get.height / 30,
                            fontFamily: "Gilroy",
                            color: controller.notifier.text,
                          ),
                        ),
                        SizedBox(height: Get.height / 70),
                        Text(
                          "Welcome back to DocDuty",
                          style: TextStyle(
                            fontFamily: "Gilroy",
                            color: Colors.grey,
                            fontSize: Get.height / 65,
                          ),
                        ),
                        SizedBox(height: Get.height / 50),
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
                        // ─── Phone Field ───────────────────────
                        MyTextField(
                          hintText: "03XX-XXXXXXX",
                          titletext: "Phone Number",
                          controller: controller.phoneController,
                          type: TextInputType.phone,
                        ),
                        SizedBox(height: Get.height / 40),
                        // ─── Password Field ────────────────────
                        Obx(
                          () => MyTextField(
                            titletext: "Password",
                            controller: controller.passwordController,
                            obscureText: controller.obscurePassword,
                            type: TextInputType.visiblePassword,
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
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Padding(
                              padding: EdgeInsets.symmetric(
                                  vertical: Get.width / 40),
                              child: GestureDetector(
                                onTap: () {
                                  Get.toNamed(Routes.FORGOT_PASSWORD);
                                },
                                child: Text(
                                  "Forgot Password?",
                                  textAlign: TextAlign.end,
                                  style: TextStyle(
                                    fontFamily: "Gilroy",
                                    fontSize: Get.height / 65,
                                    color: const Color(0xFF0165FC),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: Get.height / 40),
                        // ─── Sign In Button ────────────────────
                        SizedBox(
                          width: Get.width,
                          height: Get.height / 17,
                          child: CustomButton(
                            text: "Sign In",
                            radius: BorderRadius.circular(Get.height / 20),
                            onPressed: () => controller.login(),
                            color: const Color(0xFF0165FC),
                            textcolor: const Color(0xFFFFFFFF),
                          ),
                        ),
                        SizedBox(height: Get.height / 20),
                        RichText(
                          text: TextSpan(
                            text: "Don't have an account? ",
                            style: TextStyle(
                              fontFamily: "Gilroy",
                              fontSize: Get.height / 63,
                              color: controller.notifier.text,
                              fontWeight: FontWeight.w400,
                            ),
                            children: <TextSpan>[
                              TextSpan(
                                text: 'Sign Up',
                                style: const TextStyle(
                                  color: Color(0xFF0165FC),
                                ),
                                recognizer: TapGestureRecognizer()
                                  ..onTap = () {
                                    Get.toNamed(Routes.CREATE_ACCOUNT);
                                  },
                              ),
                            ],
                          ),
                        ),
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
}
