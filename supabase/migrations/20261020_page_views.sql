-- First-party, anonymous page-view log for the admin Analytics page.
--
-- No IP addresses are stored. visitor_id is a random UUID the browser keeps in
-- localStorage (a stable "same browser" signal, not a person); session_id is
-- per tab session. Anyone may INSERT a row; only admins may read, and the
-- dashboard reads through the aggregate functions below.

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor_id uuid not null,
  session_id uuid not null,
  path text not null check (char_length(path) <= 300),
  piece_slug text check (char_length(piece_slug) <= 200),
  referrer_host text check (char_length(referrer_host) <= 200),
  source text check (char_length(source) <= 200),
  locale text check (char_length(locale) <= 10),
  device text check (device in ('mobile', 'tablet', 'desktop')),
  browser text check (char_length(browser) <= 30),
  screen_w integer check (screen_w between 0 and 20000)
);

create index if not exists page_views_created_at_idx on public.page_views (created_at);
create index if not exists page_views_visitor_idx on public.page_views (visitor_id);

alter table public.page_views enable row level security;

drop policy if exists "anyone can log a page view" on public.page_views;
create policy "anyone can log a page view" on public.page_views
  for insert to anon, authenticated
  with check (true);

drop policy if exists "admin reads page views" on public.page_views;
create policy "admin reads page views" on public.page_views
  for select to authenticated
  using (public.is_admin());

-- All bucketing happens in the site owner's time zone so "month" and "day"
-- match the calendar they see.

create or replace function public.analytics_summary(p_from timestamptz, p_to timestamptz)
returns table (total_views bigint, unique_visitors bigint, sessions bigint, returning_visitors bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
  with r as (
    select visitor_id, session_id from public.page_views
    where created_at >= p_from and created_at < p_to
  )
  select
    (select count(*) from r),
    (select count(distinct visitor_id) from r),
    (select count(distinct session_id) from r),
    (select count(distinct r.visitor_id) from r
       where exists (select 1 from public.page_views o
                     where o.visitor_id = r.visitor_id and o.created_at < p_from));
end
$$;

create or replace function public.analytics_timeseries(p_from timestamptz, p_to timestamptz, p_bucket text)
returns table (bucket date, views bigint, visitors bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_bucket not in ('day', 'week', 'month') then
    raise exception 'bad bucket';
  end if;
  return query
  select date_trunc(p_bucket, v.created_at at time zone 'Asia/Jerusalem')::date,
         count(*),
         count(distinct v.visitor_id)
  from public.page_views v
  where v.created_at >= p_from and v.created_at < p_to
  group by 1
  order by 1;
end
$$;

create or replace function public.analytics_top(p_from timestamptz, p_to timestamptz, p_dimension text, p_limit integer default 8)
returns table (label text, views bigint, visitors bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_dimension not in ('piece', 'source', 'device', 'locale', 'browser') then
    raise exception 'bad dimension';
  end if;
  return query
  select coalesce(
           case p_dimension
             when 'piece' then v.piece_slug
             when 'source' then v.source
             when 'device' then v.device
             when 'locale' then v.locale
             else v.browser
           end,
           case p_dimension when 'source' then 'direct' else 'unknown' end
         ) as label,
         count(*),
         count(distinct v.visitor_id)
  from public.page_views v
  where v.created_at >= p_from and v.created_at < p_to
    and (p_dimension <> 'piece' or v.piece_slug is not null)
  group by 1
  order by 2 desc
  limit greatest(p_limit, 1);
end
$$;

revoke all on function public.analytics_summary(timestamptz, timestamptz) from public, anon;
revoke all on function public.analytics_timeseries(timestamptz, timestamptz, text) from public, anon;
revoke all on function public.analytics_top(timestamptz, timestamptz, text, integer) from public, anon;
grant execute on function public.analytics_summary(timestamptz, timestamptz) to authenticated;
grant execute on function public.analytics_timeseries(timestamptz, timestamptz, text) to authenticated;
grant execute on function public.analytics_top(timestamptz, timestamptz, text, integer) to authenticated;
