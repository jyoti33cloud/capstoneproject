# Asha — System Architecture & Flow Diagrams

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ React + Vite + Tailwind CSS (Port 5173)                     │  │
│  │                                                              │  │
│  │  • Pages: Login, Register, Profile, Learn, Community       │  │
│  │  • Pages: FindHelp, BookAppointment, DailyRoutine, AACTool│  │
│  │  • Components: Header, Layout, BottomNav, ProtectedRoute   │  │
│  │  • Contexts: AuthContext, LangContext                      │  │
│  │  • API Client: axios-based API wrapper                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────────────┐
│                        API SERVER LAYER                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Node.js + Express (Port 3001)                               │  │
│  │                                                              │  │
│  │  Routes:                                                    │  │
│  │  • /api/auth (login, register, Google OAuth, logout)       │  │
│  │  • /api/profile (get, update user profile)                 │  │
│  │  • /api/community (posts, likes, replies)                  │  │
│  │  • /api/specialists (search, filter)                       │  │
│  │  • /api/appointments (book, cancel, list)                  │  │
│  │  • /api/routine (get/update daily routine checklist)       │  │
│  │  • /api/disability-checklist (assessments)                 │  │
│  │  • /api/health (health check)                              │  │
│  │                                                              │  │
│  │  Middleware:                                                │  │
│  │  • CORS (CLIENT_ORIGIN env)                                │  │
│  │  • JWT Authentication                                      │  │
│  │  • Error Handling                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA & SERVICES LAYER                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ PostgreSQL 13+ Database                                      │  │
│  │                                                              │  │
│  │ Tables:                                                      │  │
│  │ • users (id, email, password_hash, name, language_pref)   │  │
│  │ • profiles (user_id, child_info, location, preferences)    │  │
│  │ • posts (id, user_id, content, created_at)                │  │
│  │ • comments (id, post_id, user_id, content)                │  │
│  │ • likes (id, post_id|comment_id, user_id)                 │  │
│  │ • specialists (id, name, type, location, contact)         │  │
│  │ • appointments (id, user_id, specialist_id, datetime)      │  │
│  │ • routine (id, user_id, date, tasks, completion_status)   │  │
│  │ • disability_checklist (id, user_id, answers, timestamp)   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                             │
│  • Google OAuth 2.0 (authentication)                               │
│  • Email Service (notifications)                                   │
│  • Browser Speech Synthesis (AAC tool text-to-speech)             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Flow

```
┌─────────────────┐
│  USER ARRIVES   │
└────────┬────────┘
         │
         ↓
    ┌─────────────────────┐
    │ Login/Register Page │
    └────────┬────────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
  ┌─────────┐  ┌─────────────────┐
  │ Password│  │ Google Sign-In  │
  │ Mode    │  │ (OAuth)         │
  └────┬────┘  └────────┬────────┘
       │                │
       ↓                ↓
  ┌─────────────────────────────────┐
  │ POST /api/auth/login OR          │
  │ POST /api/auth/google-callback   │
  └──────────────┬────────────────────┘
                 │
         ┌───────┴────────┐
         ↓                ↓
    ┌─────────┐    ┌──────────────┐
    │ Valid?  │    │ Invalid Creds│
    └────┬────┘    │ or Google Err│
         │         └──────────────┘
    ┌────┴─────┐          │
    │ YES      │          ↓
    │          │    ┌──────────────┐
    ↓          │    │ Return Error │
 ┌─────────────┐   │ + Msg        │
 │ Create JWT  │   └──────────────┘
 │ Set User    │
 │ Session     │
 └──────┬──────┘
        │
        ↓
 ┌─────────────────────┐
 │ Store JWT Token in  │
 │ localStorage        │
 │ (AuthContext)       │
 └──────┬──────────────┘
        │
        ↓
 ┌─────────────────────┐
 │ Redirect to Home or │
 │ Protected Route     │
 └─────────────────────┘
```

---

## 3. Community Forum Flow

```
┌──────────────────┐
│ Community Page   │
│ (GET /posts)     │
└────────┬─────────┘
         │
         ↓
┌─────────────────────────────┐
│ Display All Posts (paginated)│
│ • Post content               │
│ • Like count, Reply count    │
│ • Author info                │
└────────┬────────────────────┘
         │
    ┌────┴─────┬──────────┬──────────┐
    ↓          ↓          ↓          ↓
 ┌────────┐ ┌──────┐ ┌──────────┐ ┌────────────┐
 │Create  │ │Like  │ │View      │ │Reply to    │
 │Post    │ │Post  │ │Replies   │ │Post        │
 └───┬────┘ └──┬───┘ └────┬─────┘ └─────┬──────┘
     │         │          │             │
     ↓         ↓          ↓             ↓
┌────────────┐┌─────────┐┌──────────┐┌──────────────┐
│POST        ││PUT      ││GET       ││POST          │
│/api/posts  ││/api/like││/api/posts││/api/comments│
│            ││         ││:id       ││              │
└────────────┘└─────────┘└──────────┘└──────────────┘
     │         │          │             │
     ↓         ↓          ↓             ↓
┌────────────────────────────────────────────────┐
│ Database Update                                │
│ • Insert post + Set user_id                   │
│ • Insert/update like record                   │
│ • Fetch post with nested replies              │
│ • Insert comment + Link to post/user          │
└────────────────────────────────────────────────┘
     │         │          │             │
     ↓         ↓          ↓             ↓
┌──────────────────────────────────────────────┐
│ Return Updated Data to Frontend              │
│ • New post ID                                │
│ • Updated like/reply counts                  │
│ • Paginated feed                             │
└──────────────────────────────────────────────┘
```

---

## 4. Appointment Booking Flow

```
┌─────────────────────────────┐
│ Find Help / Book Appointment│
│ Page                        │
└────────┬────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ GET /api/specialists             │
│ (with filters: location, type)   │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Display Specialist List          │
│ • Name, Type, Location, Contact  │
│ • Book button for each           │
└────────┬─────────────────────────┘
         │
         ↓ (User clicks "Book")
┌──────────────────────────────────┐
│ Show Appointment Modal/Form      │
│ • Select date & time             │
│ • Add notes/reason               │
│ • Confirm booking                │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ POST /api/appointments           │
│ {                                │
│   specialist_id,                 │
│   appointment_date,              │
│   notes                          │
│ }                                │
└────────┬─────────────────────────┘
         │
    ┌────┴─────┐
    ↓          ↓
┌─────────┐ ┌──────────────────┐
│Success  │ │Error (conflict,  │
│         │ │specialist busy)  │
└────┬────┘ └─────────┬────────┘
     │                 │
     ↓                 ↓
┌────────────────┐┌──────────────────┐
│Save to DB      ││Show Error & Retry│
│Create reminder │└──────────────────┘
│Send confirm    │
│email           │
└────┬───────────┘
     │
     ↓
┌──────────────────────┐
│Redirect to Profile   │
│Show "Appointment     │
│Confirmed" Alert      │
└──────────────────────┘
```

---

## 5. Daily Routine Tracker Flow

```
┌────────────────────────┐
│ Daily Routine Page     │
│ (Load Today's Tasks)   │
└────────┬───────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ GET /api/routine?date=TODAY      │
│ Fetch user's routine for today   │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Display Task Checklist           │
│ • Morning: Wake up, Eat, Brush   │
│ • Afternoon: Lunch, Play, Learn  │
│ • Evening: Dinner, Wind down     │
│ • Each task with checkbox        │
└────────┬─────────────────────────┘
         │
         ↓ (User clicks checkbox)
┌──────────────────────────────────┐
│ Update Local State               │
│ Mark task as completed/incomplete│
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ PUT /api/routine                 │
│ {                                │
│   date: TODAY,                   │
│   tasks: {                       │
│     breakfast: true,             │
│     lunch: false,                │
│     ...                          │
│   }                              │
│ }                                │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Save to PostgreSQL               │
│ Update routine record            │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Return Updated Routine to Client │
│ • Completion %, count stats      │
│ • Encourage message              │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Show Visual Feedback             │
│ • Highlight checked items        │
│ • Update progress bar            │
│ • Show completion emoji/message  │
└──────────────────────────────────┘
```

---

## 6. User Session & Context Management

```
┌──────────────────────────────┐
│ App Initialization (main.jsx)│
└────────┬─────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ AuthContext Provider             │
│ • Check localStorage for JWT     │
│ • Validate token via server      │
│ • Load user profile              │
└────────┬─────────────────────────┘
         │
    ┌────┴─────┐
    ↓          ↓
┌─────────┐ ┌────────────┐
│Valid    │ │Invalid/    │
│Token    │ │Expired     │
└────┬────┘ └──────┬─────┘
     │             │
     ↓             ↓
┌──────────────┐┌──────────────┐
│Set           ││Clear session,│
│isAuth=true   ││Redirect to   │
│              ││Login         │
└──────┬───────┘└──────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ LangContext Provider             │
│ • Check localStorage for lang    │
│ • Default: EN (English)          │
│ • Support: EN, नेपाली            │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Protected Routes Check           │
│ • ProtectedRoute wrapper         │
│ • Redirect to Login if !isAuth   │
└────────┬─────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Render Main App                  │
│ • Header with language toggle    │
│ • BottomNav for mobile           │
│ • Page content (auth-dependent)  │
└──────────────────────────────────┘
```

---

## 7. Data Models (Database Schema)

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  language_preference VARCHAR(10) DEFAULT 'en',
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Profiles Table
```sql
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  child_name VARCHAR(255),
  child_age INT,
  child_autism_type VARCHAR(100),
  location VARCHAR(255),
  contact_phone VARCHAR(20),
  preferences JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Community Posts Table
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  replies_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Comments Table
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INT REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Likes Table
```sql
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  post_id INT REFERENCES posts(id) ON DELETE CASCADE,
  comment_id INT REFERENCES comments(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id),
  UNIQUE(comment_id, user_id)
);
```

### Specialists Table
```sql
CREATE TABLE specialists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialist_type VARCHAR(100),
  location VARCHAR(255),
  contact_phone VARCHAR(20),
  email VARCHAR(255),
  availability JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Appointments Table
```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  specialist_id INT REFERENCES specialists(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Routine Table
```sql
CREATE TABLE routine (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tasks JSONB DEFAULT '{}',
  completion_status JSONB DEFAULT '{}',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);
```

---

## 8. API Endpoints Summary

| Feature | Method | Endpoint | Auth |
|---------|--------|----------|------|
| **Auth** | POST | `/api/auth/register` | No |
| | POST | `/api/auth/login` | No |
| | POST | `/api/auth/google-callback` | No |
| | POST | `/api/auth/logout` | Yes |
| **Profile** | GET | `/api/profile` | Yes |
| | PUT | `/api/profile` | Yes |
| **Community** | GET | `/api/posts` | Yes |
| | POST | `/api/posts` | Yes |
| | GET | `/api/posts/:id` | Yes |
| | POST | `/api/comments` | Yes |
| | POST | `/api/like` | Yes |
| **Specialists** | GET | `/api/specialists` | Yes |
| | GET | `/api/specialists/:id` | Yes |
| **Appointments** | GET | `/api/appointments` | Yes |
| | POST | `/api/appointments` | Yes |
| | PUT | `/api/appointments/:id` | Yes |
| | DELETE | `/api/appointments/:id` | Yes |
| **Routine** | GET | `/api/routine` | Yes |
| | PUT | `/api/routine` | Yes |
| **Health** | GET | `/api/health` | No |

---

## 9. Key Features & Components

### Frontend Components
- **Header**: Logo, navigation, language toggle, user menu
- **BottomNav**: Mobile navigation (Home, Community, Find Help, Learn, Profile)
- **ProtectedRoute**: Guards routes that require authentication
- **LearningModal**: Displays educational content with text-to-speech
- **Layout**: Wraps pages with Header, BottomNav, mobile-first responsive design

### Frontend Pages
- **Login**: Email/password + Google OAuth sign-in
- **Register**: Email/password registration
- **Home**: Dashboard with personalized recommendations
- **Learn**: Educational content on autism, development, parenting
- **Community**: Social forum for parents (posts, comments, likes)
- **FindHelp**: Search specialists, view their profiles, book appointments
- **BookAppointment**: Calendar-based appointment booking
- **DailyRoutine**: Checklist for daily activities with progress tracking
- **AACTool**: Augmentative & Alternative Communication board with text-to-speech
- **DisabilityChecklist**: Assessment questionnaire
- **Profile**: User profile, child info, preferences

### Backend Services
- **Auth Service**: JWT, Google OAuth, password hashing
- **Email Service**: Send appointment confirmations, reminders
- **Database Service**: Connection pooling, migrations
- **API Routes**: RESTful endpoints for all features

---

## 10. Technology Stack

```
┌─────────────────────────────┐
│ Frontend                    │
├─────────────────────────────┤
│ React 18                    │
│ Vite (build tool)           │
│ React Router v6             │
│ Tailwind CSS                │
│ Axios (HTTP client)         │
│ Google Sign-In SDK          │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Backend                     │
├─────────────────────────────┤
│ Node.js 18+                 │
│ Express.js                  │
│ PostgreSQL 13+              │
│ jsonwebtoken (JWT)          │
│ bcryptjs (password hashing) │
│ dotenv (config)             │
│ CORS                        │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Deployment / DevOps         │
├─────────────────────────────┤
│ Docker (optional)           │
│ Git version control         │
│ Environment variables       │
└─────────────────────────────┘
```

---

## 11. User Journeys

### New Parent Journey
```
Sign Up (email/Google)
    ↓
Create Profile (child info, location)
    ↓
Take Disability Assessment
    ↓
Browse Learning Resources
    ↓
Join Community Forum
    ↓
Search for Specialists
    ↓
Book First Appointment
    ↓
Track Daily Routine for child
    ↓
Use AAC Tool for communication practice
    ↓
Return to Community for support & tips
```

### Community Engagement Journey
```
View Community Feed
    ↓
Read Posts from other parents
    ↓
Like posts (show support)
    ↓
Reply to posts (ask questions)
    ↓
Create own post (share experience)
    ↓
Get feedback & support
    ↓
Build connections with community
```

---

## 12. Security Considerations

1. **Authentication**: JWT tokens stored in localStorage
2. **Authorization**: Protected routes, API middleware checks user ownership
3. **Password Security**: bcryptjs for hashing
4. **Google OAuth**: Secure client ID + secret flow
5. **CORS**: Limited to CLIENT_ORIGIN environment variable
6. **Environment Variables**: Sensitive data in `.env` (not committed)
7. **Data Validation**: Server-side validation on all inputs
8. **SQL Injection Prevention**: Parameterized queries (pg library handles it)

---

## 13. Deployment Architecture (Production)

```
┌────────────────────────┐
│ Client Domain          │
│ (asha-app.com)         │
│ └─ React Vite Build    │
│    └─ CDN / Web Server │
└────────────┬───────────┘
             │
             ↓ HTTPS
┌────────────────────────┐
│ API Server             │
│ (api.asha-app.com)     │
│ └─ Node.js + Express   │
│    └─ Load Balancer    │
│       (optional)       │
└────────────┬───────────┘
             │
             ↓
┌────────────────────────┐
│ PostgreSQL Database    │
│ (Managed / Self-hosted)│
│ └─ Backups enabled     │
│ └─ SSL connections     │
└────────────────────────┘
```

