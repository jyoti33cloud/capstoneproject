-- =====================================================
-- Asha (आशा) - Autism Support App Database Schema
-- =====================================================

DROP TABLE IF EXISTS replies CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS routine_logs CASCADE;
DROP TABLE IF EXISTS specialists CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Organizations (Therapy Centers, Child Development Centers, etc.)
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- 'therapy_center' | 'child_dev_center' | 'special_ed_center' | 'rehab_center'
  location VARCHAR(150),
  phone VARCHAR(20),
  email VARCHAR(160),
  description TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  role VARCHAR(30) DEFAULT 'parent',  -- 'parent' | 'therapist' | 'admin' | 'organization_admin'
  organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  city VARCHAR(80),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members (therapists/specialists linked to organizations)
CREATE TABLE organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position VARCHAR(100),  -- e.g., 'Speech Therapist', 'Occupational Therapist'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Specialists / Therapy Centers (legacy - can be deprecated or used for listing)
CREATE TABLE specialists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(40) NOT NULL,            -- 'specialist' | 'center'
  specialty VARCHAR(150),
  location VARCHAR(80),
  rating NUMERIC(2,1) DEFAULT 4.5,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  specialist_id INTEGER REFERENCES specialists(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Posts
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(40) DEFAULT 'general',  -- general | behavior | schooling | therapy
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Likes
CREATE TABLE post_likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Replies
CREATE TABLE replies (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Routine Logs (per user, per day, per task)
CREATE TABLE routine_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  task_key VARCHAR(40) NOT NULL,         -- brushing | breakfast | school | play | sleep
  log_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_key, log_date)
);

-- Disability ID Checklist
CREATE TABLE disability_checklist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  item_key VARCHAR(80) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_key)
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_org_members_organization ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_routine_user_date ON routine_logs(user_id, log_date);
CREATE INDEX idx_disability_checklist_user ON disability_checklist(user_id);
