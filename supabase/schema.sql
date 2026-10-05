-- Go2Trip production-ready initial schema for Supabase/Postgres.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role text not null default 'user' check (role in ('user','seller','admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  company_name text not null,
  owner_name text not null,
  phone text,
  tax_id text,
  license_url text,
  status text not null default 'pending' check (status in ('pending','approved','blocked')),
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_profiles(id) on delete cascade,
  title text not null,
  destination text not null,
  description text not null default '',
  image_url text,
  starts_at date not null,
  ends_at date not null,
  price_uzs bigint not null check (price_uzs > 0),
  capacity integer not null default 1 check (capacity > 0),
  status text not null default 'draft' check (status in ('draft','pending','active','rejected','archived')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id),
  user_id uuid not null references public.profiles(id),
  travelers integer not null default 1 check (travelers > 0),
  total_uzs bigint not null check (total_uzs > 0),
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  unique (tour_id, user_id, created_at)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  provider text not null,
  provider_reference text unique,
  amount_uzs bigint not null check (amount_uzs > 0),
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id),
  user_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.seller_profiles(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  seller_id uuid references public.seller_profiles(id),
  booking_id uuid references public.bookings(id),
  subject text not null,
  details text not null,
  status text not null default 'open' check (status in ('open','reviewing','resolved','closed')),
  created_at timestamptz not null default now()
);

create index if not exists tours_seller_id_idx on public.tours(seller_id);
create index if not exists tours_status_idx on public.tours(status);
create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_tour_id_idx on public.bookings(tour_id);
create index if not exists complaints_status_idx on public.complaints(status);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin') $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin insert into public.profiles(id, full_name) values(new.id, coalesce(new.raw_user_meta_data->>'full_name','')); return new; end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only administrators may change user roles';
  end if;
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger before update on public.profiles
for each row execute procedure public.protect_profile_role();

create or replace function public.protect_seller_moderation()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if new.status is distinct from old.status and not public.is_admin() then
    raise exception 'Only administrators may change seller status';
  end if;
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists protect_seller_moderation_trigger on public.seller_profiles;
create trigger protect_seller_moderation_trigger before update on public.seller_profiles
for each row execute procedure public.protect_seller_moderation();

alter table public.profiles enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.tours enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.complaints enable row level security;

create policy "profiles_self_or_admin_select" on public.profiles for select to authenticated using ((select auth.uid()) = id or public.is_admin());
create policy "profiles_self_update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "seller_public_read" on public.seller_profiles for select to anon, authenticated using (status = 'approved' or user_id = (select auth.uid()) or public.is_admin());
create policy "seller_owner_insert" on public.seller_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy "seller_owner_update" on public.seller_profiles for update to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "active_tours_public_read" on public.tours for select to anon, authenticated using (status = 'active' or exists(select 1 from public.seller_profiles s where s.id = seller_id and s.user_id = (select auth.uid())) or public.is_admin());
create policy "seller_tours_insert" on public.tours for insert to authenticated with check (exists(select 1 from public.seller_profiles s where s.id = seller_id and s.user_id = (select auth.uid()) and s.status = 'approved'));
create policy "seller_tours_update" on public.tours for update to authenticated using (exists(select 1 from public.seller_profiles s where s.id = seller_id and s.user_id = (select auth.uid())) or public.is_admin());
create policy "booking_parties_read" on public.bookings for select to authenticated using (user_id = (select auth.uid()) or exists(select 1 from public.tours t join public.seller_profiles s on s.id=t.seller_id where t.id=tour_id and s.user_id=(select auth.uid())) or public.is_admin());
create policy "user_booking_insert" on public.bookings for insert to authenticated with check (user_id = (select auth.uid()));
create policy "admin_booking_update" on public.bookings for update to authenticated using (public.is_admin());
create policy "payment_parties_read" on public.payments for select to authenticated using (exists(select 1 from public.bookings b where b.id=booking_id and b.user_id=(select auth.uid())) or public.is_admin());
create policy "reviews_public_read" on public.reviews for select to anon, authenticated using (status='published' or public.is_admin());
create policy "review_owner_insert" on public.reviews for insert to authenticated with check (user_id=(select auth.uid()));
create policy "complaint_owner_insert" on public.complaints for insert to authenticated with check (reporter_id=(select auth.uid()));
create policy "complaint_owner_admin_read" on public.complaints for select to authenticated using (reporter_id=(select auth.uid()) or public.is_admin());
create policy "complaint_admin_update" on public.complaints for update to authenticated using (public.is_admin());

grant select on public.seller_profiles, public.tours, public.reviews to anon;
grant select, insert, update on public.profiles, public.seller_profiles, public.tours, public.bookings, public.reviews, public.complaints to authenticated;
grant select on public.payments to authenticated;
revoke insert, update, delete on public.payments from anon, authenticated;
