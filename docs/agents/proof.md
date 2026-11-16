# Proof

Run these checks in order from the repository root. Every command must exit zero.

| Check | Command |
| --- | --- |
| test | `npm test` |
| lint | `npm run lint` |
| typecheck | `npx tsc --noEmit` |
| export-android | `npx expo export --platform android` |

## Requirements

Use a Node.js version supported by Expo SDK 58, with npm. Install dependencies with `npm ci` before running the checks.

## Coverage

- `export-android`: `app.json`
- `export-android`: `app/**`
- `export-android`: `assets/**`
- `export-android`: `components/**`
- `export-android`: `lib/**`
- `export-android`: `package-lock.json`
- `export-android`: `package.json`
- `export-android`: `tsconfig.json`
- `lint`: `**/*.js`
- `lint`: `**/*.ts`
- `lint`: `**/*.tsx`
- `lint`: `package-lock.json`
- `lint`: `package.json`
- `lint`: `tsconfig.json`
- `test`: `__tests__/**`
- `test`: `app/compose.tsx`
- `test`: `components/**`
- `test`: `jest.config.js`
- `test`: `jest.setup.js`
- `test`: `lib/**`
- `test`: `package-lock.json`
- `test`: `package.json`
- `test`: `tsconfig.json`
- `typecheck`: `**/*.ts`
- `typecheck`: `**/*.tsx`
- `typecheck`: `package-lock.json`
- `typecheck`: `package.json`
- `typecheck`: `tsconfig.json`
- Review-only: `.github/**`
- Review-only: `.gitignore`
- Review-only: `AGENTS.md`
- Review-only: `CLAUDE.md`
- Review-only: `LICENSE`
- Review-only: `README.md`
- Review-only: `docs/**`
