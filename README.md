# Adustech Frontend

Production-focused Expo + React Native application for Adustech.

## Stack
- Expo Router (file-based routing)
- React Native + TypeScript (strict mode)
- Axios service layer
- AsyncStorage-backed auth state with backend session revalidation

## Quick Start
1. Install dependencies:
```bash
npm install
```

2. Set runtime API endpoint:
```bash
export EXPO_PUBLIC_API_BASE_URL="https://adustech-backend.vercel.app"
```

3. Start app:
```bash
npx expo start
```

## Environment Configuration
The API client reads base URL from:
1. `EXPO_PUBLIC_API_BASE_URL`
2. `expo.extra.apiBaseUrl` (if provided)
3. Fallback defaults (`https` in production)

API base is normalized and `/api` is appended automatically in `services/config.ts`.

## Architecture
- `app/`: route screens and navigation layout
- `context/AuthContext.tsx`: auth lifecycle, storage policy, session refresh
- `services/`: API layer modules
- `utils/permissions.ts`: centralized RBAC helpers

## Security and Reliability Defaults
- HTTPS-first API resolution in production
- Centralized API error normalization via `ApiError`
- Cookie/session requests use `withCredentials: true`
- Startup auth state is revalidated with `/auth/me`
- Stale local auth state is automatically cleared
- Android permissions reduced to minimum required set

## Core Production Checklist
- Set production API URL via `EXPO_PUBLIC_API_BASE_URL`
- Verify backend CORS + secure cookie policy for mobile/web
- Run lint and typecheck in CI (`npm run lint`, `npx tsc --noEmit`)
- Build with EAS production profile

## Build
Use your existing build guides in:
- `BUILD_INSTRUCTIONS.md`
- `README_BUILD.md`
- `PRODUCTION_CHECKLIST.md`
