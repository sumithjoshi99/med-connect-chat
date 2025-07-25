# Security Setup Guide

## 🚨 Twilio Credentials Security

Your Twilio Auth Token was automatically rotated due to publicly exposed credentials. Follow these steps to secure your setup:

### 1. Get Your New Twilio Credentials

1. Log into your [Twilio Console](https://www.twilio.com/console)
2. Navigate to **Account > API Keys & Tokens**
3. Copy your new **Auth Token** (it should start with a different value than `e6187747371082339e35d4347aab9294`)
4. Your **Account SID** remains the same: `AC956237533bdb4805ba26c3191c69a858`

### 2. Update Supabase Database Credentials

Run this SQL in your Supabase SQL Editor to update the credentials:

```sql
-- Update the main pharmacy line credentials
UPDATE twilio_phone_numbers 
SET twilio_auth_token = 'YOUR_NEW_AUTH_TOKEN_HERE'
WHERE phone_number = '+19142221900';

-- If you have the secondary number, update it too
UPDATE twilio_phone_numbers 
SET twilio_auth_token = 'YOUR_NEW_AUTH_TOKEN_HERE'
WHERE phone_number = '+19143657099';
```

### 3. Environment Variables Setup

Create a `.env.local` file in your project root (this file is already excluded in `.gitignore`):

```env
# Twilio Configuration - NEVER commit these values
TWILIO_ACCOUNT_SID=AC956237533bdb4805ba26c3191c69a858
TWILIO_AUTH_TOKEN=your_new_auth_token_here
TWILIO_PHONE_NUMBER_MAIN=+19142221900
TWILIO_PHONE_NUMBER_SECONDARY=+19143657099
```

### 4. Security Best Practices

✅ **DO:**
- Store credentials in Supabase database (encrypted at rest)
- Use environment variables for local development
- Keep `.env.local` in your `.gitignore` file
- Rotate tokens regularly

❌ **DON'T:**
- Hardcode credentials in source code
- Commit `.env` files with real credentials
- Share credentials in plain text
- Use the same credentials across environments

### 5. Current Security Status

- ✅ Hardcoded credentials removed from source code
- ⏳ Database credentials need to be updated with new token
- ⏳ Test SMS functionality after update

### 6. Verification

After updating credentials, test SMS functionality:

1. Send a test message through your application
2. Check Supabase logs for any authentication errors
3. Verify message delivery in Twilio Console

### 7. Future Security

Consider setting up:
- Twilio API Keys instead of Auth Tokens (more secure)
- Webhook signature validation
- IP allowlisting in Twilio Console
- Regular credential rotation schedule 