-- Trading Journal — database schema
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query)

-- 1. Trades table
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Core trade info
  trade_date date not null default current_date,
  symbol text not null,                     -- e.g. NAS100, XAUUSD, EURUSD
  direction text not null check (direction in ('buy', 'sell')),
  entry_price numeric not null,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  lot_size numeric not null,

  -- Risk & result
  risk_amount numeric,                      -- $ risked on this trade
  planned_rr numeric,                       -- planned reward:risk e.g. 3 for 1:3
  result_amount numeric,                    -- auto-calculated P/L in $, can be overridden
  result_rr numeric,                        -- actual R multiple achieved

  -- Strategy context
  setup_type text,                          -- e.g. '10am-fvg', 'powell-model'
  session text,                             -- e.g. 'London', 'New York'
  followed_rules boolean default true,      -- did this trade follow your system?
  emotional_state text,                     -- e.g. 'calm', 'fomo', 'confident', 'revenge-tempted'

  -- Notes & media
  notes text,
  screenshot_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Keep updated_at fresh on every edit
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trades_set_updated_at on public.trades;
create trigger trades_set_updated_at
  before update on public.trades
  for each row execute function public.set_updated_at();

-- 3. Row Level Security — each user only ever sees their own trades
alter table public.trades enable row level security;

drop policy if exists "Users can view own trades" on public.trades;
create policy "Users can view own trades"
  on public.trades for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own trades" on public.trades;
create policy "Users can insert own trades"
  on public.trades for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own trades" on public.trades;
create policy "Users can update own trades"
  on public.trades for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own trades" on public.trades;
create policy "Users can delete own trades"
  on public.trades for delete
  using (auth.uid() = user_id);

-- 4. Helpful index for calendar/analytics queries
create index if not exists trades_user_date_idx on public.trades (user_id, trade_date);

-- 5. Storage bucket for trade screenshots (run separately if it errors — buckets are
-- sometimes easier to create via Storage -> New bucket in the dashboard UI instead)
insert into storage.buckets (id, name, public)
values ('trade-screenshots', 'trade-screenshots', true)
on conflict (id) do nothing;

-- Storage policies: users can only upload/view/delete files inside their own folder
-- (we'll store files as: trade-screenshots/<user_id>/<filename>)
drop policy if exists "Users can upload own screenshots" on storage.objects;
create policy "Users can upload own screenshots"
  on storage.objects for insert
  with check (
    bucket_id = 'trade-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can view own screenshots" on storage.objects;
create policy "Users can view own screenshots"
  on storage.objects for select
  using (bucket_id = 'trade-screenshots');

drop policy if exists "Users can delete own screenshots" on storage.objects;
create policy "Users can delete own screenshots"
  on storage.objects for delete
  using (
    bucket_id = 'trade-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
