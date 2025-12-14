# Firebase Push Notifications Setup Guide

## Overview
This guide sets up Firebase Cloud Messaging (FCM) for push notifications in your TechShirt application.

## Prerequisites
- Firebase project already created (techshirt-32583)
- Service account key from Firebase Console
- Environment variables configured

## Step 1: Get Firebase Server Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **techshirt-32583**
3. Go to **Project Settings** (gear icon)
4. Click **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file securely

## Step 2: Configure Environment Variables

Add to your `.env.local` file:

```env
# Firebase Server Key (from service account JSON)
FIREBASE_SERVER_KEY=your_server_key_here

# Firebase Web Config (already in firebaseConfig.ts)
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

To get the VAPID key:
1. Firebase Console → Project Settings
2. Cloud Messaging tab
3. Copy the "Server API Key" or generate a new key pair

## Step 3: Install Dependencies

```bash
npm install axios
```

## Step 4: How It Works

### Client Side (Browser)
1. User visits app → `useFirebaseNotifications` hook runs
2. Requests notification permission
3. Gets FCM token from Firebase
4. Saves token to Convex database (`fcmTokens` table)
5. Listens for foreground messages and shows toast notifications

### Server Side (Convex)
1. When a notification is created via `createNotification` mutation:
   - Notification is saved to database
   - Email is sent (if email exists)
   - **Push notification is sent to all user's devices**

2. The `sendPushNotification` action:
   - Retrieves all FCM tokens for the user
   - Sends message via Firebase Cloud Messaging REST API
   - Returns success/failure status

## Step 5: Testing Push Notifications

### Test 1: Verify Token is Saved
1. Open browser DevTools → Console
2. Look for: `✅ FCM token saved successfully`
3. Check Convex dashboard → `fcmTokens` table
4. Should see your token listed

### Test 2: Send Test Notification
Use Firebase Console or create a test endpoint:

```typescript
// In your Convex function
const result = await ctx.runAction(
  api.sendPushNotification.sendPushNotification,
  {
    fcmToken: "your_token_here",
    title: "Test Notification",
    body: "This is a test message",
    data: { type: "test" }
  }
);
```

### Test 3: Create Notification (Full Flow)
```typescript
// Call this mutation
await createNotification({
  userId: "user_id",
  userType: "client",
  message: "Your design is ready!"
});
```

You should see:
- Toast notification in browser
- Browser notification (if app is in background)
- Notification saved in database

## Troubleshooting

### "FIREBASE_SERVER_KEY is not configured"
- Add `FIREBASE_SERVER_KEY` to `.env.local`
- Restart Convex dev server: `npx convex dev`

### Tokens not being saved
- Check browser console for permission errors
- Ensure `VITE_FIREBASE_VAPID_KEY` is set
- Check that `fcmTokens` table exists in schema

### Notifications not sending
- Verify FCM token exists in database
- Check Convex logs for errors
- Ensure Firebase project ID is correct in action

### Permission denied
- User must click "Allow" when browser asks for notification permission
- Some browsers require HTTPS (localhost works in dev)

## Files Modified/Created

- ✅ `convex/actions/sendPushNotification.ts` - New action to send FCM messages
- ✅ `convex/notifications.ts` - Updated to trigger push notifications
- ✅ `src/hooks/useFirebaseNotifications.ts` - Enhanced with message handling
- ✅ `convex/fcmTokens.ts` - Fixed duplicate token issue
- ✅ `convex/schema.ts` - Already has `fcmTokens` table

## Next Steps

1. Add `FIREBASE_SERVER_KEY` to `.env.local`
2. Restart dev server
3. Test by creating a notification
4. Monitor browser console and Convex logs
5. Deploy to production with environment variables set

## References
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [FCM REST API](https://firebase.google.com/docs/cloud-messaging/send-message)
- [Web Push Notifications](https://firebase.google.com/docs/cloud-messaging/js/client)

