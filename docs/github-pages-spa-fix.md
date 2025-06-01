# GitHub Pages SPA Routing Fix

## Problem

GitHub Pages serves static files and doesn't support server-side routing. When users reload a page like `/the-ants-helpers/schedule` or share a direct link, GitHub Pages returns a 404 error because there's no physical file at that path.

## Solution

We implemented the standard GitHub Pages SPA redirect pattern using a custom `404.html` file.

## How It Works

### 1. 404.html Redirect

When GitHub Pages encounters a missing route, it serves our custom `404.html` file which:

- Captures the current path
- Removes the base path (`/the-ants-helpers/`) to get the SPA route
- Redirects to the main index.html with the route preserved as a query parameter

Example:

- User visits: `/the-ants-helpers/schedule`
- GitHub Pages returns: `404.html`
- Script redirects to: `/the-ants-helpers/?p=%2Fschedule`

### 2. Main App Route Restoration

In `src/main.tsx`, we handle the redirect parameter:

- Check for the `p` query parameter
- Extract the intended route path
- Use `window.history.replaceState()` to restore the clean URL
- TanStack Router takes over and renders the correct component

Example:

- App loads with: `/the-ants-helpers/?p=%2Fschedule`
- Script processes parameter and updates URL to: `/the-ants-helpers/schedule`
- TanStack Router renders the Schedule component

## Files Modified

1. **`public/404.html`** - Custom 404 page with redirect logic
2. **`src/main.tsx`** - Added `handleGitHubPagesRedirect()` function

## Routes Supported

This fix works for all application routes:

- `/` - Home/Today page
- `/schedule` - Weekly schedule view
- `/custom` - Custom reminders
- `/notifications` - Notification settings

## Testing

To test locally:

1. Build the app: `pnpm run build`
2. Serve the dist folder: `cd dist && python3 -m http.server 8080`
3. Navigate to: `http://localhost:8080/schedule`
4. Should see a brief "Redirecting..." message then load the schedule page

## Deployment

The fix is automatically deployed when the site is built for GitHub Pages:

- The `404.html` is copied to the dist folder
- GitHub Pages serves this file for any missing routes
- The redirect happens transparently to users

## Benefits

✅ **Direct links work** - Users can bookmark and share any page URL  
✅ **Reload works** - Refreshing any page loads correctly  
✅ **SEO friendly** - Clean URLs without hash routing  
✅ **Transparent** - Users see a brief redirect, then normal navigation  
✅ **Compatible** - Works with TanStack Router and PWA features
