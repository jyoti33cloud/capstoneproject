-- Migration 004: Add columns used by organization verification admin features
-- These columns are referenced by admin_organization_verification routes

-- organizations: city/state used in add/applications/profile
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city VARCHAR(120);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS state VARCHAR(120);

-- organization_details: contact + verification workflow fields
ALTER TABLE organization_details ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE organization_details ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE organization_details ADD COLUMN IF NOT EXISTS specializations TEXT;
ALTER TABLE organization_details ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE organization_details ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE organization_details ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE organization_details ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE organization_details ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE organization_details ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- verification_documents: allow linking documents to an organization
ALTER TABLE verification_documents ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE;
