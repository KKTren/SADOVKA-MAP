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
     games:     [{ id, scenarioId, title, date:'ГГГГ-ММ-ДД', featured,
                   summary, gather, result, photos,
                   sides:{ [sideId]: { team, players, present:[playerId…] } },
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
      showRoster: d.settings && d.settings.showRoster != null ? !!d.settings.showRoster : true
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
        const team = src[k].team || '', tm = teams.find(t => t.id === team);
        const present = tm ? [...new Set(arr(src[k].present).map(String))].filter(pid => tm.players.some(p => p.id === pid)) : []; // только из состава выбранной команды
        gs[k] = { team, players: num(src[k].players), present };
      }
      return {
        id: g.id || uid(), scenarioId: sc, title: g.title || 'Игра', date: g.date || new Date().toISOString().slice(0, 10),
        featured: !!g.featured, summary: g.summary || '', gather: g.gather || '', result: g.result || '',
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

  window.Store = {
    uid, normalizeDoc, POINT_TYPES, PLACE_TYPES,
    async create(cfg) { return JsonBackend(cfg); }
  };
})();
