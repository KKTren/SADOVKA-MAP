/* ================================================================
   ПОЛИГОН «САДОВКА» — визитка организаторов и тактическая карта
   Сценарии → цепочки игр → точки с владельцами «до» и «после» игры.
   ================================================================ */
(async function () {
  'use strict';
  const C = window.APP_CONFIG;
  const $ = s => document.querySelector(s);
  const app = $('#app');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const fmtDate = d => { const [y, m, dd] = String(d).split('-'); return dd ? `${dd}.${m}.${y}` : d; };
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const WD = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const isFuture = g => g.date >= today();
  const isMobile = () => matchMedia('(max-width: 760px)').matches;
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- значки ---------- */
  const ICON = {
    point: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="currentColor" stroke-width="2"/></svg>',
    flag: '<svg viewBox="0 0 24 24"><path d="M6 22V3" stroke="currentColor" stroke-width="2"/><path d="M6 4h12l-3 4 3 4H6z" fill="currentColor"/></svg>',
    bunker: '<svg viewBox="0 0 24 24"><path d="M3 20h18M5 20v-7l7-5 7 5v7" fill="none" stroke="currentColor" stroke-width="2"/><rect x="8" y="14" width="8" height="2.5" fill="currentColor"/></svg>',
    respawn: '<svg viewBox="0 0 24 24"><path d="M19 12a7 7 0 1 1-2.1-5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M19 3v5h-5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 9v6M9 12h6" stroke="currentColor" stroke-width="2"/></svg>',
    hq: '<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" fill="currentColor"/></svg>',
    building: '<svg viewBox="0 0 24 24"><path d="M4 21V9l8-5 8 5v12" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 21v-6h6v6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    tower: '<svg viewBox="0 0 24 24"><path d="M8 22l2-14h4l2 14M6 8h12M9 4h6v4H9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9.4 15h5.2" stroke="currentColor" stroke-width="2"/></svg>',
    parking: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
    entry: '<svg viewBox="0 0 24 24"><path d="M10 4h9v16h-9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h11M10 8l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
    target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6L12 16.3 6.6 19.3l1.3-6L3.3 9.2l6.1-.6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    mine: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="6" fill="currentColor"/><path d="M12 3v4M4.5 6.5l2.6 2.6M19.5 6.5l-2.6 2.6M3 13h3M18 13h3" stroke="currentColor" stroke-width="2"/></svg>',
    wire: '<svg viewBox="0 0 24 24"><path d="M2 17c2-3 4-3 5 0s3 3 5 0 3-3 5 0 3 3 5 0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 9l3 3M7 9l-3 3M11 9l3 3M14 9l-3 3M18 9l3 3M21 9l-3 3" stroke="currentColor" stroke-width="1.8"/></svg>',
    danger: '<svg viewBox="0 0 24 24"><path d="M12 3l10 17H2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 9v5" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="17" r="1.3" fill="currentColor"/></svg>',
    medic: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v10M7 12h10" stroke="currentColor" stroke-width="3.2"/></svg>',
    ammo: '<svg viewBox="0 0 24 24"><path d="M5 21V9c0-3 1-5 2-6 1 1 2 3 2 6v12zM10.5 21V9c0-3 1-5 2-6 1 1 2 3 2 6v12zM16 21V9c0-3 1-5 2-6 1 1 2 3 2 6v12z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M5 17h4M10.5 17h4M16 17h4" stroke="currentColor" stroke-width="1.7"/></svg>',
    crate: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 6v14M16 6v14M3 6l3-3h12l3 3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    sniper: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v7M12 15v7M2 12h7M15 12h7" stroke="currentColor" stroke-width="2"/></svg>',
    checkpoint: '<svg viewBox="0 0 24 24"><path d="M4 21V5M4 9h16" stroke="currentColor" stroke-width="2.2"/><path d="M7 9l3-4M11 9l3-4M15 9l3-4" stroke="currentColor" stroke-width="2"/><rect x="2" y="19" width="5" height="3" fill="currentColor"/></svg>',
    bridge: '<svg viewBox="0 0 24 24"><path d="M2 9h20M2 16h20" stroke="currentColor" stroke-width="2"/><path d="M5 9c2 3 4 4 7 4s5-1 7-4M6 13v3M12 13v3M18 13v3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    ford: '<svg viewBox="0 0 24 24"><path d="M2 8c2-2 4-2 5 0s3 2 5 0 3-2 5 0 3 2 5 0M2 16c2-2 4-2 5 0s3 2 5 0 3-2 5 0 3 2 5 0" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/><circle cx="13" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/></svg>',
    radio: '<svg viewBox="0 0 24 24"><path d="M8 22l4-13 4 13M9.3 18h5.4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7" r="2" fill="currentColor"/><path d="M7.5 3.5a6 6 0 0 0 0 7M16.5 3.5a6 6 0 0 1 0 7M5 1.5a9 9 0 0 0 0 11M19 1.5a9 9 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    ambush: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    trench: '<svg viewBox="0 0 24 24"><path d="M2 8h4l2 4h2l2-4 2 4h2l2-4h4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 16h20" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2"/></svg>',
    tent: '<svg viewBox="0 0 24 24"><path d="M2 20L12 4l10 16z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 20l-3-6h6z" fill="currentColor"/></svg>',
    vehicle: '<svg viewBox="0 0 24 24"><path d="M2 15h20v3H2zM5 15l2-5h8l3 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M11 10V7h8" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="19.5" r="1.8" fill="currentColor"/><circle cx="12" cy="19.5" r="1.8" fill="currentColor"/><circle cx="18" cy="19.5" r="1.8" fill="currentColor"/></svg>',
    heli: '<svg viewBox="0 0 24 24"><path d="M3 5h18M12 5v4" stroke="currentColor" stroke-width="2"/><path d="M5 13c0-2.5 2.5-4 6-4h2c3 0 5 2 5 4s-2 4-5 4h-4c-2.5 0-4-1.5-4-4zM18 13h4M8 17l-1 3M15 17l1 3M5 20h13" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    pilot: '<svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 21v-5a6 6 0 0 1 12 0v5M3 11l4 2M21 11l-4 2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    intel: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="2"/></svg>',
    water: '<svg viewBox="0 0 24 24"><path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    skull: '<svg viewBox="0 0 24 24"><path d="M5 11a7 7 0 0 1 14 0v3l-2 1v4H7v-4l-2-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="9.3" cy="11.5" r="1.8" fill="currentColor"/><circle cx="14.7" cy="11.5" r="1.8" fill="currentColor"/><path d="M10 19v-2M14 19v-2" stroke="currentColor" stroke-width="1.6"/></svg>',
    drive: '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 3h8l6 10-4 7H6l-4-7z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
  };
  const SOC = {
    vk: { name: 'ВКонтакте', svg: '<svg viewBox="0 0 24 24"><path d="M3 7h3.2c.3 3 1.6 5.2 3 5.8V7h3v3.4c1.3-.2 2.7-1.9 3.2-3.4h3c-.5 2.2-2.1 4-3.3 4.7 1.2.6 3 2.1 3.7 4.8h-3.3c-.6-1.8-2-3.1-3.3-3.3v3.3h-.4C6.8 16.5 3.4 13 3 7z" fill="currentColor"/></svg>' },
    tg: { name: 'Telegram', svg: '<svg viewBox="0 0 24 24"><path d="M21 4L3 11l5 2 2 6 3-4 5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 13l9-6-6 8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>' },
    yt: { name: 'YouTube', svg: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 9v6l5-3z" fill="currentColor"/></svg>' },
    site: { name: 'Сайт', svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>' },
    rent: { name: 'Прокат', svg: '<svg viewBox="0 0 24 24"><path d="M4 8l4-4h8l4 4v12H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 4c0 2 1.3 3 3 3s3-1 3-3M4 11h16" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>' },
    phone: { name: 'Телефон', svg: '<svg viewBox="0 0 24 24"><path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a3 3 0 0 1-3 3A16 16 0 0 1 3 6a3 3 0 0 1 3-3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>' }
  };
  const TYPES = { point: 'Точка', flag: 'Флаг', bunker: 'Бункер', respawn: 'Респаун', hq: 'Штаб' };
  const PLACE_TYPES = { building: 'Здание', tower: 'Вышка', bunker: 'Бункер', parking: 'Парковка', entry: 'Вход', point: 'Ориентир', flag: 'Флаг', respawn: 'Респаун', hq: 'Штаб' };
  const NOBODY = '#e9e6da';
  /** Значки для выбора в формах (подпись — подсказка при наведении). */
  const ICON_NAMES = { point: 'Точка', flag: 'Флаг', star: 'Звезда', target: 'Цель', hq: 'Штаб', respawn: 'Респаун', bunker: 'Бункер', trench: 'Окоп', building: 'Здание',
    tower: 'Вышка', radio: 'Радиовышка', checkpoint: 'Блокпост', sniper: 'Снайпер', ambush: 'Засада', mine: 'Мина', wire: 'Колючка/растяжка', danger: 'Опасно',
    skull: 'Опасная зона', medic: 'Медпункт', ammo: 'Боеприпасы', crate: 'Склад', intel: 'Документы', pilot: 'Пилот', heli: 'Вертолёт', vehicle: 'Техника',
    tent: 'Лагерь', bridge: 'Мост', ford: 'Брод', water: 'Вода', parking: 'Парковка', entry: 'Вход' };
  /** Значок точки или объекта: выбранный вручную, иначе — по типу. */
  const iconOf = (p, def = 'point') => ICON[p.icon] || ICON[p.type] || ICON[def];
  const iconPicker = (sel, type) => `<div class="icons" role="radiogroup" aria-label="Значок">
    <label class="ipick ipick--auto" title="По типу"><input type="radio" name="icon" value="" ${!sel ? 'checked' : ''}><span>${ICON[type] || ICON.point}<small>по типу</small></span></label>` +
    Object.entries(ICON_NAMES).map(([k, v]) => `<label class="ipick" title="${esc(v)}"><input type="radio" name="icon" value="${k}" ${sel === k ? 'checked' : ''} aria-label="${esc(v)}"><span>${ICON[k]}</span></label>`).join('') + '</div>';
  const COLS = 'АБВГДЕЖИКЛМНПРСТУФХЦЧШЭЮЯ'; // без З, Й, О
  const SNAIL = [[1, 2, 3], [8, 9, 4], [7, 6, 5]];

  /* ---------- состояние ---------- */
  const S = {
    scId: null, gameId: null, pointId: null, placeId: null, tab: 'game', phase: 'after',
    f: Object.assign({ places: true, areas: true, arrows: true, mapLabels: true, relief: true, border: true, grid: true, labels: true }, ls.get('pm-layers', {})),
    night: ls.get('pm-night', false), mode: null
  };
  let store, idx, map, W, H, Z, tileLayer, relief = null;
  let markersLayer, placesLayer, areasLayer, borderLayer, gridLayer, reliefLayer, drawLayer, arrowsLayer, labelsLayer;
  const markerById = new Map();
  const D = () => store.doc();

  /* ---------- данные ---------- */
  const sideById = id => D().sides.find(s => s.id === id) || null;
  const sideColor = id => sideById(id)?.color || NOBODY;
  /** Цвет рисунка: '#rrggbb' или 'side:<id>' — цвет стороны. */
  const paintColor = c => String(c || '').startsWith('side:') ? sideColor(c.slice(5)) : (c || '#ffffff');
  const sideName = id => sideById(id)?.name || 'Ничья';
  const teamName = id => D().teams.find(t => t.id === id)?.name || '';
  /** Эмблема команды (картинка по ссылке); нет картинки или она не загрузилась — цветной кружок стороны. */
  function teamBadge(teamId, sideId, cls = '') {
    const t = D().teams.find(x => x.id === teamId), c = sideColor(sideId);
    const dot = `<i class="tb-dot ${cls}" style="--c:${c}"></i>`;
    if (!t || !t.logo || !safeUrl(t.logo)) return dot;
    return `<span class="tb ${cls}" style="--c:${c}"><img src="${esc(photoSrc(t.logo, 160))}" alt="Эмблема: ${esc(t.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('tb--err');this.remove()"></span>`;
  }
  /* --- название полигона и эмблема: из админки (settings.site), иначе из js/config.js --- */
  const siteTitle = () => (D().settings.site && D().settings.site.title) || C.siteTitle;
  const siteLogo = () => (D().settings.site && D().settings.site.logo) || '';
  const DEFAULT_LOGO = $('#brandLogo') ? $('#brandLogo').innerHTML : '', DEFAULT_ICON = ($('#favicon') || {}).href;
  function renderBrand() {
    const t = siteTitle(), l = siteLogo();
    $('#siteTitle').textContent = t; document.title = t;
    // картинка без подложки: прозрачный фон остаётся прозрачным
    $('#brandLogo').innerHTML = l ? `<img src="${esc(photoSrc(l, 256))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : DEFAULT_LOGO;
    $('#brandLogo').classList.toggle('has-img', !!l);
    if ($('#favicon')) $('#favicon').href = l && l.startsWith('data:') ? l : DEFAULT_ICON;
  }
  const plural = (n, a, b, c) => { const m = n % 100, k = n % 10; return m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c; };
  /* --- команды на стороне: на одной стороне может играть сколько угодно команд --- */
  const sideEntries = s => ((s && s.teams) || []).map(e => Object.assign({}, e, { t: D().teams.find(x => x.id === e.id) })).filter(e => e.t);
  const entryCount = e => e.present.length || e.players;   // отмеченных по составу, иначе введённое число
  function sideTotal(s) {
    if (!s) return null; if (s.players != null) return s.players;
    const c = sideEntries(s).map(entryCount).filter(v => v != null);
    return c.length ? c.reduce((a, b) => a + b, 0) : null;
  }
  /** «Волки, Беркут, Север +4» — первые max команд стороны. */
  function teamsList(s, max = 3) {
    const l = sideEntries(s); if (!l.length) return '';
    return l.slice(0, max).map(e => esc(e.t.name)).join(', ') + (l.length > max ? ` <span class="more">+${l.length - max}</span>` : '');
  }
  const teamsBadges = (s, sideId, max = 3, cls = 'tb--s') => `<span class="tbs">${sideEntries(s).slice(0, max).map(e => teamBadge(e.id, sideId, cls)).join('')}</span>`;
  /** Строка «кто играл» для хроники: по каждой стороне — эмблемы и названия её команд. */
  function teamsMini(g) {
    const ids = Object.keys(g.sides || {}).filter(id => sideById(id) && sideEntries(g.sides[id]).length);
    if (!ids.length) return '';
    return '<div class="tm">' + ids.map(id => `<span class="tm__t" style="--c:${sideColor(id)}">${teamsBadges(g.sides[id], id)}<span>${teamsList(g.sides[id])}</span></span>`).join('<span class="vs">vs</span>') + '</div>';
  }
  const scById = id => D().scenarios.find(s => s.id === id) || null;
  /** Текст с переносами строк; ссылки http(s) и [текст](ссылка) становятся кликабельными. */
  function linkify(text) {
    const okUrl = u => /^(https?:\/\/|tel:|mailto:)/i.test(u);
    let h = esc(text);
    h = h.replace(/\[([^\]\n]{1,120})\]\(([^)\s]{1,500})\)/g, (m, t, u) => okUrl(u.replace(/&amp;/g, '&')) ? `<a href="${u}" target="_blank" rel="noopener">${t}</a>` : m);
    h = h.replace(/(^|[\s(])(https?:\/\/[^\s<)]{2,500})/g, (m, pre, u) => `${pre}<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//, '')}</a>`);
    return h.replace(/\n/g, '<br>');
  }
  /** Текст разделов «Для игроков» с простой разметкой:
      ## Заголовок · - пункт списка · 1. нумерованный пункт · | таблица | ячейки | · **жирный** · [ссылка](https://…) */
  function richText(text) {
    const inl = t => linkify(t).replace(/\*\*([^*\n]{1,300})\*\*/g, '<b>$1</b>');
    const lines = String(text || '').replace(/\r/g, '').split('\n'), out = [];
    for (let i = 0; i < lines.length;) {
      const l = lines[i].trim();
      if (!l) { i++; continue; }
      if (/^#{2,3}\s/.test(l)) { out.push(`<h4>${inl(l.replace(/^#+\s*/, ''))}</h4>`); i++; continue; }
      if (l.startsWith('|')) {
        const rows = []; while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++].trim());
        const cells = r => r.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
        const body = rows.filter(r => !/^\|[\s|:-]+\|?$/.test(r)), head = body.shift();
        out.push(`<div class="rt-tbl"><table><thead><tr>${cells(head).map(c => `<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${cells(r).map(c => `<td>${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }
      const li = /^(-|•|\d+[.)])\s+/;
      if (li.test(l)) {
        const ol = /^\d/.test(l), items = [];
        while (i < lines.length && li.test(lines[i].trim()) && /^\d/.test(lines[i].trim()) === ol) items.push(lines[i++].trim().replace(li, ''));
        out.push(`<${ol ? 'ol' : 'ul'}>${items.map(x => `<li>${inl(x)}</li>`).join('')}</${ol ? 'ol' : 'ul'}>`);
        continue;
      }
      const para = []; while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|\||-\s|•\s|\d+[.)]\s)/.test(lines[i].trim())) para.push(lines[i++].trim());
      out.push(`<p>${para.map(inl).join('<br>')}</p>`);
    }
    return `<div class="rt">${out.join('')}</div>`;
  }
  const scGames = id => D().games.filter(g => g.scenarioId === id).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  const curScenario = () => scById(S.scId);
  const curGame = () => D().games.find(g => g.id === S.gameId && g.scenarioId === S.scId) || null;
  /** Игра без карты: вместо карты показывается гифка или картинка. */
  const isMedia = g => !!g && g.view === 'media';
  const prevGame = g => { const l = scGames(g.scenarioId).filter(x => !isMedia(x) || x.id === g.id); // игры без карты цепочку точек не прерывают
    const i = l.findIndex(x => x.id === g.id); return i > 0 ? l[i - 1] : null; };
  const findByName = (g, name) => g ? g.points.find(p => norm(p.name) === norm(name)) || null : null;
  const owner = p => S.phase === 'before' ? p.before : p.after;
  const changed = p => p.before !== p.after;
  const places = () => D().places;
  const gridCfg = () => S.gridEdit || D().settings.grid;
  /** Метров в одном пикселе подложки (по привязке рельефа; без неё — из настроек). */
  const mpp = () => relief && relief.bounds ? (relief.bounds.se[1] - relief.bounds.nw[1]) * 111320 * Math.cos(relief.bounds.nw[0] * Math.PI / 180) / W : (C.metersPerPixel || 0.108);
  /** Геометрия сетки в пикселях подложки: начало, размер клетки, оси с учётом поворота. */
  function gridGeo(g = gridCfg()) {
    const m = mpp(), a = (g.angle || 0) * Math.PI / 180;
    return { cols: g.cols, rows: g.rows, ox: (g.x || 0) * W, oy: (g.y || 0) * H,
      cw: (g.cw || W * m / g.cols) / m, ch: (g.ch || H * m / g.rows) / m,
      ux: Math.cos(a), uy: Math.sin(a), vx: -Math.sin(a), vy: Math.cos(a) };
  }
  const gCorner = (G, i, j) => [G.ox + G.ux * i * G.cw + G.vx * j * G.ch, G.oy + G.uy * i * G.cw + G.vy * j * G.ch];
  const pxLL = ([px, py]) => map.unproject([px, py], Z);
  const llPx = ll => { const p = map.project(ll, Z); return [p.x, p.y]; };
  /** Ближайшая игра: отмеченная галочкой, иначе первая будущая по дате. */
  function featuredGame() {
    const f = D().games.find(g => g.featured && isFuture(g)); // прошедшая игра сама уходит из анонса
    if (f) return f;
    return D().games.filter(isFuture).sort((a, b) => a.date.localeCompare(b.date))[0] || null;
  }
  function defaultGame(scId) {
    const l = scGames(scId); if (!l.length) return null;
    const f = featuredGame(); if (f && f.scenarioId === scId) return f;
    const past = l.filter(g => !isFuture(g)); return past.length ? past[past.length - 1] : l[0];
  }

  /* ---------- квадраты и высоты ---------- */
  function squareOf(x, y) {
    const G = gridGeo(), dx = x * W - G.ox, dy = y * H - G.oy;
    const gi = (dx * G.ux + dy * G.uy) / G.cw, gj = (dx * G.vx + dy * G.vy) / G.ch;
    if (gi < 0 || gj < 0 || gi >= G.cols || gj >= G.rows) return { sq: 'вне сетки', snail: '—', out: true };
    const cx = Math.floor(gi), cy = Math.floor(gj);
    const sx = Math.min(2, Math.floor((gi - cx) * 3)), sy = Math.min(2, Math.floor((gj - cy) * 3));
    return { sq: COLS[cx] + (cy + 1), snail: SNAIL[sy][sx] };
  }
  function heightAt(x, y) {
    if (!relief || !relief.grid) return null;
    const { cols, rows, data } = relief.grid;
    const fx = Math.min(cols - 1, Math.max(0, x * cols - .5)), fy = Math.min(rows - 1, Math.max(0, y * rows - .5));
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(cols - 1, x0 + 1), y1 = Math.min(rows - 1, y0 + 1);
    const tx = fx - x0, ty = fy - y0, v = (c, r) => data[r * cols + c];
    return Math.round((v(x0, y0) * (1 - tx) + v(x1, y0) * tx) * (1 - ty) + (v(x0, y1) * (1 - tx) + v(x1, y1) * tx) * ty);
  }
  const coordsBox = (x, y) => { const { sq, snail, out } = squareOf(x, y), h = heightAt(x, y); return `${out ? 'Вне сетки квадратов' : `Квадрат <b>${sq}</b>, по улитке <b>${snail}</b>`}${h != null ? `<br>Высота <b>≈ ${h} м</b>` : ''}`; };

  /* ---------- фото Google Drive ---------- */
  function driveId(u) {
    const m = u.match(/drive\.google\.com\/file\/d\/([\w-]{10,})/) ||
      u.match(/(?:drive|docs)\.google\.com\/(?:open|uc|thumbnail)\?(?:[^#]*&)?id=([\w-]{10,})/) ||
      u.match(/lh3\.googleusercontent\.com\/d\/([\w-]{10,})/);
    return m ? m[1] : null;
  }
  const isFolderLink = u => /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//.test(u);
  const safeUrl = u => !/^\s*(javascript|data|vbscript):/i.test(u);
  const photoSrc = (u, w) => { const id = driveId(u); return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${w}` : u; };
  /** Полный файл для показа вместо карты: у Google Drive берём оригинал (миниатюра Drive — без анимации). */
  const mediaSrc = u => { const id = driveId(u); return id ? `https://lh3.googleusercontent.com/d/${id}` : u; };
  const photoOrig = u => { const id = driveId(u); return id ? `https://drive.google.com/file/d/${id}/view` : u; };
  function parsePhotos(text) {
    const out = [], warn = [];
    String(text || '').split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
      const [url, ...rest] = line.split('|');
      const u = url.trim(), caption = rest.join('|').trim();
      if (!safeUrl(u)) { warn.push('Пропущена недопустимая ссылка'); return; }
      if (isFolderLink(u)) { warn.push('Ссылка на папку Drive не подойдёт — нужна ссылка на каждый файл'); return; }
      out.push({ url: u, caption });
    });
    return { photos: out, warn };
  }
  const photosToText = ph => (ph || []).map(p => p.url + (p.caption ? ' | ' + p.caption : '')).join('\n');
  const galleries = {};
  function gallery(key, photos) {
    if (!photos || !photos.length) return '';
    galleries[key] = photos;
    const anyDrive = photos.some(p => driveId(p.url));
    return `<div class="gal">${photos.map((p, i) => `
      <button class="gal__item" data-gal="${esc(key)}" data-i="${i}" title="${esc(p.caption || 'Фото')}">
        <img loading="lazy" referrerpolicy="no-referrer" src="${esc(photoSrc(p.url, 480))}" alt="${esc(p.caption || '')}" onerror="this.parentNode.classList.add('err')">
        <span>${esc(p.caption || '')}</span>
      </button>`).join('')}
      ${anyDrive ? `<div class="gal__foot">${ICON.drive} Фото из Google Drive</div>` : ''}</div>`;
  }
  const LB = { list: [], i: 0 };
  function lbShow() {
    const p = LB.list[LB.i];
    $('#lbImg').src = p.full ? mediaSrc(p.url) : photoSrc(p.url, 2000); $('#lbImg').alt = p.caption || '';
    $('#lbCap').textContent = p.caption || '';
    $('#lbCount').textContent = LB.list.length > 1 ? `${LB.i + 1} / ${LB.list.length}` : '';
    $('#lbOrig').href = photoOrig(p.url); $('#lbOrig').hidden = p.url.startsWith('data:');
    $('#lbPrev').hidden = $('#lbNext').hidden = LB.list.length < 2;
  }
  function lbOpen(list, i) { LB.list = list; LB.i = i; lbShow(); $('#lightbox').hidden = false; $('#lbClose').focus(); }
  const lbClose = () => { $('#lightbox').hidden = true; $('#lbImg').src = ''; };
  const lbStep = d => { LB.i = (LB.i + d + LB.list.length) % LB.list.length; lbShow(); };
  $('#lbClose').onclick = lbClose; $('#lbPrev').onclick = () => lbStep(-1); $('#lbNext').onclick = () => lbStep(1);
  $('#lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') lbClose(); });
  { let x0 = null, y0 = 0; const lb = $('#lightbox');   // листание свайпом на телефоне
    lb.addEventListener('touchstart', e => { if (e.touches.length === 1) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } }, { passive: true });
    lb.addEventListener('touchend', e => { if (x0 == null) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && LB.list.length > 1) lbStep(dx < 0 ? 1 : -1); }, { passive: true }); }
  document.addEventListener('click', e => { const b = e.target.closest('[data-gal]'); if (b) lbOpen(galleries[b.dataset.gal] || [], +b.dataset.i); });

  /* ---------- уведомления ---------- */
  let toastT;
  function toast(msg, kind) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (kind === 'err' ? ' err' : ''); t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), kind === 'err' ? 6000 : 3200);
  }

  /* ================================================================
     КАРТА
     ================================================================ */
  /* Колёсико мыши над картой листает страницу, а масштаб — Ctrl + колёсико (на Mac — ⌘ или щипок тачпада).
     Иначе страница «застревает» на карте и вниз не прокрутить. */
  function wheelZoomWithCtrl() {
    const el = map.getContainer(); let acc = 0, at = null, raf = 0, hintT = 0;
    const hint = document.createElement('div'); hint.className = 'map-hint'; hint.hidden = true;
    hint.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? 'Масштаб карты: ⌘ + колёсико' : 'Масштаб карты: Ctrl + колёсико';
    el.appendChild(hint);
    el.addEventListener('wheel', e => {
      if (!(e.ctrlKey || e.metaKey)) {
        if (S.mode) return; // во время рисования не мешаем
        hint.hidden = false; clearTimeout(hintT); hintT = setTimeout(() => { hint.hidden = true; }, 1400); return;
      }
      e.preventDefault(); hint.hidden = true;
      acc += -e.deltaY * (e.deltaMode === 1 ? 33 : 1) / 220; at = map.mouseEventToContainerPoint(e);
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; const z = map.getZoom() + Math.max(-1, Math.min(1, acc)); acc = 0;
        map.setZoomAround(at, Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), z)), { animate: false }); });
    }, { passive: false });
  }
  async function initMap() {
    idx = await fetch(C.tilesIndex).then(r => { if (!r.ok) throw new Error('Нет файла ' + C.tilesIndex); return r.json(); });
    W = idx.width; H = idx.height; Z = idx.maxZoom;
    const NZ = idx.nativeZoom ?? Z;
    map = L.map('map', {
      crs: L.CRS.Simple, zoomControl: false, attributionControl: false,
      zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 100, maxZoom: Z + 1, minZoom: 0,
      maxBoundsViscosity: 1, tap: true, scrollWheelZoom: false
    });
    wheelZoomWithCtrl();
    const bounds = L.latLngBounds(toLL(0, 1), toLL(1, 0));
    const Masked = L.TileLayer.extend({
      createTile(c, done) {
        const lv = idx.levels[c.z];
        const ok = lv && c.x >= 0 && c.y >= 0 && c.x < lv.cols && c.y < lv.rows && lv.mask[c.y * lv.cols + c.x] === '1';
        if (!ok) { const d = document.createElement('div'); setTimeout(() => done(null, d), 0); return d; }
        return L.TileLayer.prototype.createTile.call(this, c, done);
      }
    });
    tileLayer = new Masked(C.tilesUrl, {
      tileSize: idx.tileSize, minNativeZoom: 0, maxNativeZoom: NZ, minZoom: 0, maxZoom: Z + 1,
      noWrap: true, bounds, keepBuffer: 3, className: 'base-tiles'
    }).addTo(map);
    map._polyBounds = bounds;
    // карта не уезжает за край снимка: границы панорамы = границы снимка
    map.setMaxBounds(bounds.pad(0.02));
    const fitMin = () => map.setMinZoom(Math.max(0, map.getBoundsZoom(bounds)));
    fitMin(); map.fitBounds(bounds);
    map.on('resize', fitMin);

    [['relief', 350], ['mapLabels', 370], ['areas', 380], ['border', 390], ['arrows', 395], ['placesPane', 590], ['draw', 650]].forEach(([n, z]) => { map.createPane(n).style.zIndex = z; });
    map.getPane('mapLabels').style.pointerEvents = 'none';
    reliefLayer = L.layerGroup(); areasLayer = L.layerGroup(); borderLayer = L.layerGroup(); arrowsLayer = L.layerGroup(); labelsLayer = L.layerGroup();
    map.on('zoomend', () => renderLabels());
    placesLayer = L.layerGroup().addTo(map); markersLayer = L.layerGroup().addTo(map); drawLayer = L.layerGroup().addTo(map);

    map.on('click', e => { if (S.mode) modeClick(fromLL(e.latlng)); });
    map.on('mousemove', e => {
      const { x, y } = fromLL(e.latlng); const { sq, snail, out } = squareOf(x, y), h = heightAt(x, y);
      $('#cursorInfo').textContent = (out ? 'вне сетки' : `${sq}-${snail}`) + (h != null ? ` · высота ${h} м` : '');
      if (S.mode && S.mode.pts && S.mode.pts.length) drawPreview([x, y]);
    });
    map.on('mouseout', () => { $('#cursorInfo').textContent = ''; });
    $('#btnZoomIn').onclick = () => map.zoomIn();
    $('#btnZoomOut').onclick = () => map.zoomOut();
    $('#btnFit').onclick = fitAll;
  }
  const toLL = (x, y) => map.unproject([x * W, y * H], Z);
  const fromLL = ll => { const p = map.project(ll, Z); return { x: clamp01(p.x / W), y: clamp01(p.y / H) }; };
  const polyLL = pts => pts.map(([x, y]) => toLL(x, y));
  const fitAll = () => map.fitBounds(map._polyBounds);

  async function loadRelief() {
    try { const r = await fetch(C.reliefUrl || 'data/relief.json', { cache: 'no-cache' }); if (!r.ok) return; relief = await r.json(); }
    catch (e) { relief = null; return; }
    const minor = { pane: 'relief', color: '#f4e7c3', weight: .8, opacity: .5, interactive: false, smoothFactor: 1.5 };
    const major = { pane: 'relief', color: '#f0c46a', weight: 1.6, opacity: .8, interactive: false, smoothFactor: 1.5 };
    const pts = l => { const a = []; for (let i = 0; i < l.length; i += 2) a.push(toLL(l[i], l[i + 1])); return a; };
    relief.contours.forEach(c => c.lines.forEach(l => {
      L.polyline(pts(l), c.major ? major : minor).addTo(reliefLayer);
      if (c.major && l.length >= 40) {
        const k = Math.floor(l.length / 4) * 2;
        L.marker(toLL(l[k], l[k + 1]), { pane: 'relief', interactive: false, keyboard: false, icon: L.divIcon({ className: 'hz-lbl', html: `<div>${c.z}</div>`, iconSize: [0, 0] }) }).addTo(reliefLayer);
      }
    }));
    (relief.peaks || []).forEach(p => L.marker(toLL(p.x, p.y), { pane: 'relief', interactive: false, keyboard: false, icon: L.divIcon({ className: 'peak-lbl', html: `<div>▲ ${p.z}</div>`, iconSize: [0, 0] }) }).addTo(reliefLayer));
  }

  let gridLines = null;
  function drawGridLines() {
    if (gridLines) gridLines.clearLayers(); else gridLines = L.layerGroup();
    const G = gridGeo(), edit = !!S.gridEdit;
    const st = { color: edit ? '#ffd166' : '#e9f0c8', weight: edit ? 1.5 : 1, opacity: edit ? .8 : .28, interactive: false };
    for (let i = 0; i <= G.cols; i++) L.polyline([pxLL(gCorner(G, i, 0)), pxLL(gCorner(G, i, G.rows))], st).addTo(gridLines);
    for (let j = 0; j <= G.rows; j++) L.polyline([pxLL(gCorner(G, 0, j)), pxLL(gCorner(G, G.cols, j))], st).addTo(gridLines);
    for (let i = 0; i < G.cols; i++) for (let j = 0; j < G.rows; j++) {
      L.marker(pxLL(gCorner(G, i, j)), { interactive: false, keyboard: false, icon: L.divIcon({ className: 'grid-lbl', html: `<div style="transform:rotate(${(gridCfg().angle || 0)}deg) translate(6px,4px);transform-origin:0 0">${COLS[i]}${j + 1}</div>`, iconSize: [0, 0] }) }).addTo(gridLines);
    }
    return gridLines;
  }
  function buildGrid() {
    if (gridLayer) gridLayer.remove();
    gridLayer = L.layerGroup();
    drawGridLines().addTo(gridLayer);
    if (S.gridEdit) addGridHandles();
    if (S.f.grid || S.gridEdit) gridLayer.addTo(map);
  }

  /* --- подгонка сетки мышью: три ручки — сдвиг, размер клеток, поворот --- */
  function addGridHandles() {
    const G = gridGeo();
    const h = (pos, cls, title, onDrag) => {
      const m = L.marker(pxLL(pos), { draggable: true, keyboard: false, zIndexOffset: 2000, title,
        icon: L.divIcon({ className: 'gh-wrap', html: `<div class="gh ${cls}" title="${title}"></div>`, iconSize: [26, 26], iconAnchor: [13, 13] }) });
      m.on('drag', () => { onDrag(llPx(m.getLatLng())); drawGridLines(); gridInfo(); });
      m.on('dragend', () => buildGrid());
      m.addTo(gridLayer);
    };
    const g = S.gridEdit, m = mpp();
    h(gCorner(G, 0, 0), 'gh--move', 'Сдвинуть сетку', ([px, py]) => { g.x = px / W; g.y = py / H; });
    h(gCorner(G, G.cols, G.rows), 'gh--size', 'Размер клеток', ([px, py]) => {
      const dx = px - G.ox, dy = py - G.oy;
      g.cw = Math.max(1, (dx * G.ux + dy * G.uy) / G.cols * m); g.ch = Math.max(1, (dx * G.vx + dy * G.vy) / G.rows * m);
      if (g.square) g.ch = g.cw;
    });
    h(gCorner(G, G.cols, 0), 'gh--rot', 'Повернуть сетку', ([px, py]) => { g.angle = +(Math.atan2(py - G.oy, px - G.ox) * 180 / Math.PI).toFixed(1); });
  }
  function gridInfo() {
    const g = S.gridEdit, G = gridGeo(), m = mpp();
    $('#pickText').textContent = `Сетка ${g.cols}×${g.rows}: клетка ${Math.round(G.cw * m)}×${Math.round(G.ch * m)} м, поворот ${(+g.angle || 0).toFixed(1)}°. Тяните: ✥ — сдвиг, ⤡ — размер, ⟳ — поворот`;
  }
  function startGridFit(g) {
    stopMode();
    const G = gridGeo(g), m = mpp();
    S.gridEdit = Object.assign({}, g, { cw: +(G.cw * m).toFixed(1), ch: +(G.ch * m).toFixed(1), angle: g.angle || 0 });
    S.mode = { kind: 'grid' };
    $('#pickUndo').hidden = true; $('#pickDone').hidden = false; $('#pickhint').hidden = false;
    gridInfo(); buildGrid();
  }
  async function finishGridFit() {
    const g = S.gridEdit; S.gridEdit = null; stopMode();
    D().settings.grid = g; S.f.grid = true; ls.set('pm-layers', S.f);
    await commit(`Сетка сохранена`); buildGrid();
  }

  function renderBorder() {
    borderLayer.clearLayers();
    const b = D().border; if (b.length < 3) return;
    const st = D().settings.border;
    // всё за границей полигона слегка затемняется
    const outer = [toLL(-0.5, -0.5), toLL(1.5, -0.5), toLL(1.5, 1.5), toLL(-0.5, 1.5)];
    L.polygon([outer, polyLL(b)], { pane: 'border', stroke: false, fillColor: '#050704', fillOpacity: .55, interactive: false }).addTo(borderLayer);
    L.polygon(polyLL(b), { pane: 'border', color: '#000', weight: st.width + 4, opacity: .45, fill: false, interactive: false }).addTo(borderLayer);
    L.polygon(polyLL(b), { pane: 'border', color: st.color, weight: st.width, opacity: .95, fill: false, interactive: false }).addTo(borderLayer);
  }

  /* ---------- маркеры ---------- */
  function markerHtml(p, color, opts = {}) {
    const cls = ['mk'];
    if (opts.sel) cls.push('is-sel');
    if (opts.changed) cls.push('mk--chg');
    const badge = opts.changed ? `<span class="mk__badge" style="--b:${opts.badgeColor}" title="Сменила владельца">▲</span>` : '';
    return `<div class="${cls.join(' ')}" style="--c:${color}"><span class="mk__icon">${iconOf(p)}</span>${badge}<span class="mk__label">${esc(p.name)}</span></div>`;
  }
  /** Стрелка: линия по вершинам и остриё на конце (строится в пикселях подложки). */
  function arrowShapes(a, extraPts) {
    const pts = (extraPts || a.pts).map(([x, y]) => [x * W, y * H]);
    const n = pts.length; if (n < 2) return null;
    const [x1, y1] = pts[n - 2], [x2, y2] = pts[n - 1];
    const ang = Math.atan2(y2 - y1, x2 - x1), len = Math.max(14, a.width * 3.5) * Math.pow(2, Z - map.getMinZoom()); // остриё масштабируется вместе с картой
    const head = [[x2, y2], [x2 - len * Math.cos(ang - 0.45), y2 - len * Math.sin(ang - 0.45)], [x2 - len * Math.cos(ang + 0.45), y2 - len * Math.sin(ang + 0.45)]];
    const back = [x2 - len * 0.8 * Math.cos(ang), y2 - len * 0.8 * Math.sin(ang)];
    return { line: pts.slice(0, -1).concat([back]).map(pxLL), head: head.map(pxLL) };
  }
  function renderArrows() {
    arrowsLayer.clearLayers();
    const g = curGame(); if (!g || isMedia(g)) return;
    const admin = store.canWrite();
    g.arrows.forEach(a => {
      const sh = arrowShapes(a); if (!sh) return;
      const c = paintColor(a.color), o = { pane: 'arrows', color: c, opacity: a.opacity, interactive: admin && !S.mode };
      const grp = L.featureGroup([
        L.polyline(sh.line, Object.assign({}, o, { color: '#000', weight: a.width + 3, opacity: a.opacity * .45, lineCap: 'round', interactive: false })),
        L.polyline(sh.line, Object.assign({}, o, { weight: a.width, lineCap: 'round', lineJoin: 'round' })),
        L.polygon(sh.head, Object.assign({}, o, { weight: 1, fillColor: c, fillOpacity: a.opacity }))
      ]);
      if (admin) grp.on('click', () => { if (!S.mode) openArrowForm(a); });
      grp.addTo(arrowsLayer);
    });
  }
  /** Подписи полигона: по умолчанию одного размера на экране при любом зуме; по галочке — растут вместе с картой. */
  function renderLabels() {
    if (!labelsLayer) return;
    labelsLayer.clearLayers();
    const admin = store.canWrite(), zk = Math.pow(2, map.getZoom() - map.getMinZoom());
    D().labels.forEach(l => {
      const k = l.scale ? zk : 1;
      const m = L.marker(toLL(l.x, l.y), {
        pane: admin ? 'markerPane' : 'mapLabels', draggable: admin && !S.mode, keyboard: false, interactive: admin, zIndexOffset: -500,
        icon: L.divIcon({ className: 'map-lbl', html: `<div style="color:${esc(paintColor(l.color))};opacity:${l.opacity};font-size:${Math.round(l.size * k)}px">${esc(l.text)}</div>`, iconSize: [0, 0] })
      });
      if (admin) {
        m.on('click', () => { if (!S.mode) openLabelForm(l); });
        m.on('dragend', async () => { const { x, y } = fromLL(m.getLatLng()); const q = D().labels.find(z => z.id === l.id); Object.assign(q, { x, y }); await commit('Подпись перемещена'); });
      }
      m.addTo(labelsLayer);
    });
  }
  /** Клик по точке в режиме «⇄ Владелец»: следующая сторона по кругу, затем «ничья». */
  async function cycleOwner(id) {
    const g = curGame(); const p = g && g.points.find(x => x.id === id); if (!p) return;
    const order = D().sides.map(s => s.id).concat(['']);
    const key = S.phase === 'before' ? 'before' : 'after';
    p[key] = order[(order.indexOf(p[key]) + 1) % order.length];
    if (isFuture(g) && key === 'before') p.after = p.before; // для будущей игры «после» = «до»
    await commit(`${p.name}: ${sideName(p[key])} (${key === 'before' ? 'до игры' : 'после игры'})`);
  }
  function renderMap() {
    markersLayer.clearLayers(); placesLayer.clearLayers(); areasLayer.clearLayers(); markerById.clear();
    renderArrows(); renderLabels();
    const admin = store.canWrite();
    if (S.f.places) places().forEach(p => {
      const m = L.marker(toLL(p.x, p.y), {
        pane: 'placesPane', draggable: admin && !S.mode, title: p.name,
        icon: L.divIcon({ className: 'mk-wrap', html: `<div class="mk mk--place${p.id === S.placeId ? ' is-sel' : ''}"><span class="mk__icon">${iconOf(p, 'building')}</span><span class="mk__label">${esc(p.name)}</span></div>`, iconSize: [26, 26], iconAnchor: [13, 13] })
      });
      m.on('click', () => { if (!S.mode) selectPlace(p.id); });
      m.on('dragend', async () => { const { x, y } = fromLL(m.getLatLng()); const q = places().find(z => z.id === p.id); Object.assign(q, { x, y }); await commit('Объект перемещён'); });
      m.addTo(placesLayer); markerById.set('place:' + p.id, m);
    });
    const g = curGame();
    $('#phase').hidden = !g || !g.points.length || isMedia(g);
    syncPhaseButtons();
    if (!g || isMedia(g)) return;
    g.points.forEach(p => {
      const own = owner(p);
      if (S.f['s:' + (own || 'none')] === false) return;
      const color = sideColor(own);
      if (S.f.areas && p.area.length >= 3) {
        L.polygon(polyLL(p.area), { pane: 'areas', color, weight: p.id === S.pointId ? 3 : 1.6, opacity: .9, fillColor: color, fillOpacity: .22, interactive: !S.mode })
          .on('click', () => { if (!S.mode) selectPoint(p.id); }).addTo(areasLayer);
      }
      const ch = changed(p);
      const m = L.marker(toLL(p.x, p.y), {
        icon: L.divIcon({ className: 'mk-wrap', html: markerHtml(p, color, { sel: p.id === S.pointId, changed: ch, badgeColor: sideColor(p.after) }), iconSize: [34, 34], iconAnchor: [17, 17] }),
        draggable: admin && !S.mode, title: p.name, riseOnHover: true, zIndexOffset: p.id === S.pointId ? 1000 : ch ? 500 : 0
      });
      m.on('click', () => { if (S.mode && S.mode.kind === 'owner') cycleOwner(p.id); else if (!S.mode) selectPoint(p.id); });
      m.on('dragend', async () => {
        const { x, y } = fromLL(m.getLatLng()); const q = curGame().points.find(z => z.id === p.id);
        Object.assign(q, { x, y }); await commit('Точка перемещена');
      });
      m.addTo(markersLayer); markerById.set(p.id, m);
    });
  }
  function applyLayers() {
    const tog = (layer, on) => on ? layer.addTo(map) : layer.remove();
    tog(gridLayer, S.f.grid || !!S.gridEdit); tog(reliefLayer, relief && S.f.relief); tog(borderLayer, S.f.border); tog(areasLayer, S.f.areas);
    tog(arrowsLayer, S.f.arrows); tog(labelsLayer, S.f.mapLabels);
    $('#map').classList.toggle('hide-labels', !S.f.labels);
  }

  /* ---------- игра без карты: гифка или картинка поверх карты ---------- */
  function renderMediaView() {
    const g = curGame(), on = isMedia(g), box = $('#mediaView');
    app.classList.toggle('media-mode', on);
    box.hidden = !on;
    if (!on) { if (box.dataset.key) { box.innerHTML = ''; box.dataset.key = ''; } return; }
    const m = g.media || {}, admin = store.canWrite();
    const key = [g.id, m.url.length, m.url.slice(-80), m.caption, m.link, m.linkLabel, g.title, admin].join('|');
    if (box.dataset.key === key) return;   // не перерисовываем — иначе гифка начнётся заново
    box.dataset.key = key;
    box.innerHTML = `<figure class="mv">
      <figcaption class="mv__cap"><span class="mv__k">Игра без карты</span><b>${esc(g.title)}</b>${m.caption ? `<span>${esc(m.caption)}</span>` : ''}
        ${m.link ? `<a class="btn primary" href="${esc(m.link)}" target="_blank" rel="noopener">${esc(m.linkLabel || 'Открыть проект')} ↗</a>` : ''}</figcaption>
      <div class="mv__stage">${m.url
        ? `<button class="mv__img" data-mvzoom title="Открыть крупно"><img src="${esc(mediaSrc(m.url))}" alt="${esc(m.caption || g.title)}" referrerpolicy="no-referrer"></button>
           <div class="mv__err" hidden>Не удалось загрузить картинку. Проверьте ссылку${driveId(m.url) ? ' и доступ к файлу в Google Drive («Все, у кого есть ссылка»)' : ''}.</div>`
        : `<div class="mv__err">Гифка или картинка ещё не добавлена${admin ? ' — нажмите «Изменить игру»' : ''}.</div>`}</div>
      </figure>`;
    const img = box.querySelector('img');
    if (img) img.onerror = () => { img.closest('.mv__img').hidden = true; box.querySelector('.mv__err').hidden = false; };
    const z = box.querySelector('[data-mvzoom]');
    if (z) z.onclick = () => lbOpen([{ url: m.url, caption: m.caption || g.title, full: true }], 0);
  }

  /* ---------- до / после ---------- */
  function syncPhaseButtons() {
    document.querySelectorAll('[data-phase]').forEach(b => { b.classList.toggle('active', b.dataset.phase === S.phase); b.setAttribute('aria-pressed', b.dataset.phase === S.phase); });
  }
  function setPhase(ph) { S.phase = ph; renderFilters(); renderMap(); renderPanel(); }
  document.addEventListener('click', e => { const b = e.target.closest('[data-phase]'); if (b) setPhase(b.dataset.phase); });

  /* ================================================================
     ВИЗИТКА: ближайшая игра, сценарии, легенда
     ================================================================ */
  function sidesLine(g) {
    const ids = Object.keys(g.sides || {}).filter(id => sideById(id));
    if (!ids.length) return '';
    return '<div class="vs-line">' + ids.map(id => {
      const s = g.sides[id], l = sideEntries(s), tot = sideTotal(s);
      return `<span class="vs-side" style="--c:${sideColor(id)}">${l.length ? teamsBadges(s, id, 3, '') : '<i class="tb-dot" style="--c:' + sideColor(id) + '"></i>'}<b>${esc(sideName(id))}</b>${l.length ? `<small>${teamsList(s)}</small>` : ''}${tot != null ? `<small>${tot} чел.</small>` : ''}</span>`;
    }).join('<span class="vs">vs</span>') + '</div>';
  }
  /** Порядок сценариев в карусели: сначала с будущими играми (ближайшая — первой), потом по дате последней игры, от свежих к старым. */
  function scOrder() {
    const key = sc => { const l = scGames(sc.id), next = l.filter(isFuture)[0], last = l.filter(g => !isFuture(g)).pop();
      return next ? [0, next.date] : last ? [1, last.date] : [2, ''] };
    return [...D().scenarios].sort((a, b) => { const x = key(a), y = key(b);
      if (x[0] !== y[0]) return x[0] - y[0];
      return x[0] === 0 ? x[1].localeCompare(y[1]) : y[1].localeCompare(x[1]); });
  }
  function bannerGame() {
    if (!S.scId) return null;
    return curGame() || defaultGame(S.scId);
  }
  function renderHero() {
    const d = D(), f = featuredGame();
    $('#heroTitle').textContent = siteTitle(); renderBrand();
    const g = bannerGame(), sc = curScenario();
    if (g) {
      const [y, m, dd] = g.date.split('-').map(Number), wd = WD[new Date(y, m - 1, dd).getDay()], fut = isFuture(g);
      const kick = f && f.id === g.id ? 'Ближайшая игра' : fut ? 'Запланированная игра' : 'Прошедшая игра';
      $('#nextGame').innerHTML = `<article class="next">
        <div class="next__date"><b>${dd}</b><span>${MONTHS[m - 1]}</span><small>${y !== new Date().getFullYear() ? y : wd}</small></div>
        <div class="next__body">
          <div class="next__k">${kick} · ${esc(sc.title)}</div>
          <h2>${esc(g.title)}</h2>
          ${g.summary ? `<p>${esc(g.summary)}</p>` : ''}
          ${g.gather && fut ? `<p class="next__gather">${esc(g.gather)}</p>` : ''}
          ${sidesLine(g)}
        </div>
        <div class="next__acts">${fut ? `<button class="btn primary" data-signup="${esc(g.id)}">Записаться</button>` : ''}<button class="btn ${fut ? 'ghost' : 'primary'}" data-open-game="${esc(g.id)}">Карта и правила ↓</button></div>
      </article>`;
    } else if (sc) {
      $('#nextGame').innerHTML = `<article class="next next--plain"><div class="next__body"><div class="next__k">Сценарий</div><h2>${esc(sc.title)}</h2>${sc.summary ? `<p>${esc(sc.summary)}</p>` : ''}<p class="next__gather">Игры по этому сценарию пока не запланированы.</p></div>
        <div class="next__acts"><button class="btn primary" data-sc="${esc(sc.id)}">Карта и правила ↓</button></div></article>`;
    } else {
      $('#nextGame').innerHTML = `<article class="next next--plain"><div class="next__body"><div class="next__k">Полигон · местность</div><h2>${esc(siteTitle())}</h2>
        <p>Карта полигона без привязки к игре: граница, постоянные объекты${relief ? `, рельеф — высоты от ${relief.min} до ${relief.max} м` : ''}.</p>
        ${f ? `<p class="next__gather">Ближайшая игра: <b>${esc(fmtDate(f.date))}</b> — ${esc(f.title)} (${esc(scById(f.scenarioId)?.title || '')})</p>` : ''}</div>
        <div class="next__acts">${f ? `<button class="btn primary" data-open-game="${esc(f.id)}">К ближайшей игре</button>` : ''}<button class="btn ${f ? 'ghost' : 'primary'}" data-sc="">Карта полигона ↓</button></div></article>`;
    }
    const card = (id, title, sub, meta, extra = '') => `<button class="sc ${S.scId === id ? 'active' : ''} ${extra}" data-sc="${esc(id)}" aria-pressed="${S.scId === id}">${extra.includes('hot') ? '<span class="sc__rib">Ближайшая игра</span>' : ''}<h3>${esc(title)}</h3><p>${esc(sub)}</p><div class="sc__meta">${meta}</div></button>`;
    const pin = card('', 'Полигон', 'Местность, рельеф и объекты без привязки к игре', `${d.places.length} объектов${relief ? ` · высоты ${relief.min}–${relief.max} м` : ''}`, 'sc--terrain');
    const track = scOrder().map(s => {
      const l = scGames(s.id), next = l.filter(isFuture)[0], last = l.filter(x => !isFuture(x)).pop();
      const meta = (next ? `<span class="hot">Ближайшая: ${fmtDate(next.date)}</span>` : last ? `Последняя: ${fmtDate(last.date)}` : 'Игр пока нет') + ` · игр: ${l.length}`;
      return card(s.id, s.title, s.summary || 'Описание сценария пока не заполнено', meta, f && f.scenarioId === s.id ? 'hot' : '');
    }).join('');
    const keepScroll = $('#scTrack') ? $('#scTrack').scrollLeft : 0;
    $('#scList').innerHTML = `<div class="sc-pin">${pin}</div>
      <div class="sc-car"><button class="sc-nav sc-nav--l" id="scPrev" aria-label="Прокрутить сценарии влево">‹</button>
        <div class="sc-track" id="scTrack">${track || '<p class="hint">Сценариев пока нет.</p>'}</div>
        <button class="sc-nav sc-nav--r" id="scNext" aria-label="Прокрутить сценарии вправо">›</button></div>`;
    const tr = $('#scTrack'); tr.scrollLeft = keepScroll;
    const step = dir => tr.scrollBy({ left: dir * Math.max(240, tr.clientWidth * .8), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    $('#scPrev').onclick = () => step(-1); $('#scNext').onclick = () => step(1);
    const navState = () => { $('#scPrev').disabled = tr.scrollLeft < 4; $('#scNext').disabled = tr.scrollLeft + tr.clientWidth > tr.scrollWidth - 4; joinTab(); };
    tr.onscroll = navState;
    const act = tr.querySelector('.sc.active');
    if (act && !keepScroll) act.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    requestAnimationFrame(navState);
    renderSoc(); renderInfo(); renderScene(); renderFooter();
  }
  /** Соединяет анонс с выбранной плиткой одной рамкой: перемычка от низа анонса до верха плитки. */
  function joinTab() {
    const box = $('.hero__in'), ban = $('#nextGame .next'), act = $('#scList .sc.active'); let j = $('#heroJoin');
    if (!j) { j = document.createElement('div'); j.id = 'heroJoin'; j.className = 'hero-join'; j.setAttribute('aria-hidden', 'true'); box.appendChild(j); }
    if (!ban || !act) { j.hidden = true; return; }
    const B = box.getBoundingClientRect(), nb = ban.getBoundingClientRect(), a = act.getBoundingClientRect();
    const car = act.closest('.sc-track'), cr = car ? car.getBoundingClientRect() : null;
    if (cr && (a.right < cr.left + 20 || a.left > cr.right - 20)) { j.hidden = true; ban.classList.remove('is-joined'); return; }
    const left = Math.max(a.left, cr ? cr.left : a.left), right = Math.min(a.right, cr ? cr.right : a.right);
    j.hidden = false; ban.classList.add('is-joined');
    Object.assign(j.style, { left: (left - B.left) + 'px', width: (right - left) + 'px', top: (nb.bottom - B.top - 2) + 'px', height: (a.top - nb.bottom + 4) + 'px' });
  }
  window.addEventListener('resize', () => joinTab());
  function renderSoc() {
    $('#socLinks').innerHTML = D().links.map(l => {
      const k = SOC[l.kind] || SOC.site, url = /^(https?:|tel:|mailto:)/i.test(l.url) ? l.url : (l.kind === 'phone' ? 'tel:' + l.url.replace(/[^\d+]/g, '') : 'https://' + l.url);
      return `<a class="soc__a" href="${esc(url)}" target="_blank" rel="noopener" title="${esc(l.label || k.name)}" aria-label="${esc(l.label || k.name)}">${k.svg}${l.label ? `<span>${esc(l.label)}</span>` : ''}</a>`;
    }).join('');
  }
  /* ================================================================
     СЦЕНА: таймер до ближайшей игры, две галереи, параллакс, закреплённая плашка
     ================================================================ */
  const HC = Object.assign({ startTime: '10:00', timezone: '+03:00', pinBar: true, parallax: { scroll: true, mouse: true, strength: 1 }, autoplaySec: 6, galleries: [] }, C.hero || {});
  const pad2 = n => String(n).padStart(2, '0');
  const defStart = () => (D().settings.hero && D().settings.hero.startTime) || HC.startTime;
  const heroGals = () => { const h = D().settings.hero; return h && h.galleries.length ? h.galleries : HC.galleries; };
  const gameStart = g => { const t = /^\d{1,2}:\d{2}$/.test(g.time || '') ? g.time : defStart(); return new Date(`${g.date}T${t.padStart(5, '0')}:00${HC.timezone}`).getTime(); };
  let cdGame = null;
  function renderScene() {
    const g = featuredGame(); cdGame = g;
    const sc = g ? scById(g.scenarioId) : null;
    const cell = (id, u) => `<div class="cd__cell"><div class="cd__num" id="${id}">00</div><div class="cd__unit">${u}</div></div>`;
    $('#countdown').innerHTML = g
      ? `<div class="cd__title">До ближайшей игры осталось:</div>
         <div class="cd__grid">${cell('cdD', 'дней')}<i>:</i>${cell('cdH', 'часов')}<i>:</i>${cell('cdM', 'минут')}<i>:</i>${cell('cdS', 'секунд')}</div>
         <div class="cd__next"><b>Ближайшая игра:</b> ${esc(fmtDate(g.date))} — ${esc(g.title)}</div>
         <div class="cd__sub">${esc(g.summary ? `(${g.summary})` : sc ? `Сценарий «${sc.title}»` : '')}</div>
         <div class="cd__acts"><button class="btn primary" data-signup="${esc(g.id)}">Записаться</button><button class="btn ghost" data-open-game="${esc(g.id)}">Карта и правила ↓</button></div>`
      : `<div class="cd__title">Ближайшая игра пока не назначена</div>
         <p class="cd__sub">Следите за новостями в наших соцсетях — анонс появится здесь.</p>
         <div class="cd__acts"><button class="btn primary" data-sc="">Карта полигона ↓</button></div>`;
    const pb = $('#pinbar');
    pb.hidden = !(g && HC.pinBar);
    if (g) pb.innerHTML = `<div class="pinbar__in"><span class="pinbar__k">Ближайшая игра</span>
      <button class="pinbar__t" data-open-game="${esc(g.id)}">${esc(g.title)}<small>${esc(fmtDate(g.date))}${sc && norm(sc.title) !== norm(g.title) ? ' · ' + esc(sc.title) : ''}</small></button>
      <span class="pinbar__time" id="pinTime"></span><button class="btn primary pinbar__btn" data-signup="${esc(g.id)}">Записаться</button></div>`;
    document.body.classList.toggle('has-pinbar', !pb.hidden);
    const gl2 = heroGals(); [0, 1].forEach(k => renderHGal($('#hgal' + (k + 1)), gl2[k] || { title: '', photos: [] }, k));
    cdTick();
  }
  function cdTick() {
    const g = cdGame; if (!g || !$('#cdD')) return;
    let s = Math.max(0, Math.floor((gameStart(g) - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
    $('#cdD').textContent = pad2(d); $('#cdH').textContent = pad2(h); $('#cdM').textContent = pad2(m); $('#cdS').textContent = pad2(s);
    const pt = $('#pinTime'); if (pt) pt.textContent = gameStart(g) <= Date.now() ? 'Игра идёт!' : innerWidth < 420 ? `${d}д ${pad2(h)}:${pad2(m)}` : `${d} д ${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }
  setInterval(cdTick, 1000);
  const hgalTimers = [];
  function renderHGal(el, gl, k) {
    if (!el) return;
    const ph = (gl.photos || []).filter(p => p && p.url);
    clearInterval(hgalTimers[k]);
    const admin = store.canWrite();
    el.innerHTML = `<div class="hgal__head"><span>${esc(gl.title || '')}</span>${admin ? `<button class="hgal__edit" data-hgedit="${k}" title="Изменить галерею">✎</button>` : ''}</div><div class="hgal__frame">
      ${!ph.length ? `<div class="hgal__empty">${admin ? 'Фото пока нет — нажмите ✎' : ''}</div>` : ''}
      ${ph.map((p, i) => `<button class="hgal__img ${i ? '' : 'on'} ${(p.fit || gl.fit) === 'contain' ? 'contain' : ''}" data-hgal="${k}" data-i="${i}" aria-label="${esc(p.caption || 'Открыть фото')}"><img src="${esc(photoSrc(p.url, 900))}" alt="${esc(p.caption || '')}" loading="lazy" referrerpolicy="no-referrer"></button>`).join('')}
      ${gl.tag ? `<span class="hgal__tag">${esc(gl.tag)}</span>` : ''}
      ${ph.length > 1 ? `<button class="hgal__nav prev" data-hgnav="-1" aria-label="Предыдущее фото">‹</button><button class="hgal__nav next" data-hgnav="1" aria-label="Следующее фото">›</button>` : ''}</div>`;
    el.hidden = !ph.length && !gl.title && !admin;
    let i = 0; const items = el.querySelectorAll('.hgal__img');
    const show = n => { if (!items.length) return; items[i].classList.remove('on'); i = (n + items.length) % items.length; items[i].classList.add('on'); };
    el.onclick = e => {
      if (e.target.closest('[data-hgedit]')) { openHeroForm(k); return; }
      const nb = e.target.closest('[data-hgnav]'); if (nb) { show(i + +nb.dataset.hgnav); return; }
      const b = e.target.closest('[data-hgal]'); if (b) lbOpen(ph.map(p => ({ url: p.url, caption: p.caption || '' })), +b.dataset.i);
    };
    if (items.length > 1 && HC.autoplaySec > 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches)
      hgalTimers[k] = setInterval(() => { if (!document.hidden && !el.matches(':hover')) show(i + 1); }, HC.autoplaySec * 1000);
  }
  (function parallax() {
    const P = Object.assign({ scroll: true, mouse: true, strength: 1 }, HC.parallax), scene = $('#scene');
    if (!scene || !P.strength || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layers = [...scene.querySelectorAll('[data-depth]')], narrow = matchMedia('(max-width: 900px)');
    let sy = 0, mx = 0, my = 0, raf = 0;
    const render = () => { raf = 0; layers.forEach(l => {
      const d = +l.dataset.depth * P.strength;
      if (narrow.matches && d > 0.3) { l.style.transform = ''; return; }   // на телефоне передний план не двигаем — иначе его обрежет
      l.style.transform = `translate3d(${(-mx * d * 24).toFixed(1)}px,${(sy * (1 - d) * 0.5 - my * d * 12).toFixed(1)}px,0)`;
    }); };
    const req = () => { if (!raf) raf = requestAnimationFrame(render); };
    if (P.scroll) addEventListener('scroll', () => { const r = scene.getBoundingClientRect(); if (r.bottom < 0) return; sy = Math.max(0, -r.top); req(); }, { passive: true });
    if (P.mouse && matchMedia('(pointer: fine)').matches)
      scene.addEventListener('mousemove', e => { const r = scene.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; req(); });
  })();
  function renderInfo() {
    const list = D().info, admin = store.canWrite();
    if (!list.length && !admin) { $('#infoBlock').innerHTML = ''; $('#infoBlock').hidden = true; return; }
    $('#infoBlock').hidden = false;
    for (const k in galleries) if (k.startsWith('info')) delete galleries[k];
    $('#infoBlock').innerHTML = `<div class="info__in"><div class="info__head"><h2 id="infoTitle">Для игроков</h2>${admin ? '<button class="btn" id="infoEdit">Изменить разделы</button>' : ''}</div>` +
      (list.length ? list.map((s, i) => `<details class="acc"><summary><span>${esc(s.title)}</span><i aria-hidden="true">+</i></summary><div class="acc__b">${richText(s.body)}${gallery('info' + i, s.photos)}</div></details>`).join('')
        : '<p class="hint">Разделов пока нет. Нажмите «Изменить разделы», чтобы добавить правила, снаряжение, прокат.</p>') + '</div>';
    const b = $('#infoEdit'); if (b) b.onclick = openInfoForm;
  }
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-sc]');
    if (c) { selectScenario(c.dataset.sc); scrollToMap(); return; }
    const su = e.target.closest('[data-signup]');
    if (su) { openSignup(D().games.find(x => x.id === su.dataset.signup)); return; }
    const o = e.target.closest('[data-open-game]');
    if (o) { const g = D().games.find(x => x.id === o.dataset.openGame); if (g) { selectScenario(g.scenarioId, g.id); scrollToMap(); } }
  });
  const scrollToMap = () => $('#legend').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

  function renderLegend() {
    const d = D(), bs = d.settings.border;
    const chip = (ic, label) => `<span class="lg">${ic}<span>${esc(label)}</span></span>`;
    let h = '<div class="legend__in"><span class="legend__t">Обозначения</span>';
    h += d.sides.map(s => chip(`<i class="lg-dot" style="--c:${s.color}"></i>`, s.name)).join('');
    h += chip(`<i class="lg-dot" style="--c:${NOBODY}"></i>`, 'Ничья');
    h += '<span class="lg-sep"></span>';
    h += Object.entries(TYPES).map(([k, v]) => chip(`<i class="lg-ic">${ICON[k]}</i>`, v)).join('');
    h += '<span class="lg-sep"></span>';
    h += chip(`<i class="lg-ic lg-place">${ICON.building}</i>`, 'Объект полигона');
    h += chip('<i class="lg-area"></i>', 'Зона точки');
    h += chip('<i class="lg-badge">▲</i>', 'Сменила владельца');
    h += chip('<i class="lg-arrow">➚</i>', 'Направление');
    h += chip(`<i class="lg-line" style="--c:${bs.color}"></i>`, 'Граница полигона');
    if (relief) h += chip('<i class="lg-line lg-hz"></i>', `Горизонтали через ${relief.interval} м`);
    h += '</div>';
    $('#legend').innerHTML = h;
  }

  /* ================================================================
     СЛОИ (фильтры)
     ================================================================ */
  function renderFilters() {
    const g = curGame();
    const row = (key, label, ic, extra = '') => `<label class="frow">${ic}<span class="lbl">${esc(label)}</span>${extra}
        <span class="sw"><input type="checkbox" data-f="${key}" ${S.f[key] !== false ? 'checked' : ''}><b></b></span></label>`;
    const svg = s => `<span class="ic" style="color:var(--muted)">${s}</span>`;
    let h = '';
    if (g && !isMedia(g)) {
      const cnt = id => g.points.filter(p => (owner(p) || 'none') === id).length;
      h += D().sides.map(s => row('s:' + s.id, s.name, `<span class="ic"><i style="border-color:${s.color}"></i></span>`, `<span class="cnt">${cnt(s.id)}</span>`)).join('');
      if (cnt('none')) h += row('s:none', 'Ничья', `<span class="ic"><i style="border-color:${NOBODY}"></i></span>`, `<span class="cnt">${cnt('none')}</span>`);
      if (g.arrows.length) h += row('arrows', 'Стрелки', svg('<svg viewBox="0 0 24 24" width="16"><path d="M4 18L18 6M18 6h-7M18 6v7" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>'), `<span class="cnt">${g.arrows.length}</span>`);
      h += row('areas', 'Зоны точек', svg('<svg viewBox="0 0 24 24" width="16"><path d="M4 7l7-3 9 5-3 10-11 1z" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-width="1.6"/></svg>'));
      h += '<div class="fsep"></div>';
    }
    h += row('places', 'Объекты полигона', svg(ICON.building.replace('<svg', '<svg width="16"')), `<span class="cnt">${places().length}</span>`);
    if (D().labels.length) h += row('mapLabels', 'Подписи полигона', svg('<svg viewBox="0 0 24 24" width="16"><path d="M4 19L10 5h1l6 14M7 14h8" fill="none" stroke="currentColor" stroke-width="2"/></svg>'), `<span class="cnt">${D().labels.length}</span>`);
    h += row('border', 'Граница полигона', svg('<svg viewBox="0 0 24 24" width="16"><path d="M4 6l8-3 8 4-1 11-9 3-7-6z" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>'));
    if (relief) h += row('relief', 'Рельеф (высоты)', svg('<svg viewBox="0 0 24 24" width="16"><path d="M2 19c3-1 4-6 7-6s3 3 6 3 4-6 7-7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2 14c3-1 4-5 7-5s3 2 6 2 4-4 7-5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6"/></svg>'));
    h += row('grid', 'Сетка квадратов', svg('<svg viewBox="0 0 24 24" width="16"><path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="currentColor" stroke-width="1.6"/></svg>'));
    h += row('labels', 'Названия', svg('<svg viewBox="0 0 24 24" width="16"><path d="M4 7h16M4 12h10M4 17h13" stroke="currentColor" stroke-width="1.8"/></svg>'));
    $('#filtersBody').innerHTML = h;
  }
  $('#filtersBody').addEventListener('change', e => {
    const k = e.target.dataset.f; if (!k) return;
    S.f[k] = e.target.checked; ls.set('pm-layers', S.f); applyLayers(); renderMap();
  });
  function setFiltersOpen(open) {
    $('#filters').classList.toggle('collapsed', !open);
    $('#btnFilters').setAttribute('aria-expanded', open); $('#filtersHead').setAttribute('aria-expanded', open);
    ls.set('pm-filters-open', open);
  }
  $('#filtersHead').onclick = () => setFiltersOpen($('#filters').classList.contains('collapsed'));
  $('#btnFilters').onclick = () => setFiltersOpen($('#filters').classList.contains('collapsed'));
  function setNight(on) { S.night = on; app.classList.toggle('night', on); $('#btnNight').setAttribute('aria-pressed', on); ls.set('pm-night', on); }
  $('#btnNight').onclick = () => setNight(!S.night);

  /* ================================================================
     ПОДВАЛ САЙТА: о полигоне, колонки полезных ссылок, соцсети
     ================================================================ */
  /** Якоря для ссылок подвала: #карта, #сценарии, #игрокам, #игра, #наверх, #раздел:Название раздела «Для игроков». */
  const ANCHORS = { 'наверх': 'top', top: 'top', 'сценарии': 'scenarios', scenarios: 'scenarios', 'карта': 'legend', map: 'legend',
    'игрокам': 'infoBlock', info: 'infoBlock', 'игра': 'scene', game: 'scene', 'турнир': 'tour', tour: 'tour' };
  function goAnchor(raw) {
    const a = decodeURIComponent(String(raw || '').replace(/^#/, '')).trim(), smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const sec = a.match(/^раздел:\s*(.+)$/i);
    if (sec) { // раскрыть раздел «Для игроков» с таким заголовком
      const d = [...document.querySelectorAll('#infoBlock details')].find(x => norm((x.querySelector('summary span') || x.querySelector('summary')).textContent) === norm(sec[1]));
      if (d) { d.open = true; d.scrollIntoView({ behavior: smooth, block: 'start' }); return; }
      return $('#infoBlock').scrollIntoView({ behavior: smooth });
    }
    const id = ANCHORS[a.toLowerCase()] || a;
    if (id === 'top') return scrollTo({ top: 0, behavior: smooth });
    if (id === 'tour') { if (S.scId && scTours(S.scId).length) { S.tab = 'tour'; renderPanel(); syncHash(); } return scrollToMap(); }
    const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: smooth, block: 'start' });
  }
  document.addEventListener('click', e => { const a = e.target.closest('[data-anchor]'); if (a) { e.preventDefault(); goAnchor(a.dataset.anchor); } });
  const footHref = u => /^(https?:|tel:|mailto:)/i.test(u) ? u : 'https://' + u;
  const footLink = l => l.url.startsWith('#')
    ? `<a href="#" data-anchor="${esc(l.url)}">${esc(l.label || l.url)}</a>`
    : `<a href="${esc(footHref(l.url))}" ${/^(tel|mailto):/i.test(l.url) ? '' : 'target="_blank" rel="noopener"'}>${esc(l.label || l.url.replace(/^https?:\/\//, ''))}${/^(tel|mailto):/i.test(l.url) ? '' : ' <i aria-hidden="true">↗</i>'}</a>`;
  /** Колонки по умолчанию — пока в админке подвал не заполнен. */
  function defaultFootGroups() {
    const d = D(), out = [];
    out.push({ title: 'Сайт', links: [{ label: 'Ближайшая игра', url: '#игра' }, { label: 'Сценарии', url: '#сценарии' }, { label: 'Карта полигона', url: '#карта' }]
      .concat(d.info.length ? [{ label: 'Для игроков', url: '#игрокам' }] : []) });
    if (d.info.length) out.push({ title: 'Для игроков', links: d.info.slice(0, 8).map(s => ({ label: s.title, url: '#раздел:' + s.title })) });
    const net = d.links.map(l => ({ label: l.label || (SOC[l.kind] || SOC.site).name, url: l.kind === 'phone' && !/^tel:/i.test(l.url) ? 'tel:' + l.url.replace(/[^\d+]/g, '') : l.url }));
    if (net.length) out.push({ title: 'Мы в сети', links: net });
    return out;
  }
  function renderFooter() {
    const el = $('#siteFooter'); if (!el) return;
    const d = D(), F = d.settings.footer || { about: '', copy: '', groups: [] }, admin = store.canWrite();
    const groups = F.groups.length ? F.groups : defaultFootGroups(), f = featuredGame();
    const soc = d.links.map(l => { const k = SOC[l.kind] || SOC.site, url = /^(https?:|tel:|mailto:)/i.test(l.url) ? l.url : (l.kind === 'phone' ? 'tel:' + l.url.replace(/[^\d+]/g, '') : 'https://' + l.url);
      return `<a class="soc__a" href="${esc(url)}" target="_blank" rel="noopener" title="${esc(l.label || k.name)}" aria-label="${esc(l.label || k.name)}">${k.svg}</a>`; }).join('');
    el.innerHTML = `<div class="sfoot__in">
        <div class="sfoot__brand">
          <div class="sfoot__logo"><span class="brand__logo ${siteLogo() ? 'has-img' : ''}">${$('#brandLogo').innerHTML}</span><b>${esc(siteTitle())}</b></div>
          ${F.about ? `<p>${linkify(F.about)}</p>` : ''}
          ${f ? `<p class="sfoot__next">Ближайшая игра: <button class="link" data-open-game="${esc(f.id)}">${esc(fmtDate(f.date))} — ${esc(f.title)}</button></p>` : ''}
          ${soc ? `<nav class="soc sfoot__soc" aria-label="Соцсети">${soc}</nav>` : ''}
        </div>
        ${groups.map(g => `<nav class="sfoot__col" aria-label="${esc(g.title || 'Ссылки')}">${g.title ? `<h3>${esc(g.title)}</h3>` : ''}<ul>${g.links.map(l => `<li>${footLink(l)}</li>`).join('')}</ul></nav>`).join('')}
      </div>
      <div class="sfoot__bar"><span>© ${new Date().getFullYear()} ${esc(siteTitle())}${F.copy ? ` · ${esc(F.copy)}` : ''}</span>
        <span class="sfoot__acts">${admin ? '<button class="btn ghost" id="footEdit">✎ Изменить подвал</button>' : ''}<a href="#" data-anchor="#наверх" class="sfoot__up">Наверх ↑</a></span></div>`;
    const b = $('#footEdit'); if (b) b.onclick = openFooterForm;
  }
  function openFooterForm() {
    const F = D().settings.footer || { about: '', copy: '', groups: [] };
    const toText = links => links.map(l => (l.label ? l.label + ' | ' : '') + l.url).join('\n');
    const gRow = g => `<div class="irow fg" data-drag="${Store.uid()}" draggable="true"><div class="irow__h"><span class="grip" title="Перетащите">⋮⋮</span><input class="fg-t" value="${esc(g.title)}" maxlength="60" placeholder="Заголовок колонки, например «Игрокам»" aria-label="Заголовок колонки"><button type="button" class="iconbtn" data-rm aria-label="Удалить колонку">✕</button></div>
      <textarea class="fg-l" rows="4" placeholder="Название | ссылка — по одной на строку" aria-label="Ссылки колонки">${esc(toText(g.links))}</textarea></div>`;
    openDialog({
      title: 'Подвал сайта',
      body: `<div class="note">Подвал виден внизу каждой страницы. Пока колонки не заполнены, сайт показывает их сам: разделы сайта, «Для игроков» и ваши соцсети. Значки соцсетей берутся из «⚙ Настройки → Ссылки и соцсети».</div>` +
        fld('О полигоне', `<textarea name="about" rows="3" maxlength="600" placeholder="Пара предложений: где полигон, какие игры проводите, как с вами связаться">${esc(F.about)}</textarea>`) +
        `<div class="fld"><span>Колонки ссылок (до 6)</span><div class="irows" id="fgRows">${F.groups.map(gRow).join('')}</div>
          <div class="admin-actions wrap"><button type="button" class="btn ghost" id="fgAdd">+ Колонка</button><button type="button" class="btn ghost" id="fgFill">Заполнить как сейчас</button></div>
          <small>Строка — «Название | ссылка». Ссылки: https://…, vk.com/…, tel:+79780000000, mailto:почта. Переходы по сайту: <b>#игра</b>, <b>#сценарии</b>, <b>#карта</b>, <b>#турнир</b>, <b>#игрокам</b>, <b>#наверх</b>, а <b>#раздел:Прокат</b> откроет раздел «Для игроков» с таким заголовком.</small></div>` +
        fld('Строка в самом низу', `<input name="copy" maxlength="160" value="${esc(F.copy)}" placeholder="например: Крым, Симферопольский район · ИП Иванов">`, 'Идёт после «© год Название».'),
      onOpen: f => {
        const box = f.querySelector('#fgRows');
        const add = g => { if (box.children.length >= 6) { toast('Не больше 6 колонок', 'err'); return; } box.insertAdjacentHTML('beforeend', gRow(g)); enableDrag(box, () => {}); };
        f.querySelector('#fgAdd').onclick = () => { add({ title: '', links: [] }); box.lastElementChild.querySelector('.fg-t').focus(); };
        f.querySelector('#fgFill').onclick = () => { box.innerHTML = ''; defaultFootGroups().forEach(add); };
        f.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) b.closest('.fg').remove(); });
        enableDrag(box, () => {});
      },
      onSubmit: async (fd, f) => {
        const bad = [];
        const groups = [...f.querySelectorAll('#fgRows .fg')].map(r => ({ title: r.querySelector('.fg-t').value.trim(),
          links: r.querySelector('.fg-l').value.split('\n').map(x => x.trim()).filter(Boolean).map(line => {
            const i = line.lastIndexOf('|'), label = i >= 0 ? line.slice(0, i).trim() : '', url = (i >= 0 ? line.slice(i + 1) : line).trim();
            if (!/^(https?:\/\/|tel:|mailto:)\S+$/i.test(url) && !/^#[^"'<>]+$/.test(url) && !/^[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(url)) { bad.push(line); return null; }
            return { label, url };
          }).filter(Boolean) })).filter(g => g.title || g.links.length);
        D().settings.footer = { about: fd.get('about').trim(), copy: fd.get('copy').trim(), groups };
        await commit('Подвал сохранён');
        if (bad.length) toast(`Пропущены строки с непонятной ссылкой: ${bad.slice(0, 3).join('; ')}`, 'err');
      }
    });
  }

  /* ================================================================
     ПАНЕЛЬ
     ================================================================ */
  function setPanelHead(title, sub) {
    $('#panelTitle').textContent = title;
    $('#panelBack').hidden = $('#panelClose').hidden = !sub;
  }
  function renderPanel() {
    for (const k in galleries) if (!k.startsWith('info')) delete galleries[k];
    const body = $('#panelBody'), sc = curScenario(), g = curGame();
    $('#topGame').textContent = g ? `${sc.title} · ${g.title} · ${fmtDate(g.date)}` : sc ? sc.title : 'Полигон';
    if (S.placeId) { const p = places().find(x => x.id === S.placeId); if (p) return renderPlace(p); S.placeId = null; }
    if (S.pointId && g) { const p = g.points.find(x => x.id === S.pointId); if (p) return renderPoint(g, p); S.pointId = null; }
    if (!sc) { setPanelHead('Полигон', false); body.innerHTML = polygonHtml(); bindPanel(); return; }
    setPanelHead(sc.title, false);
    const games = scGames(sc.id);
    let h = games.length ? `<div class="selectwrap"><label class="sr" for="gameSelect">Игра сценария</label><select id="gameSelect">${games.map(x =>
      `<option value="${esc(x.id)}" ${x.id === S.gameId ? 'selected' : ''}>${esc(fmtDate(x.date))} — ${esc(x.title)}${isFuture(x) ? ' (скоро)' : ''}</option>`).join('')}</select></div>` : '';
    const showTour = scTours(sc.id).length > 0 || store.canWrite();   // гостям вкладка видна, только если турнир есть
    h += `<div class="seg ${showTour ? 'seg--5' : ''}" role="tablist">
        <button role="tab" data-tab="game" class="${S.tab === 'game' ? 'active' : ''}">Игра</button>
        <button role="tab" data-tab="rules" class="${S.tab === 'rules' ? 'active' : ''}">Сценарий</button>
        <button role="tab" data-tab="teams" class="${S.tab === 'teams' ? 'active' : ''}">Команды</button>
        <button role="tab" data-tab="chain" class="${S.tab === 'chain' ? 'active' : ''}">Хроника</button>${showTour ? `
        <button role="tab" data-tab="tour" class="${S.tab === 'tour' ? 'active' : ''}">Турнир</button>` : ''}</div>`;
    h += S.tab === 'tour' && showTour ? tourHtml(sc) : S.tab === 'rules' ? scenarioHtml(sc) : S.tab === 'chain' ? chainHtml(sc) : S.tab === 'teams' && g ? teamsHtml(g) : g ? gameHtml(g) :
      `<div class="box" style="color:var(--muted)">В этом сценарии пока нет игр.${store.canWrite() ? '<br><br><button class="btn primary" id="emptyNew">Добавить игру</button>' : ''}</div>`;
    body.innerHTML = h;
    bindPanel(); syncPhaseButtons();
  }
  function bindPanel() {
    const body = $('#panelBody');
    const gs = body.querySelector('#gameSelect'); if (gs) gs.onchange = e => selectGame(e.target.value);
    body.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { S.tab = b.dataset.tab; renderPanel(); syncHash(); });
    // в «Хронике» клик по игре только переключает карту — вкладка остаётся, можно быстро листать игры
    body.querySelectorAll('[data-game]').forEach(b => b.onclick = () => {
      if (S.tab !== 'chain') S.tab = 'game';
      const top = body.scrollTop; selectGame(b.dataset.game); body.scrollTop = top;
    });
    body.querySelectorAll('[data-point]').forEach(b => b.onclick = () => selectPoint(b.dataset.point, true));
    body.querySelectorAll('[data-place]').forEach(b => b.onclick = () => selectPlace(b.dataset.place, true));
    const on = (id, fn) => { const el = body.querySelector('#' + id); if (el) el.onclick = fn; };
    on('emptyNew', () => openGameForm(null));
    on('editGameBtn', () => openGameForm(curGame()));
    on('editScBtn', () => openScenarioForm(curScenario()));
    on('dupGameBtn', () => duplicateGame(curGame()));
    const ts = body.querySelector('#tourSelect'); if (ts) ts.onchange = e => { S.tourId = e.target.value; renderPanel(); syncHash(); };
    body.querySelectorAll('[data-newtour]').forEach(b => b.onclick = () => openTourForm(null, b.dataset.newtour));
    body.querySelectorAll('[data-edittour]').forEach(b => b.onclick = () => openTourForm(curTour()));
    body.querySelectorAll('[data-bkwide]').forEach(b => b.onclick = openBracketWide);
    if (store.canWrite()) {
      const pl = body.querySelector('#pointList'); if (pl) enableDrag(pl, async ids => { const g = curGame(); g.points.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)); await commit('Порядок точек сохранён'); });
      const ol = body.querySelector('#placeList'); if (ol) enableDrag(ol, async ids => { places().sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)); await commit('Порядок объектов сохранён'); });
    }
  }

  function polygonHtml() {
    let h = `<div class="gamehead"><div class="date">Превью местности</div><h3>${esc(siteTitle())}</h3>
      <p>Карта полигона без точек игры: граница, постоянные объекты${relief ? ' и рельеф' : ''}.</p></div>`;
    if (relief) {
      const b = relief.bounds, km = (a, c) => (a * 111.32 * c).toFixed(1).replace('.', ',');
      const w = km(b.se[1] - b.nw[1], Math.cos(b.nw[0] * Math.PI / 180)), hh = km(b.nw[0] - b.se[0], 1);
      h += `<div class="score"><div style="--c:var(--amber)"><b>${w}×${hh}</b><span>км</span></div>
        <div style="--c:var(--amber)"><b>${relief.min}–${relief.max}</b><span>высоты, м</span></div>
        <div style="--c:var(--place)"><b>${places().length}</b><span>объектов</span></div></div>`;
    }
    h += `<div class="sec"><div class="sec__t">Объекты полигона <span>${places().length}</span></div>`;
    h += places().length ? '<div class="plist" id="placeList">' + places().map(p =>
      `<button class="pitem" style="--c:var(--place)" data-place="${esc(p.id)}"${store.canWrite() ? ` draggable="true" data-drag="${esc(p.id)}"` : ''}><span class="dot">${iconOf(p, 'building')}</span><b>${esc(p.name)}</b><small>${squareOf(p.x, p.y).sq}</small></button>`).join('') + '</div>'
      : `<div class="box" style="color:var(--muted)">Объектов пока нет.${store.canWrite() ? ' Нажмите «+ Объект» и кликните по карте.' : ''}</div>`;
    h += '</div>';
    if (relief) h += `<p class="hint">Высоты: ${esc(relief.source)}. Шаг горизонталей ${relief.interval} м, жирные — каждые 25 м. Точность около 5–10 м.</p>`;
    return h;
  }

  function scenarioHtml(sc) {
    const l = scGames(sc.id);
    let h = `<div class="gamehead"><div class="date">Сценарий · игр: ${l.length}</div><h3>${esc(sc.title)}</h3>${sc.summary ? `<p>${esc(sc.summary)}</p>` : ''}</div>`;
    h += sc.rules ? `<div class="sec"><div class="sec__t">Правила</div><div class="box">${esc(sc.rules)}</div></div>` : `<div class="sec"><div class="box" style="color:var(--muted)">Правила пока не заполнены.</div></div>`;
    if (sc.photos.length) h += `<div class="sec"><div class="sec__t">Фото <span>${sc.photos.length}</span></div>${gallery('sc', sc.photos)}</div>`;
    if (store.canWrite()) h += `<div class="admin-actions"><button class="btn" id="editScBtn">Изменить сценарий</button></div>`;
    return h;
  }

  const changesOf = g => g.points.filter(changed);
  const changeChip = p => `<button class="chg" data-point="${esc(p.id)}"><b>${esc(p.name)}</b><span class="flow"><i style="--c:${sideColor(p.before)}">${esc(sideName(p.before))}</i>→<i style="--c:${sideColor(p.after)}">${esc(sideName(p.after))}</i></span><small>${squareOf(p.x, p.y).sq}</small></button>`;

  function gameHtml(g) {
    const prev = prevGame(g), fut = isFuture(g);
    let h = `<div class="gamehead">
      <div class="date">${esc(fmtDate(g.date))}<span class="st ${fut ? 'st--soon' : ''}">${fut ? 'скоро' : 'сыграна'}</span>${/тест/i.test(g.summary + g.title) ? '<span class="demo-tag">ТЕСТ</span>' : ''}</div>
      <h3>${esc(g.title)}</h3>${g.summary ? `<p>${esc(g.summary)}</p>` : ''}</div>`;
    const ids = D().sides.map(s => s.id).filter(id => g.sides[id] || g.points.some(p => p.after === id || p.before === id));
    if (ids.length) {
      h += '<div class="sides">' + ids.map(id => {
        const s = g.sides[id] || {}, l = sideEntries(s), tot = sideTotal(s), n = g.points.filter(p => owner(p) === id).length;
        const shown = l.slice(0, 4);
        return `<div class="side" style="--c:${sideColor(id)}"><div class="side__n">${esc(sideName(id))}</div>
          ${l.length ? shown.map(e => `<div class="side__t">${teamBadge(e.id, id, 'tb--s')}<b>${esc(e.t.name)}</b></div>`).join('') + (l.length > 4 ? `<button class="link side__more" data-tab="teams">ещё ${l.length - 4} ${plural(l.length - 4, 'команда', 'команды', 'команд')} →</button>` : '') : '<div class="side__t"><b>—</b></div>'}
          <div class="side__m">${l.length > 1 ? `команд: ${l.length} · ` : ''}${tot != null ? `${tot} чел. · ` : ''}точек: ${n}</div></div>`;
      }).join('') + '</div>';
    }
    if (isMedia(g)) h += `<div class="sec"><div class="box nomap">Игра проходит без карты полигона — вместо карты показана ${g.media.url ? 'схема (гифка или картинка)' : 'схема, когда её добавят'}.${g.media.link ? ` <a href="${esc(g.media.link)}" target="_blank" rel="noopener">${esc(g.media.linkLabel || 'Открыть проект')} ↗</a>` : ''}</div></div>`;
    if (g.points.length && !isMedia(g)) {
      const ch = changesOf(g);
      h += `<div class="sec"><div class="sec__t">Положение точек</div>
        <div class="seg seg--phase"><button data-phase="before">До игры</button><button data-phase="after">После игры</button></div>`;
      h += ch.length ? `<div class="changes">${ch.map(changeChip).join('')}</div>`
        : `<div class="box" style="color:var(--muted)">${fut ? 'Игра ещё не прошла — показано стартовое положение.' : 'За игру ни одна точка не сменила владельца.'}</div>`;
      h += `<p class="hint">${prev ? `Стартовое положение — итог игры «${esc(prev.title)}» от ${esc(fmtDate(prev.date))}.` : 'Это первая игра сценария.'}</p></div>`;
    }
    const sec = (t, v) => v ? `<div class="sec"><div class="sec__t">${t}</div><div class="box">${esc(v)}</div></div>` : '';
    h += sec('Сбор', g.gather) + sec('Итог', g.result);
    const sc = scById(g.scenarioId);
    if (sc && sc.rules) h += `<div class="sec"><div class="sec__t">Правила сценария</div><div class="box">${esc(sc.rules)}</div></div>`;
    if (g.photos.length) h += `<div class="sec"><div class="sec__t">Фото игры <span>${g.photos.length}</span></div>${gallery('game', g.photos)}</div>`;
    if (!isMedia(g)) { h += `<div class="sec"><div class="sec__t">Точки <span>${g.points.length}</span></div>`;
    h += g.points.length ? '<div class="plist" id="pointList">' + g.points.map(p =>
      `<button class="pitem" style="--c:${sideColor(owner(p))}" data-point="${esc(p.id)}"${store.canWrite() ? ` draggable="true" data-drag="${esc(p.id)}"` : ''}><span class="dot">${iconOf(p)}</span><b>${esc(p.name)}</b>${changed(p) ? '<span class="tag">смена</span>' : ''}<small>${squareOf(p.x, p.y).sq}</small></button>`).join('') + '</div>'
      : `<div class="box" style="color:var(--muted)">Точек нет.${store.canWrite() ? ' Нажмите «+ Точка» и кликните по карте.' : ''}</div>`;
    h += '</div>'; }
    if (g.arrows.length && !isMedia(g)) h += `<p class="hint">Стрелок направлений на карте: ${g.arrows.length}.</p>`;
    if (store.canWrite()) h += `<div class="admin-actions wrap"><button class="btn" id="editGameBtn">Изменить игру</button><button class="btn" id="dupGameBtn">Копировать игру</button></div>${g.points.length > 1 && !isMedia(g) ? '<p class="hint">Порядок точек в списке меняется перетаскиванием.</p>' : ''}`;
    else if (fut) h += `<div class="admin-actions"><button class="btn primary" data-signup="${esc(g.id)}">Записаться на игру</button></div>`;
    return h;
  }

  /** Вкладка «Команды»: кто играл в этой игре — эмблема, команда, отмеченные участники. Телефоны не показываются никогда. */
  function teamsHtml(g) {
    const ids = D().sides.map(s => s.id).filter(id => g.sides[id]);
    const showNames = D().settings.showRoster || store.canWrite();
    let h = `<div class="gamehead"><div class="date">${esc(fmtDate(g.date))}</div><h3>${esc(g.title)}</h3><p>Команды и участники этой игры.</p></div>`;
    if (!ids.length) return h + `<div class="box" style="color:var(--muted)">Команды для этой игры не указаны.${store.canWrite() ? ' Назначьте их в форме игры.' : ''}</div>`;
    h += ids.map(id => {
      const s = g.sides[id], l = sideEntries(s), total = sideTotal(s);
      const teamBlock = e => {
        const ppl = e.t.players.filter(p => e.present.includes(p.id)), cnt = entryCount(e);
        const body = ppl.length && showNames ? `<ul class="roster-list">${ppl.map(p => `<li><b>${esc(p.callsign || '—')}</b>${p.role ? `<span class="rl-role rl-${p.role}">${ROLE[p.role]}</span>` : ''}${p.rank ? `<small>${esc(p.rank)}</small>` : ''}</li>`).join('')}</ul>` : '';
        return `<div class="tsub"><div class="tsub__h">${teamBadge(e.id, id, 'tb--m')}<b>${esc(e.t.name)}</b>${cnt != null ? `<span>${cnt} чел.${ppl.length && !showNames ? ' · имена скрыты' : ''}</span>` : ''}</div>${body}</div>`;
      };
      const body = l.length ? l.map(teamBlock).join('') : `<p class="hint">${isFuture(g) ? 'Команды пока не указаны.' : 'Команды не указаны.'}</p>`;
      return `<section class="tcard" style="--c:${sideColor(id)}"><div class="tcard__h"><i class="tb-dot" style="--c:${sideColor(id)}"></i>
        <div><h4>${esc(sideName(id))}</h4>${l.length ? `<div class="side__n">команд: ${l.length}</div>` : ''}</div>${total != null ? `<span class="tcard__n">${total}<small>чел.</small></span>` : ''}</div>${body}</section>`;
    }).join('');
    if (store.canWrite()) h += `<p class="hint">Команды и участников отмечают в форме игры: «Изменить игру» → у каждой стороны «+ команда», галочки у состава. ${D().settings.showRoster ? 'Позывные видны всем посетителям.' : 'Позывные видите только вы — гостям показывается число.'}</p><div class="admin-actions"><button class="btn" id="editGameBtn">Изменить игру</button></div>`;
    return h;
  }
  function chainHtml(sc) {
    const l = scGames(sc.id);
    if (!l.length) return '<div class="box" style="color:var(--muted)">Игр пока нет.</div>';
    return `<p class="hint" style="margin:0 0 10px">Игры идут цепочкой: каждая начинается с того положения, которым закончилась предыдущая. Нажмите на игру — карта слева покажет её${S.gameId ? ', а подробности — на вкладке <button class="link" data-tab="game">«Игра»</button>' : ''}.</p><ol class="chain">` + l.map((g, i) => {
      const ch = changesOf(g);
      return `<li><button class="fcard ${g.id === S.gameId ? 'active' : ''}" data-game="${esc(g.id)}" aria-pressed="${g.id === S.gameId}">
        <div class="date">${i + 1}. ${esc(fmtDate(g.date))}${isFuture(g) ? ' · скоро' : ''}</div><h4>${esc(g.title)}</h4>
        ${g.summary ? `<p>${esc(g.summary)}</p>` : ''}${teamsMini(g)}
        <div class="mini">${ch.length ? ch.map(p => `<span><b>${esc(p.name)}</b> <i style="--c:${sideColor(p.before)}"></i>→<i style="--c:${sideColor(p.after)}"></i></span>`).join('') : `<span class="muted">${isFuture(g) ? 'ещё не сыграна' : isMedia(g) ? 'без карты' : 'без смены владельцев'}</span>`}</div>
      </button></li>`;
    }).join('') + '</ol>';
  }

  function renderPoint(g, p) {
    setPanelHead('Точка', true);
    const color = sideColor(owner(p));
    const hist = scGames(g.scenarioId).filter(x => !isMedia(x)).map(x => ({ g: x, q: findByName(x, p.name) })).filter(x => x.q);
    let h = `<div class="pcard" style="--c:${color}"><span class="big">${iconOf(p)}</span>
        <div><div class="k">${esc(TYPES[p.type])}</div><h3>${esc(p.name)}</h3><div class="t">${esc(g.title)} · ${esc(fmtDate(g.date))}</div></div></div>
      <div class="own"><div style="--c:${sideColor(p.before)}"><small>До игры</small><b>${esc(sideName(p.before))}</b></div><span>→</span><div style="--c:${sideColor(p.after)}"><small>После игры</small><b>${esc(sideName(p.after))}</b></div></div>`;
    if (changed(p)) h += `<div class="alert">▲ Точка сменила владельца в этой игре</div>`;
    if (p.note) h += `<div class="sec"><div class="sec__t">Описание</div><div class="box">${esc(p.note)}</div></div>`;
    h += `<div class="sec"><div class="sec__t">Координаты</div><div class="box mono">${coordsBox(p.x, p.y)}${p.area.length >= 3 ? '<br>Есть зона точки' : ''}</div></div>`;
    if (hist.length > 1) {
      h += `<div class="sec"><div class="sec__t">История точки в сценарии <span>${hist.length}</span></div><div class="hist">` +
        hist.map(({ g: x, q }) => `<button class="${x.id === g.id ? 'cur' : ''}" data-hist="${esc(x.id)}"><span class="d">${esc(fmtDate(x.date))}</span><span>${esc(x.title)}</span><span class="s" style="--c:${sideColor(q.after)}" title="После игры: ${esc(sideName(q.after))}"></span></button>`).join('') + '</div></div>';
    }
    if (p.photos.length) h += `<div class="sec"><div class="sec__t">Фото точки <span>${p.photos.length}</span></div>${gallery('pt', p.photos)}</div>`;
    if (store.canWrite()) h += `<div class="admin-actions wrap"><button class="btn" id="editPointBtn">Изменить точку</button><button class="btn" id="dupPointBtn">Копировать</button><button class="btn" id="areaBtn">${p.area.length >= 3 ? 'Перерисовать зону' : 'Нарисовать зону'}</button>${p.area.length >= 3 ? '<button class="btn danger" id="areaDel">Удалить зону</button>' : ''}</div><p class="hint">Чтобы переместить точку, перетащите маркер на карте.</p>`;
    const body = $('#panelBody'); body.innerHTML = h; body.scrollTop = 0;
    body.querySelectorAll('[data-hist]').forEach(b => b.onclick = () => {
      const x = D().games.find(y => y.id === b.dataset.hist); const q = findByName(x, p.name);
      S.gameId = x.id; S.pointId = q.id; refresh();
    });
    const on = (id, fn) => { const el = body.querySelector('#' + id); if (el) el.onclick = fn; };
    on('editPointBtn', () => openPointForm(p));
    on('areaBtn', () => startDraw('area', p));
    on('dupPointBtn', async () => {
      const g = curGame(), c = Object.assign(structuredClone(p), { id: Store.uid(), name: p.name + ' (копия)', x: clamp01(p.x + 0.015), y: clamp01(p.y + 0.015) });
      c.area = c.area.map(([x, y]) => [clamp01(x + 0.015), clamp01(y + 0.015)]);
      g.points.splice(g.points.findIndex(x => x.id === p.id) + 1, 0, c); S.pointId = c.id; await commit('Точка скопирована — перетащите её на место');
    });
    on('areaDel', async () => { const q = curGame().points.find(z => z.id === p.id); q.area = []; await commit('Зона удалена'); });
  }

  function renderPlace(p) {
    setPanelHead('Объект полигона', true);
    let h = `<div class="pcard" style="--c:var(--place)"><span class="big">${iconOf(p, 'building')}</span>
        <div><div class="k">${esc(PLACE_TYPES[p.type] || 'Объект')}</div><h3>${esc(p.name)}</h3><div class="t">Постоянный объект, есть на всех играх</div></div></div>`;
    if (p.note) h += `<div class="sec"><div class="sec__t">Описание</div><div class="box">${esc(p.note)}</div></div>`;
    h += `<div class="sec"><div class="sec__t">Координаты</div><div class="box mono">${coordsBox(p.x, p.y)}</div></div>`;
    if (p.photos.length) h += `<div class="sec"><div class="sec__t">Фото <span>${p.photos.length}</span></div>${gallery('pl', p.photos)}</div>`;
    if (store.canWrite()) h += `<div class="admin-actions"><button class="btn" id="editPlaceBtn">Изменить объект</button></div><p class="hint">Чтобы переместить объект, перетащите его на карте.</p>`;
    const body = $('#panelBody'); body.innerHTML = h; body.scrollTop = 0;
    const ep = $('#editPlaceBtn'); if (ep) ep.onclick = () => openPlaceForm(p);
  }

  /* ================================================================
     ТУРНИРЫ: сетка на выбывание и нумерованный список с очками
     ================================================================ */
  const scTours = scId => (D().tournaments || []).filter(t => t.scenarioId === scId);
  const curTour = () => { const l = scTours(S.scId); return l.find(t => t.id === S.tourId) || l[0] || null; };
  const teamById = id => D().teams.find(t => t.id === id) || null;
  const CUP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v5a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M7 5H4v1.5A3.5 3.5 0 0 0 7.5 10M17 5h3v1.5A3.5 3.5 0 0 1 16.5 10" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 13v4M8 21h8l-1-4H9z" fill="currentColor"/></svg>';
  /** Раунды сетки. Команды играют парами по порядку (1–2, 3–4…). При нечётном числе последняя проходит
      дальше без игры и в следующем раунде встаёт первой. Победитель пары переходит в следующий раунд. */
  function bracket(t) {
    let parts = t.teams.filter(id => teamById(id)).map(id => ({ team: id }));
    const rounds = []; let num = 0;
    if (parts.length < 2) return { rounds, champion: parts.length ? parts[0].team : null };
    for (let r = 1; parts.length > 1; r++) {
      const list = parts.slice(), bye = list.length % 2 ? list.pop() : null, matches = [], next = [];
      for (let i = 0; i < list.length; i += 2) {
        const key = `r${r}m${i / 2 + 1}`, a = list[i], b = list[i + 1], res = t.results[key] || {};
        const winner = a.team && b.team && (res.winner === a.team || res.winner === b.team) ? res.winner : null;
        const m = { key, num: ++num, a, b, winner, score: res.score || '', note: res.note || '' };
        matches.push(m);
        next.push(winner ? { team: winner } : { team: null, from: m.num });
      }
      rounds.push({ r, n: parts.length, matches, bye });
      parts = bye ? [bye].concat(next) : next;
    }
    return { rounds, champion: parts[0].team };
  }
  const roundName = (R, i) => i === R.length - 1 ? 'Финал' : i === R.length - 2 && R[i].matches.length <= 2 ? 'Полуфинал' : `${i + 1}-й раунд`;
  function slotHtml(p, m) {
    if (!p.team) return `<span class="bk-t bk-t--tbd">Победитель матча ${p.from}</span>`;
    const t = teamById(p.team), win = m && m.winner === p.team, lose = m && m.winner && !win;
    const adm = store.canWrite() && m && m.a.team && m.b.team, tag = adm ? 'button' : 'span';
    return `<${tag} ${adm ? `type="button" data-win="${esc(m.key)}" data-team="${esc(p.team)}" title="${win ? 'Снять победу' : 'Отметить победителем'}" aria-pressed="${win}"` : ''} class="bk-t ${win ? 'is-win' : ''} ${lose ? 'is-lose' : ''}">${teamBadge(p.team, '', 'tb--s')}<b>${esc(t ? t.name : '—')}</b>${win ? '<i class="bk-w" aria-label="победа">✓</i>' : ''}</${tag}>`;
  }
  const matchHtml = m => `<div class="bk-m ${m.winner ? 'is-done' : ''}">
      <div class="bk-m__h"><span>Матч ${m.num}</span>${m.score ? `<b class="bk-score">${esc(m.score)}</b>` : ''}${store.canWrite() ? `<button type="button" class="bk-ed" data-medit="${esc(m.key)}" title="Счёт и примечание" aria-label="Счёт и примечание: матч ${m.num}">✎</button>` : ''}</div>
      ${slotHtml(m.a, m)}${slotHtml(m.b, m)}${m.note ? `<div class="bk-note">${esc(m.note)}</div>` : ''}</div>`;
  const byeHtml = p => `<div class="bk-bye">${slotHtml(p, null)}<small>проходит дальше без игры</small></div>`;
  function bracketHtml(t, wide) {
    const B = bracket(t);
    if (!B.rounds.length) return `<div class="box" style="color:var(--muted)">Для сетки нужно хотя бы две команды${store.canWrite() ? ' — добавьте их в «Изменить турнир»' : ''}.</div>`;
    const ch = B.champion ? teamById(B.champion) : null;
    let h = ch ? `<div class="bk-champ">${teamBadge(ch.id, '', 'tb--m')}<div><small>Победитель турнира</small><b>${esc(ch.name)}</b></div><span class="bk-cup">${CUP}</span></div>` : '';
    h += `<div class="bk ${wide ? 'bk--wide' : ''}">` + B.rounds.map((R, i) => `<section class="bk-r"><h4 class="bk-r__t">${roundName(B.rounds, i)}<small>${R.matches.length} ${plural(R.matches.length, 'пара', 'пары', 'пар')}</small></h4>
        <div class="bk-r__m">${R.matches.map(matchHtml).join('')}${R.bye ? byeHtml(R.bye) : ''}</div></section>`).join('') + '</div>';
    if (!wide) h += `<button type="button" class="btn ghost bk-open" data-bkwide>Сетка целиком ⤢</button>`;
    return h;
  }
  /** Список: места по очкам (больше — выше), при равных очках место общее. */
  function listHtml(t) {
    const rows = t.rows.filter(r => teamById(r.team)).map((r, i) => ({ r, i }))
      .sort((a, b) => ((b.r.points ?? -Infinity) - (a.r.points ?? -Infinity)) || a.i - b.i).map(x => x.r);
    if (!rows.length) return `<div class="box" style="color:var(--muted)">Список пока пуст.</div>`;
    let place = 0, prev;
    return '<ol class="lb">' + rows.map((r, k) => {
      if (k === 0 || r.points !== prev) { place = k + 1; prev = r.points; }
      const tm = teamById(r.team), pts = r.points != null ? String(r.points).replace('.', ',') : '—';
      return `<li class="lb-r ${place <= 3 && r.points != null ? 'lb-r--' + place : ''}"><span class="lb-n">${place}</span>${teamBadge(r.team, '', 'tb--s')}
        <div class="lb-t"><b>${esc(tm.name)}</b>${r.note ? `<small>${esc(r.note)}</small>` : ''}</div>
        <span class="lb-p">${pts}${r.points != null ? `<small>${plural(Math.abs(Math.round(r.points)), 'очко', 'очка', 'очков')}</small>` : ''}</span></li>`;
    }).join('') + '</ol>';
  }
  function tourHtml(sc) {
    const list = scTours(sc.id), admin = store.canWrite(), t = curTour();
    const add = `<button class="btn ghost" data-newtour="bracket">+ Турнирная сетка</button><button class="btn ghost" data-newtour="list">+ Список с очками</button>`;
    if (!t) return `<div class="box" style="color:var(--muted)">Турниров в этом сценарии пока нет.${admin ? ' Создайте турнирную сетку на выбывание или простой список команд с очками.' : ''}</div>` + (admin ? `<div class="admin-actions wrap">${add}</div>` : '');
    let h = list.length > 1 ? `<div class="selectwrap"><label class="sr" for="tourSelect">Турнир</label><select id="tourSelect">${list.map(x => `<option value="${esc(x.id)}" ${x.id === t.id ? 'selected' : ''}>${esc(x.title)}</option>`).join('')}</select></div>` : '';
    const n = t.kind === 'list' ? t.rows.length : t.teams.length;
    h += `<div class="gamehead"><div class="date">${t.kind === 'list' ? 'Список' : 'Турнирная сетка'} · ${n} ${plural(n, 'команда', 'команды', 'команд')}</div><h3>${esc(t.title)}</h3>${t.note ? `<p>${linkify(t.note)}</p>` : ''}</div>`;
    h += t.kind === 'list' ? listHtml(t) : bracketHtml(t);
    if (admin) h += `<div class="admin-actions wrap"><button class="btn" data-edittour>Изменить турнир</button>${add}</div>` +
      (t.kind === 'bracket' ? '<p class="hint">Победителя пары отметьте кликом по команде (повторный клик снимает). Счёт и примечание — кнопка ✎ у матча.</p>' : '');
    return h;
  }
  async function setWinner(key, team) {
    const t = curTour(); if (!t) return;
    const r = t.results[key] || (t.results[key] = { winner: '', score: '', note: '' });
    r.winner = r.winner === team ? '' : team;
    await commit(r.winner ? `${teamById(team)?.name || 'Команда'} — победа в паре` : 'Победа снята');
  }
  function openMatchForm(key) {
    const t = curTour(); if (!t) return;
    if ($('#dlg').open) $('#dlg').close();   // из «Сетки целиком» — окно матча открывается вместо неё
    const m = bracket(t).rounds.flatMap(R => R.matches).find(x => x.key === key); if (!m) return;
    const nm = p => p.team ? (teamById(p.team)?.name || '—') : `Победитель матча ${p.from}`;
    const both = m.a.team && m.b.team;
    openDialog({
      title: `Матч ${m.num}: ${nm(m.a)} — ${nm(m.b)}`,
      body: (both ? fld('Победитель', `<select name="winner"><option value="">— ещё не сыграли —</option>${[m.a, m.b].map(p => `<option value="${esc(p.team)}" ${m.winner === p.team ? 'selected' : ''}>${esc(nm(p))}</option>`).join('')}</select>`)
          : '<div class="note">Соперник в этой паре ещё не определился — победителя можно будет отметить позже.</div>') +
        fld('Счёт', `<input name="score" maxlength="20" value="${esc(m.score)}" placeholder="например 3:1">`) +
        fld('Примечание', `<input name="note" maxlength="200" value="${esc(m.note)}">`),
      onSubmit: async fd => {
        const tt = curTour(), r = tt.results[key] || (tt.results[key] = { winner: '', score: '', note: '' });
        if (both) r.winner = fd.get('winner') || '';
        r.score = fd.get('score').trim(); r.note = fd.get('note').trim();
        await commit('Матч сохранён');
      }
    });
  }
  function openBracketWide() {
    const t = curTour(); if (!t) return;
    openDialog({ title: t.title, body: bracketHtml(t, true) + (store.canWrite() ? '<p class="hint">Клик по команде — победитель пары, ✎ — счёт и примечание.</p>' : '') });
    const dlg = $('#dlg'); dlg.classList.add('dlg--wide'); dlg.dataset.wide = t.id;
    dlg.addEventListener('close', () => { dlg.classList.remove('dlg--wide'); delete dlg.dataset.wide; }, { once: true });
  }
  /** Если открыта «Сетка целиком» — перерисовать её после изменения. */
  function refreshWide() {
    const dlg = $('#dlg'), t = curTour();
    if (!dlg.open || !dlg.dataset.wide || !t || dlg.dataset.wide !== t.id) return;
    const b = dlg.querySelector('.dlg__body .bk'); if (b) b.outerHTML = bracketHtml(t, true).replace(/^[\s\S]*?(<div class="bk bk--wide">)/, '$1');
    const ch = dlg.querySelector('.dlg__body .bk-champ'), B = bracket(t);
    if (ch) ch.remove();
    if (B.champion) dlg.querySelector('.dlg__body').insertAdjacentHTML('afterbegin', `<div class="bk-champ">${teamBadge(B.champion, '', 'tb--m')}<div><small>Победитель турнира</small><b>${esc(teamById(B.champion).name)}</b></div><span class="bk-cup">${CUP}</span></div>`);
  }
  document.addEventListener('click', async e => {
    const w = e.target.closest('[data-win]');
    if (w && store.canWrite()) { e.preventDefault(); try { await setWinner(w.dataset.win, w.dataset.team); refreshWide(); } catch (x) {} return; }
    const me = e.target.closest('[data-medit]');
    if (me && store.canWrite()) { e.preventDefault(); openMatchForm(me.dataset.medit); }
  });
  function openTourForm(t, kind) {
    const d = D(), sc = curScenario(), isNew = !t;
    if (!sc) { toast('Сначала выберите сценарий', 'err'); return; }
    if (!d.teams.length) { toast('Справочник команд пуст — добавьте команды: ⚙ Настройки → Стороны и команды', 'err'); return; }
    t = t || { id: Store.uid(), scenarioId: sc.id, kind: kind === 'list' ? 'list' : 'bracket', title: '', note: '', teams: [], results: {}, rows: [] };
    const opts = sel => '<option value="">— команда —</option>' + d.teams.map(x => `<option value="${esc(x.id)}" ${sel === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
    const bRow = id => `<div class="erow tr-b" data-drag="${Store.uid()}" draggable="true"><span class="grip" title="Перетащите">⋮⋮</span><span class="tr-n"></span><select class="tr-team" aria-label="Команда">${opts(id)}</select><button type="button" class="iconbtn" data-rmr aria-label="Убрать команду">✕</button></div>`;
    const lRow = r => `<div class="erow tr-l" data-id="${esc(r.id)}"><select class="tr-team" aria-label="Команда">${opts(r.team)}</select><input type="number" class="tr-pts" step="any" inputmode="decimal" value="${r.points ?? ''}" placeholder="очки" aria-label="Очки"><input class="tr-note" maxlength="200" value="${esc(r.note || '')}" placeholder="примечание" aria-label="Примечание"><button type="button" class="iconbtn" data-rmr aria-label="Убрать строку">✕</button></div>`;
    openDialog({
      title: isNew ? 'Новый турнир' : 'Турнир: ' + t.title,
      body: `<div class="fld"><span>Вид</span><div class="vpick" role="radiogroup">
          <label><input type="radio" name="kind" value="bracket" ${t.kind !== 'list' ? 'checked' : ''}><span><b>Турнирная сетка</b><small>пары на выбывание, победитель идёт дальше</small></span></label>
          <label><input type="radio" name="kind" value="list" ${t.kind === 'list' ? 'checked' : ''}><span><b>Список</b><small>место, команда и очки</small></span></label></div></div>` +
        fld('Название', `<input name="title" required maxlength="100" value="${esc(t.title)}" placeholder="Например: Кубок Садовки — осень">`) +
        fld('Примечание', `<textarea name="note" rows="2" maxlength="1000">${esc(t.note)}</textarea>`, 'Видно над таблицей: формат, призы, регламент. Ссылки https://… кликабельны.') +
        `<div class="fld tr-sec" data-k="bracket"><span>Команды — пары первого раунда</span><div class="erows" id="trB">${(t.teams.length ? t.teams : ['', '']).map(bRow).join('')}</div>
          <div class="admin-actions wrap"><button type="button" class="btn ghost" id="trAddB">+ Команда</button><button type="button" class="btn ghost" id="trAllB">Все команды из справочника</button><button type="button" class="btn ghost" id="trShuf">Перемешать (жеребьёвка)</button></div>
          <div class="tr-pairs" id="trPairs"></div>
          <small>Пары идут сверху вниз: 1-я команда с 2-й, 3-я с 4-й… При нечётном числе последняя проходит в следующий раунд без игры. Порядок меняется перетаскиванием за ⋮⋮.</small>
          ${!isNew && Object.keys(t.results).length ? '<label class="check"><input type="checkbox" name="reset"> Сбросить результаты всех матчей (победителей, счёт, примечания)</label>' : ''}</div>` +
        `<div class="fld tr-sec" data-k="list"><span>Строки списка</span><div class="erows" id="trL">${(t.rows.length ? t.rows : [{ id: Store.uid(), team: '', points: null, note: '' }]).map(lRow).join('')}</div>
          <div class="admin-actions wrap"><button type="button" class="btn ghost" id="trAddL">+ Строка</button><button type="button" class="btn ghost" id="trAllL">Все команды из справочника</button></div>
          <small>Места считаются сами — по очкам, от большего к меньшему. При равных очках место общее.</small></div>`,
      onOpen: f => {
        const bBox = f.querySelector('#trB'), lBox = f.querySelector('#trL');
        const kindSync = () => { const k = f.querySelector('[name=kind]:checked').value; f.querySelectorAll('.tr-sec').forEach(s => { s.hidden = s.dataset.k !== k; }); };
        // одна команда — один раз в турнире: занятые пункты в других строках выключаем
        const taken = box => { const used = [...box.querySelectorAll('.tr-team')].map(x => x.value).filter(Boolean);
          box.querySelectorAll('.tr-team').forEach(sel => [...sel.options].forEach(o => { o.disabled = !!o.value && o.value !== sel.value && used.includes(o.value); })); };
        const upd = () => {
          const rows = [...bBox.querySelectorAll('.tr-b')];
          rows.forEach((r, i) => { r.querySelector('.tr-n').textContent = (i + 1) + '.'; r.classList.toggle('pair-end', i % 2 === 1); });
          const names = rows.map(r => r.querySelector('select')).filter(s => s.value).map(s => s.options[s.selectedIndex].text), p = [];
          for (let i = 0; i + 1 < names.length; i += 2) p.push(`${esc(names[i])} — ${esc(names[i + 1])}`);
          if (names.length % 2) p.push(`${esc(names[names.length - 1])} → без игры`);
          f.querySelector('#trPairs').innerHTML = names.length >= 2 ? `<b>Пары 1-го раунда:</b> ${p.join(' · ')}` : '';
          taken(bBox); taken(lBox);
        };
        const drag = () => enableDrag(bBox, upd);
        const free = box => d.teams.map(x => x.id).filter(id => ![...box.querySelectorAll('.tr-team')].some(s => s.value === id));
        f.querySelectorAll('[name=kind]').forEach(r => r.addEventListener('change', kindSync));
        f.querySelector('#trAddB').onclick = () => { bBox.insertAdjacentHTML('beforeend', bRow('')); drag(); upd(); bBox.lastElementChild.querySelector('select').focus(); };
        f.querySelector('#trAddL').onclick = () => { lBox.insertAdjacentHTML('beforeend', lRow({ id: Store.uid(), team: '', points: null, note: '' })); upd(); lBox.lastElementChild.querySelector('select').focus(); };
        f.querySelector('#trAllB').onclick = () => { const ids = free(bBox); [...bBox.querySelectorAll('.tr-team')].filter(s => !s.value).forEach(s => { if (ids.length) s.value = ids.shift(); }); ids.forEach(id => bBox.insertAdjacentHTML('beforeend', bRow(id))); drag(); upd(); };
        f.querySelector('#trAllL').onclick = () => { const ids = free(lBox); [...lBox.querySelectorAll('.tr-team')].filter(s => !s.value).forEach(s => { if (ids.length) s.value = ids.shift(); }); ids.forEach(id => lBox.insertAdjacentHTML('beforeend', lRow({ id: Store.uid(), team: id, points: null, note: '' }))); upd(); };
        f.querySelector('#trShuf').onclick = () => { const rows = [...bBox.children]; for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rows[i], rows[j]] = [rows[j], rows[i]]; } rows.forEach(r => bBox.appendChild(r)); upd(); };
        f.addEventListener('click', e => { const b = e.target.closest('[data-rmr]'); if (b) { b.closest('.erow').remove(); upd(); } });
        f.addEventListener('change', e => { if (e.target.closest('.tr-team')) upd(); });
        kindSync(); drag(); upd();
      },
      onSubmit: async (fd, f) => {
        const kind = fd.get('kind') === 'list' ? 'list' : 'bracket';
        const teams = [...new Set([...f.querySelectorAll('#trB .tr-team')].map(s => s.value).filter(Boolean))];
        const seen = new Set();
        const rows = [...f.querySelectorAll('#trL .tr-l')].map(r => ({ id: r.dataset.id, team: r.querySelector('.tr-team').value,
          points: r.querySelector('.tr-pts').value === '' ? null : +r.querySelector('.tr-pts').value, note: r.querySelector('.tr-note').value.trim() }))
          .filter(r => r.team && !seen.has(r.team) && seen.add(r.team));
        if (kind === 'bracket' && teams.length < 2) throw new Error('Для турнирной сетки нужно хотя бы две команды');
        if (kind === 'list' && !rows.length) throw new Error('Добавьте в список хотя бы одну команду');
        const data = Object.assign({}, t, { kind, title: fd.get('title').trim(), note: fd.get('note').trim(), teams, rows, results: fd.get('reset') ? {} : t.results });
        if (!D().tournaments) D().tournaments = [];
        const i = D().tournaments.findIndex(x => x.id === t.id);
        if (i >= 0) D().tournaments[i] = data; else D().tournaments.push(data);
        S.tourId = data.id; S.tab = 'tour';
        await commit(isNew ? 'Турнир создан' : 'Турнир сохранён');
      },
      onDelete: isNew ? null : async () => { D().tournaments = D().tournaments.filter(x => x.id !== t.id); S.tourId = null; await commit('Турнир удалён'); },
      deleteText: 'Удалить турнир'
    });
  }

  /* ---------- выбор ---------- */
  function syncHash() {
    const q = new URLSearchParams();
    if (S.scId) q.set('s', S.scId); if (S.gameId && S.scId) q.set('g', S.gameId);
    if (S.pointId) q.set('p', S.pointId); if (S.placeId) q.set('o', S.placeId);
    if (S.tab === 'tour' && S.scId) { q.set('t', 'tour'); const t = curTour(); if (t) q.set('tr', t.id); }   // ссылкой на турнир можно поделиться
    try { history.replaceState(null, '', q.toString() ? '#' + q.toString() : location.pathname + location.search); } catch (e) {}
  }
  function refresh() { renderBorder(); renderHero(); renderLegend(); renderFilters(); renderMap(); applyLayers(); renderMediaView(); renderPanel(); syncHash(); updateAdminUi(); }
  function selectScenario(id, gameId) {
    S.scId = id || ''; S.pointId = null; S.placeId = null;
    const g = gameId ? D().games.find(x => x.id === gameId) : defaultGame(S.scId);
    S.gameId = g ? g.id : null; S.phase = g && isFuture(g) ? 'before' : 'after'; S.tab = 'game';
    refresh();
  }
  function selectGame(id) {
    const g = D().games.find(x => x.id === id);
    S.gameId = id; S.pointId = null; S.placeId = null; S.phase = g && isFuture(g) ? 'before' : 'after'; refresh();
  }
  function selectPlace(id, fly) { S.placeId = id; S.pointId = null; refresh(); focusMarker(markerById.get('place:' + id), fly); }
  function selectPoint(id, fly) { S.pointId = id; S.placeId = null; refresh(); focusMarker(markerById.get(id), fly); }
  function focusMarker(m, fly) {
    if (!m) { if (fly) toast('Скрыто слоем карты'); return; }
    if (fly) { const z = Math.max(map.getZoom(), Z - 3); map.flyTo(m.getLatLng(), z, { duration: .6 }); }
    else map.panInside(m.getLatLng(), { padding: [50, 50] });
  }
  const closeSub = () => { S.pointId = null; S.placeId = null; refresh(); };
  $('#panelBack').onclick = closeSub; $('#panelClose').onclick = closeSub;

  /* ================================================================
     АДМИНКА
     ================================================================ */
  async function commit(msg) {
    try { await store.save(); refresh(); if (msg) toast(msg); }
    catch (e) {
      if (e.conflict) { // пока вы правили, другой админ уже сохранил свою версию
        await reload(); const m = store.meta();
        if ($('#dlg').open) $('#dlg').close(); // в открытом окне остались старые значения — откройте его заново
        if (S.mode) { stopMode(); renderMap(); }
        const c = new Error(`Пока вы правили, данные сохранил ${m.by || 'другой админ'}. Загружена свежая версия — откройте и сделайте изменение ещё раз.`);
        toast(c.message, 'err'); throw c;
      }
      toast(e.message, 'err'); throw e;
    }
  }

  function openDialog({ title, body, submit = 'Сохранить', onSubmit, onDelete, deleteText, onOpen }) {
    if (S.mode) { stopMode(); renderMap(); }
    const f = $('#dlgForm');
    f.innerHTML = `<header class="dlg__head"><h2>${esc(title)}</h2><button type="button" class="iconbtn" data-close aria-label="Закрыть">✕</button></header>
      <div class="dlg__body">${body}</div>
      <footer class="dlg__foot">${onDelete ? `<button type="button" class="btn danger" data-del>${esc(deleteText || 'Удалить')}</button>` : ''}<span class="sp"></span>
      <button type="button" class="btn ghost" data-close>Отмена</button>${onSubmit ? `<button type="submit" class="btn primary">${esc(submit)}</button>` : ''}</footer>`;
    f.querySelectorAll('[data-close]').forEach(b => b.onclick = () => $('#dlg').close());
    f.onsubmit = async e => {
      e.preventDefault();
      try { if ((await onSubmit(new FormData(f), f)) !== false) $('#dlg').close(); } catch (err) { toast(err.message, 'err'); }
    };
    const del = f.querySelector('[data-del]');
    if (del) del.onclick = async () => {
      if (!del.classList.contains('armed')) { del.classList.add('armed'); del.textContent = 'Точно удалить?'; return; }
      try { await onDelete(); $('#dlg').close(); } catch (err) { toast(err.message, 'err'); }
    };
    $('#dlg').showModal();
    const ty = f.querySelector('select[name=type]'), auto = f.querySelector('.ipick--auto span');
    if (ty && auto) ty.addEventListener('change', () => { auto.innerHTML = (ICON[ty.value] || ICON.point) + '<small>по типу</small>'; });
    if (onOpen) onOpen(f);
    const first = f.querySelector('.dlg__body input:not([type=color]):not([type=checkbox]), .dlg__body textarea'); if (first) first.focus();
  }
  const fld = (label, inner, hint) => `<label class="fld"><span>${label}</span>${inner}${hint ? `<small>${hint}</small>` : ''}</label>`;
  const PHOTO_HINT = 'По одной ссылке на строку. Подпись — через «|». Ссылки Google Drive вида drive.google.com/file/d/… преобразуются сами; доступ к файлу — «Все, у кого есть ссылка».';
  const sideOptions = sel => `<option value="" ${!sel ? 'selected' : ''}>Ничья</option>` + D().sides.map(s => `<option value="${esc(s.id)}" ${sel === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('');

  /* --- сценарий --- */
  function openScenarioForm(sc) {
    const isNew = !sc;
    sc = sc || { id: Store.uid(), title: '', summary: '', rules: '', photos: [] };
    const n = scGames(sc.id).length;
    openDialog({
      title: isNew ? 'Новый сценарий' : 'Сценарий: ' + sc.title,
      body: fld('Название', `<input name="title" required maxlength="80" value="${esc(sc.title)}" placeholder="Например: Поиск пилота">`) +
        fld('Коротко о сценарии', `<input name="summary" maxlength="200" value="${esc(sc.summary)}">`, 'Видно на карточке сценария в шапке сайта') +
        fld('Правила', `<textarea name="rules" rows="6">${esc(sc.rules)}</textarea>`) +
        fld('Фото', `<textarea name="photos" rows="2">${esc(photosToText(sc.photos))}</textarea>`, PHOTO_HINT),
      onSubmit: async fd => {
        const { photos, warn } = parsePhotos(fd.get('photos'));
        const data = { id: sc.id, title: fd.get('title').trim(), summary: fd.get('summary').trim(), rules: fd.get('rules').trim(), photos };
        const i = D().scenarios.findIndex(x => x.id === sc.id);
        if (i >= 0) D().scenarios[i] = data; else D().scenarios.push(data);
        await commit(isNew ? 'Сценарий создан' : 'Сценарий сохранён');
        if (isNew) selectScenario(sc.id);
        if (warn.length) toast(warn[0], 'err');
      },
      onDelete: isNew ? null : async () => {
        const d = D(); d.scenarios = d.scenarios.filter(x => x.id !== sc.id); d.games = d.games.filter(g => g.scenarioId !== sc.id);
        S.scId = ''; S.gameId = null; await commit('Сценарий удалён');
      }, deleteText: n ? `Удалить сценарий и ${n} игр` : 'Удалить сценарий'
    });
  }

  /* --- игра --- */
  const ROLE = { commander: 'Командир', fighter: 'Боец' };
  /** Галочки «кто был на игре» из состава выбранной команды. */
  function rosterChecks(teamId, present) {
    const t = D().teams.find(x => x.id === teamId);
    if (!t || !t.players.length) return '';
    return `<div class="rchk"><div class="rchk__h"><span>Кто был на игре</span><button type="button" class="link" data-allp>отметить всех</button></div>` +
      t.players.map(p => `<label><input type="checkbox" class="pr" value="${esc(p.id)}" ${present.includes(p.id) ? 'checked' : ''}><b>${esc(p.callsign || '—')}</b>${p.role ? `<small>${ROLE[p.role]}</small>` : ''}${p.rank ? `<small>${esc(p.rank)}</small>` : ''}</label>`).join('') + '</div>';
  }
  function openGameForm(g) {
    const d = D();
    if (!d.scenarios.length) { toast('Сначала создайте сценарий', 'err'); openScenarioForm(null); return; }
    const isNew = !g;
    const scId = g ? g.scenarioId : (curScenario() ? S.scId : d.scenarios[0].id);
    const last = scGames(scId).filter(x => !g || x.id !== g.id).pop();
    const lastMap = scGames(scId).filter(x => (!g || x.id !== g.id) && !isMedia(x)).pop();   // откуда переносить точки
    // новая игра наследует команды сторон из прошлой игры сценария
    // отметки «кто был» в новую игру не переносим — состав на каждой игре свой
    const inherit = last ? Object.fromEntries(Object.entries(last.sides).map(([k, v]) => [k, { teams: (v.teams || []).map(e => ({ id: e.id, players: null, present: [] })), players: null }])) : {};
    g = g || { id: Store.uid(), scenarioId: scId, title: '', date: today(), featured: false, summary: '', gather: '', result: '', photos: [], sides: inherit, points: [], arrows: [], view: 'map', media: { url: '', caption: '', link: '', linkLabel: '' } };
    const md = g.media || { url: '', caption: '', link: '', linkLabel: '' }, mediaOn = g.view === 'media', isData = md.url.startsWith('data:');
    const teamOpts = sel => `<option value="">— выберите команду —</option>` + d.teams.map(t => `<option value="${esc(t.id)}" ${sel === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
    const teamRowF = e => `<div class="strow"><select class="st-team" aria-label="Команда">${teamOpts(e.id)}</select>
        <input type="number" class="st-pl" min="0" max="999" inputmode="numeric" placeholder="чел." aria-label="Игроков в команде" value="${e.players ?? ''}">
        <button type="button" class="iconbtn" data-rmteam title="Убрать команду" aria-label="Убрать команду">✕</button>
        <div class="srow__roster">${rosterChecks(e.id, e.present || [])}</div></div>`;
    const sidesRows = d.sides.map(s => {
      const v = g.sides[s.id] || {};
      return `<div class="sblock" data-side="${esc(s.id)}" style="--c:${s.color}">
        <div class="sblock__h"><span class="srow__n"><i></i>${esc(s.name)}</span>
          <label class="sblock__tot">Всего на стороне <input type="number" name="pl_${esc(s.id)}" min="0" max="9999" inputmode="numeric" value="${v.players ?? ''}" aria-label="Всего игроков — ${esc(s.name)}"></label></div>
        <div class="strows">${(v.teams || []).map(teamRowF).join('')}</div>
        <button type="button" class="btn ghost sblock__add" data-addteam ${d.teams.length ? '' : 'disabled'}>+ команда</button></div>`;
    }).join('');
    openDialog({
      title: isNew ? 'Новая игра' : 'Игра: ' + g.title,
      body:
        fld('Сценарий', `<select name="scenarioId">${d.scenarios.map(s => `<option value="${esc(s.id)}" ${s.id === g.scenarioId ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}</select>`) +
        `<div class="row3">${fld('Название', `<input name="title" required maxlength="120" value="${esc(g.title)}">`)}${fld('Дата', `<input type="date" name="date" required value="${esc(g.date)}">`)}${fld('Начало', `<input type="time" name="time" value="${esc(g.time || '')}" placeholder="${esc(defStart())}">`, 'Для таймера вверху сайта. Пусто — ' + esc(defStart()))}</div>` +
        `<label class="check"><input type="checkbox" name="featured" ${g.featured ? 'checked' : ''}> Ближайшая игра — показать в анонсе вверху сайта</label>` +
        fld('Коротко об игре', `<input name="summary" maxlength="200" value="${esc(g.summary)}">`) +
        `<div class="fld"><span>Где проходит игра</span><div class="vpick" role="radiogroup">
          <label><input type="radio" name="view" value="map" ${mediaOn ? '' : 'checked'}><span><b>Карта полигона</b><small>точки, зоны и стрелки на карте</small></span></label>
          <label><input type="radio" name="view" value="media" ${mediaOn ? 'checked' : ''}><span><b>Проект без карты</b><small>вместо карты — гифка или картинка</small></span></label></div></div>` +
        `<div class="mediaf" ${mediaOn ? '' : 'hidden'}>` +
          `<div class="fld"><span>Гифка или картинка</span><div class="mf-row"><input name="mediaUrl" maxlength="1000" placeholder="https://… или img/schema.gif" value="${isData ? '' : esc(md.url)}" autocomplete="off">
            <label class="btn ghost mf-up">Загрузить файл<input type="file" accept="image/gif,image/png,image/jpeg,image/webp" data-mfile hidden></label></div>
            <input type="hidden" name="mediaData" value="${isData ? esc(md.url) : ''}"><div class="mf-file" ${isData ? '' : 'hidden'}><span>${isData ? 'Загружен файл, ' + Math.round(md.url.length * .75 / 1024) + ' КБ' : ''}</span><button type="button" class="link" data-mfclear>убрать</button></div>
            <div class="mf-prev"></div><small>GIF, PNG, JPG или WEBP. Ссылка на файл (в т.ч. Google Drive — доступ «Все, у кого есть ссылка»), путь к файлу в папке сайта (img/…) или загрузка с компьютера — до 1 МБ, файлы крупнее положите в папку img на GitHub.</small></div>` +
          fld('Подпись под картинкой', `<input name="mediaCaption" maxlength="200" value="${esc(md.caption)}" placeholder="Например: схема поля из тюков сена">`) +
          `<div class="row2">${fld('Ссылка на проект', `<input name="mediaLink" type="url" maxlength="500" value="${esc(md.link)}" placeholder="https://kktren.github.io/SOLOMKAv1/">`, 'Необязательно — под картинкой появится кнопка')}${fld('Текст кнопки', `<input name="mediaLinkLabel" maxlength="60" value="${esc(md.linkLabel)}" placeholder="Открыть проект">`)}</div>` +
        '</div>' +
        `<div class="fld"><span>Стороны и команды на этой игре</span><div class="srows">${sidesRows}</div><small>${d.teams.length ? 'На стороне может быть сколько угодно команд. Число игроков команды считается по галочкам состава, а если состава нет — впишите его. «Всего на стороне» можно оставить пустым — сложится само.' : 'Справочник команд пуст — добавьте команды в «⚙ Настройки → Стороны и команды».'}</small></div>` +
        fld('Сбор (время, место)', `<textarea name="gather" rows="2">${esc(g.gather)}</textarea>`) +
        fld('Итог', `<textarea name="result" rows="3">${esc(g.result)}</textarea>`) +
        fld('Фото игры', `<textarea name="photos" rows="2" placeholder="https://drive.google.com/file/d/…/view | подпись">${esc(photosToText(g.photos))}</textarea>`, PHOTO_HINT) +
        '' + (isNew && lastMap ? `<label class="check" data-mapopt ${mediaOn ? 'hidden' : ''}><input type="checkbox" name="copy" checked> Продолжить с итогов игры «${esc(lastMap.title)}» (${esc(fmtDate(lastMap.date))}): перенести точки, их зоны и владельцев</label>` : ''),
      onOpen: f => {
        // «Карта полигона» / «Проект без карты»
        const mfs = f.querySelector('.mediaf'), urlIn = f.querySelector('[name=mediaUrl]'), dataIn = f.querySelector('[name=mediaData]');
        const fileBox = f.querySelector('.mf-file'), prev = f.querySelector('.mf-prev');
        const showPrev = () => {
          const u = dataIn.value || urlIn.value.trim();
          prev.innerHTML = u && /^(https?:\/\/|img\/|data:image\/)/i.test(u) ? `<img src="${esc(mediaSrc(u))}" alt="Предпросмотр" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('small'),{textContent:'Картинка по этой ссылке не открывается'}))">` : '';
        };
        const viewSync = () => { const media = f.querySelector('[name=view]:checked').value === 'media'; mfs.hidden = !media; f.querySelectorAll('[data-mapopt]').forEach(el => { el.hidden = media; }); if (media) showPrev(); };
        f.querySelectorAll('[name=view]').forEach(r => r.addEventListener('change', viewSync));
        urlIn.addEventListener('input', () => { if (urlIn.value.trim()) { dataIn.value = ''; fileBox.hidden = true; } clearTimeout(urlIn._t); urlIn._t = setTimeout(showPrev, 400); });
        f.querySelector('[data-mfclear]').onclick = () => { dataIn.value = ''; fileBox.hidden = true; showPrev(); };
        f.querySelector('[data-mfile]').addEventListener('change', e => {
          const file = e.target.files[0]; e.target.value = ''; if (!file) return;
          if (!/^image\/(gif|png|jpeg|webp)$/.test(file.type)) { toast('Нужен файл GIF, PNG, JPG или WEBP', 'err'); return; }
          if (file.size * 4 / 3 > Store.MEDIA_MAX) { toast(`Файл ${(file.size / 1048576).toFixed(1)} МБ — больше 1 МБ. Положите его в папку img на GitHub и впишите img/${file.name}, или дайте ссылку.`, 'err'); return; }
          const rd = new FileReader();
          rd.onload = () => { dataIn.value = rd.result; urlIn.value = ''; fileBox.hidden = false; fileBox.querySelector('span').textContent = `Загружен файл: ${file.name}, ${Math.round(file.size / 1024)} КБ`; showPrev(); };
          rd.readAsDataURL(file);
        });
        viewSync();
        const sync = row => { // с составом — число считается по галочкам и поле числа прячется
          const box = row.querySelector('.srow__roster'), num = row.querySelector('.st-pl'), has = !!box.querySelector('input');
          num.hidden = has; if (has) num.value = box.querySelectorAll('input:checked').length || '';
        };
        const total = blk => { // подсказка в «Всего на стороне»: сумма по командам
          const sum = [...blk.querySelectorAll('.st-pl')].reduce((a, i) => a + (+i.value || 0), 0);
          blk.querySelector('.sblock__tot input').placeholder = sum ? 'авто: ' + sum : 'авто';
        };
        // одна команда — на одной стороне за игру: занятые в других строках пункты выключаем
        const taken = () => { const used = [...f.querySelectorAll('.st-team')].map(x => x.value).filter(Boolean);
          f.querySelectorAll('.st-team').forEach(sel => [...sel.options].forEach(o => { o.disabled = !!o.value && o.value !== sel.value && used.includes(o.value); })); };
        const all = () => { f.querySelectorAll('.strow').forEach(sync); f.querySelectorAll('.sblock').forEach(total); taken(); };
        f.addEventListener('change', e => {
          const sel = e.target.closest('.st-team');
          if (sel) { const row = sel.closest('.strow'); row.querySelector('.srow__roster').innerHTML = rosterChecks(sel.value, []); row.querySelector('.st-pl').value = ''; }
          all();
        });
        f.addEventListener('input', e => { if (e.target.closest('.st-pl')) total(e.target.closest('.sblock')); });
        f.addEventListener('click', e => {
          const add = e.target.closest('[data-addteam]');
          if (add) { const box = add.previousElementSibling; box.insertAdjacentHTML('beforeend', teamRowF({ id: '', players: null, present: [] })); all(); box.lastElementChild.querySelector('select').focus(); return; }
          const rm = e.target.closest('[data-rmteam]'); if (rm) { const blk = rm.closest('.sblock'); rm.closest('.strow').remove(); total(blk); taken(); return; }
          const ap = e.target.closest('[data-allp]');
          if (ap) { const row = ap.closest('.strow'), boxes = row.querySelectorAll('.pr'); const on = [...boxes].some(c => !c.checked); boxes.forEach(c => { c.checked = on; }); all(); }
        });
        all();
      },
      onSubmit: async fd => {
        const { photos, warn } = parsePhotos(fd.get('photos'));
        const sides = {}, form = $('#dlgForm');
        D().sides.forEach(s => {
          const blk = form.querySelector(`.sblock[data-side="${CSS.escape(s.id)}"]`); if (!blk) return;
          const teams = [...blk.querySelectorAll('.strow')].map(r => {
            const id = r.querySelector('.st-team').value, present = [...r.querySelectorAll('.pr:checked')].map(c => c.value), pl = r.querySelector('.st-pl').value;
            return id ? { id, players: present.length ? present.length : pl === '' ? null : +pl, present } : null;
          }).filter(Boolean);
          const pl = fd.get('pl_' + s.id);
          if (teams.length || pl) sides[s.id] = { teams, players: pl === '' || pl == null ? null : +pl };
        });
        const data = Object.assign({}, g, {
          scenarioId: fd.get('scenarioId'), title: fd.get('title').trim(), date: fd.get('date'), time: (fd.get('time') || '').trim(), featured: !!fd.get('featured'),
          summary: fd.get('summary').trim(), gather: fd.get('gather').trim(), result: fd.get('result').trim(), photos, sides,
          view: fd.get('view') === 'media' ? 'media' : 'map',
          media: { url: (fd.get('mediaData') || fd.get('mediaUrl') || '').trim(), caption: (fd.get('mediaCaption') || '').trim(), link: (fd.get('mediaLink') || '').trim(), linkLabel: (fd.get('mediaLinkLabel') || '').trim() }
        });
        if (data.view === 'media') {
          const u = data.media.url;
          if (!u) throw new Error('Добавьте гифку или картинку: ссылку, путь img/… или файл');
          if (!/^(https?:\/\/|img\/|data:image\/)/i.test(u)) throw new Error('Ссылка на картинку должна начинаться с https:// или img/');
          if (data.media.link && !/^https?:\/\//i.test(data.media.link)) throw new Error('Ссылка на проект должна начинаться с https://');
        }
        if (isNew && fd.get('copy') && lastMap && data.view === 'map') data.points = lastMap.points.map(p => Object.assign({}, p, { id: Store.uid(), before: p.after, after: p.after, area: p.area.map(v => v.slice()), photos: [] }));
        if (data.featured) D().games.forEach(x => { x.featured = false; });
        const i = D().games.findIndex(x => x.id === g.id);
        if (i >= 0) D().games[i] = data; else D().games.push(data);
        await commit(isNew ? 'Игра создана' : 'Игра сохранена');
        selectScenario(data.scenarioId, data.id);
        if (warn.length) toast(warn[0], 'err');
      },
      onDelete: isNew ? null : async () => { D().games = D().games.filter(x => x.id !== g.id); S.gameId = null; await commit('Игра удалена'); selectScenario(S.scId); },
      deleteText: 'Удалить игру'
    });
  }

  /* --- точка игры --- */
  function openPointForm(p, pos) {
    const g = curGame();
    if (!g) { toast('Сначала выберите или создайте игру', 'err'); return; }
    const isNew = !p;
    p = p || { id: Store.uid(), name: '', type: 'point', before: '', after: '', area: [], note: '', photos: [], x: pos.x, y: pos.y };
    const names = [...new Set(scGames(g.scenarioId).flatMap(x => x.points.map(q => q.name)))].sort((a, b) => a.localeCompare(b, 'ru'));
    const prevQ = findByName(prevGame(g), p.name);
    openDialog({
      title: isNew ? 'Новая точка' : 'Точка: ' + p.name,
      body:
        `<div class="row2">${fld('Название', `<input name="name" required maxlength="60" list="ptNames" value="${esc(p.name)}" autocomplete="off"><datalist id="ptNames">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>`, 'Одинаковое название в играх сценария = одна точка')}` +
        fld('Тип', `<select name="type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${p.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`) + '</div>' +
        `<div class="row2">${fld('Владелец до игры', `<select name="before">${sideOptions(p.before)}</select>`, prevQ ? `В прошлой игре после боя: ${esc(sideName(prevQ.after))}` : 'В прошлой игре такой точки не было')}` +
        fld('Владелец после игры', `<select name="after">${sideOptions(p.after)}</select>`, 'Для будущей игры оставьте как «до»') + '</div>' +
        fld('Значок', iconPicker(p.icon, p.type), 'Необязательно. «По типу» — стандартный значок выбранного типа.') +
        fld('Описание', `<textarea name="note" rows="3">${esc(p.note)}</textarea>`) +
        fld('Фото точки', `<textarea name="photos" rows="2" placeholder="https://drive.google.com/file/d/…/view | подпись">${esc(photosToText(p.photos))}</textarea>`, PHOTO_HINT) +
        (isNew ? '<label class="check"><input type="checkbox" name="drawArea"> Сразу нарисовать зону точки</label>' : ''),
      onSubmit: async fd => {
        const { photos, warn } = parsePhotos(fd.get('photos'));
        const data = Object.assign({}, p, { name: fd.get('name').trim(), type: fd.get('type'), icon: fd.get('icon') || '', before: fd.get('before'), after: fd.get('after'), note: fd.get('note').trim(), photos });
        const gg = curGame(); const i = gg.points.findIndex(x => x.id === p.id);
        if (i >= 0) gg.points[i] = data; else gg.points.push(data);
        S.pointId = data.id; S.placeId = null;
        await commit(isNew ? 'Точка добавлена' : 'Точка сохранена');
        if (warn.length) toast(warn[0], 'err');
        if (fd.get('drawArea')) setTimeout(() => startDraw('area', curGame().points.find(x => x.id === data.id)), 50);
      },
      onDelete: isNew ? null : async () => { const gg = curGame(); gg.points = gg.points.filter(x => x.id !== p.id); S.pointId = null; await commit('Точка удалена'); },
      deleteText: 'Удалить точку',
      onOpen: f => {
        if (!isNew) return;
        const nm = f.querySelector('[name=name]');
        nm.addEventListener('change', () => { // точка с таким названием была в прошлой игре — подставить её итог
          const q = findByName(prevGame(g), nm.value);
          if (q) { f.querySelector('[name=before]').value = q.after; f.querySelector('[name=after]').value = q.after; f.querySelector('[name=type]').value = q.type; }
        });
      }
    });
  }

  /* --- объект полигона --- */
  function openPlaceForm(p, pos) {
    const isNew = !p;
    p = p || { id: Store.uid(), name: '', type: 'building', note: '', photos: [], x: pos.x, y: pos.y };
    openDialog({
      title: isNew ? 'Новый объект полигона' : 'Объект: ' + p.name,
      body: `<div class="note">Объект полигона виден всегда — на любой игре и в режиме «Полигон». Точки конкретной игры ставятся кнопкой «+ Точка».</div>` +
        `<div class="row2">${fld('Название', `<input name="name" required maxlength="60" value="${esc(p.name)}" autocomplete="off">`)}` +
        fld('Тип', `<select name="type">${Object.entries(PLACE_TYPES).map(([k, v]) => `<option value="${k}" ${p.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`) + '</div>' +
        fld('Значок', iconPicker(p.icon, p.type), 'Необязательно. «По типу» — стандартный значок выбранного типа.') +
        fld('Описание', `<textarea name="note" rows="3">${esc(p.note)}</textarea>`) +
        fld('Фото', `<textarea name="photos" rows="2" placeholder="https://drive.google.com/file/d/…/view | подпись">${esc(photosToText(p.photos))}</textarea>`, PHOTO_HINT),
      onSubmit: async fd => {
        const { photos, warn } = parsePhotos(fd.get('photos'));
        const data = Object.assign({}, p, { name: fd.get('name').trim(), type: fd.get('type'), icon: fd.get('icon') || '', note: fd.get('note').trim(), photos });
        const i = places().findIndex(x => x.id === p.id);
        if (i >= 0) places()[i] = data; else places().push(data);
        S.placeId = data.id; S.pointId = null;
        await commit(isNew ? 'Объект добавлен' : 'Объект сохранён');
        if (warn.length) toast(warn[0], 'err');
      },
      onDelete: isNew ? null : async () => { D().places = places().filter(x => x.id !== p.id); S.placeId = null; await commit('Объект удалён'); },
      deleteText: 'Удалить объект'
    });
  }

  /* --- стороны и команды --- */
  function openSidesForm() {
    const d = D();
    const sideRow = s => `<div class="erow" data-id="${esc(s.id)}"><input type="color" value="${esc(s.color)}" aria-label="Цвет стороны"><input value="${esc(s.name)}" maxlength="40" required placeholder="Название стороны" aria-label="Название стороны"><button type="button" class="iconbtn" data-rm aria-label="Убрать">✕</button></div>`;
    const pRow = p => `<div class="prow" data-id="${esc(p.id)}"><input class="p-cs" value="${esc(p.callsign)}" maxlength="60" placeholder="Позывной" aria-label="Позывной">
        <select class="p-role" aria-label="Роль"><option value="">—</option><option value="commander" ${p.role === 'commander' ? 'selected' : ''}>Командир</option><option value="fighter" ${p.role === 'fighter' ? 'selected' : ''}>Боец</option></select>
        <input class="p-rank" value="${esc(p.rank)}" maxlength="60" placeholder="Звание" aria-label="Звание"><input class="p-phone" type="tel" value="${esc(p.phone)}" maxlength="40" placeholder="Телефон" aria-label="Телефон"><button type="button" class="iconbtn" data-rmp aria-label="Убрать игрока">✕</button></div>`;
    const teamRow = t => `<div class="trow" data-id="${esc(t.id)}"><div class="erow"><span class="t-logo-prev">${t.logo ? `<img src="${esc(photoSrc(t.logo, 120))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</span><input class="t-name" value="${esc(t.name)}" maxlength="60" required placeholder="Название команды" aria-label="Название команды"><button type="button" class="iconbtn" data-rm aria-label="Убрать команду">✕</button></div>
      <input class="t-logo" value="${esc(t.logo || '')}" maxlength="500" placeholder="Эмблема: ссылка на картинку (необязательно)" aria-label="Ссылка на эмблему команды">
      <details class="roster"><summary>Состав: <b>${(t.players || []).length}</b> чел. <small>— видно только админу</small></summary><div class="prows">${(t.players || []).map(pRow).join('')}</div><button type="button" class="btn ghost" data-addp>+ Игрок</button></details></div>`;
    openDialog({
      title: 'Стороны и команды',
      body: `<div class="fld"><span>Стороны</span><div class="erows" id="sideRows">${d.sides.map(sideRow).join('')}</div>
          <button type="button" class="btn ghost" id="addSide">+ Сторона</button><small>Цвет стороны — цвет её точек и зон на карте. Правила для всех сторон одинаковые.</small></div>
        <div class="fld"><span>Справочник команд</span><div class="erows" id="teamRows">${d.teams.map(teamRow).join('')}</div>
          <button type="button" class="btn ghost" id="addTeam">+ Команда</button>
          <label class="check"><input type="checkbox" name="showRoster" ${D().settings.showRoster ? 'checked' : ''}> Показывать гостям позывные участников игр (вкладка «Команды»). Телефоны не показываются никогда.</label><small>Команды постоянные: в каждой игре вы выбираете, какая команда играет за какую сторону.</small></div>`,
      onOpen: f => {
        f.addEventListener('click', e => {
          const b = e.target.closest('[data-rm]'); if (b) (b.closest('.trow') || b.closest('.erow')).remove();
          const rp = e.target.closest('[data-rmp]'); if (rp) rp.closest('.prow').remove();
          const ap = e.target.closest('[data-addp]'); if (ap) { const box = ap.previousElementSibling; box.insertAdjacentHTML('beforeend', pRow({ id: Store.uid(), callsign: '', role: '', rank: '', phone: '' })); box.lastElementChild.querySelector('input').focus(); }
        });
        const palette = ['#2fbf71', '#f2a33a', '#b65cff', '#18c3c9', '#ff5fa2'];
        f.querySelector('#addSide').onclick = () => { const n = f.querySelectorAll('#sideRows .erow').length; f.querySelector('#sideRows').insertAdjacentHTML('beforeend', sideRow({ id: Store.uid(), name: '', color: palette[n % palette.length] })); f.querySelector('#sideRows .erow:last-child input:not([type=color])').focus(); };
        f.querySelector('#addTeam').onclick = () => { f.querySelector('#teamRows').insertAdjacentHTML('beforeend', teamRow({ id: Store.uid(), name: '', logo: '', players: [] })); f.querySelector('#teamRows .trow:last-child .t-name').focus(); };
      },
      onSubmit: async (fd, f) => {
        const sides = [...f.querySelectorAll('#sideRows .erow')].map(r => ({ id: r.dataset.id, color: r.querySelector('[type=color]').value, name: r.querySelector('input:not([type=color])').value.trim() }));
        if (!sides.length) { toast('Нужна хотя бы одна сторона', 'err'); return false; }
        D().sides = sides;
        D().settings.showRoster = !!fd.get('showRoster');
        D().teams = [...f.querySelectorAll('#teamRows .trow')].map(r => ({ id: r.dataset.id, name: r.querySelector('.t-name').value.trim(), logo: r.querySelector('.t-logo').value.trim(),
          players: [...r.querySelectorAll('.prow')].map(p => ({ id: p.dataset.id, callsign: p.querySelector('.p-cs').value.trim(), role: p.querySelector('.p-role').value, rank: p.querySelector('.p-rank').value.trim(), phone: p.querySelector('.p-phone').value.trim() })).filter(p => p.callsign || p.rank || p.phone) }));
        await commit('Стороны и команды сохранены');
      }
    });
  }

  /* --- настройки карты: сетка, граница, стороны и команды --- */
  const linkRow = l => `<div class="erow lrow" data-drag="${esc(l.id)}" data-id="${esc(l.id)}" draggable="true"><span class="grip" title="Перетащите">⋮⋮</span>
    <select class="l-kind" aria-label="Тип ссылки">${Object.entries(SOC).map(([k, v]) => `<option value="${k}" ${l.kind === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
    <input class="l-url" value="${esc(l.url)}" placeholder="https://…" aria-label="Адрес"><input class="l-label" value="${esc(l.label)}" maxlength="60" placeholder="Подпись (необязательно)" aria-label="Подпись">
    <button type="button" class="iconbtn" data-rml aria-label="Убрать ссылку">✕</button></div>`;
  /** Галереи вверху сайта и время начала игр по умолчанию. focus — номер галереи, к которой прокрутить. */
  function openHeroForm(focus) {
    const cur = heroGals(), st = defStart();
    const gal = k => { const g = cur[k] || { title: '', tag: '', photos: [] };
      const fit = g.fit || (g.photos[0] && g.photos[0].fit) || 'cover';
      return `<section class="set" id="hgSet${k}"><h3>Фото галерея ${k + 1} (${k ? 'справа' : 'слева'})</h3>
        <div class="row2">${fld('Заголовок', `<input name="t${k}" maxlength="60" value="${esc(g.title)}">`)}${fld('Плашка на фото', `<input name="tag${k}" maxlength="60" value="${esc(g.tag || '')}" placeholder="например, Прокат снаряжения">`)}</div>
        ${fld('Фото', `<textarea name="ph${k}" rows="4" placeholder="https://drive.google.com/file/d/…/view | подпись">${esc(photosToText(g.photos))}</textarea>`, PHOTO_HINT + ' Файлы из папки сайта — как img/hero/имя.webp.')}
        <label class="check"><input type="checkbox" name="fit${k}" ${fit === 'contain' ? 'checked' : ''}> Показывать фото целиком, без обрезки краёв</label></section>`; };
    const site = D().settings.site || { title: '', logo: '' };
    let logo = site.logo || '';
    openDialog({
      title: 'Верх сайта: название, галереи, таймер',
      body: `<section class="set"><h3>Название и эмблема</h3>
          ${fld('Название полигона', `<input name="siteTitle" maxlength="80" value="${esc(site.title || C.siteTitle)}" required>`, 'Видно в шапке сайта и во вкладке браузера.')}
          <div class="fld"><span>Эмблема (картинка слева от названия)</span>
            <div class="logo-edit"><span class="logo-prev" id="logoPrev"></span>
              <div class="logo-btns"><label class="btn">Загрузить картинку…<input type="file" id="logoFile" accept="image/png,image/webp,image/svg+xml,image/gif,image/jpeg" hidden></label>
                <button type="button" class="btn ghost" id="logoDel">Убрать</button></div></div>
            <small>Лучше PNG или WebP с прозрачным фоном — фон так и останется прозрачным, без белых краёв. Картинка уменьшится до 256 точек и сохранится прямо в данных сайта.</small></div>
        </section>
        <div class="note">Фото галерей листаются сами, по клику открываются крупно. Если галерею оставить совсем пустой, она скроется у посетителей.</div>
        ${gal(0)}${gal(1)}
        <section class="set"><h3>Таймер</h3>${fld('Начало игры по умолчанию', `<input type="time" name="start" value="${esc(st)}" required>`, 'Если у самой игры время не указано (поле «Начало» в окне игры), таймер считает до этого времени в день игры.')}</section>`,
      onOpen: f => {
        const el = f.querySelector('#hgSet' + (focus || 0)); if (focus != null && el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 30);
        const prev = () => { f.querySelector('#logoPrev').innerHTML = logo ? `<img src="${esc(photoSrc(logo, 256))}" alt="Эмблема">` : '<small>нет</small>'; f.querySelector('#logoDel').hidden = !logo; };
        prev();
        f.querySelector('#logoDel').onclick = () => { logo = ''; prev(); };
        f.querySelector('#logoFile').onchange = async e => {
          const file = e.target.files[0]; if (!file) return;
          try { logo = await logoFromFile(file); prev(); } catch (err) { toast(err.message, 'err'); }
        };
      },
      onSubmit: async fd => {
        const warns = [];
        const galleries = [0, 1].map(k => { const { photos, warn } = parsePhotos(fd.get('ph' + k)); warns.push(...warn);
          return { title: fd.get('t' + k).trim(), tag: fd.get('tag' + k).trim(), fit: fd.get('fit' + k) ? 'contain' : 'cover', photos }; });
        D().settings.hero = { startTime: fd.get('start') || HC.startTime, galleries };
        D().settings.site = { title: fd.get('siteTitle').trim(), logo };
        await commit('Верх сайта сохранён');
        if (warns.length) toast(warns.join(' '), 'err');
      }
    });
  }
  /** Уменьшает картинку до 256 точек по большей стороне, сохраняя прозрачность (WebP, если браузер умеет, иначе PNG). */
  function logoFromFile(file) {
    return new Promise((res, rej) => {
      if (file.size > 8e6) return rej(new Error('Файл больше 8 МБ — возьмите картинку поменьше'));
      if (file.type === 'image/svg+xml') { // SVG — как есть, он и так лёгкий и прозрачный
        if (file.size > 150000) return rej(new Error('SVG слишком большой (больше 150 КБ)'));
        const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Не удалось прочитать файл')); return r.readAsDataURL(file);
      }
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, 256 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
        const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        let d = c.toDataURL('image/webp', 0.9); if (!d.startsWith('data:image/webp')) d = c.toDataURL('image/png');
        res(d);
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Это не похоже на картинку')); };
      img.src = url;
    });
  }
  function openSettings() {
    const g = gridCfg(), G = gridGeo(g), m = mpp(), b = D().settings.border, n = D().border.length;
    const num = (name, label, val, attrs) => fld(label, `<input type="number" name="${name}" ${attrs} value="${val}">`);
    openDialog({
      title: 'Настройки карты',
      body: `<section class="set"><h3>Сетка квадратов</h3>
          <div class="note">Сетка двигается независимо от карты. Подгоните её под реальную: задайте числа ниже или нажмите «Подогнать мышью» и тяните ручки прямо на карте.</div>
          <div class="row3">${num('cols', 'Столбцов (буквы)', g.cols, 'min="1" max="25" required')}${num('rows', 'Строк (цифры)', g.rows, 'min="1" max="50" required')}${num('angle', 'Поворот, °', (+g.angle || 0).toFixed(1), 'min="-180" max="180" step="0.1"')}</div>
          <div class="row3">${num('cw', 'Ширина клетки, м', (G.cw * m).toFixed(1), 'min="1" step="0.1" required')}${num('ch', 'Высота клетки, м', (G.ch * m).toFixed(1), 'min="1" step="0.1" required')}<label class="check sq"><input type="checkbox" name="square" ${g.square ? 'checked' : ''}> Квадратные клетки</label></div>
          <div class="row2">${num('ox', 'Сдвиг вправо от левого края, м', ((g.x || 0) * W * m).toFixed(1), 'step="0.1"')}${num('oy', 'Сдвиг вниз от верхнего края, м', ((g.y || 0) * H * m).toFixed(1), 'step="0.1"')}</div>
          <label class="check"><input type="checkbox" name="show" ${S.f.grid ? 'checked' : ''}> Показывать сетку посетителям по умолчанию</label>
          <div class="admin-actions wrap"><button type="button" class="btn" id="gFit">Подогнать мышью на карте</button><button type="button" class="btn ghost" id="gReset">Растянуть на всю карту</button></div>
        </section>
        <section class="set"><h3>Граница полигона</h3>
          <p class="hint">${n >= 3 ? `Нарисована, ${n} вершин.` : 'Пока не нарисована.'}</p>
          <div class="row2">${fld('Цвет линии', `<input type="color" name="bcolor" value="${esc(b.color)}">`)}${num('bwidth', 'Толщина', b.width, 'min="1" max="12"')}</div>
          <div class="admin-actions wrap"><button type="button" class="btn" id="bDraw">${n >= 3 ? 'Нарисовать заново' : 'Нарисовать границу'}</button>${n >= 3 ? '<button type="button" class="btn danger" id="bDel">Удалить границу</button>' : ''}</div>
        </section>
        <section class="set"><h3>Ссылки и соцсети</h3>
          <p class="hint">Значки ссылок показываются вверху сайта. Порядок — перетаскиванием за ⋮⋮.</p>
          <div class="erows" id="linkRows">${D().links.map(linkRow).join('')}</div>
          <button type="button" class="btn ghost" id="addLink">+ Ссылка</button>
          ${fld('ВКонтакте для записи на игру', `<input name="signupVk" value="${esc(D().settings.signup.vk)}" placeholder="vk.com/ваша_группа или vk.me/имя">`, 'Сюда придут заявки: кнопка «Записаться» откроет диалог ВКонтакте с этой страницей или группой.')}
        </section>
        <section class="set"><h3>Стороны и команды</h3>
          <p class="hint">Сторон: ${D().sides.length} (${D().sides.map(s => esc(s.name)).join(', ')}). Команд в справочнике: ${D().teams.length}.</p>
          <div class="admin-actions"><button type="button" class="btn" id="sidesBtn">Изменить стороны и команды…</button></div>
        </section>`,
      onOpen: f => {
        const read = () => {
          const v = k => f.querySelector(`[name=${k}]`).value;
          const cols = Math.min(25, Math.max(1, Math.round(+v('cols')) || 1)), rows = Math.min(50, Math.max(1, Math.round(+v('rows')) || 1));
          const sq = f.querySelector('[name=square]').checked, cw = Math.max(1, +v('cw') || 1);
          return { cols, rows, cw, ch: sq ? cw : Math.max(1, +v('ch') || 1), angle: +v('angle') || 0, square: sq, x: (+v('ox') || 0) / m / W, y: (+v('oy') || 0) / m / H };
        };
        f._readGrid = read;
        // живой предпросмотр сетки при вводе чисел
        f.addEventListener('input', e => { if (['cols', 'rows', 'cw', 'ch', 'angle', 'ox', 'oy', 'square'].includes(e.target.name)) { S.gridEdit = read(); buildGrid(); } });
        f.querySelector('#gFit').onclick = () => { const g2 = read(); $('#dlg').close(); startGridFit(g2); };
        f.querySelector('#gReset').onclick = () => {
          const c = +f.querySelector('[name=cols]').value || 12, r = +f.querySelector('[name=rows]').value || 12;
          const set = (k, val) => { f.querySelector(`[name=${k}]`).value = val; };
          set('ox', 0); set('oy', 0); set('angle', 0); set('cw', (W * m / c).toFixed(1)); set('ch', (H * m / r).toFixed(1));
          f.querySelector('[name=square]').checked = false; S.gridEdit = read(); buildGrid();
        };
        f.querySelector('#bDraw').onclick = () => { D().settings.border = { color: f.querySelector('[name=bcolor]').value, width: +f.querySelector('[name=bwidth]').value || 4 }; $('#dlg').close(); startDraw('border'); };
        const del = f.querySelector('#bDel'); if (del) del.onclick = async () => { D().border = []; $('#dlg').close(); await commit('Граница удалена'); };
        f.querySelector('#sidesBtn').onclick = () => { $('#dlg').close(); openSidesForm(); };
        const lr = f.querySelector('#linkRows');
        f.querySelector('#addLink').onclick = () => { lr.insertAdjacentHTML('beforeend', linkRow({ id: Store.uid(), kind: 'vk', url: '', label: '' })); enableDrag(lr, () => {}); lr.lastElementChild.querySelector('.l-url').focus(); };
        f.addEventListener('click', e => { const b = e.target.closest('[data-rml]'); if (b) b.closest('.lrow').remove(); });
        enableDrag(lr, () => {});
        $('#dlg').addEventListener('close', () => { if (S.gridEdit && !S.mode) { S.gridEdit = null; buildGrid(); } }, { once: true });
      },
      onSubmit: async (fd, f) => {
        D().settings.grid = f._readGrid(); S.gridEdit = null;
        D().settings.border = { color: fd.get('bcolor'), width: +fd.get('bwidth') || 4 };
        D().settings.signup = { vk: fd.get('signupVk').trim() };
        D().links = [...f.querySelectorAll('#linkRows .lrow')].map(r => ({ id: r.dataset.id, kind: r.querySelector('.l-kind').value, url: r.querySelector('.l-url').value.trim(), label: r.querySelector('.l-label').value.trim() })).filter(l => l.url);
        S.f.grid = !!fd.get('show'); ls.set('pm-layers', S.f);
        await commit('Настройки карты сохранены'); buildGrid(); applyLayers();
      }
    });
  }


  /* --- перетаскивание для порядка (сценарии, точки, объекты, разделы) --- */
  function enableDrag(box, onDone) {
    let dragEl = null;
    box.querySelectorAll('[data-drag]').forEach(el => {
      el.addEventListener('dragstart', e => { dragEl = el; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', el.dataset.drag); } catch (x) {} });
      el.addEventListener('dragend', () => { if (dragEl) dragEl.classList.remove('dragging'); dragEl = null; });
      el.addEventListener('dragover', e => {
        if (!dragEl || dragEl === el || dragEl.parentNode !== el.parentNode) return;
        e.preventDefault();
        const r = el.getBoundingClientRect(), horiz = getComputedStyle(box).display === 'grid' && r.width < box.clientWidth * .9;
        const after = horiz ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2;
        el.parentNode.insertBefore(dragEl, after ? el.nextSibling : el);
      });
      el.addEventListener('drop', e => { e.preventDefault(); onDone([...box.querySelectorAll('[data-drag]')].map(x => x.dataset.drag)); });
    });
  }

  /* --- копия игры --- */
  async function duplicateGame(g) {
    if (!g) return;
    const c = structuredClone(g);
    Object.assign(c, { id: Store.uid(), title: g.title + ' (копия)', featured: false });
    c.points.forEach(p => { p.id = Store.uid(); }); c.arrows.forEach(a => { a.id = Store.uid(); });
    D().games.push(c); await commit('Игра скопирована — поменяйте дату и название');
    selectScenario(c.scenarioId, c.id); openGameForm(curGame());
  }

  /* --- цвет рисунка: свой или цвет стороны --- */
  const paintField = (val) => {
    const isSide = String(val).startsWith('side:');
    return fld('Цвет', `<div class="paint"><select name="paintMode"><option value="own" ${!isSide ? 'selected' : ''}>Свой цвет</option>${D().sides.map(sd => `<option value="side:${esc(sd.id)}" ${val === 'side:' + sd.id ? 'selected' : ''}>Цвет стороны: ${esc(sd.name)}</option>`).join('')}</select>
      <input type="color" name="paintColor" value="${esc(isSide ? '#ffd166' : val)}" aria-label="Свой цвет" ${isSide ? 'disabled' : ''}></div>`);
  };
  const readPaint = fd => fd.get('paintMode') === 'own' ? fd.get('paintColor') : fd.get('paintMode');
  const bindPaint = f => { const m = f.querySelector('[name=paintMode]'), c = f.querySelector('[name=paintColor]'); m.onchange = () => { c.disabled = m.value !== 'own'; }; };
  const opacityField = v => fld('Непрозрачность', `<div class="range"><input type="range" name="opacity" min="5" max="100" step="5" value="${Math.round(v * 100)}" oninput="this.nextElementSibling.textContent=this.value+'%'"><output>${Math.round(v * 100)}%</output></div>`, 'Чем меньше, тем сильнее просвечивает карта');

  /* --- стрелка игры --- */
  function openArrowForm(a) {
    openDialog({
      title: 'Стрелка направления',
      body: `<div class="note">Стрелка относится к игре «${esc(curGame().title)}». Чтобы перерисовать — удалите её и нарисуйте заново кнопкой «➚ Стрелка».</div>` +
        paintField(a.color) + opacityField(a.opacity) + fld('Толщина', `<input type="number" name="width" min="1" max="20" value="${a.width}">`),
      onOpen: bindPaint,
      onSubmit: async fd => { const q = curGame().arrows.find(x => x.id === a.id); Object.assign(q, { color: readPaint(fd), opacity: +fd.get('opacity') / 100, width: +fd.get('width') || 5 }); await commit('Стрелка сохранена'); },
      onDelete: async () => { const g = curGame(); g.arrows = g.arrows.filter(x => x.id !== a.id); await commit('Стрелка удалена'); }, deleteText: 'Удалить стрелку'
    });
  }

  /* --- подпись полигона --- */
  function openLabelForm(l, pos) {
    const isNew = !l;
    l = l || { id: Store.uid(), x: pos.x, y: pos.y, text: '', size: 40, color: '#ffffff', opacity: 0.35 };
    openDialog({
      title: isNew ? 'Новая подпись полигона' : 'Подпись: ' + l.text,
      body: `<div class="note">Крупная подпись видна всегда, на любой игре — например «Южный сектор» или «Лес». Её можно перетаскивать по карте.</div>` +
        fld('Текст', `<input name="text" required maxlength="80" value="${esc(l.text)}">`) +
        `<div class="row2">${fld('Размер', `<input type="number" name="size" min="10" max="200" value="${l.size}">`, 'Размер текста в пикселях')}${opacityField(l.opacity)}</div>` + paintField(l.color) +
        `<label class="check"><input type="checkbox" name="scale" ${l.scale ? 'checked' : ''}> Увеличивать вместе с картой при приближении</label>`,
      onOpen: bindPaint,
      onSubmit: async fd => {
        const data = Object.assign({}, l, { text: fd.get('text').trim(), size: +fd.get('size') || 40, color: readPaint(fd), opacity: +fd.get('opacity') / 100, scale: !!fd.get('scale') });
        const i = D().labels.findIndex(x => x.id === l.id); if (i >= 0) D().labels[i] = data; else D().labels.push(data);
        S.f.mapLabels = true; await commit(isNew ? 'Подпись добавлена' : 'Подпись сохранена');
      },
      onDelete: isNew ? null : async () => { D().labels = D().labels.filter(x => x.id !== l.id); await commit('Подпись удалена'); }, deleteText: 'Удалить подпись'
    });
  }

  /* --- разделы для игроков внизу сайта --- */
  function openInfoForm() {
    const row = s => `<div class="irow" data-drag="${esc(s.id)}" data-id="${esc(s.id)}" draggable="true">
      <div class="irow__h"><span class="grip" title="Перетащите">⋮⋮</span><input class="i-title" value="${esc(s.title)}" maxlength="120" required placeholder="Заголовок, например «Прокат»" aria-label="Заголовок раздела"><button type="button" class="iconbtn" data-rm aria-label="Удалить раздел">✕</button></div>
      <textarea class="i-body" rows="5" placeholder="Текст раздела. ## Заголовок · - пункт · 1. пункт · | таблица | ячейки | · **жирный** · [ссылка](https://…)" title="## Заголовок, - пункт списка, 1. нумерованный пункт, | ячейка | ячейка | — строка таблицы (первая строка — шапка), **жирный**, [текст](https://ссылка)" aria-label="Текст раздела">${esc(s.body)}</textarea>
      <textarea class="i-photos" rows="2" placeholder="Фото: по одной ссылке на строку | подпись" aria-label="Фото раздела">${esc(photosToText(s.photos))}</textarea></div>`;
    const presets = ['Правила полигона', 'Снаряжение', 'Прокат', 'Как добраться'];
    openDialog({
      title: 'Разделы для игроков',
      body: `<div class="note">Разделы видны всем внизу сайта и раскрываются по клику. Порядок меняется перетаскиванием за ⋮⋮. В тексте можно ставить ссылки: просто адрес <b>https://…</b> или <b>[текст](https://…)</b>.</div>
        <div class="irows" id="infoRows">${D().info.map(row).join('')}</div>
        <div class="admin-actions wrap"><button type="button" class="btn" id="addInfo">+ Раздел</button>${presets.map(p => `<button type="button" class="btn ghost" data-preset="${esc(p)}">+ ${esc(p)}</button>`).join('')}</div>`,
      onOpen: f => {
        const box = f.querySelector('#infoRows');
        const add = title => { box.insertAdjacentHTML('beforeend', row({ id: Store.uid(), title, body: '', photos: [] })); enableDrag(box, () => {}); box.lastElementChild.querySelector(title ? '.i-body' : '.i-title').focus(); };
        f.querySelector('#addInfo').onclick = () => add('');
        f.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => add(b.dataset.preset));
        f.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) b.closest('.irow').remove(); });
        enableDrag(box, () => {});
      },
      onSubmit: async (fd, f) => {
        D().info = [...f.querySelectorAll('#infoRows .irow')].map(r => ({ id: r.dataset.id, title: r.querySelector('.i-title').value.trim(), body: r.querySelector('.i-body').value, photos: parsePhotos(r.querySelector('.i-photos').value).photos }));
        await commit('Разделы сохранены');
      }
    });
  }

  /* --- запись на игру: заявка уходит личным сообщением ВКонтакте --- */
  function vkChatUrl(raw) {
    const v = String(raw || '').trim(); if (!v) return '';
    const m = v.match(/(?:https?:\/\/)?(?:m\.)?(?:vk\.com|vk\.ru|vk\.me)\/(?:write)?([\w.-]+)/i);
    if (m) return 'https://vk.me/' + m[1];
    return /^[\w.-]+$/.test(v) ? 'https://vk.me/' + v : v;
  }
  function openSignup(g) {
    if (!g) return;
    const vk = vkChatUrl(D().settings.signup.vk), sc = scById(g.scenarioId);
    if (!vk) { toast(store.canWrite() ? 'Укажите ссылку ВКонтакте для записи: ⚙ Настройки → Ссылки и соцсети' : 'Запись пока не настроена — напишите организаторам', 'err'); return; }
    const teams = Object.keys(g.sides).filter(id => sideById(id)).flatMap(id => { const l = sideEntries(g.sides[id]); return l.length ? l.map(e => `${e.t.name} (${sideName(id)})`) : [sideName(id)]; });
    openDialog({
      title: 'Запись на игру', submit: 'Записаться',
      body: `<div class="note"><b>${esc(g.title)}</b>${sc ? ` · ${esc(sc.title)}` : ''} · ${esc(fmtDate(g.date))}<br>После нажатия «Записаться» откроется ВКонтакте. Текст заявки будет скопирован — вставьте его в сообщение и отправьте.</div>` +
        `<div class="row2">${fld('Ваше имя или позывной', '<input name="name" required maxlength="60" autocomplete="name">')}${fld('Сколько человек', '<input type="number" name="count" min="1" max="50" value="1" required inputmode="numeric">')}</div>` +
        `<div class="row2">${fld('Дата игры', `<input type="date" name="date" required value="${esc(g.date)}">`)}${teams.length ? fld('Команда / сторона', `<select name="team"><option value="">Без разницы</option>${teams.map(t => `<option>${esc(t)}</option>`).join('')}</select>`) : '<span></span>'}</div>` +
        fld('Нужен прокат?', '<select name="rent"><option value="">Нет, своё снаряжение</option><option>Да, нужен прокат</option><option>Частично, уточню</option></select>') +
        fld('Комментарий', '<textarea name="comment" rows="3" maxlength="500" placeholder="Опыт игры, вопросы организаторам…"></textarea>') +
        `<div class="fld" id="msgBox" hidden><span>Текст заявки</span><textarea id="msgText" rows="6" readonly></textarea><small>Если ВКонтакте не открылся или текст не вставился — скопируйте его отсюда. Ссылка: <a href="${esc(vk)}" target="_blank" rel="noopener">${esc(vk.replace('https://', ''))}</a></small></div>`,
      onSubmit: async (fd, f) => {
        const clean = v => String(v || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
        const lines = [`Заявка на игру «${g.title}»${sc ? ` (${sc.title})` : ''}`, `Дата: ${fmtDate(fd.get('date'))}`, `Имя: ${clean(fd.get('name'))}`, `Человек: ${Math.max(1, +fd.get('count') || 1)}`];
        if (fd.get('team')) lines.push(`Сторона: ${clean(fd.get('team'))}`);
        if (fd.get('rent')) lines.push(`Прокат: ${clean(fd.get('rent'))}`);
        if (clean(fd.get('comment'))) lines.push(`Комментарий: ${String(fd.get('comment')).trim().slice(0, 500)}`);
        const text = lines.join('\n');
        const box = f.querySelector('#msgBox'), ta = f.querySelector('#msgText'); box.hidden = false; ta.value = text;
        let copied = false;
        try { await navigator.clipboard.writeText(text); copied = true; } catch (e) { ta.select(); try { copied = document.execCommand('copy'); } catch (x) {} }
        const a = document.createElement('a'); a.href = vk; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
        toast(copied ? 'Текст заявки скопирован — вставьте его в сообщение ВКонтакте' : 'Скопируйте текст заявки из окна и отправьте во ВКонтакте');
        return false; // окно остаётся открытым: текст заявки виден на случай, если вставка не сработала
      }
    });
  }

  /* --- проверка перед публикацией --- */
  function collectIssues() {
    const d = D(), out = [];
    const add = (lvl, txt) => out.push({ lvl, txt });
    if (!d.scenarios.length) add('warn', 'Нет ни одного сценария.');
    d.scenarios.forEach(sc => {
      if (!sc.rules) add('warn', `Сценарий «${sc.title}»: правила не заполнены.`);
      if (!sc.summary) add('info', `Сценарий «${sc.title}»: нет короткого описания для карточки.`);
      if (!scGames(sc.id).length) add('info', `Сценарий «${sc.title}»: нет игр.`);
    });
    d.games.forEach(g => {
      const n = `«${g.title}» (${fmtDate(g.date)})`;
      if (!g.date) add('err', `Игра «${g.title}»: не указана дата.`);
      if (isMedia(g)) { if (!g.media.url) add('err', `Игра ${n}: игра без карты, но гифка или картинка не добавлена.`); }
      else if (!g.points.length) add(isFuture(g) ? 'warn' : 'err', `Игра ${n}: нет точек на карте.`);
      if (!Object.keys(g.sides).length) add('warn', `Игра ${n}: не назначены команды сторонам.`);
      if (isFuture(g) && !g.gather) add('warn', `Игра ${n}: не указан сбор (время и место).`);
      if (g.featured && !isFuture(g)) add('info', `Игра ${n} уже прошла — отметка «ближайшая» будет снята при скачивании.`);
      const names = g.points.map(p => norm(p.name)); names.forEach((x, i) => { if (names.indexOf(x) !== i) add('err', `Игра ${n}: две точки с названием «${g.points[i].name}».`); });
      if (/тест/i.test(g.title + g.summary)) add('warn', `Игра ${n}: похоже на тестовые данные.`);
    });
    if (!featuredGame()) add('info', 'Нет будущей игры — анонс вверху сайта будет пустым.');
    if (d.border.length < 3) add('info', 'Граница полигона не нарисована.');
    if (!d.settings.signup.vk) add('warn', 'Не указана ссылка ВКонтакте для записи на игру — кнопка «Записаться» не сработает.');
    if (!d.info.length) add('info', 'Нет разделов для игроков внизу сайта.');
    d.info.forEach(s => { if (!s.body.trim() && !s.photos.length) add('warn', `Раздел «${s.title}» пустой.`); });
    return out;
  }
  function showIssues(forExport) {
    const list = collectIssues(), order = { err: 0, warn: 1, info: 2 };
    list.sort((a, b) => order[a.lvl] - order[b.lvl]);
    if (forExport && !list.some(x => x.lvl !== 'info')) { doExport(); return; }
    const lbl = { err: 'Ошибка', warn: 'Внимание', info: 'Совет' };
    openDialog({
      title: 'Проверка перед публикацией', submit: forExport ? 'Скачать всё равно' : 'Скачать games.json',
      body: list.length ? `<ul class="issues">${list.map(x => `<li class="is-${x.lvl}"><b>${lbl[x.lvl]}</b>${esc(x.txt)}</li>`).join('')}</ul>` : '<div class="note">Замечаний нет — можно публиковать.</div>',
      onSubmit: async () => { doExport(); }
    });
  }

  /* --- режимы кликов по карте: поставить точку/объект, нарисовать зону/границу --- */
  function startPick(kind) {
    if (kind === 'point' && !curGame()) { toast('Сначала выберите или создайте игру', 'err'); return; }
    stopMode();
    S.mode = { kind };
    $('#pickText').textContent = kind === 'place' ? 'Нажмите на карту, чтобы поставить объект полигона' : kind === 'label' ? 'Нажмите на карту, где будет центр подписи' : 'Нажмите на карту, чтобы поставить точку игры';
    $('#pickUndo').hidden = $('#pickDone').hidden = true;
    $({ place: '#admAddPlace', label: '#admLabel' }[kind] || '#admAddPoint').classList.add('on');
    $('#map').classList.add('picking'); $('#pickhint').hidden = false;
  }
  function startDraw(kind, point) {
    stopMode();
    S.mode = { kind, pts: [], pointId: point && point.id };
    $('#pickText').textContent = kind === 'border' ? 'Граница: кликайте по краю полигона. Замкнуть — клик по первой вершине или «Готово»'
      : kind === 'arrow' ? 'Стрелка: кликните начало, затем изгибы и конец (остриё будет в последней точке). Завершить — «Готово» или повторный клик'
      : `Зона «${point.name}»: кликайте вокруг точки. Замкнуть — клик по первой вершине или «Готово»`;
    if (kind === 'arrow') $('#admArrow').classList.add('on');
    $('#pickUndo').hidden = $('#pickDone').hidden = false;
    $('#map').classList.add('picking'); $('#pickhint').hidden = false;
    renderMap();
  }
  function stopMode() {
    const wasGrid = S.mode && S.mode.kind === 'grid';
    S.mode = null; drawLayer.clearLayers();
    if (wasGrid) { S.gridEdit = null; buildGrid(); }
    $('#map').classList.remove('picking'); $('#pickhint').hidden = true;
    ['#admAddPoint', '#admAddPlace', '#admOwner', '#admArrow', '#admLabel'].forEach(id => $(id).classList.remove('on'));
  }
  function drawColor() { const m = S.mode; if (!m) return '#fff'; if (m.kind === 'arrow') return '#ffd166'; if (m.kind === 'border') return D().settings.border.color; const p = curGame()?.points.find(x => x.id === m.pointId); return p ? sideColor(owner(p)) : '#fff'; }
  function drawPreview(cursor) {
    const m = S.mode; drawLayer.clearLayers(); if (!m || !m.pts) return;
    const c = drawColor(), pts = cursor ? m.pts.concat([cursor]) : m.pts;
    if (pts.length > 1) L.polyline(polyLL(pts), { pane: 'draw', color: c, weight: 3, dashArray: '6 5', interactive: false }).addTo(drawLayer);
    m.pts.forEach((v, i) => L.circleMarker(toLL(v[0], v[1]), { pane: 'draw', radius: i === 0 ? 7 : 4, color: '#000', weight: 1, fillColor: i === 0 ? '#fff' : c, fillOpacity: 1, interactive: false }).addTo(drawLayer));
  }
  function modeClick({ x, y }) {
    const m = S.mode;
    if (m.kind === 'grid') return;
    if (m.kind === 'owner') return;
    if (m.kind === 'label') { stopMode(); return openLabelForm(null, { x, y }); }
    if (m.kind === 'point' || m.kind === 'place') { stopMode(); return m.kind === 'place' ? openPlaceForm(null, { x, y }) : openPointForm(null, { x, y }); }
    if (m.kind === 'arrow' && m.pts.length >= 2) { // двойной клик по последней вершине завершает стрелку
      const a = map.latLngToContainerPoint(toLL(...m.pts[m.pts.length - 1])), b = map.latLngToContainerPoint(toLL(x, y));
      if (a.distanceTo(b) < 10) return finishDraw();
    }
    if (m.kind !== 'arrow' && m.pts.length >= 3) { // клик рядом с первой вершиной замыкает фигуру
      const a = map.latLngToContainerPoint(toLL(m.pts[0][0], m.pts[0][1])), b = map.latLngToContainerPoint(toLL(x, y));
      if (a.distanceTo(b) < 14) return finishDraw();
    }
    m.pts.push([+x.toFixed(5), +y.toFixed(5)]); drawPreview();
  }
  async function finishDraw() {
    const m = S.mode; if (!m || !m.pts) return;
    const need = m.kind === 'arrow' ? 2 : 3;
    if (m.pts.length < need) { toast(`Нужно хотя бы ${need} вершины`, 'err'); return; }
    const pts = m.pts; stopMode();
    if (m.kind === 'arrow') { const a = { id: Store.uid(), pts, color: '#ffd166', opacity: 0.85, width: 5 }; curGame().arrows.push(a); await commit('Стрелка добавлена'); openArrowForm(curGame().arrows.find(x => x.id === a.id)); return; }
    if (m.kind === 'border') { D().border = pts; S.f.border = true; await commit('Граница полигона сохранена'); }
    else { const p = curGame()?.points.find(q => q.id === m.pointId); if (p) { p.area = pts; await commit('Зона точки сохранена'); } }
  }
  $('#pickCancel').onclick = () => { stopMode(); renderMap(); };
  $('#pickDone').onclick = () => S.mode && S.mode.kind === 'grid' ? finishGridFit() : S.mode && S.mode.kind === 'owner' ? (stopMode(), renderMap()) : finishDraw();
  $('#pickUndo').onclick = () => { if (S.mode && S.mode.pts) { S.mode.pts.pop(); drawPreview(); } };

  /* --- файл --- */
  function download(name, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function doExport() {
    D().games.forEach(g => { if (g.featured && !isFuture(g)) g.featured = false; }); // прошедшие игры не держим в анонсе
    download('games.json', JSON.stringify(store.exportData(), null, 2));
  }
  const exportJson = () => store.mode === 'supabase' ? doExport() : showIssues(true); // в режиме базы это просто резервная копия

  function updateAdminUi() {
    const on = store.canWrite();
    $('#adminbar').hidden = !on;
    document.body.classList.toggle('is-admin', on);
    $('#btnLogin').classList.toggle('on', on);
    $('#btnLogin').hidden = !(on || wantsAdmin());
    $('#btnLogin').title = on ? 'Режим админа включён' : 'Вход для админа';
    $('#admEditGame').disabled = !curGame();
    const noMap = isMedia(curGame());   // в игре без карты рисовать по карте нечего
    $('#admAddPoint').disabled = $('#admOwner').disabled = $('#admArrow').disabled = !curGame() || noMap;
    $('#admAddPlace').disabled = $('#admLabel').disabled = noMap;
    ['#admAddPoint', '#admOwner', '#admArrow', '#admAddPlace', '#admLabel'].forEach(k => { const b = $(k); if (b.dataset.t == null) b.dataset.t = b.title || ''; b.title = noMap ? 'Игра без карты — переключите её на карту в «Изменить игру»' : b.dataset.t; });
    $('#admEditScenario').disabled = !curScenario();
    $('#draftbar').hidden = !(on && store.hasDraft());
    $('#admDiscard').hidden = store.mode === 'supabase';
    $('#admPass').textContent = store.mode === 'supabase' ? 'Сменить мой пароль…' : 'Сменить пароль…';
    $('#admExport').textContent = store.mode === 'supabase' ? 'Скачать копию (games.json)' : 'Скачать games.json';
    $('#admImport').textContent = store.mode === 'supabase' ? 'Загрузить из games.json…' : 'Загрузить games.json…';
  }
  /* ---------- вход: значок виден только по адресу с ?admin, вход по паролю ---------- */
  const PASS_H = String(C.adminPasswordHash || '').trim().toLowerCase();
  const adminToken = () => PASS_H || true;          // что запоминаем в браузере после входа
  const wantsAdmin = () => new URLSearchParams(location.search).has('admin') || /(^|[#&])admin\b/.test(location.hash);
  async function sha256(t) {
    if (!(window.crypto && crypto.subtle)) throw new Error('Вход по паролю работает только по https или на localhost');
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  function openLogin() {
    if (store.canWrite()) { toast('Вы уже в режиме админа'); return; }
    if (store.mode === 'supabase') return openLoginSb();
    openDialog({
      title: 'Режим редактирования', submit: 'Войти',
      body: (PASS_H ? fld('Пароль', '<input type="password" name="pass" required autocomplete="current-password" autofocus>') : '') + `<div class="note">Сайт работает с файлом <b>games.json</b>. Изменения сохраняются <b>только в этом браузере</b>. Чтобы их увидели все, нажмите «Скачать games.json» и загрузите файл на GitHub в папку <b>data</b> вместо старого (Add file → Upload files → Commit changes).<br><br>Посетители видят только опубликованный файл. Изменить сайт может только тот, у кого есть доступ к вашему аккаунту GitHub.</div>`,
      onSubmit: async fd => {
        if (PASS_H && await sha256(fd.get('pass') || '') !== PASS_H) { toast('Неверный пароль', 'err'); return false; }
        await store.signIn(); ls.set('pm-admin', adminToken()); await reload();
      }
    });
  }
  /** Вход через Supabase: у каждого админа свой email и пароль, правки сразу видны всем. */
  function openLoginSb() {
    openDialog({
      title: 'Вход для админа', submit: 'Войти',
      body: fld('Email', '<input type="email" name="email" required autocomplete="username" autofocus>') + fld('Пароль', '<input type="password" name="pass" required autocomplete="current-password">') +
        `<div class="note">Данные хранятся в общей базе: всё, что вы сохраните, <b>сразу видят все</b> посетители и другие админы. Если двое правят одновременно, сайт не даст затереть чужие изменения — предупредит и загрузит свежую версию.</div>`,
      onSubmit: async fd => {
        try { await store.signIn(fd.get('email'), fd.get('pass')); }
        catch (e) { toast(/invalid|credentials/i.test(e.message) ? 'Неверный email или пароль' : e.message, 'err'); return false; }
        await afterSbLogin();
      }
    });
  }
  async function afterSbLogin() {
    await reload();
    if (store.isEmpty()) { // первая настройка: переносим data/games.json в базу
      try { await store.save(); refresh(); toast('База была пустой — данные из games.json перенесены в неё'); } catch (e) { toast('Не удалось перенести данные в базу: ' + e.message, 'err'); }
    } else { const m = store.meta(); toast(`Вы вошли как ${store.who()}${m.by ? `. Последнее изменение: ${m.by}, ${new Date(m.at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}`); }
  }
  function openPassSb() {
    openDialog({
      title: 'Сменить мой пароль', submit: 'Сменить',
      body: `<p class="hint">Аккаунт: <b>${esc(store.who())}</b></p>` + fld('Новый пароль', '<input type="password" name="p1" required minlength="8" autocomplete="new-password">') + fld('Ещё раз', '<input type="password" name="p2" required minlength="8" autocomplete="new-password">'),
      onSubmit: async fd => {
        if (fd.get('p1') !== fd.get('p2')) { toast('Пароли не совпадают', 'err'); return false; }
        await store.changePassword(fd.get('p1')); toast('Пароль изменён');
      }
    });
  }
  function openPassForm() {
    if (store.mode === 'supabase') return openPassSb();
    openDialog({
      title: 'Сменить пароль админа', submit: 'Получить строку',
      body: fld('Новый пароль', '<input type="password" name="p1" required minlength="6" autocomplete="new-password">') + fld('Ещё раз', '<input type="password" name="p2" required minlength="6" autocomplete="new-password">') +
        '<div class="fld" id="passOut" hidden><span>Вставьте эту строку в js/config.js вместо старой adminPasswordHash и залейте файл на GitHub</span><textarea rows="3" readonly></textarea></div>',
      onSubmit: async (fd, f) => {
        if (fd.get('p1') !== fd.get('p2')) { toast('Пароли не совпадают', 'err'); return false; }
        const box = f.querySelector('#passOut'), ta = box.querySelector('textarea');
        ta.value = `adminPasswordHash: '${await sha256(fd.get('p1'))}',`; box.hidden = false; ta.select();
        try { await navigator.clipboard.writeText(ta.value); toast('Строка скопирована'); } catch (e) {}
        return false;
      }
    });
  }
  $('#btnLogin').onclick = openLogin;
  $('#admNewScenario').onclick = () => openScenarioForm(null);
  $('#admNewGame').onclick = () => openGameForm(null);
  $('#admAddPoint').onclick = () => S.mode ? stopMode() : startPick('point');
  $('#admAddPlace').onclick = () => S.mode ? stopMode() : startPick('place');
  $('#admLabel').onclick = () => S.mode ? stopMode() : startPick('label');
  $('#admArrow').onclick = () => { if (S.mode) return stopMode(); if (!curGame()) return toast('Сначала выберите игру', 'err'); startDraw('arrow'); };
  $('#admOwner').onclick = () => {
    if (S.mode) { stopMode(); renderMap(); return; }
    if (!curGame()) return toast('Сначала выберите игру', 'err');
    S.mode = { kind: 'owner' }; $('#admOwner').classList.add('on');
    $('#pickText').textContent = `Кликайте по точкам: владелец «${S.phase === 'before' ? 'до игры' : 'после игры'}» меняется по кругу. Переключатель «До/После» внизу карты выбирает, что меняете.`;
    $('#pickUndo').hidden = true; $('#pickDone').hidden = false; $('#pickhint').hidden = false; renderMap();
  };
  const menu = $('#admMenu');
  const closeMenu = () => { menu.hidden = true; $('#admMore').setAttribute('aria-expanded', false); menu.querySelectorAll('.armed').forEach(b => { b.classList.remove('armed'); b.textContent = b.dataset.t; }); };
  $('#admMore').onclick = e => { e.stopPropagation(); const open = menu.hidden; closeMenu(); menu.hidden = !open; $('#admMore').setAttribute('aria-expanded', open); };
  document.addEventListener('click', e => { if (!e.target.closest('#adminbar')) closeMenu(); });
  menu.querySelectorAll('.danger').forEach(b => b.dataset.t = b.textContent);
  const mi = (id, fn) => { $(id).onclick = () => { closeMenu(); fn(); }; };
  mi('#admEditScenario', () => curScenario() && openScenarioForm(curScenario()));
  mi('#admEditGame', () => curGame() && openGameForm(curGame()));
  $('#admSettings').onclick = () => { closeMenu(); openSettings(); };
  $('#admHero').onclick = () => { closeMenu(); openHeroForm(null); };
  $('#admPass').onclick = () => { closeMenu(); openPassForm(); };
  mi('#admExport', exportJson);
  mi('#admCheck', () => showIssues(false));
  $('#draftDownload').onclick = exportJson;
  mi('#admImport', () => $('#importFile').click());
  $('#importFile').onchange = async e => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.games)) throw new Error('В файле нет списка games');
      await store.replace(data); buildGrid(); selectScenario(scById(S.scId) ? S.scId : ''); toast(`Загружено игр: ${D().games.length}`);
    } catch (err) { toast('Не удалось загрузить: ' + err.message, 'err'); }
  };
  $('#admDiscard').onclick = () => {
    const b = $('#admDiscard');
    if (!b.classList.contains('armed')) { b.classList.add('armed'); b.textContent = 'Точно? Нажмите ещё раз'; return; }
    closeMenu(); store.discardDraft(); buildGrid(); selectScenario(scById(S.scId) ? S.scId : ''); toast('Черновик сброшен');
  };
  $('#admLogout').onclick = async () => { closeMenu(); stopMode(); await store.signOut(); ls.set('pm-admin', false); await reload(); toast('Вы вышли из режима админа'); };

  document.addEventListener('keydown', e => {
    if (!$('#lightbox').hidden) { if (e.key === 'Escape') lbClose(); else if (e.key === 'ArrowLeft') lbStep(-1); else if (e.key === 'ArrowRight') lbStep(1); return; }
    if ($('#dlg').open) return;
    if (e.key === 'Escape') { if (S.mode) { stopMode(); renderMap(); } else if (S.pointId || S.placeId) closeSub(); }
    if (S.mode && S.mode.kind === 'grid' && e.key === 'Enter') finishGridFit();
    if (S.mode && S.mode.pts) {
      if (e.key === 'Enter') finishDraw();
      if (e.key === 'Backspace' || (e.key === 'z' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); S.mode.pts.pop(); drawPreview(); }
    }
  });

  /* ================================================================
     ЗАПУСК
     ================================================================ */
  async function reload() {
    await store.load();
    if (S.scId && !scById(S.scId)) S.scId = '';
    if (!curGame()) S.gameId = (defaultGame(S.scId) || {}).id || null;
    buildGrid(); refresh();
  }

  try {
    $('#siteTitle').textContent = C.siteTitle;   // до загрузки данных; потом renderBrand() возьмёт название из админки
    document.title = C.siteTitle;
    setNight(S.night);
    setFiltersOpen(ls.get('pm-filters-open', !isMobile()));
    store = await Store.create(C);
    await initMap();
    if (store.mode === 'supabase') await store.signIn(); // вход, сохранённый в этом браузере
    else if (ls.get('pm-admin', false) === adminToken()) await store.signIn(); else ls.set('pm-admin', false); // сменили пароль — старый вход недействителен
    await store.load();
    await loadRelief();
    buildGrid();
    const hp = new URLSearchParams(location.hash.slice(1));
    const hs = hp.get('s'), hg = hp.get('g'), hpnt = hp.get('p'), hpl = hp.get('o');
    if (hs && scById(hs)) S.scId = hs;
    else { const f = featuredGame(); S.scId = f ? f.scenarioId : (D().scenarios[0]?.id || ''); }
    const g = hg && D().games.find(x => x.id === hg && x.scenarioId === S.scId);
    selectScenario(S.scId, g ? g.id : null);
    if (hpnt && curGame()?.points.some(p => p.id === hpnt)) { S.pointId = hpnt; refresh(); }
    if (hpl && places().some(p => p.id === hpl)) { S.placeId = hpl; refresh(); }
    if (hp.get('t') === 'tour' && S.scId) { S.tab = 'tour'; if (hp.get('tr')) S.tourId = hp.get('tr'); refresh(); }
    if (wantsAdmin() && !store.canWrite()) openLogin();
    else if (store.mode === 'supabase' && store.canWrite() && store.isEmpty()) await afterSbLogin();
    // другой админ мог сохранить свою версию, пока вкладка была в фоне — подтягиваем
    if (store.mode === 'supabase') addEventListener('focus', async () => {
      if (!store.canWrite() || $('#dlg').open || S.mode) return;
      try { const r = await store.remoteVersion(); if (r && r.version > store.meta().version) { await reload(); toast(`Данные обновил ${r.updated_by || 'другой админ'} — показана свежая версия`); } } catch (e) {}
    });
  } catch (e) {
    console.error(e);
    $('#panelBody').innerHTML = `<div class="empty" style="color:var(--enemy)">Ошибка: ${esc(e.message)}</div>`;
  }
})();
