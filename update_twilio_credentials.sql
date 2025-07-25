-- Update existing Twilio phone number credentials with new auth token
-- Run this in Supabase SQL Editor to update the rotated credentials

-- Update main pharmacy line
UPDATE twilio_phone_numbers 
SET twilio_auth_token = '467735fdc396abfca88f9992aae30dc5'
WHERE phone_number = '+19142221900';

-- Update New Rochelle location if it exists
UPDATE twilio_phone_numbers 
SET twilio_auth_token = '467735fdc396abfca88f9992aae30dc5'
WHERE phone_number = '+19143657099';

-- Verify the updates
SELECT phone_number, display_name, twilio_account_sid, 
       LEFT(twilio_auth_token, 8) || '...' as auth_token_preview,
       is_active, is_primary
FROM twilio_phone_numbers
ORDER BY is_primary DESC; 