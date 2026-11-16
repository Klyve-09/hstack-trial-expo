#!/usr/bin/env bash
# Read-only: is the running instance ours, booted, and on the commit we are verifying?
# Prints one line per check and exits non-zero if any check fails.
set -uo pipefail
source "$(dirname "$0")/env.sh"
fail=0
check() { if [ "$2" = ok ]; then echo "ok    $1"; else echo "FAIL  $1: $2"; fail=1; fi; }

head_sha="$(pocket_head)"
dirty="$(git -C "$POCKET_REPO" status --porcelain)"
check "clone clean at $head_sha" "$([ -z "$dirty" ] && echo ok || echo "modified or untracked files")"

pid="$(cat "$POCKET_RUN_DIR/emulator.pid" 2>/dev/null || true)"
if pocket_owns_pid "$pid"; then
  check "emulator pid $pid is ours ($POCKET_AVD on $POCKET_PORT)" ok
else
  check "emulator started by launch.sh" "no live pid in $POCKET_RUN_DIR/emulator.pid"
fi

state="$(adb_s get-state 2>/dev/null || true)"
check "adb sees $POCKET_SERIAL" "$([ "$state" = device ] && echo ok || echo "state '${state:-missing}'")"
boot="$(adb_s shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')"
check "boot completed" "$([ "$boot" = 1 ] && echo ok || echo "sys.boot_completed='$boot'")"

tree="$(pocket_app_tree)"
installed="$(cat "$POCKET_RUN_DIR/installed-tree" 2>/dev/null || true)"
check "installed APK built from HEAD's app tree $tree" "$([ "$installed" = "$tree" ] && echo ok || echo "installed '${installed:-none}'; rerun launch.sh")"
adb_s shell pm path --user current "$POCKET_PACKAGE" >/dev/null 2>&1 \
  && check "package $POCKET_PACKAGE installed" ok || check "package $POCKET_PACKAGE installed" "missing"

top="$(adb_s shell dumpsys activity activities 2>/dev/null | grep -m1 topResumedActivity | tr -d '\r')"
echo "info  top activity: ${top:-unknown}"
exit "$fail"
