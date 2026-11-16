#!/usr/bin/env bash
# Stop only what launch.sh started: the emulator pid it recorded and the adb server if
# launch.sh had to start it. Builds use --no-daemon, so no Gradle daemon is left behind.
# Evidence directories are kept.
set -uo pipefail
source "$(dirname "$0")/env.sh"

pid="$(cat "$POCKET_RUN_DIR/emulator.pid" 2>/dev/null || true)"
if pocket_owns_pid "$pid"; then
  adb_s emu kill >/dev/null 2>&1 || true
  for _ in $(seq 1 30); do kill -0 "$pid" 2>/dev/null || break; sleep 1; done
  if kill -0 "$pid" 2>/dev/null; then kill "$pid"; sleep 3; fi
  kill -0 "$pid" 2>/dev/null && { echo "cleanup: emulator pid $pid still alive" >&2; exit 1; }
  echo "cleanup: emulator pid $pid stopped"
else
  echo "cleanup: no emulator recorded by launch.sh is running"
fi

# Any listed device in any state (device, offline, unauthorized) means someone else uses adb.
if [ "$(cat "$POCKET_RUN_DIR/adb-started" 2>/dev/null)" = 1 ]; then
  others="$("$ADB" devices | tail -n +2 | grep -v -e '^$' -e "^$POCKET_SERIAL[[:space:]]" || true)"
  if [ -z "$others" ]; then "$ADB" kill-server && echo "cleanup: adb server stopped"
  else echo "cleanup: adb server left running for: $others"; fi
fi

rm -f "$POCKET_RUN_DIR/emulator.pid" "$POCKET_RUN_DIR/adb-started" "$POCKET_RUN_DIR/installed-tree" \
  "$POCKET_RUN_DIR/evidence-dir" "$POCKET_RUN_DIR/last-dump.xml"
echo "cleanup: evidence kept under $POCKET_EVIDENCE_ROOT"
ls -1 "$POCKET_EVIDENCE_ROOT" 2>/dev/null | tail -5
