/* ================================================================
   НАСТРОЙКИ САЙТА — единственный файл, который нужно править руками.
   ================================================================ */
window.APP_CONFIG = {
  siteTitle: 'Полигон «Садовка»',
  ourTeam:   'Наша команда',   // подпись статуса «наша команда»
  enemyTeam: 'Противник',      // подпись статуса «противник»

  /* ВХОД ДЛЯ АДМИНА
     Значок замка посетители не видят. Чтобы войти, откройте адрес сайта с ?admin на конце,
     например  https://логин.github.io/sadovka/?admin  — и введите пароль.
     В режиме Supabase у каждого админа свой email и пароль (см. supabase/schema.sql),
     а строка ниже не используется. В режиме 'json' здесь отпечаток общего пароля (SHA-256):
     новый даст админка «Ещё → Сменить пароль…». Пустая строка '' — вход без пароля.     */
  adminPasswordHash: '7fa0cc72d8c54bb3fef68cd999296d4acd7585df4062824fd854829682e796b8',

  /* Где хранятся данные:
     'json'     — файл data/games.json (правите в браузере → скачиваете → заливаете на хостинг)
     'supabase' — бесплатная база Supabase (правите онлайн, все видят сразу)            */
  storage: 'supabase',      // пока supabaseUrl и ключ не заполнены, сайт работает с data/games.json
  jsonUrl: 'data/games.json',

  /* Заполнить для режима 'supabase' (Supabase → Project Settings → API:
     Project URL и ключ anon / publishable).
     anon-ключ публичный, его можно хранить здесь: писать в базу он не даёт,
     это запрещено правилами доступа из файла supabase/schema.sql.        */
  supabaseUrl: 'https://naqkgjwzsbbhugvuhkgi.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcWtnand6c2JiaHVndnVoa2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MjYwMDUsImV4cCI6MjEwNzQwMjAwNX0.yhjUgq-BMacq3qKEpbNzd90XAHLtlClj-u2AdThmGys',

  /* Подложка: пирамида тайлов, нарезанная скриптом tools/make_tiles.py */
  tilesUrl:   'tiles/{z}/{x}/{y}.webp',
  tilesIndex: 'tiles/index.json',

  /* Сетка квадратов поверх карты */
  grid: { cols: 12, rows: 12 },

  /* ВЕРХНЯЯ СЦЕНА (таймер, галереи, параллакс) */
  hero: {
    startTime: '10:00',      // во сколько начинается игра, если у игры не указано своё время
    timezone:  '+03:00',     // часовой пояс полигона (Крым — Москва, +03:00)
    pinBar:    true,         // закреплённая плашка «Ближайшая игра» при прокрутке
    parallax:  { scroll: true, mouse: true, strength: 1 },  // strength: 0 — выкл, 1 — обычно, 1.5 — сильнее
    autoplaySec: 6,          // через сколько секунд листаются фото в галереях (0 — не листать)

    /* Фото галерей. url — файл в папке сайта или ссылка Google Drive (как в фото игр).
       fit: 'contain' — показать картинку целиком, без обрезки.                       */
    galleries: [
      { title: 'Фото галерея №1', tag: 'Прокат снаряжения', photos: [
        { url: 'img/hero/container.webp', caption: 'Прокат: оружие и снаряжение', fit: 'contain' }
      ] },
      { title: 'Фото галерея №2', tag: 'Местность полигона', photos: [
        { url: 'img/hero/gallery2-1.webp', caption: 'Руины и окопы' },
        { url: 'img/hero/forest.webp', caption: 'Лес на полигоне' }
      ] }
    ]
  }
};
