# Firebase Push Notifications - Complete Implementation Guide

## 🎯 Overview

Firebase push notifications are now fully integrated into your TechShirt application. Users will receive real-time notifications on all their devices when:
- A new notification is created
- A design is updated
- A request is approved/declined
- Any other important event occurs

## 📦 What's Implemented

### ✅ Client-Side
- **`src/hooks/useFirebaseNotifications.ts`**
  - Requests notification permission
  - Gets FCM token from Firebase
  - Saves token to database
  - Listens for foreground messages
  - Shows toast + browser notifications

### ✅ Server-Side
- **`convex/actions/sendPushNotification.ts`**
  - `sendPushNotification()` - Send to single device
  - `sendPushNotificationToMultipleUsers()` - Send to multiple devices
  - Uses Firebase Cloud Messaging REST API v1

### ✅ Database
- **`convex/notifications.ts`** - Updated to trigger push notifications
- **`convex/fcmTokens.ts`** - Fixed duplicate token issue
- **`convex/schema.ts`** - Already has `fcmTokens` table

### ✅ Configuration
- **`firebaseConfig.ts`** - Firebase initialization
- **`public/firebase-messaging-sw.js`** - Service worker for background notifications

## 🚀 Quick Start (5 Minutes)

### 1. Get Firebase Server Key
```
Firebase Console → Project Settings → Service Accounts → Generate New Private Key
```

### 2. Add to `.env.local`
```env
FIREBASE_SERVER_KEY=your_server_key_here
```

### 3. Restart Dev Server
```bash
npx convex dev
```

### 4. Test
- Open app, allow notifications
- Create a notification via Convex Dashboard
- Should see toast notification

## 📊 How It Works

### When User Opens App
1. `useFirebaseNotifications` hook runs
2. Requests notification permission
3. Gets FCM token from Firebase
4. Saves token to `fcmTokens` table
5. Listens for incoming messages

### When Notification is Created
1. Notification saved to database
2. Email sent (if email exists)
3. **Push notification sent to all user's devices**
4. User sees toast + browser notification

### Message Flow
```
Admin/System → createNotification()
    ↓
Save to DB + Send Email
    ↓
Get FCM Tokens for User
    ↓
sendPushNotificationToMultipleUsers()
    ↓
Firebase Cloud Messaging API
    ↓
User's Devices Receive Message
    ↓
Show Toast + Browser Notification
```

## 🔧 Configuration Details

### Environment Variables
```env
# Required for push notifications
FIREBASE_SERVER_KEY=your_server_key_from_firebase

# Already configured
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

### Firebase Project
- Project ID: `techshirt-32583`
- Already configured in `firebaseConfig.ts`

## 🧪 Testing

### Verify Token is Saved
```javascript
// In browser console
// Should see: ✅ FCM token saved successfully
```

### Send Test Notification
```typescript
// In Convex Dashboard
await api.notifications.createNotification({
  userId: "user_id",
  userType: "client",
  message: "Test notification!"
})
```

### Check Logs
```bash
# Terminal where you ran `npx convex dev`
# Look for: "Push notification sent successfully"
```

## 📱 Features

- ✅ Multi-device support
- ✅ Foreground notifications (toast)
- ✅ Background notifications (browser)
- ✅ Duplicate token prevention
- ✅ Error handling
- ✅ Email + push together
- ✅ Custom data in notifications

## 🔐 Security

- Server key stored in environment variables
- Tokens stored securely in database
- Only authenticated users can receive notifications
- Tokens validated before sending

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Permission denied" | User must click "Allow" |
| Token not saving | Check `VITE_FIREBASE_VAPID_KEY` |
| Notification not sending | Check `FIREBASE_SERVER_KEY` is set |
| No toast showing | Check browser console for errors |

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `convex/actions/sendPushNotification.ts` | Send FCM messages |
| `convex/notifications.ts` | Create notifications + trigger push |
| `convex/fcmTokens.ts` | Save/manage FCM tokens |
| `src/hooks/useFirebaseNotifications.ts` | Client-side setup |
| `firebaseConfig.ts` | Firebase initialization |
| `public/firebase-messaging-sw.js` | Background notifications |

## 🎓 Next Steps

1. Add `FIREBASE_SERVER_KEY` to `.env.local`
2. Restart dev server
3. Test by creating a notification
4. Deploy to production with env vars set
5. Monitor logs for any issues

## 📖 Documentation

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [FCM REST API v1](https://firebase.google.com/docs/cloud-messaging/send-message)
- [Web Push Notifications](https://firebase.google.com/docs/cloud-messaging/js/client)

## ✨ Summary

Your TechShirt application now has fully functional Firebase push notifications! Users will receive real-time notifications on all their devices, with both toast notifications in-app and browser notifications when the app is in the background.

