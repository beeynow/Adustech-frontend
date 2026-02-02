# 🚀 Quick Setup: Deep Linking for Adustech Tech

## ✅ What's Already Done

- ✅ App configured for deep linking
- ✅ iOS Universal Links configured
- ✅ Android App Links configured
- ✅ Deep link handler created
- ✅ Website files created

## 🎯 What You Need to Do

### Step 1: Upload Files to beeynow.online (5 minutes)

Upload these files from the `website/.well-known/` folder:

```
Upload to: https://beeynow.online/.well-known/

Files:
1. apple-app-site-association  (NO file extension!)
2. assetlinks.json
```

**Important**: The files must be accessible at:
- `https://beeynow.online/.well-known/apple-app-site-association`
- `https://beeynow.online/.well-known/assetlinks.json`

### Step 2: Get Your Apple Team ID (iOS only - 2 minutes)

1. Go to: https://developer.apple.com/account
2. Click "Membership" in sidebar
3. Copy your **Team ID** (looks like: `ABCD123456`)
4. Edit `website/.well-known/apple-app-site-association`
5. Replace `TEAM_ID` with your actual Team ID:
   ```json
   "appID": "ABCD123456.com.adustech.app"
   ```

### Step 3: Get Your Android SHA256 Fingerprint (2 minutes)

After building with EAS:

```bash
eas credentials -p android
```

Or get it from your build:
```bash
# Look in EAS build logs for SHA256 fingerprint
```

Then:
1. Edit `website/.well-known/assetlinks.json`
2. Replace `YOUR_APP_SHA256_FINGERPRINT_HERE` with your actual fingerprint

### Step 4: Test Deep Links (3 minutes)

1. Build your app: `eas build --platform android --profile production`
2. Install on device
3. Send yourself a link: `https://beeynow.online/profile`
4. Tap it - should open in app!

## 🔗 Deep Link Examples

### Universal Links (Works even if app not installed)
```
https://beeynow.online/profile
https://beeynow.online/events
https://beeynow.online/post?id=123
https://beeynow.online/event?id=456
```

### App Scheme (Only works if app installed)
```
adustech://profile
adustech://events
adustech://dashboard
```

## 🧪 Test Page

Upload `deep-link-test.html` to your website and open it to test all links!

## ❗ Common Issues

### iOS Links Not Opening
- Check Team ID is correct
- Reinstall app (iOS caches the association file)
- Verify file is accessible via HTTPS

### Android Links Not Opening  
- Check SHA256 fingerprint is correct
- Go to Settings → Apps → Adustech Tech → Open by default → Clear defaults
- Reinstall app

### Both Not Working
- Ensure files are at `/.well-known/` on root domain
- Check files return `Content-Type: application/json`
- Use HTTPS (not HTTP)

## 📱 How It Works

```
User clicks: https://beeynow.online/profile

┌─────────────────────┐
│  App Installed?     │
└──────┬──────────────┘
       │
   ┌───┴───┐
   │  YES  │ → Opens in Adustech Tech App
   └───────┘
       │
   ┌───┴───┐
   │   NO  │ → Opens beeynow.online in browser
   └───────┘
```

## ✅ Verification Checklist

- [ ] Files uploaded to beeynow.online/.well-known/
- [ ] Apple Team ID updated in apple-app-site-association
- [ ] SHA256 fingerprint updated in assetlinks.json
- [ ] Files accessible via HTTPS
- [ ] Tested on iOS device
- [ ] Tested on Android device
- [ ] Deep links working correctly

## 🎉 You're Done!

Once the checklist above is complete, your deep linking is fully functional!

---

**Need Help?** Check `DEEP_LINKING_GUIDE.md` for detailed documentation.
