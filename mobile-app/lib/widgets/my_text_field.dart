import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';

/// Styled text field with title label, focus glow and premium feel.
class MyTextField extends StatefulWidget {
  final String hintText;
  final String titletext;
  final TextEditingController? controller;
  final TextInputType type;
  final bool obscureText;
  final Widget? suffixIcon;
  final int? maxLines;

  const MyTextField({
    super.key,
    required this.hintText,
    required this.titletext,
    this.controller,
    this.type = TextInputType.text,
    this.obscureText = false,
    this.suffixIcon,
    this.maxLines,
  });

  @override
  State<MyTextField> createState() => _MyTextFieldState();
}

class _MyTextFieldState extends State<MyTextField> {
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      if (mounted) setState(() => _isFocused = _focusNode.hasFocus);
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.titletext,
          style: TextStyle(
            fontFamily: "Gilroy",
            fontSize: Get.height / 60,
            fontWeight: FontWeight.w500,
            color: notifier.text,
          ),
        ),
        SizedBox(height: Get.height / 120),
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(Get.height / 60),
            boxShadow: _isFocused
                ? [
                    BoxShadow(
                      color: const Color(0xFF0165FC).withOpacity(0.15),
                      blurRadius: 12,
                      spreadRadius: 1,
                    ),
                  ]
                : [],
          ),
          child: SizedBox(
            height: widget.maxLines != null ? null : Get.height / 15,
            child: TextField(
              focusNode: _focusNode,
              controller: widget.controller,
              keyboardType: widget.type,
              obscureText: widget.obscureText,
              maxLines: widget.obscureText ? 1 : widget.maxLines,
              style: TextStyle(
                fontFamily: "Gilroy",
                fontSize: Get.height / 55,
                color: notifier.text,
              ),
              decoration: InputDecoration(
                hintText: widget.hintText,
                hintStyle: TextStyle(
                  fontFamily: "Gilroy",
                  fontSize: Get.height / 60,
                  color: Colors.grey,
                ),
                suffixIcon: widget.suffixIcon,
                contentPadding: EdgeInsets.symmetric(
                  horizontal: Get.width / 30,
                  vertical: Get.height / 70,
                ),
                filled: true,
                fillColor: notifier.cardBg,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Get.height / 60),
                  borderSide: BorderSide(color: notifier.getfillborder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Get.height / 60),
                  borderSide: BorderSide(color: notifier.getfillborder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Get.height / 60),
                  borderSide:
                      const BorderSide(color: Color(0xFF0165FC), width: 1.5),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
