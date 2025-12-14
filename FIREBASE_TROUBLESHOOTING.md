# Firebase Push Notifications - Troubleshooting

## ❌ Current Issue

**`FIREBASE_SERVER_KEY` is NOT set in `.env.local`**

This is why push notifications are not working!

## ✅ How to Fix (5 Minutes)

### Step 1: Get Firebase Server Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **techshirt-32583**
3. Click **⚙️ Settings** (gear icon) → **Project Settings**
4. Click **Service Accounts** tab
5. Click **Generate New Private Key** button
6. A JSON file will download

### Step 2: Extract the Server Key
Open the downloaded JSON file and copy the entire content. It should look like:
```json
{
  "type": "service_account",
  "project_id": "techshirt-32583",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  ...
}
```

### Step 3: Add to `.env.local`
Open `.env.local` and add this line:
```env
FIREBASE_SERVER_KEY=<paste_entire_json_here>
```

**Example:**
```env
FIREBASE_SERVER_KEY={"type":"service_account","project_id":"techshirt-32583","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"..."}
```

### Step 4: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npx convex dev
```

### Step 5: Test
1. Open app in browser
2. Allow notifications when prompted
3. Create a notification via Convex Dashboard:
```typescript
await api.notifications.createNotification({
  userId: "your_user_id",
  userType: "client",
  message: "Test notification!"
})
```

You should see a toast notification! 🎉

## 🔍 Verification Checklist

- [ ] `FIREBASE_SERVER_KEY` is in `.env.local`
- [ ] Dev server restarted after adding key
- [ ] Browser console shows: `✅ FCM token saved successfully`
- [ ] `fcmTokens` table in Convex Dashboard has entries
- [ ] Toast notification appears when creating notification

## 🆘 Still Not Working?

### Check 1: Is the key in `.env.local`?
```bash
# View .env.local
cat .env.local | grep FIREBASE_SERVER_KEY
```

### Check 2: Check browser console
Open DevTools (F12) → Console tab
Look for:
- ✅ `✅ FCM token saved successfully` - Token saved
- ❌ `❌ Error getting FCM token:` - Permission or config issue
- ❌ `FIREBASE_SERVER_KEY is not configured` - Key not set

### Check 3: Check Convex logs
```bash
npx convex logs
```

Look for:
- ✅ `Push notification sent successfully` - Working!
- ❌ `Error sending push notification` - Check error message

### Check 4: Verify FCM tokens exist
1. Go to Convex Dashboard
2. Click **Data** → **fcmTokens** table
3. Should see entries with userId and token

## 📝 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `FIREBASE_SERVER_KEY is not configured` | Key not in `.env.local` | Add key to `.env.local` |
| `Permission denied` | User didn't click "Allow" | Click "Allow" when prompted |
| `invalid_grant` | Wrong or expired key | Get new key from Firebase |
| `No toast showing` | Token not saved | Check browser console |
| `fcmTokens table empty` | Token not being saved | Check VITE_FIREBASE_VAPID_KEY |

## 🎯 Next Steps

1. **Get the Firebase Server Key** from Firebase Console
2. **Add to `.env.local`**
3. **Restart dev server**
4. **Test by creating a notification**
5. **Check browser console for success message**

That's it! Push notifications should work after these steps.

