-- Kliché — schéma initial (events, guests, photos, photo_faces, photographers, shares, admins)
-- À exécuter dans Supabase (SQL Editor) ou via `supabase db push` une fois le CLI lié au projet.

create extension if not exists "pgcrypto";

create table admins (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table photographers (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  event_date date,
  location text,
  hashtag text,
  cover_image_url text,
  sponsor_name text,
  sponsor_logo_url text,
  hd_included boolean not null default false,
  public_gallery boolean not null default false,
  -- nullable tant que l'auth admin (compte protégé) n'est pas branchée sur /admin
  created_by uuid references admins (id),
  created_at timestamptz not null default now()
);

create table event_photographers (
  event_id uuid not null references events (id) on delete cascade,
  photographer_id uuid not null references photographers (id) on delete cascade,
  primary key (event_id, photographer_id)
);

create table guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  session_token uuid not null unique default gen_random_uuid(),
  selfie_face_id text,
  consent_at timestamptz,
  purge_at timestamptz,
  created_at timestamptz not null default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  photographer_id uuid references photographers (id),
  storage_path_hd text,
  storage_path_preview text,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'indexed', 'ready', 'error')),
  created_at timestamptz not null default now()
);

create table photo_faces (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos (id) on delete cascade,
  face_id text not null,
  guest_id uuid references guests (id) on delete set null,
  similarity numeric,
  created_at timestamptz not null default now()
);

create table shares (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos (id) on delete cascade,
  guest_id uuid references guests (id) on delete set null,
  channel text not null default 'whatsapp',
  created_at timestamptz not null default now()
);

create index on events (code);
create index on guests (event_id);
create index on photos (event_id);
create index on photo_faces (photo_id);
create index on photo_faces (guest_id);

-- RLS : activée partout. Les invités et photographes n'ont pas de session Supabase Auth
-- (accès par code événement / cookie), donc leurs écritures passent par le serveur Next.js
-- avec la clé service_role (qui contourne RLS par construction). Les politiques ci-dessous
-- couvrent les accès directs au client (admin connecté, lecture publique de la fiche événement).

alter table admins enable row level security;
alter table photographers enable row level security;
alter table events enable row level security;
alter table event_photographers enable row level security;
alter table guests enable row level security;
alter table photos enable row level security;
alter table photo_faces enable row level security;
alter table shares enable row level security;

create policy "admin lit son propre profil" on admins
  for select using (auth.uid() = id);

create policy "lecture publique des événements" on events
  for select using (true);

create policy "admin gère ses événements" on events
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- guests / photos / photo_faces / shares : aucune politique publique pour l'instant.
-- Toutes les écritures et lectures ciblées passent par le serveur (service_role).
