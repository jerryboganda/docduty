import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/widgets/buttons.dart';
import 'package:docduty/widgets/my_text_field.dart';
import 'package:docduty/features/shared/controllers/edit_profile_controller.dart';

class EditProfileView extends GetView<EditProfileController> {
  const EditProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        title: Text('Edit Profile',
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
          children: [
            // Avatar placeholder
            Hero(
              tag: 'profile-avatar',
              child: Container(
                padding: EdgeInsets.all(Get.height / 30),
                height: Get.height / 6.5,
                decoration: BoxDecoration(
                  color: controller.notifier.isDark
                      ? const Color(0xff161616)
                      : Colors.black12,
                  shape: BoxShape.circle,
                ),
                child: Image.asset("assets/images/user.png",
                    color: Colors.grey, height: Get.height / 10),
              ),
            ),
            SizedBox(height: Get.height / 30),
            MyTextField(
                titletext: "Full Name",
                type: TextInputType.name,
                hintText: "Enter your name",
                controller: controller.nameController),
            SizedBox(height: Get.height / 50),
            MyTextField(
                titletext: "Phone Number",
                type: TextInputType.phone,
                hintText: "03XXXXXXXXX",
                controller: controller.phoneController),
            SizedBox(height: Get.height / 50),
            MyTextField(
                titletext: "Email",
                type: TextInputType.emailAddress,
                hintText: "example@email.com",
                controller: controller.emailController),
            SizedBox(height: Get.height / 20),
            Obx(() => SizedBox(
                  width: Get.width,
                  height: Get.height / 17,
                  child: AnimatedSubmitButton(
                    text: "Save Changes",
                    isLoading: controller.isLoading.value,
                    onPressed: controller.saveProfile,
                    color: const Color(0xFF0165FC),
                  ),
                )),
          ],
        ),
      ),
    );
  }
}
