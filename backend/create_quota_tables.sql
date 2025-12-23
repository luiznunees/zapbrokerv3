-- Create Weekly Quotas Table
CREATE TABLE IF NOT EXISTS weekly_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    plan_limit INTEGER NOT NULL,
    messages_used INTEGER DEFAULT 0,
    messages_remaining INTEGER NOT NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_quotas_user_week ON weekly_quotas(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_quotas_status ON weekly_quotas(status);

-- Create Quota Transactions Table
CREATE TABLE IF NOT EXISTS quota_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    weekly_quota_id UUID NOT NULL REFERENCES weekly_quotas(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    message_count INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('USAGE', 'RENEWAL', 'REFUND')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Optional but good practice)
ALTER TABLE weekly_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotas" ON weekly_quotas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" ON quota_transactions
    FOR SELECT USING (auth.uid() = user_id);
