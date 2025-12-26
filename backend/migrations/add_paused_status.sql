-- Add PAUSED to campaign_status enum if it exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
        -- Create the enum if it doesn't exist (unlikely but safe)
        CREATE TYPE campaign_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED');
    ELSE
        -- Add PAUSED to existing enum
        ALTER TYPE campaign_status ADD VALUE IF NOT EXISTS 'PAUSED';
    END IF;
END$$;
