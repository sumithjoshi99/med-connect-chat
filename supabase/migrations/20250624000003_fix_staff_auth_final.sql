-- Final fix for staff authentication system
-- This migration ensures all auth-related tables work properly

-- Ensure RLS is disabled on all auth tables to prevent access issues
ALTER TABLE staff_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- Drop any remaining problematic policies
DROP POLICY IF EXISTS "Admins can view all staff" ON staff_accounts;
DROP POLICY IF EXISTS "Admins can manage staff" ON staff_accounts;
DROP POLICY IF EXISTS "Staff can view own account" ON staff_accounts;
DROP POLICY IF EXISTS "Allow all reads" ON staff_accounts;
DROP POLICY IF EXISTS "Allow all writes" ON staff_accounts;

-- Ensure tables exist with correct structure
CREATE TABLE IF NOT EXISTS pharmacies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pharmacy_id UUID REFERENCES pharmacies(id),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'technician',
    phone TEXT,
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{"view_patients": true, "edit_patients": false, "delete_patients": false, "send_messages": true, "view_analytics": false, "manage_staff": false, "system_settings": false}'::jsonb,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staff_accounts(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_time TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id TEXT, -- Can be 'admin' or UUID
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create default pharmacy if none exists
INSERT INTO pharmacies (name, address, phone, email, is_active)
SELECT 'Narayan Pharmacy', 'Main Branch', '+1-555-0100', 'info@narayanpharmacy.com', true
WHERE NOT EXISTS (SELECT 1 FROM pharmacies WHERE name = 'Narayan Pharmacy');

-- Grant necessary permissions (ensure public can access these tables)
GRANT ALL ON pharmacies TO anon, authenticated;
GRANT ALL ON staff_accounts TO anon, authenticated;
GRANT ALL ON staff_sessions TO anon, authenticated;
GRANT ALL ON audit_log TO anon, authenticated;

-- Add comments
COMMENT ON TABLE staff_accounts IS 'Staff accounts with RLS disabled for custom authentication';
COMMENT ON TABLE pharmacies IS 'Pharmacy locations';
COMMENT ON TABLE staff_sessions IS 'Active staff login sessions';
COMMENT ON TABLE audit_log IS 'System audit trail'; 