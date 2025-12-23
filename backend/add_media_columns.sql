ALTER TABLE campaigns 
ADD COLUMN media_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'video', 'audio', 'document'
ADD COLUMN media_url TEXT;
