# Supabase Setup Instructions

Run these SQL scripts in your Supabase SQL Editor in the exact order shown below.

## Step 1: Create Storage Buckets

```sql
-- Create storage buckets for user files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('id_cards', 'id_cards', true, 5242880, array['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']::text[]),
  ('profile_photos', 'profile_photos', true, 2097152, array['image/jpeg', 'image/png', 'image/jpg', 'image/webp']::text[])
on conflict (id) do nothing;

-- RLS Policies for id_cards bucket
create policy "Public can view ID cards"
on storage.objects for select
using (bucket_id = 'id_cards');

create policy "Users can upload their own ID cards"
on storage.objects for insert
with check (
  bucket_id = 'id_cards' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own ID cards"
on storage.objects for update
using (
  bucket_id = 'id_cards' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own ID cards"
on storage.objects for delete
using (
  bucket_id = 'id_cards' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policies for profile_photos bucket
create policy "Public can view profile photos"
on storage.objects for select
using (bucket_id = 'profile_photos');

create policy "Users can upload their own profile photos"
on storage.objects for insert
with check (
  bucket_id = 'profile_photos' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own profile photos"
on storage.objects for update
using (
  bucket_id = 'profile_photos' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own profile photos"
on storage.objects for delete
using (
  bucket_id = 'profile_photos' 
  and auth.uid()::text = (storage.foldername(name))[1]
);
```

## Step 2: Create User Roles System

```sql
-- Create enum for app roles
create type public.app_role as enum ('admin', 'company', 'promoter');

-- Create user_roles table for proper role management
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Create security definer function to check roles (prevents RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS policies for user_roles
create policy "Users can view their own roles"
on public.user_roles for select
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles for select
using (public.has_role(auth.uid(), 'admin'));

-- Function to get user's primary role
create or replace function public.get_user_role(_user_id uuid)
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.user_roles
  where user_id = _user_id
  order by 
    case role
      when 'admin' then 1
      when 'company' then 2
      when 'promoter' then 3
    end
  limit 1
$$;
```

## Step 3: Update Profiles Table and Trigger

```sql
-- Update profiles table to ensure all fields exist
alter table public.profiles 
  add column if not exists full_name text,
  add column if not exists nationality text,
  add column if not exists age text,
  add column if not exists phone_number text,
  add column if not exists gender text,
  add column if not exists height text,
  add column if not exists weight text,
  add column if not exists is_student boolean default false,
  add column if not exists address text,
  add column if not exists bank_details text,
  add column if not exists id_card_url text,
  add column if not exists profile_photo_url text,
  add column if not exists verification_status text default 'pending',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create improved handle_new_user function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role app_role;
begin
  -- Get role from metadata, default to 'promoter'
  user_role := coalesce(
    (new.raw_user_meta_data->>'role')::app_role,
    'promoter'::app_role
  );

  -- Insert into profiles table
  insert into public.profiles (
    id,
    full_name,
    email,
    verification_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    'pending'
  );

  -- Insert role into user_roles table
  insert into public.user_roles (user_id, role)
  values (new.id, user_role);

  return new;
exception
  when others then
    -- Log error but don't block user creation
    raise warning 'Error in handle_new_user: %', sqlerrm;
    return new;
end;
$$;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update RLS policies for profiles
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

create policy "Admins can view all profiles"
on public.profiles for select
using (public.has_role(auth.uid(), 'admin'));
```

## Step 4: Update Shifts RLS Policies

```sql
-- Update RLS policies for shifts table
drop policy if exists "Anyone can view shifts" on public.shifts;
drop policy if exists "Companies can create shifts" on public.shifts;
drop policy if exists "Companies can update their shifts" on public.shifts;
drop policy if exists "Companies can delete their shifts" on public.shifts;
drop policy if exists "Promoters can view all shifts" on public.shifts;

-- Promoters and companies can view all shifts
create policy "Promoters can view all shifts"
on public.shifts for select
using (
  public.has_role(auth.uid(), 'promoter') or
  public.has_role(auth.uid(), 'company') or
  public.has_role(auth.uid(), 'admin')
);

-- Companies can create shifts
create policy "Companies can create shifts"
on public.shifts for insert
with check (
  public.has_role(auth.uid(), 'company') or
  public.has_role(auth.uid(), 'admin')
);

-- Companies can update their own shifts
create policy "Companies can update their shifts"
on public.shifts for update
using (
  created_by = auth.uid() or
  public.has_role(auth.uid(), 'admin')
);

-- Companies can delete their own shifts
create policy "Companies can delete their shifts"
on public.shifts for delete
using (
  created_by = auth.uid() or
  public.has_role(auth.uid(), 'admin')
);
```

## Step 5: Update Certificates RLS Policies

```sql
-- Ensure certificates table exists with proper columns
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  reference_number text unique not null,
  certificate_type text not null,
  time_period text,
  pdf_url text,
  issued_date timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.certificates enable row level security;

-- Drop existing policies
drop policy if exists "Users can view own certificates" on public.certificates;
drop policy if exists "Users can create own certificates" on public.certificates;
drop policy if exists "Anyone can view certificates for verification" on public.certificates;
drop policy if exists "Public can verify certificates" on public.certificates;
drop policy if exists "Admins can view all certificates" on public.certificates;

-- Users can view their own certificates
create policy "Users can view own certificates"
on public.certificates for select
using (auth.uid() = user_id);

-- Users can create their own certificates
create policy "Users can create own certificates"
on public.certificates for insert
with check (auth.uid() = user_id);

-- Allow public to view certificates by reference number (for verification)
create policy "Public can verify certificates"
on public.certificates for select
using (reference_number is not null);

-- Admins can view all certificates
create policy "Admins can view all certificates"
on public.certificates for select
using (public.has_role(auth.uid(), 'admin'));
```

## After Running All Scripts

1. Go to **Storage** in Supabase dashboard
2. Verify `id_cards` and `profile_photos` buckets were created
3. Test the signup flow
4. Check that profiles are created automatically on signup
5. Verify file uploads work correctly
