import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/models/models.dart';
import 'package:docduty/core/services/services.dart';
import 'package:docduty/shared/routes/app_routes.dart';

class DoctorProfileController extends GetxController {
  late ColorNotifier notifier;

  final _authService = Get.find<AuthService>();
  final _ratingService = Get.find<RatingService>();

  Rx<User?> get currentUser => _authService.currentUser;

  final averageRating = 0.0.obs;
  final totalRatings = 0.obs;
  final isLoading = false.obs;

  List<String> get menuIcons => [
        "assets/images/user_outline.png",
        "assets/images/star.png",
        "assets/images/credit-card-outline.png",
        "assets/images/settingsIcon.png",
        "assets/images/exclamationIcon.png",
        "",
        "assets/images/privacy.png",
        "assets/images/logout.png",
      ];

  List<String> get menuTitles => [
        "Edit Profile",
        "Ratings & Reviews",
        "Payout History",
        "Settings",
        "Help Center",
        "",
        "Privacy Policy",
        "Log out",
      ];

  @override
  void onInit() {
    super.onInit();
    _loadRatingSummary();
  }

  Future<void> _loadRatingSummary() async {
    try {
      final user = currentUser.value;
      if (user == null) return;
      final summary = await _ratingService.getRatingSummary(user.id);
      averageRating.value = (summary['averageRating'] ?? 0).toDouble();
      totalRatings.value = summary['totalRatings'] ?? 0;
    } catch (_) {}
  }

  void onMenuTap(int index, BuildContext context) {
    switch (index) {
      case 0:
        Get.toNamed(Routes.DOCTOR_EDIT_PROFILE);
        break;
      case 1:
        Get.toNamed(Routes.DOCTOR_RATINGS);
        break;
      case 2:
        Get.toNamed(Routes.DOCTOR_WALLET_PAYOUT);
        break;
      case 3:
        Get.toNamed(Routes.SETTINGS);
        break;
      case 4:
        Get.toNamed(Routes.HELP_CENTER);
        break;
      case 5:
        // Dark mode toggle handled in view
        break;
      case 6:
        Get.toNamed(Routes.PRIVACY_POLICY);
        break;
      case 7:
        _showLogoutSheet(context);
        break;
    }
  }

  void _showLogoutSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: notifier.getBgColor,
      shape: RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(Get.height / 30)),
      ),
      builder: (_) {
        return Padding(
          padding: EdgeInsets.all(Get.width / 15),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                "Logout",
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 35,
                  fontWeight: FontWeight.w600,
                  color: Colors.red,
                ),
              ),
              SizedBox(height: Get.height / 60),
              Divider(color: notifier.getfillborder),
              SizedBox(height: Get.height / 60),
              Text(
                "Are you sure you want to log out?",
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 50,
                  color: notifier.text,
                ),
              ),
              SizedBox(height: Get.height / 30),
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: Get.height / 17,
                      child: ElevatedButton(
                        onPressed: () => Get.back(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: notifier.isDark
                              ? const Color(0xff161616)
                              : Colors.grey.shade200,
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(Get.height / 20),
                          ),
                          shadowColor: Colors.transparent,
                        ),
                        child: Text(
                          "Cancel",
                          style: TextStyle(
                            fontFamily: "Gilroy",
                            fontSize: Get.height / 50,
                            color: notifier.text,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                  SizedBox(width: Get.width / 25),
                  Expanded(
                    child: SizedBox(
                      height: Get.height / 17,
                      child: ElevatedButton(
                        onPressed: () async {
                          Get.back();
                          await _authService.logout();
                          Get.offAllNamed(Routes.WELCOME);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0165FC),
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(Get.height / 20),
                          ),
                          shadowColor: Colors.transparent,
                        ),
                        child: Text(
                          "Yes, Logout",
                          style: TextStyle(
                            fontFamily: "Gilroy",
                            fontSize: Get.height / 50,
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: Get.height / 50),
            ],
          ),
        );
      },
    );
  }
}
