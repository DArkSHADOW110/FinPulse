-- FinPulse Supabase database setup
-- Copy this whole file into Supabase Dashboard > SQL Editor > New query > Run.

create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  image text,
  google_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  linked_account_id uuid references public.linked_accounts(id) on delete set null,
  type text not null check (type in ('credit', 'debit', 'transfer', 'bill', 'topup')),
  amount numeric(18, 2) not null check (amount >= 0),
  currency text not null default 'LKR',
  counterparty text,
  remark text,
  category text,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  metadata jsonb not null default '{}',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.jars (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  target_amount numeric(18, 2),
  balance numeric(18, 2) not null default 0,
  actual_saved numeric(18, 2) not null default 0,
  virtual_saved numeric(18, 2) not null default 0,
  color text not null default '#33a1ff',
  icon text not null default 'piggy-bank',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null,
  contact_type text not null check (contact_type in ('bank', 'bill', 'mobile')),
  account_number text not null,
  bank_code text,
  provider text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scheduled_payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  linked_account_id uuid references public.linked_accounts(id) on delete set null,
  label text not null,
  amount numeric(18, 2) not null check (amount >= 0),
  currency text not null default 'LKR',
  day_of_month int not null default 1 check (day_of_month between 1 and 28),
  is_active boolean not null default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  tool_calls jsonb,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_linked_accounts_user on public.linked_accounts(user_id);
create index if not exists idx_transactions_user on public.transactions(user_id);
create index if not exists idx_transactions_occurred on public.transactions(occurred_at desc);
create index if not exists idx_jars_user on public.jars(user_id);
create index if not exists idx_contacts_user on public.contacts(user_id);
create index if not exists idx_contacts_type on public.contacts(user_id, contact_type);
create index if not exists idx_scheduled_payments_user on public.scheduled_payments(user_id);
create index if not exists idx_scheduled_payments_next on public.scheduled_payments(next_run_at) where is_active = true;
create index if not exists idx_chat_messages_user on public.chat_messages(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_linked_accounts_updated_at on public.linked_accounts;
create trigger set_linked_accounts_updated_at before update on public.linked_accounts
for each row execute function public.set_updated_at();

drop trigger if exists set_jars_updated_at on public.jars;
create trigger set_jars_updated_at before update on public.jars
for each row execute function public.set_updated_at();

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at before update on public.contacts
for each row execute function public.set_updated_at();

drop trigger if exists set_scheduled_payments_updated_at on public.scheduled_payments;
create trigger set_scheduled_payments_updated_at before update on public.scheduled_payments
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.linked_accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.jars enable row level security;
alter table public.contacts enable row level security;
alter table public.scheduled_payments enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
for select using (auth.uid()::text = id::text);

drop policy if exists "linked_accounts_own" on public.linked_accounts;
create policy "linked_accounts_own" on public.linked_accounts
for all using (auth.uid() = user_id);

drop policy if exists "transactions_own" on public.transactions;
create policy "transactions_own" on public.transactions
for all using (auth.uid() = user_id);

drop policy if exists "jars_own" on public.jars;
create policy "jars_own" on public.jars
for all using (auth.uid() = user_id);

drop policy if exists "contacts_own" on public.contacts;
create policy "contacts_own" on public.contacts
for all using (auth.uid() = user_id);

drop policy if exists "scheduled_payments_own" on public.scheduled_payments;
create policy "scheduled_payments_own" on public.scheduled_payments
for all using (auth.uid() = user_id);

drop policy if exists "chat_messages_own" on public.chat_messages;
create policy "chat_messages_own" on public.chat_messages
for all using (auth.uid() = user_id);

-- The Next.js API routes use SUPABASE_SERVICE_ROLE_KEY, so they can safely
-- write these tables on behalf of the authenticated NextAuth user.
