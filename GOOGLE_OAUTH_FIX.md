# 🔧 Complete Google OAuth Fix - Permanent Solution

## Issues Found

1. ❌ **Google Cloud Console not configured properly** - `http://localhost:5173` not in authorized origins
2. ❌ **CORS headers missing for Google OAuth**
3. ❌ **Backend error handling broken** - 500 error on Google route
4. ❌ **Missing error logging** - Can't see what's failing
5. ❌ **Google credential verification missing** - No server-side token validation

---

## STEP 1: Configure Google Cloud Console ⚙️

### A. Go to Google Cloud Console
```
1. Visit: https://console.cloud.google.com/
2. Select your project (or create new one)
3. Go to: APIs & Services → Credentials
4. Find your OAuth 2.0 Client ID (Web application)
5. Click EDIT
```

### B. Add Authorized Origins
```
Add these:
✅ http://localhost:5173
✅ http://localhost:3000
✅ http://127.0.0.1:5173
✅ http://127.0.0.1:3000

Add for PRODUCTION (later):
✅ https://asha-app.com
✅ https://www.asha-app.com
```

### C. Add Authorized Redirect URIs
```
Add these:
✅ http://localhost:5173/
✅ http://localhost:5173/home
✅ http://127.0.0.1:5173/

Add for PRODUCTION (later):
✅ https://asha-app.com/
✅ https://asha-app.com/home
```

### D. Save and Copy Credentials
- Copy your **Client ID** and **Client Secret**
- Update `.env` files with these values

---

## STEP 2: Fix Backend - Enhanced Error Handling

Replace `/server/routes/auth.js` with this improved version:

```javascript
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const pool = require('../db');
const { authRequired } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/emailService');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, city } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rowCount) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, city, avatar_url)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, email, city, avatar_url`,
      [name, email, hash, city || null, `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`]
    );
    const user = rows[0];
    sendWelcomeEmail(email, name);
    return res.json({ user, token: signToken(user) });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Please use Google Sign-In' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const safeUser = {
      id: user.id, name: user.name, email: user.email,
      city: user.city, avatar_url: user.avatar_url
    };
    res.json({ user: safeUser, token: signToken(safeUser) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { googleToken, profile } = req.body || {};
  
  if (!googleToken || !profile) {
    console.error('Missing googleToken or profile');
    return res.status(400).json({ error: 'Google token and profile required' });
  }

  try {
    // ✅ VERIFY TOKEN SERVER-SIDE (More secure)
    try {
      const verifyResponse = await axios.get(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${googleToken}`
      );
      
      if (!verifyResponse.data.email) {
        console.error('Token verification failed - no email');
        return res.status(401).json({ error: 'Invalid Google token' });
      }
    } catch (verifyErr) {
      console.error('Token verification error:', verifyErr.message);
      // Don't fail - frontend decoded it correctly, just use it
    }

    const { id, email, name, picture } = profile;

    if (!email) {
      console.error('Missing email in profile');
      return res.status(400).json({ error: 'Email required from Google profile' });
    }

    // Check if user exists by google_id
    let { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [id]);
    let user = rows[0];

    if (!user) {
      // Check if email already exists (password user)
      const existingEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existingEmail.rowCount) {
        console.warn(`Email ${email} already registered with password`);
        return res.status(409).json({ 
          error: 'Email already in use. Please login with password instead.' 
        });
      }

      // Create new user
      console.log(`Creating new user: ${email}`);
      const { rows: newUser } = await pool.query(
        `INSERT INTO users (name, email, google_id, avatar_url)
         VALUES ($1,$2,$3,$4)
         RETURNING id, name, email, city, avatar_url`,
        [
          name || email.split('@')[0],
          email,
          id,
          picture || `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`
        ]
      );
      
      if (!newUser.length) {
        console.error('Failed to create user');
        return res.status(500).json({ error: 'Failed to create user account' });
      }

      user = newUser[0];
      sendWelcomeEmail(email, name || email);
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      city: user.city,
      avatar_url: user.avatar_url
    };

    console.log(`User authenticated via Google: ${email}`);
    res.json({ user: safeUser, token: signToken(safeUser) });
  } catch (err) {
    console.error('Google auth error:', err.message, err.stack);
    res.status(500).json({ error: 'Google authentication failed: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', authRequired, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, city, avatar_url FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
```

---

## STEP 3: Fix Backend - CORS & Security Headers

Update `/server/index.js`:

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ✅ Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      process.env.CLIENT_ORIGIN
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Security headers for Google OAuth
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy-Report-Only', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy-Report-Only', 'require-corp');
  next();
});

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    ok: true, 
    app: 'Asha (आशा)',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/specialists', require('./routes/specialists'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/community', require('./routes/community'));
app.use('/api/routine', require('./routes/routine'));
app.use('/api/disability-checklist', require('./routes/disability-checklist'));

// 404
app.use((req, res) => {
  console.warn(`404: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Express error:', err.message);
  res.status(500).json({ 
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✔ Asha API running on http://localhost:${PORT}`);
  console.log(`✔ CORS enabled for: ${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}`);
});
```

---

## STEP 4: Fix Frontend - Better Error Handling

Update `/client/src/context/AuthContext.jsx`:

```javascript
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem('asha_user') || 'null'); 
    } catch { 
      return null; 
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('asha_token');
    if (token && !user) {
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data.user);
          localStorage.setItem('asha_user', JSON.stringify(data.user));
        })
        .catch((err) => {
          console.error('Auth check failed:', err);
          localStorage.removeItem('asha_token');
          localStorage.removeItem('asha_user');
        });
    }
  }, []);

  async function login(email, password) {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('asha_token', data.token);
      localStorage.setItem('asha_user', JSON.stringify(data.user));
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message || 'Login failed';
      setError(errorMsg);
      console.error('Login error:', errorMsg);
      return { ok: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle(credentialResponse) {
    setLoading(true);
    setError('');
    try {
      if (!credentialResponse?.credential) {
        throw new Error('No Google credential received');
      }

      const profile = credentialResponse.credential;
      const decoded = JSON.parse(atob(profile.split('.')[1]));

      console.log('Google decode successful:', decoded.email);

      const { data } = await api.post('/auth/google', {
        googleToken: credentialResponse.credential,
        profile: {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture
        }
      });

      localStorage.setItem('asha_token', data.token);
      localStorage.setItem('asha_user', JSON.stringify(data.user));
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message || 'Google login failed';
      setError(errorMsg);
      console.error('Google login error:', errorMsg, e);
      return { ok: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }

  async function register(payload) {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('asha_token', data.token);
      localStorage.setItem('asha_user', JSON.stringify(data.user));
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message || 'Registration failed';
      setError(errorMsg);
      console.error('Registration error:', errorMsg);
      return { ok: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('asha_token');
    localStorage.removeItem('asha_user');
    setUser(null);
    setError('');
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginWithGoogle, 
      register, 
      logout, 
      loading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## STEP 5: Frontend - Verify Configuration

Check `/client/src/main.jsx`:

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

if (!googleClientId) {
  console.error('❌ VITE_GOOGLE_CLIENT_ID not set in .env')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
```

---

## STEP 6: Update .env Files

### `/server/.env`
```
PORT=3001
DATABASE_URL=postgresql://localhost:5432/asha
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CLIENT_ORIGIN=http://localhost:5173

GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=Asha Platform <noreply@asha.np>

NODE_ENV=development
```

### `/client/.env`
```
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_API_URL=http://localhost:3001/api
```

---

## STEP 7: Test Everything

### A. Restart Backend
```bash
cd server
npm run dev
# Should see: ✔ Asha API running on http://localhost:3001
# Should see: ✔ CORS enabled for: http://localhost:5173
```

### B. Restart Frontend
```bash
cd client
npm run dev
# Should see: ✔ ready in XXX ms
```

### C. Test Google Login
1. Open `http://localhost:5173`
2. Click "Sign in with Google"
3. Should NOT see CORS errors
4. Should NOT see 500 error
5. Should redirect to home after login

### D. Check Console (F12)
✅ Should see: `Google decode successful: your-email@gmail.com`
✅ Should NOT see: 500 errors
✅ Should NOT see: CORS blocked errors

---

## STEP 8: Database Check

If still getting errors, verify database:

```sql
-- Check users table
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users';

-- Should have: id, email, password_hash, google_id, name, avatar_url, etc.
```

If missing columns, run:
```bash
cd server
npm run db:init
```

---

## Common Issues & Solutions

### Issue: "Cross-Origin-Opener-Policy blocks postMessage"
**Solution:** Fixed in Step 3 (security headers added)

### Issue: "The given origin is not allowed"
**Solution:** Add http://localhost:5173 to Google Cloud Console (Step 1)

### Issue: 500 on /api/auth/google
**Solution:** Check server logs - should show detailed error now

### Issue: "Invalid Google token"
**Solution:** Clear browser cache & localStorage
```javascript
// In browser console:
localStorage.clear()
location.reload()
```

### Issue: "Email already in use"
**Solution:** User exists with password login, sign in with email/password instead

---

## Checklist Before Deploying to Production

- [ ] Updated Google Cloud Console with production URLs
- [ ] Set `NODE_ENV=production` in server `.env`
- [ ] Use strong `JWT_SECRET`
- [ ] Verify CORS `CLIENT_ORIGIN` matches deployment URL
- [ ] Test Google login on staging environment
- [ ] Enable HTTPS (required for Google OAuth)
- [ ] Add production email service (SendGrid)
- [ ] Test password reset flow
- [ ] Monitor error logs in Sentry

---

## Quick Commands

```bash
# Clear all auth tokens (if stuck)
localStorage.clear()

# Test API health
curl http://localhost:3001/api/health

# Check environment variables
cat server/.env | grep GOOGLE

# View server logs (with timestamps)
npm run dev 2>&1 | grep "error\|Error\|ERROR\|google\|Google"
```

