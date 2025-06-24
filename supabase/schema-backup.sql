-- Enhanced schema for comprehensive SMS functionality

-- SMS Templates table
CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'custom',
    variables JSONB DEFAULT '[]'::jsonb,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- SMS Campaigns table
CREATE TABLE IF NOT EXISTS sms_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES sms_templates(id),
    message_content TEXT NOT NULL,
    recipient_groups JSONB DEFAULT '[]'::jsonb,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft',
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    response_count INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Recipient Groups table
CREATE TABLE IF NOT EXISTS recipient_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    filter_criteria JSONB DEFAULT '{}'::jsonb,
    patient_count INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Group Members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES recipient_groups(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, patient_id)
);

-- Automation Rules table
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_conditions JSONB DEFAULT '{}'::jsonb,
    message_template TEXT NOT NULL,
    timing JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    total_sent INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Automation Sequences table
CREATE TABLE IF NOT EXISTS automation_sequences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    enrolled_patients INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Automation Sequence Steps table
CREATE TABLE IF NOT EXISTS automation_sequence_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sequence_id UUID REFERENCES automation_sequences(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    delay_days INTEGER DEFAULT 0,
    message_template TEXT NOT NULL,
    condition_criteria JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient Sequence Enrollments table
CREATE TABLE IF NOT EXISTS patient_sequence_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    sequence_id UUID REFERENCES automation_sequences(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(patient_id, sequence_id)
);

-- Automation Logs table
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID REFERENCES automation_rules(id),
    sequence_id UUID REFERENCES automation_sequences(id),
    patient_id UUID REFERENCES patients(id),
    message_content TEXT NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    sent_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    external_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulk SMS Jobs table
CREATE TABLE IF NOT EXISTS bulk_sms_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES sms_campaigns(id),
    status VARCHAR(50) DEFAULT 'pending',
    total_recipients INTEGER NOT NULL,
    processed_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Analytics table (for daily aggregates)
CREATE TABLE IF NOT EXISTS sms_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    channel VARCHAR(50) DEFAULT 'sms',
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    total_responses INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    unique_recipients INTEGER DEFAULT 0,
    opt_outs INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, channel)
);

-- Patient Preferences table (enhanced)
CREATE TABLE IF NOT EXISTS patient_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE UNIQUE,
    preferred_channels JSONB DEFAULT '["sms"]'::jsonb,
    communication_frequency VARCHAR(50) DEFAULT 'normal',
    opt_in_marketing BOOLEAN DEFAULT false,
    opt_in_reminders BOOLEAN DEFAULT true,
    opt_in_notifications BOOLEAN DEFAULT true,
    quiet_hours JSONB DEFAULT '{"start": "22:00", "end": "08:00"}'::jsonb,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    language_preference VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opt-out Requests table
CREATE TABLE IF NOT EXISTS opt_out_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),
    phone_number VARCHAR(20) NOT NULL,
    request_type VARCHAR(50) NOT NULL, -- 'all', 'marketing', 'reminders'
    source VARCHAR(50) DEFAULT 'sms', -- 'sms', 'web', 'phone'
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Status Tracking (enhanced messages table)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES sms_templates(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES sms_campaigns(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS automation_rule_id UUID REFERENCES automation_rules(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS cost DECIMAL(8,4) DEFAULT 0;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS error_code VARCHAR(20);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS carrier_info JSONB;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Patient Tags table
CREATE TABLE IF NOT EXISTS patient_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(patient_id, tag)
);

-- Message Reactions table (for response tracking)
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id),
    reaction_type VARCHAR(50), -- 'thumbs_up', 'thumbs_down', 'heart', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Audit Log
CREATE TABLE IF NOT EXISTS compliance_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_patient_id ON messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_direction_read ON messages(direction, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON messages(campaign_id);

CREATE INDEX IF NOT EXISTS idx_sms_templates_category ON sms_templates(category);
CREATE INDEX IF NOT EXISTS idx_sms_templates_is_active ON sms_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_sms_campaigns_status ON sms_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_sms_campaigns_scheduled_date ON sms_campaigns(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger_type ON automation_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_is_active ON automation_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_automation_logs_patient_id ON automation_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_scheduled_date ON automation_logs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(status);

CREATE INDEX IF NOT EXISTS idx_sms_analytics_date ON sms_analytics(date);
CREATE INDEX IF NOT EXISTS idx_sms_analytics_channel ON sms_analytics(channel);

CREATE INDEX IF NOT EXISTS idx_patient_tags_patient_id ON patient_tags(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_tags_tag ON patient_tags(tag);

-- Create functions for analytics
CREATE OR REPLACE FUNCTION update_sms_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily analytics when a message is inserted or updated
    INSERT INTO sms_analytics (date, channel, total_sent, total_delivered, total_failed)
    VALUES (
        CURRENT_DATE,
        NEW.channel,
        CASE WHEN NEW.direction = 'outbound' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END
    )
    ON CONFLICT (date, channel) DO UPDATE SET
        total_sent = sms_analytics.total_sent + CASE WHEN NEW.direction = 'outbound' THEN 1 ELSE 0 END,
        total_delivered = sms_analytics.total_delivered + CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END,
        total_failed = sms_analytics.total_failed + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for analytics
DROP TRIGGER IF EXISTS trigger_update_sms_analytics ON messages;
CREATE TRIGGER trigger_update_sms_analytics
    AFTER INSERT OR UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_sms_analytics();

-- Function to update template usage count
CREATE OR REPLACE FUNCTION update_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.template_id IS NOT NULL THEN
        UPDATE sms_templates 
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id = NEW.template_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for template usage
DROP TRIGGER IF EXISTS trigger_update_template_usage ON messages;
CREATE TRIGGER trigger_update_template_usage
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_template_usage();

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

-- RLS Policies
-- Temporarily disable RLS for development
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipient_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE opt_out_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies (authenticated users can access their organization's data)
CREATE POLICY "Users can view SMS templates" ON sms_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create SMS templates" ON sms_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update SMS templates" ON sms_templates
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Similar policies for other tables...
CREATE POLICY "Users can access campaigns" ON sms_campaigns
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can access recipient groups" ON recipient_groups
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can access automation rules" ON automation_rules
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can access automation sequences" ON automation_sequences
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can access patient preferences" ON patient_preferences
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can access patient tags" ON patient_tags
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert some default templates
INSERT INTO sms_templates (name, content, category, variables) VALUES
(
    'Appointment Reminder',
    'Hi {{patient_name}}, this is a reminder for your appointment on {{appointment_date}} at {{appointment_time}} with {{doctor_name}}. Please reply CONFIRM or call {{pharmacy_phone}} if you need to reschedule.',
    'appointment',
    '["patient_name", "appointment_date", "appointment_time", "doctor_name", "pharmacy_phone"]'::jsonb
),
(
    'Prescription Ready',
    '{{patient_name}}, your prescription {{medication_name}} is ready for pickup at {{pharmacy_name}}. Store hours: {{store_hours}}. Questions? Call {{pharmacy_phone}}.',
    'prescription',
    '["patient_name", "medication_name", "pharmacy_name", "store_hours", "pharmacy_phone"]'::jsonb
),
(
    'Refill Reminder',
    'Time to refill your {{medication_name}}! You have {{refills_remaining}} refills remaining. Call {{pharmacy_phone}} or use our app to request a refill.',
    'reminder',
    '["medication_name", "refills_remaining", "pharmacy_phone"]'::jsonb
),
(
    'Welcome Message',
    'Welcome to {{pharmacy_name}}! We''re here to help with all your healthcare needs. Save our number and text us anytime. Reply STOP to opt out.',
    'custom',
    '["pharmacy_name"]'::jsonb
)
ON CONFLICT DO NOTHING; 