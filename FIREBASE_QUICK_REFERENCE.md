# Firebase Push Notifications - Quick Reference Card

## 🚀 Setup (5 Minutes)

```bash
# 1. Get Server Key from Firebase Console
# Project Settings → Service Accounts → Generate New Private Key

# 2. Add to .env.local
FIREBASE_SERVER_KEY=your_key_here

# 3. Restart dev server
npx convex dev

# 4. Done! ✅
```

## 🧪 Test (1 Minute)

```typescript
// In Convex Dashboard, run:
await api.notifications.createNotification({
  userId: "user_id",
  userType: "client",
  message: "Test!"
})
```

Expected: Toast notification appears ✅

## 📁 Key Files

| File | Purpose |
|------|---------|
| `convex/actions/sendPushNotification.ts` | Send FCM messages |
| `convex/notifications.ts` | Trigger push notifications |
| `src/hooks/useFirebaseNotifications.ts` | Client setup |
| `convex/fcmTokens.ts` | Token management |

## 🔍 Debugging

```bash
# Check logs
npx convex logs

# Look for:
# ✅ FCM token saved successfully
# Push notification sent successfully
```

## 📊 How It Works

```
User Opens App
    ↓
Request Permission → Get Token → Save to DB
    ↓
Listen for Messages
    ↓
When Notification Created:
    Admin → Mutation → Get Tokens → Send via FCM → Show Toast
```

## ✨ Features

- ✅ Multi-device support
- ✅ Toast notifications
- ✅ Browser notifications
- ✅ Background messages
- ✅ Error handling

## 🆘 Troubleshooting

| Issue | Fix |
|-------|-----|
| Token not saving | Check `VITE_FIREBASE_VAPID_KEY` |
| Notification not sending | Check `FIREBASE_SERVER_KEY` |
| No toast | Check browser console |
| Permission denied | User must click "Allow" |

## 📚 Full Docs

- `FIREBASE_SETUP_CHECKLIST.md` - Setup steps
- `FIREBASE_QUICK_TEST.md` - Testing guide
- `FIREBASE_COMPLETE_GUIDE.md` - Full documentation

## 🎯 Production

```env
# Add to production env vars
FIREBASE_SERVER_KEY=your_key_here
VITE_FIREBASE_VAPID_KEY=your_key_here
```

## ✅ Checklist

- [ ] Get Firebase Server Key
- [ ] Add to `.env.local`
- [ ] Restart dev server
- [ ] Test notification
- [ ] Deploy to production
- [ ] Add env vars to production

## 🎊 Done!

Your Firebase push notifications are ready to use!

