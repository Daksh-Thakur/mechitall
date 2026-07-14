-- Discussion replies table for threaded community discussions
create table if not exists discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references discussions(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table discussion_replies enable row level security;

create policy "Public read replies"
  on discussion_replies for select using (true);

create policy "Authenticated users can reply"
  on discussion_replies for insert
  with check (true);
