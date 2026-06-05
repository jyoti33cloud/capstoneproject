# 🔐 Admin Module - Complete Documentation

## Overview

A complete admin management system for Asha that enables administrators to:
- ✅ Verify & manage therapists
- ✅ Moderate forum posts & comments
- ✅ Manage platform users
- ✅ View dashboard analytics

---

## 📁 New Files Created

### Backend Files

#### 1. `/server/middleware/adminAuth.js`
Middleware that checks if a user is an admin before allowing access to admin routes.

```javascript
// Usage in routes:
router.get('/endpoint', adminRequired, async (req, res) => {
  // Only accessible to admins
});
```

#### 2. `/server/routes/admin.js`
All admin endpoints:
- Therapist verification (verify, reject, delete)
- Content moderation (approve, delete posts)
- Forum moderation (approve, delete comments)
- User management (ban, unban users)
- Dashboard stats

#### 3. `/server/scripts/initAdminDb.js`
Database initialization script that creates:
- `admin_users` table
- `deleted_content` table
- `admin_activity` table
- Adds columns to existing tables for moderation

### Frontend Files

#### 1. `/client/src/context/AdminContext.jsx`
Global state management for admin functions with hooks:
- `useAdmin()` - Access all admin functions

#### 2. `/client/src/pages/AdminDashboard.jsx`
Main admin dashboard showing:
- Total users
- Verified therapists
- Pending therapists
- Total posts & flagged posts
- Total appointments

#### 3. `/client/src/pages/AdminTherapists.jsx`
Therapist verification interface:
- List pending therapists
- Verify therapists
- Reject with reason

#### 4. `/client/src/pages/AdminContent.jsx`
Content moderation for posts:
- View flagged posts
- Approve posts
- Delete with reason

#### 5. `/client/src/pages/AdminForum.jsx`
Forum moderation for comments:
- View flagged comments
- Approve comments
- Delete with reason

#### 6. `/client/src/pages/AdminUsers.jsx`
User management:
- List all users
- Ban users
- Unban users

---

## 🚀 Setup Instructions

### Step 1: Initialize Database

```bash
cd server
node scripts/initAdminDb.js
```

**Output should show:**
```
✔ admin_users table created
✔ deleted_content table created
✔ admin_activity table created
✔ Added flagged column to posts table
✔ Added moderated_by column to posts table
... (more columns)
✔ Admin Database initialized successfully!
```

### Step 2: Create Admin User

Connect to PostgreSQL and create an admin:

```sql
-- Add admin role to existing user (replace with real user_id)
INSERT INTO admin_users (user_id, role, permissions)
VALUES (1, 'admin', '{"therapist_verify": true, "content_moderate": true, "user_manage": true}');
```

Or from Node.js:
```javascript
const pool = require('./db');

async function createAdmin() {
  const userId = 1; // Your user ID
  await pool.query(
    `INSERT INTO admin_users (user_id, role, permissions)
     VALUES ($1, $2, $3)`,
    [userId, 'admin', JSON.stringify({
      therapist_verify: true,
      content_moderate: true,
      user_manage: true
    })]
  );
  console.log('Admin created');
}

createAdmin();
```

### Step 3: Add Admin Routes to Frontend

Update `/client/src/App.jsx` to add admin routes:

```jsx
import AdminDashboard from './pages/AdminDashboard';
import AdminTherapists from './pages/AdminTherapists';
import AdminContent from './pages/AdminContent';
import AdminForum from './pages/AdminForum';
import AdminUsers from './pages/AdminUsers';

// In your routing:
<Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
<Route path="/admin/therapists" element={<ProtectedRoute><AdminTherapists /></ProtectedRoute>} />
<Route path="/admin/content" element={<ProtectedRoute><AdminContent /></ProtectedRoute>} />
<Route path="/admin/forum" element={<ProtectedRoute><AdminForum /></ProtectedRoute>} />
<Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
```

### Step 4: Add Admin Provider to Frontend

Update `/client/src/App.jsx` or `main.jsx`:

```jsx
import { AdminProvider } from './context/AdminContext';

<AdminProvider>
  {/* Your app */}
</AdminProvider>
```

### Step 5: Add Admin Link in Navigation

Update your Header/Navigation component:

```jsx
import { useAuth } from './context/AuthContext';

export default function Header() {
  const { user } = useAuth();
  
  return (
    <header>
      {/* ... other nav items ... */}
      
      {/* Check if user is admin from backend */}
      {user?.isAdmin && (
        <Link to="/admin" className="nav-link">
          🔐 Admin
        </Link>
      )}
    </header>
  );
}
```

---

## 📊 Database Schema

### admin_users
```sql
id          SERIAL PRIMARY KEY
user_id     INT UNIQUE NOT NULL (references users)
role        VARCHAR(50) - 'admin', 'moderator'
permissions JSONB
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### deleted_content
```sql
id           SERIAL PRIMARY KEY
content_type VARCHAR(50) - 'post', 'comment'
content_id   INT
reason       TEXT
deleted_by   INT (references users)
created_at   TIMESTAMP
```

### admin_activity
```sql
id           SERIAL PRIMARY KEY
admin_id     INT (references users)
action       VARCHAR(100) - 'verify', 'reject', 'delete', etc
target_type  VARCHAR(50) - 'therapist', 'post', 'comment', etc
target_id    INT
details      JSONB
created_at   TIMESTAMP
```

### Modified Tables

**posts** - Added columns:
- `flagged` BOOLEAN
- `moderated_by` INT
- `moderated_at` TIMESTAMP

**comments** - Added columns:
- `flagged` BOOLEAN
- `moderated_by` INT
- `moderated_at` TIMESTAMP

**specialists** - Added columns:
- `verified` BOOLEAN
- `verified_by` INT
- `verified_at` TIMESTAMP
- `rejection_reason` TEXT
- `rejected_by` INT
- `rejected_at` TIMESTAMP

**users** - Added columns:
- `banned` BOOLEAN
- `ban_reason` TEXT
- `banned_by` INT
- `banned_at` TIMESTAMP

---

## 🔌 API Endpoints

### Dashboard
- `GET /api/admin/dashboard` - Get stats

### Therapists
- `GET /api/admin/therapists/pending` - List pending
- `GET /api/admin/therapists` - List all
- `GET /api/admin/therapists/:id` - Get one
- `POST /api/admin/therapists/:id/verify` - Verify
- `POST /api/admin/therapists/:id/reject` - Reject
- `DELETE /api/admin/therapists/:id` - Delete

### Posts
- `GET /api/admin/posts/flagged` - Get flagged
- `GET /api/admin/posts` - Get all
- `POST /api/admin/posts/:id/approve` - Approve
- `DELETE /api/admin/posts/:id` - Delete

### Comments
- `GET /api/admin/comments/flagged` - Get flagged
- `POST /api/admin/comments/:id/approve` - Approve
- `DELETE /api/admin/comments/:id` - Delete

### Users
- `GET /api/admin/users` - List all
- `POST /api/admin/users/:id/ban` - Ban user
- `POST /api/admin/users/:id/unban` - Unban user

### Activity
- `GET /api/admin/activity` - Get activity log

---

## 🎯 Usage Examples

### In Frontend Components

```jsx
import { useAdmin } from '../context/AdminContext';

export default function MyAdminComponent() {
  const { 
    getDashboardStats, 
    getPendingTherapists,
    verifyTherapist,
    loading 
  } = useAdmin();

  async function handleVerify(id) {
    const result = await verifyTherapist(id);
    if (result.ok) {
      console.log('Verified:', result.therapist.name);
    }
  }

  return (
    // Your JSX here
  );
}
```

### In Backend Routes

```javascript
const router = require('express').Router();
const { adminRequired } = require('../middleware/adminAuth');

router.post('/my-admin-action', adminRequired, async (req, res) => {
  // req.user contains user info
  // req.admin contains admin role
  
  console.log(`Admin ${req.user.email} performed action`);
  res.json({ success: true });
});

module.exports = router;
```

---

## 🔒 Security

### Authentication
- Admin routes require valid JWT token
- `adminRequired` middleware verifies admin status
- Admin status checked on every request

### Authorization
- Roles: 'admin', 'moderator'
- Permissions stored in JSONB
- Expandable permission system

### Logging
- All admin actions logged with timestamp
- User ID & email recorded
- Action details stored in JSON

---

## 🎨 Features

### Therapist Verification
- View pending applications
- See therapist details (name, type, location, contact)
- Approve with one click
- Reject with optional reason
- Delete if needed

### Content Moderation
- View flagged posts
- See post content & author info
- Approve to remove flag
- Delete with optional reason
- Maintains audit trail

### Forum Moderation
- View flagged comments
- See comment content & author
- Approve comments
- Delete with optional reason
- Linked to original posts

### User Management
- View all users
- See join date
- Ban users with reason
- Unban users
- Active/Banned status

### Dashboard
- Real-time statistics
- Quick action links
- Pending items count
- Total metrics

---

## 📈 Future Enhancements

1. **Advanced Filtering**
   - Filter by date range
   - Search by email/name
   - Sort by various fields

2. **Bulk Actions**
   - Approve multiple therapists
   - Delete multiple posts
   - Ban multiple users

3. **Analytics**
   - Moderation patterns
   - User behavior analytics
   - Therapist approval rate

4. **Automated Rules**
   - Auto-flag certain keywords
   - Auto-ban repeat offenders
   - Scheduled reports

5. **Notifications**
   - Alert admins on new pending items
   - Email notifications
   - In-app notifications

6. **Admin Audit Log**
   - Track all admin actions
   - Reversible actions
   - Admin activity report

---

## 🧪 Testing

### Test Admin Access

```bash
# 1. Create admin user in DB
psql asha -c "INSERT INTO admin_users (user_id, role) VALUES (1, 'admin');"

# 2. Get JWT token from login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 3. Test admin endpoint
curl http://localhost:3001/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Check Database

```sql
-- Check admin users
SELECT * FROM admin_users;

-- Check deleted content
SELECT * FROM deleted_content;

-- Check moderation activity
SELECT * FROM admin_activity;
```

---

## 🚨 Troubleshooting

### "Admin access required" Error
- Verify user is in `admin_users` table
- Check JWT token is valid
- Ensure Authorization header is set

### Database Tables Not Created
- Run: `node scripts/initAdminDb.js`
- Check PostgreSQL is running
- Verify DATABASE_URL in .env

### Admin Routes Not Found
- Verify `/server/routes/admin.js` exists
- Check `app.use('/api/admin', ...)` in index.js
- Restart backend server

### Pages Not Loading
- Add routes to App.jsx
- Add AdminProvider to main component tree
- Check browser console for errors

---

## ✅ Checklist

- [ ] Run `node scripts/initAdminDb.js`
- [ ] Create admin user in database
- [ ] Add admin routes to App.jsx
- [ ] Add AdminProvider to app
- [ ] Test admin dashboard
- [ ] Test therapist verification
- [ ] Test content moderation
- [ ] Test forum moderation
- [ ] Test user management
- [ ] Add admin link to navigation

---

## 📞 Support

Check browser console (F12) and server logs for errors. Most issues are:
1. Missing database initialization
2. User not in admin_users table
3. Routes not added to App.jsx
4. AdminProvider not wrapping app

