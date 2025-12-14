# Firebase Push Notifications - Quick Test Guide

## ⚡ Quick Setup (5 minutes)

### 1. Get Your Server Key
```
Firebase Console → Project Settings → Service Accounts → Generate New Private Key
```

### 2. Add to `.env.local`
```env
FIREBASE_SERVER_KEY=your_server_key_from_step_1
```

### 3. Restart Dev Server
```bash
npx convex dev
```

## 🧪 Testing Steps

### Step 1: Verify Token is Saved
1. Open your app in browser
2. Click "Allow" when asked for notification permission
3. Open DevTools → Console
4. Look for: `✅ FCM token saved successfully`
5. Go to Convex Dashboard → `fcmTokens` table
6. Should see your token listed

### Step 2: Send a Test Notification
Open Convex Dashboard and run this mutation:

```typescript
// In Convex Dashboard Console
await api.notifications.createNotification({
  userId: "your_user_id",
  userType: "client",
  message: "🎉 Test notification - if you see this, it works!"
})
```

### Step 3: Check Results
You should see:
- ✅ Toast notification in browser (top right)
- ✅ Browser notification (if app is minimized)
- ✅ Notification in database
- ✅ Logs in Convex dashboard

## 🔍 Debugging

### Check FCM Token
```bash
# In browser console
localStorage.getItem('fcmToken')
```

### View Convex Logs
```bash
# Terminal where you ran `npx convex dev`
# Look for: "Push notification sent successfully"
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Permission denied" | Click "Allow" when browser asks |
| Token not saving | Check `VITE_FIREBASE_VAPID_KEY` in `.env.local` |
| Notification not sending | Verify `FIREBASE_SERVER_KEY` is set |
| No toast showing | Check browser console for errors |

## 📱 Test on Different Devices

1. **Desktop**: Open app, allow notifications
2. **Mobile**: Open app in mobile browser, allow notifications
3. **Multiple tabs**: Open app in 2 tabs - both should receive notifications

## 🚀 Production Checklist

- [ ] `FIREBASE_SERVER_KEY` added to production env vars
- [ ] `VITE_FIREBASE_VAPID_KEY` added to production env vars
- [ ] Tested on production domain
- [ ] HTTPS enabled (required for push notifications)
- [ ] Service worker registered (`public/firebase-messaging-sw.js`)

## 📞 Support

If notifications aren't working:
1. Check browser console for errors
2. Check Convex logs: `npx convex logs`
3. Verify tokens in `fcmTokens` table
4. Ensure Firebase project ID matches in code

