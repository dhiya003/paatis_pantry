# Kutty Samayal — Android conversion

Installable offline Android meal planner. The React interface is bundled inside the APK and loaded through AndroidX WebViewAssetLoader; it does not open or depend on the hosted website.

Features: English UI, side menu, editable traditional Tamil recipe adaptations with sources, age guidance, round-robin/frequency scheduling, overrides and locks, pantry, shopping, cooking mode, Android speech recognition/TTS, JSON backup/import, 6 PM Asia/Kolkata local notifications including the next day's menu, ingredients and preparation.

All family data lives in app-private Android storage. Enter the child profile at first launch. No account, cloud sync, secret key or personal profile is bundled. The earlier website/ChatGPT reminder is independent. Recipe-name-only AI generation is not connected. Nutrient coverage is not a clinical adequacy calculation.

Reminders require notifications permission; exact 6 PM timing also needs Alarms & reminders access on Android 12+. Without it, Android may delay notifications. Reboot reschedules the next alarm. Force-stop prevents alarms until the app is reopened. The app regenerates a 370-day schedule on opening or editing; after that horizon it sends an open-to-refresh reminder. Speech stops when backgrounded, and may require Google's speech service/internet. No always-on wake word.

## Build
Node 22, Java 17, Gradle 8.11.1, Android SDK 35.
```
npm install
npm test
npm run build
mkdir -p native/app/src/main/assets
cp -R dist/. native/app/src/main/assets/
gradle -p native assembleDebug
```
The dedicated GitHub workflow builds the APK and runs an Android emulator smoke test. Its `kutty-samayal-apk` artifact contains `app-debug.apk`.

The checked-in **development-only** Android debug keystore (standard password `android`) keeps test APK updates compatible. It is intentionally public test material and must never be used for production/Play Store signing. Use a protected release key for a store release.

Photo attribution: Bajrang01 / Wikimedia Commons, IDLI_SAMBAR_AND_CHUTNEY_04.jpg, CC BY-SA 4.0, cropped; family serving shown. https://commons.wikimedia.org/wiki/File:IDLI_SAMBAR_AND_CHUTNEY_04.jpg

## Conversation assistant (1.2)
Talk to Kutty supports typed or hold-to-talk turns, recent conversation context, spoken answers, and reviewable meal/frequency/pantry proposals. Only explicit confirmation applies validated, atomic local changes. Locked meals, allergen exclusions, invalid dates, duplicate targets and stale proposals are rejected. Recipe creation/deletion is not part of the assistant action API.

This personal APK uses a bring-your-own OpenAI project key entered in a native secure dialog. No account key ships in source or the APK. AES-GCM encryption uses Android Keystore; the key is never exposed to JavaScript, recipe backups or logs. Requests go only to https://api.openai.com/v1/responses without following redirects, with store:false and bounded input/output. Conversation requests share planner context and age in months, not automatic name/DOB fields. Chat history is local, separate from recipe backups, and can be cleared with New chat. OpenAI API usage is separately billed. For public/multi-user distribution, replace this personal connection with an authenticated backend; do not distribute a shared provider key.

No live provider request has been verified without a user-supplied connection. Automated conversation tests simulate structured provider replies; they test context, confirmation and persistence, not real model quality or microphone transcription accuracy.
