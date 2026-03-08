import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/auth_service.dart';
import 'package:docduty/core/errors/app_exception.dart';
import 'package:docduty/shared/routes/app_routes.dart';

class CreateAccountController extends GetxController {
  late ColorNotifier notifier;
  final AuthService _auth = Get.find<AuthService>();

  final fullNameController = TextEditingController();
  final phoneController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  final _obscurePassword = true.obs;
  bool get obscurePassword => _obscurePassword.value;
  set obscurePassword(bool v) => _obscurePassword.value = v;

  final _selectedRole = 'doctor'.obs;
  String get selectedRole => _selectedRole.value;
  set selectedRole(String v) => _selectedRole.value = v;

  final _agreedToTerms = false.obs;
  bool get agreedToTerms => _agreedToTerms.value;
  set agreedToTerms(bool v) => _agreedToTerms.value = v;

  final _isLoading = false.obs;
  bool get isLoading => _isLoading.value;

  final _errorMessage = ''.obs;
  String get errorMessage => _errorMessage.value;

  final roles = [
    {'value': 'doctor', 'label': 'Doctor', 'icon': Icons.local_hospital},
    {
      'value': 'facility_admin',
      'label': 'Facility Admin',
      'icon': Icons.business
    },
  ];

  Future<void> register() async {
    if (!_validate()) return;

    _isLoading.value = true;
    _errorMessage.value = '';

    try {
      await _auth.register(
        fullName: fullNameController.text.trim(),
        phone: phoneController.text.trim(),
        password: passwordController.text,
        role: selectedRole,
        email: emailController.text.trim().isEmpty
            ? null
            : emailController.text.trim(),
      );
      // Navigate to profile completion.
      Get.offAllNamed(Routes.COMPLETE_PROFILE);
    } on ValidationException catch (e) {
      _errorMessage.value = e.message;
    } on AuthException catch (e) {
      _errorMessage.value = e.message;
    } on NetworkException {
      _errorMessage.value = 'No internet connection. Please try again.';
    } catch (e) {
      _errorMessage.value = 'Registration failed. Please try again.';
    } finally {
      _isLoading.value = false;
    }
  }

  bool _validate() {
    if (fullNameController.text.trim().isEmpty) {
      _errorMessage.value = 'Please enter your full name';
      return false;
    }
    if (phoneController.text.trim().isEmpty) {
      _errorMessage.value = 'Please enter your phone number';
      return false;
    }
    if (passwordController.text.length < 8) {
      _errorMessage.value = 'Password must be at least 8 characters';
      return false;
    }
    if (!agreedToTerms) {
      _errorMessage.value = 'You must agree to the terms and conditions';
      return false;
    }
    return true;
  }

  @override
  void onClose() {
    fullNameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    passwordController.dispose();
    super.onClose();
  }
}
