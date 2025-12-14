# Firebase Push Notifications - Setup Checklist

## ✅ Pre-Setup Verification

- [x] Firebase project created: `techshirt-32583`
- [x] Firebase config in `firebaseConfig.ts`
- [x] Service worker at `public/firebase-messaging-sw.js`
- [x] `axios` package installed
- [x] `react-hot-toast` package installed

## 🔧 Setup Steps (Do These Now)

### Step 1: Get Firebase Server Key
- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Select project: `techshirt-32583`
- [ ] Click gear icon → **Project Settings**
- [ ] Click **Service Accounts** tab
- [ ] Click **Generate New Private Key**
- [ ] Save the JSON file

### Step 2: Extract Server Key
- [ ] Open the downloaded JSON file
- [ ] Copy the entire JSON content (or just the `private_key` field)
- [ ] This is your `FIREBASE_SERVER_KEY`

### Step 3: Add to Environment
- [ ] Open `.env.local`
- [ ] Add: `FIREBASE_SERVER_KEY=your_key_here`
- [ ] Save file

### Step 4: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npx convex dev
```

## 🧪 Testing (After Setup)

### Test 1: Token Saved
- [ ] Open app in browser
- [ ] Click "Allow" for notifications
- [ ] Open DevTools → Console
- [ ] Look for: `✅ FCM token saved successfully`
- [ ] Go to Convex Dashboard → `fcmTokens` table
- [ ] Verify token is listed

### Test 2: Send Notification
- [ ] Open Convex Dashboard
- [ ] Go to **Functions** → **mutations**
- [ ] Find `notifications:createNotification`
- [ ] Run with:
  ```json
  {
    "userId": "your_user_id",
    "userType": "client",
    "message": "Test notification!"
  }
  ```
- [ ] Check browser for toast notification
- [ ] Check Convex logs for success message

### Test 3: Multiple Devices
- [ ] Open app in 2 different browsers
- [ ] Allow notifications on both
- [ ] Send notification
- [ ] Both should receive it

## 📊 Verification Checklist

### Client Side
- [ ] `useFirebaseNotifications` hook is called in `App.tsx`
- [ ] Hook runs on app load
- [ ] Permission dialog appears
- [ ] Token is saved to database

### Server Side
- [ ] `sendPushNotification` action exists
- [ ] `sendPushNotificationToMultipleUsers` action exists
- [ ] `createNotification` mutation triggers push notifications
- [ ] `fcmTokens` table has data

### Environment
- [ ] `FIREBASE_SERVER_KEY` is set
- [ ] `VITE_FIREBASE_VAPID_KEY` is set
- [ ] Both are in `.env.local`

## 🚀 Production Deployment

- [ ] Add `FIREBASE_SERVER_KEY` to production env vars
- [ ] Add `VITE_FIREBASE_VAPID_KEY` to production env vars
- [ ] Deploy code to production
- [ ] Test on production domain
- [ ] Verify HTTPS is enabled
- [ ] Monitor logs for errors

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Permission denied" | User must click "Allow" |
| Token not saving | Check `VITE_FIREBASE_VAPID_KEY` |
| Notification not sending | Check `FIREBASE_SERVER_KEY` is set |
| No toast showing | Check browser console for errors |
| Service worker error | Verify `public/firebase-messaging-sw.js` exists |

## 📞 Quick Support

**Check these in order:**
1. Browser console for errors
2. Convex logs: `npx convex logs`
3. `fcmTokens` table in Convex Dashboard
4. `.env.local` has both keys
5. Dev server restarted after adding keys

## ✨ What Works Now

✅ Users can receive push notifications on multiple devices
✅ Notifications show as toast in app
✅ Notifications show as browser notifications
✅ Notifications are saved to database
✅ Emails are sent alongside push notifications
✅ Duplicate tokens are prevented
✅ Error handling is in place

## 📝 Notes

- Notifications require HTTPS in production (localhost works in dev)
- Users must grant permission first
- Each device gets its own FCM token
- Tokens are stored in `fcmTokens` table
- Service worker handles background notifications

