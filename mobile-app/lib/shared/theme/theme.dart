import 'package:flutter/material.dart';

/// Extended theme notifier for DocDuty.
/// Preserves the original ColorNotifier pattern from the UI kit
/// and adds additional design tokens for the platform.
class ColorNotifier with ChangeNotifier {
  bool isDark = false;
  set setIsDark(value) {
    isDark = value;
    notifyListeners();
  }

  get getIsDark => isDark;
  get getBgColor => isDark ? const Color(0xff030303) : const Color(0xffFFFFFF);
  get text => isDark ? const Color(0xffFFFFFF) : const Color(0xff202020);
  get getblucolor => isDark ? const Color(0xffFFFFFF) : const Color(0xFF0165FC);
  get getcontainer => isDark ? Colors.grey.shade900 : const Color(0xFFFFFFFF);
  get getfillborder => isDark ? const Color(0xff414141) : Colors.grey.shade300;
  get getimagBgColor => isDark ? Colors.white12 : Colors.black12;

  // --- Extended DocDuty tokens ---

  /// Primary brand blue
  Color get primaryBlue => const Color(0xFF0165FC);

  /// Card/surface background
  Color get cardBg => isDark ? Colors.grey.shade900 : Colors.white;

  /// Subtle text (gray)
  Color get subtitleText =>
      isDark ? Colors.grey.shade400 : Colors.grey.shade600;

  /// Success green
  Color get successColor => const Color(0xFF22C55E);

  /// Warning orange
  Color get warningColor => const Color(0xFFF59E0B);

  /// Error red
  Color get errorColor => const Color(0xFFEF4444);

  /// Critical urgency red
  Color get criticalColor => const Color(0xFFDC2626);

  /// Urgent urgency amber
  Color get urgentColor => const Color(0xFFF59E0B);

  /// Normal urgency blue
  Color get normalColor => const Color(0xFF0165FC);

  /// Divider color
  Color get dividerColor =>
      isDark ? Colors.grey.shade800 : Colors.grey.shade200;

  /// Light blue background for chips/badges
  Color get lightBlueBg => isDark
      ? const Color(0xFF0165FC).withOpacity(0.2)
      : const Color(0xFFDBEAFE);

  /// Shimmer base color (for loading skeletons)
  Color get shimmerBase => isDark ? Colors.grey.shade800 : Colors.grey.shade300;

  /// Shimmer highlight color
  Color get shimmerHighlight =>
      isDark ? Colors.grey.shade700 : Colors.grey.shade100;

  /// Get urgency color for shift urgency level
  Color urgencyColor(String urgency) {
    switch (urgency) {
      case 'critical':
        return criticalColor;
      case 'urgent':
        return urgentColor;
      case 'normal':
      default:
        return normalColor;
    }
  }

  /// Get status color for booking/shift status
  Color statusColor(String status) {
    switch (status) {
      case 'confirmed':
      case 'open':
        return primaryBlue;
      case 'in_progress':
        return warningColor;
      case 'completed':
      case 'resolved':
        return successColor;
      case 'cancelled':
      case 'expired':
      case 'no_show':
        return errorColor;
      case 'disputed':
        return const Color(0xFF8B5CF6);
      default:
        return subtitleText;
    }
  }

  // ─── Shadow Tokens ──────────────────────────────────────

  /// Subtle card shadow (elevation 1)
  List<BoxShadow> get shadowSm => [
        BoxShadow(
          color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
          blurRadius: 4,
          offset: const Offset(0, 1),
        ),
      ];

  /// Default card shadow (elevation 2)
  List<BoxShadow> get shadowMd => [
        BoxShadow(
          color: Colors.black.withOpacity(isDark ? 0.25 : 0.06),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ];

  /// Elevated shadow (modals, nav bar) (elevation 3)
  List<BoxShadow> get shadowLg => [
        BoxShadow(
          color: Colors.black.withOpacity(isDark ? 0.3 : 0.10),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
      ];

  // ─── Radius Tokens ──────────────────────────────────────

  static const double radiusXs = 4.0;
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 24.0;

  // ─── Type Scale Tokens ──────────────────────────────────

  TextStyle get displayLg => TextStyle(
        fontFamily: "Gilroy",
        fontSize: 28,
        fontWeight: FontWeight.w700,
        color: text,
      );

  TextStyle get displayMd => TextStyle(
        fontFamily: "Gilroy",
        fontSize: 24,
        fontWeight: FontWeight.w700,
        color: text,
      );

  TextStyle get titleLg => TextStyle(
        fontFamily: "Gilroy",
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: text,
      );

  TextStyle get titleMd => TextStyle(
        fontFamily: "Gilroy",
        fontSize: 17,
        fontWeight: FontWeight.w600,
        color: text,
      );

  TextStyle get bodyLg => TextStyle(
        fontFamily: "Gilroy",
        fontSize: 15,
        fontWeight: FontWeight.w500,
        color: text,
      );

  TextStyle get bodySm => TextStyle(
        fontFamily: "Gilroy",
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: subtitleText,
      );

  TextStyle get caption => TextStyle(
        fontFamily: "Gilroy",
        fontSize: 11,
        fontWeight: FontWeight.w400,
        color: subtitleText,
      );

  TextStyle get labelBold => TextStyle(
        fontFamily: "Gilroy",
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: text,
      );
}
