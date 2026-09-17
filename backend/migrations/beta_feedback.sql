-- Feedback dos testers do beta/teste grátis. Ver feedbackController.ts (POST público)
-- e adminController/AdminSidebar (GET protegido em /admin/feedback).
create table if not exists beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  name text,
  email text,
  overall_rating integer,
  ease_rating integer,
  liked text,
  confusing text,
  had_error boolean,
  error_description text,
  improvements text,
  page_url text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_beta_feedback_created_at on beta_feedback(created_at desc);
