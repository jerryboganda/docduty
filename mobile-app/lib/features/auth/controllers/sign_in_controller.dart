import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/core/services/auth_service.dart';
import 'package:docduty/core/errors/app_exception.dart';
import 'package:docduty/shared/routes/app_routes.dart';

class SignInController extends GetxController {
  late ColorNotifier notifier;
  final AuthService _auth = Get.find<AuthService>();

  final phoneController = TextEditingController();
  final passwordController = TextEditingController();

  final _obscurePassword = true.obs;
  bool get obscurePassword => _obscurePassword.value;
  set obscurePassword(bool v) => _obscurePassword.value = v;

  final _isLoading = false.obs;
  bool get isLoading => _isLoading.value;

  final _errorMessage = ''.obs;
  String get errorMessage => _errorMessage.value;

  Future<void> login() async {
    final phone = phoneController.text.trim();
    final password = passwordController.text;

    if (phone.isEmpty || password.isEmpty) {
      _errorMessage.value = 'Please enter phone number and password';
      return;
    }

    _isLoading.value = true;
    _errorMessage.value = '';

    try {
      final role = await _auth.login(phone, password);
      Get.offAllNamed(Routes.shellForRole(role));
    } on ValidationException catch (e) {
      _errorMessage.value = e.message;
    } on AuthException catch (e) {
      _errorMessage.value = e.message;
    } on NetworkException {
      _errorMessage.value = 'No internet connection. Please try again.';
    } catch (e) {
      _errorMessage.value = 'Login failed. Please try again.';
    } finally {
      _isLoading.value = false;
    }
  }

  @override
  void onClose() {
    phoneController.dispose();
    passwordController.dispose();
    super.onClose();
  }
}
