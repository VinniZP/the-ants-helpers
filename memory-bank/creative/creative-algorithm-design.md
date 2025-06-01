🎨🎨🎨 ENTERING CREATIVE PHASE: ALGORITHM DESIGN 🎨🎨🎨

## ALGORITHM CHALLENGE
Design an efficient notification scheduling system that works reliably across browser tabs, handles time zone changes, and maintains accuracy even when the app is closed.

## ALGORITHM OPTIONS

### Option 1: Hybrid Timer + Service Worker Approach
- Main thread: setTimeout for active tabs
- Service Worker: Background notifications via postMessage
- Periodic sync for missed notifications
- Time Complexity: O(1) for scheduling, O(n) for sync
- Pros: Reliable, battery efficient
- Cons: Complex coordination logic

### Option 2: Service Worker Only with Alarm API
- All notifications handled by Service Worker
- Use experimental chrome.alarms API
- Persistent scheduling even when app closed
- Time Complexity: O(1) for all operations
- Pros: Most reliable, true background
- Cons: Limited browser support, experimental API

## ALGORITHM DECISION
**Selected: Hybrid Timer + Service Worker Approach (Option 1)**

### Implementation Logic:
1. **Active Tab**: Use setTimeout for immediate notifications
2. **Background**: Service Worker checks every 15 minutes for missed notifications
3. **Startup**: Check for missed notifications when app opens
4. **Persistence**: Store next notification time in IndexedDB

🎨🎨🎨 EXITING CREATIVE PHASE - ALGORITHM DECISION MADE 🎨🎨🎨
