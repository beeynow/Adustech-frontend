# 🚀 Adustech Tech - Production Build Instructions

## Prerequisites

1. **Install EAS CLI** (Already done ✓)
   ```bash
   npm install -g eas-cli
   ```

2. **Expo Account**
   - Create account at https://expo.dev
   - Login: `eas login`

3. **Configure Project ID**
   - Run: `eas init`
   - This will create a project and update `app.json` with your project ID

## 📱 Building the App

### First Time Setup

```bash
# Login to your Expo account
eas login

# Initialize EAS project (creates project ID)
eas init

# Configure credentials
eas credentials
```

### Build Commands

#### Android APK (For Testing/Internal Distribution)
```bash
eas build --platform android --profile production
```

#### Android App Bundle (For Google Play Store)
```bash
eas build --platform android --profile production-aab
```

#### iOS Build (Requires Apple Developer Account)
```bash
eas build --platform ios --profile production
```

#### Build Both Platforms
```bash
eas build --platform all --profile production
```

### Preview/Development Builds

```bash
# Development build
eas build --platform android --profile development

# Preview build (for testing before production)
eas build --platform android --profile preview
```

## 📋 Build Profiles

### Development
- Internal distribution
- Development client enabled
- Android: APK format
- iOS: Simulator support

### Preview
- Internal distribution
- Release configuration
- Quick testing before production

### Production
- Optimized release build
- Auto-increment version
- Ready for store submission

### Production-AAB
- Android App Bundle format
- Required for Google Play Store
- Smaller download size

## 🔐 Credentials Setup

### Android
1. EAS will automatically generate a keystore for you
2. Or provide your own: `eas credentials`

### iOS (Requires Apple Developer Account)
1. Apple Developer account ($99/year)
2. Certificates and provisioning profiles
3. EAS can manage these automatically

## 📤 Submitting to Stores

### Google Play Store
```bash
# Build AAB
eas build --platform android --profile production-aab

# Submit (configure service account first)
eas submit --platform android
```

### Apple App Store
```bash
# Build for iOS
eas build --platform ios --profile production

# Submit (configure Apple credentials first)
eas submit --platform ios
```

## 🎯 App Configuration

### Current Settings
- **App Name**: Adustech Tech
- **Bundle ID (iOS)**: com.adustech.app
- **Package Name (Android)**: com.adustech.app
- **Version**: 1.0.0
- **Icon**: assets/images/icon.png (385KB PNG)

### Permissions
- Camera
- Photo Library
- Calendar (Read/Write)
- External Storage (Android)

## 🔄 Version Management

### Update Version
Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "1.0.1"
    },
    "android": {
      "versionCode": 2
    }
  }
}
```

### Auto-increment
EAS automatically increments build numbers with `autoIncrement: true`

## 🧪 Testing Builds

### Install Development Build
```bash
# Download and install from EAS dashboard
# Or use QR code from build completion
```

### Internal Testing
1. Build with `preview` profile
2. Share download link with testers
3. Collect feedback

## 📊 Monitoring Builds

### Check Build Status
```bash
eas build:list
```

### View Build Details
```bash
eas build:view [BUILD_ID]
```

### Cancel Build
```bash
eas build:cancel
```

## 🌐 Over-The-Air Updates

### Configure EAS Update
```bash
eas update:configure
```

### Publish Update
```bash
eas update --branch production --message "Bug fixes and improvements"
```

## 🔧 Troubleshooting

### Build Fails
1. Check build logs in EAS dashboard
2. Verify all dependencies are installed
3. Check TypeScript errors: `npx tsc --noEmit`

### Icon Issues
- Icon must be 1024x1024 PNG
- Transparent background recommended
- Use `expo-icon` for generation if needed

### Native Module Issues
- Ensure all native dependencies are compatible with EAS
- Add to `plugins` in app.json if needed

## 📝 Pre-Build Checklist

- [ ] Updated version number
- [ ] Tested on development build
- [ ] All features working
- [ ] Icons and splash screens correct
- [ ] App name and description updated
- [ ] Permissions configured
- [ ] API endpoints set to production
- [ ] Removed debug code
- [ ] Privacy policy and terms updated

## 🎉 First Build Quick Start

```bash
# 1. Login
eas login

# 2. Initialize project
eas init

# 3. Build Android APK
eas build --platform android --profile production

# 4. Download and test
# Check EAS dashboard for download link
```

## 📱 Distribution Options

### Internal Testing
- Use `preview` profile
- Share download links
- No store submission needed

### TestFlight (iOS)
- Build with production profile
- Submit to TestFlight
- Invite testers via email

### Google Play Internal Testing
- Build AAB
- Upload to Play Console
- Create internal testing track

### Public Release
- Complete store submission process
- Follow platform guidelines
- Wait for review approval

## 🆘 Support

- **EAS Documentation**: https://docs.expo.dev/eas/
- **Expo Forums**: https://forums.expo.dev/
- **Expo Discord**: https://discord.gg/expo

## 🎯 Next Steps

1. Run `eas login`
2. Run `eas init` to get your project ID
3. Run `eas build --platform android --profile production`
4. Test the build
5. Submit to stores when ready!

---

**Built with ❤️ for Adustech Community**
