import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/features/doctor/controllers/doctor_profile_controller.dart';

class DoctorProfileView extends GetView<DoctorProfileController> {
  const DoctorProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        titleSpacing: 0,
        automaticallyImplyLeading: false,
        title: Text(
          'Profile',
          style: TextStyle(
            fontFamily: "Gilroy",
            color: controller.notifier.text,
            fontSize: Get.height / 40,
            fontWeight: FontWeight.w500,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: Get.width / 25),
          child: Column(
            children: [
              // Avatar
              Obx(() {
                final user = controller.currentUser.value;
                return Column(
                  children: [
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
                        child: user?.avatarUrl != null &&
                                user!.avatarUrl!.isNotEmpty
                            ? ClipOval(
                                child: Image.network(
                                  user.avatarUrl!,
                                  fit: BoxFit.cover,
                                  height: Get.height / 10,
                                  width: Get.height / 10,
                                ),
                              )
                            : Image.asset(
                                "assets/images/user.png",
                                color: Colors.grey,
                                height: Get.height / 10,
                              ),
                      ),
                    ),
                    SizedBox(height: Get.height / 50),
                    Text(
                      user?.fullName ?? 'Doctor',
                      style: TextStyle(
                        fontFamily: "Gilroy",
                        fontSize: Get.height / 40,
                        color: controller.notifier.text,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (user?.doctorProfile?.specialtyName != null) ...[
                      SizedBox(height: Get.height / 120),
                      Text(
                        user!.doctorProfile!.specialtyName!,
                        style: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 55,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                    SizedBox(height: Get.height / 100),
                    // Verification badge
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: Get.width / 25,
                        vertical: Get.height / 200,
                      ),
                      decoration: BoxDecoration(
                        color: user?.verificationStatus == 'verified'
                            ? const Color(0xFF4CAF50).withOpacity(0.1)
                            : Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(Get.height / 60),
                      ),
                      child: Text(
                        user?.verificationStatus == 'verified'
                            ? 'Verified'
                            : 'Pending Verification',
                        style: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 65,
                          fontWeight: FontWeight.w500,
                          color: user?.verificationStatus == 'verified'
                              ? const Color(0xFF4CAF50)
                              : Colors.orange,
                        ),
                      ),
                    ),
                    SizedBox(height: Get.height / 80),
                    // Rating row
                    Obx(() => Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.star,
                                color: Colors.amber, size: Get.height / 50),
                            SizedBox(width: Get.width / 80),
                            Text(
                              '${controller.averageRating.value.toStringAsFixed(1)} (${controller.totalRatings.value} reviews)',
                              style: TextStyle(
                                fontFamily: "Gilroy",
                                fontSize: Get.height / 55,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        )),
                  ],
                );
              }),
              SizedBox(height: Get.height / 40),
              // Menu items
              ListView.separated(
                itemCount: controller.menuTitles.length,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemBuilder: (context, index) {
                  // Dark mode toggle row
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
                                color: const Color(0xFF0165FC),
                              ),
                              SizedBox(width: Get.width / 30),
                              Text(
                                controller.notifier.isDark
                                    ? "Light Mode"
                                    : "Dark Mode",
                                style: TextStyle(
                                  color: controller.notifier.text,
                                  fontFamily: "Gilroy",
                                  fontSize: Get.height / 50,
                                ),
                              ),
                            ],
                          ),
                          CupertinoSwitch(
                            value: controller.notifier.isDark,
                            activeColor: const Color(0xFF0165FC),
                            onChanged: (value) {
                              controller.notifier.setIsDark = value;
                            },
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
                      child: Center(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Image.asset(
                                  controller.menuIcons[index],
                                  height: Get.height / 45,
                                  color: index == 7
                                      ? Colors.red
                                      : const Color(0xFF0165FC),
                                ),
                                SizedBox(width: Get.width / 30),
                                Text(
                                  controller.menuTitles[index],
                                  style: TextStyle(
                                    color: index == 7
                                        ? Colors.red
                                        : controller.notifier.text,
                                    fontFamily: "Gilroy",
                                    fontSize: Get.height / 50,
                                  ),
                                ),
                              ],
                            ),
                            Icon(
                              Icons.arrow_forward_ios,
                              color: const Color(0xFF0165FC),
                              size: Get.height / 45,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
                separatorBuilder: (_, __) {
                  return Divider(color: controller.notifier.getfillborder);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
