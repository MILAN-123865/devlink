# PWA Support: Offline-First Mobile Experience

This document outlines the design and architecture for adding Progressive Web App (PWA) capabilities to DevLink.

## Objective

Enhance the mobile experience of DevLink by providing offline-first capabilities, allowing users to browse projects, view profiles, and queue actions even when network connectivity is lost.

## Core Features

1. **Service Worker Caching**: 
   - Cache static assets (HTML, CSS, JS, Images).
   - Cache API responses for read-only flows (e.g., `/api/projects`, `/api/users/profile`).
2. **Install Prompt**:
   - Provide an "Add to Home Screen" prompt for seamless installation on iOS Safari and Android Chrome.
3. **Background Sync**:
   - Queue user actions like sending messages or applications when offline.
   - Automatically retry these writes when the network connection is restored.
4. **Push Notifications**:
   - Integrate Web Push API to send real-time alerts for mentions, applications, and messages.
5. **Web App Manifest**:
   - Serve a valid `manifest.json` with appropriate icons (192x192, 512x512), splash screens, and theme colors.

## Acceptance Criteria

- [ ] Lighthouse PWA score >= 90.
- [ ] Read-only flows function completely without an internet connection.
- [ ] Push notifications trigger correctly for specified events.
- [ ] Background sync correctly queues and replays mutations upon reconnection.

## Proposed Architecture

- Use `vite-plugin-pwa` to automate the generation of the service worker and manifest.
- Use `workbox` strategies:
  - `CacheFirst` for static assets.
  - `StaleWhileRevalidate` for API data routes.
- Implement an offline queue in IndexedDB for mutations (messages, applications) using `workbox-background-sync`.
- Update the UI to display a subtle "Offline Mode" indicator when `navigator.onLine` is false.
