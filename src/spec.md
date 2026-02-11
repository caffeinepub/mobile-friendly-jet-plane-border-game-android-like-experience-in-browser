# Specification

## Summary
**Goal:** Make the mobile game installable as a Progressive Web App (PWA) with offline play support after the first load.

**Planned changes:**
- Add PWA metadata and iOS/Android home-screen install support via a web app manifest and required meta tags (standalone/fullscreen, app name, icons).
- Add a service worker to precache built frontend assets and enable offline gameplay after the first successful online visit, including an update strategy to avoid stale-cache lock-in.
- Register the service worker from an allowed, non-immutable frontend entry point (without modifying `frontend/src/main.tsx`) and guard registration for unsupported browsers.
- Add a minimal in-app “Install” affordance that only appears when the browser indicates the app is installable and uses the native install prompt flow when available.

**User-visible outcome:** Users can add the game to their home screen on Android and iOS and launch it full-screen like an app; after opening once online, they can reopen and play offline (e.g., in airplane mode), with a small optional install prompt when supported.
