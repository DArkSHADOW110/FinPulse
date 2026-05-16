-- FinPulse initial schema
-- Run in Supabase SQL editor or via supabase db push

create extension if not exists "uuid-ossp";

-- Users (synced from NextAuth Google OAuth)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  image text,
  google_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Linked bank accounts (multi-bank; provider identifies adapter)
create table if not exists public.linked_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null default 'seylan',
  external_account_id text,
  account_name text not null,
  account_number text not null,
  account_type text not null default 'checking',
  currency text not null default 'LKR',
  balance numeric(18, 2) not null default 0,
  is_primary boolean not null default false,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_linked_accounts_user on public.linked_accounts(user_id);

-- Transactions
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  linked_account_id uuid references public.linked_accounts(id) on delete set null,
  type text not null check (type in ('credit', 'debit', 'transfer', 'bill', 'topup')),
  amount numeric(18, 2) not null,
  currency text not null default 'LKR',
  counterparty text,
  remark text,
  category text,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  metadata jsonb default '{}',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user on public.transactions(user_id);
create index if not exists idx_transactions_occurred on public.transactions(occurred_at desc);

-- Virtual savings jars
create table if not exists public.jars (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  target_amount numeric(18, 2),
  balance numeric(18, 2) not null default 0,
  color text default '#33a1ff',
  icon text default 'piggy-bank',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_jars_user on public.jars(user_id);

-- Reusable contacts
create table if not exists public.contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null,
  contact_type text not null check (contact_type in ('bank', 'bill', 'mobile')),
  account_number text not null,
  bank_code text,
  provider text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_user on public.contacts(user_id);

-- Scheduled recurring payments
create table if not exists public.scheduled_payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  linked_account_id uuid references public.linked_accounts(id) on delete set null,
  label text not null,
  amount numeric(18, 2) not null,
  currency text not null default 'LKR',
  day_of_month int not null check (day_of_month between 1 and 28),
  is_active boolean not null default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_scheduled_payments_user on public.scheduled_payments(user_id);
create index if not exists idx_scheduled_payments_next on public.scheduled_payments(next_run_at) where is_active = true;

-- Chat history
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  tool_calls jsonb,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_user on public.chat_messages(user_id, created_at desc);

-- RLS: service role used from API routes; enable RLS for future client access
alter table public.users enable row level security;
alter table public.linked_accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.jars enable row level security;
alter table public.contacts enable row level security;
alter table public.scheduled_payments enable row level security;
alter table public.chat_messages enable row level security;

-- Policies: users can only access own rows (when using anon key + JWT custom claims later)
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users for select using (auth.uid()::text = id::text);

drop policy if exists "linked_accounts_own" on public.linked_accounts;
create policy "linked_accounts_own" on public.linked_accounts for all using (auth.uid() = user_id);

drop policy if exists "transactions_own" on public.transactions;
create policy "transactions_own" on public.transactions for all using (auth.uid() = user_id);

drop policy if exists "jars_own" on public.jars;
create policy "jars_own" on public.jars for all using (auth.uid() = user_id);

drop policy if exists "contacts_own" on public.contacts;
create policy "contacts_own" on public.contacts for all using (auth.uid() = user_id);

drop policy if exists "scheduled_payments_own" on public.scheduled_payments;
create policy "scheduled_payments_own" on public.scheduled_payments for all using (auth.uid() = user_id);

drop policy if exists "chat_messages_own" on public.chat_messages;
create policy "chat_messages_own" on public.chat_messages for all using (auth.uid() = user_id);
