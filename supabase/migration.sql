-- Run in Supabase SQL editor when ready for production storage.
create table if not exists public.pages (
  id uuid primary key,
  slug text not null unique,
  word text not null,
  line text,
  palette text not null default 'soft'
    check (palette in ('soft', 'bloom', 'dusk', 'ink', 'pearl')),
  treatment text not null default 'display'
    check (treatment in ('display', 'whisper', 'shout')),
  motif text not null default 'grain'
    check (motif in ('grain', 'plain', 'heart', 'echo')),
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
  created_at timestamptz not null default now()
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

update public.pages set palette = coalesce(palette, 'soft');
update public.pages set treatment = coalesce(treatment, 'display');
update public.pages set motif = coalesce(motif, 'grain');
update public.pages set font = coalesce(font, 'fraunces');
update public.pages set found_count = coalesce(found_count, 0);

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

create index if not exists pages_expires_idx
  on public.pages (expires_at)
  where status = 'free';

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
