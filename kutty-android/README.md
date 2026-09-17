# Kutty Samayal — Android conversion

Installable offline Android meal planner. The React interface is bundled inside the APK and loaded through AndroidX WebViewAssetLoader; it does not open or depend on the hosted website.

Features: English UI, side menu, editable traditional Tamil recipe adaptations with sources, age guidance, round-robin/frequency scheduling, overrides and locks, pantry, shopping, cooking mode, Android speech recognition/TTS, JSON backup/import, 6 PM Asia/Kolkata local notifications including the next day's menu, ingredients and preparation.

All family data lives in app-private Android storage. Enter the child profile at first launch. No account, cloud sync, secret key or personal profile is bundled. The earlier website/ChatGPT reminder is independent. Recipe-name-only AI generation is not connected. Nutrient coverage is not a clinical adequacy calculation.

Reminders require notifications permission; exact 6 PM timing also needs Alarms & reminders access on Android 12+. Without it, Android may delay notifications. Reboot reschedules the next alarm. Force-stop prevents alarms until the app is reopened. The app regenerates a 370-day schedule on opening or editing; after that horizon it sends an open-to-refresh reminder. Hold-to-talk stops when backgrounded; optional 60-minute hands-free sessions use a microphone foreground service. Phone speech recognition may require an internet connection.

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

## Low-data assistant (1.2.1)
Menu rotation, food-group planning, shopping lists and reminders remain deterministic on-device work: no scheduled AI calls, server, vector database or model training to maintain. Exact today/tomorrow menu and tonight-prep questions now answer from live local state even without an API key. Ambiguous follow-ups and edits still use the conversational model; confirmations remain local. Native phone speech/TTS is unchanged and may use the phone provider’s internet service.

AI requests use a compact catalog with allergens, meal slots and ingredient names; full recipe details are included for the target day and up to six mentioned recipes. Upcoming days contain only meal IDs and locks. Repeated daily shopping/prep data is no longer transmitted. Keep up to eight recent messages within a 12,000-character history budget; retain up to 60 locally for display. Older references may need clarification. Native and UI input limits are 65,000 characters. The existing gpt-4.1-mini model and output ceiling remain unchanged; no automatic retries or background AI calls. This lowers input usage but is not a guaranteed monetary or monthly spending cap. Live API billing and response quality need a connected-device check.

## Hands-free cooking (1.3)
Start a 60-minute session in Talk to Kutty while the app is visible. A microphone foreground service keeps local sherpa-onnx keyword spotting active with the screen locked. Say Hey Kutty, wait for the short beep, then ask. After a reply there is a brief follow-up listening window; silence returns to keyword detection. Say stop, tap the notification Stop action, or use Stop hands-free to release the microphone, speech recognizer, network request, TTS and CPU wake lock. Sessions use elapsed time, expire after 60 minutes and never restart after reboot, force-stop or process death.

Wake detection has no account, server or AI-token cost; after activation, the phone speech service may use network recognition. Existing compact-context AI requests are unchanged. The app must have microphone and notification permission. Hands-free has separate session history, cleared when stopped. Suggested changes are copied to Talk to Kutty for review/application; the background worker has no planner-write bridge. It cannot bypass screen locking. ARM64 devices and x86_64 emulators are packaged.

Build: run `python3 scripts/prepare-wake.py` after copying the Vite assets. This bundles pinned sherpa-onnx 1.13.8 and the dated 2025-12-20 phoneme keyword model; download hashes are printed in CI. Model/engine licence and attribution are included in assets/wake. The APK is larger because wake detection runs locally. Keyword accuracy, real kitchen noise, battery consumption and the phone-specific screen-off speech service still require physical-device testing.

Version 1.3.1 replaces the spelling-based wake model with explicit pronunciations of Hey Kutty. The UI reports actual microphone capture, input level, Android silencing, wake detection and speech-service errors. Ask now bypasses wake detection within the same session. Wake monitoring is local and consumes no AI tokens.

CI synthesizes two test voices for Hey Kutty, Hey Cutty, Stop and seven unrelated phrases, then decodes their PCM with the exact bundled model and keywords. The Android instrumentation tests repeat those fixtures through the actual AAR. These are regression checks, not human accent or kitchen-noise accuracy benchmarks. Real-device wake detection and a full 60-minute run still need verification. Earlier eSpeak tests were diagnostic and exposed poor detection; they do not establish human accuracy.
