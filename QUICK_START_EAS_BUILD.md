# 🚀 Quick Start: Build Your App in 5 Minutes

## Step 1: Login to Expo (30 seconds)
```bash
eas login
```
- Enter your Expo account credentials
- If you don't have one, sign up at https://expo.dev

## Step 2: Initialize EAS Project (1 minute)
```bash
cd adustech
eas init
```
- This creates a project on Expo servers
- Automatically updates `app.json` with your project ID
- Choose "Yes" if asked to create a new project

## Step 3: Build Android APK (15-20 minutes)
```bash
eas build --platform android --profile production
```
- EAS will build your app on their servers
- You'll get a download link when complete
- First build takes ~15-20 minutes

## Step 4: Download and Test
- Check your terminal for the download link
- Or visit: https://expo.dev
- Download APK to your Android device
- Install and test!

## 🎯 That's it! Your app is ready!

---

## Alternative: Build for iOS
```bash
eas build --platform ios --profile production
```
**Note**: Requires Apple Developer Account ($99/year)

---

## Build Both Platforms
```bash
eas build --platform all --profile production
```

---

## View Your Builds
```bash
eas build:list
```
Or visit: https://expo.dev/accounts/[your-account]/projects/adustech-tech/builds

---

## 🎉 Success Indicators
- ✅ Build status: "Finished"
- ✅ Download link available
- ✅ APK installs without errors
- ✅ App launches successfully
- ✅ All features working

---

## 🆘 Troubleshooting

### Build fails?
1. Check build logs in terminal
2. Visit EAS dashboard for details
3. Run: `npx expo-doctor` to check config

### Need help?
- Check: BUILD_INSTRUCTIONS.md
- Check: PRODUCTION_CHECKLIST.md
- Expo Docs: https://docs.expo.dev/eas/

---

**Current Configuration:**
- App Name: Adustech Tech
- Version: 1.0.0
- Bundle ID: com.adustech.app
- Icon: ✅ Configured (1024x1024 PNG)
- EAS Config: ✅ Ready
