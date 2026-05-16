alter table public.jars
  add column if not exists actual_saved numeric(18, 2) not null default 0,
  add column if not exists virtual_saved numeric(18, 2) not null default 0,
  add column if not exists metadata jsonb not null default '{}';

update public.jars
set actual_saved = balance
where actual_saved = 0
  and virtual_saved = 0
  and balance > 0;
