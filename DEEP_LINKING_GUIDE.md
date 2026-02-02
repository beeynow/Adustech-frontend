# 🔗 Adustech Tech - Deep Linking Guide

## Overview

Deep linking is fully configured for **Adustech Tech** with support for:
- ✅ Universal Links (iOS) - `https://beeynow.online/*`
- ✅ App Links (Android) - `https://beeynow.online/*`
- ✅ Custom URL Scheme - `adustech://*`

## How It Works

### When User Clicks a Link:

1. **App Installed**: Opens directly in Adustech Tech app
2. **App Not Installed**: Opens beeynow.online website

---

## Supported Deep Link Patterns

### Universal Links (Recommended)

```
https://beeynow.online/                    → App Home/Dashboard
https://beeynow.online/profile             → User Profile
https://beeynow.online/events              → Events List
https://beeynow.online/event?id=123        → Specific Event
https://beeynow.online/post?id=456         → Specific Post
https://beeynow.online/channel?id=789      → Specific Channel
https://beeynow.online/department?id=101   → Department Page
https://beeynow.online/timetable?id=202    → Timetable Detail
https://beeynow.online/login               → Login Screen
https://beeynow.online/register            → Registration Screen
```

### App Scheme Links

```
adustech://                    → App Home
adustech://profile             → User Profile
adustech://events              → Events List
adustech://dashboard           → Dashboard
```

---

## Website Setup Required

To enable deep linking, you need to host these files on **beeynow.online**:

### 1. iOS Universal Links
**File**: `/.well-known/apple-app-site-association`
- ✅ Already created in `website/.well-known/`
- Must be served with `Content-Type: application/json`
- No file extension
- Must be accessible at: `https://beeynow.online/.well-known/apple-app-site-association`

**Important**: Replace `TEAM_ID` with your Apple Developer Team ID:
```json
"appID": "YOUR_TEAM_ID.com.adustech.app"
```

### 2. Android App Links
**File**: `/.well-known/assetlinks.json`
- ✅ Already created in `website/.well-known/`
- Must be accessible at: `https://beeynow.online/.well-known/assetlinks.json`

**Important**: Replace `YOUR_APP_SHA256_FINGERPRINT_HERE` with your app's SHA256 fingerprint.

#### How to Get SHA256 Fingerprint:

```bash
# After EAS build, get the fingerprint:
eas credentials -p android

# Or from your keystore:
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

---

## Deployment Steps

### Step 1: Upload Files to beeynow.online

Upload these files to your website:

```
beeynow.online/
├── .well-known/
│   ├── apple-app-site-association  (no extension)
│   └── assetlinks.json
├── deep-link-test.html
└── app-redirect.html
```

### Step 2: Configure Server

Ensure your server returns correct headers:

**For Nginx:**
```nginx
location /.well-known/apple-app-site-association {
    default_type application/json;
}

location /.well-known/assetlinks.json {
    default_type application/json;
}
```

**For Apache (.htaccess):**
```apache
<Files "apple-app-site-association">
    Header set Content-Type application/json
</Files>

<Files "assetlinks.json">
    Header set Content-Type application/json
</Files>
```

### Step 3: Verify Files Are Accessible

Test these URLs in a browser:
- `https://beeynow.online/.well-known/apple-app-site-association`
- `https://beeynow.online/.well-known/assetlinks.json`

Both should return JSON content.

---

## Testing Deep Links

### Test Page
Open: `https://beeynow.online/deep-link-test.html`

This page contains test buttons for all deep link scenarios.

### Manual Testing

#### iOS Testing:
1. Send yourself an iMessage with: `https://beeynow.online/profile`
2. Tap the link
3. App should open directly to profile

#### Android Testing:
1. Send yourself a link via any app (WhatsApp, Email, etc.)
2. Tap the link
3. System should show "Open with Adustech Tech" option

### Command Line Testing:

**iOS Simulator:**
```bash
xcrun simctl openurl booted "https://beeynow.online/profile"
xcrun simctl openurl booted "adustech://profile"
```

**Android Emulator/Device:**
```bash
adb shell am start -a android.intent.action.VIEW -d "https://beeynow.online/profile"
adb shell am start -a android.intent.action.VIEW -d "adustech://profile"
```

---

## App Configuration

### Already Configured ✅

- ✅ `app.json` - Universal links and App Links configured
- ✅ `hooks/useDeepLinking.ts` - Deep link handler created
- ✅ `app/_layout.tsx` - Hook integrated
- ✅ iOS Associated Domains set
- ✅ Android Intent Filters set

---

## Deep Link Examples in Marketing

### Email Campaign
```html
<a href="https://beeynow.online/event?id=123">
    View Event Details in App
</a>
```

### Push Notification
```json
{
    "title": "New Event Posted!",
    "body": "Check out the latest campus event",
    "data": {
        "url": "https://beeynow.online/event?id=123"
    }
}
```

### Social Media
```
🎉 New event on campus!
Check it out: https://beeynow.online/event?id=123
```

### QR Code
Generate QR codes linking to: `https://beeynow.online/department?id=cs`

---

## Smart App Banners

### iOS Smart Banner
Add to website `<head>`:
```html
<meta name="apple-itunes-app" content="app-id=YOUR_APP_ID">
```

### Android Smart Banner
Add to website:
```html
<link rel="manifest" href="/manifest.json">
```

---

## Troubleshooting

### iOS Links Not Working

1. **Check Team ID**: Make sure `apple-app-site-association` has correct Team ID
2. **Verify HTTPS**: Universal links require HTTPS
3. **Test File**: Ensure file is accessible without authentication
4. **Clear Cache**: Delete app and reinstall
5. **Check Console**: Look for errors in Xcode console

### Android Links Not Working

1. **Verify SHA256**: Make sure fingerprint is correct in `assetlinks.json`
2. **Check autoVerify**: Must be `true` in intent filter
3. **Test URL**: Visit the assetlinks.json URL in browser
4. **Clear Defaults**: Settings → Apps → Adustech Tech → Open by default → Clear
5. **Use ADB**: Test with `adb shell am start` command

### App Scheme Always Works

If universal links fail, the app scheme (`adustech://`) will always work as a fallback (only if app is installed).

---

## Advanced: Dynamic Links

For better tracking and smart redirects, consider using:
- Firebase Dynamic Links
- Branch.io
- Adjust Deep Links

These services provide:
- Click tracking
- Smart fallbacks
- App-to-app linking
- Deferred deep linking (install → open to content)

---

## Security Best Practices

1. **Validate Links**: Always validate deep link parameters in the app
2. **Handle Errors**: Gracefully handle invalid/malformed links
3. **User Privacy**: Don't expose sensitive data in URLs
4. **Rate Limiting**: Prevent abuse of deep link endpoints

---

## Integration Checklist

- [x] Configure app.json with domains
- [x] Create deep link handler hook
- [x] Integrate hook in app layout
- [x] Create apple-app-site-association file
- [x] Create assetlinks.json file
- [ ] Upload files to beeynow.online
- [ ] Replace TEAM_ID in apple-app-site-association
- [ ] Replace SHA256 fingerprint in assetlinks.json
- [ ] Test on real devices
- [ ] Add to marketing materials

---

## Production Deployment

### Before Going Live:

1. **Update Team ID** (iOS)
2. **Update SHA256 Fingerprint** (Android)
3. **Upload files to beeynow.online**
4. **Test on real devices**
5. **Monitor analytics**

### After Deployment:

1. Test all deep link patterns
2. Monitor error logs
3. Update documentation with actual app store links
4. Create QR codes for marketing
5. Train support team on deep linking

---

## Support

For issues or questions:
- Check logs in `useDeepLinking.ts` (console.log statements)
- Test with provided test pages
- Use command line tools for debugging
- Verify files are accessible via HTTPS

---

**Status**: ✅ Deep Linking Configured
**Action Required**: Upload files to beeynow.online and update credentials

Built with ❤️ for Adustech Community
