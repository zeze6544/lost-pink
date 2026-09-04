-- Run in Supabase SQL editor when ready for production storage.
create table if not exists public.pages (
  id uuid primary key,
  slug text not null unique,
  word text not null,
  line text,
  palette text not null default 'soft'
    check (palette in ('soft', 'bloom', 'dusk', 'ink', 'pearl', 'veil', 'wine', 'gilt')),
  treatment text not null default 'display'
    check (treatment in ('display', 'whisper', 'shout')),
  motif text not null default 'grain'
    check (motif in ('grain', 'plain', 'grid', 'echo')),
  font text not null default 'fraunces'
    check (font in (
      'fraunces', 'playfair', 'cormorant', 'instrument',
      'outfit', 'plex', 'vibes', 'newsreader'
    )),
  bg_url text,
  token_url text,
  found_count integer not null default 0,
  status text not null check (status in ('free', 'kept')),
  expires_at timestamptz,
  polar_order_id text,
  created_at timestamptz not null default now(),
  owner_id uuid references auth.users (id) on delete set null,
  email_local text,
  mailbox_status text not null default 'none'
    check (mailbox_status in ('none', 'pending', 'live', 'dark')),
  mailbox_expires_at timestamptz,
  mailbox_polar_order_id text,
  mailbox_recovery_email text,
  updated_at timestamptz not null default now(),
  constraint pages_email_local_format
    check (email_local is null or email_local ~ '^[a-z0-9]{2,16}$')
);

-- v1 → shrine columns (no-op if the table was created with the schema above)
alter table public.pages add column if not exists line text;
alter table public.pages add column if not exists palette text;
alter table public.pages add column if not exists treatment text;
alter table public.pages add column if not exists motif text;
alter table public.pages add column if not exists font text;
alter table public.pages add column if not exists bg_url text;
alter table public.pages add column if not exists token_url text;
alter table public.pages add column if not exists found_count integer;
alter table public.pages add column if not exists owner_id uuid references auth.users (id) on delete set null;
alter table public.pages add column if not exists email_local text;
alter table public.pages add column if not exists mailbox_status text;
alter table public.pages add column if not exists mailbox_expires_at timestamptz;
alter table public.pages add column if not exists mailbox_polar_order_id text;
alter table public.pages add column if not exists mailbox_recovery_email text;
alter table public.pages add column if not exists updated_at timestamptz;

update public.pages set palette = coalesce(palette, 'soft');
update public.pages set treatment = coalesce(treatment, 'display');
update public.pages set motif = coalesce(motif, 'grain');
update public.pages set font = coalesce(font, 'fraunces');
update public.pages set found_count = coalesce(found_count, 0);
update public.pages set mailbox_status = coalesce(mailbox_status, 'none');

alter table public.pages alter column palette set default 'soft';
alter table public.pages alter column treatment set default 'display';
alter table public.pages alter column motif set default 'grain';
alter table public.pages alter column font set default 'fraunces';
alter table public.pages alter column found_count set default 0;
alter table public.pages alter column palette set not null;
alter table public.pages alter column treatment set not null;
alter table public.pages alter column motif set not null;
alter table public.pages alter column font set not null;
alter table public.pages alter column found_count set not null;

do $$ begin
  alter table public.pages drop constraint if exists pages_mailbox_status_check;
  alter table public.pages add constraint pages_mailbox_status_check
    check (mailbox_status in ('none', 'pending', 'live', 'dark'));
exception when duplicate_object then null;
end $$;

alter table public.pages alter column mailbox_status set default 'none';
alter table public.pages alter column mailbox_status set not null;

create index if not exists pages_expires_idx
  on public.pages (expires_at)
  where status = 'free';

create unique index if not exists pages_email_local_uidx
  on public.pages (email_local)
  where email_local is not null;

create index if not exists pages_mailbox_due_idx
  on public.pages (mailbox_expires_at)
  where mailbox_status = 'live';

create index if not exists pages_owner_id_idx
  on public.pages (owner_id)
  where owner_id is not null;

alter table public.pages enable row level security;

drop policy if exists "Public can read active pages" on public.pages;
create policy "Public can read active pages"
  on public.pages
  for select
  to anon, authenticated
  using (
    status = 'kept'
    or (status = 'free' and expires_at is not null and expires_at > now())
  );

drop policy if exists "Owners can read their pages" on public.pages;
create policy "Owners can read their pages"
  on public.pages
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Owners can update their pages" on public.pages;
create policy "Owners can update their pages"
  on public.pages
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create table if not exists public.page_claims (
  page_id uuid primary key references public.pages (id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.page_claims enable row level security;
revoke all on table public.page_claims from anon, authenticated;
grant all on table public.page_claims to service_role;

-- Photos. Uploads go through the server (service role). Public read for shrine pages.
insert into storage.buckets (id, name, public)
values ('shrine-images', 'shrine-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read shrine images" on storage.objects;
create policy "Public read shrine images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'shrine-images');

-- Paid inbox lifecycle. Service role only. Public pages keep alias + display/open.
create table if not exists public.mailboxes (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null unique references public.pages (id) on delete cascade,
  email_local text not null,
  status text not null
    check (status in ('checkout_started', 'provisioning', 'live', 'failed', 'dark')),
  plan_type text not null default 'once'
    check (plan_type in ('once', 'subscription', 'month', 'day')),
  paid_through timestamptz,
  recovery_email text,
  polar_customer_id text,
  polar_subscription_id text,
  polar_checkout_id text,
  checkout_expires_at timestamptz,
  provision_step text
    check (provision_step in ('payment_received', 'creating_inbox', 'invitation_sent')),
  provision_attempts integer not null default 0,
  provision_retry_at timestamptz,
  last_error text,
  disable_reason text
    check (disable_reason in ('cancelled', 'refunded', 'renewal_failed', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mailboxes_email_local_format
    check (email_local ~ '^[a-z0-9]{2,16}$')
);

create unique index if not exists mailboxes_email_local_uidx
  on public.mailboxes (email_local);

create index if not exists mailboxes_retry_idx
  on public.mailboxes (provision_retry_at)
  where status in ('provisioning', 'failed') and provision_retry_at is not null;

create index if not exists mailboxes_paid_through_idx
  on public.mailboxes (paid_through)
  where status = 'live';

create index if not exists mailboxes_checkout_expires_idx
  on public.mailboxes (checkout_expires_at)
  where status = 'checkout_started';

create table if not exists public.mailbox_payments (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid not null references public.mailboxes (id) on delete cascade,
  polar_event_id text,
  polar_order_id text,
  polar_checkout_id text,
  polar_subscription_id text,
  kind text not null
    check (kind in ('purchase', 'renewal', 'refund', 'cancel', 'revoke', 'failed_renewal')),
  processed_at timestamptz not null default now()
);

create unique index if not exists mailbox_payments_order_uidx
  on public.mailbox_payments (polar_order_id)
  where polar_order_id is not null;

create unique index if not exists mailbox_payments_event_uidx
  on public.mailbox_payments (polar_event_id)
  where polar_event_id is not null;

create unique index if not exists mailbox_payments_checkout_purchase_uidx
  on public.mailbox_payments (polar_checkout_id)
  where polar_checkout_id is not null and kind = 'purchase';

create index if not exists mailbox_payments_mailbox_idx
  on public.mailbox_payments (mailbox_id, processed_at desc);

create table if not exists public.mailbox_notifications (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid not null references public.mailboxes (id) on delete cascade,
  kind text not null,
  sent_at timestamptz,
  failed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (mailbox_id, kind)
);

create index if not exists mailbox_notifications_retry_idx
  on public.mailbox_notifications (failed_at)
  where sent_at is null and failed_at is not null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'pages'
      and column_name = 'mailbox_recovery_email'
  ) then
    insert into public.mailboxes (
      page_id,
      email_local,
      status,
      plan_type,
      paid_through,
      recovery_email
    )
    select
      p.id,
      p.email_local,
      case
        when p.mailbox_status = 'live' then 'live'
        when p.mailbox_status = 'pending' then 'provisioning'
        else 'dark'
      end,
      'once',
      p.mailbox_expires_at,
      nullif(p.mailbox_recovery_email, '')
    from public.pages p
    where p.email_local is not null
      and p.mailbox_status in ('pending', 'live', 'dark')
      and not exists (
        select 1 from public.mailboxes m where m.page_id = p.id
      );
  end if;
end $$;

do $$ begin
  alter table public.pages drop constraint if exists pages_mailbox_status_check;
  update public.pages
  set mailbox_status = case
    when mailbox_status in ('live', 'open') then 'open'
    when email_local is not null then 'display'
    else 'none'
  end;
  alter table public.pages add constraint pages_mailbox_status_check
    check (mailbox_status in ('none', 'display', 'open'));
exception when duplicate_object then null;
end $$;

drop index if exists pages_mailbox_due_idx;
create index if not exists pages_mailbox_open_idx
  on public.pages (mailbox_expires_at)
  where mailbox_status = 'open';

alter table public.pages drop column if exists mailbox_recovery_email;
alter table public.pages drop column if exists mailbox_polar_order_id;

alter table public.mailboxes enable row level security;
alter table public.mailbox_payments enable row level security;
alter table public.mailbox_notifications enable row level security;

revoke all on table public.mailboxes from public, anon, authenticated;
revoke all on table public.mailbox_payments from public, anon, authenticated;
revoke all on table public.mailbox_notifications from public, anon, authenticated;
grant all on table public.mailboxes to service_role;
grant all on table public.mailbox_payments to service_role;
grant all on table public.mailbox_notifications to service_role;

alter table public.mailboxes drop constraint if exists mailboxes_status_check;
alter table public.mailboxes add constraint mailboxes_status_check
  check (status in ('checkout_started', 'awaiting_account', 'provisioning', 'live', 'failed', 'dark'));

alter table public.mailboxes add column if not exists display_name text;
alter table public.mailboxes add column if not exists phone text;
alter table public.mailboxes add column if not exists owner_id uuid;
alter table public.mailboxes add column if not exists password_secret text;
alter table public.mailboxes add column if not exists phone_verified_at timestamptz;

create index if not exists mailboxes_owner_idx on public.mailboxes (owner_id)
  where owner_id is not null;
