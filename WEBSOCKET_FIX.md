# WebSocket Connection Error Fix

## Issue
WebSocket connection errors were appearing in the browser console even when the API server wasn't running or WebSocket wasn't needed.

```
WebSocket error: {}
```

## Root Cause
The `useAIJobUpdates` hook was attempting to connect to WebSocket on every page load, regardless of:
1. Whether the user was authenticated
2. Whether the API server was running
3. Whether the page actually needed WebSocket updates

## Solution Implemented

### 1. **Conditional WebSocket Connection** ✅

Modified `useAIJobUpdates` to only connect when:
- User has an authentication token
- User is on a page that needs AI updates (`/ai-config` or `/blocks/create-with-ai`)

```typescript
// Before: Always tried to connect
const WS_URL = API_URL.replace('http', 'ws') + '/ws'

// After: Only connect when needed
const WS_URL = shouldConnect ? API_URL.replace('http', 'ws') + '/v1/ws' : null
```

### 2. **Graceful Error Handling** ✅

Updated error handling to be less noisy:
- Suppress errors on initial connection attempt (server may be offline)
- Show warning instead of error for connection failures
- Only log meaningful reconnection attempts

```typescript
ws.onerror = (error) => {
  // Suppress error logging for initial connection failures
  if (reconnectCountRef.current === 0) {
    console.warn('WebSocket connection failed (server may be offline)')
  }
  onError?.(error)
}
```

### 3. **Authentication Check** ✅

WebSocket now requires authentication:
```typescript
const token = localStorage.getItem('auth_token')
if (!token) {
  // Don't connect without authentication
  return
}
```

### 4. **Smart Reconnection Logic** ✅

Only reconnect when appropriate:
```typescript
const shouldReconnect = hasToken && 
                       reconnectCountRef.current < reconnectAttempts &&
                       event.code !== 1000 // 1000 = normal closure
```

### 5. **Reduced Reconnection Attempts** ✅

Changed from 5 attempts to 3 for faster failure feedback:
```typescript
reconnectAttempts: 3 // Reduced from 5
```

## Files Modified

1. **`apps/web/src/hooks/useWebSocket.ts`**
   - Added authentication check
   - Improved error handling
   - Better reconnection logic
   - Fixed WebSocket URL path to `/v1/ws`

2. **`apps/web/src/app/ai-config/page.tsx`**
   - WebSocket only connects when there are active jobs

## Console Output Changes

### Before
```
❌ WebSocket error: {}
❌ WebSocket error: {}
❌ WebSocket error: {}
(Spam every page load)
```

### After (No Server Running)
```
⚠️  WebSocket connection failed (server may be offline)
(Only once, when actually needed)
```

### After (Server Running & Authenticated)
```
✓ WebSocket connected
(Clean, informative message)
```

## Testing

### When API Server is OFF
1. ✅ No error spam in console
2. ✅ App works normally without WebSocket
3. ✅ Warning shown only on relevant pages
4. ✅ No reconnection attempts without auth

### When API Server is ON
1. ✅ WebSocket connects successfully
2. ✅ Real-time updates work
3. ✅ Reconnection works on disconnect
4. ✅ Normal closure doesn't trigger reconnection

### Authentication States
1. ✅ No WebSocket connection without token
2. ✅ Connection established after login
3. ✅ Connection closed on logout

## WebSocket Endpoint

**Correct Endpoint:** `ws://localhost:8000/v1/ws`

This matches the FastAPI WebSocket route:
```python
# In apps/api/src/routers/websocket.py
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    ...
```

With the router mounted at `/v1`:
```python
# In apps/api/src/main.py
app.include_router(websocket_router.router, prefix="/v1", tags=["websocket"])
```

## Benefits

1. **Clean Console** - No error spam
2. **Better UX** - Clear warnings when needed
3. **Resource Efficient** - Only connects when necessary
4. **Authentication Aware** - Respects user state
5. **Graceful Degradation** - Works without server

## Migration Notes

No action needed for existing users. The changes are backward compatible and improve the experience automatically.

## Status

**✅ COMPLETE** - WebSocket errors properly handled and connection only attempted when needed.

---

**Fixed:** November 14, 2025  
**Status:** Production Ready  
**Impact:** Improved developer experience and cleaner console output
