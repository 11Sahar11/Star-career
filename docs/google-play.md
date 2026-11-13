# STAR on Google Play (Capacitor)

STAR ships as an Android app. The APK contains the game files. It does not open a website and it does not set `server.url`.

The application id is **`com.starcareer.game`**. It is approved. The one place to read it is [`app.config.json`](../app.config.json). `capacitor.config.ts` and `android/app/build.gradle` both read that file.

## Build a debug APK

```bash
npm install
npm run android:debug
```

That command builds the static web app, copies it into the Android project, and runs `assembleDebug`. The APK is:

`android/app/build/outputs/apk/debug/app-debug.apk`

Pull requests also build this APK and upload it as an artifact (`.github/workflows/android.yml`).

## Release build and the upload key

The upload keystore is **not in this repo**. Do not commit `*.keystore`, `*.jks`, `local.properties`, or signing passwords.

Create the upload key on the owner's machine and keep the file and passwords somewhere else (a password manager, not git):

```bash
keytool -genkeypair -v -keystore star-upload.keystore -alias star -keyalg RSA -keysize 2048 -validity 10000
```

`android/app/build.gradle` only applies a release signing config when all of these are set in the environment (or in `android/keystore.properties`, which is gitignored):

- `STAR_UPLOAD_STORE_FILE` — path to the keystore, outside the repo
- `STAR_UPLOAD_STORE_PASSWORD`
- `STAR_UPLOAD_KEY_ALIAS`
- `STAR_UPLOAD_KEY_PASSWORD`

Then:

```bash
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
```

The file to upload is `android/app/build/outputs/bundle/release/app-release.aab`.

In Play Console, turn on **Play App Signing**. Google holds the app signing key. The keystore above is only the upload key. If it is lost, Google can reset the upload key; the app signing key stays with Google.

## Ads

Version 1 uses Google's **official test** ad units (`app.config.json`, `ads.testOnly: true`). Real AdMob ids come later: put them in that file and set `testOnly` to false.

The Play Console listing must declare **Contains ads**.

Before any ad request, the Android app runs Google's UMP consent flow. Debug and test builds set UMP debug geography to **EEA**, which is how the EEA and UK consent form is tested. Release builds leave geography unset so the device's real region is used. Hashed test-device ids, if a physical phone needs them, go in `ads.umpTestDeviceIds`.

Players who say they are under 16 are tagged `tagForUnderAgeOfConsent`. The app is not tagged for child-directed treatment. The max ad content rating is Teen (T).

After consent, the interstitial and the rewarded ad are preloaded. `showInterstitial` only presents that preloaded full-screen ad and waits for AdMob's close button. It does not decide how often the season ad may play. That frequency (once per season transition, not after season 1, skip if a rewarded ad played in the last 90 seconds) is not in this change.

Other rules already in the game:

- The season summary is on screen before its continue button can ask for the interstitial. Nothing is requested during a match or at halftime.
- Rewarded clips only when the player chooses one.
- No banners.
- If the device save has `removeAds.owned`, ads are skipped and rewards are granted without a clip.

The browser build does not load AdMob. Rewards are granted immediately and the interstitial is skipped.

## Still needed from the owner

1. **Play Console** app for `com.starcareer.game`, with Play App Signing enabled.
2. The **upload keystore**, stored outside this repo.
3. **Real AdMob app id and unit ids** when the owner is ready to leave test ads. The test app id in the manifest must be replaced at the same time (`app.config.json` → `ads.androidAppId`, applied by Gradle).
4. A public **privacy policy** URL. The in-app page is `/privacy`. Host that text on a free static host (GitHub Pages is enough) and paste the URL into Play Console. The listing is **13+**, contains ads, and stores the career only on the device (no account in version 1).
5. Store listing assets already in `store/` (icon and feature graphic), plus phone screenshots.

## Icons

Android uses an adaptive icon and a splash screen generated from `public/icons/icon-512-maskable.png` and `public/icons/icon-512.png`. They live under `android/app/src/main/res/`.
