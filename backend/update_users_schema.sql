-- Add onboarding_steps and first_message_sent columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_steps JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_message_sent BOOLEAN DEFAULT FALSE;
