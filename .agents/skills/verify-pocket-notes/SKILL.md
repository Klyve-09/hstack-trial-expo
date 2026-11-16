---
name: verify-pocket-notes
description: Drive the Pocket Notes Expo app as a user on an Android emulator on a Linux Hand (adb + uiautomator, release APK) and capture screenshot evidence. Use to confirm a change works in the real Android app, or to produce Screen check captures; not for iOS or web.
---

# Verify Pocket Notes on Android

Pocket Notes is an Expo Router app with three routes: `/` (notes list), `/compose`, and `/item/[id]`. Notes live in AsyncStorage on the device. The primary surface is the Android app. Web (`npm run web`) and iOS also exist; this skill covers Android only, and iOS needs a macOS machine.

The repo has no mobile test harness (no Maestro, Detox, or Espresso), so the helpers use only Android SDK `adb` and `uiautomator`.

## Where it runs

- Run the emulator on a `linux` Hand with KVM, never the Factory VM. Reach the Hand through `hstack:hand`. Sync the Hand clone to the commit under test the way that skill says, then run every helper over `ssh -n <hand> 'cd <clone> && <helper>'` with a `timeout`. Keep the output logs on the VM.
- Known Hand: `laptop-arch`. It has an interactive clone at `/home/hyh/hand/hstack-trial-expo`, SDK `/home/hyh/Android/Sdk`, and AVD `hstack-trial`.
- The emulator is headless (`-no-window`), so it never touches the Hand's screen. Driving is SSH-only and needs no `--before-input` status.
- Isolation: one emulator per port. The helpers use AVD `hstack-trial` on port `5584` (serial `emulator-5584`). Override with `POCKET_AVD` and `POCKET_PORT` to run a second instance side by side. Both must be the same for every helper in a run. An AVD can boot only once at a time, so a second instance needs a second AVD. `launch.sh` refuses to drive a serial it did not start.

All helpers live in `.agents/skills/verify-pocket-notes/scripts/` and are run from the clone root. `env.sh` holds the shared settings and is sourced, not run.

## Launch

```sh
timeout 3600 ssh -n laptop-arch 'cd /home/hyh/hand/hstack-trial-expo && .agents/skills/verify-pocket-notes/scripts/launch.sh'
```

What it does, in order:

1. It refuses if tracked files are modified.
2. It builds only when the APK on disk was not built from `HEAD`'s app tree, which is the commit's tree without `.agents/` and `.claude/`, so edits to this skill alone do not force a rebuild. The build is `npm ci`, then `npx expo prebuild --platform android --clean --no-install`, then a restore of `app.json` and `package.json`, then `./gradlew assembleRelease --no-daemon`.
3. It boots the AVD headless and creates the AVD first if it is missing.
4. It waits for `sys.boot_completed`, installs the APK, and clears app data so every run starts with no notes.
5. It starts `com.anonymous.pocketnotes/.MainActivity`.

Ready means the line `READY <sha> emulator-5584` is printed. Launch prints that line only after the `Your notes` heading is in the focused window's uiautomator dump twice, 10 s apart. That is the app being usable, not just booted. The automotive launcher keeps raising its own activities for a while after boot, so launch restarts the app until the list stays in front.

The first build takes about 10–20 minutes: Gradle downloads its distribution, the NDK, and CMake into the SDK. Later builds of a new commit take a few minutes. The build is a release APK with the JS bundle embedded, signed with the template's debug key. No Metro server runs, so there is no dev menu, LogBox, or bundler to keep alive.

Build logs go to `~/hand/verify-run/pocket-notes/{npm,prebuild,gradle}.log` on the Hand. The emulator log goes to `emulator.log` in the same folder.

## Doctor

```sh
timeout 60 ssh -n laptop-arch 'cd /home/hyh/hand/hstack-trial-expo && .agents/skills/verify-pocket-notes/scripts/doctor.sh'
```

The doctor is read-only. It checks that:

- the clone is clean;
- the recorded emulator pid is alive and is our AVD on our port;
- adb sees the serial and boot is complete;
- the installed APK was built from `HEAD`'s app tree;
- the package is installed.

It also prints the top activity. Every line must be `ok`. Run it first whenever anything looks off. A `FAIL installed APK built from HEAD's app tree` means rerun `launch.sh`.

## Drive

`ui.sh` finds nodes by the exact `text` or `content-desc` in a fresh `uiautomator dump` of the focused window. It never uses hard-coded coordinates. The usage list is at the top of `ui.sh`.

```sh
H='timeout 120 ssh -n laptop-arch'; C='cd /home/hyh/hand/hstack-trial-expo && .agents/skills/verify-pocket-notes/scripts'
$H "$C/ui.sh nodes"                       # list labelled nodes and bounds on the current screen
$H "$C/ui.sh tap 'New note'"              # tap by label
$H "$C/ui.sh type Title 'Buy oat milk'"   # tap the text field labelled Title, then type
$H "$C/ui.sh field Body"                  # only tap (focus) the text field labelled Body
$H "$C/ui.sh wait 'Buy oat milk' 20"      # wait for a label to appear
$H "$C/ui.sh absent 'No notes yet. Write your first one.'"
$H "$C/ui.sh back"                        # system back
$H "$C/ui.sh stop"; $H "$C/ui.sh start"   # process death, then relaunch
```

Stable handles in this app:

| Screen | Handle | Kind |
| --- | --- | --- |
| List (`/`) | `Your notes` | heading text |
| List | `New note` | button text |
| List | `No notes yet. Write your first one.` | empty-state text |
| List | `Open <title>` on each note card; `ui.sh tap '<title>'` also works, through the title text inside the card | card `content-desc` |
| List | `Could not load your notes. Please try again.` / `Try again` | load error |
| Compose (`/compose`) | `Capture a thought` | heading text |
| Compose | `Title`, `Body` | text fields' `content-desc`; a visible label with the same text sits above each field, so use `type` or `field`, which only match text fields |
| Compose | `Save note` (`Saving…` while saving) | button text |
| Compose | `Give your note a title.` | validation alert |
| Note (`/item/[id]`) | `Note` header, the note title, the body or `No additional details.` | text |
| Note | `This note is not available on this device.` | missing note |

Feature recipes are in [features/README.md](features/README.md).

## Evidence

```sh
$H "$C/ui.sh begin create-note"   # new evidence dir; prints its path
$H "$C/ui.sh shot 01-empty-list"  # writes 01-empty-list.png and 01-empty-list.xml
```

- Evidence goes to `~/hand/verify-evidence/pocket-notes/<UTC time>-<short sha>-<journey>/` on the Hand. That is outside the clone, so it never dirties the sync, and cleanup never deletes it.
- `meta.txt` in that folder records the commit, its app tree, the app tree the installed APK was built from, the AVD, and the device fingerprint. Captures where the two app trees differ do not count.
- Copy the folder to the VM before reporting: `scp -r laptop-arch:<dir> <vm dir>`.
- For a PR, put only the captures behind a verdict on the disposable branch `evidence/<pr>` and link them, as `hstack:hand` says.
- Standards:
  - Drive the real user path: taps and typing, not AsyncStorage writes or test-only routes.
  - Capture the screen before the action and the resulting state, each with its dump.
  - Prove persistence through the user path too: `ui.sh stop`, `ui.sh start`, and the note is still listed and opens.
- One screenshot per step is the default. Record a video of 30 s or less only when timing matters:

  ```sh
  adb -s emulator-5584 shell screenrecord --time-limit 30 /sdcard/<name>.mp4
  adb -s emulator-5584 pull /sdcard/<name>.mp4 <evidence dir>
  ```

## Cleanup

```sh
timeout 120 ssh -n laptop-arch 'cd /home/hyh/hand/hstack-trial-expo && .agents/skills/verify-pocket-notes/scripts/cleanup.sh'
```

Cleanup stops only what launch started:

- the recorded emulator pid, through `adb emu kill` and then that pid;
- the clone's Gradle daemon;
- the adb server, if launch had to start it and no other device is attached.

It never kills by process name. It keeps the AVD, the evidence, and the `android/` build cache (gitignored), so the next launch skips the native build when `HEAD` is unchanged. Run cleanup after every failed attempt too.

To remove the generated native project as well, run `rm -rf android ~/hand/verify-run/pocket-notes/apk-tree` in the clone.

## Gotchas

- `laptop-arch` has only one system image: `system-images;android-34;pleos_car_emulator;x86_64`, a 42dot Android Automotive image, not a phone. Consequences:
  - The display is 2560x1440 landscape at 160 dpi. Launch sets that when it creates the AVD; the 320x640 avdmanager default breaks the car launcher.
  - The foreground user is user 10, not 0. Use `--user current` for `pm` commands; `ui.sh` already does.
  - The app opens in multi-window mode in the right-hand panel, beside the driving view. Because the app asks for portrait, the system centres its window inside the panel. uiautomator then reports bounds relative to the panel, about 420 px left of where the app really is, so a tap on raw dump bounds lands in the black bar. `ui.sh tap` and `field` add the offset between the app window's frame from `dumpsys window windows` and the dump's root node. If you tap by hand, do the same.
  - `uiautomator dump` sees only the focused window. A dump with none of the app's text means a car activity took focus. Run `ui.sh start` to bring the app back.
  - The car launcher, maps, and driving view sit behind the app. Back from the notes list leaves the app.
  - The system language is Korean, so system strings such as the header back button (`위로 이동`) are Korean. The app's own strings are English.
  - Phone-only behaviour (portrait lock, a phone soft keyboard) is not exercised.

  For a phone run, install a phone image such as `system-images;android-34;google_apis;x86_64` with `sdkmanager`, then launch with `POCKET_AVD=<new name> POCKET_SYSIMG='system-images;android-34;google_apis;x86_64'`.
- `expo prebuild` rewrites the tracked `app.json` (it adds `android.package`) and `package.json` (the `android` and `ios` scripts). Launch restores both, so the clone stays clean and `hstack:hand` sync's dirty check does not trip. If prebuild touches any other tracked file, launch stops.
- The first Gradle build installs `ndk/` and `cmake/` into the Hand's Android SDK and downloads Gradle into `~/.gradle`.
- `uiautomator dump` sometimes fails while the screen is animating. `ui.sh` retries five times.
- `input text` cannot type non-ASCII text such as Korean. Use ASCII titles in journeys.
- Local checks with no account:
  - Custom URL scheme `pocketnotes://`: `adb -s emulator-5584 shell am start -W -a android.intent.action.VIEW -d 'pocketnotes://<path>' com.anonymous.pocketnotes`.
  - Process death: `ui.sh stop`, then `ui.sh start`.
  - Rotation and font scale follow `adb shell settings put system user_rotation|font_scale`. Record the old values and restore them.
- Needs a human check ("직접 확인 필요"): none today. The app has no accounts, push, purchases, or verified domain links.
