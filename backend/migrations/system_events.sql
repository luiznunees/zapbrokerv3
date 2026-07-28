-- Log de eventos real pro painel admin (substitui a gambiarra de getSystemLogs que só
-- olhava status de instances). Alimentado por eventLogService.logEvent() em vários pontos
-- do backend (auth, whatsapp, campanhas, pagamentos, ações de admin, cota).
create table if not exists system_events (
    id uuid primary key default gen_random_uuid(),
    type text not null,           -- ex: 'auth.login_failed', 'whatsapp.disconnected', 'payment.confirmed'
    severity text not null default 'info', -- info | warn | error | critical
    message text not null,
    user_id uuid references users(id) on delete set null,
    metadata jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_system_events_created_at on system_events(created_at desc);
create index if not exists idx_system_events_severity on system_events(severity);
