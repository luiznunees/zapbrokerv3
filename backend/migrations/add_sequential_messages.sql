-- Add sequential message fields to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS sequential_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS message_blocks JSONB,
ADD COLUMN IF NOT EXISTS block_delay INTEGER DEFAULT 5;

-- Add comments
COMMENT ON COLUMN campaigns.sequential_mode IS 'Enable sequential message sending (picotadas)';
COMMENT ON COLUMN campaigns.message_blocks IS 'Array of message blocks to send sequentially';
COMMENT ON COLUMN campaigns.block_delay IS 'Delay in seconds between each message block';
