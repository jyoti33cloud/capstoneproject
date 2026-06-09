-- Migration 003: Add missing columns used by dashboard features
-- These columns are referenced by staff/events management code

-- organization_members: update role, disable account
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT FALSE;

-- events: workshops/training with trainer and paid options
ALTER TABLE events ADD COLUMN IF NOT EXISTS trainer VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- event_registrations: status tracking
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'registered';

-- therapist_availability: update tracking (code sets updated_at on upsert)
ALTER TABLE therapist_availability ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- appointment_slots: cancellation reason (reject/cancel features)
ALTER TABLE appointment_slots ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
