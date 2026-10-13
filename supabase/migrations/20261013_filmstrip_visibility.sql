-- Each WORN scroll image can be switched on/off without removing it from the
-- admin list. The site shows only visible ones (the admin UI caps that at 15).
alter table public.filmstrip_items add column if not exists is_visible boolean not null default true;
