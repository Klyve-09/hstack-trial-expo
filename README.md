# Pocket Notes

A small notebook built with Expo, React Native, TypeScript, and Expo Router.
Write a note with a title and optional body, browse your notes newest first, and
open a note to read its full text and creation date.

With the app installed, `pocketnotes://item/<id>` opens a note saved on this
device. An unknown note id returns to the notes list. If saved notes cannot be
read, the detail screen offers a retry.

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
composition screen, and deep links to saved or unknown notes, including storage
read failures on the detail screen. The app has three routes: `/`, `/compose`,
and `/item/[id]`.

Created from the official `create-expo-app` default template. Licensed under MIT.
