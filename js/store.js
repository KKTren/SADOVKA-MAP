/* ================================================================
   СЛОЙ ДАННЫХ. Всё чтение и запись идут только через этот файл.

   Файл data/games.json (версия 3):
   {
     settings:  { grid:{cols,rows,x,y,cw,ch,angle,square}, border:{color,width}, signup:{ vk } },
     sides:     [{ id, name, color }],              // стороны: красная, синяя, серая…
     teams:     [{ id, name, logo, players:[{ id, callsign, role, rank, phone }] }],  // справочник команд; состав виден только админу
     info:      [{ id, title, body, photos }],      // разделы для новичков внизу сайта (правила, снаряжение, прокат…)
     links:     [{ id, kind, label, url }],         // соцсети и ссылки в шапке
     labels:    [{ id, x, y, text, size, color, opacity, scale }],  // крупные подписи полигона (color: '#rrggbb' или 'side:<id>')
     border:    [[x,y], …],                         // граница полигона (доли ширины/высоты)
     places:    [{ id, name, x, y, type, icon, note, photos }],   // постоянные объекты полигона
     scenarios: [{ id, title, summary, rules, photos }],    // «Взвод», «Поиск пилота»…
     games:     [{ id, scenarioId, title, date:'ГГГГ-ММ-ДД', time:'ЧЧ:ММ', featured,
                   summary, gather, result, photos,
                   sides:{ [sideId]: { teams:[{ id:teamId, players, present:[playerId…] }], players } },  // players стороны — всего; пусто — сумма по командам
                   points:[{ id, name, type, icon, x, y,
                             before, after,          // id стороны-владельца до и после игры ('' — ничья)
                             area:[[x,y],…], note, photos }],
                   arrows:[{ id, pts:[[x,y],…], color, opacity, width }] }]  // стрелки направлений этой игры
   }
   x,y — доли ширины и высоты подложки (0…1).
   ================================================================ */
(function () {
  const DRAFT_KEY = 'polygon-map-draft-v3';
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  const num = v => (v === '' || v == null || isNaN(+v)) ? null : Math.max(0, Math.round(+v));
  const arr = v => Array.isArray(v) ? v : [];
  const pt = v => Array.isArray(v) && v.length === 2 && isFinite(v[0]) && isFinite(v[1]) ? [+v[0], +v[1]] : null;
  const poly = v => arr(v).map(pt).filter(Boolean);
  const iconName = v => /^[a-z]{1,20}$/.test(v || '') ? v : ''; // значок, выбранный вручную ('' — по типу)
  const color = (c, d) => /^#[0-9a-f]{6}$/i.test(c || '') ? c : d;

  const DEFAULT_SIDES = [
    { id: 'red', name: 'Красная', color: '#e5483b' },
    { id: 'blue', name: 'Синяя', color: '#3d8bff' },
    { id: 'grey', name: 'Нейтральная', color: '#a7aaa0' }
  ];
  const POINT_TYPES = ['point', 'flag', 'bunker', 'respawn', 'hq'];
  const PLACE_TYPES = ['building', 'tower', 'bunker', 'point', 'flag', 'respawn', 'hq', 'parking', 'entry'];
  const OLD_STATUS = { ours: 'blue', enemy: 'red', neutral: 'grey' };

  function normSite(v) {
    v = v && typeof v === 'object' ? v : {};
    const logo = String(v.logo || '').trim();
    return {
      title: String(v.title || '').trim().slice(0, 80),
      logo: /^data:image\/(png|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/i.test(logo) && logo.length < 400000 ? logo
        : /^(https?:\/\/|img\/)[^\s"'<>]{1,500}$/i.test(logo) ? logo : ''
    };
  }
  function normHero(h) {
    if (!h || typeof h !== 'object') return null;
    const str = (v, n) => String(v || '').trim().slice(0, n);
    return {
      startTime: /^\d{1,2}:\d{2}$/.test(h.startTime || '') ? h.startTime : '',
      galleries: arr(h.galleries).slice(0, 2).map(g => ({
        title: str(g && g.title, 60), tag: str(g && g.tag, 60), fit: g && g.fit === 'contain' ? 'contain' : 'cover',
        photos: arr(g && g.photos).filter(p => p && p.url).map(p => ({ url: str(p.url, 500), caption: str(p.caption, 120) }))
      }))
    };
  }
  function normalizeDoc(d, cfg) {
    d = d || {};
    const g0 = (d.settings && d.settings.grid) || {}, gd = (cfg && cfg.grid) || { cols: 12, rows: 12 };
    const clampI = (v, def, max) => Math.min(max, Math.max(1, Math.round(+v) || def));
    const b0 = (d.settings && d.settings.border) || {};
    const settings = {
      // x,y — левый верхний угол сетки (доли ширины/высоты), cw/ch — размер клетки в метрах (null — растянуть на всю карту), angle — поворот в градусах
      grid: { cols: clampI(g0.cols, gd.cols, 25), rows: clampI(g0.rows, gd.rows, 50), x: +g0.x || 0, y: +g0.y || 0,
        cw: +g0.cw > 0 ? +g0.cw : null, ch: +g0.ch > 0 ? +g0.ch : null, angle: Math.max(-180, Math.min(180, +g0.angle || 0)), square: !!g0.square },
      border: { color: color(b0.color, '#f2c230'), width: Math.min(12, Math.max(1, +b0.width || 4)) },
      signup: { vk: String((d.settings && d.settings.signup && d.settings.signup.vk) || '').slice(0, 300) },
      showRoster: d.settings && d.settings.showRoster != null ? !!d.settings.showRoster : true,
      // верхняя сцена: галереи и время начала по умолчанию (null — берутся из js/config.js)
      hero: normHero(d.settings && d.settings.hero),
      // название полигона и эмблема (картинка: data:image/… из админки или ссылка); пусто — из js/config.js
      site: normSite(d.settings && d.settings.site)
    };
    const sides = (arr(d.sides).length ? d.sides : DEFAULT_SIDES).map(s => ({ id: s.id || uid(), name: s.name || 'Сторона', color: color(s.color, '#a7aaa0') }));
    const str = (v, n) => String(v ?? '').slice(0, n);
    const teams = arr(d.teams).map(t => ({ id: t.id || uid(), name: t.name || 'Команда',
      logo: /^\s*(javascript|data|vbscript):/i.test(t.logo || '') ? '' : str(t.logo, 500).trim(),  // эмблема: ссылка на картинку
      players: arr(t.players).map(p => ({ id: p.id || uid(), callsign: str(p.callsign, 60), role: ['commander', 'fighter'].includes(p.role) ? p.role : '', rank: str(p.rank, 60), phone: str(p.phone, 40) })) }));
    const paint = v => /^#[0-9a-f]{6}$/i.test(v || '') || /^side:[\w-]{1,64}$/.test(v || '') ? v : '#ffffff';
    const op = v => Math.min(1, Math.max(0.05, isFinite(+v) && v !== '' && v != null ? +v : 0.8));
    const info = arr(d.info).map(s => ({ id: s.id || uid(), title: str(s.title, 120) || 'Раздел', body: str(s.body, 20000), photos: arr(s.photos) }));
    const LINK_KINDS = ['vk', 'tg', 'yt', 'site', 'rent', 'phone'];
    const links = arr(d.links).filter(l => l && l.url).map(l => ({ id: l.id || uid(), kind: LINK_KINDS.includes(l.kind) ? l.kind : 'site', label: str(l.label, 60), url: str(l.url, 500) }));
    const labels = arr(d.labels).filter(l => l && l.text).map(l => ({ id: l.id || uid(), x: +l.x || 0, y: +l.y || 0, text: str(l.text, 80),
      size: Math.min(200, Math.max(10, +l.size || 40)), color: paint(l.color), opacity: op(l.opacity ?? 0.35), scale: !!l.scale }));
    const places = arr(d.places).map(p => ({
      id: p.id || uid(), name: p.name || 'Объект', type: PLACE_TYPES.includes(p.type) ? p.type : 'building',
      icon: iconName(p.icon), x: +p.x || 0, y: +p.y || 0, note: p.note || '', photos: arr(p.photos)
    }));
    const scenarios = arr(d.scenarios).map(s => ({ id: s.id || uid(), title: s.title || 'Сценарий', summary: s.summary || '', rules: s.rules || '', photos: arr(s.photos) }));
    const rawGames = arr(d.games);
    if (rawGames.some(g => !scenarios.some(s => s.id === g.scenarioId)) && !scenarios.length) {
      scenarios.push({ id: uid(), title: 'Сценарий без названия', summary: '', rules: '', photos: [] });
    }
    const ids = new Set(sides.map(s => s.id));
    const side = v => ids.has(v) ? v : (OLD_STATUS[v] && ids.has(OLD_STATUS[v]) ? OLD_STATUS[v] : '');
    const games = rawGames.map(g => {
      const sc = scenarios.some(s => s.id === g.scenarioId) ? g.scenarioId : scenarios[0].id;
      const gs = {};
      const src = Object.assign({}, g.sides || {});
      if (g.players && !g.sides) { src.blue = { players: g.players.ours }; src.red = { players: g.players.enemy }; }
      for (const k in src) if (ids.has(k) && src[k]) {
        // на стороне может быть много команд; старый формат { team, present } переводим в список из одной команды
        const raw = Array.isArray(src[k].teams) ? src[k].teams : src[k].team ? [{ id: src[k].team, players: null, present: src[k].present }] : [];
        const seen = new Set(), list = [];
        raw.forEach(e => {
          const id = String((e && (e.id || e.team)) || ''), tm = teams.find(t => t.id === id);
          if (!tm || seen.has(id)) return; seen.add(id);
          const present = [...new Set(arr(e.present).map(String))].filter(pid => tm.players.some(p => p.id === pid)); // только из состава этой команды
          list.push({ id, players: num(e.players), present });
        });
        gs[k] = { teams: list, players: num(src[k].players) };
      }
      return {
        id: g.id || uid(), scenarioId: sc, title: g.title || 'Игра', date: g.date || new Date().toISOString().slice(0, 10),
        time: /^\d{1,2}:\d{2}$/.test(g.time || '') ? g.time : '', featured: !!g.featured, summary: g.summary || '', gather: g.gather || '', result: g.result || '',
        photos: arr(g.photos), sides: gs,
        arrows: arr(g.arrows).map(a => ({ id: a.id || uid(), pts: poly(a.pts), color: paint(a.color), opacity: op(a.opacity), width: Math.min(20, Math.max(1, +a.width || 4)) })).filter(a => a.pts.length >= 2),
        points: arr(g.points).map(p => {
          const after = side(p.after != null ? p.after : p.status);
          return {
            id: p.id || uid(), name: p.name || 'Точка', type: POINT_TYPES.includes(p.type) ? p.type : 'point',
            icon: iconName(p.icon), x: +p.x || 0, y: +p.y || 0, after, before: p.before != null ? side(p.before) : after,
            area: poly(p.area), note: p.note || '', photos: arr(p.photos)
          };
        })
      };
    });
    return { version: 4, settings, sides, teams, info, links, labels, border: poly(d.border), places, scenarios, games };
  }

  function JsonBackend(cfg) {
    let published = normalizeDoc(null, cfg), doc = structuredClone(published), admin = false;
    return {
      mode: 'json',
      canWrite: () => admin,
      hasDraft: () => !!ls.get(DRAFT_KEY),
      doc: () => doc,
      async load() {
        const r = await fetch(cfg.jsonUrl + '?v=' + Date.now(), { cache: 'no-store' });
        if (!r.ok) throw new Error('Не удалось загрузить ' + cfg.jsonUrl);
        published = normalizeDoc(await r.json(), cfg);
        let draft = null;
        try { draft = admin && ls.get(DRAFT_KEY) ? JSON.parse(ls.get(DRAFT_KEY)) : null; } catch (e) { draft = null; }
        doc = draft ? normalizeDoc(draft, cfg) : structuredClone(published);
        return doc;
      },
      async signIn() { admin = true; return true; },
      async signOut() { admin = false; },
      /** Сохраняет текущий документ как черновик админа (до скачивания файла его видит только этот браузер). */
      async save() {
        doc = normalizeDoc(doc, cfg);
        if (!ls.set(DRAFT_KEY, JSON.stringify(doc))) console.warn('Браузер не дал сохранить черновик — не закрывайте вкладку до скачивания файла.');
        return doc;
      },
      async replace(data) { doc = normalizeDoc(data, cfg); return this.save(); },
      discardDraft() { ls.del(DRAFT_KEY); doc = structuredClone(published); return doc; },
      exportData: () => Object.assign({ exported: new Date().toISOString() }, doc)
    };
  }

  /* ================================================================
     SUPABASE: общая база для нескольких админов.
     Таблица site_doc: строка 'public' (всё, что видят посетители) и 'private'
     (телефоны игроков — читают только админы). Пишет только функция save_site,
     она пускает лишь email-ы из таблицы site_admins и не даёт затереть
     чужие правки: сохранение идёт только поверх той версии, которую вы загрузили.
     Если база недоступна, посетители видят data/games.json.
     ================================================================ */
  function SupabaseBackend(cfg) {
    const URL_ = String(cfg.supabaseUrl).replace(/\/+$/, ''), KEY = cfg.supabaseAnonKey, SES = 'polygon-sb-session';
    let doc = normalizeDoc(null, cfg), version = 0, meta = { at: '', by: '' }, admin = false, session = null, empty = false;
    try { session = JSON.parse(ls.get(SES) || 'null'); } catch (e) { session = null; }
    const keep = s => { session = s; if (s) ls.set(SES, JSON.stringify(s)); else ls.del(SES); };
    const err = async (r, def) => { let m = def; try { const j = await r.json(); m = j.message || j.msg || j.error_description || j.error || def; } catch (e) {} const e = new Error(m); e.status = r.status; return e; };
    async function auth(path, body) {
      const r = await fetch(`${URL_}/auth/v1/${path}`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw await err(r, 'Ошибка входа');
      const j = await r.json(); keep({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, email: (j.user && j.user.email) || '' });
    }
    async function token() {
      if (!session) return KEY;
      if (Date.now() > session.expires_at - 60000) {
        try { await auth('token?grant_type=refresh_token', { refresh_token: session.refresh_token }); }
        catch (e) { keep(null); admin = false; return KEY; }
      }
      return session.access_token;
    }
    async function rest(path, opts = {}) {
      const r = await fetch(`${URL_}/rest/v1/${path}`, Object.assign({}, opts, { headers: Object.assign({ apikey: KEY, Authorization: 'Bearer ' + await token(), 'Content-Type': 'application/json' }, opts.headers || {}) }));
      if (!r.ok) throw await err(r, 'Ошибка базы данных (' + r.status + ')');
      return r.status === 204 ? null : r.json();
    }
    const rpc = (fn, body) => rest('rpc/' + fn, { method: 'POST', body: JSON.stringify(body || {}) });
    async function checkAdmin() { try { admin = !!(await rpc('is_site_admin')); } catch (e) { admin = false; } return admin; }
    /** Телефоны игроков уходят в закрытую строку, посетителям не отдаются. */
    function split(d) {
      const pub = structuredClone(d), phones = {};
      pub.teams.forEach(t => t.players.forEach(p => { if (p.phone) phones[p.id] = p.phone; p.phone = ''; }));
      return { pub, priv: { phones } };
    }
    async function fallbackJson() {
      const r = await fetch(cfg.jsonUrl + '?v=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error('Не удалось загрузить данные');
      return r.json();
    }
    return {
      mode: 'supabase',
      canWrite: () => admin,
      hasDraft: () => false,
      doc: () => doc,
      who: () => (session && session.email) || '',
      meta: () => Object.assign({ version }, meta),
      isEmpty: () => empty,
      /** Есть ли в базе версия новее загруженной (другой админ что-то сохранил). */
      async remoteVersion() { const r = await rest('site_doc?id=eq.public&select=version,updated_at,updated_by'); return r[0] || null; },
      async load() {
        let row = null;
        try { row = (await rest('site_doc?id=eq.public&select=data,version,updated_at,updated_by'))[0] || null; }
        catch (e) { console.warn('База недоступна, показываю data/games.json', e); }
        empty = !row || !row.version;
        version = row ? row.version : 0; meta = { at: row ? row.updated_at : '', by: row ? row.updated_by : '' };
        let data = empty ? await fallbackJson() : row.data;
        if (admin && !empty) {
          try {
            const pr = (await rest('site_doc?id=eq.private&select=data'))[0];
            const phones = (pr && pr.data && pr.data.phones) || {};
            arr(data.teams).forEach(t => arr(t.players).forEach(p => { if (phones[p.id]) p.phone = phones[p.id]; }));
          } catch (e) { console.warn('Не удалось прочитать телефоны', e); }
        }
        doc = normalizeDoc(data, cfg);
        return doc;
      },
      /** Без аргументов — восстановить прошлый вход в этом браузере. */
      async signIn(email, password) {
        if (email) await auth('token?grant_type=password', { email: String(email).trim(), password });
        if (!session) return false;
        if (!(await checkAdmin())) { if (email) { const who = session.email; await this.signOut(); throw new Error(`${who} нет в списке админов. Добавьте его в таблицу site_admins в Supabase.`); } return false; }
        return true;
      },
      async signOut() {
        if (session) { try { await fetch(`${URL_}/auth/v1/logout`, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + session.access_token } }); } catch (e) {} }
        keep(null); admin = false;
      },
      async changePassword(password) {
        const r = await fetch(`${URL_}/auth/v1/user`, { method: 'PUT', headers: { apikey: KEY, Authorization: 'Bearer ' + await token(), 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
        if (!r.ok) throw await err(r, 'Не удалось сменить пароль');
      },
      /** Сохраняет всё в базу сразу для всех. Если кто-то сохранил раньше — ошибка с conflict = true. */
      async save() {
        if (!admin) throw new Error('Нужно войти как админ');
        doc = normalizeDoc(doc, cfg);
        const { pub, priv } = split(doc);
        try { version = await rpc('save_site', { p_version: version, p_public: pub, p_private: priv }); }
        catch (e) {
          if (/conflict/.test(e.message)) { const c = new Error('conflict'); c.conflict = true; throw c; }
          if (/not_admin/.test(e.message)) { admin = false; throw new Error('Вход истёк или вы больше не админ — войдите заново'); }
          throw e;
        }
        empty = false; meta = { at: new Date().toISOString(), by: this.who() };
        return doc;
      },
      async replace(data) { doc = normalizeDoc(data, cfg); return this.save(); },
      discardDraft() { return doc; },
      exportData: () => Object.assign({ exported: new Date().toISOString() }, doc)
    };
  }

  window.Store = {
    uid, normalizeDoc, POINT_TYPES, PLACE_TYPES,
    async create(cfg) { return cfg.storage === 'supabase' && cfg.supabaseUrl && cfg.supabaseAnonKey ? SupabaseBackend(cfg) : JsonBackend(cfg); }
  };
})();
