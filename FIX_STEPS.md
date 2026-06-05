# 🔧 Google OAuth Fix - Step-by-Step (5 Minutes)

## ⚡ Quick Fix Applied to Your Code

I've already updated these files with proper error handling and logging:
- ✅ `/server/routes/auth.js` - Better error messages & logging
- ✅ `/server/index.js` - CORS & security headers fixed
- ✅ `/client/src/context/AuthContext.jsx` - Improved error handling

## 📋 What You Need to Do

### STEP 1: Update Google Cloud Console (2 min)
```
1. Go to: https://console.cloud.google.com/
2. Navigate to: APIs & Services → Credentials
3. Click your OAuth 2.0 Client ID (Web application)
4. Under "Authorized JavaScript origins", ADD:
   ✅ http://localhost:5173
   ✅ http://127.0.0.1:5173

5. Under "Authorized redirect URIs", ADD:
   ✅ http://localhost:5173
   ✅ http://localhost:5173/home

6. Click SAVE
7. Copy your Client ID and Secret
```

### STEP 2: Update Environment Variables (1 min)

Update `/server/.env`:
```env
PORT=3001
DATABASE_URL=postgresql://localhost:5432/asha
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CLIENT_ORIGIN=http://localhost:5173

GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_ACTUAL_SECRET

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=Asha Platform <noreply@asha.np>

NODE_ENV=development
```

Update `/client/.env`:
```env
VITE_GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID
VITE_API_URL=http://localhost:3001/api
```

### STEP 3: Restart Services (1 min)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

Should see:
```
✔ Asha API running on http://localhost:3001
✔ CORS enabled for: http://localhost:5173
✔ Environment: development
```

**Terminal 2 - Frontend (new terminal):**
```bash
cd client
npm run dev
```

Should see:
```
✔ ready in XXX ms
```

### STEP 4: Test Google Login (1 min)

1. Open http://localhost:5173 in browser
2. Click "Sign in with Google" button
3. Choose your Google account
4. **Check browser console (F12):**
   - ✅ Should see: `Google decode successful: your-email@...`
   - ❌ Should NOT see: CORS errors
   - ❌ Should NOT see: 500 errors

5. Should redirect to `/home` successfully

---

## ✅ If It Works

You should see in browser console:
```
Google decode successful: john@example.com
```

And in server logs:
```
User authenticated via Google: john@example.com
```

---

## ❌ If Still Getting Errors

### Error 1: "The given origin is not allowed"
**Fix:** Restart frontend after updating Google Cloud Console
```bash
# In client terminal, stop with Ctrl+C then:
npm run dev
```

### Error 2: "Failed to load resource: 500 (Internal Server Error)"
**Check:** Open browser console (F12 > Network tab)
- Click on the failed request
- Look at "Response" tab for error message
- Copy error and check server logs

### Error 3: "CORS blocked"
**Verify:** Check that `CLIENT_ORIGIN=http://localhost:5173` is in `/server/.env`
- Restart backend after updating

### Error 4: Database Error
**Run:**
```bash
cd server
npm run db:init
```

---

## 🔍 Debugging Checklist

- [ ] Google Cloud Console has `http://localhost:5173` in authorized origins
- [ ] Google Cloud Console has `http://localhost:5173` in redirect URIs
- [ ] `.env` files have correct Google credentials
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] No "localhost:5000" (wrong port) in URLs
- [ ] Browser console shows no CORS errors
- [ ] Server console shows `CORS enabled for: http://localhost:5173`

---

## 📞 Quick Test Commands

```bash
# Test backend health
curl http://localhost:3001/api/health

# Test if backend running
lsof -i :3001

# Test if frontend running
lsof -i :5173

# Check environment variables
cat server/.env | grep GOOGLE

# Clear browser cache & tokens
# In browser console (F12):
localStorage.clear()
location.reload()
```

---

## 🎯 Success Signs

✅ **In Browser Console (F12):**
- No red errors
- See "Google decode successful: ..."
- See your user email

✅ **In Server Console:**
- See "Creating new user: ..." (first time)
- See "User authenticated via Google: ..."
- No 500 errors

✅ **In App:**
- Redirects to `/home` after Google login
- See your name/email in profile

---

## 🚀 After Fix Works

1. Test password login as well
2. Test logout & login again
3. Test refresh page - should stay logged in
4. Test register new account

---

## 💾 Files Modified

```
server/routes/auth.js
  ✓ Better error messages
  ✓ Better logging
  ✓ Input validation

server/index.js
  ✓ Enhanced CORS
  ✓ Security headers
  ✓ Better error handler
  ✓ Improved logging

client/src/context/AuthContext.jsx
  ✓ Better error handling
  ✓ Console logging
  ✓ Detailed error messages
```

---

## Still Need Help?

Open browser DevTools (F12) and:
1. Go to Console tab
2. Look for any red errors
3. Take screenshot
4. Check Network tab:
   - Click the failed request
   - Go to Response tab
   - Copy the error message

These will show exactly what's wrong!

