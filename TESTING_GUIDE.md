# 🧪 Complete Authentication Testing Guide

## 🚀 Quick Start

### **Step 1: Start Backend Server**

```bash
cd backend
node app.js
```

✅ Expected output:
```
MongoDB Connected successfully
User collection created successfully
Server running on port 5000
```

### **Step 2: Update Frontend API URL**

Open `adustech/services/api.ts` and update line 4:

**For iOS Simulator:**
```typescript
const API_URL = 'http://localhost:5000/api/auth';
```

**For Android Emulator:**
```typescript
const API_URL = 'http://10.0.2.2:5000/api/auth';
```

**For Physical Device:**
Find your computer's IP:
- Mac/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig` (look for IPv4)

Then use:
```typescript
const API_URL = 'http://YOUR_IP_HERE:5000/api/auth';
// Example: 'http://192.168.1.100:5000/api/auth'
```

### **Step 3: Start Frontend**

```bash
cd adustech
npm start
```

Then press:
- `i` for iOS Simulator
- `a` for Android Emulator
- `w` for Web

---

## 🧪 Complete Test Flow

### **Test 1: New User Registration**

1. **Open app** → See splash screen (2 seconds) → Welcome screen

2. **Click "Create Account"**

3. **Fill registration form:**
   - Name: `John Doe`
   - Email: `john@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
   - Click eye icon to show/hide password ✅

4. **Click "Register"**

5. **Expected Result:**
   - ✅ Success alert: "Registration successful! Please verify your email with OTP."
   - ✅ Redirected to OTP verification screen
   - ✅ Check your email for 6-digit OTP

6. **Common Issues:**
   - ❌ "User already exists" → Use different email
   - ❌ "Passwords do not match" → Check password fields
   - ❌ Network error → Check backend is running
   - ❌ No email received → Check spam folder or backend console

---

### **Test 2: OTP Verification**

1. **On OTP screen:**
   - Email displayed correctly ✅
   - Enter 6-digit OTP from email

2. **Click "Verify OTP"**

3. **Expected Result:**
   - ✅ Success alert: "Email verified successfully! You can now log in."
   - ✅ Redirected to login screen

4. **Test Resend OTP:**
   - Click "Resend" link
   - ✅ New OTP sent to email
   - ✅ Success alert: "OTP has been resent to your email"

5. **Common Issues:**
   - ❌ "Invalid or expired OTP" → OTP expires in 10 minutes
   - ❌ "User already verified" → User is already verified, go to login

---

### **Test 3: User Login**

1. **On Login screen:**
   - Enter email: `john@example.com`
   - Enter password: `password123`
   - Click eye icon to show/hide password ✅

2. **Click "Login"**

3. **Expected Result:**
   - ✅ Success alert: "Login successful!"
   - ✅ Redirected to dashboard
   - ✅ User name and email displayed
   - ✅ Welcome message shown

4. **Common Issues:**
   - ❌ "User not found" → Check email is correct
   - ❌ "Incorrect password" → Check password
   - ❌ "Email not verified" → Complete OTP verification first

---

### **Test 4: Dashboard & Session**

1. **On Dashboard:**
   - ✅ Logo displayed
   - ✅ Welcome message: "Welcome to Dashboard"
   - ✅ Your name displayed
   - ✅ Your email displayed
   - ✅ Feature cards visible
   - ✅ Logout button present

2. **Test Session Persistence:**
   - Close the app completely
   - Reopen the app
   - ✅ Should automatically go to dashboard (session persisted!)

3. **Test Logout:**
   - Click "Logout" button
   - ✅ Confirmation dialog appears
   - Click "Logout" to confirm
   - ✅ Redirected to welcome screen
   - ✅ Session cleared

---

### **Test 5: Dark Mode**

1. **Enable dark mode on your device:**
   - iOS: Settings → Display & Brightness → Dark
   - Android: Settings → Display → Dark theme

2. **Check all screens:**
   - ✅ Welcome screen adapts to dark mode
   - ✅ Login screen adapts
   - ✅ Register screen adapts
   - ✅ OTP screen adapts
   - ✅ Dashboard adapts
   - ✅ All colors are readable

---

### **Test 6: Password Show/Hide**

1. **On Login screen:**
   - Type password
   - ✅ Shows as dots (••••••)
   - Click eye icon 👁️‍🗨️
   - ✅ Password visible
   - Click eye icon again 👁️
   - ✅ Password hidden again

2. **On Register screen:**
   - Type in both password fields
   - ✅ Both have independent show/hide toggles
   - ✅ Each field can be toggled separately

---

### **Test 7: Error Handling**

#### **Registration Errors:**
- Empty fields → ✅ "Please fill in all fields"
- Password mismatch → ✅ "Passwords do not match"
- Short password → ✅ "Password must be at least 6 characters"
- Existing email → ✅ "User already exists"

#### **Login Errors:**
- Empty fields → ✅ "Please fill in all fields"
- Wrong email → ✅ "User not found"
- Wrong password → ✅ "Incorrect password"
- Unverified email → ✅ "Email not verified. Please verify OTP."

#### **OTP Errors:**
- Invalid OTP → ✅ "Invalid or expired OTP"
- Expired OTP → ✅ "Invalid or expired OTP"
- Wrong format → ✅ "Please enter a valid 6-digit OTP"

---

### **Test 8: Network Error Handling**

1. **Stop backend server**

2. **Try any operation:**
   - ✅ Error message displayed
   - ✅ App doesn't crash
   - ✅ User can retry

3. **Restart backend and retry:**
   - ✅ Operation succeeds

---

## 🐛 Troubleshooting

### **Backend Won't Start**

```bash
# Check if port 5000 is in use
lsof -i :5000

# Kill process if needed
kill -9 <PID>

# Check MongoDB connection
# Verify MONGO_URL in backend/config/db.js
```

### **Frontend Can't Connect to Backend**

1. **Check API URL:**
   - Open `adustech/services/api.ts`
   - Verify API_URL matches your setup

2. **Check CORS:**
   - Backend should have CORS enabled ✅
   - Check backend console for CORS errors

3. **Check Network:**
   - Ping backend: `curl http://localhost:5000/api/auth`
   - Both devices on same network (for physical device)

### **OTP Email Not Received**

1. **Check backend console:**
   - Should show email sending attempt

2. **Check spam folder**

3. **Check email credentials:**
   - Verify in `backend/controllers/authController.js`
   - Gmail may require "App Password"

4. **For testing, check backend console:**
   - OTP is logged to console during development

### **Session Not Persisting**

1. **Check AsyncStorage:**
   - Clear app data and try again
   - Check for console errors

2. **Check backend session:**
   - Backend should return user data on login ✅

### **Dark Mode Not Working**

1. **Check device settings:**
   - Dark mode enabled on device

2. **Restart app:**
   - Close completely and reopen

---

## ✅ Final Checklist

Before considering authentication complete, verify:

- ✅ Backend server starts without errors
- ✅ MongoDB connects successfully
- ✅ Registration creates new user
- ✅ OTP email is received
- ✅ OTP verification works
- ✅ OTP resend works
- ✅ Login with correct credentials works
- ✅ Login with wrong credentials shows error
- ✅ Dashboard displays user info
- ✅ Session persists after app restart
- ✅ Logout clears session
- ✅ Dark mode works on all screens
- ✅ Password show/hide works
- ✅ All error messages display correctly
- ✅ Loading indicators show during operations
- ✅ Network errors handled gracefully

---

## 📊 Test Results Template

```
Date: _____________
Tester: _____________

[ ] Registration Flow
[ ] OTP Verification
[ ] OTP Resend
[ ] Login Flow
[ ] Dashboard Display
[ ] Session Persistence
[ ] Logout
[ ] Dark Mode
[ ] Password Toggle
[ ] Error Handling
[ ] Network Error Handling

Issues Found:
1. _______________
2. _______________
3. _______________

Overall Status: PASS / FAIL
```

---

## 🎉 Success!

If all tests pass, your authentication system is:
- ✅ Fully functional
- ✅ Production-ready (with security improvements)
- ✅ User-friendly
- ✅ Error-resistant

**Congratulations!** 🚀
