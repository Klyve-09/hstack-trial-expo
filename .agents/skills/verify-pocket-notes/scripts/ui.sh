#!/usr/bin/env bash
# Drive Pocket Notes on the verification emulator through adb and uiautomator.
# Labels match a node's exact `text` or `content-desc` from a fresh uiautomator dump.
#
#   ui.sh start                  start (or bring back) the app and wait for its activity
#   ui.sh stop                   force-stop the app (process death; data stays)
#   ui.sh nodes                  dump the screen and list labelled nodes with their bounds
#   ui.sh wait <label> [secs]    wait until a node with that label is on screen (default 30 s)
#   ui.sh absent <label>         exit 0 only if no node has that label right now
#   ui.sh tap <label>            tap the centre of the first node with that label
#   ui.sh type <label> <text>    tap the field with that label, then type the text
#   ui.sh back                   press the system back key
#   ui.sh begin <journey>        open a new evidence directory for this journey
#   ui.sh shot <step>            save <step>.png and <step>.xml into the evidence directory
set -euo pipefail
source "$(dirname "$0")/env.sh"
mkdir -p "$POCKET_RUN_DIR"
DUMP="$POCKET_RUN_DIR/last-dump.xml"

dump() {
  local out="${1:-$DUMP}" i
  for i in 1 2 3 4 5; do
    if adb_s shell uiautomator dump /sdcard/pocket-dump.xml >/dev/null 2>&1 \
      && adb_s exec-out cat /sdcard/pocket-dump.xml >"$out" && grep -q '<hierarchy' "$out"; then return 0; fi
    sleep 1
  done
  echo "ui: uiautomator dump failed" >&2; return 1
}

# Prints "x y" for the first node whose text or content-desc equals $2 in dump $1.
center() {
  python3 -I - "$1" "$2" <<'PY'
import re, sys, xml.etree.ElementTree as ET
path, label = sys.argv[1], sys.argv[2]
for node in ET.parse(path).iter('node'):
    if label in (node.get('text'), node.get('content-desc')):
        l, t, r, b = map(int, re.findall(r'-?\d+', node.get('bounds')))
        print((l + r) // 2, (t + b) // 2)
        sys.exit(0)
sys.exit(1)
PY
}

case "${1:-}" in
  start)
    adb_s shell am start -W -n "$POCKET_ACTIVITY" >/dev/null ;;
  stop)
    adb_s shell am force-stop "$POCKET_PACKAGE" ;;
  nodes)
    dump
    python3 -I - "$DUMP" <<'PY'
import sys, xml.etree.ElementTree as ET
for n in ET.parse(sys.argv[1]).iter('node'):
    t, d = n.get('text') or '', n.get('content-desc') or ''
    if t or d:
        print(f"text={t!r} desc={d!r} class={n.get('class')} bounds={n.get('bounds')}")
PY
    ;;
  wait)
    label="$2"; secs="${3:-30}"; end=$((SECONDS + secs))
    while [ "$SECONDS" -lt "$end" ]; do
      dump && center "$DUMP" "$label" >/dev/null && { echo "found: $label"; exit 0; }
      sleep 1
    done
    echo "ui: '$label' did not appear within ${secs}s (last dump: $DUMP)" >&2; exit 1 ;;
  absent)
    dump
    if center "$DUMP" "$2" >/dev/null; then echo "ui: '$2' is on screen" >&2; exit 1; fi
    echo "absent: $2" ;;
  tap)
    dump
    xy="$(center "$DUMP" "$2")" || { echo "ui: no node labelled '$2' (last dump: $DUMP)" >&2; exit 1; }
    adb_s shell input tap $xy ;;
  type)
    "$0" tap "$2"; sleep 0.5
    # `input text` takes %s for a space; quote the rest for the device shell.
    encoded="$(python3 -I -c 'import shlex,sys; print(shlex.quote(sys.argv[1].replace(" ", "%s")))' "$3")"
    adb_s shell input text "$encoded" ;;
  back)
    adb_s shell input keyevent KEYCODE_BACK ;;
  begin)
    dir="$POCKET_EVIDENCE_ROOT/$(date -u +%Y%m%dT%H%M%SZ)-$(git -C "$POCKET_REPO" rev-parse --short HEAD)-$2"
    mkdir -p "$dir"
    {
      echo "journey: $2"
      echo "commit: $(pocket_head)"
      echo "installed_apk_commit: $(cat "$POCKET_RUN_DIR/installed-sha" 2>/dev/null || echo unknown)"
      echo "avd: $POCKET_AVD"
      echo "serial: $POCKET_SERIAL"
      echo "fingerprint: $(adb_s shell getprop ro.build.fingerprint | tr -d '\r')"
      echo "started_utc: $(date -u +%FT%TZ)"
    } >"$dir/meta.txt"
    echo "$dir" >"$POCKET_RUN_DIR/evidence-dir"
    echo "$dir" ;;
  shot)
    dir="$(pocket_evidence_dir)"; [ -n "$dir" ] || { echo "ui: run 'ui.sh begin <journey>' first" >&2; exit 1; }
    adb_s exec-out screencap -p >"$dir/$2.png"
    dump "$dir/$2.xml"
    echo "$dir/$2.png" ;;
  *)
    sed -n '2,16p' "$0" >&2; exit 2 ;;
esac
