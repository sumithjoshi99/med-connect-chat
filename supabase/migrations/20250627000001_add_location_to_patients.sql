-- Migration: Add location field to patients table
-- This migration adds location-based separation for contacts

-- Add location field to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'mount_vernon';

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_patients_location ON patients(location);

-- Update all existing patients to Mount Vernon location
UPDATE patients SET location = 'mount_vernon' WHERE location IS NULL OR location = '';

-- Add constraint to ensure location is not null
ALTER TABLE patients ALTER COLUMN location SET NOT NULL;

-- Add check constraint to ensure valid locations
ALTER TABLE patients ADD CONSTRAINT check_valid_location 
CHECK (location IN ('mount_vernon', 'new_rochelle'));

-- Add comment
COMMENT ON COLUMN patients.location IS 'Location of the patient (mount_vernon or new_rochelle)'; 