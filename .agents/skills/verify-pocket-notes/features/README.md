# Pocket Notes verification map

This directory is the maintained source for verifying the user-facing behavior of Pocket Notes on Android. Read this index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- `launch.sh` printed `READY <sha> emulator-5584`, and `doctor.sh` prints only `ok` lines for that sha.
- Launch clears app data, so every recipe starts with no notes and the list screen showing `Your notes`.
- Never drive an emulator or app instance that `launch.sh` did not start.

## Driving conventions

- Run helpers on the Hand from the clone root. In the recipes, `ui.sh` stands for `.agents/skills/verify-pocket-notes/scripts/ui.sh` run through `timeout 120 ssh -n laptop-arch 'cd /home/hyh/hand/hstack-trial-expo && …'`.
- Find nodes by visible text or accessibility label with `ui.sh tap|type|wait|absent`, never by coordinates.
- Treat every quoted label as literal, including the `…` in `Saving…`.
- Use ASCII text for typed input.
- A recipe that needs more than one note creates them through the compose screen first. There is no seed data.

## Evidence and skip reporting

- Start each journey with `ui.sh begin <feature-id>`, then `ui.sh shot <step>` before and after each user action. Every shot saves a PNG and its uiautomator dump.
- A mutation counts only after a second, read-only view of it: process death and relaunch, then the list, then the detail screen.
- Name the feature ID and entry point with every artifact.
- Report an unreachable path with the command tried and the precondition that was missing. Do not report a skipped entry point as verified through another path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then has exactly four H2 sections, in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with ui.sh`, and `Gotchas`.

## Features

- [Create a note](./create-note.md) covers composing, title validation, saving, and persistence across process death.
- [Browse notes](./browse-notes.md) covers the empty state, newest-first ordering, and the body preview.
- [Read a note](./read-note.md) covers opening a note's detail screen and the empty-body text.
