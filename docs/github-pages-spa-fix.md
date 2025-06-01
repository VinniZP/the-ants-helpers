# GitHub Pages SPA Routing Fix

## Problem

GitHub Pages serves static files and doesn't support server-side routing. When users reload a page like `/the-ants-helpers/schedule` or share a direct link, GitHub Pages returns a 404 error because there's no physical file at that path.

## Solution

We use **hash routing** strategy with TanStack Router. URLs become `#/schedule` instead of `/schedule`, and the hash fragment is handled entirely by JavaScript, avoiding any server-side routing issues.

## How It Works

### Hash Routing Strategy

With hash routing enabled:

- Routes use hash fragments: `https://nick.github.io/the-ants-helpers/#/schedule`
- The browser never sends hash fragments to the server
- GitHub Pages always serves `index.html` for the base URL
- JavaScript handles all routing client-side

### TanStack Router Configuration

In `src/main.tsx`, we configure the router with:

```typescript
const router = createRouter({
  routeTree,
  context: {},
  basepath: basePath,
  history: "hash", // Enable hash routing for GitHub Pages
  // ... other options
});
```

## Routes Supported

All application routes work seamlessly with hash routing:

- `#/` - Home/Today page
- `#/schedule` - Weekly schedule view
- `#/custom` - Custom reminders
- `#/notifications` - Notification settings

## Benefits

✅ **100% Reliable** - No server-side routing needed  
✅ **No 404 errors** - Hash fragments never hit the server  
✅ **Direct links work** - Users can bookmark and share any page URL  
✅ **Reload works** - Refreshing any page loads correctly  
✅ **Simple implementation** - One line configuration change  
✅ **PWA compatible** - Works perfectly with service workers  
✅ **Fast** - No redirect delays or complex URL manipulation

## Testing

To test locally:

1. Build the app: `pnpm run build`
2. Serve the dist folder: `cd dist && python3 -m http.server 8080`
3. Navigate to: `http://localhost:8080/#/schedule`
4. Reload the page - should work perfectly
5. Try direct links to any route with hash fragments

## URL Examples

- **Home**: `https://nick.github.io/the-ants-helpers/#/`
- **Schedule**: `https://nick.github.io/the-ants-helpers/#/schedule`
- **Custom**: `https://nick.github.io/the-ants-helpers/#/custom`
- **Notifications**: `https://nick.github.io/the-ants-helpers/#/notifications`

## Why Hash Routing?

Hash routing is the most reliable solution for static hosting:

- **No server configuration needed** - Works on any static host
- **No build-time complexity** - No custom 404.html or redirect scripts
- **No runtime overhead** - No URL parsing or history manipulation
- **Universal compatibility** - Works the same everywhere
- **SEO considerations** - For a PWA scheduling app, hash URLs are acceptable

This approach is simpler, more reliable, and requires zero server-side setup compared to the 404.html redirect pattern.
