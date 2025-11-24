# Fix Summary: Nutrition Tab Blank Screen and PWA Cache Busting

## Issues Fixed

### 1. Nutrition Tab Blank Screen
**Problem**: After PR #292, clicking the Nutrition tab resulted in a blank screen.

**Root Cause**: Line 345 in `src/components/WorkTabs/NutritionTab.jsx` used the `<Restaurant />` icon component, but it wasn't imported from `@mui/icons-material`.

**Solution**: Added `Restaurant` to the icon imports in `NutritionTab.jsx`:
```javascript
import {
  Add,
  Delete,
  TrendingUp,
  MenuBook,
  Restaurant,  // Added this line
} from '@mui/icons-material';
```

### 2. PWA Cache Busting Issue
**Problem**: After each merge/deployment, users who saved the Progressive Web App (PWA) to their iOS homescreen via Safari were forced to reinstall the app for it to work.

**Root Cause**: 
- The service worker used a static `CACHE_NAME = 'goodlift-pwa-v2'`
- Vite generates JS/CSS files with content hashes that change on every build
- Old service worker cached old `index.html` which referenced old JS/CSS files with old hashes
- After deployment, these old files didn't exist anymore, causing the app to break
- Users had to manually delete and reinstall the PWA to get the new service worker

**Solution**: Implemented a comprehensive fix with three parts:

#### a) Dynamic Service Worker Versioning
Created a build-time script (`scripts/generate-sw-version.js`) that:
- Generates a unique version number based on build timestamp
- Creates `public/sw-version.js` with the version before each build
- Gets copied to `docs/sw-version.js` during the build process

#### b) Updated Service Worker Cache Strategy
Modified `public/service-worker.js` to:
- Import the dynamic version: `importScripts('/goodlift/sw-version.js')`
- Use dynamic cache name: `const CACHE_NAME = 'goodlift-pwa-${self.SW_VERSION || 'v2'}'`
- Implement network-first strategy for critical files (HTML, JS, CSS)
- Keep cache-first for static assets (images, icons, fonts)
- Use `skipWaiting()` and `claim()` for immediate activation

#### c) Automated Build Process
Updated `package.json` to automatically generate the version file:
```json
{
  "scripts": {
    "prebuild": "node scripts/generate-sw-version.js",
    "build": "vite build"
  }
}
```

## Technical Details

### Service Worker Cache Strategy

**Network-First for Critical Assets** (HTML, JS, CSS):
```javascript
const isCriticalAsset = 
  url.pathname.endsWith('.html') || 
  url.pathname.endsWith('.js') || 
  url.pathname.endsWith('.css');
```
- Always tries network first
- Falls back to cache if offline
- Ensures users get the latest version immediately after deployment

**Cache-First for Static Assets** (images, icons, fonts):
- Serves from cache immediately
- Updates cache in background
- Provides fast offline experience

### Version File Format
```javascript
// Auto-generated service worker version
// Generated at: 2025-11-24T05:13:24.716Z
const SW_VERSION = '1763961204716';
const SW_BUILD_DATE = '2025-11-24T05:13:24.716Z';

if (typeof self !== 'undefined') {
  self.SW_VERSION = SW_VERSION;
  self.SW_BUILD_DATE = SW_BUILD_DATE;
}
```

### Cache Name Evolution
- Before: `goodlift-pwa-v2` (static, manual updates required)
- After: `goodlift-pwa-1763961204716` (dynamic, auto-generated per build)

## Benefits

✅ **Automatic Updates**: Users get the latest version without reinstalling PWA  
✅ **Offline Support**: App still works offline with cached assets  
✅ **No Stale Assets**: Network-first strategy prevents serving outdated JS/CSS  
✅ **Smooth Experience**: Immediate activation with skipWaiting() and claim()  
✅ **Nutrition Tab Fixed**: Restaurant icon now displays correctly  
✅ **Backward Compatible**: Falls back to 'v2' if version file is missing  
✅ **Zero Manual Intervention**: Version generation is fully automated  

## Files Changed

1. **src/components/WorkTabs/NutritionTab.jsx** - Added Restaurant icon import
2. **public/service-worker.js** - Implemented network-first strategy and dynamic versioning
3. **scripts/generate-sw-version.js** - New script for version generation
4. **package.json** - Added prebuild script
5. **public/sw-version.js** - Auto-generated version file
6. **docs/** - Build output directory (includes all above changes)

## Testing

- ✅ Build succeeds with no errors
- ✅ Service worker version changes on each build
- ✅ Code review passed with no issues
- ✅ CodeQL security scan found no vulnerabilities
- ✅ Restaurant icon properly imported and available

## Future Maintenance

### When deploying:
1. Run `npm run build` (automatically generates new version)
2. Deploy the `docs/` folder contents
3. Users will automatically get the new version on next visit

### When modifying service worker:
- The `public/service-worker.js` is the source file
- Changes are automatically copied to `docs/service-worker.js` during build
- Version is auto-generated, no manual version bumping needed

### Troubleshooting:
If users report caching issues:
1. Check browser DevTools → Application → Service Workers
2. Verify service worker version matches latest deployment
3. Check browser console for service worker logs
4. Verify `sw-version.js` exists and has correct timestamp
