# Read a note

Tapping a note card opens its detail screen with the full title, the creation date and time, and the full body. A note with an empty body shows `No additional details.`

## Sub-features

- `read-open` opens the detail screen from a list card.
- `read-body` shows the full body, which is not truncated to two lines.
- `read-empty-body` shows `No additional details.` for an empty body.
- `read-back` returns to the list with system back.

## How to get to it (user POV)

- Tap a note card on the list screen. Its accessibility label is `Open <title>`.

## Driving it with ui.sh

Preconditions:

- A note titled `Long read` exists, with a body of more than two lines (several sentences), and a note titled `Title only` exists with an empty body. Create both through compose as in [Create a note](./create-note.md).

- **Open.** Run `ui.sh begin read-note`, `ui.sh tap 'Long read'`, and `ui.sh wait 'Note'`, then `ui.sh shot 01-long-read`. The full body is visible, not cut to two lines.
- **Back.** Run `ui.sh back` and `ui.sh wait 'Your notes'`.
- **Empty body.** Run `ui.sh tap 'Title only'`, `ui.sh wait 'No additional details.'`, and `ui.sh shot 02-title-only`.

## Gotchas

- The header title is the literal `Note`, not the note's title.
- The deep link `pocketnotes://item/<id>` is ticket expo#3 and is not part of this map until it ships.
