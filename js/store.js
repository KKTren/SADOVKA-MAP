/* ================================================================
   СЛОЙ ДАННЫХ. Всё чтение и запись идут только через этот файл.

   Файл data/games.json (версия 3):
   {
     settings:  { grid:{cols,rows,colLabels,rowLabels,x,y,cw,ch,angle,square}, border:{color,width}, signup:{ vk } },
     sides:     [{ id, name, color }],              // стороны: красная, синяя, серая…
     teams:     [{ id, name, logo, side, captain, city, since, vk, note, players:[{ id, callsign, role, rank, phone }] }],  // справочник команд; состав и note видны только админу
     info:      [{ id, title, body, photos }],      // разделы для новичков внизу сайта (правила, снаряжение, прокат…)
     links:     [{ id, kind, label, url }],         // соцсети и ссылки в шапке
     labels:    [{ id, x, y, text, size, color, opacity, scale }],  // крупные подписи полигона (color: '#rrggbb' или 'side:<id>')
     border:    [[x,y], …],                         // граница полигона (доли ширины/высоты)
     places:    [{ id, name, x, y, type, icon, note, photos }],   // постоянные объекты полигона
     scenarios: [{ id, title, summary, rules, photos }],    // «Взвод», «Поиск пилота»…
     tournaments: [{ id, scenarioId, kind:'bracket'|'list', title, note,
                     teams:[teamId…], results:{ 'r1m1': { winner, score, note } },  // сетка: порядок команд = пары 1-го раунда
                     rows:[{ id, team, points, note }] }],                          // список: место по очкам
     games:     [{ id, scenarioId, title, date:'ГГГГ-ММ-ДД', time:'ЧЧ:ММ', featured,
                   summary, gather, result, photos,
                   sides:{ [sideId]: { teams:[{ id:teamId, players, present:[playerId…] }], players } },  // players стороны — всего; пусто — сумма по командам
                   points:[{ id, name, type, icon, x, y,
                             before, after,          // id стороны-владельца до и после игры ('' — ничья)
                             area:[[x,y],…], note, photos }],
                   arrows:[{ id, pts:[[x,y],…], color, opacity, width }],  // стрелки направлений этой игры
                   view: 'map' | 'media',              // 'media' — игра без карты
                   media:{ url, caption, link, linkLabel } }]  // гифка/картинка вместо карты и кнопка-ссылка под ней
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
      carousel: v.carousel !== false,   // карусель эмблем команд в шапке
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
  /** Гифка/картинка вместо карты: ссылка, файл из папки сайта (img/…) или загруженный файл (data:image/…, до ~1 МБ). */
  const MEDIA_MAX = 1400000;
  function normMedia(m) {
    m = m && typeof m === 'object' ? m : {};
    const str = (v, n) => String(v || '').trim().slice(0, n);
    const u = String(m.url || '').trim();
    const url = /^data:image\/(gif|png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(u) && u.length <= MEDIA_MAX ? u
      : /^(https?:\/\/|img\/)[^\s"'<>]{1,1000}$/i.test(u) ? u : '';
    const link = str(m.link, 500);
    return { url, caption: str(m.caption, 200), link: /^https?:\/\//i.test(link) ? link : '', linkLabel: str(m.linkLabel, 60) };
  }
  /** Ссылка в подвале: https://…, tel:, mailto:, якорь #… или адрес без протокола (vk.com/…). */
  const okLink = u => /^(https?:\/\/|tel:|mailto:)[^\s"'<>]{1,500}$/i.test(u) || /^#[^"'<>\n]{1,200}$/.test(u) || /^[\w-]+(\.[\w-]+)+(\/[^\s"'<>]*)?$/i.test(u);
  function normFooter(f) {
    f = f && typeof f === 'object' ? f : {};
    const str = (v, n) => String(v || '').trim().slice(0, n);
    return {
      about: str(f.about, 600), copy: str(f.copy, 160),
      groups: arr(f.groups).slice(0, 6).map(g => ({
        title: str(g && g.title, 60),
        links: arr(g && g.links).map(l => ({ label: str(l && l.label, 80), url: str(l && l.url, 500) })).filter(l => l.url && okLink(l.url)).slice(0, 20)
      })).filter(g => g.title || g.links.length)
    };
  }
  /** Турниры сценария: 'bracket' — сетка на выбывание, 'list' — нумерованный список с очками. */
  function normTournaments(list, scenarios, teams) {
    const scIds = new Set(scenarios.map(s => s.id)), tIds = new Set(teams.map(t => t.id));
    const str = (v, n) => String(v || '').trim().slice(0, n);
    return arr(list).filter(t => t && scIds.has(t.scenarioId)).map(t => {
      const results = {};
      const r0 = t.results && typeof t.results === 'object' ? t.results : {};
      for (const k in r0) if (/^r\d{1,2}m\d{1,3}$/.test(k) && r0[k]) {
        const r = r0[k], w = tIds.has(r.winner) ? r.winner : '';
        const v = { winner: w, score: str(r.score, 20), note: str(r.note, 200) };
        if (v.winner || v.score || v.note) results[k] = v;
      }
      return {
        id: t.id || uid(), scenarioId: t.scenarioId, kind: t.kind === 'list' ? 'list' : 'bracket',
        overlay: t.overlay !== false,   // показывать поверх карты сценария
        title: str(t.title, 100) || 'Турнир', note: str(t.note, 1000),
        teams: [...new Set(arr(t.teams).map(String))].filter(id => tIds.has(id)).slice(0, 64),   // порядок = пары первого раунда
        results,
        rows: arr(t.rows).filter(r => r && tIds.has(String(r.team))).map(r => ({ id: r.id || uid(), team: String(r.team),
          points: isFinite(+r.points) && r.points !== '' && r.points != null ? Math.round(+r.points * 100) / 100 : null, note: str(r.note, 200) })).slice(0, 100)
      };
    });
  }
  function normRental(r) {
    r = r && typeof r === 'object' ? r : {};
    const str = (v, n) => String(v || '').trim().slice(0, n);
    return { items: arr(r.items).filter(i => i && str(i.name, 80)).slice(0, 30).map(i => ({ id: i.id || uid(), name: str(i.name, 80),
      price: isFinite(+i.price) && i.price !== '' && i.price != null ? Math.max(0, Math.round(+i.price)) : null, note: str(i.note, 120) })) };
  }
  const RATING_DEF = { show: true, game: 1, win: 3, draw: 1, point: 1, t1: 10, t2: 6, t3: 3 };
  function normRating(r) {
    r = r && typeof r === 'object' ? r : {};
    const out = { show: r.show !== false };
    for (const k of ['game', 'win', 'draw', 'point', 't1', 't2', 't3']) out[k] = isFinite(+r[k]) && r[k] !== '' && r[k] != null ? Math.max(0, Math.min(1000, +r[k])) : RATING_DEF[k];
    return out;
  }
  function normalizeDoc(d, cfg) {
    d = d || {};
    const g0 = (d.settings && d.settings.grid) || {}, gd = (cfg && cfg.grid) || { cols: 12, rows: 12 };
    const clampI = (v, def, max) => Math.min(max, Math.max(1, Math.round(+v) || def));
    const b0 = (d.settings && d.settings.border) || {};
    const settings = {
      // x,y — левый верхний угол сетки (доли ширины/высоты), cw/ch — размер клетки в метрах (null — растянуть на всю карту), angle — поворот в градусах
      grid: (() => {
        // свои подписи клеток (буквы по горизонтали, цифры по вертикали) в любом порядке; их число = число клеток
        const lbl = (a, max, n) => { const l = arr(a).map(v => String(v ?? '').trim().toUpperCase().slice(0, n)).filter(Boolean).slice(0, max); return l.length ? l : null; };
        const cl = lbl(g0.colLabels, 25, 3), rl = lbl(g0.rowLabels, 50, 4);
        return { cols: cl ? cl.length : clampI(g0.cols, gd.cols, 25), rows: rl ? rl.length : clampI(g0.rows, gd.rows, 50), colLabels: cl, rowLabels: rl, x: +g0.x || 0, y: +g0.y || 0,
          cw: +g0.cw > 0 ? +g0.cw : null, ch: +g0.ch > 0 ? +g0.ch : null, angle: Math.max(-180, Math.min(180, +g0.angle || 0)), square: !!g0.square };
      })(),
      border: { color: color(b0.color, '#f2c230'), width: Math.min(12, Math.max(1, +b0.width || 4)) },
      signup: { vk: String((d.settings && d.settings.signup && d.settings.signup.vk) || '').slice(0, 300) },
      showRoster: d.settings && d.settings.showRoster != null ? !!d.settings.showRoster : true,
      // верхняя сцена: галереи и время начала по умолчанию (null — берутся из js/config.js)
      hero: normHero(d.settings && d.settings.hero),
      // название полигона и эмблема (картинка: data:image/… из админки или ссылка); пусто — из js/config.js
      site: normSite(d.settings && d.settings.site),
      // подвал сайта: текст «о нас», колонки ссылок, строка внизу
      footer: normFooter(d.settings && d.settings.footer),
      // прокат: комплекты с ценами — игрок отмечает их в форме записи
      rental: normRental(d.settings && d.settings.rental),
      // рейтинг команд: сколько очков за что
      rating: normRating(d.settings && d.settings.rating)
    };
    const sides = (arr(d.sides).length ? d.sides : DEFAULT_SIDES).map(s => ({ id: s.id || uid(), name: s.name || 'Сторона', color: color(s.color, '#a7aaa0') }));
    const str = (v, n) => String(v ?? '').slice(0, n);
    const teams = arr(d.teams).map(t => ({ id: t.id || uid(), name: t.name || 'Команда',
      logo: /^\s*(javascript|data|vbscript):/i.test(t.logo || '') ? '' : str(t.logo, 500).trim(),  // эмблема: ссылка на картинку
      side: sides.some(x => x.id === t.side) ? t.side : '',                       // сторона по умолчанию ('' — в пуле)
      captain: str(t.captain, 60).trim(), city: str(t.city, 60).trim(),
      since: /^\d{4}$/.test(String(t.since || '')) ? String(t.since) : '',        // на полигоне с какого года
      vk: /^\s*(javascript|data|vbscript):/i.test(t.vk || '') ? '' : str(t.vk, 300).trim(),
      note: str(t.note, 1000),                                                     // заметка админа — в базе хранится в закрытой части
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
        // 'map' — игра на карте полигона, 'media' — без карты: вместо карты гифка или картинка
        view: g.view === 'media' ? 'media' : 'map', media: normMedia(g.media),
        // итог игры: id стороны-победителя, 'draw' — ничья, '' — авто (у кого больше точек после игры)
        winner: g.winner === 'draw' || ids.has(g.winner) ? g.winner : '',
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
    const tournaments = normTournaments(d.tournaments, scenarios, teams);
    // «Первый раз?» — короткие вопросы и ответы для новичков над разделами «Для игроков»
    const faq = arr(d.faq).filter(f => f && (f.q || f.a)).slice(0, 24).map(f => ({ id: f.id || uid(), q: str(f.q, 80), a: str(f.a, 400) }));
    return { version: 4, settings, sides, teams, info, links, labels, border: poly(d.border), places, scenarios, games, tournaments, faq };
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
      account: () => null,
      role: () => admin ? 'admin' : '',
      /** Сохраняет текущий документ как черновик админа (до скачивания файла его видит только этот браузер). */
      async save() {
        doc = normalizeDoc(doc, cfg);
        if (!ls.set(DRAFT_KEY, JSON.stringify(doc))) console.warn('Браузер не дал сохранить черновик — не закрывайте вкладку до скачивания файла.');
        return doc;
      },
      async replace(data) { doc = normalizeDoc(data, cfg); return this.save(); },
      discardDraft() { ls.del(DRAFT_KEY); doc = structuredClone(published); return doc; },
      exportData: () => Object.assign({ exported: new Date().toISOString() }, doc),
      live: LocalLive()
    };
  }

  /* ================================================================
     ЛАЙФ-КАРТА без базы: метки живут в этом браузере (вкладки видят друг друга).
     Для работы вдвоём с разных телефонов нужна база Supabase (supabase/live.sql).
     ================================================================ */
  function LocalLive() {
    const K = 'pm-live-v1';
    const rd = () => { try { return Object.assign({ marks: {}, log: [], shares: {} }, JSON.parse(ls.get(K) || '{}')); } catch (e) { return { marks: {}, log: [], shares: {} }; } };
    const wr = st => { st.log = st.log.slice(-2000); ls.set(K, JSON.stringify(st)); };
    let last = 0;
    const stamp = () => { let t = Date.now(); if (t <= last) t = last + 1; last = t; return new Date(t).toISOString(); };
    const rows = (st, g, since) => Object.values(st.marks).filter(m => m.game_id === g && (!since || m.updated_at > since)).sort((a, b) => a.updated_at.localeCompare(b.updated_at));
    return {
      shared: false,
      who: () => 'local',
      async put(m) { const st = rd(), t = stamp(); const row = { id: m.id, game_id: m.game, kind: m.kind, data: m.data || {}, author: 'local', gone: !!m.gone, updated_at: t };
        st.marks[m.id] = row; st.log.push({ mark_id: m.id, game_id: m.game, kind: m.kind, data: row.data, author: row.author, gone: row.gone, at: t }); wr(st); return t; },
      async clear(g) { const st = rd(), t = stamp(); Object.values(st.marks).forEach(m => { if (m.game_id === g && m.kind !== 'pt' && !m.gone) { m.gone = true; m.updated_at = t; st.log.push({ mark_id: m.id, game_id: g, kind: m.kind, data: m.data, author: 'local', gone: true, at: t }); } }); wr(st); },
      async pull(g, since) { return { now: new Date().toISOString(), game: g, rows: rows(rd(), g, since) }; },
      async guestPut(tk, m) { const st = rd(), sh = st.shares[tk]; if (!sh || sh.exp < Date.now()) throw new Error('link_expired');
        if (!/^gu:[\w-]{6,64}$/.test(m.id) || (st.marks[m.id] && st.marks[m.id].kind !== 'guest')) throw new Error('bad_id');
        return this.put(Object.assign({}, m, { game: sh.game, kind: 'guest' })); },
      async view(tk, since) { const st = rd(), sh = st.shares[tk]; if (!sh || sh.exp < Date.now()) throw new Error('link_expired');
        return { now: new Date().toISOString(), game: sh.game, rows: rows(st, sh.game, since).map(r => Object.assign({}, r, { author: '' })) }; },
      async journal(g, n = 200) { return rd().log.filter(l => l.game_id === g).slice(-n).reverse(); },
      async shareNew(g, h, label) { const st = rd(), tk = (uid() + uid()).replace(/-/g, ''); st.shares[tk] = { game: g, exp: Date.now() + h * 3600e3, label: label || '', at: Date.now() }; wr(st); return tk; },
      async shareList() { const st = rd(); return Object.entries(st.shares).filter(([, v]) => v.exp > Date.now()).map(([k, v]) => ({ token: k, game_id: v.game, label: v.label || '', created_by: 'этот браузер', created_at: new Date(v.at || Date.now()).toISOString(), expires_at: new Date(v.exp).toISOString() })).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
      async shareDel(tk) { const st = rd(); delete st.shares[tk]; wr(st); },
      async shareStop(g) { const st = rd(); for (const k in st.shares) if (st.shares[k].game === g) delete st.shares[k]; wr(st); }
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
    let doc = normalizeDoc(null, cfg), version = 0, meta = { at: '', by: '' }, admin = false, session = null, empty = false, profile = null;
    /* Вход по логину: Supabase нужен адрес почты — делаем служебный из логина (письма туда не ходят:
       в настройках Supabase выключено «Confirm email»). Админы по-прежнему могут входить своей почтой. */
    const LOGIN_DOMAIN = 'sadovka.player';
    const toEmail = l => { l = String(l || '').trim(); return l.includes('@') ? l : l.toLowerCase() + '@' + LOGIN_DOMAIN; };
    async function loadProfile() {
      try { profile = await rpc('my_profile'); } catch (e) { profile = null; }   // accounts.sql ещё не выполнен — только админы
      if (admin) profile = Object.assign({}, profile || {}, { role: 'admin' });
      return profile;
    }
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
      const pub = structuredClone(d), phones = {}, notes = {};
      pub.teams.forEach(t => { if (t.note) notes[t.id] = t.note; t.note = ''; t.players.forEach(p => { if (p.phone) phones[p.id] = p.phone; p.phone = ''; }); });
      return { pub, priv: { phones, notes } };
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
            const notes = (pr && pr.data && pr.data.notes) || {};
            arr(data.teams).forEach(t => { if (notes[t.id]) t.note = notes[t.id]; arr(t.players).forEach(p => { if (phones[p.id]) p.phone = phones[p.id]; }); });
          } catch (e) { console.warn('Не удалось прочитать телефоны', e); }
        }
        doc = normalizeDoc(data, cfg);
        return doc;
      },
      /** Без аргументов — восстановить прошлый вход в этом браузере. */
      async signIn(email, password) {
        if (email) await auth('token?grant_type=password', { email: toEmail(email), password });
        if (!session) return false;
        await checkAdmin(); await loadProfile();
        if (!admin && !(profile && profile.role)) {   // нет ни админа, ни профиля (accounts.sql не выполнен)
          if (email) { const who = session.email; await this.signOut(); throw new Error(`${who} нет в списке админов. Добавьте его в таблицу site_admins в Supabase.`); }
          return false;
        }
        return true;
      },
      /** Регистрация: логин + пароль + позывной, команда, кем хочет быть. Роль выдаёт админ. */
      async signUp({ login, password, callsign, team, wish }) {
        const r = await fetch(`${URL_}/auth/v1/signup`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: toEmail(login), password, data: { login: String(login).trim().toLowerCase(), callsign, team, wish } }) });
        if (!r.ok) { const e = await err(r, 'Не удалось зарегистрироваться'); if (/already|exists|registered/i.test(e.message)) e.message = 'Такой логин уже занят'; if (/signups? not allowed|disabled/i.test(e.message)) e.message = 'Регистрация выключена в настройках Supabase'; throw e; }
        const j = await r.json();
        if (!j.access_token) throw new Error('В Supabase включено подтверждение почты — выключите «Confirm email», иначе вход по логину не работает');
        keep({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, email: (j.user && j.user.email) || '' });
        await checkAdmin(); await loadProfile();
        return true;
      },
      account: () => profile,
      role: () => admin ? 'admin' : (profile && profile.role) || '',
      async refreshProfile() { await checkAdmin(); return loadProfile(); },
      updateMe: (callsign, team) => rpc('my_profile_update', { p_callsign: callsign, p_team: team }),
      people: {
        list: () => rpc('people_list'),
        set: (uid, role, team, callsign) => rpc('people_set', { p_uid: uid, p_role: role, p_team: team, p_callsign: callsign }),
        password: (uid, pass) => rpc('people_password', { p_uid: uid, p_pass: pass })
      },
      async signOut() {
        if (session) { try { await fetch(`${URL_}/auth/v1/logout`, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + session.access_token } }); } catch (e) {} }
        keep(null); admin = false; profile = null;
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
      exportData: () => Object.assign({ exported: new Date().toISOString() }, doc),
      /** Лайф-карта: метки во время игры (supabase/live.sql). */
      live: {
        shared: true,
        who: () => (session && session.email) || '',
        put: m => rpc('live_put', { p_id: m.id, p_game: m.game, p_kind: m.kind, p_data: m.data || {}, p_gone: !!m.gone }),
        clear: g => rpc('live_clear', { p_game: g }),
        pull: (g, since) => rpc('live_pull', { p_game: g, p_since: since || null }),
        view: (tk, since) => rpc('live_view', { p_token: tk, p_since: since || null }),
        guestPut: (tk, m) => rpc('live_guest_put', { p_token: tk, p_id: m.id, p_data: m.data || {}, p_gone: !!m.gone }),
        playerPut: m => rpc('live_player_put', { p_game: m.game, p_id: m.id, p_data: m.data || {}, p_gone: !!m.gone }),
        journal: (g, n = 200) => rpc('live_journal', { p_game: g, p_limit: n }),
        shareNew: (g, h, label) => rpc('live_share_new', { p_game: g, p_hours: h, p_label: label || '' }),
        shareList: () => rpc('live_share_list'),
        shareDel: tk => rpc('live_share_del', { p_token: tk }),
        shareStop: g => rpc('live_share_stop', { p_game: g })
      }
    };
  }

  window.Store = {
    uid, normalizeDoc, POINT_TYPES, PLACE_TYPES, MEDIA_MAX,
    async create(cfg) { return cfg.storage === 'supabase' && cfg.supabaseUrl && cfg.supabaseAnonKey ? SupabaseBackend(cfg) : JsonBackend(cfg); }
  };
})();
