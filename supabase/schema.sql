-- =====================================================================
--  Карта полигона: база данных Supabase
--  Supabase → SQL Editor → New query → вставить весь файл → Run
-- =====================================================================

-- Игры (точки и фото хранятся внутри игры в формате JSON)
create table if not exists public.games (
  id          text primary key,
  title       text not null,
  date        date not null,
  summary     text not null default '',
  scenario    text not null default '',
  rules       text not null default '',
  gather      text not null default '',
  result      text not null default '',
  photos      jsonb not null default '[]'::jsonb,
  points      jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Список админов: только эти пользователи могут менять данные
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Время последнего изменения обновляется само
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists games_touch on public.games;
create trigger games_touch before update on public.games
  for each row execute function public.touch_updated_at();

-- Проверка «текущий пользователь — админ»
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- ПРАВИЛА ДОСТУПА (Row Level Security) ----------
alter table public.games  enable row level security;
alter table public.admins enable row level security;

drop policy if exists "games_read_all"     on public.games;
drop policy if exists "games_admin_insert" on public.games;
drop policy if exists "games_admin_update" on public.games;
drop policy if exists "games_admin_delete" on public.games;
drop policy if exists "admins_read_self"   on public.admins;

-- Читать игры может кто угодно, без входа
create policy "games_read_all" on public.games
  for select using (true);

-- Создавать, менять и удалять — только админы
create policy "games_admin_insert" on public.games
  for insert to authenticated with check (public.is_admin());
create policy "games_admin_update" on public.games
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "games_admin_delete" on public.games
  for delete to authenticated using (public.is_admin());

-- Пользователь видит только свою строку в списке админов (сайт так проверяет вход)
create policy "admins_read_self" on public.admins
  for select to authenticated using (user_id = auth.uid());
-- Добавлять админов через сайт нельзя: только из SQL Editor (см. ниже)


-- =====================================================================
--  ПОСЛЕ создания пользователя (Authentication → Users → Add user)
--  выполните отдельно, подставив свой email:
--
--  insert into public.admins (user_id)
--  select id from auth.users where email = 'ВАШ_EMAIL@example.com';
-- =====================================================================
