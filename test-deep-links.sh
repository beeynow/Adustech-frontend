#!/bin/bash

# Deep Link Testing Script for Adustech Tech
# This script helps test deep links on Android devices/emulators

echo "🔗 Adustech Tech - Deep Link Testing Script"
echo "============================================="
echo ""

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo "❌ ADB not found. Please install Android SDK Platform Tools."
    exit 1
fi

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No Android device/emulator detected."
    echo "   Please connect a device or start an emulator."
    exit 1
fi

echo "✅ Android device detected"
echo ""

# Test function
test_link() {
    local url=$1
    local description=$2
    echo "Testing: $description"
    echo "URL: $url"
    adb shell am start -a android.intent.action.VIEW -d "$url" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Link sent successfully"
    else
        echo "❌ Failed to send link"
    fi
    echo ""
    sleep 2
}

echo "🧪 Starting Deep Link Tests..."
echo ""

# Universal Links Tests
echo "=== Testing Universal Links (HTTPS) ==="
echo ""

test_link "https://beeynow.online/" "Home/Dashboard"
test_link "https://beeynow.online/profile" "Profile Page"
test_link "https://beeynow.online/events" "Events List"
test_link "https://beeynow.online/event?id=123" "Specific Event"
test_link "https://beeynow.online/post?id=456" "Specific Post"
test_link "https://beeynow.online/channel?id=789" "Specific Channel"
test_link "https://beeynow.online/department?id=101" "Department Page"

# App Scheme Tests
echo "=== Testing App Scheme Links ==="
echo ""

test_link "adustech://dashboard" "Dashboard (scheme)"
test_link "adustech://profile" "Profile (scheme)"
test_link "adustech://events" "Events (scheme)"

echo "✅ All tests completed!"
echo ""
echo "📋 What to check:"
echo "   • Did the app open automatically?"
echo "   • Did it navigate to the correct screen?"
echo "   • If app didn't open, check device settings"
echo ""
echo "🔧 Troubleshooting:"
echo "   • Clear app defaults: Settings → Apps → Adustech Tech → Open by default → Clear"
echo "   • Reinstall the app"
echo "   • Check that assetlinks.json is uploaded to website"
echo ""
