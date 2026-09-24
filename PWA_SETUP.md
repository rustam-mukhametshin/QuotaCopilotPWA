# PWA Setup and Usage Guide

## Overview

Quota Copilot is now a fully functional Progressive Web App (PWA) that can be installed as a desktop or mobile application and works offline.

## Installation

### Desktop Installation

#### Google Chrome / Microsoft Edge / Chromium-based Browsers
1. Open Quota Copilot in your browser
2. Look for the **"Install" button** in the address bar (or browser menu)
3. Click **"Install"** and confirm
4. The app will be installed on your desktop
5. A launcher shortcut will be created (Windows: Start menu, macOS: Applications, Linux: depends on desktop environment)

#### Manual Installation (Chrome/Edge)
1. Open the browser menu (three dots or hamburger icon)
2. Go to **More tools → Create shortcut**
3. Check **"Open as window"**
4. Click **"Create"**

### Mobile Installation

#### Android
1. Open Quota Copilot in Chrome or Edge mobile browser
2. Tap the **menu button** (three dots)
3. Select **"Add to Home Screen"** (or "Install app")
4. Confirm and app will be added to home screen
5. Launch the app from home screen - it will open in standalone mode

#### iOS (Safari)
1. Open Quota Copilot in Safari
2. Tap the **Share button** (arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Choose a name (default: "Quota Copilot") and tap **"Add"**
5. The app icon will appear on your home screen
6. Note: iOS support is limited but the app is fully functional

## Offline Usage

### What Works Offline

- **Static Assets**: All HTML, CSS, JavaScript, images, and fonts are cached and available offline
- **Navigation**: All app routes and pages load without network connection
- **Quota Data**: All quota information stored in Dexie (IndexedDB) is accessible offline
- **UI & Interactions**: The entire interface is fully functional offline

### What Requires Network

- **Real-time API Calls**: If your app fetches data from external APIs, those calls won't work without internet
- **Live Updates**: Real-time synchronization with servers requires network connection
- **User Authentication**: Login/logout operations require network access

### Data Persistence

#### Dexie Local Storage
- All quota data, settings, and user-created content are stored locally using **Dexie** (IndexedDB)
- Data persists even after app is closed or device is restarted
- Data syncs between offline and online states automatically when connection is restored

#### Service Worker Cache
- Static assets (CSS, JS, images) are cached by the Service Worker
- Cache expires after 30 days or when the app is updated
- Old cache is automatically cleaned up

## Features

### Installation Prompt
- First visit: Browser may show "Install" prompt automatically
- Second visit: If dismissed, use browser menu to install manually
- The app is fully installable once added to home screen

### Theme & Branding
- **App Name**: "Quota Copilot"
- **Theme Color**: Professional blue (#0066CC)
- **App Icon**: Displays on home screen and in app switcher
- **Splash Screen**: Loading screen when app is launched

### Service Worker
- Automatically registers on app load (production only)
- Checks for updates every hour
- Handles offline scenarios gracefully
- Caches responses for better performance

## Testing

### Chrome DevTools
1. Open the app in Chrome/Edge
2. Press **F12** to open DevTools
3. Go to **Application tab**
4. Check **Service Workers**: Should see registered worker with "active" status
5. Check **Manifest**: Should validate without errors
6. Check **Cache Storage**: View cached assets and data

### Testing Offline
1. Open DevTools (F12)
2. Go to **Network tab**
3. Check **Offline** checkbox
4. Reload page - app should load from cache
5. Navigate around - all pages should work
6. Check DevTools **Console** - no errors should appear

### Testing Installation
1. Open app in Chrome/Edge
2. Click **Install** button (address bar or menu)
3. Confirm installation
4. App should launch in standalone mode (no browser chrome)
5. Task switcher should show "Quota Copilot" not the browser name

## Troubleshooting

### Service Worker Not Registering
- **Issue**: Service Worker registration fails
- **Solution**: 
  - Check browser console (DevTools → Console tab)
  - Ensure app is served over HTTPS (required for production PWA)
  - Clear browser cache and reload
  - Check Service Workers in DevTools (Application → Service Workers)

### App Won't Install
- **Issue**: No install prompt appears
- **Solution**:
  - Must have valid manifest.webmanifest file
  - Must have service worker registered
  - Must be served over HTTPS
  - Try visiting again after 24+ hours
  - Manual installation: Use browser menu "Create shortcut" or "Add to Home Screen"

### Offline Not Working
- **Issue**: App doesn't work without network
- **Solution**:
  - Check Service Worker status (DevTools → Application → Service Workers)
  - Verify cache storage has content (DevTools → Application → Cache Storage)
  - Try reloading while offline
  - Clear cache and reinstall app

### Data Not Persisting
- **Issue**: Changes are lost after app closes
- **Solution**:
  - Check Dexie database status (DevTools → Application → IndexedDB)
  - Verify data is being saved (check app logic)
  - Clear browser storage and retry: Settings → Privacy → Clear browsing data

## Build & Deployment

### Production Build
```bash
npm run build
```
- Builds with optimization enabled
- Service Worker is bundled with production configuration
- Manifest is included in assets
- Output is ready for deployment

### Local Testing
```bash
npm start
```
- Runs development server
- Service Worker is NOT active in development (only production)
- Hot reload enabled for development

### Deployment Requirements
- **HTTPS Required**: Service workers only work over HTTPS
- **Manifest Path**: Ensure `manifest.webmanifest` is accessible at root
- **Icons Path**: Ensure `icons/` directory is accessible at root
- **Service Worker Path**: Ensure `ngsw-worker.js` is accessible at root

## Support

For more information about PWAs:
- [MDN Web Docs - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google Chrome - Web Apps](https://web.dev/progressive-web-apps/)
- [Angular Service Worker Documentation](https://angular.io/guide/service-worker-intro)
- [Dexie Documentation](https://dexie.org/)
