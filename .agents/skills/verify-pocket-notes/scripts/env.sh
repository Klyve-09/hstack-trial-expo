# Shared settings for the verify-pocket-notes helpers. Sourced, not executed.
# Every value can be overridden from the environment before calling a helper.

: "${ANDROID_HOME:=$HOME/Android/Sdk}"
export ANDROID_HOME
export CI=1

POCKET_AVD="${POCKET_AVD:-hstack-trial}"
POCKET_PORT="${POCKET_PORT:-5584}"
POCKET_SERIAL="emulator-$POCKET_PORT"
POCKET_PACKAGE="com.anonymous.pocketnotes"
POCKET_ACTIVITY="$POCKET_PACKAGE/.MainActivity"
# System image used only when the AVD does not exist yet. It must already be installed.
POCKET_SYSIMG="${POCKET_SYSIMG:-system-images;android-34;pleos_car_emulator;x86_64}"

POCKET_REPO="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"
POCKET_RUN_DIR="${POCKET_RUN_DIR:-$HOME/hand/verify-run/pocket-notes}"
POCKET_EVIDENCE_ROOT="${POCKET_EVIDENCE_ROOT:-$HOME/hand/verify-evidence/pocket-notes}"
POCKET_APK="$POCKET_REPO/android/app/build/outputs/apk/release/app-release.apk"

ADB="$ANDROID_HOME/platform-tools/adb"
EMULATOR="$ANDROID_HOME/emulator/emulator"
AVDMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager"

adb_s() { "$ADB" -s "$POCKET_SERIAL" "$@"; }
pocket_head() { git -C "$POCKET_REPO" rev-parse HEAD; }
# Hash of the committed tree minus this skill (.agents, .claude): edits to the skill alone
# do not change the app, so they do not force a native rebuild.
pocket_app_tree() {
  git -C "$POCKET_REPO" ls-tree HEAD | grep -vP '\t\.(agents|claude)$' | git -C "$POCKET_REPO" hash-object --stdin
}
# Directory of the current evidence run, created by `ui.sh begin`.
pocket_evidence_dir() { cat "$POCKET_RUN_DIR/evidence-dir" 2>/dev/null; }
