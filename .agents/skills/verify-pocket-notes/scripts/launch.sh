#!/usr/bin/env bash
# Build the release APK for HEAD, boot the verification emulator headless, install the APK,
# and start Pocket Notes. Prints "READY <sha> <serial>" once the notes list is on screen.
# Run on the Hand from the clone: .agents/skills/verify-pocket-notes/scripts/launch.sh
set -euo pipefail
source "$(dirname "$0")/env.sh"
UI="$(dirname "$0")/ui.sh"
mkdir -p "$POCKET_RUN_DIR"
cd "$POCKET_REPO"

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "launch: tracked files are modified; sync the clone first" >&2; git status --short >&2; exit 1
fi
HEAD_SHA="$(pocket_head)"

# 1. Build (skipped when the APK on disk was built from HEAD).
if [ ! -f "$POCKET_APK" ] || [ "$(cat "$POCKET_RUN_DIR/apk-sha" 2>/dev/null)" != "$HEAD_SHA" ]; then
  echo "launch: building release APK for $HEAD_SHA (first build takes several minutes)"
  npm ci --no-audit --no-fund >"$POCKET_RUN_DIR/npm.log" 2>&1
  npx expo prebuild --platform android --clean --no-install >"$POCKET_RUN_DIR/prebuild.log" 2>&1
  # Prebuild writes the package name into app.json and rewrites package.json scripts.
  # The generated android/ already holds both, so restore the tracked files.
  changed="$(git diff --name-only)"
  for f in $changed; do
    case "$f" in app.json|package.json) git checkout -- "$f" ;;
      *) echo "launch: prebuild changed unexpected tracked file $f" >&2; exit 1 ;; esac
  done
  (cd android && ./gradlew assembleRelease --no-daemon --console=plain) >"$POCKET_RUN_DIR/gradle.log" 2>&1 \
    || { echo "launch: gradle failed, see $POCKET_RUN_DIR/gradle.log" >&2; tail -30 "$POCKET_RUN_DIR/gradle.log" >&2; exit 1; }
  echo "$HEAD_SHA" >"$POCKET_RUN_DIR/apk-sha"
fi

# 2. Emulator: reuse ours, refuse a foreign one on our port, otherwise boot.
pid="$(cat "$POCKET_RUN_DIR/emulator.pid" 2>/dev/null || true)"
if [ -n "$pid" ] && tr '\0' ' ' <"/proc/$pid/cmdline" 2>/dev/null | grep -q -- "-avd $POCKET_AVD -port $POCKET_PORT"; then
  echo "launch: reusing emulator pid $pid"
else
  if pgrep -x adb >/dev/null; then echo 0 >"$POCKET_RUN_DIR/adb-started"; else echo 1 >"$POCKET_RUN_DIR/adb-started"; fi
  if "$ADB" devices | grep -q "^$POCKET_SERIAL"; then
    echo "launch: $POCKET_SERIAL is already in use by an emulator this run did not start; set POCKET_PORT" >&2; exit 1
  fi
  if ! "$EMULATOR" -list-avds | grep -qx "$POCKET_AVD"; then
    echo no | "$AVDMANAGER" create avd -n "$POCKET_AVD" -k "$POCKET_SYSIMG" >/dev/null
    cfg="$HOME/.android/avd/$POCKET_AVD.avd/config.ini"
    sed -i 's/^hw.ramSize=.*/hw.ramSize=4096/; s/^hw.keyboard=no/hw.keyboard=yes/; /^disk.dataPartition.path=/d' "$cfg"
    case "$POCKET_SYSIMG" in *pleos_car_emulator*)
      sed -i 's/^hw.lcd.width=.*/hw.lcd.width=2560/; s/^hw.lcd.height=.*/hw.lcd.height=1440/' "$cfg" ;; esac
  fi
  setsid nohup "$EMULATOR" -avd "$POCKET_AVD" -port "$POCKET_PORT" -no-window -no-audio -no-boot-anim \
    -gpu swiftshader_indirect -no-snapshot >"$POCKET_RUN_DIR/emulator.log" 2>&1 </dev/null &
  echo $! >"$POCKET_RUN_DIR/emulator.pid"
  echo "launch: booting $POCKET_AVD as $POCKET_SERIAL (pid $!)"
fi

for _ in $(seq 1 90); do
  [ "$(adb_s shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ] && break
  sleep 4
done
[ "$(adb_s shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ] || { echo "launch: emulator did not boot, see $POCKET_RUN_DIR/emulator.log" >&2; exit 1; }
# Record the qemu process itself, which is what cleanup must stop.
qpid="$(pgrep -f "qemu-system.*-avd $POCKET_AVD -port $POCKET_PORT" | head -1 || true)"
[ -n "$qpid" ] && echo "$qpid" >"$POCKET_RUN_DIR/emulator.pid"

# 3. Install and start from an empty data dir.
adb_s install -r "$POCKET_APK" >/dev/null
adb_s shell pm clear --user current "$POCKET_PACKAGE" >/dev/null
echo "$HEAD_SHA" >"$POCKET_RUN_DIR/installed-sha"
"$UI" start
"$UI" wait "Your notes" 90 >/dev/null
echo "READY $HEAD_SHA $POCKET_SERIAL"
