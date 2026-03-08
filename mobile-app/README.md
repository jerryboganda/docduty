# DocDuty Mobile App

Flutter client for the DocDuty platform.

## Purpose

- Doctor mobile experience
- Facility mobile experience
- Platform admin mobile experience

## Current State

- Uses the live DocDuty backend API
- Role routing is aligned to `doctor`, `facility_admin`, and `platform_admin`
- Old unused UI-kit assets have been removed
- Generated IDE/build artifacts are not part of the intended source layout

## Key Paths

- App entry: `lib/main.dart`
- Routing: `lib/shared/routes/`
- API/services: `lib/core/services/`
- Models: `lib/core/models/`
- Features: `lib/features/`

## Local Commands

```bash
flutter pub get
flutter analyze --no-fatal-infos
flutter test
flutter run
```

## Environment

The app reads runtime values from `lib/core/config/env.dart`.

Important values:

- `API_BASE_URL`
- `ENABLE_REALTIME`
- `SOKETI_HOST`
- `SOKETI_PORT`
- `SOKETI_APP_KEY`
- `GOOGLE_MAPS_API_KEY`
- `DEBUG_LOGGING`

## Notes

- This folder should only contain source, platform projects, required assets, and Flutter metadata.
- Generated caches such as `.dart_tool`, `build`, `android/.gradle`, and `ios/Pods` can be removed and regenerated locally.
