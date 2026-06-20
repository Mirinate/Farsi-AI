-- Enable UUID
create extension if not exists "uuid-ossp";

create type plan_tier as enum ('free', 'creator', 'pro');
create type job_status as enum ('queued', 'processing', 'done', 'failed');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  plan plan_tier not null default 'free',
  minutes_used integer not null default 0,
  minutes_limit integer not null default 180,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create table jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  status job_status not null default 'queued',
  source_type text not null check (source_type in ('upload', 'youtube')),
  source_url text,
  source_file_path text,
  output_video_url text,
  output_srt_url text,
  duration_seconds integer,
  error_message text,
  segments jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute procedure set_updated_at();
create trigger jobs_updated_at before update on jobs
  for each row execute procedure set_updated_at();

alter table profiles enable row level security;
alter table jobs enable row level security;

create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can read own jobs" on jobs for select using (auth.uid() = user_id);
create policy "Users can insert own jobs" on jobs for insert with check (auth.uid() = user_id);
create policy "Users can update own jobs" on jobs for update using (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('videos', 'videos', false) on conflict do nothing;

create policy "Authenticated users can upload videos" on storage.objects
  for insert with check (auth.role() = 'authenticated' and bucket_id = 'videos');
create policy "Users can read own videos" on storage.objects
  for select using (auth.uid()::text = (storage.foldername(name))[1] and bucket_id = 'videos');
