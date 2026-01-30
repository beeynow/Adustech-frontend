# 🔧 Connection Testing Guide

## Step 1: Check Backend is Running

Open terminal and run:
```bash
cd backend
node app.js
```

Expected output:
```
MongoDB Connected successfully
User collection created successfully
Server running on port 5000
```

## Step 2: Test Backend Connection

Open a NEW terminal and test the backend:

```bash
# Test if backend is responding
curl http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"123456"}'
```

Expected response (should contain):
```json
{"message":"User registered. Please verify OTP sent to email."}
```

## Step 3: Find Your IP Address

### Mac/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Windows:
```bash
ipconfig
```

Look for IPv4 Address (something like 192.168.x.x)

## Step 4: Update Frontend Configuration

Open `adustech/services/config.ts` and update line 7-18:

### For iOS Simulator:
```typescript
return 'http://localhost:5000/api/auth';
```

### For Android Emulator:
```typescript
return 'http://10.0.2.2:5000/api/auth';
```

### For Physical Device:
```typescript
return 'http://YOUR_IP_HERE:5000/api/auth';
// Example: return 'http://192.168.1.100:5000/api/auth';
```

### For Web:
```typescript
return 'http://localhost:5000/api/auth';
```

## Step 5: Check Logs in App

When you try to register, check the terminal where you ran `npm start`.

Look for these logs:
```
🌐 API URL configured: http://...
📤 POST http://...../register
```

### If you see:
- ✅ `✅ /register - Status: 201` → Registration successful!
- ❌ `❌ Network Error` → API URL is wrong
- ❌ `❌ Request timeout` → Backend not running
- ❌ `❌ /register - 400` → Validation error (check backend logs)
- ❌ `❌ /register - 500` → Backend error (check backend logs)

## Step 6: Common Issues & Fixes

### Issue: "Network Error"
**Cause:** Frontend can't reach backend
**Fix:** 
1. Check API URL in `config.ts`
2. Make sure backend is running
3. For physical device, use your computer's IP address
4. Make sure phone/computer are on same WiFi network

### Issue: "Request timeout"
**Cause:** Backend not responding
**Fix:**
1. Check if backend is running: `node app.js`
2. Check if port 5000 is available
3. Try restarting backend

### Issue: "User already exists"
**Cause:** Email already registered
**Fix:**
1. Use a different email
2. Or delete user from MongoDB

### Issue: "Error registering user"
**Cause:** Backend error
**Fix:**
1. Check backend terminal for error details
2. Check MongoDB is connected
3. Check email credentials

## Step 7: Live Debugging

When you try to register, watch BOTH terminals:

**Backend Terminal** should show:
```
📝 Registration attempt: { name: 'Test', email: 'test@test.com' }
✅ User saved to database
📧 OTP generated: 123456 (for testing)
✅ Email sent successfully
```

**Frontend Terminal** should show:
```
🌐 API URL configured: http://localhost:5000/api/auth
📤 POST http://localhost:5000/api/auth/register
Attempting registration... { name: 'Test', email: 'test@test.com' }
✅ /register - Status: 201
Registration response: { message: '...' }
```

## Quick Fix Commands

### Kill process on port 5000:
```bash
lsof -ti:5000 | xargs kill -9
```

### Check what's running on port 5000:
```bash
lsof -i :5000
```

### Test backend from frontend device:
```bash
# Replace with your IP
curl http://YOUR_IP:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'
```

## Success Checklist

- [ ] Backend shows "Server running on port 5000"
- [ ] curl test returns success message
- [ ] API URL updated in config.ts
- [ ] Frontend logs show correct API URL
- [ ] Frontend can reach backend
- [ ] Registration creates user in database
- [ ] OTP appears in backend logs
