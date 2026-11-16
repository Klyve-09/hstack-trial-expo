#!/usr/bin/env bash
# Stop only what launch.sh started: the emulator pid it recorded, the Gradle daemon of this
# clone, and the adb server if launch.sh had to start it. Evidence directories are kept.
set -uo pipefail
source "$(dirname "$0")/env.sh"

pid="$(cat "$POCKET_RUN_DIR/emulator.pid" 2>/dev/null || true)"
if [ -n "$pid" ] && tr '\0' ' ' <"/proc/$pid/cmdline" 2>/dev/null | grep -q -- "-avd $POCKET_AVD -port $POCKET_PORT"; then
  adb_s emu kill >/dev/null 2>&1 || true
  for _ in $(seq 1 30); do kill -0 "$pid" 2>/dev/null || break; sleep 1; done
  if kill -0 "$pid" 2>/dev/null; then kill "$pid"; sleep 3; fi
  kill -0 "$pid" 2>/dev/null && { echo "cleanup: emulator pid $pid still alive" >&2; exit 1; }
  echo "cleanup: emulator pid $pid stopped"
else
  echo "cleanup: no emulator recorded by launch.sh is running"
fi

[ -x "$POCKET_REPO/android/gradlew" ] && (cd "$POCKET_REPO/android" && ./gradlew --stop >/dev/null 2>&1 || true)

if [ "$(cat "$POCKET_RUN_DIR/adb-started" 2>/dev/null)" = 1 ] && ! "$ADB" devices | grep -q 'device$'; then
  "$ADB" kill-server && echo "cleanup: adb server stopped"
fi

rm -f "$POCKET_RUN_DIR/emulator.pid" "$POCKET_RUN_DIR/adb-started" "$POCKET_RUN_DIR/installed-sha" \
  "$POCKET_RUN_DIR/evidence-dir" "$POCKET_RUN_DIR/last-dump.xml"
echo "cleanup: evidence kept under $POCKET_EVIDENCE_ROOT"
ls -1 "$POCKET_EVIDENCE_ROOT" 2>/dev/null | tail -5
