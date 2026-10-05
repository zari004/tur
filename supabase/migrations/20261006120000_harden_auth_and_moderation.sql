-- Keep privileged helpers outside the API-exposed public schema.
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create or replace function private.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not private.is_admin() then
    raise exception 'Only administrators may change user roles';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.protect_profile_role() from public, anon, authenticated;

create or replace function private.protect_seller_moderation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and not private.is_admin() then
    raise exception 'Only administrators may change seller status';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.protect_seller_moderation() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure private.handle_new_user();
drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger before update on public.profiles
for each row execute procedure private.protect_profile_role();
drop trigger if exists protect_seller_moderation_trigger on public.seller_profiles;
create trigger protect_seller_moderation_trigger before update on public.seller_profiles
for each row execute procedure private.protect_seller_moderation();

drop policy if exists "profiles_self_or_admin_select" on public.profiles;
create policy "profiles_self_or_admin_select" on public.profiles for select to authenticated using ((select auth.uid()) = id or private.is_admin());
drop policy if exists "seller_public_read" on public.seller_profiles;
create policy "seller_public_read" on public.seller_profiles for select to anon, authenticated using (status = 'approved' or user_id = (select auth.uid()) or private.is_admin());
drop policy if exists "seller_owner_update" on public.seller_profiles;
create policy "seller_owner_update" on public.seller_profiles for update to authenticated using (user_id = (select auth.uid()) or private.is_admin()) with check (user_id = (select auth.uid()) or private.is_admin());
drop policy if exists "active_tours_public_read" on public.tours;
create policy "active_tours_public_read" on public.tours for select to anon, authenticated using (status = 'active' or exists(select 1 from public.seller_profiles s where s.id = seller_id and s.user_id = (select auth.uid())) or private.is_admin());
drop policy if exists "seller_tours_update" on public.tours;
create policy "seller_tours_update" on public.tours for update to authenticated using (exists(select 1 from public.seller_profiles s where s.id = seller_id and s.user_id = (select auth.uid())) or private.is_admin()) with check (exists(select 1 from public.seller_profiles s where s.id = seller_id and s.user_id = (select auth.uid())) or private.is_admin());
drop policy if exists "seller_tours_delete" on public.tours;
create policy "seller_tours_delete" on public.tours for delete to authenticated using (exists(select 1 from public.seller_profiles s where s.id = seller_id and s.user_id = (select auth.uid())) or private.is_admin());
drop policy if exists "booking_parties_read" on public.bookings;
create policy "booking_parties_read" on public.bookings for select to authenticated using (user_id = (select auth.uid()) or exists(select 1 from public.tours t join public.seller_profiles s on s.id=t.seller_id where t.id=tour_id and s.user_id=(select auth.uid())) or private.is_admin());
drop policy if exists "admin_booking_update" on public.bookings;
create policy "admin_booking_update" on public.bookings for update to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "payment_parties_read" on public.payments;
create policy "payment_parties_read" on public.payments for select to authenticated using (exists(select 1 from public.bookings b where b.id=booking_id and b.user_id=(select auth.uid())) or private.is_admin());
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for select to anon, authenticated using (status='published' or private.is_admin());
drop policy if exists "complaint_owner_admin_read" on public.complaints;
create policy "complaint_owner_admin_read" on public.complaints for select to authenticated using (reporter_id=(select auth.uid()) or private.is_admin());
drop policy if exists "complaint_admin_update" on public.complaints;
create policy "complaint_admin_update" on public.complaints for update to authenticated using (private.is_admin()) with check (private.is_admin());

grant delete on public.tours to authenticated;

drop function if exists public.handle_new_user();
drop function if exists public.protect_profile_role();
drop function if exists public.protect_seller_moderation();
drop function if exists public.is_admin();
