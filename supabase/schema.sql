-- =====================================================================
--  Полигон «Садовка»: общая база для нескольких админов (Supabase)
--  Supabase → SQL Editor → New query → вставить ВЕСЬ файл → Run.
--  Запускать можно повторно: ничего не сломается и данные не сотрутся.
-- =====================================================================

-- Все данные сайта — одним документом (как games.json):
--   'public'  — то, что видят посетители;
--   'private' — телефоны игроков, их читают только админы.
create table if not exists public.site_doc (
  id          text primary key check (id in ('public', 'private')),
  data        jsonb not null default '{}'::jsonb,
  version     integer not null default 0,
  updated_at  timestamptz not null default now(),
  updated_by  text not null default ''
);
insert into public.site_doc (id) values ('public'), ('private') on conflict (id) do nothing;

-- Список админов по email. Добавлять/убирать — здесь, в SQL Editor (см. внизу).
create table if not exists public.site_admins (
  email text primary key
);

-- Текущий вошедший пользователь — админ?
create or replace function public.is_site_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.site_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Сохранение. Пишет только админ и только поверх той версии, которую он загрузил:
-- если другой админ успел сохранить раньше — ошибка conflict, сайт подтянет свежую версию.
create or replace function public.save_site(p_version integer, p_public jsonb, p_private jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare cur integer; who text := coalesce(auth.jwt() ->> 'email', '');
begin
  if not public.is_site_admin() then raise exception 'not_admin' using errcode = '42501'; end if;
  select version into cur from public.site_doc where id = 'public' for update;
  if cur is null then
    insert into public.site_doc (id) values ('public'), ('private') on conflict (id) do nothing;
    cur := 0;
  end if;
  if p_version <> cur then raise exception 'conflict: version %', cur; end if;
  update public.site_doc set data = p_public,  version = cur + 1, updated_at = now(), updated_by = who where id = 'public';
  update public.site_doc set data = p_private, version = cur + 1, updated_at = now(), updated_by = who where id = 'private';
  return cur + 1;
end $$;

-- ---------- ПРАВА ДОСТУПА ----------
alter table public.site_doc    enable row level security;
alter table public.site_admins enable row level security;

drop policy if exists "site_doc_read" on public.site_doc;
-- Публичную часть читают все, закрытую — только админы. Писать напрямую нельзя никому:
-- только через функцию save_site.
create policy "site_doc_read" on public.site_doc
  for select using (id = 'public' or public.is_site_admin());
-- Таблицу site_admins с сайта не прочитать и не изменить (политик нет).

revoke all on function public.save_site(integer, jsonb, jsonb) from public, anon;
grant execute on function public.save_site(integer, jsonb, jsonb) to authenticated;
grant execute on function public.is_site_admin() to anon, authenticated;
grant select on public.site_doc to anon, authenticated;


-- =====================================================================
--  АДМИНЫ (3–4 человека)
--  1) Authentication → Users → Add user → Create new user:
--     email + пароль, галочка «Auto Confirm User». Так для каждого админа.
--  2) Выполните (по строке на каждого, свои email-ы):
--
--  insert into public.site_admins (email) values
--    ('admin1@mail.ru'),
--    ('admin2@mail.ru');
--
--  Убрать админа:  delete from public.site_admins where email = 'admin2@mail.ru';
--
--  3) Authentication → Sign In / Providers → Email: выключите «Allow new users to sign up»,
--     чтобы посторонние не могли создавать себе аккаунты (админами они всё равно не станут).
-- =====================================================================
