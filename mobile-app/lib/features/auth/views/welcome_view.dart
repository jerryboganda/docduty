import 'package:docduty/shared/routes/app_routes.dart';
import 'package:docduty/widgets/custombutton.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:lottie/lottie.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/features/auth/controllers/welcome_controller.dart';

class WelcomeView extends GetView<WelcomeController> {
  const WelcomeView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Lottie.asset("assets/images/starting.json"),
              Container(
                width: Get.width,
                height: Get.height / 2.5,
                padding: EdgeInsets.symmetric(horizontal: Get.width / 20),
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(color: controller.notifier.getfillborder),
                  ),
                  color: controller.notifier.isDark
                      ? Colors.white12
                      : const Color(0xFFFFFFFF),
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(Get.height / 25),
                    topRight: Radius.circular(Get.height / 25),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      "DocDuty",
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: Get.height / 30,
                        color: const Color(0xFF0165FC),
                        fontWeight: FontWeight.w600,
                        fontFamily: "Gilroy",
                      ),
                    ),
                    Text(
                      "Healthcare Staff Marketplace",
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: Get.height / 35,
                        color: controller.notifier.text,
                        fontWeight: FontWeight.w600,
                        fontFamily: "Gilroy",
                      ),
                    ),
                    SizedBox(height: Get.height / 50),
                    Text(
                      "Connect doctors with healthcare facilities for locum shifts across Pakistan.",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: "Gilroy",
                        fontSize: Get.height / 55,
                        color: Colors.grey,
                      ),
                    ),
                    SizedBox(height: Get.height / 50),
                    SizedBox(
                      width: Get.width,
                      height: Get.height / 18,
                      child: CustomButton(
                        text: "Let's Get Started",
                        radius: BorderRadius.circular(Get.height / 10),
                        onPressed: () {
                          Get.toNamed(Routes.CREATE_ACCOUNT);
                        },
                        color: const Color(0xFF0165FC),
                        textcolor: const Color(0xFFFFFFFF),
                      ),
                    ),
                    SizedBox(height: Get.height / 30),
                    RichText(
                      text: TextSpan(
                        text: 'Already have an account? ',
                        style: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 50,
                          color: controller.notifier.text,
                          fontWeight: FontWeight.w400,
                        ),
                        children: <TextSpan>[
                          TextSpan(
                            text: 'Sign In',
                            style: TextStyle(
                              fontSize: Get.height / 50,
                              color: const Color(0xFF0165FC),
                              decorationThickness: 2,
                            ),
                            recognizer: TapGestureRecognizer()
                              ..onTap = () {
                                Get.toNamed(Routes.SIGN_IN);
                              },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
