import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/core/config/support_constants.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/widgets/buttons.dart';

class HelpCenterView extends StatelessWidget {
  const HelpCenterView({super.key});

  @override
  Widget build(BuildContext context) {
    final notifier = Provider.of<ColorNotifier>(context, listen: true);

    final faqs = <Map<String, String>>[
      {
        'q': 'How do I create an account?',
        'a':
            'Download the DocDuty app, tap "Create Account", fill in your details and verify your phone number to get started.'
      },
      {
        'q': 'How do shifts work?',
        'a':
            'Facility administrators post shifts with details like date, time, specialty, and rate. Doctors can browse and apply for available shifts.'
      },
      {
        'q': 'How does check-in/check-out work?',
        'a':
            'When you arrive at a facility for a booked shift, use the app to check in. GPS verification ensures you are at the correct location. Check out when your shift ends.'
      },
      {
        'q': 'How do payments work?',
        'a':
            'After completing a shift, payment is processed through the DocDuty wallet system. You can request a payout to your bank account at any time.'
      },
      {
        'q': 'How do I raise a dispute?',
        'a':
            'Navigate to the booking in question, tap "Raise Dispute" and provide details about the issue. Our team will review and resolve it.'
      },
      {
        'q': 'How do I get verified?',
        'a':
            'After creating your account, submit your professional credentials. Our admin team reviews and verifies your profile within 24-48 hours.'
      },
    ];

    return Scaffold(
      backgroundColor: notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: notifier.getBgColor,
        title: Text('Help Center',
            style: TextStyle(
                fontFamily: "Gilroy",
                color: notifier.text,
                fontSize: Get.height / 40,
                fontWeight: FontWeight.w600)),
        centerTitle: true,
        leading: MyBackButtons(context),
      ),
      body: ListView(
        padding: EdgeInsets.all(Get.width / 25),
        children: [
          // Contact support card
          Container(
            padding: EdgeInsets.all(Get.width / 20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                  colors: [Color(0xFF0165FC), Color(0xFF4D94FF)]),
              borderRadius: BorderRadius.circular(Get.height / 50),
            ),
            child: Column(
              children: [
                Icon(Icons.support_agent,
                    color: Colors.white, size: Get.height / 18),
                SizedBox(height: Get.height / 60),
                Text("Need Help?",
                    style: TextStyle(
                        fontFamily: "Gilroy",
                        color: Colors.white,
                        fontSize: Get.height / 42,
                        fontWeight: FontWeight.w600)),
                SizedBox(height: Get.height / 100),
                Text("Contact our support team for personalized assistance",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontFamily: "Gilroy",
                        color: Colors.white70,
                        fontSize: Get.height / 60)),
                SizedBox(height: Get.height / 50),
                ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.email_outlined,
                      color: Color(0xFF0165FC)),
                  label: Text(kSupportEmail,
                      style: TextStyle(
                          fontFamily: "Gilroy",
                          color: const Color(0xFF0165FC),
                          fontSize: Get.height / 58,
                          fontWeight: FontWeight.w600)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(Get.height / 20)),
                    padding: EdgeInsets.symmetric(
                        horizontal: Get.width / 15, vertical: Get.height / 70),
                  ),
                ),
                SizedBox(height: Get.height / 80),
                ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.phone_outlined,
                      color: Color(0xFF0165FC)),
                  label: Text(kSupportPhone,
                      style: TextStyle(
                          fontFamily: "Gilroy",
                          color: const Color(0xFF0165FC),
                          fontSize: Get.height / 58,
                          fontWeight: FontWeight.w600)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(Get.height / 20)),
                    padding: EdgeInsets.symmetric(
                        horizontal: Get.width / 15, vertical: Get.height / 70),
                  ),
                ),
              ],
            ),
          ),

          SizedBox(height: Get.height / 30),

          Text("Frequently Asked Questions",
              style: TextStyle(
                  fontFamily: "Gilroy",
                  color: notifier.text,
                  fontSize: Get.height / 48,
                  fontWeight: FontWeight.w600)),

          SizedBox(height: Get.height / 60),

          ...faqs.map((faq) => Container(
                margin: EdgeInsets.only(bottom: Get.height / 80),
                decoration: BoxDecoration(
                  color: notifier.cardBg,
                  borderRadius: BorderRadius.circular(Get.height / 60),
                ),
                child: ExpansionTile(
                  tilePadding: EdgeInsets.symmetric(horizontal: Get.width / 25),
                  childrenPadding: EdgeInsets.fromLTRB(
                      Get.width / 25, 0, Get.width / 25, Get.height / 60),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(Get.height / 60)),
                  title: Text(faq['q']!,
                      style: TextStyle(
                          fontFamily: "Gilroy",
                          color: notifier.text,
                          fontSize: Get.height / 55,
                          fontWeight: FontWeight.w500)),
                  iconColor: notifier.subtitleText,
                  collapsedIconColor: notifier.subtitleText,
                  children: [
                    Text(faq['a']!,
                        style: TextStyle(
                            fontFamily: "Gilroy",
                            color: notifier.subtitleText,
                            fontSize: Get.height / 58,
                            height: 1.5)),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}
