# 🚀 Render Deployment - CORS Fix

## 🔴 Problem

You're getting CORS errors because:
- Frontend: `https://capstoneproject1-0i0j.onrender.com`
- Backend: `https://capstoneproject2-syb5.onrender.com`
- CORS only allows: `http://localhost:5173`

Backend is blocking frontend requests! ❌

---

## ✅ Solution: Set Environment Variable on Render

### Step 1: Go to Render Backend Dashboard

1. Go to: https://dashboard.render.com
2. Click on your backend service: `capstoneproject2-syb5` (or whatever it's called)
3. Go to **Settings** tab
4. Scroll to **Environment** section

### Step 2: Add CLIENT_ORIGIN Variable

Click "Add Environment Variable":

**Key:** `CLIENT_ORIGIN`  
**Value:** `https://capstoneproject1-0i0j.onrender.com`

(Replace with YOUR actual frontend URL)

### Step 3: Save & Deploy

1. Click **Add**
2. Scroll down and click **Deploy** (or it auto-deploys)
3. Wait for deployment to finish (watch the logs)

---

## 🔍 Find Your Actual URLs

### Frontend URL
Go to https://dashboard.render.com
- Find your frontend service
- Look for **URL** on the top
- Copy it (e.g., `https://capstoneproject1-0i0j.onrender.com`)

### Backend URL
Go to https://dashboard.render.com
- Find your backend service  
- Look for **URL** on the top
- Copy it (e.g., `https://capstoneproject2-syb5.onrender.com`)

---

## 📝 Environment Variables Checklist

Your backend should have these Render environment variables set:

```
✅ DATABASE_URL=postgresql://...
✅ JWT_SECRET=your_secret_key
✅ GOOGLE_CLIENT_ID=your_google_client_id
✅ GOOGLE_CLIENT_SECRET=your_google_secret
✅ CLIENT_ORIGIN=https://capstoneproject1-0i0j.onrender.com
✅ EMAIL_USER=your_email@gmail.com
✅ EMAIL_PASSWORD=your_app_password
✅ NODE_ENV=production
```

**Most important:** `CLIENT_ORIGIN` = your frontend URL

---

## 🧪 Test After Deployment

### Step 1: Wait for Deployment
- Go to your backend service
- Watch the deploy log
- Wait for "Build successful" message

### Step 2: Test Health Endpoint

```bash
curl https://capstoneproject2-syb5.onrender.com/api/health
```

Should return:
```json
{"ok":true,"app":"Asha (आशा)","timestamp":"2024-06-05T..."}
```

### Step 3: Go to Frontend & Test Google Login

1. Open your frontend URL: `https://capstoneproject1-0i0j.onrender.com`
2. Try Google login
3. **Check browser console (F12):**
   - ✅ Should see: `Google decode successful: ...`
   - ✅ Should redirect to home
   - ❌ Should NOT see: CORS error

### Step 4: Check Backend Logs

In Render dashboard:
1. Go to backend service
2. Click **Logs** tab
3. Should see: `User authenticated via Google: ...`

---

## 🔑 Other Required Environment Variables

Make sure you have these set on Render:

### Database
```
DATABASE_URL=postgresql://username:password@host:port/asha
```

### Google OAuth
```
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_SECRET
```

**Important:** Make sure these Google credentials are configured for:
- Authorized JavaScript origins: `https://capstoneproject1-0i0j.onrender.com`
- Authorized redirect URIs: `https://capstoneproject1-0i0j.onrender.com`

### Email (Optional)
```
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=Asha <noreply@asha.np>
```

### Node
```
NODE_ENV=production
PORT=3001
JWT_SECRET=some_very_long_random_secret_key
```

---

## 📊 Full Environment Setup

Here's a template for all variables needed:

```
# Database
DATABASE_URL=postgresql://user:pass@host/asha

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this

# CORS - MOST IMPORTANT!
CLIENT_ORIGIN=https://capstoneproject1-0i0j.onrender.com

# Google OAuth
GOOGLE_CLIENT_ID=928558843358-xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Asha <noreply@asha.np>

# Node
NODE_ENV=production
```

---

## 🚨 Common Issues

### Issue 1: Still Getting CORS Error
- Verify `CLIENT_ORIGIN` is set correctly
- Check it matches your frontend URL exactly (including `https://`)
- Backend must be deployed after changing env var
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)

### Issue 2: Backend Returns 500
- Check `DATABASE_URL` is correct
- Check database is accessible from Render
- Look at backend logs for actual error

### Issue 3: Google Login Fails
- Verify Google Client ID & Secret in env vars
- Check Google Cloud Console has Render URLs authorized
- Restart backend after env changes

### Issue 4: Can't Find My Render URLs
- Go to https://dashboard.render.com
- Click your service
- Look at the top of the page
- Copy the URL shown there

---

## 🔐 Google Cloud Console Setup for Production

Make sure Google OAuth is configured for production URLs:

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Go to: APIs & Services → Credentials
4. Edit your OAuth 2.0 Client ID
5. Add to "Authorized JavaScript origins":
   - `https://capstoneproject1-0i0j.onrender.com`
   - `https://capstoneproject1-0i0j.onrender.com/login`
6. Add to "Authorized redirect URIs":
   - `https://capstoneproject1-0i0j.onrender.com`
   - `https://capstoneproject1-0i0j.onrender.com/home`
7. Save

---

## ✅ Deployment Checklist

- [ ] Backend service deployed to Render
- [ ] Frontend service deployed to Render
- [ ] `CLIENT_ORIGIN` env var set on backend
- [ ] `DATABASE_URL` env var set on backend
- [ ] `GOOGLE_CLIENT_ID` env var set on backend
- [ ] `GOOGLE_CLIENT_SECRET` env var set on backend
- [ ] Google Cloud Console has Render URLs authorized
- [ ] Backend deployed after env changes
- [ ] Health check endpoint returns 200
- [ ] Google login works on frontend
- [ ] No CORS errors in browser console
- [ ] Backend logs show successful authentication

---

## 🎯 Quick Recap

**The error happens because:**
Backend doesn't know what frontend URL is allowed.

**The fix:**
Set `CLIENT_ORIGIN` env var to your frontend URL on Render.

**Time to fix:** 2 minutes

---

## 📞 Still Not Working?

Check these in order:

1. **Is backend deployed?**
   - Go to Render dashboard
   - Check status is "Live"

2. **Is env var set?**
   - Go to Settings → Environment
   - Look for `CLIENT_ORIGIN`
   - Is it your correct frontend URL?

3. **Did you deploy after setting env var?**
   - Set env var
   - Click Deploy
   - Wait for "Deploy successful"

4. **What's the actual error?**
   - Open browser console (F12)
   - Look for actual error message
   - Share it for more specific help

---

**After setting `CLIENT_ORIGIN`, everything will work!** ✨

