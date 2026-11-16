# Pocket Notes

A small notebook built with Expo, React Native, TypeScript, and Expo Router.
Write a note with a title and optional body, browse your notes newest first, and
open a note to read its full text and creation date.

With the app installed, `pocketnotes://item/<id>` opens a note saved on this
device. Unknown note ids, malformed item links, and unmatched paths return to
the notes list without leaving an empty screen in the back stack. If saved
notes cannot be read, the detail screen offers a retry.

Notes stay on your device using AsyncStorage under `pocket-notes.items.v1` as a
JSON array. There are no accounts, servers, or sync. Clearing app data or
uninstalling the app removes your notes. On web, notes belong to the browser's
local storage for the app's origin.

## Getting started

Use a Node.js version supported by Expo SDK 58 and npm.

```sh
npm ci
npm start
```

Open the project in an Expo Go version compatible with SDK 58, or use a configured
Android emulator or iOS simulator. Android requires the Android SDK; the iOS
simulator requires macOS and Xcode. For a browser, run:

```sh
npm run web
```

## Development

```sh
npm test
npm run lint
npx tsc --noEmit
npx expo export --platform android
```

The export command writes a production JavaScript bundle and assets to `dist/`;
it does not compile an Android APK or require an Android SDK.

Tests cover local persistence, unreadable data, write failures, and the note
composition screen, and deep links to saved or unknown notes, malformed item
links, and unmatched paths, including storage read failures on the detail
screen and the configured URL scheme. The app routes are `/`, `/compose`,
`/item/[id]`, and a `+not-found` fallback that returns to `/`.

Created from the official `create-expo-app` default template. Licensed under MIT.
