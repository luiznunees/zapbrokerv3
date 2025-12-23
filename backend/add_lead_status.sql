-- Add lead_status column to campaign_messages table
ALTER TABLE campaign_messages 
ADD COLUMN lead_status VARCHAR(50) DEFAULT 'PENDING';

-- Create an index for faster kanban queries
CREATE INDEX idx_campaign_messages_lead_status ON campaign_messages(lead_status);
CREATE INDEX idx_campaign_messages_campaign_id_lead_status ON campaign_messages(campaign_id, lead_status);
