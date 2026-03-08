import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/core/config/support_constants.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/widgets/buttons.dart';

class PrivacyPolicyView extends StatelessWidget {
  const PrivacyPolicyView({super.key});

  @override
  Widget build(BuildContext context) {
    final notifier = Provider.of<ColorNotifier>(context, listen: true);

    const sections = <Map<String, String>>[
      {
        'title': 'Information We Collect',
        'body':
            'We collect information you provide when creating an account, including your name, email, phone number, professional credentials, and location data. We also collect usage data such as app interactions, shift history, and booking records to improve our services.',
      },
      {
        'title': 'How We Use Your Information',
        'body':
            'Your information is used to: provide and maintain DocDuty services, match doctors with facility shifts, process payments and payouts, verify professional credentials, send notifications about bookings and shifts, and improve user experience.',
      },
      {
        'title': 'Location Data',
        'body':
            'DocDuty collects GPS location data during shift check-in and check-out to verify attendance at the correct facility. Location data is only collected when you actively check in or out and is not tracked continuously.',
      },
      {
        'title': 'Data Sharing',
        'body':
            'We do not sell your personal data. We share limited information with: facility administrators (for booking purposes), payment processors (for wallet transactions), and as required by law or regulation.',
      },
      {
        'title': 'Data Security',
        'body':
            'We use industry-standard encryption and security measures to protect your data. All communications are encrypted in transit. Sensitive data such as tokens and credentials are stored securely on your device.',
      },
      {
        'title': 'Your Rights',
        'body':
            'You have the right to: access your personal data, correct inaccurate data, request data deletion, opt out of non-essential communications, and export your data. Contact support@docduty.pk or +92 321 4261 950 to exercise these rights.',
      },
      {
        'title': 'Data Retention',
        'body':
            'We retain your data for as long as your account is active. Upon account deletion, personal data is removed within 30 days, while anonymized transaction records may be retained for legal compliance.',
      },
      {
        'title': 'Changes to This Policy',
        'body':
            'We may update this privacy policy from time to time. We will notify you of significant changes through the app or via email. Continued use of DocDuty after changes constitutes acceptance.',
      },
    ];

    return Scaffold(
      backgroundColor: notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: notifier.getBgColor,
        title: Text('Privacy Policy',
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
          Text("Last updated: January 2025",
              style: TextStyle(
                  fontFamily: "Gilroy",
                  color: notifier.subtitleText,
                  fontSize: Get.height / 60)),
          SizedBox(height: Get.height / 50),
          Text(
              "DocDuty respects your privacy and is committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information.",
              style: TextStyle(
                  fontFamily: "Gilroy",
                  color: notifier.text,
                  fontSize: Get.height / 55,
                  height: 1.5)),
          SizedBox(height: Get.height / 40),
          ...sections.map((s) => Padding(
                padding: EdgeInsets.only(bottom: Get.height / 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s['title']!,
                        style: TextStyle(
                            fontFamily: "Gilroy",
                            color: notifier.text,
                            fontSize: Get.height / 50,
                            fontWeight: FontWeight.w600)),
                    SizedBox(height: Get.height / 100),
                    Text(s['body']!,
                        style: TextStyle(
                            fontFamily: "Gilroy",
                            color: notifier.subtitleText,
                            fontSize: Get.height / 58,
                            height: 1.6)),
                  ],
                ),
              )),
          SizedBox(height: Get.height / 30),
          Container(
            padding: EdgeInsets.all(Get.width / 20),
            decoration: BoxDecoration(
              color: notifier.cardBg,
              borderRadius: BorderRadius.circular(Get.height / 60),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Icon(Icons.email_outlined,
                        color: const Color(0xFF0165FC), size: Get.height / 35),
                    SizedBox(width: Get.width / 30),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Questions about privacy?",
                              style: TextStyle(
                                  fontFamily: "Gilroy",
                                  color: notifier.text,
                                  fontSize: Get.height / 55,
                                  fontWeight: FontWeight.w500)),
                          Text(kSupportEmail,
                              style: TextStyle(
                                  fontFamily: "Gilroy",
                                  color: const Color(0xFF0165FC),
                                  fontSize: Get.height / 58)),
                        ],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: Get.height / 80),
                Row(
                  children: [
                    Icon(Icons.phone_outlined,
                        color: const Color(0xFF0165FC), size: Get.height / 35),
                    SizedBox(width: Get.width / 30),
                    Expanded(
                      child: Text(kSupportPhone,
                          style: TextStyle(
                              fontFamily: "Gilroy",
                              color: const Color(0xFF0165FC),
                              fontSize: Get.height / 58)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          SizedBox(height: Get.height / 20),
        ],
      ),
    );
  }
}
