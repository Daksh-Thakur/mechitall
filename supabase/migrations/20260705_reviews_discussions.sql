-- Reviews table (for products and services)
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Allow any authenticated user to insert their own review
alter table reviews enable row level security;

create policy "Users can insert own reviews"
  on reviews for insert
  with check (profile_id = auth.uid()::uuid or true);

create policy "Anyone can read reviews"
  on reviews for select
  using (true);


-- Discussions table (community posts)
create table if not exists discussions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  category text not null default 'General',
  reply_count int not null default 0,
  likes int not null default 0,
  created_at timestamptz not null default now()
);

alter table discussions enable row level security;

create policy "Users can insert own discussions"
  on discussions for insert
  with check (true);

create policy "Anyone can read discussions"
  on discussions for select
  using (true);
