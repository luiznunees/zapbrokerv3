-- Add message_variations column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS message_variations JSONB;

-- Migrate existing data (copy message to message_variations as single-item array)
UPDATE campaigns 
SET message_variations = jsonb_build_array(message)
WHERE message_variations IS NULL AND message IS NOT NULL;

-- Add comment
COMMENT ON COLUMN campaigns.message_variations IS 'Array of message variations for random selection during campaign execution';
