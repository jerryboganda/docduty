import 'package:get/get.dart';
import 'package:docduty/core/network/api_client.dart';
import 'package:docduty/core/models/models.dart';

/// Reference data service — provinces, cities, specialties, clinical roles, skills, policy.
class ReferenceService extends GetxService {
  final ApiClient _api = Get.find<ApiClient>();

  final RxList<Province> provinces = <Province>[].obs;
  final RxList<City> cities = <City>[].obs;
  final RxList<Specialty> specialties = <Specialty>[].obs;
  final RxList<ClinicalRole> clinicalRoles = <ClinicalRole>[].obs;
  final RxList<Skill> skills = <Skill>[].obs;
  final Rx<PolicyConfig?> policyConfig = Rx<PolicyConfig?>(null);

  bool _loaded = false;

  /// Load all reference data (idempotent — only fetches once).
  Future<void> loadAll() async {
    if (_loaded) return;
    await Future.wait([
      loadProvinces(),
      loadSpecialties(),
      loadClinicalRoles(),
      loadSkills(),
      loadPolicyConfig(),
    ]);
    _loaded = true;
  }

  Future<void> loadProvinces() async {
    final res = await _api.get('/reference/provinces');
    provinces.value = ((res['provinces'] ?? []) as List)
        .map((j) => Province.fromJson(j))
        .toList();
  }

  Future<List<City>> getCitiesByProvince(String provinceId) async {
    final res = await _api.get('/reference/cities?provinceId=$provinceId');
    final list =
        ((res['cities'] ?? []) as List).map((j) => City.fromJson(j)).toList();
    cities.value = list;
    return list;
  }

  Future<void> loadSpecialties() async {
    final res = await _api.get('/reference/specialties');
    specialties.value = ((res['specialties'] ?? []) as List)
        .map((j) => Specialty.fromJson(j))
        .toList();
  }

  Future<void> loadClinicalRoles() async {
    final res = await _api.get('/reference/clinical-roles');
    clinicalRoles.value = ((res['clinicalRoles'] ?? []) as List)
        .map((j) => ClinicalRole.fromJson(j))
        .toList();
  }

  Future<void> loadSkills() async {
    final res = await _api.get('/reference/skills');
    skills.value =
        ((res['skills'] ?? []) as List).map((j) => Skill.fromJson(j)).toList();
  }

  Future<void> loadPolicyConfig() async {
    final res = await _api.get('/reference/policy-config');
    policyConfig.value = PolicyConfig.fromJson(res['config'] ?? res);
  }
}
