import 'internet_lookup_stub.dart'
    if (dart.library.io) 'internet_lookup_io.dart'
    if (dart.library.html) 'internet_lookup_web.dart';

Future<bool> hasInternetAccess() => hasInternetAccessImpl();
