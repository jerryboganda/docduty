/// Reference data models: Province, City, Specialty, ClinicalRole, Skill.
/// These map to the backend's reference tables.

class Province {
  final String id;
  final String name;
  final String? createdAt;

  Province({required this.id, required this.name, this.createdAt});

  factory Province.fromJson(Map<String, dynamic> json) => Province(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        createdAt: json['created_at'],
      );

  Map<String, dynamic> toJson() => {'id': id, 'name': name};
}

class City {
  final String id;
  final String name;
  final String? provinceId;
  final String? provinceName;
  final String? createdAt;

  City({
    required this.id,
    required this.name,
    this.provinceId,
    this.provinceName,
    this.createdAt,
  });

  factory City.fromJson(Map<String, dynamic> json) => City(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        provinceId: json['province_id'],
        provinceName: json['province_name'],
        createdAt: json['created_at'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        if (provinceId != null) 'province_id': provinceId,
      };
}

class Specialty {
  final String id;
  final String name;
  final String? createdAt;

  Specialty({required this.id, required this.name, this.createdAt});

  factory Specialty.fromJson(Map<String, dynamic> json) => Specialty(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        createdAt: json['created_at'],
      );

  Map<String, dynamic> toJson() => {'id': id, 'name': name};
}

class ClinicalRole {
  final String id;
  final String name;
  final String? createdAt;

  ClinicalRole({required this.id, required this.name, this.createdAt});

  factory ClinicalRole.fromJson(Map<String, dynamic> json) => ClinicalRole(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        createdAt: json['created_at'],
      );

  Map<String, dynamic> toJson() => {'id': id, 'name': name};
}

class Skill {
  final String id;
  final String name;
  final String? createdAt;

  Skill({required this.id, required this.name, this.createdAt});

  factory Skill.fromJson(Map<String, dynamic> json) => Skill(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        createdAt: json['created_at'],
      );

  Map<String, dynamic> toJson() => {'id': id, 'name': name};
}

class PolicyConfig {
  final String id;
  final String key;
  final String value;
  final String? description;
  final String? updatedBy;
  final String? updatedAt;

  PolicyConfig({
    required this.id,
    required this.key,
    required this.value,
    this.description,
    this.updatedBy,
    this.updatedAt,
  });

  factory PolicyConfig.fromJson(Map<String, dynamic> json) => PolicyConfig(
        id: json['id'] ?? '',
        key: json['key'] ?? '',
        value: json['value'] ?? '',
        description: json['description'],
        updatedBy: json['updated_by'],
        updatedAt: json['updated_at'],
      );
}
