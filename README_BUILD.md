# 🚀 Adustech Tech - Production Build Guide

## Quick Start (3 Commands)

```bash
# 1. Login
eas login

# 2. Initialize
eas init

# 3. Build
eas build --platform android --profile production
```

That's it! Your production APK will be ready in ~15 minutes.

---

## What's Configured?

✅ **App Information**
- Name: **Adustech Tech**
- Bundle ID: `com.adustech.app`
- Version: 1.0.0
- Icon: 1024x1024 PNG (Ready ✓)

✅ **Build Profiles**
- `development` - For testing with dev client
- `preview` - Internal testing before production
- `production` - Optimized release build (APK)
- `production-aab` - Google Play Store ready (AAB)

✅ **Permissions**
- Camera (for profile photos)
- Photo Library (for uploads)
- Calendar (for events)
- Storage (Android)

✅ **Features**
- Toast notifications with emojis 🎉
- Modern animated tabs
- Department channels system
- Dark mode support
- Full authentication flow

---

## Build Commands

### Android APK (Testing/Distribution)
```bash
eas build --platform android --profile production
```
Download link will appear in terminal after ~15 minutes.

### Android AAB (Google Play Store)
```bash
eas build --platform android --profile production-aab
```
Use this for Play Store submission.

### iOS (Requires Apple Developer Account)
```bash
eas build --platform ios --profile production
```
Requires $99/year Apple Developer Program membership.

### Both Platforms
```bash
eas build --platform all --profile production
```

---

## First Time Setup

### 1. Create Expo Account
Visit: https://expo.dev and sign up (free)

### 2. Login
```bash
eas login
```

### 3. Initialize Project
```bash
cd adustech
eas init
```
This creates your project on Expo and adds the project ID to `app.json`.

---

## Testing Your Build

1. **Wait for build to complete** (~15 minutes)
2. **Download APK** from the link in terminal
3. **Transfer to Android device** via USB or cloud
4. **Install APK** (enable "Install from unknown sources")
5. **Test all features**:
   - Login/Registration
   - Profile editing
   - Creating posts
   - Uploading images
   - Channels
   - Events
   - Timetables
   - Dark mode

---

## Viewing Your Builds

### In Terminal
```bash
eas build:list
```

### In Browser
Visit: https://expo.dev
→ Projects → adustech-tech → Builds

---

## Store Submission

### Google Play Store

1. **Build AAB**:
   ```bash
   eas build --platform android --profile production-aab
   ```

2. **Create Play Console Account** ($25 one-time fee)
   - Visit: https://play.google.com/console

3. **Create App Listing**
   - Add screenshots
   - Write description
   - Add privacy policy

4. **Upload AAB**
   - Go to Production → Create new release
   - Upload your AAB file
   - Submit for review

### Apple App Store

1. **Enroll in Apple Developer Program** ($99/year)
   - Visit: https://developer.apple.com

2. **Build IPA**:
   ```bash
   eas build --platform ios --profile production
   ```

3. **Create App in App Store Connect**
   - Add screenshots
   - Write description
   - Add privacy policy

4. **Submit for Review**
   - TestFlight first (recommended)
   - Then production release

---

## Environment Variables

**⚠️ IMPORTANT**: Update API URL before production build!

Edit `adustech/services/config.ts`:

```typescript
// Development
export const API_URL = 'http://localhost:5000/api';

// Production
export const API_URL = 'https://your-production-api.com/api';
```

---

## Troubleshooting

### Build Fails
1. Check logs in EAS dashboard
2. Run: `npx expo-doctor`
3. Verify all dependencies: `npm list`

### Can't Login to EAS
1. Create account at https://expo.dev
2. Verify email
3. Try: `eas logout` then `eas login`

### Icon Issues
Icon is already configured at `assets/images/icon.png` (385KB, ready for use)

### Version Issues
Update in `app.json`:
```json
{
  "expo": {
    "version": "1.0.1"
  }
}
```

---

## Pre-Build Checklist

- [ ] Updated API URL to production
- [ ] Tested app locally
- [ ] All features working
- [ ] Privacy policy ready
- [ ] Screenshots prepared
- [ ] Store descriptions written

---

## Build Monitoring

### Check Status
```bash
eas build:view [BUILD_ID]
```

### Cancel Build
```bash
eas build:cancel
```

### Build Logs
Available in EAS dashboard with detailed error messages

---

## Cost Breakdown

### Free
- Development builds
- Preview builds
- EAS Build (limited free tier)

### Paid
- Google Play: $25 one-time
- Apple Developer: $99/year
- EAS Build Pro: $29/month (unlimited builds)

---

## Support

- **Documentation**: BUILD_INSTRUCTIONS.md
- **Checklist**: PRODUCTION_CHECKLIST.md
- **Quick Guide**: QUICK_START_EAS_BUILD.md
- **Expo Docs**: https://docs.expo.dev/eas/
- **Community**: https://forums.expo.dev/

---

## Next Steps

1. ✅ Configuration complete
2. 🔄 Run `eas login`
3. 🔄 Run `eas init`
4. 🚀 Run `eas build --platform android --profile production`
5. 📱 Test your APK
6. 🏪 Submit to stores

---

**Built with ❤️ for Adustech Community**

**Status**: ✅ Production Ready
**Last Updated**: 2026-02-02
