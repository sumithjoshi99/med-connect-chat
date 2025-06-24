-- Drop existing tables and policies to start fresh
DROP POLICY IF EXISTS "Allow all operations on patients" ON patients;
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS patients;

-- Create patients table
CREATE TABLE patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    preferred_channel TEXT DEFAULT 'sms',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    channel TEXT DEFAULT 'sms',
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    content TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    sender_name TEXT,
    external_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_messages_patient_id ON messages(patient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_patients_phone ON patients(phone);

-- Disable RLS for now to get it working
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Insert a test patient to verify it works
INSERT INTO patients (name, phone, email, preferred_channel, status) 
VALUES ('Test Patient', '+1234567890', 'test@example.com', 'sms', 'active'); 