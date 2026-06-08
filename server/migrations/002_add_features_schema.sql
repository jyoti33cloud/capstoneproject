-- Migration: Add comprehensive feature tables
-- Creates all tables for therapist, organization, and admin features
-- Does NOT modify existing tables

-- 1. Therapist Profiles
CREATE TABLE IF NOT EXISTS therapist_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  consultation_fee DECIMAL(10, 2),
  languages VARCHAR(255) DEFAULT 'English',
  specializations VARCHAR(500),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(30) DEFAULT 'pending', -- pending | approved | rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Therapist Qualifications
CREATE TABLE IF NOT EXISTS therapist_qualifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qualification_type VARCHAR(100), -- degree | certification | license
  title VARCHAR(200) NOT NULL,
  issuing_organization VARCHAR(200),
  issue_date DATE,
  expiry_date DATE,
  credential_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Therapist Availability
CREATE TABLE IF NOT EXISTS therapist_availability (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0-6 (Monday-Sunday)
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Blocked Dates (Vacation, holidays, etc.)
CREATE TABLE IF NOT EXISTS therapist_blocked_dates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, block_date)
);

-- 5. Organization Services
CREATE TABLE IF NOT EXISTS organization_services (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_name VARCHAR(150) NOT NULL, -- Speech Therapy, OT, ABA, etc.
  description TEXT,
  price_range VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Organization Details
CREATE TABLE IF NOT EXISTS organization_details (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  phone_1 VARCHAR(20),
  phone_2 VARCHAR(20),
  registration_number VARCHAR(100),
  registration_document_url TEXT,
  about_us TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Appointments (Enhanced)
CREATE TABLE IF NOT EXISTS appointment_slots (
  id SERIAL PRIMARY KEY,
  therapist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(30) DEFAULT 'requested', -- requested | confirmed | completed | cancelled | rescheduled
  notes TEXT,
  session_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Progress Notes
CREATE TABLE IF NOT EXISTS progress_notes (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER REFERENCES appointment_slots(id) ON DELETE CASCADE,
  therapist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  observations TEXT,
  recommendations TEXT,
  milestones VARCHAR(500),
  next_steps TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Verification Documents
CREATE TABLE IF NOT EXISTS verification_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(100), -- license | certificate | degree
  document_url TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'pending', -- pending | verified | rejected
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by INTEGER REFERENCES users(id)
);

-- 11. Community Reports
CREATE TABLE IF NOT EXISTS community_reports (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  reply_id INTEGER REFERENCES replies(id) ON DELETE CASCADE,
  reported_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(30) DEFAULT 'pending', -- pending | reviewed | resolved | dismissed
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Resources (Articles, Videos)
CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  resource_type VARCHAR(50), -- article | video | document
  resource_url TEXT,
  category VARCHAR(100),
  created_by INTEGER REFERENCES users(id),
  is_published BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  changes JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Events & Workshops
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  event_type VARCHAR(50), -- workshop | awareness | training
  capacity INTEGER,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Event Registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_user ON therapist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_status ON therapist_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_therapist_qualifications_user ON therapist_qualifications(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_availability_user ON therapist_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_therapist_blocked_dates_user ON therapist_blocked_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_services_org ON organization_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_details_org ON organization_details(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_details_status ON organization_details(verification_status);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_therapist ON appointment_slots(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_parent ON appointment_slots(parent_id);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_date ON appointment_slots(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_status ON appointment_slots(status);
CREATE INDEX IF NOT EXISTS idx_progress_notes_therapist ON progress_notes(therapist_id);
CREATE INDEX IF NOT EXISTS idx_progress_notes_parent ON progress_notes(parent_id);
CREATE INDEX IF NOT EXISTS idx_progress_notes_date ON progress_notes(session_date);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_verification_documents_user ON verification_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_documents_status ON verification_documents(status);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status);
CREATE INDEX IF NOT EXISTS idx_resources_published ON resources(is_published);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_organization ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
