# Firebase Push Notifications - Authentication Fix ✅

## 🔴 The Problem

Push notifications were being sent but not showing up on devices. The issue was **authentication**.

### What Was Wrong
- The code was using the raw Firebase Server Key JSON as a Bearer token
- Firebase Cloud Messaging API v1 requires a **JWT access token**, not the raw key
- The API was rejecting the requests silently

## ✅ The Solution

Updated `convex/sendPushNotification.ts` to:

1. **Parse the Firebase Server Key JSON**
   - Extract the service account credentials
   - Get the private key and client email

2. **Generate a JWT Token**
   - Create a JWT signed with the private key
   - Include proper scopes and expiration

3. **Exchange JWT for Access Token**
   - Call Google OAuth2 endpoint
   - Get a valid access token

4. **Send Notification with Access Token**
   - Use the access token in Authorization header
   - Firebase API accepts it and sends notification

## 📝 Changes Made

### `convex/sendPushNotification.ts`
- ✅ Added `getAccessToken()` function
- ✅ Parses Firebase Server Key JSON
- ✅ Generates JWT with proper claims
- ✅ Exchanges JWT for access token
- ✅ Uses access token for API calls
- ✅ Added error handling and logging

### Dependencies
- ✅ `jsonwebtoken` (already installed)
- ✅ `axios` (already installed)

## 🚀 Test Now!

### Step 1: Restart Dev Server
```bash
npx convex dev
```

### Step 2: Create Test Notification
1. Convex Dashboard → Functions → mutations
2. Run `notifications:createNotification` with:
```json
{
  "userId": "your_convex_user_id",
  "userType": "client",
  "message": "🎉 Test notification - should show now!"
}
```

### Step 3: Check for Notification
- ✅ Should see **toast notification** in top right
- ✅ Should see **browser notification** if app is minimized
- ✅ Check Convex logs for success message

## 📊 Expected Logs

**Convex Logs:**
```
🚀 Sending push notification to 1 devices
✅ Push notification sent successfully: {name: "projects/techshirt-32583/messages/..."}
```

**Browser Console:**
```
📬 Foreground message received: {notification: {...}, data: {...}}
```

## ✅ Verification Checklist

- [ ] Dev server restarted
- [ ] Toast notification appears
- [ ] Convex logs show "Push notification sent successfully"
- [ ] Browser console shows "Foreground message received"
- [ ] Notification shows correct message

## 🎯 How It Works Now

```
1. Create Notification
   ↓
2. Get FCM Tokens from Database
   ↓
3. Call sendPushNotificationToMultipleUsers
   ↓
4. Parse Firebase Server Key JSON
   ↓
5. Generate JWT Token
   ↓
6. Exchange JWT for Access Token
   ↓
7. Send to Firebase Cloud Messaging API v1
   ↓
8. Firebase sends to user's device
   ↓
9. Browser receives message
   ↓
10. Show Toast + Browser Notification ✅
```

## 🎊 Success!

Firebase push notifications should now work! 🎉

You can now:
- ✅ Send notifications to users
- ✅ Receive on multiple devices
- ✅ See toast notifications
- ✅ See browser notifications
- ✅ See notifications when app is minimized

