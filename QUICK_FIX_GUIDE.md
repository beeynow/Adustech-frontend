# 🚨 Quick Fix Guide - Registration Failed

## Issue: "Registration Failed. Please try again"

This means the frontend can't communicate with the backend. Here's how to fix it:

---

## ✅ Solution (Follow in Order)

### **Step 1: Start Backend** ⭐ MOST IMPORTANT

```bash
cd backend
node app.js
```

**Expected output:**
```
MongoDB Connected successfully
User collection created successfully
Server running on port 5000
```

If you don't see this, backend is NOT running!

---

### **Step 2: Find Your Device Type**

**Are you testing on:**
- [ ] iOS Simulator (on Mac)
- [ ] Android Emulator (on computer)
- [ ] Physical iPhone/Android (real device)
- [ ] Web Browser

---

### **Step 3: Update API URL**

Open `adustech/services/config.ts`

Find line 10-20 and update based on your device:

#### **For iOS Simulator:**
```typescript
export const getApiUrl = () => {
  return 'http://localhost:5000/api/auth';
};
```

#### **For Android Emulator:**
```typescript
export const getApiUrl = () => {
  return 'http://10.0.2.2:5000/api/auth';
};
```

#### **For Physical Device:**
First, find your computer's IP:

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

Look for something like `192.168.x.x` or `10.0.x.x`

Then update:
```typescript
export const getApiUrl = () => {
  return 'http://192.168.1.100:5000/api/auth'; // Use YOUR IP here
};
```

#### **For Web Browser:**
```typescript
export const getApiUrl = () => {
  return 'http://localhost:5000/api/auth';
};
```

---

### **Step 4: Restart Frontend**

After updating the API URL:

1. Stop the app (Ctrl+C in terminal)
2. Restart:
```bash
npm start
```
3. Press `r` to reload when app opens

---

### **Step 5: Test Again**

1. Go to Register screen
2. Fill in the form
3. Click Register

**Watch the terminal!** You should see:
```
🌐 API URL configured: http://...
📤 POST http://...../register
```

---

## 🔍 Still Not Working?

### **Run Diagnostics:**

```bash
cd adustech
node diagnostics.js
```

This will tell you exactly what's wrong!

---

## 📊 Common Error Messages

| Error Message | What It Means | How to Fix |
|--------------|---------------|------------|
| "Network Error" | Can't reach backend | Check API URL in config.ts |
| "Request timeout" | Backend not responding | Make sure backend is running |
| "User already exists" | Email already used | Use different email |
| "All fields required" | Missing form data | Fill all fields |

---

## 🎯 Quick Checklist

Before trying again:

- [ ] Backend is running (`node app.js`)
- [ ] See "Server running on port 5000" message
- [ ] Updated `config.ts` with correct API URL
- [ ] Restarted frontend app
- [ ] Pressed `r` to reload app

---

## 📱 Device-Specific Notes

### **Physical Device:**
- ⚠️ Device and computer MUST be on same WiFi
- ⚠️ Use computer's IP address (not localhost)
- ⚠️ Some routers block device-to-device communication

### **Android Emulator:**
- ⚠️ ALWAYS use `10.0.2.2` (not localhost)
- ⚠️ `localhost` from emulator = emulator's own localhost

### **iOS Simulator:**
- ✅ Can use `localhost` (shares Mac's network)

---

## 🧪 Quick Backend Test

Open a new terminal and run:

```bash
curl http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'
```

**Expected response:**
```json
{"message":"User registered. Please verify OTP sent to email."}
```

If this works but app doesn't, it's an API URL issue!

---

## 💡 Pro Tip

Add this to see detailed logs:

When you open the app, check the terminal for:
```
🌐 API URL configured: http://YOUR_URL
```

This shows what URL the app is actually using!

---

## 🆘 Still Need Help?

Share these details:
1. What device are you testing on? (iOS Sim / Android Emu / Physical)
2. What does `config.ts` say? (the API URL)
3. Is backend running? (copy/paste the output)
4. What error shows in terminal? (copy/paste)

---

## ✅ Success Looks Like:

**Backend Terminal:**
```
📝 Registration attempt: { name: 'John', email: 'john@test.com' }
✅ User saved to database
📧 OTP generated: 123456
✅ Email sent successfully
```

**Frontend Terminal:**
```
📤 POST http://localhost:5000/api/auth/register
✅ /register - Status: 201
Registration response: { message: 'User registered...' }
```

**App Alert:**
```
Success
Registration successful! Please verify your email with OTP.
```
