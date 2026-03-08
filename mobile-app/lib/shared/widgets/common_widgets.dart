import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';

/// Loading overlay widget — shows spinner during API calls.
class LoadingOverlay extends StatelessWidget {
  final bool isLoading;
  final Widget child;
  final String? message;

  const LoadingOverlay({
    super.key,
    required this.isLoading,
    required this.child,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    final notifier = Provider.of<ColorNotifier>(context, listen: true);
    return Stack(
      children: [
        child,
        if (isLoading)
          Container(
            color: Colors.black38,
            child: Center(
              child: Container(
                padding: EdgeInsets.all(Get.width / 15),
                decoration: BoxDecoration(
                  color: notifier.cardBg,
                  borderRadius: BorderRadius.circular(Get.height / 60),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: notifier.primaryBlue),
                    if (message != null) ...[
                      SizedBox(height: Get.height / 50),
                      Text(
                        message!,
                        style: TextStyle(
                          fontFamily: "Gilroy",
                          fontSize: Get.height / 55,
                          color: notifier.text,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Empty state widget — shown when lists have no data.
class EmptyStateWidget extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final String? actionText;
  final VoidCallback? onAction;

  const EmptyStateWidget({
    super.key,
    required this.title,
    required this.subtitle,
    this.icon = Icons.inbox_outlined,
    this.actionText,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final notifier = Provider.of<ColorNotifier>(context, listen: true);
    return Center(
      child: Padding(
        padding: EdgeInsets.all(Get.width / 10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: Get.height / 10, color: Colors.grey.shade400),
            SizedBox(height: Get.height / 40),
            Text(
              title,
              style: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 42,
                fontWeight: FontWeight.w600,
                color: notifier.text,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: Get.height / 80),
            Text(
              subtitle,
              style: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 55,
                color: notifier.subtitleText,
              ),
              textAlign: TextAlign.center,
            ),
            if (actionText != null && onAction != null) ...[
              SizedBox(height: Get.height / 30),
              ElevatedButton(
                onPressed: onAction,
                style: ElevatedButton.styleFrom(
                  backgroundColor: notifier.primaryBlue,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(Get.height / 50),
                  ),
                  shadowColor: Colors.transparent,
                  padding: EdgeInsets.symmetric(
                    horizontal: Get.width / 10,
                    vertical: Get.height / 60,
                  ),
                ),
                child: Text(
                  actionText!,
                  style: TextStyle(
                    fontFamily: "Gilroy",
                    color: Colors.white,
                    fontSize: Get.height / 50,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Status badge chip — for urgency, booking status, etc.
class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final bool small;

  const StatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? Get.width / 50 : Get.width / 35,
        vertical: small ? Get.height / 200 : Get.height / 150,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(Get.height / 80),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: "Gilroy",
          fontSize: small ? Get.height / 70 : Get.height / 60,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

/// Reusable info row — label: value pair.
class InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const InfoRow({
    super.key,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    final notifier = Provider.of<ColorNotifier>(context, listen: true);
    return Padding(
      padding: EdgeInsets.symmetric(vertical: Get.height / 120),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: Get.width / 3,
            child: Text(
              label,
              style: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 55,
                color: notifier.subtitleText,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 55,
                fontWeight: FontWeight.w500,
                color: valueColor ?? notifier.text,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// PKR amount display with formatting.
class PkrAmount extends StatelessWidget {
  final double amount;
  final double? fontSize;
  final FontWeight? fontWeight;
  final Color? color;
  final bool showSign;

  const PkrAmount({
    super.key,
    required this.amount,
    this.fontSize,
    this.fontWeight,
    this.color,
    this.showSign = false,
  });

  @override
  Widget build(BuildContext context) {
    final notifier = Provider.of<ColorNotifier>(context, listen: true);
    final sign = showSign ? (amount >= 0 ? '+' : '') : '';
    final formatted = '${sign}PKR ${amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        )}';
    return Text(
      formatted,
      style: TextStyle(
        fontFamily: "Gilroy",
        fontSize: fontSize ?? Get.height / 50,
        fontWeight: fontWeight ?? FontWeight.w600,
        color: color ?? notifier.text,
      ),
    );
  }
}

/// Section header — used in lists and detail screens.
class SectionHeader extends StatelessWidget {
  final String title;
  final String? actionText;
  final VoidCallback? onAction;

  const SectionHeader({
    super.key,
    required this.title,
    this.actionText,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final notifier = Provider.of<ColorNotifier>(context, listen: true);
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: Get.width / 25,
        vertical: Get.height / 70,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: TextStyle(
              fontFamily: "Gilroy",
              fontSize: Get.height / 45,
              fontWeight: FontWeight.w600,
              color: notifier.text,
            ),
          ),
          if (actionText != null)
            GestureDetector(
              onTap: onAction,
              child: Text(
                actionText!,
                style: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 55,
                  color: notifier.primaryBlue,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Error retry widget — shown when API calls fail.
class ErrorRetryWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const ErrorRetryWidget({
    super.key,
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final notifier = Provider.of<ColorNotifier>(context, listen: true);
    return Center(
      child: Padding(
        padding: EdgeInsets.all(Get.width / 10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline,
                size: Get.height / 12, color: notifier.errorColor),
            SizedBox(height: Get.height / 40),
            Text(
              message,
              style: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 50,
                color: notifier.text,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: Get.height / 30),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, color: Colors.white),
              label: Text(
                'Retry',
                style: TextStyle(
                  fontFamily: "Gilroy",
                  color: Colors.white,
                  fontSize: Get.height / 50,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: notifier.primaryBlue,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(Get.height / 50),
                ),
                shadowColor: Colors.transparent,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
