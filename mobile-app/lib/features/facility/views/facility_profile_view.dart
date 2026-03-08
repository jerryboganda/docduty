import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/features/facility/controllers/facility_profile_controller.dart';

class FacilityProfileView extends GetView<FacilityProfileController> {
  const FacilityProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        automaticallyImplyLeading: false,
        title: Text('Profile',
            style: TextStyle(
                fontFamily: "Gilroy",
                color: controller.notifier.text,
                fontSize: Get.height / 40,
                fontWeight: FontWeight.w500)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: Get.width / 25),
          child: Column(
            children: [
              Obx(() {
                final user = controller.currentUser.value;
                return Column(
                  children: [
                    Container(
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
                    SizedBox(height: Get.height / 50),
                    Text(
                        user?.facilityAccount?.name ??
                            user?.fullName ??
                            'Facility',
                        style: TextStyle(
                            fontFamily: "Gilroy",
                            fontSize: Get.height / 40,
                            color: controller.notifier.text,
                            fontWeight: FontWeight.w500)),
                    if (user?.email != null) ...[
                      SizedBox(height: Get.height / 120),
                      Text(user!.email!,
                          style: TextStyle(
                              fontFamily: "Gilroy",
                              fontSize: Get.height / 55,
                              color: Colors.grey)),
                    ],
                  ],
                );
              }),
              SizedBox(height: Get.height / 40),
              ListView.separated(
                itemCount: controller.menuTitles.length,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemBuilder: (context, index) {
                  if (index == 5) {
                    return SizedBox(
                      height: Get.height / 20,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Image.asset(
                                  controller.notifier.isDark
                                      ? "assets/images/sun.png"
                                      : "assets/images/moon.png",
                                  height: Get.height / 45,
                                  color: const Color(0xFF0165FC)),
                              SizedBox(width: Get.width / 30),
                              Text(
                                  controller.notifier.isDark
                                      ? "Light Mode"
                                      : "Dark Mode",
                                  style: TextStyle(
                                      color: controller.notifier.text,
                                      fontFamily: "Gilroy",
                                      fontSize: Get.height / 50)),
                            ],
                          ),
                          CupertinoSwitch(
                            value: controller.notifier.isDark,
                            activeColor: const Color(0xFF0165FC),
                            onChanged: (value) =>
                                controller.notifier.setIsDark = value,
                          ),
                        ],
                      ),
                    );
                  }
                  return GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      controller.onMenuTap(index, context);
                    },
                    child: Container(
                      decoration: const BoxDecoration(),
                      height: Get.height / 20,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Image.asset(controller.menuIcons[index],
                                  height: Get.height / 45,
                                  color: index == 7
                                      ? Colors.red
                                      : const Color(0xFF0165FC)),
                              SizedBox(width: Get.width / 30),
                              Text(controller.menuTitles[index],
                                  style: TextStyle(
                                      color: index == 7
                                          ? Colors.red
                                          : controller.notifier.text,
                                      fontFamily: "Gilroy",
                                      fontSize: Get.height / 50)),
                            ],
                          ),
                          Icon(Icons.arrow_forward_ios,
                              color: const Color(0xFF0165FC),
                              size: Get.height / 45),
                        ],
                      ),
                    ),
                  );
                },
                separatorBuilder: (_, __) =>
                    Divider(color: controller.notifier.getfillborder),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
