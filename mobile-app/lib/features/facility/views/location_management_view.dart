import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:docduty/shared/theme/theme.dart';
import 'package:docduty/shared/widgets/widgets.dart';
import 'package:docduty/widgets/buttons.dart';
import 'package:docduty/widgets/my_text_field.dart';
import 'package:docduty/features/facility/controllers/location_management_controller.dart';

class LocationManagementView extends GetView<LocationManagementController> {
  const LocationManagementView({super.key});

  @override
  Widget build(BuildContext context) {
    controller.notifier = Provider.of<ColorNotifier>(context, listen: true);

    return Scaffold(
      backgroundColor: controller.notifier.getBgColor,
      appBar: AppBar(
        backgroundColor: controller.notifier.getBgColor,
        title: Text('Locations',
            style: TextStyle(
                fontFamily: "Gilroy",
                color: controller.notifier.text,
                fontSize: Get.height / 40,
                fontWeight: FontWeight.w600)),
        centerTitle: true,
        leading: MyBackButtons(context),
        actions: [
          IconButton(
            onPressed: () {
              controller.openAddForm();
              _showFormSheet(context);
            },
            icon: const Icon(Icons.add_circle, color: Color(0xFF0165FC)),
          ),
        ],
      ),
      body: Obx(() {
        if (controller.isLoading.value && controller.locations.isEmpty) {
          return const ShimmerLoading(itemCount: 4);
        }

        if (controller.locations.isEmpty) {
          return const EmptyStateWidget(
            title: 'No Locations',
            subtitle: 'Add your first facility location',
            icon: Icons.location_off_outlined,
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            HapticFeedback.mediumImpact();
            await controller.loadLocations();
          },
          color: const Color(0xFF0165FC),
          child: ListView.builder(
            padding: EdgeInsets.all(Get.width / 25),
            itemCount: controller.locations.length,
            itemBuilder: (context, index) {
              final loc = controller.locations[index];
              return AnimatedListItem(
                index: index,
                child: Container(
                  margin: EdgeInsets.only(bottom: Get.height / 70),
                  padding: EdgeInsets.all(Get.width / 25),
                  decoration: BoxDecoration(
                    color: controller.notifier.cardBg,
                    borderRadius: BorderRadius.circular(Get.height / 50),
                    border:
                        Border.all(color: controller.notifier.getfillborder),
                    boxShadow: controller.notifier.shadowSm,
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(Get.width / 30),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0165FC).withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.location_on,
                            color: const Color(0xFF0165FC),
                            size: Get.height / 40),
                      ),
                      SizedBox(width: Get.width / 25),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(loc.name ?? 'Location',
                                style: TextStyle(
                                    fontFamily: "Gilroy",
                                    fontSize: Get.height / 50,
                                    fontWeight: FontWeight.w600,
                                    color: controller.notifier.text)),
                            Text(loc.address ?? '',
                                style: TextStyle(
                                    fontFamily: "Gilroy",
                                    fontSize: Get.height / 60,
                                    color: Colors.grey)),
                            Text('Geo-fence: ${loc.geofenceRadiusM ?? 200}m',
                                style: TextStyle(
                                    fontFamily: "Gilroy",
                                    fontSize: Get.height / 65,
                                    color: Colors.grey)),
                          ],
                        ),
                      ),
                      PopupMenuButton(
                        icon: Icon(Icons.more_vert,
                            color: controller.notifier.text),
                        color: controller.notifier.getBgColor,
                        itemBuilder: (_) => [
                          PopupMenuItem(
                            value: 'edit',
                            child: Text('Edit',
                                style: TextStyle(
                                    fontFamily: "Gilroy",
                                    color: controller.notifier.text)),
                          ),
                          const PopupMenuItem(
                            value: 'delete',
                            child: Text('Delete',
                                style: TextStyle(
                                    fontFamily: "Gilroy", color: Colors.red)),
                          ),
                        ],
                        onSelected: (v) {
                          if (v == 'edit') {
                            controller.openEditForm(loc);
                            _showFormSheet(context);
                          } else if (v == 'delete') {
                            controller.deleteLocation(loc.id);
                          }
                        },
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      }),
    );
  }

  void _showFormSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: controller.notifier.getBgColor,
      shape: RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(Get.height / 30)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.fromLTRB(
            Get.width / 25,
            Get.height / 40,
            Get.width / 25,
            MediaQuery.of(context).viewInsets.bottom + Get.height / 40),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                controller.editingId.value != null
                    ? "Edit Location"
                    : "Add Location",
                style: TextStyle(
                    fontFamily: "Gilroy",
                    fontSize: Get.height / 38,
                    fontWeight: FontWeight.w600,
                    color: controller.notifier.text),
              ),
              SizedBox(height: Get.height / 40),
              MyTextField(
                  titletext: "Name",
                  type: TextInputType.text,
                  hintText: "e.g. Main Branch",
                  controller: controller.nameController),
              SizedBox(height: Get.height / 50),
              MyTextField(
                  titletext: "Address",
                  type: TextInputType.text,
                  hintText: "Full address",
                  controller: controller.addressController),
              SizedBox(height: Get.height / 50),
              Row(
                children: [
                  Expanded(
                      child: MyTextField(
                          titletext: "Latitude",
                          type: TextInputType.number,
                          hintText: "e.g. 24.8607",
                          controller: controller.latController)),
                  SizedBox(width: Get.width / 25),
                  Expanded(
                      child: MyTextField(
                          titletext: "Longitude",
                          type: TextInputType.number,
                          hintText: "e.g. 67.0011",
                          controller: controller.lngController)),
                ],
              ),
              SizedBox(height: Get.height / 50),
              MyTextField(
                  titletext: "Geo-fence Radius (meters)",
                  type: TextInputType.number,
                  hintText: "200",
                  controller: controller.radiusController),
              SizedBox(height: Get.height / 30),
              Obx(() => SizedBox(
                    width: Get.width,
                    height: Get.height / 17,
                    child: AnimatedSubmitButton(
                      text: controller.editingId.value != null
                          ? "Update Location"
                          : "Add Location",
                      isLoading: controller.isSubmitting.value,
                      onPressed: controller.submitLocation,
                      color: const Color(0xFF0165FC),
                    ),
                  )),
            ],
          ),
        ),
      ),
    );
  }
}
