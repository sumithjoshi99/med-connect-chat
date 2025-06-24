-- Migration: Add Staff Accounts and User Management
-- This migration adds user management functionality without affecting existing tables

-- Create staff_accounts table for pharmacy staff management
CREATE TABLE staff_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pharmacy_id UUID NOT NULL, -- Reference to pharmacy/organization
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'pharmacist', 'technician', 'customer_service', 'manager')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    phone TEXT,
    hire_date DATE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pharmacies table for multi-organization support
CREATE TABLE pharmacies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    license_number TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff_sessions table for login tracking
CREATE TABLE staff_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staff_accounts(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_time TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Create audit_log table for admin actions
CREATE TABLE audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staff_accounts(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_staff_accounts_pharmacy_id ON staff_accounts(pharmacy_id);
CREATE INDEX idx_staff_accounts_user_id ON staff_accounts(user_id);
CREATE INDEX idx_staff_accounts_email ON staff_accounts(email);
CREATE INDEX idx_staff_accounts_role ON staff_accounts(role);
CREATE INDEX idx_staff_sessions_staff_id ON staff_sessions(staff_id);
CREATE INDEX idx_audit_log_staff_id ON audit_log(staff_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Add pharmacy_id to existing patients table (optional foreign key)
ALTER TABLE patients ADD COLUMN pharmacy_id UUID REFERENCES pharmacies(id);
ALTER TABLE messages ADD COLUMN pharmacy_id UUID REFERENCES pharmacies(id);

-- Create function to update staff last login
CREATE OR REPLACE FUNCTION update_staff_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE staff_accounts 
    SET last_login = NOW(), updated_at = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last login on auth.users update
CREATE TRIGGER trigger_update_staff_last_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION update_staff_last_login();

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_staff_id UUID,
    p_action TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_log (staff_id, action, resource_type, resource_id, old_values, new_values)
    VALUES (p_staff_id, p_action, p_resource_type, p_resource_id, p_old_values, p_new_values)
    RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default pharmacy (for existing system)
INSERT INTO pharmacies (name, address, phone, email) 
VALUES ('MedConnect Pharmacy', '123 Healthcare Ave', '+1-555-0123', 'admin@medconnect.com');

-- Create default admin account (will be updated after auth setup)
-- This preserves the current "Dr. Smith" functionality
DO $$
DECLARE
    default_pharmacy_id UUID;
BEGIN
    SELECT id INTO default_pharmacy_id FROM pharmacies WHERE name = 'MedConnect Pharmacy';
    
    INSERT INTO staff_accounts (
        pharmacy_id, 
        email, 
        first_name, 
        last_name, 
        role, 
        permissions,
        is_active
    ) VALUES (
        default_pharmacy_id,
        'admin@medconnect.com',
        'Admin',
        'User',
        'admin',
        '{"all": true}'::jsonb,
        true
    );
END $$;

-- Enable RLS on new tables
ALTER TABLE staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_accounts
CREATE POLICY "Staff can view own account" ON staff_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all staff" ON staff_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_accounts sa 
            WHERE sa.user_id = auth.uid() 
            AND sa.role = 'admin' 
            AND sa.is_active = true
        )
    );

CREATE POLICY "Admins can manage staff" ON staff_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM staff_accounts sa 
            WHERE sa.user_id = auth.uid() 
            AND sa.role = 'admin' 
            AND sa.is_active = true
        )
    );

-- RLS Policies for pharmacies
CREATE POLICY "Staff can view own pharmacy" ON pharmacies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_accounts sa 
            WHERE sa.user_id = auth.uid() 
            AND sa.pharmacy_id = id
            AND sa.is_active = true
        )
    );

-- RLS Policies for audit_log
CREATE POLICY "Admins can view audit logs" ON audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM staff_accounts sa 
            WHERE sa.user_id = auth.uid() 
            AND sa.role = 'admin' 
            AND sa.is_active = true
        )
    );

-- Comments for documentation
COMMENT ON TABLE staff_accounts IS 'Pharmacy staff accounts with role-based access control';
COMMENT ON TABLE pharmacies IS 'Pharmacy/organization information for multi-tenant support';
COMMENT ON TABLE staff_sessions IS 'Login session tracking for security and analytics';
COMMENT ON TABLE audit_log IS 'Audit trail for admin actions and data changes';
COMMENT ON COLUMN staff_accounts.permissions IS 'JSONB object defining specific permissions for the staff member';
COMMENT ON COLUMN staff_accounts.role IS 'Primary role: admin, pharmacist, technician, customer_service, manager'; 