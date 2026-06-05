# ⚡ Admin Module - Quick Setup (10 minutes)

## What's New?

Complete admin dashboard for:
- 👨‍⚕️ Therapist verification
- 🚫 Content moderation
- 💬 Forum moderation  
- 👥 User management

---

## 📋 Files Added (Don't Edit Existing!)

### Backend
```
✅ server/middleware/adminAuth.js        (Admin auth middleware)
✅ server/routes/admin.js                (All admin endpoints)
✅ server/scripts/initAdminDb.js         (Database setup)
```

### Frontend
```
✅ client/src/context/AdminContext.jsx   (Admin state management)
✅ client/src/pages/AdminDashboard.jsx   (Admin dashboard)
✅ client/src/pages/AdminTherapists.jsx  (Therapist verification)
✅ client/src/pages/AdminContent.jsx     (Post moderation)
✅ client/src/pages/AdminForum.jsx       (Comment moderation)
✅ client/src/pages/AdminUsers.jsx       (User management)
```

---

## ✅ Step 1: Initialize Database (2 min)

```bash
cd server
node scripts/initAdminDb.js
```

**Expected output:**
```
✔ admin_users table created
✔ deleted_content table created
✔ admin_activity table created
✔ Added flagged column to posts table
... more columns ...
✔ Admin Database initialized successfully!
```

---

## ✅ Step 2: Make Yourself Admin (2 min)

Get your user ID first:
```sql
-- Login to PostgreSQL
psql asha

-- Find your user ID
SELECT id, email FROM users LIMIT 10;

-- Make yourself admin (replace 1 with your user_id)
INSERT INTO admin_users (user_id, role, permissions)
VALUES (1, 'admin', '{"therapist_verify": true, "content_moderate": true, "user_manage": true}');

-- Verify
SELECT * FROM admin_users;
```

Exit: `\q`

---

## ✅ Step 3: Add Admin Routes to Frontend (3 min)

Edit `/client/src/App.jsx` and add these imports at top:

```jsx
import AdminDashboard from './pages/AdminDashboard';
import AdminTherapists from './pages/AdminTherapists';
import AdminContent from './pages/AdminContent';
import AdminForum from './pages/AdminForum';
import AdminUsers from './pages/AdminUsers';
```

Then find your routes section and add these routes:

```jsx
{/* Admin Routes */}
<Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
<Route path="/admin/therapists" element={<ProtectedRoute><AdminTherapists /></ProtectedRoute>} />
<Route path="/admin/content" element={<ProtectedRoute><AdminContent /></ProtectedRoute>} />
<Route path="/admin/forum" element={<ProtectedRoute><AdminForum /></ProtectedRoute>} />
<Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
```

---

## ✅ Step 4: Add Admin Provider (1 min)

Edit `/client/src/main.jsx` (or App.jsx):

**Find:**
```jsx
import { AuthProvider } from './context/AuthContext'
```

**Add below it:**
```jsx
import { AdminProvider } from './context/AdminContext'
```

**Find the provider wrapping:**
```jsx
<AuthProvider>
  {/* ... */}
</AuthProvider>
```

**Change to:**
```jsx
<AdminProvider>
  <AuthProvider>
    {/* ... */}
  </AuthProvider>
</AdminProvider>
```

---

## ✅ Step 5: Add Admin Link in Navigation (1 min)

Edit your Header/Navigation component and add link:

```jsx
{/* Add this in your header/nav JSX */}
<Link to="/admin" className="... your classes ...">
  🔐 Admin
</Link>
```

---

## ✅ Step 6: Test Everything (1 min)

1. **Backend running:**
   ```bash
   cd server && npm run dev
   # Should see: ✔ Asha API running on http://localhost:3001
   ```

2. **Frontend running:**
   ```bash
   cd client && npm run dev
   # Should see: ✔ ready in XXX ms
   ```

3. **Login and check:**
   - Go to http://localhost:5173
   - Login with your credentials
   - You should see Admin link in navigation
   - Click it → Should see Admin Dashboard

---

## 🎯 What You Get

### Admin Dashboard
- 📊 Total users, therapists, posts stats
- ⚠️ Quick view of pending & flagged items
- 🔗 Quick action links

### Therapist Verification
- 📋 List of pending therapist applications
- ✅ One-click verification
- ❌ Reject with reason
- 🗑️ Delete profiles

### Content Moderation
- 🚩 View flagged posts
- ✅ Approve posts
- 🗑️ Delete with reason
- 📝 Keep moderation logs

### Forum Moderation
- 🚩 View flagged comments
- ✅ Approve comments
- 🗑️ Delete with reason
- 📊 Track moderation activity

### User Management
- 👥 View all users
- 🚫 Ban users with reason
- ✅ Unban users
- 📅 See join dates

---

## 🧪 Quick Test

```bash
# Test API health
curl http://localhost:3001/api/health

# Test admin endpoint (need valid token)
curl http://localhost:3001/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🆘 Troubleshooting

### Admin link not showing
- [ ] Check you're logged in
- [ ] Verify admin user in DB: `SELECT * FROM admin_users;`
- [ ] Restart frontend: `npm run dev`

### "Admin access required" error
- [ ] Check user_id in admin_users table
- [ ] Verify JWT token is valid
- [ ] Check Authorization header

### Routes not working
- [ ] Verify imports in App.jsx
- [ ] Check AdminProvider is wrapping app
- [ ] Check ProtectedRoute component exists

### Database tables missing
- [ ] Run: `node server/scripts/initAdminDb.js`
- [ ] Check PostgreSQL is running
- [ ] Verify DATABASE_URL in .env

---

## 📚 Files Reference

| Purpose | File |
|---------|------|
| **Auth** | `server/middleware/adminAuth.js` |
| **Routes** | `server/routes/admin.js` |
| **DB Setup** | `server/scripts/initAdminDb.js` |
| **State** | `client/src/context/AdminContext.jsx` |
| **Dashboard** | `client/src/pages/AdminDashboard.jsx` |
| **Therapists** | `client/src/pages/AdminTherapists.jsx` |
| **Posts** | `client/src/pages/AdminContent.jsx` |
| **Comments** | `client/src/pages/AdminForum.jsx` |
| **Users** | `client/src/pages/AdminUsers.jsx` |

---

## ✨ Done!

Your admin module is ready! Access at:
```
http://localhost:5173/admin
```

---

## 📖 More Info

See `ADMIN_MODULE.md` for:
- Complete API endpoints
- Database schema
- Advanced features
- Future enhancements

