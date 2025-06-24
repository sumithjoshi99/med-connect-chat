-- Add medical fields to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies TEXT[];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS medications TEXT[];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_conditions TEXT[];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_visit DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS next_appointment TIMESTAMP WITH TIME ZONE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to automatically update updated_at column
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 