create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

create policy "Users can read their push subscriptions"
  on push_subscriptions
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their push subscriptions"
  on push_subscriptions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their push subscriptions"
  on push_subscriptions
  for delete
  using (auth.uid() = user_id);

create table if not exists push_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  loan_id uuid references loans(id) on delete cascade,
  type text not null,
  payload jsonb,
  sent_at timestamptz not null default now()
);

create unique index if not exists push_notifications_unique_event_idx
  on push_notifications(loan_id, type);

create index if not exists push_notifications_user_id_idx
  on push_notifications(user_id);

alter table push_notifications enable row level security;

create policy "Users can read their push notifications"
  on push_notifications
  for select
  using (auth.uid() = user_id);
