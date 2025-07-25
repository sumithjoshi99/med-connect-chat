-- Migration: Add Multi-Phone Number Support
-- This migration adds support for multiple Twilio phone numbers

-- Create twilio_phone_numbers table
CREATE TABLE IF NOT EXISTS twilio_phone_numbers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE, -- E.164 format: +19142221900
    display_name TEXT NOT NULL, -- Human-readable name like "Main Line"
    twilio_account_sid TEXT NOT NULL,
    twilio_auth_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false, -- Primary number for outbound by default
    department TEXT, -- e.g., "pharmacy", "customer_service", "prescriptions"
    business_hours JSONB DEFAULT '{"enabled": false, "timezone": "America/New_York", "hours": {"monday": {"open": "09:00", "close": "17:00"}}}'::jsonb,
    auto_response_enabled BOOLEAN DEFAULT false,
    auto_response_message TEXT,
    webhook_url TEXT, -- Custom webhook URL if needed
    status_callback_url TEXT, -- Custom delivery status webhook
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_twilio_phone_numbers_phone ON twilio_phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_twilio_phone_numbers_active ON twilio_phone_numbers(is_active);
CREATE INDEX IF NOT EXISTS idx_twilio_phone_numbers_primary ON twilio_phone_numbers(is_primary) WHERE is_primary = true;

-- Add phone_number_id to messages table to track which number was used
ALTER TABLE messages ADD COLUMN IF NOT EXISTS phone_number_id UUID REFERENCES twilio_phone_numbers(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS twilio_number_from TEXT; -- The actual number used
ALTER TABLE messages ADD COLUMN IF NOT EXISTS twilio_number_to TEXT; -- The recipient number

-- Add phone_number_id to patients table for default number assignment
ALTER TABLE patients ADD COLUMN IF NOT EXISTS assigned_phone_number_id UUID REFERENCES twilio_phone_numbers(id);

-- Create phone_number_assignments table for flexible routing
CREATE TABLE IF NOT EXISTS phone_number_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number_id UUID REFERENCES twilio_phone_numbers(id) ON DELETE CASCADE,
    assignment_type TEXT NOT NULL, -- 'patient_group', 'department', 'staff_member', 'default'
    assignment_criteria JSONB DEFAULT '{}'::jsonb, -- Flexible criteria for assignment
    priority INTEGER DEFAULT 1, -- Higher priority takes precedence
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for new tables
ALTER TABLE twilio_phone_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE phone_number_assignments DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON twilio_phone_numbers TO anon, authenticated;
GRANT ALL ON phone_number_assignments TO anon, authenticated;

-- Insert your first phone number
INSERT INTO twilio_phone_numbers (
    phone_number,
    display_name,
    twilio_account_sid,
    twilio_auth_token,
    is_active,
    is_primary,
    department,
    webhook_url,
    status_callback_url
) VALUES (
    '+19142221900',
    'Main Pharmacy Line',
    'AC956237533bdb4805ba26c3191c69a858',
    '467735fdc396abfca88f9992aae30dc5',
    true,
    true,
    'pharmacy',
    'https://wfhslrzkjgyrxwxlyjyx.supabase.co/functions/v1/sms-webhook',
    'https://wfhslrzkjgyrxwxlyjyx.supabase.co/functions/v1/sms-delivery-webhook'
) ON CONFLICT (phone_number) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    twilio_account_sid = EXCLUDED.twilio_account_sid,
    twilio_auth_token = EXCLUDED.twilio_auth_token,
    is_active = EXCLUDED.is_active,
    is_primary = EXCLUDED.is_primary,
    department = EXCLUDED.department,
    webhook_url = EXCLUDED.webhook_url,
    status_callback_url = EXCLUDED.status_callback_url,
    updated_at = NOW();

-- Add updated_at trigger for new tables
DROP TRIGGER IF EXISTS update_twilio_phone_numbers_updated_at ON twilio_phone_numbers;
CREATE TRIGGER update_twilio_phone_numbers_updated_at 
    BEFORE UPDATE ON twilio_phone_numbers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_phone_number_assignments_updated_at ON phone_number_assignments;
CREATE TRIGGER update_phone_number_assignments_updated_at 
    BEFORE UPDATE ON phone_number_assignments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE twilio_phone_numbers IS 'Stores multiple Twilio phone numbers with their configurations';
COMMENT ON TABLE phone_number_assignments IS 'Flexible routing rules for phone number assignments';
COMMENT ON COLUMN messages.phone_number_id IS 'References the Twilio phone number used for this message';
COMMENT ON COLUMN messages.twilio_number_from IS 'The actual Twilio number that sent/received the message';
COMMENT ON COLUMN messages.twilio_number_to IS 'The recipient phone number'; 