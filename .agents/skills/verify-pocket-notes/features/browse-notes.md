# Browse notes

The home screen lists the user's notes newest first. Each card shows the title, up to two lines of the body, and the creation date. With no notes, the list shows an empty-state message. If the stored data cannot be read, it shows an error with `Try again`.

## Sub-features

- `browse-empty` shows `No notes yet. Write your first one.` when there are no notes.
- `browse-order` lists the newest note first.
- `browse-preview` shows the body preview, or no preview line for an empty body.
- `browse-error` shows `Could not load your notes. Please try again.` and `Try again` when stored data is unreadable.

## How to get to it (user POV)

- Launch the app. The list is the first screen.
- Press back from compose or from a note's detail screen.

## Driving it with ui.sh

Preconditions:

- A fresh `launch.sh`.

- **Empty state.** Run `ui.sh begin browse-notes`, `ui.sh wait 'No notes yet. Write your first one.'`, and `ui.sh shot 01-empty`.
- **Create two notes.** Repeat the save steps of [Create a note](./create-note.md) for `First note`, with body `older`, and then for `Second note`, with an empty body.
- **Order and preview.** Run `ui.sh shot 02-two-notes` and check `02-two-notes.xml`. The node with text `Second note` has a smaller top bound than `First note`. `older` appears under `First note`, and no body line appears under `Second note`.
- **Error state.** Not reachable through the user path. It needs corrupt AsyncStorage data, which only tests set up (`__tests__/items.test.ts`). Report it as not driven. Do not write to app storage to fake it.

## Gotchas

- The date line uses the device locale, which differs between the automotive AVD and a phone image. Assert that the line is present, not its format.
- `useFocusEffect` reloads the list each time the screen regains focus. Wait for the expected title after navigating back.
