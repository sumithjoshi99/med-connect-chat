-- Add is_read column and related fields for unread message tracking
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_direction_read ON messages(direction, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_delivery_status ON messages(delivery_status);

-- Update existing messages to have proper is_read values
UPDATE messages SET is_read = true WHERE direction = 'outbound';
UPDATE messages SET is_read = false WHERE direction = 'inbound';

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
DROP TRIGGER IF EXISTS trigger_handle_message_read_status ON messages;
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