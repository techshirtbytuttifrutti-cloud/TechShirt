# Firebase Push Notifications - Debug Guide

## 🔍 Debugging Steps

### Step 1: Check if FCM Token is Being Saved

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for one of these messages:

**✅ Success:**
```
✅ FCM token saved successfully
```

**❌ Failure:**
```
❌ Error getting FCM token: [error message]
Notification permission denied
```

### Step 2: Check if Token is in Database

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Click **Data** → **fcmTokens** table
3. Should see entries like:
```
userId: "user_123abc..."
token: "firebase_token_xyz..."
```

**If empty:** Token is not being saved to database

### Step 3: Check Convex Logs

```bash
npx convex logs
```

Look for:
- ✅ `📱 Found X FCM tokens for user` - Tokens found
- ⚠️ `⚠️ No FCM tokens found for user` - No tokens saved
- ❌ `Error sending push notification` - Server error

### Step 4: Check Browser Notification Permission

1. Click the lock icon in address bar
2. Look for "Notifications" setting
3. Should be set to "Allow"

If it says "Block", you need to:
1. Click "Reset" or "Clear"
2. Reload page
3. Click "Allow" when prompted

## 🆘 Common Issues

### Issue 1: "No FCM tokens found for user"
**Cause:** Token not being saved to database
**Fix:**
1. Check browser console for errors
2. Verify notification permission is granted
3. Check `fcmTokens` table is empty
4. Restart browser and try again

### Issue 2: "Permission denied"
**Cause:** User didn't click "Allow" for notifications
**Fix:**
1. Check browser notification settings
2. Reset notification permission
3. Reload page
4. Click "Allow" when prompted

### Issue 3: Toast notification not showing
**Cause:** Token saved but push notification not sent
**Fix:**
1. Check Convex logs for errors
2. Verify `FIREBASE_SERVER_KEY` is set
3. Check if notification was created
4. Look for error in `sendPushNotification` action

### Issue 4: "FIREBASE_SERVER_KEY is not configured"
**Cause:** Environment variable not set
**Fix:**
1. Add to `.env.local`:
```env
FIREBASE_SERVER_KEY={"type":"service_account",...}
```
2. Restart dev server: `npx convex dev`

## 📊 Testing Checklist

- [ ] Browser console shows: `✅ FCM token saved successfully`
- [ ] `fcmTokens` table has entries
- [ ] Notification permission is "Allow"
- [ ] Convex logs show: `📱 Found X FCM tokens`
- [ ] Toast notification appears when creating notification
- [ ] Convex logs show: `Push notification sent successfully`

## 🎯 Full Test Flow

1. **Open app** → Allow notifications
2. **Check console** → Should see success message
3. **Check database** → `fcmTokens` table should have entry
4. **Create notification** via Convex Dashboard
5. **Check logs** → Should see "Found X FCM tokens"
6. **Look for toast** → Should appear in top right
7. **Check logs** → Should see "Push notification sent successfully"

## 📝 What to Check If Nothing Works

1. Is `FIREBASE_SERVER_KEY` in `.env.local`?
2. Did you restart dev server after adding key?
3. Is notification permission set to "Allow"?
4. Are there entries in `fcmTokens` table?
5. What errors appear in browser console?
6. What errors appear in Convex logs?

## 🚀 Next Steps

1. Follow the debugging steps above
2. Check each item in the checklist
3. Look at console and logs for errors
4. Report the specific error message you see

