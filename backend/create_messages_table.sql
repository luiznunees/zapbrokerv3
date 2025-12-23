-- Add status to contacts if not exists (or use a dedicated leads table, but contacts is fine for now)
ALTER TABLE contacts 
ADD COLUMN status VARCHAR(50) DEFAULT 'New', -- 'New', 'Sent', 'Replied', 'Interested', 'Closed'
ADD COLUMN last_interaction_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN unread_count INTEGER DEFAULT 0;

-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    instance_id UUID REFERENCES instances(id), -- Optional, good for multi-tenancy
    evolution_id VARCHAR(255), -- ID from Evolution API
    remote_jid VARCHAR(255), -- WhatsApp ID (phone@s.whatsapp.net)
    from_me BOOLEAN DEFAULT false,
    type VARCHAR(50) DEFAULT 'text', -- text, image, audio, etc.
    content TEXT,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false
);

-- Index for faster inbox loading
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
