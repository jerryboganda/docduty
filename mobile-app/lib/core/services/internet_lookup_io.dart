import 'dart:io';

Future<bool> hasInternetAccessImpl() async {
  try {
    final result = await InternetAddress.lookup('example.com');
    return result.isNotEmpty && result.first.rawAddress.isNotEmpty;
  } on SocketException {
    return false;
  }
}
