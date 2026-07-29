# Paati's Pantry Android

A focused offline-first Android companion for the 90-day Tamil baby meal plan.

## Build locally

```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

The APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`.

## GitHub Actions

Push to `main` or run **Build Android APK** manually from the Actions tab. Download `paatis-pantry-debug-apk` from the completed workflow run.
