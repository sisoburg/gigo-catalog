-- Admin allowlist.
--
-- Before this, every write policy was "TO authenticated USING (true)", i.e.
-- ANY signed-in Supabase user was an admin. If public sign-up is ever on
-- (it is the default), a stranger could create and confirm their own account
-- and edit the catalog. Now only users listed in public.admin_users count.
--
-- To add an admin later (after creating/inviting them in Authentication ->
-- Users), run:
--   insert into public.admin_users (user_id)
--   select id from auth.users where email = 'someone@example.com';

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- A signed-in user may only see their own row (the site uses this to decide
-- whether to show the admin UI). Nobody can write through the API; admins are
-- added with SQL as above.
drop policy if exists "users read own admin row" on public.admin_users;
create policy "users read own admin row" on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()))
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Seed the people who already have accounts so nobody is locked out.
insert into public.admin_users (user_id)
select id from auth.users where email in ('sisoburg@gmail.com', 'ayalajig@gmail.com')
on conflict do nothing;

-- Tighten every admin policy from "any signed-in user" to "listed admins".
alter policy "admin full access to filmstrip_items" on public.filmstrip_items using (public.is_admin()) with check (public.is_admin());
alter policy "admin full access to hero_candidates" on public.hero_candidates using (public.is_admin()) with check (public.is_admin());
alter policy "admin full access to media" on public.media using (public.is_admin()) with check (public.is_admin());
alter policy "admin full access to pieces" on public.pieces using (public.is_admin()) with check (public.is_admin());
alter policy "admin full access to site settings" on public.site_settings using (public.is_admin()) with check (public.is_admin());

alter policy "admin deletes media bucket" on storage.objects using (bucket_id = 'media' and public.is_admin());
alter policy "admin writes media bucket" on storage.objects with check (bucket_id = 'media' and public.is_admin());
alter policy "admin updates media bucket" on storage.objects using (bucket_id = 'media' and public.is_admin());
