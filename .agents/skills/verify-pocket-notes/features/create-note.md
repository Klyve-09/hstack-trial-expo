# Create a note

A user opens the compose screen from the notes list, gives the note a title and an optional body, and saves it. The saved note appears at the top of the list and survives the app being killed.

## Sub-features

- `create-open` opens the compose screen from `New note`.
- `create-validate` refuses an empty or whitespace-only title with `Give your note a title.`
- `create-save` saves the title and body and returns to the list.
- `create-persist` keeps the note after process death and relaunch.

## How to get to it (user POV)

- On the list screen (`Your notes`), tap `New note`.

## Driving it with ui.sh

Preconditions:

- A fresh `launch.sh`, so the list shows `No notes yet. Write your first one.`

- **Begin.** Run `ui.sh begin create-note`, then `ui.sh shot 01-empty-list`. The list shows `Your notes` and the empty-state text.
- **Open compose.** Tap `New note`: run `ui.sh tap 'New note'`, then `ui.sh wait 'Capture a thought'`. The compose screen opens with `Title`, `Body`, and `Save note`.
- **Validate.** Tap `Save note` with no title: run `ui.sh tap 'Save note'` and `ui.sh wait 'Give your note a title.'`, then `ui.sh shot 02-title-required`. The alert shows and the screen stays on compose.
- **Enter content.** Run `ui.sh type Title 'Buy oat milk'` and `ui.sh type Body 'Two cartons for the week'`, then `ui.sh shot 03-filled`. Both fields show the typed text.
- **Save.** Run `ui.sh tap 'Save note'` and `ui.sh wait 'Your notes'`, then `ui.sh shot 04-list-after-save`. The list shows a card with `Buy oat milk` and the body preview, and `ui.sh absent 'No notes yet. Write your first one.'` passes.
- **Persist.** Kill and relaunch: run `ui.sh stop`, `ui.sh start`, and `ui.sh wait 'Buy oat milk' 60`, then `ui.sh shot 05-after-relaunch`. The two printed app pids differ, and the note is still listed.
- **Second view.** Run `ui.sh tap 'Buy oat milk'` and `ui.sh wait 'Two cartons for the week'`, then `ui.sh shot 06-detail`. The detail screen shows the title, the creation date and time, and the body.

## Gotchas

- Titles and bodies are trimmed on save. Assert the rendered text, not the typed input.
- After `Save note`, the app returns with `router.back()`. Wait for `Your notes` before asserting the list, or the dump may still show the compose screen.
- The soft keyboard can cover `Save note` on a small phone display. On the automotive AVD it does not. If `tap 'Save note'` misses, run `ui.sh back` once to close the keyboard, then tap again.
- `input text` types ASCII only.
- The list before and after relaunch can be pixel-identical. The relaunch is shown by `ui.sh stop` and `ui.sh start` printing different app pids; keep that output with the evidence.
