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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(50)
);

-- Create indexes
CREATE INDEX idx_messages_patient_id ON messages(patient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_direction_read ON messages(direction, is_read);
CREATE INDEX idx_messages_delivery_status ON messages(delivery_status);

-- Disable RLS for now to get it working
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Enable realtime for messages table
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Function to handle message read status
CREATE OR REPLACE FUNCTION handle_message_read_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark outbound messages as read by default
    IF NEW.direction = 'outbound' THEN
        NEW.is_read = true;
        NEW.read_at = NOW();
    END IF;
    
    -- If read_at is set, mark as read
    IF NEW.read_at IS NOT NULL AND NEW.is_read = false THEN
        NEW.is_read = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to handle read status
CREATE TRIGGER trigger_handle_message_read_status
    BEFORE INSERT OR UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_message_read_status();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_patient_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE messages 
  SET is_read = true, read_at = NOW()
  WHERE patient_id = p_patient_id 
    AND direction = 'inbound' 
    AND (is_read IS NULL OR is_read = false);
END;
$$ LANGUAGE plpgsql;

-- Insert a test patient to verify it works
INSERT INTO patients (name, phone, email, preferred_channel, status) 
VALUES ('Test Patient', '+1234567890', 'test@example.com', 'sms', 'active'); 