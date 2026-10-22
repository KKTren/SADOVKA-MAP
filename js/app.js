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
  /** Подпись клетки: свои буквы/цифры из настроек сетки (в любом порядке), иначе А Б В… и 1 2 3… */
  const colName = (i, g = gridCfg()) => (g.colLabels && g.colLabels[i]) || COLS[i] || '?';
  const rowName = (j, g = gridCfg()) => (g.rowLabels && g.rowLabels[j]) || String(j + 1);
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
  const pxLL = ([px, py]) => toLL(px / W, py / H);
  const llPx = ll => { const [x, y] = fromLLraw(ll); return [x * W, y * H]; };
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
    return { sq: colName(cx) + rowName(cy), snail: SNAIL[sy][sx] };
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
    // открытое окно закрывает всплывашку — показываем сообщение и внутри окна
    const dlg = $('#dlg');
    if (dlg && dlg.open) { const f = $('#dlgForm'), foot = f && f.querySelector('.dlg__foot'); if (!foot) return;
      let m = f.querySelector('.dlg__msg'); if (!m) { m = document.createElement('div'); foot.before(m); }
      m.className = 'dlg__msg' + (kind === 'err' ? ' err' : ''); m.textContent = msg; m.hidden = false;
      clearTimeout(m._t); m._t = setTimeout(() => { m.hidden = true; }, kind === 'err' ? 12000 : 5000); }
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
    const bounds = imgBounds();
    const Masked = L.TileLayer.extend({
      createTile(c, done) {
        const lv = idx.levels[c.z];
        const ok = lv && c.x >= 0 && c.y >= 0 && c.x < lv.cols && c.y < lv.rows && lv.mask[c.y * lv.cols + c.x] === '1';
        if (!ok) { const d = document.createElement('div'); setTimeout(() => done(null, d), 0); return d; }
        return L.TileLayer.prototype.createTile.call(this, c, done);
      }
    });
    const tOpt = () => ({ tileSize: idx.tileSize, minNativeZoom: 0, maxNativeZoom: NZ, minZoom: 0, maxZoom: Z + 1, noWrap: true, bounds: imgBounds(), keepBuffer: 3, className: 'base-tiles' });
    /* Повёрнутая подложка: каждую плитку собираем на холсте из 1–4 исходных плиток. */
    const Rotated = L.GridLayer.extend({
      createTile(c, done) {
        const t = idx.tileSize, k = Math.pow(2, c.z - Z), Wz = W * k, Hz = H * k, lv = idx.levels[c.z];
        const cv = document.createElement('canvas'); cv.width = cv.height = t;
        const ox = c.x * t, oy = c.y * t, WRz = ROT % 2 ? Hz : Wz, HRz = ROT % 2 ? Wz : Hz;
        if (!lv || ox >= WRz || oy >= HRz || ox < 0 || oy < 0) { setTimeout(() => done(null, cv), 0); return cv; }
        const ctx = cv.getContext('2d');
        ctx.setTransform(...(ROT === 1 ? [0, 1, -1, 0, Hz - ox, -oy] : ROT === 2 ? [-1, 0, 0, -1, Wz - ox, Hz - oy] : [0, -1, 1, 0, -ox, Wz - oy]));
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        [[ox, oy], [ox + t, oy], [ox, oy + t], [ox + t, oy + t]].forEach(([a, b]) => { const [x, y] = unrotN(a / WRz, b / HRz); x0 = Math.min(x0, x * Wz); x1 = Math.max(x1, x * Wz); y0 = Math.min(y0, y * Hz); y1 = Math.max(y1, y * Hz); });
        const list = [];
        for (let tx = Math.max(0, Math.floor(x0 / t)); tx <= Math.min(lv.cols - 1, Math.floor((x1 - .01) / t)); tx++)
          for (let ty = Math.max(0, Math.floor(y0 / t)); ty <= Math.min(lv.rows - 1, Math.floor((y1 - .01) / t)); ty++)
            if (lv.mask[ty * lv.cols + tx] === '1') list.push([tx, ty]);
        if (!list.length) { setTimeout(() => done(null, cv), 0); return cv; }
        let left = list.length; const fin = () => { if (!--left) done(null, cv); };
        list.forEach(([tx, ty]) => { const im = new Image(); im.onload = () => { ctx.drawImage(im, tx * t, ty * t); fin(); }; im.onerror = fin; im.src = L.Util.template(C.tilesUrl, { z: c.z, x: tx, y: ty }); });
        return cv;
      }
    });
    makeTiles = () => ROT ? new Rotated(tOpt()) : new Masked(C.tilesUrl, tOpt());
    tileLayer = makeTiles().addTo(map);
    map._polyBounds = bounds;
    // карта не уезжает за край снимка: границы панорамы = границы снимка
    map.setMaxBounds(bounds.pad(0.02));
    const fitMin = () => map.setMinZoom(Math.max(0, map.getBoundsZoom(map._polyBounds)));
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
  /* Поворот подложки четвертями по часовой (кнопка на лайф-карте). Все координаты данных — доли исходного снимка (0…1),
     поворачивается только их положение на экране, поэтому подписи и значки остаются ровными. */
  let ROT = 0, makeTiles = null;
  const WR = () => ROT % 2 ? H : W, HR = () => ROT % 2 ? W : H;
  const rotN = (x, y) => ROT === 1 ? [1 - y, x] : ROT === 2 ? [1 - x, 1 - y] : ROT === 3 ? [y, 1 - x] : [x, y];
  const unrotN = (a, b) => ROT === 1 ? [b, 1 - a] : ROT === 2 ? [1 - a, 1 - b] : ROT === 3 ? [1 - b, a] : [a, b];
  const toLL = (x, y) => { const [a, b] = rotN(x, y); return map.unproject([a * WR(), b * HR()], Z); };
  const fromLLraw = ll => { const p = map.project(ll, Z); return unrotN(p.x / WR(), p.y / HR()); };
  const fromLL = ll => { const [x, y] = fromLLraw(ll); return { x: clamp01(x), y: clamp01(y) }; };
  const imgBounds = () => L.latLngBounds(toLL(0, 0), toLL(1, 1));
  /** Повернуть карту: r — сколько четвертей по часовой. Центр и масштаб сохраняются. */
  function setRot(r) {
    r = ((r % 4) + 4) % 4; if (r === ROT) return;
    const c = fromLL(map.getCenter()), z = map.getZoom();
    ROT = r;
    const b = imgBounds(); map._polyBounds = b; map.setMaxBounds(b.pad(0.02));
    if (tileLayer) tileLayer.remove(); tileLayer = makeTiles().addTo(map);
    map.setMinZoom(Math.max(0, map.getBoundsZoom(b)));
    map.setView(toLL(c.x, c.y), Math.max(z, map.getMinZoom()), { animate: false });
    buildRelief(); buildGrid(); renderBorder(); renderMap(); applyLayers();
  }
  const polyLL = pts => pts.map(([x, y]) => toLL(x, y));
  const fitAll = () => map.fitBounds(map._polyBounds);

  async function loadRelief() {
    try { const r = await fetch(C.reliefUrl || 'data/relief.json', { cache: 'no-cache' }); if (!r.ok) return; relief = await r.json(); }
    catch (e) { relief = null; return; }
    buildRelief();
  }
  function buildRelief() {
    if (!relief || !relief.contours) return;
    reliefLayer.clearLayers();
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
      L.marker(pxLL(gCorner(G, i, j)), { interactive: false, keyboard: false, icon: L.divIcon({ className: 'grid-lbl', html: `<div style="transform:rotate(${(gridCfg().angle || 0)}deg) translate(6px,4px);transform-origin:0 0">${esc(colName(i))}${esc(rowName(j))}</div>`, iconSize: [0, 0] }) }).addTo(gridLines);
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
      const c = paintColor(a.color), o = { pane: 'arrows', color: c, opacity: a.opacity, interactive: admin && !S.mode && !S.live };
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
        pane: admin && !S.live ? 'markerPane' : 'mapLabels', draggable: admin && !S.mode && !S.live, keyboard: false, interactive: admin && !S.live, zIndexOffset: -500,
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
        pane: 'placesPane', draggable: admin && !S.mode && !S.live, title: p.name,
        icon: L.divIcon({ className: 'mk-wrap', html: `<div class="mk mk--place${p.id === S.placeId ? ' is-sel' : ''}"><span class="mk__icon">${iconOf(p, 'building')}</span><span class="mk__label">${esc(p.name)}</span></div>`, iconSize: [26, 26], iconAnchor: [13, 13] })
      });
      m.on('click', () => { if (S.live) { lvSheet(`<div class="lvm__t">${esc(p.name)}</div><div class="lvm__s">${esc(PLACE_TYPES[p.type] || '')} · ${esc(lvWhere(p.x, p.y))}</div>`, p); return; } if (!S.mode) selectPlace(p.id); });
      m.on('dragend', async () => { const { x, y } = fromLL(m.getLatLng()); const q = places().find(z => z.id === p.id); Object.assign(q, { x, y }); await commit('Объект перемещён'); });
      m.addTo(placesLayer); markerById.set('place:' + p.id, m);
    });
    if (S.live) { $('#phase').hidden = true; const lg = liveGame(); if (lg) renderLivePoints(lg); lvRenderMarks(); return; }
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
    $('#heroTitle').textContent = siteTitle(); renderBrand(); renderTeamCar();
    const d = D(), f = featuredGame();
    renderContact();
    // карточки сценариев
    const card = (id, title, sub, meta, extra = '') => `<button class="sc ${S.scId === id ? 'active' : ''} ${extra}" data-sc="${esc(id)}" aria-pressed="${S.scId === id}">${extra.includes('hot') ? '<span class="sc__rib">Ближайшая игра</span>' : ''}<h3>${esc(title)}</h3><p>${esc(sub)}</p><div class="sc__meta">${meta}</div></button>`;
    const pin = card('', 'Полигон', 'Местность, рельеф и объекты без привязки к игре', `${d.places.length} объектов${relief ? ` · высоты ${relief.min}–${relief.max} м` : ''}`, 'sc--terrain');
    const cards = scOrder().map(s => {
      const l = scGames(s.id), next = l.filter(isFuture)[0], last = l.filter(x => !isFuture(x)).pop(), nt = scTours(s.id).length;
      const meta = `игр: ${l.length}${nt ? ' · турнир' : ''} · ` + (next ? `<span class="hot">следующая ${fmtDate(next.date).slice(0, 5)}</span>` : last ? `последняя ${fmtDate(last.date)}` : 'игр пока нет');
      return card(s.id, s.title, s.summary || 'Описание сценария пока не заполнено', meta, f && f.scenarioId === s.id ? 'hot' : '');
    }).join('');
    $('#scList').innerHTML = pin + cards;
    renderSoc(); renderInfo(); renderScene(); renderFooter(); renderRating(); fillWeather();
  }
  /** Оранжевая кнопка «Связаться с админом» в шапке — во ВКонтакте, куда приходят заявки. */
  function renderContact() {
    const b = $('#btnContact'), vk = vkChatUrl(D().settings.signup.vk);
    b.hidden = !vk; if (vk) b.href = vk;
  }

  /** Ничего не соединяем: в новой раскладке анонс и сценарии — отдельные блоки. */
  function joinTab() { const j = $('#heroJoin'); if (j) j.hidden = true; }

  /* --- погода на день игры: Open-Meteo, прогноз на 16 дней вперёд, без ключа --- */
  /** Центр полигона [широта, долгота] — по привязке рельефа (или C.center в js/config.js). */
  const geoCenter = () => relief && relief.bounds ? [(relief.bounds.nw[0] + relief.bounds.se[0]) / 2, (relief.bounds.nw[1] + relief.bounds.se[1]) / 2] : (Array.isArray(C.center) ? C.center : null);
  const WX_ICON = c => c === 0 ? '☀️' : c <= 2 ? '🌤️' : c === 3 ? '☁️' : c <= 48 ? '🌫️' : c <= 57 ? '🌦️' : c <= 67 ? '🌧️' : c <= 77 ? '🌨️' : c <= 82 ? '🌧️' : c <= 86 ? '🌨️' : '⛈️';
  let WX = null, wxLoading = null;
  function loadWeather() {
    if (wxLoading) return wxLoading;
    const c = geoCenter(); if (!c) return Promise.resolve(null);
    try { const s = JSON.parse(sessionStorage.getItem('pm-wx') || 'null'); if (s && Date.now() - s.at < 3 * 3600e3) { WX = s.d; return (wxLoading = Promise.resolve(WX)); } } catch (e) {}
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${c[0].toFixed(4)}&longitude=${c[1].toFixed(4)}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&wind_speed_unit=ms&timezone=Europe%2FMoscow&forecast_days=16`;
    wxLoading = fetch(u).then(r => r.ok ? r.json() : null).then(j => {
      if (!j || !j.daily) return null;
      const D0 = j.daily, out = {};
      D0.time.forEach((t, i) => { out[t] = { code: D0.weather_code[i], max: Math.round(D0.temperature_2m_max[i]), min: Math.round(D0.temperature_2m_min[i]), pp: D0.precipitation_probability_max[i], wind: Math.round(D0.wind_speed_10m_max[i]) }; });
      WX = out; try { sessionStorage.setItem('pm-wx', JSON.stringify({ at: Date.now(), d: out })); } catch (e) {}
      return out;
    }).catch(() => null);
    return wxLoading;
  }
  const sgn = v => (v > 0 ? '+' : '') + v + '°';
  function fillWeather() {
    const els = document.querySelectorAll('[data-wx]'); if (!els.length) return;
    const put = () => els.forEach(el => {
      const w = WX && WX[el.dataset.wx];
      el.innerHTML = w ? `<span class="wx" title="Прогноз погоды на полигоне, Open-Meteo">${WX_ICON(w.code)} <b>${sgn(w.max)}</b> днём · ночью ${sgn(w.min)} · 💨 ${w.wind} м/с${w.pp != null ? ` · ☔ ${w.pp}%` : ''}<small>прогноз на ${fmtDate(el.dataset.wx).slice(0, 5)}</small></span>` : '';
    });
    if (WX) put(); else loadWeather().then(put);
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
  const WD2 = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  /** «25 октября, вс · 10:00» для таймера. */
  const cdWhen = g => { const [y, m, d] = g.date.split('-').map(Number); return `${d} ${MONTHS[m - 1]}, ${WD2[new Date(y, m - 1, d).getDay()]} · ${esc(/^\d{1,2}:\d{2}$/.test(g.time || '') ? g.time : defStart())}`; };
  function renderScene() {
    const g = featuredGame(); cdGame = g;
    const sc = g ? scById(g.scenarioId) : null;
    const cell = (id, u) => `<div class="cd__cell"><div class="cd__num" id="${id}">00</div><div class="cd__unit">${u}</div></div>`;
    $('#countdown').innerHTML = g
      ? `<div class="cd__title">До ближайшей игры осталось:</div>
         <div class="cd__grid">${cell('cdD', 'дней')}<i>:</i>${cell('cdH', 'часов')}<i>:</i>${cell('cdM', 'минут')}<i>:</i>${cell('cdS', 'секунд')}</div>
         <div class="cd__k">Ближайшая игра · ${cdWhen(g)}</div>
         <div class="cd__name">${esc(g.title)}</div>
         ${sc && norm(sc.title) !== norm(g.title) ? `<div class="cd__sc">Сценарий «${esc(sc.title)}»</div>` : ''}
         <div class="cd__wx" data-wx="${esc(g.date)}"></div>
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
      ${ph.length > 1 ? `<button class="hgal__nav hgal__nav--prev" data-hgnav="-1" aria-label="Предыдущее фото"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="hgal__nav hgal__nav--next" data-hgnav="1" aria-label="Следующее фото"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ''}</div>`;
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
    const list = D().info, admin = store.canWrite(), fq = faqHtml();
    if (!list.length && !fq && !admin) { $('#infoBlock').innerHTML = ''; $('#infoBlock').hidden = true; return; }
    $('#infoBlock').hidden = false;
    for (const k in galleries) if (k.startsWith('info')) delete galleries[k];
    $('#infoBlock').innerHTML = `<div class="info__in"><div class="info__head"><h2 id="infoTitle">Для игроков</h2>${admin ? '<button class="btn" id="infoEdit">Изменить разделы</button>' : ''}</div>` + fq +
      (list.length ? list.map((s, i) => `<details class="acc"><summary><span>${esc(s.title)}</span><i aria-hidden="true">+</i></summary><div class="acc__b">${richText(s.body)}${gallery('info' + i, s.photos)}</div></details>`).join('')
        : '<p class="hint">Разделов пока нет. Нажмите «Изменить разделы», чтобы добавить правила, снаряжение, прокат.</p>') + '</div>';
    const b = $('#infoEdit'); if (b) b.onclick = openInfoForm;
    const fe = $('#faqEdit'); if (fe) fe.onclick = openFaqForm;
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
    'игрокам': 'infoBlock', info: 'infoBlock', 'игра': 'scene', game: 'scene', 'турнир': 'tour', tour: 'tour',
    'рейтинг': 'rating', rating: 'rating', 'вопросы': 'faq', faq: 'faq' };
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
      .concat(d.info.length ? [{ label: 'Для игроков', url: '#игрокам' }] : []).concat(arrivalGeo() ? [{ label: '🧭 Маршрут до полигона', url: yaRoute(arrivalGeo()) }] : []) });
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
    on('playBtn', () => startPlay(0));
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
        return `<div class="tsub"><div class="tsub__h">${teamBadge(e.id, id, 'tb--m')}<b><button class="link tc-link" data-team-card="${esc(e.id)}">${esc(e.t.name)}</button></b>${cnt != null ? `<span>${cnt} чел.${ppl.length && !showNames ? ' · имена скрыты' : ''}</span>` : ''}</div>${body}</div>`;
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
    const canPlay = playList(sc.id).length > 1;
    return (canPlay ? `<button class="btn primary play-btn" id="playBtn">${S.play ? '⟲ Проиграть заново' : '▶ Проиграть кампанию на карте'}</button>` : '') + `<p class="hint" style="margin:0 0 10px">Игры идут цепочкой: каждая начинается с того положения, которым закончилась предыдущая. Нажмите на игру — карта слева покажет её${S.gameId ? ', а подробности — на вкладке <button class="link" data-tab="game">«Игра»</button>' : ''}.</p><ol class="chain">` + l.map((g, i) => {
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
    const ll = placeGeo(p);
    if (p.type === 'entry' || p.type === 'parking') h += routeHtml(p);
    h += `<div class="sec"><div class="sec__t">Координаты</div><div class="box mono">${coordsBox(p.x, p.y)}${ll ? `<br>GPS <b>${ll[0].toFixed(6)}, ${ll[1].toFixed(6)}</b>` : ''}</div>${p.type === 'entry' || p.type === 'parking' ? '' : routeHtml(p)}</div>`;
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
  const tourById = id => (D().tournaments || []).find(t => t.id === id) || null;
  /** Турнир, который показывается поверх карты в этом сценарии (галочка «Показывать поверх карты»). */
  const overlayTour = () => { if (!S.scId) return null; const l = scTours(S.scId).filter(t => t.overlay); const c = curTour(); return c && c.overlay ? c : l[0] || null; };
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
        const m = { key, num: ++num, a, b, winner, score: res.score || '', note: res.note || '', tid: t.id };
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
    const adm = store.canWrite() && m && m.a.team && m.b.team, tag = 'button';
    return `<${tag} type="button" ${adm ? `data-win="${esc(m.key)}" data-tour="${esc(m.tid)}" data-team="${esc(p.team)}" title="${win ? 'Снять победу' : 'Отметить победителем'}" aria-pressed="${win}"` : `data-team-card="${esc(p.team)}" title="Карточка команды"`} class="bk-t ${win ? 'is-win' : ''} ${lose ? 'is-lose' : ''}">${teamBadge(p.team, '', 'tb--s')}<b>${esc(t ? t.name : '—')}</b>${win ? '<i class="bk-w" aria-label="победа">✓</i>' : ''}</${tag}>`;
  }
  const matchHtml = m => `<div class="bk-m ${m.winner ? 'is-done' : ''}">
      <div class="bk-m__h"><span>Матч ${m.num}</span>${m.score ? `<b class="bk-score">${esc(m.score)}</b>` : ''}${store.canWrite() ? `<button type="button" class="bk-ed" data-medit="${esc(m.key)}" data-tour="${esc(m.tid)}" title="Счёт и примечание" aria-label="Счёт и примечание: матч ${m.num}">✎</button>` : ''}</div>
      ${slotHtml(m.a, m)}${slotHtml(m.b, m)}${m.note ? `<div class="bk-note">${esc(m.note)}</div>` : ''}</div>`;
  const byeHtml = p => `<div class="bk-bye">${slotHtml(p, null)}<small>проходит дальше без игры</small></div>`;
  function bracketHtml(t, wide, ov) {
    const B = bracket(t);
    if (!B.rounds.length) return `<div class="box" style="color:var(--muted)">Для сетки нужно хотя бы две команды${store.canWrite() ? ' — добавьте их в «Изменить турнир»' : ''}.</div>`;
    const ch = B.champion ? teamById(B.champion) : null;
    let h = ch ? `<div class="bk-champ">${teamBadge(ch.id, '', 'tb--m')}<div><small>Победитель турнира</small><b>${esc(ch.name)}</b></div><span class="bk-cup">${CUP}</span></div>` : '';
    h += `<div class="bk ${wide ? 'bk--wide' : ''} ${ov ? 'bk--ov' : ''}">` + B.rounds.map((R, i) => `<section class="bk-r"><h4 class="bk-r__t">${roundName(B.rounds, i)}<small>${R.matches.length} ${plural(R.matches.length, 'пара', 'пары', 'пар')}</small></h4>
        <div class="bk-r__m">${R.matches.map(matchHtml).join('')}${R.bye ? byeHtml(R.bye) : ''}</div></section>`).join('') + '</div>';
    if (!wide && !ov) h += `<button type="button" class="btn ghost bk-open" data-bkwide>Сетка целиком ⤢</button>`;
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
        <div class="lb-t"><b><button class="link tc-link" data-team-card="${esc(r.team)}">${esc(tm.name)}</button></b>${r.note ? `<small>${esc(r.note)}</small>` : ''}</div>
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
  async function setWinner(tid, key, team) {
    const t = tourById(tid); if (!t) return;
    const r = t.results[key] || (t.results[key] = { winner: '', score: '', note: '' });
    r.winner = r.winner === team ? '' : team;
    await commit(r.winner ? `${teamById(team)?.name || 'Команда'} — победа в паре` : 'Победа снята');
  }
  function openMatchForm(tid, key) {
    const t = tourById(tid); if (!t) return;
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
        const tt = tourById(tid), r = tt.results[key] || (tt.results[key] = { winner: '', score: '', note: '' });
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
    const dlg = $('#dlg'), t = tourById(dlg.dataset.wide);
    if (!dlg.open || !t) return;
    const b = dlg.querySelector('.dlg__body .bk'); if (b) b.outerHTML = bracketHtml(t, true).replace(/^[\s\S]*?(<div class="bk bk--wide">)/, '$1');
    const ch = dlg.querySelector('.dlg__body .bk-champ'), B = bracket(t);
    if (ch) ch.remove();
    if (B.champion) dlg.querySelector('.dlg__body').insertAdjacentHTML('afterbegin', `<div class="bk-champ">${teamBadge(B.champion, '', 'tb--m')}<div><small>Победитель турнира</small><b>${esc(teamById(B.champion).name)}</b></div><span class="bk-cup">${CUP}</span></div>`);
  }
  document.addEventListener('click', async e => {
    const w = e.target.closest('[data-win]');
    if (w && store.canWrite()) { e.preventDefault(); try { await setWinner(w.dataset.tour, w.dataset.win, w.dataset.team); refreshWide(); } catch (x) {} return; }
    const me = e.target.closest('[data-medit]');
    if (me && store.canWrite()) { e.preventDefault(); openMatchForm(me.dataset.tour, me.dataset.medit); }
  });
  function openTourForm(t, kind) {
    const d = D(), sc = curScenario(), isNew = !t;
    if (!sc) { toast('Сначала выберите сценарий', 'err'); return; }
    if (!d.teams.length) { toast('Справочник команд пуст — добавьте команды: ⚙ Настройки → Стороны и команды', 'err'); return; }
    t = t || { id: Store.uid(), scenarioId: sc.id, kind: kind === 'list' ? 'list' : 'bracket', title: '', note: '', teams: [], results: {}, rows: [], overlay: true };
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
        `<label class="check"><input type="checkbox" name="overlay" ${t.overlay !== false ? 'checked' : ''}> Показывать поверх карты — сетка или список висят на карте этого сценария (посетитель может свернуть)</label>` +
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
        const data = Object.assign({}, t, { kind, title: fd.get('title').trim(), note: fd.get('note').trim(), teams, rows, results: fd.get('reset') ? {} : t.results, overlay: !!fd.get('overlay') });
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

  /* --- турнир поверх карты: можно свернуть в плашку (запоминается в браузере) --- */
  function renderTourOverlay() {
    const el = $('#tourOv'), t = S.play ? null : overlayTour();   // во время «Проиграть кампанию» сетка не закрывает карту
    if (!t) { el.hidden = true; el.innerHTML = ''; el.dataset.tid = ''; return; }
    const st = ls.get('pm-tov-min', {}), min = st[t.id] ?? isMobile();
    const old = el.querySelector('.tov__body'), sl = old && el.dataset.tid === t.id ? [old.scrollLeft, old.scrollTop] : [0, 0];
    const B = t.kind === 'bracket' ? bracket(t) : null, ch = B && B.champion ? teamById(B.champion) : null;
    el.hidden = false; el.dataset.tid = t.id; el.classList.toggle('is-min', min);
    el.innerHTML = min
      ? `<button type="button" class="tov__pill" data-tov="open" title="Показать турнир поверх карты"><span class="tov__cup">${CUP}</span><span>${esc(t.title)}${ch ? ` · <b>${esc(ch.name)}</b>` : ''}</span><i aria-hidden="true">▾</i></button>`
      : `<div class="tov__head"><span class="tov__cup">${CUP}</span><b>${esc(t.title)}</b><small>${t.kind === 'list' ? 'список' : 'турнирная сетка'}</small><span class="sp"></span>
          <button type="button" class="tov__btn" data-tov="tab">Подробнее</button><button type="button" class="tov__btn" data-tov="min" aria-label="Свернуть турнир">Свернуть ▴</button></div>
         <div class="tov__body">${t.kind === 'list' ? listHtml(t) : bracketHtml(t, true, true)}</div>`;
    const nb = el.querySelector('.tov__body'); if (nb) { nb.scrollLeft = sl[0]; nb.scrollTop = sl[1]; }
  }
  $('#tourOv').addEventListener('click', e => {
    const b = e.target.closest('[data-tov]'); if (!b) return;
    const t = tourById($('#tourOv').dataset.tid); if (!t) return;
    const st = ls.get('pm-tov-min', {});
    if (b.dataset.tov === 'tab') { S.tab = 'tour'; S.tourId = t.id; S.pointId = S.placeId = null; renderPanel(); syncHash(); if (isMobile()) $('#panel').scrollIntoView({ behavior: 'smooth' }); return; }
    st[t.id] = b.dataset.tov === 'min'; ls.set('pm-tov-min', st); renderTourOverlay();
  });

  /* --- карусель эмблем команд в шапке (эмблемы — из справочника команд, в т.ч. ссылки Google Drive) --- */
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function renderTeamCar() {
    const el = $('#teamCar'); if (!el) return;
    const site = D().settings.site || {}, list = D().teams.filter(t => t.logo && safeUrl(t.logo));
    const on = site.carousel !== false && list.length > 0;
    el.hidden = !on;
    if (!on) { el.innerHTML = ''; el.dataset.key = ''; return; }
    const key = list.map(t => t.id + '|' + t.logo + '|' + t.name).join('§'); if (el.dataset.key === key) return; el.dataset.key = key;
    const item = (t, dup) => `<button type="button" class="tcar__i" data-team-card="${esc(t.id)}" title="${esc(t.name)} — карточка команды"${dup ? ' tabindex="-1" aria-hidden="true"' : ` role="listitem"`}><img src="${esc(photoSrc(t.logo, 160))}" alt="${dup ? '' : esc(t.name)}" loading="lazy" referrerpolicy="no-referrer" onload="this.parentNode.classList.add('ok')" onerror="this.parentNode.remove()"></button>`;
    el.innerHTML = `<div class="tcar__track"><div class="tcar__set" role="list">${list.map(t => item(t)).join('')}</div><div class="tcar__set" aria-hidden="true">${list.map(t => item(t, true)).join('')}</div></div>`;
    el.querySelectorAll('img').forEach(i => i.addEventListener('load', fitCar));
    requestAnimationFrame(fitCar);
  }
  /** Листаем, только если эмблемы не помещаются; иначе стоят по центру. */
  function fitCar() {
    const el = $('#teamCar'); if (!el || el.hidden) return;
    const set = el.querySelector('.tcar__set'); if (!set) return;
    const move = !reduceMotion() && set.scrollWidth > el.clientWidth + 2;
    el.classList.toggle('is-moving', move);
    el.style.setProperty('--dur', Math.max(14, set.children.length * 2.6) + 's');
  }
  addEventListener('resize', fitCar);

  /* ================================================================
     РЕЙТИНГ КОМАНД И КАРТОЧКА КОМАНДЫ
     ================================================================ */
  /** Победитель игры: указан в форме игры, иначе (авто) — сторона, у которой после игры больше точек. */
  function gameWinner(g) {
    if (!g || isFuture(g)) return '';
    if (g.winner) return g.winner;
    if (isMedia(g) || !g.points.length) return '';
    const c = {}; g.points.forEach(p => { if (p.after) c[p.after] = (c[p.after] || 0) + 1; });
    const top = Object.entries(c).sort((a, b) => b[1] - a[1]);
    if (!top.length) return '';
    return top.length > 1 && top[0][1] === top[1][1] ? 'draw' : top[0][0];
  }
  /** Места команд в турнире: сетка — 1 победитель, 2 финалист, 3 проигравшие в полуфинале; список — по очкам. */
  function tourPlaces(t) {
    const out = [];
    if (t.kind === 'list') {
      const rows = t.rows.filter(r => r.points != null && teamById(r.team)).sort((a, b) => b.points - a.points);
      let place = 0, prev; rows.forEach((r, k) => { if (k === 0 || r.points !== prev) { place = k + 1; prev = r.points; } out.push([r.team, place]); });
      return out;
    }
    const B = bracket(t); if (!B.champion) return out;
    out.push([B.champion, 1]);
    const R = B.rounds, fin = R[R.length - 1].matches[0];
    if (fin) { const l = fin.a.team === B.champion ? fin.b.team : fin.a.team; if (l) out.push([l, 2]); }
    if (R.length > 1) R[R.length - 2].matches.forEach(m => { if (m.winner) { const l = m.a.team === m.winner ? m.b.team : m.a.team; if (l) out.push([l, 3]); } });
    return out;
  }
  /** Год турнира — по последней игре его сценария (турнир без игр — текущий год). */
  const tourYear = t => { const l = scGames(t.scenarioId); return l.length ? +l[l.length - 1].date.slice(0, 4) : new Date().getFullYear(); };
  function teamStats(year) {
    const R = D().settings.rating, st = new Map();
    const get = id => { if (!st.has(id)) st.set(id, { id, games: 0, wins: 0, draws: 0, points: 0, tours: [], sides: {}, list: [] }); return st.get(id); };
    D().games.filter(g => !isFuture(g) && (!year || +g.date.slice(0, 4) === year)).forEach(g => {
      const w = gameWinner(g);
      for (const sid in g.sides) sideEntries(g.sides[sid]).forEach(e => {
        const s = get(e.id); s.games++; s.sides[sid] = (s.sides[sid] || 0) + 1;
        if (w === sid) s.wins++; else if (w === 'draw') s.draws++;
        if (!isMedia(g)) s.points += g.points.filter(p => p.after === sid && p.before !== sid).length;
      });
    });
    (D().tournaments || []).forEach(t => { if (year && tourYear(t) !== year) return; tourPlaces(t).forEach(([id, place]) => { if (place <= 3) get(id).tours.push({ t, place }); }); });
    st.forEach(s => { s.score = Math.round((s.games * R.game + s.wins * R.win + s.draws * R.draw + s.points * R.point + s.tours.reduce((a, x) => a + (R['t' + x.place] || 0), 0)) * 10) / 10; });
    return [...st.values()].filter(s => teamById(s.id)).sort((a, b) => b.score - a.score || b.wins - a.wins || b.games - a.games || teamById(a.id).name.localeCompare(teamById(b.id).name, 'ru'));
  }
  const seasons = () => [...new Set(D().games.filter(g => !isFuture(g)).map(g => +g.date.slice(0, 4)))].sort((a, b) => b - a);
  const MEDAL = ['', '🏆', '🥈', '🥉'];
  const tourCell = s => s.tours.length ? s.tours.sort((a, b) => a.place - b.place).map(x => `<span title="${esc(x.t.title)} — ${x.place} место">${MEDAL[x.place]}</span>`).join(' ') : '—';
  function renderRating() {
    const el = $('#rating'); if (!el) return;
    const R = D().settings.rating, admin = store.canWrite(), ys = seasons();
    if (!S.ratingYear || !ys.includes(S.ratingYear)) S.ratingYear = ys.includes(new Date().getFullYear()) ? new Date().getFullYear() : ys[0];
    const list = S.ratingYear ? teamStats(S.ratingYear) : [];
    if ((!R.show || !list.length) && !admin) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    const all = S.ratingAll, rows = all ? list : list.slice(0, 10);
    el.innerHTML = `<div class="rt-in"><div class="info__head"><div><h2>Рейтинг команд${S.ratingYear ? ` · сезон ${S.ratingYear}` : ''}</h2>
        <p class="rt-sub">Считается сам: участие, победы в играх, взятые точки и призовые места в турнирах. Нажмите на команду — откроется её карточка.</p></div>
        <div class="rt-acts">${ys.length > 1 ? `<select id="ratingYear" aria-label="Сезон">${ys.map(y => `<option ${y === S.ratingYear ? 'selected' : ''}>${y}</option>`).join('')}</select>` : ''}${admin ? '<button class="btn" id="ratingSet">⚙ Как считать очки</button>' : ''}</div></div>
      ${!R.show ? '<p class="hint">Рейтинг скрыт от посетителей — включите его в «⚙ Как считать очки».</p>' : ''}
      ${list.length ? `<div class="rt-wrap"><table class="rtab"><thead><tr><th>#</th><th>Команда</th><th>Игр</th><th>Побед</th><th>Точек взято</th><th>Турниры</th><th>Очки</th></tr></thead><tbody>
        ${rows.map((s, i) => { const t = teamById(s.id); return `<tr class="${i < 3 ? 'top' + (i + 1) : ''}"><td class="n">${i + 1}</td><td><button class="rt-team" data-team-card="${esc(s.id)}">${teamBadge(s.id, '', 'tb--s')}<span>${esc(t.name)}</span></button></td>
          <td class="c">${s.games}</td><td class="c">${s.wins}${s.draws ? `<small> +${s.draws}н</small>` : ''}</td><td class="c">${s.points}</td><td class="c">${tourCell(s)}</td><td class="c pts">${String(s.score).replace('.', ',')}</td></tr>`; }).join('')}
        </tbody></table></div>${list.length > 10 ? `<button class="btn ghost rt-more" id="ratingAll">${all ? 'Свернуть' : `Показать всех (${list.length})`}</button>` : ''}`
      : '<div class="box" style="color:var(--muted)">Пока не из чего считать: назначьте командам стороны в прошедших играх («Изменить игру» → стороны и команды).</div>'}</div>`;
    const ys2 = $('#ratingYear'); if (ys2) ys2.onchange = e => { S.ratingYear = +e.target.value; renderRating(); };
    const ra = $('#ratingAll'); if (ra) ra.onclick = () => { S.ratingAll = !S.ratingAll; renderRating(); };
    const rs = $('#ratingSet'); if (rs) rs.onclick = openRatingForm;
  }
  function openRatingForm() {
    const R = D().settings.rating;
    const n = (k, l) => fld(l, `<input type="number" name="${k}" min="0" max="1000" step="0.5" value="${R[k]}" required>`);
    openDialog({
      title: 'Рейтинг команд: как считать очки',
      body: `<label class="check"><input type="checkbox" name="show" ${R.show ? 'checked' : ''}> Показывать рейтинг посетителям</label>
        <div class="row3">${n('game', 'За участие в игре')}${n('win', 'За победу стороны')}${n('draw', 'За ничью')}</div>
        <div class="row3">${n('point', 'За взятую точку')}${n('t1', 'Турнир: 1 место')}${n('t2', 'Турнир: 2 место')}</div>
        <div class="row3">${n('t3', 'Турнир: 3 место')}</div>
        <div class="note">Очки получает каждая команда стороны. «Победа» — сторона, указанная в поле «Итог игры» в окне игры; если там «авто», побеждает сторона, у которой после игры больше точек. «Взятая точка» — точка, которая за игру перешла к этой стороне.</div>`,
      onSubmit: async fd => {
        const o = { show: !!fd.get('show') }; ['game', 'win', 'draw', 'point', 't1', 't2', 't3'].forEach(k => { o[k] = +fd.get(k) || 0; });
        D().settings.rating = o; await commit('Рейтинг пересчитан');
      }
    });
  }
  /** Карточка команды: эмблема, итоги за всё время, игры и турниры. */
  function openTeamCard(id) {
    const t = teamById(id); if (!t) return;
    const s = teamStats(null).find(x => x.id === id) || { games: 0, wins: 0, draws: 0, points: 0, tours: [], sides: {} };
    const fav = Object.entries(s.sides).sort((a, b) => b[1] - a[1])[0], season = S.ratingYear ? teamStats(S.ratingYear) : [], si = season.findIndex(x => x.id === id);
    const games = D().games.filter(g => Object.keys(g.sides).some(sid => sideEntries(g.sides[sid]).some(e => e.id === id))).sort((a, b) => b.date.localeCompare(a.date));
    const sideOf = g => Object.keys(g.sides).find(sid => sideEntries(g.sides[sid]).some(e => e.id === id));
    const res = (g, sid) => { if (isFuture(g)) return 'скоро'; const w = gameWinner(g); return !w ? 'сыграна' : w === 'draw' ? 'ничья' : w === sid ? '<b class="ok">победа</b>' : 'поражение'; };
    const about = [t.captain && `Капитан: <b>${esc(t.captain)}</b>`, t.city && esc(t.city), t.since && `на полигоне с ${esc(t.since)}`, t.vk && safeUrl(t.vk) && `<a href="${esc(t.vk)}" target="_blank" rel="noopener">ВКонтакте ↗</a>`].filter(Boolean);
    const logo = t.logo && safeUrl(t.logo) ? `<img src="${esc(photoSrc(t.logo, 256))}" alt="" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'tc-ini',textContent:'${esc(t.name.slice(0, 1).toUpperCase())}'}))">` : `<span class="tc-ini">${esc(t.name.slice(0, 1).toUpperCase())}</span>`;
    openDialog({
      title: 'Команда',
      body: `<div class="tc-head"><span class="tc-logo">${logo}</span><div><h3>${esc(t.name)}</h3>
          <p>${games.length ? `Игр на полигоне: ${games.length}` : 'Ещё не играла на полигоне'}${fav ? ` · чаще за <b style="color:${sideColor(fav[0])}">${esc(sideName(fav[0]))}</b>` : ''}${t.players.length ? ` · в составе ${t.players.length} ${plural(t.players.length, 'боец', 'бойца', 'бойцов')}` : ''}</p>
          ${about.length ? `<p class="tc-about">${about.join(' · ')}</p>` : ''}
          ${si >= 0 ? `<p class="tc-rank">${si + 1}-е место в рейтинге сезона ${S.ratingYear} · ${String(season[si].score).replace('.', ',')} очк.</p>` : ''}</div></div>
        <div class="tc-stats"><div><b>${s.games}</b><span>игр</span></div><div><b>${s.wins}</b><span>побед</span></div><div><b>${s.points}</b><span>точек взято</span></div><div><b>${s.tours.length ? s.tours.map(x => MEDAL[x.place]).join('') : '—'}</b><span>турниры</span></div></div>
        ${s.tours.length ? `<div class="sec__t">Турниры</div><ul class="tc-list">${s.tours.map(x => `<li><i>${MEDAL[x.place]}</i><b>${esc(x.t.title)}</b><small>${x.place} место</small></li>`).join('')}</ul>` : ''}
        ${games.length ? `<div class="sec__t">Игры команды</div><ul class="tc-list">${games.map(g => { const sid = sideOf(g), sc = scById(g.scenarioId);
          return `<li><button type="button" data-open-game="${esc(g.id)}" data-close-dlg><i class="dot" style="background:${sideColor(sid)}"></i><b>${esc(g.title)}</b><span>${esc(sc ? sc.title : '')} · ${esc(sideName(sid))}</span><small>${esc(fmtDate(g.date))} · ${res(g, sid)}</small></button></li>`; }).join('')}</ul>` : ''}`
    });
  }
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-team-card]'); if (c) { e.preventDefault(); openTeamCard(c.dataset.teamCard); return; }
    if (e.target.closest('[data-close-dlg]') && $('#dlg').open) $('#dlg').close();
  });

  /* ================================================================
     ПРОКАТ, МАРШРУТ, «ПЕРВЫЙ РАЗ?»
     ================================================================ */
  const rub = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  function openRentalForm() {
    const R = D().settings.rental;
    const row = i => `<div class="erow rn-r" data-id="${esc(i.id)}" data-drag="${esc(i.id)}" draggable="true"><span class="grip" title="Перетащите">⋮⋮</span>
      <input class="rn-n" value="${esc(i.name)}" maxlength="80" placeholder="Комплект, например «Привод + 2 магазина»" aria-label="Название"><input class="rn-p" type="number" min="0" step="10" value="${i.price ?? ''}" placeholder="₽" aria-label="Цена, ₽">
      <input class="rn-d" value="${esc(i.note || '')}" maxlength="120" placeholder="примечание" aria-label="Примечание"><button type="button" class="iconbtn" data-rm aria-label="Убрать">✕</button></div>`;
    const sample = [['Привод + 2 магазина + шары', 800], ['Маска / защитные очки', 200], ['Бронежилет + разгрузка', 300], ['Камуфляж (куртка + штаны)', 300], ['Рация', 150]];
    openDialog({
      title: 'Прокат: комплекты и цены',
      body: `<div class="note">Комплекты видны в окне «Записаться»: игрок отмечает, что возьмёт, видит сумму, и список уходит в заявку ВКонтакте. Пустой список — в записи останется простой вопрос «Нужен прокат?».</div>
        <div class="erows" id="rnRows">${R.items.map(row).join('')}</div>
        <div class="admin-actions wrap"><button type="button" class="btn ghost" id="rnAdd">+ Комплект</button>${R.items.length ? '' : '<button type="button" class="btn ghost" id="rnSample">Заполнить примером</button>'}</div>`,
      onOpen: f => {
        const box = f.querySelector('#rnRows');
        const add = (n = '', p = null) => { box.insertAdjacentHTML('beforeend', row({ id: Store.uid(), name: n, price: p, note: '' })); enableDrag(box, () => {}); };
        f.querySelector('#rnAdd').onclick = () => { add(); box.lastElementChild.querySelector('.rn-n').focus(); };
        const smp = f.querySelector('#rnSample'); if (smp) smp.onclick = () => { sample.forEach(([n, p]) => add(n, p)); smp.remove(); };
        f.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) b.closest('.rn-r').remove(); });
        enableDrag(box, () => {});
      },
      onSubmit: async (fd, f) => {
        D().settings.rental = { items: [...f.querySelectorAll('#rnRows .rn-r')].map(r => ({ id: r.dataset.id, name: r.querySelector('.rn-n').value.trim(),
          price: r.querySelector('.rn-p').value === '' ? null : +r.querySelector('.rn-p').value, note: r.querySelector('.rn-d').value.trim() })).filter(i => i.name) };
        await commit('Прокат сохранён');
      }
    });
  }
  /** Блок проката в окне записи: галочки, количество, итог. */
  function rentalPicker() {
    const items = D().settings.rental.items;
    return `<div class="fld"><span>Прокат снаряжения</span><div class="rent" id="rentBox">${items.map(i => `<label class="rent__i"><input type="checkbox" class="rent-c" value="${esc(i.id)}"><span class="rent__n">${esc(i.name)}${i.note ? `<small>${esc(i.note)}</small>` : ''}</span>
        <b>${i.price != null ? rub(i.price) : 'цена по запросу'}</b><input type="number" class="rent-q" min="1" max="50" value="1" aria-label="Количество: ${esc(i.name)}"></label>`).join('')}
      <div class="rent__tot"><span>Итого прокат</span><b id="rentTot">0 ₽</b></div></div><small>Не нужно — ничего не отмечайте. Список уйдёт в заявку, организаторы заранее подготовят комплекты.</small></div>`;
  }
  function rentalRead(f) {
    const items = D().settings.rental.items, out = []; let sum = 0;
    f.querySelectorAll('#rentBox .rent__i').forEach(l => {
      const c = l.querySelector('.rent-c'); if (!c.checked) return;
      const i = items.find(x => x.id === c.value), q = Math.max(1, Math.min(50, Math.round(+l.querySelector('.rent-q').value) || 1));
      if (!i) return; out.push({ i, q }); if (i.price != null) sum += i.price * q;
    });
    return { out, sum };
  }

  /* --- маршрут: координаты объекта — по привязке подложки к местности --- */
  function placeGeo(p) {
    if (!relief || !relief.bounds) return null;
    const b = relief.bounds; return [b.nw[0] + (b.se[0] - b.nw[0]) * p.y, b.nw[1] + (b.se[1] - b.nw[1]) * p.x];
  }
  const yaRoute = ll => `https://yandex.ru/maps/?rtext=~${ll[0].toFixed(6)}%2C${ll[1].toFixed(6)}&rtt=auto`;
  const gRoute = ll => `https://www.google.com/maps/dir/?api=1&destination=${ll[0].toFixed(6)},${ll[1].toFixed(6)}`;
  /** Куда вести гостей: объект «Вход», иначе «Парковка», иначе центр полигона. */
  function arrivalGeo() { const p = places().find(x => x.type === 'entry') || places().find(x => x.type === 'parking'); return p ? placeGeo(p) : geoCenter(); }
  function routeHtml(p) {
    const ll = placeGeo(p); if (!ll) return '';
    const s = `${ll[0].toFixed(6)}, ${ll[1].toFixed(6)}`, full = p.type === 'entry' || p.type === 'parking';
    return `<div class="route ${full ? '' : 'route--sm'}">${full ? `<a class="btn primary" href="${esc(yaRoute(ll))}" target="_blank" rel="noopener">🧭 Маршрут в Яндекс.Картах</a><a class="btn" href="${esc(gRoute(ll))}" target="_blank" rel="noopener">Google Maps</a>` : `<a class="btn ghost" href="${esc(yaRoute(ll))}" target="_blank" rel="noopener">🧭 Маршрут сюда</a>`}
      <button type="button" class="btn ghost" data-copy="${esc(s)}">Скопировать координаты</button></div>`;
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); toast('Скопировано: ' + b.dataset.copy); } catch (x) { toast(b.dataset.copy); }
  });

  /* --- «Первый раз?» — вопросы новичков --- */
  const FAQ_SAMPLE = [
    ['Первый раз?', 'Ничего своего не нужно — всё дадим в прокат. Приезжайте пораньше к инструктажу.'],
    ['Сколько стоит?', 'Взнос за игру и цены проката — в разделе «Прокат» и в окне записи.'],
    ['Что надеть?', 'Закрытая одежда по погоде, крепкая обувь, перчатки. Очки или маска — обязательно.'],
    ['С какого возраста?', 'Уточните у организаторов: обычно с 14 лет с согласием родителей.'],
    ['Свой привод?', 'Можно, после проверки скорости (хрона) на входе. Лимиты — в правилах.'],
    ['Где поесть?', 'Еду и воду лучше взять с собой.']];
  function faqHtml() {
    const l = D().faq || [], admin = store.canWrite();
    if (!l.length && !admin) return '';
    return `<div class="faq" id="faq"><div class="faq__h"><h3>Первый раз на полигоне?</h3>${admin ? '<button class="btn ghost" id="faqEdit">Изменить вопросы</button>' : ''}</div>
      ${l.length ? `<div class="faq__g">${l.map(f => `<div class="faq__c"><b>${esc(f.q)}</b><p>${linkify(f.a)}</p></div>`).join('')}</div>` : '<p class="hint">Вопросов пока нет. Нажмите «Изменить вопросы» — можно начать с примера.</p>'}</div>`;
  }
  function openFaqForm() {
    const row = f => `<div class="irow fq" data-drag="${esc(f.id)}" data-id="${esc(f.id)}" draggable="true"><div class="irow__h"><span class="grip" title="Перетащите">⋮⋮</span><input class="fq-q" value="${esc(f.q)}" maxlength="80" placeholder="Вопрос, например «Что надеть?»" aria-label="Вопрос"><button type="button" class="iconbtn" data-rm aria-label="Удалить">✕</button></div>
      <textarea class="fq-a" rows="2" maxlength="400" placeholder="Короткий ответ" aria-label="Ответ">${esc(f.a)}</textarea></div>`;
    openDialog({
      title: '«Первый раз на полигоне?»',
      body: `<div class="note">Короткие ответы для новичков — карточками над разделами «Для игроков». Лучше 3–6 штук, по паре предложений.</div>
        <div class="irows" id="fqRows">${(D().faq || []).map(row).join('')}</div>
        <div class="admin-actions wrap"><button type="button" class="btn ghost" id="fqAdd">+ Вопрос</button>${(D().faq || []).length ? '' : '<button type="button" class="btn ghost" id="fqSample">Заполнить примером</button>'}</div>`,
      onOpen: f => {
        const box = f.querySelector('#fqRows');
        const add = (q = '', a = '') => { box.insertAdjacentHTML('beforeend', row({ id: Store.uid(), q, a })); enableDrag(box, () => {}); };
        f.querySelector('#fqAdd').onclick = () => { add(); box.lastElementChild.querySelector('.fq-q').focus(); };
        const smp = f.querySelector('#fqSample'); if (smp) smp.onclick = () => { FAQ_SAMPLE.forEach(([q, a]) => add(q, a)); smp.remove(); };
        f.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) b.closest('.fq').remove(); });
        enableDrag(box, () => {});
      },
      onSubmit: async (fd, f) => {
        D().faq = [...f.querySelectorAll('#fqRows .fq')].map(r => ({ id: r.dataset.id, q: r.querySelector('.fq-q').value.trim(), a: r.querySelector('.fq-a').value.trim() })).filter(x => x.q || x.a);
        await commit('Вопросы сохранены');
      }
    });
  }

  /* ================================================================
     «ПРОИГРАТЬ КАМПАНИЮ»: игры сценария по очереди — до и после, точки перекрашиваются
     ================================================================ */
  const playList = scId => scGames(scId).filter(g => !isMedia(g) && g.points.length);
  function startPlay(from = 0) {
    const l = playList(S.scId); if (!l.length) return;
    stopPlay(true);
    S.play = { ids: l.map(g => g.id), i: Math.min(from, l.length - 1), ph: 'before', paused: false, done: false, timer: 0 };
    if (S.mode) stopMode();
    playStep(); if (isMobile()) $('#app').scrollIntoView({ behavior: 'smooth' });
  }
  function playStep() {
    const P = S.play; if (!P) return;
    S.gameId = P.ids[P.i]; S.phase = P.ph; S.pointId = S.placeId = null;
    refresh(); renderPlayer();
    clearTimeout(P.timer);
    if (!P.paused && !P.done) P.timer = setTimeout(playNext, P.ph === 'before' ? 1500 : 2300);
  }
  function playNext() {
    const P = S.play; if (!P) return;
    if (P.ph === 'before') P.ph = 'after';
    else if (P.i < P.ids.length - 1) { P.i++; P.ph = 'before'; }
    else { P.done = true; }
    playStep();
  }
  function stopPlay(silent) { const P = S.play; if (!P) return; clearTimeout(P.timer); S.play = null; if (!silent) { renderPlayer(); renderTourOverlay(); } }
  function renderPlayer() {
    const el = $('#playBar'), P = S.play;
    if (!P) { el.hidden = true; el.innerHTML = ''; return; }
    const games = P.ids.map(id => D().games.find(g => g.id === id)).filter(Boolean), g = games[P.i];
    if (!g) { stopPlay(); return; }
    el.hidden = false;
    el.innerHTML = `<button type="button" class="pb-b pb-main" data-pb="${P.done ? 'again' : P.paused ? 'go' : 'pause'}" aria-label="${P.done ? 'Сначала' : P.paused ? 'Продолжить' : 'Пауза'}">${P.done ? '⟲' : P.paused ? '▶' : '❚❚'}</button>
      <div class="pb-tl">${games.map((x, i) => `${i ? `<s class="${i <= P.i ? 'on' : ''}"></s>` : ''}<button type="button" class="pb-d ${i < P.i || (i === P.i && P.ph === 'after') ? 'on' : ''} ${i === P.i ? 'cur' : ''}" data-pb="jump" data-i="${i}" title="${esc(fmtDate(x.date))} — ${esc(x.title)}"></button>`).join('')}</div>
      <span class="pb-t">${P.done ? 'Кампания проиграна · ' : ''}Игра ${P.i + 1} из ${games.length} · «${esc(g.title)}» · ${esc(fmtDate(g.date))} · <b>${P.ph === 'before' ? 'до игры' : 'после игры'}</b></span>
      <button type="button" class="pb-b" data-pb="close" aria-label="Закрыть плеер">✕</button>`;
  }
  $('#playBar').addEventListener('click', e => {
    const b = e.target.closest('[data-pb]'); if (!b || !S.play) return; const P = S.play;
    if (b.dataset.pb === 'pause') { P.paused = true; clearTimeout(P.timer); renderPlayer(); }
    else if (b.dataset.pb === 'go') { P.paused = false; playNext(); }
    else if (b.dataset.pb === 'again') startPlay(0);
    else if (b.dataset.pb === 'jump') { P.i = +b.dataset.i; P.ph = 'after'; P.done = P.i === P.ids.length - 1; P.paused = true; playStep(); }
    else if (b.dataset.pb === 'close') stopPlay();
  });

  /* ================================================================
     БРИФИНГ: картинка карты игры (PNG) — подложка, граница, сетка, зоны, стрелки, точки, легенда
     ================================================================ */
  const svgImgCache = new Map();
  function svgImg(svg, color, size) {
    const key = svg + color + size; if (svgImgCache.has(key)) return svgImgCache.get(key);
    const src = svg.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" `).replace(/currentColor/g, color);
    const p = new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src); });
    svgImgCache.set(key, p); return p;
  }
  const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  async function makeBrief() {
    const g = curGame(); if (isMedia(g)) return;
    const btn = $('#btnBrief'); btn.disabled = true; toast('Готовлю карту…');
    try {
      const d = D(), pts = g ? g.points : [];
      // область: по границе полигона (и точкам игры), иначе весь снимок
      let fr = d.border.length >= 3 ? d.border.concat(pts.map(p => [p.x, p.y])) : null, x0 = 0, y0 = 0, x1 = 1, y1 = 1;
      if (fr) { const xs = fr.map(p => p[0]), ys = fr.map(p => p[1]); x0 = Math.max(0, Math.min(...xs) - .03); x1 = Math.min(1, Math.max(...xs) + .03); y0 = Math.max(0, Math.min(...ys) - .03); y1 = Math.min(1, Math.max(...ys) + .03); }
      const OUT = 2400, NZ = idx.nativeZoom ?? Z, T = idx.tileSize;
      let L = NZ; for (let z = 0; z <= NZ; z++) { if ((x1 - x0) * W / Math.pow(2, Z - z) >= OUT * .9 && idx.levels[z]) { L = z; break; } }
      const s = 1 / Math.pow(2, Z - L), k = OUT / ((x1 - x0) * W * s);
      const mw = OUT, mh = Math.round((y1 - y0) * H * s * k), HEAD = 150, FOOT = 110, PAD = 0;
      const cv = document.createElement('canvas'); cv.width = mw + PAD * 2; cv.height = mh + HEAD + FOOT;
      const c = cv.getContext('2d'), oy = HEAD;
      const P = (x, y) => [PAD + (x - x0) * W * s * k, oy + (y - y0) * H * s * k];
      c.fillStyle = '#0e120c'; c.fillRect(0, 0, cv.width, cv.height);
      // подложка из тайлов
      const lv = idx.levels[L], tUrl = (z, x, y) => C.tilesUrl.replace('{z}', z).replace('{x}', x).replace('{y}', y), jobs = [];
      for (let ty = Math.floor(y0 * H * s / T); ty <= Math.min(lv.rows - 1, Math.floor(y1 * H * s / T)); ty++)
        for (let tx = Math.floor(x0 * W * s / T); tx <= Math.min(lv.cols - 1, Math.floor(x1 * W * s / T)); tx++)
          if (lv.mask[ty * lv.cols + tx] === '1') jobs.push(loadImg(tUrl(L, tx, ty)).then(im => { if (im) c.drawImage(im, PAD + (tx * T - x0 * W * s) * k, oy + (ty * T - y0 * H * s) * k, T * k + .5, T * k + .5); }));
      await Promise.all(jobs);
      c.save(); c.beginPath(); c.rect(PAD, oy, mw, mh); c.clip();
      // затемнение за границей и граница
      if (d.border.length >= 3) {
        const st = d.settings.border; c.beginPath(); c.rect(PAD, oy, mw, mh); d.border.forEach((p, i) => { const [X, Y] = P(...p); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath();
        c.fillStyle = 'rgba(5,7,4,.55)'; c.fill('evenodd');
        c.beginPath(); d.border.forEach((p, i) => { const [X, Y] = P(...p); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath();
        c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = st.width * 2 + 6; c.stroke(); c.strokeStyle = st.color; c.lineWidth = st.width * 2; c.stroke();
      }
      // сетка квадратов
      const G = gridGeo(), gp = (i, j) => { const [px, py] = gCorner(G, i, j); return P(px / W, py / H); };
      c.strokeStyle = 'rgba(233,240,200,.35)'; c.lineWidth = 1.5;
      for (let i = 0; i <= G.cols; i++) { c.beginPath(); c.moveTo(...gp(i, 0)); c.lineTo(...gp(i, G.rows)); c.stroke(); }
      for (let j = 0; j <= G.rows; j++) { c.beginPath(); c.moveTo(...gp(0, j)); c.lineTo(...gp(G.cols, j)); c.stroke(); }
      c.font = '600 22px "IBM Plex Mono", monospace'; c.fillStyle = 'rgba(233,240,200,.75)'; c.textBaseline = 'top';
      for (let i = 0; i < G.cols; i++) for (let j = 0; j < G.rows; j++) { const [X, Y] = gp(i, j); c.fillText(colName(i) + rowName(j), X + 6, Y + 5); }
      // зоны, стрелки
      pts.forEach(p => { if (p.area.length < 3) return; const col = sideColor(owner(p)); c.beginPath(); p.area.forEach((v, i) => { const [X, Y] = P(...v); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath();
        c.globalAlpha = .25; c.fillStyle = col; c.fill(); c.globalAlpha = .95; c.strokeStyle = col; c.lineWidth = 3; c.stroke(); c.globalAlpha = 1; });
      (g ? g.arrows : []).forEach(a => { const q = a.pts.map(v => P(...v)); if (q.length < 2) return; const col = paintColor(a.color), w = a.width * 2.2;
        const [ax, ay] = q[q.length - 2], [bx, by] = q[q.length - 1], ang = Math.atan2(by - ay, bx - ax), hl = Math.max(26, w * 3.4);
        c.globalAlpha = a.opacity; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); q.forEach(([X, Y], i) => { if (i === q.length - 1) { X -= hl * .8 * Math.cos(ang); Y -= hl * .8 * Math.sin(ang); } i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke();
        c.fillStyle = col; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - hl * Math.cos(ang - .45), by - hl * Math.sin(ang - .45)); c.lineTo(bx - hl * Math.cos(ang + .45), by - hl * Math.sin(ang + .45)); c.closePath(); c.fill(); c.globalAlpha = 1; });
      // подписи полигона
      d.labels.forEach(l => { const [X, Y] = P(l.x, l.y); c.globalAlpha = l.opacity; c.fillStyle = paintColor(l.color); c.font = `600 ${Math.round(l.size * 1.6)}px Oswald, "Arial Narrow", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(l.text.toUpperCase(), X, Y); c.globalAlpha = 1; });
      c.textAlign = 'left';
      const tag = (X, Y, text, col) => { c.font = '600 20px "IBM Plex Sans", Arial, sans-serif'; const w = c.measureText(text).width + 14; c.fillStyle = 'rgba(15,19,12,.88)'; c.fillRect(X - w / 2, Y, w, 28); c.strokeStyle = col; c.lineWidth = 1.5; c.strokeRect(X - w / 2, Y, w, 28); c.fillStyle = '#eef2e2'; c.textBaseline = 'middle'; c.fillText(text, X - w / 2 + 7, Y + 14); };
      // объекты полигона
      for (const p of (S.f.places ? d.places : [])) { const [X, Y] = P(p.x, p.y); c.fillStyle = 'rgba(27,31,24,.92)'; c.strokeStyle = '#a9ad9c'; c.lineWidth = 2; c.beginPath(); c.roundRect(X - 17, Y - 17, 34, 34, 7); c.fill(); c.stroke();
        const im = await svgImg(iconOf(p, 'building'), '#d7dacb', 22); if (im) c.drawImage(im, X - 11, Y - 11); tag(X, Y + 22, p.name, '#a9ad9c'); }
      // точки игры
      for (const p of pts) { const col = sideColor(owner(p)), [X, Y] = P(p.x, p.y);
        c.beginPath(); c.arc(X, Y, 24, 0, Math.PI * 2); c.fillStyle = 'rgba(14,18,12,.92)'; c.fill(); c.lineWidth = 5; c.strokeStyle = col; c.stroke();
        const im = await svgImg(iconOf(p), col, 28); if (im) c.drawImage(im, X - 14, Y - 14);
        if (changed(p) && S.phase === 'after') { c.beginPath(); c.arc(X + 19, Y - 19, 10, 0, Math.PI * 2); c.fillStyle = sideColor(p.after); c.fill(); c.lineWidth = 2; c.strokeStyle = '#000'; c.stroke(); }
        tag(X, Y + 30, p.name, col); }
      c.restore();
      // шапка
      c.fillStyle = '#151b12'; c.fillRect(0, 0, cv.width, HEAD); c.fillStyle = '#e2a23b'; c.fillRect(0, HEAD - 4, cv.width, 4);
      c.textBaseline = 'alphabetic'; c.fillStyle = '#e2a23b'; c.font = '500 26px Oswald, "Arial Narrow", sans-serif';
      const sc = curScenario();
      c.fillText((siteTitle() + (sc ? ' · ' + sc.title : '')).toUpperCase(), 36, 48);
      c.fillStyle = '#eef2e2'; c.font = '500 52px Oswald, "Arial Narrow", sans-serif';
      c.fillText((g ? g.title : 'Карта полигона').toUpperCase(), 36, 106);
      c.font = '500 26px "IBM Plex Mono", monospace'; c.textAlign = 'right'; c.fillStyle = '#98a387';
      if (g) { c.fillText(fmtDate(g.date) + (g.time ? ' · ' + g.time : ''), cv.width - 36, 52); c.fillStyle = '#e2a23b'; c.fillText(S.phase === 'before' ? 'ПОЛОЖЕНИЕ ДО ИГРЫ' : 'ПОЛОЖЕНИЕ ПОСЛЕ ИГРЫ', cv.width - 36, 104); }
      c.textAlign = 'left';
      // легенда и масштаб
      const fy = oy + mh; c.fillStyle = '#151b12'; c.fillRect(0, fy, cv.width, FOOT);
      let lx = 36; c.font = '500 24px "IBM Plex Sans", Arial, sans-serif'; c.textBaseline = 'middle';
      const cnt = id => pts.filter(p => (owner(p) || '') === id).length;
      d.sides.concat([{ id: '', name: 'Ничья', color: NOBODY }]).forEach(sd => { const n = cnt(sd.id); if (!n && sd.id === '') return;
        c.beginPath(); c.arc(lx + 11, fy + 40, 11, 0, Math.PI * 2); c.fillStyle = sd.color; c.fill();
        c.fillStyle = '#eef2e2'; const t = `${sd.name}${g ? ': ' + n : ''}`; c.fillText(t, lx + 30, fy + 41); lx += c.measureText(t).width + 70; });
      const mppOut = mpp() / (s * k), nice = [10, 20, 25, 50, 100, 200, 250, 500, 1000].find(m => m / mppOut > 160) || 1000, bw = nice / mppOut, bx = cv.width - 60 - bw;
      c.fillStyle = '#eef2e2'; c.fillRect(bx, fy + 36, bw, 8); c.fillStyle = '#e2a23b'; c.fillRect(bx, fy + 36, bw / 2, 8);
      c.font = '500 22px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.fillStyle = '#eef2e2'; c.fillText(`${nice} м`, bx + bw / 2, fy + 70);
      c.fillText('С ↑', bx - 70, fy + 40); c.textAlign = 'left';
      c.font = '400 19px "IBM Plex Sans", Arial, sans-serif'; c.fillStyle = '#6b7660';
      const cl = G.cw * mpp(); c.fillText(`Сетка: квадрат ≈ ${Math.round(cl)} м, по улитке 1–9 · ${location.host || ''}`, 36, fy + 84);
      const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      const slug = (g ? g.title : 'poligon').toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40);
      a.download = `karta-${g ? g.date + '-' : ''}${slug}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      toast('Карта скачана — её можно отправить в беседу или распечатать');
    } catch (e) { console.error(e); toast('Не удалось собрать картинку: ' + e.message, 'err'); }
    finally { btn.disabled = false; }
  }
  $('#btnBrief').onclick = makeBrief;

  /* ---------- выбор ---------- */
  function syncHash() {
    const q = new URLSearchParams();
    if (S.scId) q.set('s', S.scId); if (S.gameId && S.scId) q.set('g', S.gameId);
    if (S.pointId) q.set('p', S.pointId); if (S.placeId) q.set('o', S.placeId);
    if (S.tab === 'tour' && S.scId) { q.set('t', 'tour'); const t = curTour(); if (t) q.set('tr', t.id); }   // ссылкой на турнир можно поделиться
    try { history.replaceState(null, '', q.toString() ? '#' + q.toString() : location.pathname + location.search); } catch (e) {}
  }
  function refresh() { renderBorder(); renderHero(); renderLegend(); renderFilters(); renderMap(); applyLayers(); renderMediaView(); renderTourOverlay(); renderPanel(); syncHash(); updateAdminUi(); }
  function selectScenario(id, gameId) {
    stopPlay();
    S.scId = id || ''; S.pointId = null; S.placeId = null;
    const g = gameId ? D().games.find(x => x.id === gameId) : defaultGame(S.scId);
    S.gameId = g ? g.id : null; S.phase = g && isFuture(g) ? 'before' : 'after'; S.tab = 'game';
    refresh();
  }
  function selectGame(id) {
    stopPlay();
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
    // каждый раз свежая форма: обработчики прошлых окон не должны срабатывать в новом
    const f0 = $('#dlgForm'), f = f0.cloneNode(false); f0.replaceWith(f);
    f.innerHTML = `<header class="dlg__head"><h2>${esc(title)}</h2><button type="button" class="iconbtn" data-close aria-label="Закрыть">✕</button></header>
      <div class="dlg__body">${body}</div>
      <footer class="dlg__foot">${onDelete ? `<button type="button" class="btn danger" data-del>${esc(deleteText || 'Удалить')}</button>` : ''}<span class="sp"></span>
      <button type="button" class="btn ghost" data-close>${onSubmit ? 'Отмена' : 'Закрыть'}</button>${onSubmit ? `<button type="submit" class="btn primary">${esc(submit)}</button>` : ''}</footer>`;
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
    // первой игре сценария — расстановка по умолчанию из справочника команд
    const defSides = () => Object.fromEntries(d.sides.map(s => [s.id, { teams: d.teams.filter(t => t.side === s.id).map(t => ({ id: t.id, players: null, present: [] })), players: null }]).filter(([, v]) => v.teams.length));
    const inherit = last ? Object.fromEntries(Object.entries(last.sides).map(([k, v]) => [k, { teams: (v.teams || []).map(e => ({ id: e.id, players: null, present: [] })), players: null }])) : defSides();
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
        `<div class="fld"><span class="fld__hrow">Стороны и команды на этой игре${d.teams.some(t => t.side) ? '<button type="button" class="link" data-defteams title="Расставить команды так, как задано в «Настройки → Стороны и команды»">↺ по умолчанию</button>' : ''}</span><div class="srows">${sidesRows}</div><small>${d.teams.length ? 'На стороне может быть сколько угодно команд. Число игроков команды считается по галочкам состава, а если состава нет — впишите его. «Всего на стороне» можно оставить пустым — сложится само.' : 'Справочник команд пуст — добавьте команды в «⚙ Настройки → Стороны и команды».'}</small></div>` +
        fld('Сбор (время, место)', `<textarea name="gather" rows="2">${esc(g.gather)}</textarea>`) +
        `<div class="row2">${fld('Итог игры', `<select name="winner"><option value="" ${!g.winner ? 'selected' : ''}>Авто — у кого больше точек после игры</option>${d.sides.map(s => `<option value="${esc(s.id)}" ${g.winner === s.id ? 'selected' : ''}>Победила: ${esc(s.name)}</option>`).join('')}<option value="draw" ${g.winner === 'draw' ? 'selected' : ''}>Ничья</option></select>`, 'Для рейтинга команд и карточек')}<span></span></div>` +
        fld('Итог (текст)', `<textarea name="result" rows="3">${esc(g.result)}</textarea>`) +
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
          if (e.target.closest('[data-defteams]')) { const def = defSides();
            f.querySelectorAll('.sblock').forEach(blk => { const v = def[blk.dataset.side]; blk.querySelector('.strows').innerHTML = v ? v.teams.map(teamRowF).join('') : ''; });
            all(); toast('Команды расставлены по умолчанию'); return; }
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
          summary: fd.get('summary').trim(), gather: fd.get('gather').trim(), result: fd.get('result').trim(), photos, sides, winner: fd.get('winner') || '',
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

  /* --- стороны и команды: доска «пул → стороны» --- */
  function openSidesForm() {
    const d = D();
    const T = structuredClone(d.teams);                         // правим копию, в данные — только по «Сохранить»
    const stats = new Map(teamStats(null).map(s => [s.id, s]));
    const lastGame = id => { const l = D().games.filter(g => !isFuture(g) && Object.values(g.sides).some(v => sideEntries(v).some(e => e.id === id))).map(g => g.date).sort(); return l.length ? l[l.length - 1] : ''; };
    const open = new Set(), rOpen = new Set();   // раскрытые карточки и их составы
    const sideRow = s => `<div class="sb-side" data-id="${esc(s.id)}"><input type="color" value="${esc(s.color)}" aria-label="Цвет стороны"><input class="sb-sname" value="${esc(s.name)}" maxlength="40" required placeholder="Название" aria-label="Название стороны"><button type="button" class="sb-x" data-rmside aria-label="Убрать сторону" title="Убрать сторону">✕</button></div>`;
    const pRow = p => `<div class="prow" data-id="${esc(p.id)}"><input class="p-cs" value="${esc(p.callsign)}" maxlength="60" placeholder="Позывной" aria-label="Позывной">
        <select class="p-role" aria-label="Роль"><option value="">—</option><option value="commander" ${p.role === 'commander' ? 'selected' : ''}>Командир</option><option value="fighter" ${p.role === 'fighter' ? 'selected' : ''}>Боец</option></select>
        <input class="p-rank" value="${esc(p.rank)}" maxlength="60" placeholder="Звание" aria-label="Звание"><input class="p-phone" type="tel" value="${esc(p.phone)}" maxlength="40" placeholder="Телефон" aria-label="Телефон"><button type="button" class="iconbtn" data-rmp aria-label="Убрать игрока">✕</button></div>`;
    const logoOf = t => `<span class="sb-logo">${t.logo && safeUrl(t.logo) ? `<img src="${esc(photoSrc(t.logo, 120))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<i>${esc((t.name || '?').slice(0, 2).toUpperCase())}</i></span>`;
    const inp = (t, k, label, attrs = '') => `<label class="sb-f"><span>${label}</span><input data-k="${k}" value="${esc(t[k] || '')}" ${attrs}></label>`;
    const card = (t, sides) => {
      const st = stats.get(t.id), games = st ? st.games : 0, isOpen = open.has(t.id), last = lastGame(t.id);
      const dots = sides.filter(s => s.id !== t.side).map(s => `<button type="button" class="sb-dot" style="--c:${esc(s.color)}" data-move="${esc(s.id)}" title="На сторону: ${esc(s.name)}" aria-label="На сторону: ${esc(s.name)}"></button>`).join('') +
        (t.side ? '<button type="button" class="sb-out" data-move="" title="Вернуть в пул" aria-label="Вернуть в пул">✕</button>' : '');
      return `<div class="sb-card${isOpen ? ' open' : ''}" data-tid="${esc(t.id)}" ${isOpen ? '' : 'draggable="true"'}>
        <div class="sb-top" data-toggle>${logoOf(t)}<div class="sb-id"><b>${esc(t.name || 'Новая команда')}</b>
          <small><span title="Бойцов в составе">👤 ${t.players.length}</span><span title="Игр на полигоне">⚑ ${games} ${plural(games, 'игра', 'игры', 'игр')}</span></small></div>
          <div class="sb-acts">${dots}</div></div>
        ${isOpen ? `<div class="sb-det">
          <div class="sb-auto">${last ? `Последняя игра: <b>${esc(fmtDate(last))}</b>` : 'На полигоне ещё не играла'}${st && st.wins ? ` · побед: <b>${st.wins}</b>` : ''}</div>
          ${inp(t, 'name', 'Название', 'maxlength="60" required')}
          <div class="sb-2">${inp(t, 'captain', 'Капитан', 'maxlength="60" placeholder="позывной"')}${inp(t, 'city', 'Город', 'maxlength="60" placeholder="Севастополь"')}</div>
          <div class="sb-2">${inp(t, 'since', 'На полигоне с', 'inputmode="numeric" maxlength="4" placeholder="2021"')}${inp(t, 'vk', 'ВКонтакте', 'maxlength="300" placeholder="https://vk.com/…"')}</div>
          ${inp(t, 'logo', 'Эмблема — ссылка на картинку', 'maxlength="500" placeholder="https://drive.google.com/file/d/…"')}
          <label class="sb-f"><span>Заметка админа — гости не видят</span><textarea data-k="note" rows="2" maxlength="1000" placeholder="например: берут прокат на 2 чел.">${esc(t.note || '')}</textarea></label>
          <details class="roster" ${rOpen.has(t.id) ? 'open' : ''}><summary>Состав: <b>${t.players.length}</b> чел. <small>— видно только админу</small></summary><div class="prows">${t.players.map(pRow).join('')}</div><button type="button" class="btn ghost" data-addp>+ Игрок</button></details>
          <div class="sb-dfoot"><button type="button" class="link danger" data-rmteam>Удалить команду из справочника</button><button type="button" class="link" data-toggle>Свернуть</button></div>
        </div>` : ''}</div>`;
    };
    openDialog({
      title: 'Стороны и команды',
      body: `<div class="sb-sides"><span class="sb-lbl">Стороны</span><div class="sb-srows" id="sideRows">${d.sides.map(sideRow).join('')}</div><button type="button" class="link" id="addSide">+ сторона</button></div>
        <small class="sb-hint">Сторона по умолчанию: новая игра сама расставит команды так (если в сценарии ещё нет прошлой игры — иначе берётся состав прошлой). Перетащите карточку или нажмите цветную точку; ✕ — обратно в пул. Клик по карточке — подробности.</small>
        <div id="sbBoard"></div>
        <div class="sb-bottom"><button type="button" class="link" id="addTeam">+ Команда</button></div>
        <label class="check"><input type="checkbox" name="showRoster" ${d.settings.showRoster ? 'checked' : ''}> Показывать гостям позывные участников игр (вкладка «Команды»). Телефоны и заметки не показываются никогда.</label>`,
      onOpen: f => {
        const dlg = $('#dlg'); dlg.classList.add('dlg--sides');
        const off = () => { if (dlg.open) return; dlg.classList.remove('dlg--sides'); dlg.removeEventListener('close', off); };   // close прошлого окна приходит позже — его пропускаем
        dlg.addEventListener('close', off);
        const board = f.querySelector('#sbBoard');
        const readSides = () => [...f.querySelectorAll('#sideRows .sb-side')].map(r => ({ id: r.dataset.id, color: r.querySelector('[type=color]').value, name: r.querySelector('.sb-sname').value.trim() || 'Сторона' }));
        const tById = id => T.find(t => t.id === id);
        const render = () => {
          const sides = readSides(), ids = new Set(sides.map(s => s.id));
          T.forEach(t => { if (t.side && !ids.has(t.side)) t.side = ''; });
          const col = (sid, s) => { const list = T.filter(t => (t.side || '') === sid), ppl = list.reduce((a, t) => a + t.players.length, 0);
            return `<div class="sb-col${sid ? '' : ' sb-pool'}" data-side="${esc(sid)}" ${s ? `style="--c:${esc(s.color)}"` : ''}>
              <div class="sb-h">${s ? '<i class="sb-sq"></i>' + esc(s.name) : 'Пул команд — без стороны'}<span>${list.length} ком.${ppl ? ' · ' + ppl + ' чел.' : ''}</span></div>
              <div class="sb-list">${list.map(t => card(t, sides)).join('') || `<p class="sb-empty">${s ? 'Перетащите сюда команды' : 'Все команды расставлены'}</p>`}</div></div>`; };
          board.innerHTML = col('', null) + `<div class="sb-cols" style="--n:${Math.min(4, sides.length)}">${sides.map(s => col(s.id, s)).join('')}</div>`;
        };
        const keepRoster = cardEl => { // состав пишем в копию до перерисовки
          const t = cardEl && tById(cardEl.dataset.tid); if (!t || !cardEl.querySelector('.prows')) return;
          t.players = [...cardEl.querySelectorAll('.prow')].map(p => ({ id: p.dataset.id, callsign: p.querySelector('.p-cs').value.trim(), role: p.querySelector('.p-role').value, rank: p.querySelector('.p-rank').value.trim(), phone: p.querySelector('.p-phone').value.trim() }));
        };
        const keepAll = () => f.querySelectorAll('.sb-card.open').forEach(keepRoster);
        f.addEventListener('input', e => {
          const k = e.target.dataset && e.target.dataset.k, c = e.target.closest('.sb-card');
          if (k && c) { const t = tById(c.dataset.tid); t[k] = e.target.value; if (k === 'name') c.querySelector('.sb-id b').textContent = e.target.value || 'Новая команда'; return; }
          if (e.target.closest('#sideRows')) { clearTimeout(f._st); f._st = setTimeout(() => { keepAll(); render(); }, 250); }
        });
        f.addEventListener('click', e => {
          const mv = e.target.closest('[data-move]');
          if (mv) { keepAll(); tById(mv.closest('.sb-card').dataset.tid).side = mv.dataset.move; render(); return; }
          const tg = e.target.closest('[data-toggle]');
          if (tg) { const c = tg.closest('.sb-card'); keepAll(); open.has(c.dataset.tid) ? open.delete(c.dataset.tid) : open.add(c.dataset.tid); render(); return; }
          const rm = e.target.closest('[data-rmteam]');
          if (rm) { if (!rm.classList.contains('armed')) { rm.classList.add('armed'); rm.textContent = 'Точно удалить? Нажмите ещё раз'; return; }
            keepAll(); const id = rm.closest('.sb-card').dataset.tid; T.splice(T.findIndex(t => t.id === id), 1); open.delete(id); render(); return; }
          const rs = e.target.closest('[data-rmside]');
          if (rs) { if (f.querySelectorAll('#sideRows .sb-side').length < 2) { toast('Нужна хотя бы одна сторона', 'err'); return; } keepAll(); rs.closest('.sb-side').remove(); render(); return; }
          const rp = e.target.closest('[data-rmp]'); if (rp) { const c = rp.closest('.sb-card'); rp.closest('.prow').remove(); keepRoster(c); c.querySelector('.roster summary b').textContent = tById(c.dataset.tid).players.length; return; }
          const ap = e.target.closest('[data-addp]'); if (ap) { const box = ap.previousElementSibling; box.insertAdjacentHTML('beforeend', pRow({ id: Store.uid(), callsign: '', role: '', rank: '', phone: '' })); box.lastElementChild.querySelector('input').focus(); }
        });
        f.addEventListener('toggle', e => { const c = e.target.matches && e.target.matches('.roster') && e.target.closest('.sb-card'); if (c) e.target.open ? rOpen.add(c.dataset.tid) : rOpen.delete(c.dataset.tid); }, true);
        // перетаскивание карточек между пулом и сторонами
        let drag = null;
        f.addEventListener('dragstart', e => { const c = e.target.closest && e.target.closest('.sb-card[draggable]'); if (!c) return; drag = c.dataset.tid; c.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', drag); } catch (x) {} });
        f.addEventListener('dragend', () => { drag = null; f.querySelectorAll('.drag, .over').forEach(x => x.classList.remove('drag', 'over')); });
        f.addEventListener('dragover', e => { const col = drag && e.target.closest('.sb-col'); if (!col) return; e.preventDefault(); f.querySelectorAll('.sb-col.over').forEach(x => x !== col && x.classList.remove('over')); col.classList.add('over'); });
        f.addEventListener('drop', e => { const col = drag && e.target.closest('.sb-col'); if (!col) return; e.preventDefault(); keepAll(); tById(drag).side = col.dataset.side; drag = null; render(); });
        const palette = ['#2fbf71', '#f2a33a', '#b65cff', '#18c3c9', '#ff5fa2'];
        f.querySelector('#addSide').onclick = () => { const n = f.querySelectorAll('#sideRows .sb-side').length; f.querySelector('#sideRows').insertAdjacentHTML('beforeend', sideRow({ id: Store.uid(), name: 'Сторона ' + (n + 1), color: palette[n % palette.length] })); keepAll(); render(); f.querySelector('#sideRows .sb-side:last-child .sb-sname').select(); };
        f.querySelector('#addTeam').onclick = () => { keepAll(); const t = { id: Store.uid(), name: '', logo: '', side: '', captain: '', city: '', since: '', vk: '', note: '', players: [] }; T.push(t); open.add(t.id); render();
          const c = board.querySelector(`.sb-card[data-tid="${CSS.escape(t.id)}"]`); c.scrollIntoView({ block: 'nearest' }); c.querySelector('[data-k=name]').focus(); };
        render();
        setTimeout(() => { if (f.contains(document.activeElement)) document.activeElement.blur(); }, 0);   // без клавиатуры на телефоне сразу
      },
      onSubmit: async (fd, f) => {
        f.querySelectorAll('.sb-card.open').forEach(c => { const t = T.find(x => x.id === c.dataset.tid); if (t) t.players = [...c.querySelectorAll('.prow')].map(p => ({ id: p.dataset.id, callsign: p.querySelector('.p-cs').value.trim(), role: p.querySelector('.p-role').value, rank: p.querySelector('.p-rank').value.trim(), phone: p.querySelector('.p-phone').value.trim() })); });
        const sides = [...f.querySelectorAll('#sideRows .sb-side')].map(r => ({ id: r.dataset.id, color: r.querySelector('[type=color]').value, name: r.querySelector('.sb-sname').value.trim() }));
        if (!sides.length) { toast('Нужна хотя бы одна сторона', 'err'); return false; }
        if (sides.some(s => !s.name)) { toast('У каждой стороны должно быть название', 'err'); return false; }
        const noName = T.find(t => !String(t.name).trim()); if (noName) { toast('У каждой команды должно быть название', 'err'); return false; }
        const since = T.find(t => t.since && !/^\d{4}$/.test(String(t.since).trim())); if (since) { toast(`«${since.name}»: год — четыре цифры, например 2021`, 'err'); return false; }
        const vk = T.find(t => t.vk && !/^(https?:\/\/|vk\.com\/)/i.test(t.vk.trim())); if (vk) { toast(`«${vk.name}»: ссылка ВК должна начинаться с https://`, 'err'); return false; }
        D().sides = sides;
        D().settings.showRoster = !!fd.get('showRoster');
        D().teams = T.map(t => Object.assign({}, t, { name: String(t.name).trim(), logo: String(t.logo || '').trim(), captain: String(t.captain || '').trim(), city: String(t.city || '').trim(), since: String(t.since || '').trim(),
          vk: (v => v && /^vk\.com\//i.test(v) ? 'https://' + v : v)(String(t.vk || '').trim()), note: String(t.note || '').trim(),
          side: sides.some(s => s.id === t.side) ? t.side : '', players: t.players.filter(p => p.callsign || p.rank || p.phone) }));
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
          <label class="check"><input type="checkbox" name="carousel" ${site.carousel !== false ? 'checked' : ''}> Карусель эмблем команд в шапке — между названием и соцсетями</label>
          <p class="hint">Эмблемы берутся из справочника команд: «⚙ Настройки → Стороны и команды», поле «Эмблема» (ссылка Google Drive или на картинку). Команды без эмблемы в карусель не попадают. ${D().teams.filter(t => t.logo).length} из ${D().teams.length} команд с эмблемой.</p>
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
        D().settings.site = { title: fd.get('siteTitle').trim(), logo, carousel: !!fd.get('carousel') };
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
          <div class="row2">${fld('Буквы по горизонтали', `<input name="gcl" maxlength="200" value="${esc((g.colLabels || [...COLS].slice(0, g.cols)).join(' '))}" autocomplete="off" spellcheck="false">`, 'Через пробел, в любом порядке — например «Д Б А Г В». Сколько букв — столько столбцов.')}
            ${fld('Цифры по вертикали', `<input name="grl" maxlength="200" value="${esc((g.rowLabels || Array.from({ length: g.rows }, (_, j) => j + 1)).join(' '))}" autocomplete="off" spellcheck="false">`, 'Через пробел, в любом порядке — например «7 3 9 1 5». Сколько цифр — столько строк.')}</div>
          <div class="admin-actions wrap"><button type="button" class="btn ghost" id="gShuffle">🔀 Перемешать</button><button type="button" class="btn ghost" id="gOrder">↺ По порядку</button></div>
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
        const toks = (t, max, n) => String(t || '').split(/[\s,;]+/).map(x => x.trim().toUpperCase().slice(0, n)).filter(Boolean).slice(0, max);
        const defC = c => [...COLS].slice(0, c), defR = r => Array.from({ length: r }, (_, j) => String(j + 1));
        const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
        const read = () => {
          const v = k => f.querySelector(`[name=${k}]`).value;
          const cl = toks(v('gcl'), 25, 3), rl = toks(v('grl'), 50, 4);
          const cols = cl.length || Math.min(25, Math.max(1, Math.round(+v('cols')) || 1)), rows = rl.length || Math.min(50, Math.max(1, Math.round(+v('rows')) || 1));
          const sq = f.querySelector('[name=square]').checked, cw = Math.max(1, +v('cw') || 1);
          return { cols, rows, colLabels: cl.length && !same(cl, defC(cl.length)) ? cl : null, rowLabels: rl.length && !same(rl, defR(rl.length)) ? rl : null,
            cw, ch: sq ? cw : Math.max(1, +v('ch') || 1), angle: +v('angle') || 0, square: sq, x: (+v('ox') || 0) / m / W, y: (+v('oy') || 0) / m / H };
        };
        // подписи задают число клеток; число клеток без подписей — подписи по порядку
        const syncCounts = () => { const cl = toks(f.querySelector('[name=gcl]').value, 25, 3), rl = toks(f.querySelector('[name=grl]').value, 50, 4);
          if (cl.length) f.querySelector('[name=cols]').value = cl.length; if (rl.length) f.querySelector('[name=rows]').value = rl.length; };
        f.addEventListener('input', e => {
          if (e.target.name === 'gcl' || e.target.name === 'grl') syncCounts();
          if (e.target.name === 'cols') { const c = Math.min(25, Math.max(1, +e.target.value || 1)), cl = toks(f.querySelector('[name=gcl]').value, 25, 3); f.querySelector('[name=gcl]').value = (cl.length && cl.length >= c ? cl.slice(0, c) : cl.concat(defC(c).filter(x => !cl.includes(x))).slice(0, c)).join(' '); }
          if (e.target.name === 'rows') { const r = Math.min(50, Math.max(1, +e.target.value || 1)), rl = toks(f.querySelector('[name=grl]').value, 50, 4); f.querySelector('[name=grl]').value = (rl.length && rl.length >= r ? rl.slice(0, r) : rl.concat(defR(r).filter(x => !rl.includes(x))).slice(0, r)).join(' '); }
        }, true);
        const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
        f.querySelector('#gShuffle').onclick = () => { const g2 = read(); f.querySelector('[name=gcl]').value = shuffle(g2.colLabels || defC(g2.cols)).join(' '); f.querySelector('[name=grl]').value = shuffle(g2.rowLabels || defR(g2.rows)).join(' '); S.gridEdit = read(); buildGrid(); };
        f.querySelector('#gOrder').onclick = () => { const g2 = read(); f.querySelector('[name=gcl]').value = defC(g2.cols).join(' '); f.querySelector('[name=grl]').value = defR(g2.rows).join(' '); S.gridEdit = read(); buildGrid(); };
        f._readGrid = read;
        // живой предпросмотр сетки при вводе чисел
        f.addEventListener('input', e => { if (['gcl', 'grl', 'cols', 'rows', 'cw', 'ch', 'angle', 'ox', 'oy', 'square'].includes(e.target.name)) { S.gridEdit = read(); buildGrid(); } });
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
        const ng = f._readGrid(), dup = l => l && l.find((x, i) => l.indexOf(x) !== i);
        if (dup(ng.colLabels)) { toast(`Буква повторяется: ${dup(ng.colLabels)}`, 'err'); return false; }
        if (dup(ng.rowLabels)) { toast(`Цифра повторяется: ${dup(ng.rowLabels)}`, 'err'); return false; }
        D().settings.grid = ng; S.gridEdit = null;
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
        (D().settings.rental.items.length ? rentalPicker() : fld('Нужен прокат?', '<select name="rent"><option value="">Нет, своё снаряжение</option><option>Да, нужен прокат</option><option>Частично, уточню</option></select>')) +
        fld('Комментарий', '<textarea name="comment" rows="3" maxlength="500" placeholder="Опыт игры, вопросы организаторам…"></textarea>') +
        `<div class="fld" id="msgBox" hidden><span>Текст заявки</span><textarea id="msgText" rows="6" readonly></textarea><small>Если ВКонтакте не открылся или текст не вставился — скопируйте его отсюда. Ссылка: <a href="${esc(vk)}" target="_blank" rel="noopener">${esc(vk.replace('https://', ''))}</a></small></div>`,
      onOpen: f => {
        const box = f.querySelector('#rentBox'); if (!box) return;
        const upd = () => { const { out, sum } = rentalRead(f); f.querySelector('#rentTot').textContent = rub(sum);
          box.querySelectorAll('.rent__i').forEach(l => l.classList.toggle('on', l.querySelector('.rent-c').checked)); box.classList.toggle('has', out.length > 0); };
        box.addEventListener('input', e => { if (e.target.classList.contains('rent-q')) { const c = e.target.closest('.rent__i').querySelector('.rent-c'); if (!c.checked) c.checked = true; } upd(); });
        box.addEventListener('change', upd); upd();
      },
      onSubmit: async (fd, f) => {
        const clean = v => String(v || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
        const lines = [`Заявка на игру «${g.title}»${sc ? ` (${sc.title})` : ''}`, `Дата: ${fmtDate(fd.get('date'))}`, `Имя: ${clean(fd.get('name'))}`, `Человек: ${Math.max(1, +fd.get('count') || 1)}`];
        if (fd.get('team')) lines.push(`Сторона: ${clean(fd.get('team'))}`);
        if (fd.get('rent')) lines.push(`Прокат: ${clean(fd.get('rent'))}`);
        if (f.querySelector('#rentBox')) { const { out, sum } = rentalRead(f);
          lines.push(out.length ? 'Прокат:\n' + out.map(({ i, q }) => `— ${i.name}${q > 1 ? ' ×' + q : ''}${i.price != null ? ' — ' + rub(i.price * q) : ''}`).join('\n') + (sum ? `\nИтого прокат: ${rub(sum)}` : '') : 'Прокат: не нужен'); }
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
    const role = store.role ? store.role() : (on ? 'admin' : ''), sb = store.mode === 'supabase';
    $('#btnLogin').classList.toggle('on', !!role);
    $('#btnLogin').hidden = sb ? false : !(on || wantsAdmin());   // с базой вход виден всем: игроки и командиры тоже входят
    $('#btnLogin').title = role ? `Аккаунт: ${ROLE_RU[role] || role}` : sb ? 'Войти или зарегистрироваться' : 'Вход для админа';
    $('#btnLive').hidden = !['player', 'commander'].includes(role);
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
    if (store.mode === 'supabase' && store.role()) return openAccount();
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
  /* ================================================================
     АККАУНТЫ: вход и регистрация для всех. Роль выдаёт админ в «Людях».
     ================================================================ */
  const ROLE_RU = { admin: 'админ', commander: 'командир', player: 'игрок', pending: 'заявка на рассмотрении', blocked: 'доступ отключён' };
  const WISH = [['player', 'Игрок', 'видит лайф-карту и отмечает себя'], ['commander', 'Командир', 'приказы и маршруты на лайф-карте'], ['admin', 'Админ', 'ведёт игры и сайт']];
  const teamOpts = sel => `<option value="">— без команды —</option>` + D().teams.slice().sort((a, b) => a.name.localeCompare(b.name, 'ru')).map(t => `<option value="${esc(t.id)}" ${sel === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  /** Вход через Supabase: логин (или почта админа) и пароль; вкладка «Регистрация» — заявка. */
  function openLoginSb(mode = 'in') {
    const up = mode === 'up';
    openDialog({
      title: up ? 'Регистрация' : 'Вход', submit: up ? 'Отправить заявку' : 'Войти',
      body: `<div class="acc-tabs"><button type="button" class="${up ? '' : 'on'}" data-mode="in">Вход</button><button type="button" class="${up ? 'on' : ''}" data-mode="up">Регистрация</button></div>` +
        (up ? fld('Логин', '<input name="login" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_.\\-]{3,24}" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="sokol">', 'Латинские буквы, цифры, точка, _ и −. Им вы будете входить.') +
          fld('Пароль', '<input type="password" name="pass" required minlength="6" autocomplete="new-password">', 'Не короче 6 знаков. Забудете — админ задаст новый.') +
          fld('Позывной на карте', '<input name="callsign" required maxlength="24" placeholder="Сокол">') +
          fld('Команда', `<select name="team">${teamOpts('')}</select>`) +
          `<div class="fld"><span>Кем хотите быть</span><div class="acc-wish">${WISH.map(([k, n, d], i) => `<label><input type="radio" name="wish" value="${k}" ${i ? '' : 'checked'}><span><b>${n}</b><small>${d}</small></span></label>`).join('')}</div><small>Права даёт админ — до этого будет «заявка на рассмотрении».</small></div>`
        : fld('Логин', '<input name="login" required autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="логин или почта админа">') +
          fld('Пароль', '<input type="password" name="pass" required autocomplete="current-password">') +
          `<div class="note">Нет аккаунта? Откройте вкладку «Регистрация». Забыли пароль — напишите админу, он задаст новый.</div>`),
      onOpen: f => f.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => openLoginSb(b.dataset.mode)),
      onSubmit: async fd => {
        try {
          if (up) await store.signUp({ login: fd.get('login').trim(), password: fd.get('pass'), callsign: fd.get('callsign').trim(), team: fd.get('team') || '', wish: fd.get('wish') || 'player' });
          else await store.signIn(fd.get('login').trim(), fd.get('pass'));
        } catch (e) {
          const m = String(e.message || e);
          toast(/not confirmed/i.test(m) ? 'Аккаунт не подтверждён. Админу: в Supabase выключить «Confirm email» и выполнить supabase/confirm-users.sql'
            : /invalid|credentials/i.test(m) ? 'Неверный логин или пароль'
            : /sending|confirmation email|smtp|rate limit/i.test(m) ? 'Supabase пытается отправить письмо. Админу: выключить «Confirm email» (Authentication → Sign In / Providers) и нажать Save'
            : /database error/i.test(m) ? 'Ошибка базы при регистрации. Админу: выполнить supabase/accounts.sql в Supabase'
            : m, 'err');
          return false;
        }
        if (store.canWrite()) { await afterSbLogin(); return; }
        await reload(); const a = store.account() || {};
        toast(up ? 'Заявка отправлена. Когда админ выдаст роль — появится доступ' : `Вы вошли: ${a.callsign || a.login} · ${ROLE_RU[store.role()] || ''}`);
      }
    });
  }
  /** Окно аккаунта: кто я, лайф-карта, позывной и команда, пароль, выход. */
  function openAccount() {
    const a = store.account() || {}, role = store.role(), team = teamById(a.team);
    openDialog({
      title: 'Аккаунт',
      body: `<div class="acc-me"><div class="acc-av">${esc((a.callsign || a.login || '?').slice(0, 1).toUpperCase())}</div><div><b>${esc(a.callsign || a.login || store.who())}</b>
          <small>${esc(a.login ? 'логин ' + a.login : store.who())}${team ? ' · ' + esc(team.name) : ''}</small></div><span class="acc-role acc-role--${esc(role)}">${esc(ROLE_RU[role] || role)}</span></div>
        ${role === 'pending' ? `<div class="note">Заявка отправлена${a.wish ? ` (хотите быть: <b>${esc((WISH.find(w => w[0] === a.wish) || [, a.wish])[1])}</b>)` : ''}. Когда админ выдаст роль, здесь появится лайф-карта. Можно обновить: «Проверить».</div>` : ''}
        ${role === 'blocked' ? '<div class="note">Доступ отключён админом.</div>' : ''}
        <div class="acc-acts">${['player', 'commander', 'admin'].includes(role) ? '<button type="button" class="btn primary" data-a="live">◉ Лайф-карта</button>' : ''}
          ${role === 'pending' ? '<button type="button" class="btn" data-a="check">↻ Проверить</button>' : ''}
          ${role === 'admin' ? '<button type="button" class="btn" data-a="people">Люди: роли и пароли</button>' : ''}
          <button type="button" class="btn" data-a="prof">Позывной и команда</button><button type="button" class="btn" data-a="pass">Сменить пароль</button><button type="button" class="btn danger" data-a="out">Выйти</button></div>`,
      onOpen: f => f.addEventListener('click', async e => {
        const b = e.target.closest('[data-a]'); if (!b) return; const k = b.dataset.a;
        if (k === 'live') { $('#dlg').close(); openLiveFor(); }
        if (k === 'check') { await store.refreshProfile(); await reload(); $('#dlg').close(); openAccount(); toast(store.role() === 'pending' ? 'Пока на рассмотрении' : 'Роль: ' + ROLE_RU[store.role()]); }
        if (k === 'people') { $('#dlg').close(); openPeople(); }
        if (k === 'prof') { $('#dlg').close(); openProfileForm(); }
        if (k === 'pass') { $('#dlg').close(); openPassSb(); }
        if (k === 'out') { $('#dlg').close(); if (S.live) exitLive(true); await store.signOut(); ls.set('pm-admin', false); await reload(); toast('Вы вышли'); }
      })
    });
  }
  function openProfileForm(done) {
    const a = store.account() || {};
    openDialog({
      title: 'Позывной и команда',
      body: fld('Позывной на карте', `<input name="callsign" required maxlength="24" value="${esc(a.callsign || '')}">`) +
        `<div class="fld"><span>Мой значок на карте — эмблема команды</span><div class="pf-teams">${D().teams.slice().sort((x, y) => x.name.localeCompare(y.name, 'ru')).map(t => `<label class="pf-tm"><input type="radio" name="team" value="${esc(t.id)}" ${a.team === t.id ? 'checked' : ''}><span>${lvEmblem({ t, color: '#c3c4b2' })}<b>${esc(t.name)}</b></span></label>`).join('')}
          <label class="pf-tm"><input type="radio" name="team" value="" ${a.team ? '' : 'checked'}><span><span class="lv-em" style="--c:#888780"><i>—</i></span><b>без команды</b></span></label></div>
          <small>Эмблема берётся из справочника команд. Если ваша команда стоит в игре на стороне — рамка будет цвета этой стороны.</small></div>`,
      onSubmit: async fd => { await store.updateMe(fd.get('callsign').trim(), fd.get('team') || ''); await store.refreshProfile(); updateAdminUi(); toast('Сохранено');
        if (S.live && !S.live.viewer) { const me = LVrow().get('me:' + lvMeKey()); if (me && !me.gone) { const a2 = store.account() || {}; lvPut('me', me.id, Object.assign({}, me.data, { team: a2.team || '', name: lvName() })); } }
        if (done) done(); }
    });
  }
  /** Лайф-карта для игрока и командира: ближайшая игра (или та, что в анонсе). */
  function liveDefaultGame() {
    const gs = D().games.filter(g => !isMedia(g)), f = featuredGame();
    if (f && !isMedia(f)) return f;
    const up = gs.filter(g => g.date >= today()).sort((a, b) => a.date.localeCompare(b.date))[0];
    return up || gs.slice().sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  }
  function openLiveFor() {
    const role = store.role();
    if (role === 'admin' || role === 'commander') return openLiveStart();
    const g = liveDefaultGame(); if (!g) { toast('Пока нет игры с картой', 'err'); return; }
    enterLive({ game: g.id });
  }
  /** «Люди»: заявки и активные аккаунты — роль, команда, новый пароль, отключить. */
  async function openPeople() {
    let list = [];
    try { list = await store.people.list(); } catch (e) { toast(/function|404/.test(e.message) ? 'Выполните supabase/accounts.sql в Supabase' : e.message, 'err'); return; }
    const me = (store.account() || {}).uid;
    const roleSel = p => p.fixed ? '<span class="acc-role acc-role--admin">админ (site_admins)</span>' : `<select data-role>${['player', 'commander', 'admin', 'blocked', 'pending'].map(r => `<option value="${r}" ${p.role === r ? 'selected' : ''}>${ROLE_RU[r]}</option>`).join('')}</select>`;
    const row = p => { const t = teamById(p.team);
      return `<div class="ppl" data-uid="${esc(p.uid)}"><div class="ppl__who"><b>${esc(p.callsign || p.login)}</b><small>${esc(p.login)}${t ? ' · ' + esc(t.name) : ''}${p.role === 'pending' && p.wish ? ` · хочет: <b>${esc((WISH.find(w => w[0] === p.wish) || [, p.wish])[1])}</b>` : ''}${p.last_sign_in_at ? ' · был ' + esc(new Date(p.last_sign_in_at).toLocaleDateString('ru-RU')) : ''}</small></div>
        ${p.role === 'pending' ? `<div class="ppl__acts"><button type="button" class="btn primary" data-ok="${esc(p.wish || 'player')}">✓ ${esc((WISH.find(w => w[0] === p.wish) || [, 'Игрок'])[1])}</button>${roleSel(p)}<button type="button" class="btn danger" data-no>✕</button></div>`
        : `<div class="ppl__acts">${p.uid === me ? '<span class="acc-role acc-role--admin">это вы</span>' : roleSel(p)}<select data-team>${teamOpts(p.team)}</select><button type="button" class="btn" data-pw title="Задать новый пароль">🔑</button></div>`}
        <div class="ppl__pw" hidden><input type="text" data-np minlength="6" maxlength="40" placeholder="новый пароль, от 6 знаков" autocomplete="off"><button type="button" class="btn primary" data-pwok>Задать</button></div></div>`; };
    const pend = list.filter(p => p.role === 'pending'), act = list.filter(p => p.role !== 'pending' && p.role !== 'blocked'), off = list.filter(p => p.role === 'blocked');
    openDialog({
      title: `Люди · ${list.length}`,
      body: `<div class="note">Пароли не видны никому — они хранятся зашифрованными. Забыл пароль — нажмите 🔑, задайте новый и скажите человеку; он может сменить его на свой в «Аккаунте».</div>
        ${pend.length ? `<div class="sec__t">Заявки · ${pend.length}</div>${pend.map(row).join('')}` : ''}
        <div class="sec__t">Активные · ${act.length}</div>${act.map(row).join('') || '<p class="hint">Пока никого.</p>'}
        ${off.length ? `<div class="sec__t">Отключены · ${off.length}</div>${off.map(row).join('')}` : ''}`,
      onOpen: f => {
        const save = async (el, patch) => { const r = el.closest('[data-uid]'), p = list.find(x => x.uid === r.dataset.uid); Object.assign(p, patch);
          try { await store.people.set(p.uid, p.role, p.team, p.callsign); toast(`${p.callsign || p.login}: ${ROLE_RU[p.role]}`); } catch (e) { toast(/self_demote/.test(e.message) ? 'Себя разжаловать нельзя' : e.message, 'err'); } };
        f.addEventListener('change', e => { if (e.target.matches('[data-role]')) save(e.target, { role: e.target.value }); if (e.target.matches('[data-team]')) save(e.target, { team: e.target.value }); });
        f.addEventListener('click', async e => {
          const ok = e.target.closest('[data-ok]'); if (ok) { await save(ok, { role: ok.closest('[data-uid]').querySelector('[data-role]').value === 'pending' ? ok.dataset.ok : ok.closest('[data-uid]').querySelector('[data-role]').value }); $('#dlg').close(); openPeople(); return; }
          const no = e.target.closest('[data-no]'); if (no) { await save(no, { role: 'blocked' }); $('#dlg').close(); openPeople(); return; }
          const pw = e.target.closest('[data-pw]'); if (pw) { const b = pw.closest('[data-uid]').querySelector('.ppl__pw'); b.hidden = !b.hidden; if (!b.hidden) b.querySelector('input').focus(); return; }
          const po = e.target.closest('[data-pwok]');
          if (po) { const r = po.closest('[data-uid]'), v = r.querySelector('[data-np]').value; if (v.length < 6) { toast('Пароль — от 6 знаков', 'err'); return; }
            try { await store.people.password(r.dataset.uid, v); r.querySelector('.ppl__pw').hidden = true; toast(`Новый пароль задан: ${v} — скажите его человеку`); } catch (err) { toast(err.message, 'err'); } }
        });
      }
    });
  }
  /** Админу при входе: есть ли новые заявки. */
  async function peopleNotice() {
    if (store.mode !== 'supabase' || !store.canWrite() || !store.people) return;
    try { const n = (await store.people.list()).filter(p => p.role === 'pending').length; if (n) toast(`Новые заявки: ${n} — «Ещё → Люди»`); } catch (e) {}
  }
  async function afterSbLogin() {
    await reload();
    if (store.isEmpty()) { // первая настройка: переносим data/games.json в базу
      try { await store.save(); refresh(); toast('База была пустой — данные из games.json перенесены в неё'); } catch (e) { toast('Не удалось перенести данные в базу: ' + e.message, 'err'); }
    } else { setTimeout(peopleNotice, 3500); const m = store.meta(); toast(`Вы вошли как ${store.who()}${m.by ? `. Последнее изменение: ${m.by}, ${new Date(m.at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}`); }
  }
  function openPassSb() {
    openDialog({
      title: 'Сменить мой пароль', submit: 'Сменить',
      body: `<p class="hint">Аккаунт: <b>${esc(store.who())}</b></p>` + fld('Новый пароль', '<input type="password" name="p1" required minlength="6" autocomplete="new-password">') + fld('Ещё раз', '<input type="password" name="p2" required minlength="6" autocomplete="new-password">'),
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
  $('#btnLive').onclick = openLiveFor;
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
  $('#admLive').onclick = () => { closeMenu(); openLiveStart(); };
  $('#admPeople').onclick = () => { closeMenu(); if (store.mode !== 'supabase') { toast('Аккаунты работают только с базой Supabase', 'err'); return; } openPeople(); };
  $('#admHero').onclick = () => { closeMenu(); openHeroForm(null); };
  $('#admPass').onclick = () => { closeMenu(); openPassForm(); };
  mi('#admExport', exportJson);
  mi('#admCheck', () => showIssues(false));
  mi('#admRental', openRentalForm); mi('#admFaq', openFaqForm); mi('#admFooter', openFooterForm);
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
  $('#admLogout').onclick = async () => { closeMenu(); stopMode(); if (S.live) exitLive(true); await store.signOut(); ls.set('pm-admin', false); await reload(); toast('Вы вышли из режима админа'); };

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
     ЛАЙФ-КАРТА: живая карта админов во время игры.
     Точки игры (можно двигать и менять владельца, есть замок), метки
     «я тут», «иду сюда», «приказ», «противник», «медик». Всё уходит в базу
     (supabase/live.sql) и раз в несколько секунд подтягивается у всех.
     Зрители открывают ссылку ?live=… — только смотрят.
     ================================================================ */
  const LV_ORDERS = ['Штурм', 'Держать', 'Отход', 'Сбор', 'Ждать'];
  /** Виды маршрутов: подпись, цвет по умолчанию и рисунок линии (видно разницу даже при одном цвете). */
  const LV_RT = {
    go:      { n: 'Иду',      c: '#79b8ff', dash: '9 7' },
    order:   { n: 'Приказ',   c: '#ffd166', dash: null },
    group:   { n: 'Группа',   c: '#6fd14a', dash: '16 6' },
    retreat: { n: 'Отход',    c: '#ff9f43', dash: '2 7' },
    recon:   { n: 'Разведка', c: '#c48bff', dash: '1 6' },
    patrol:  { n: 'Патруль',  c: '#18c3c9', dash: '12 5 2 5' },
    enemy:   { n: 'Противник идёт', c: '#ef5a42', dash: '4 5' }
  };
  const LV_MSG = ['Иди ко мне', 'Держи позицию', 'Отходи', 'Выйди на связь', 'Жди здесь'];
  const LV_COLORS = ['#79b8ff', '#ef5a42', '#6fd14a', '#ffd166', '#ff9f43', '#c48bff', '#18c3c9', '#ffffff'];
  const LV_SHOW = { me: 'Админы и командиры', guest: 'Игроки и гости', route: 'Маршруты', order: 'Приказы', enemy: 'Противник', medic: 'Медик' };
  /** Свои настройки вида на этом телефоне (другим админам не мешают). */
  const lvPref = () => { const d = { show: { me: true, route: true, order: true, enemy: true, medic: true }, ptOp: 1, hidden: [], list: false, listAll: false, compass: false, rt: 'go', rc: {} };
    const v = ls.get('pm-live-ui', null); return Object.assign(d, v && typeof v === 'object' ? v : {}, { show: Object.assign(d.show, v && v.show || {}) }); };
  const lvPrefSet = patch => { const v = Object.assign(lvPref(), patch); ls.set('pm-live-ui', v); return v; };
  const LV_ENEMY_TTL = 10 * 60e3, LV_STALE = 3 * 60e3, LV_OLD = 10 * 60e3, LV_POLL = 3000, LV_POLL_VIEW = 5000;
  const LV_ICON = {
    me: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="currentColor"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    enemy: '<svg viewBox="0 0 24 24"><path d="M12 4C7 4 3 12 3 12s4 8 9 8 9-8 9-8-4-8-9-8z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
    medic: '<svg viewBox="0 0 24 24"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill="currentColor"/></svg>',
    order: '<svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-2 4 2 4H5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    go: '<svg viewBox="0 0 24 24"><path d="M5 19L19 5M9 5h10v10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
  };
  let liveLayer = null, lvTick = 0;
  const LVrow = () => S.live && S.live.rows;
  const lvNow = () => Date.now() + (S.live ? S.live.skew : 0);
  const lvAge = r => Math.max(0, lvNow() - Date.parse(r.updated_at));
  const lvAgo = ms => ms < 45e3 ? 'сейчас' : ms < 3600e3 ? Math.round(ms / 60e3) + ' мин' : Math.floor(ms / 3600e3) + ' ч ' + Math.round(ms % 3600e3 / 60e3) + ' мин';
  /* Кто я на лайф-карте: admin / commander / player (по аккаунту) или guest (по ссылке). */
  const lvAcc = () => S.live && (S.live.role === 'player' || S.live.role === 'commander') ? store.account() : null;
  const lvAdmin = () => !!S.live && S.live.role === 'admin';
  /** Ключ «моих» меток: у игрока и командира — аккаунт (один на все его телефоны), у админа и гостя — этот браузер. */
  const lvDevice = () => { const a = lvAcc(); if (a && a.uid) return 'u' + String(a.uid).replace(/-/g, ''); let d = ls.get('pm-dev', ''); if (!d) { d = Store.uid(); ls.set('pm-dev', d); } return d; };
  const lvMeKey = () => lvDevice();   // «я тут» — одна метка на телефон: даже под общим входом двое админов не затрут друг друга
  const lvWhere = (x, y) => { const { sq, snail, out } = squareOf(x, y); return out ? 'вне сетки' : `${sq}-${snail}`; };
  const lvMeters = (a, b) => Math.hypot((a.x - b.x) * W, (a.y - b.y) * H) * mpp();
  /** Экран → доли подложки и обратно по привязке к местности (для GPS). */
  function geoToXY(lat, lng) {
    if (!relief || !relief.bounds) return null;
    const b = relief.bounds; return { x: (lng - b.nw[1]) / (b.se[1] - b.nw[1]), y: (lat - b.nw[0]) / (b.se[0] - b.nw[0]) };
  }

  /** Окно «Лайф-карта»: какая игра и под каким позывным. */
  function openLiveStart() {
    const d = D(), games = d.games.filter(g => !isMedia(g)).slice().sort((a, b) => b.date.localeCompare(a.date));
    if (!games.length) { toast('Сначала создайте игру с картой', 'err'); return; }
    const near = games.filter(g => g.date >= today()).pop();
    const def = (curGame() && !isMedia(curGame()) && curGame()) || near || games[0];
    const acc = store.account && store.account();
    const name = ls.get('pm-live-name', '') || (acc && (acc.callsign || acc.login)) || (store.live.who() && store.live.who() !== 'local' ? store.live.who().split('@')[0] : '');
    openDialog({
      title: 'Лайф-карта', submit: 'Открыть',
      body: fld('Игра', `<select name="game">${games.map(g => { const sc = scById(g.scenarioId); return `<option value="${esc(g.id)}" ${g.id === def.id ? 'selected' : ''}>${esc(fmtDate(g.date))} — ${esc(g.title)}${sc ? ' · ' + esc(sc.title) : ''}</option>`; }).join('')}</select>`) +
        fld('Ваш позывной на карте', `<input name="name" maxlength="24" required value="${esc(name)}" placeholder="Кэп" autocomplete="nickname">`, 'Его видят другие админы и те, с кем вы поделитесь ссылкой.') +
        `<div class="note">Живая карта для админов во время игры. Точки игры подтягиваются сами, их можно двигать и менять владельца — опубликованная карта игры от этого не меняется, пока вы сами не нажмёте «Перенести итог в игру».<br><br>
          <b>Двойное нажатие</b> по карте — «я тут». <b>Долгое нажатие</b> (или правая кнопка мыши) — меню: иду сюда, приказ, противник, медик.
          ${store.live.shared ? '' : '<br><br><b style="color:var(--amber)">Сайт работает без базы:</b> метки видны только в этом браузере. Для работы вдвоём с разных телефонов нужна база Supabase и файл supabase/live.sql.'}</div>`,
      onSubmit: async fd => { ls.set('pm-live-name', fd.get('name').trim()); enterLive({ game: fd.get('game') }); }
    });
  }

  function enterLive({ game, token }) {
    if (S.live) exitLive(true);
    stopMode(); stopPlay && S.play && stopPlay(true);
    const role = token ? 'guest' : store.role(), viewer = role === 'guest' || role === 'player';   // игрок и гость только отмечают себя
    let queue = []; try { queue = JSON.parse(ls.get('pm-live-q', '[]')) || []; } catch (e) { queue = []; }
    if (viewer) queue = queue.filter(q => q.guest);   // админские метки из очереди игрок/гость отправить не может
    S.live = { game: game || null, viewer, role, token: token || '', rows: new Map(), since: null, skew: 0, lockAll: true, queue, online: null, lastOk: 0, timer: 0, gps: null, err: '', busy: false };
    document.body.classList.add('live-on'); app.classList.add('live');
    if (game) lvSelectGame(game);
    if (!liveLayer) { map.createPane('live').style.zIndex = 640; liveLayer = L.layerGroup().addTo(map); } else liveLayer.addTo(map);
    map.doubleClickZoom.disable(); map.options.inertia = false;   // карта не «уезжает» после свайпа
    S.live.wantFs = false;   // полный экран — только кнопкой ⛶ (сам он сдвигал карту вниз)
    lvApplyOp(); if (lvPref().compass) setTimeout(() => S.live && lvCompass(true), 0);
    lvWake(); lvMapLock(!!ls.get('pm-live-maplock', false), true);
    lvUi(); setTimeout(() => { map.invalidateSize(); setRot(0); lvFit(); }, 30);
    lvPoll(); lvSchedule();
    clearInterval(lvTick); lvTick = setInterval(() => { if (S.live) { lvRenderMarks(); lvStatus(); } }, 15000);
    document.addEventListener('visibilitychange', lvVis);
  }
  function exitLive(silent) {
    const L_ = S.live; if (!L_) return;
    clearTimeout(L_.timer); clearInterval(lvTick); lvGpsStop();
    document.removeEventListener('visibilitychange', lvVis);
    lvSheetClose(); lvDrawStop(); lvMapLock(false, true);
    if (L_.compassFn) { removeEventListener('deviceorientationabsolute', L_.compassFn); removeEventListener('deviceorientation', L_.compassFn); }
    clearTimeout(L_.compassT); setRot(0);
    S.live = null; lvApplyOp(); map.closePopup();
    if (lvWakeLock) { lvWakeLock.release().catch(() => {}); lvWakeLock = null; }
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    document.body.classList.remove('live-on'); app.classList.remove('live');
    const ui = $('#liveUi'); if (ui) ui.remove();
    if (liveLayer) liveLayer.clearLayers();
    map.doubleClickZoom.enable(); map.options.inertia = true;
    if (L_.viewer) { const u = new URL(location.href); u.searchParams.delete('live'); history.replaceState(null, '', u.pathname + u.search + location.hash); }
    setTimeout(() => map.invalidateSize(), 30);
    if (!silent) refresh();
  }
  const lvVis = () => { if (S.live && !document.hidden) { lvPoll(); lvSchedule(); lvWake(); } };

  /* ---------- полный экран, экран не гаснет, карта на замке ---------- */
  const lvFsCan = () => !!(document.documentElement.requestFullscreen && document.fullscreenEnabled);
  const lvStandalone = () => matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
  function lvFsOn() {
    if (!lvFsCan() || document.fullscreenElement) return;
    return document.documentElement.requestFullscreen({ navigationUI: 'hide' })
      .then(() => { if (S.live && S.live.oriWant) lvOriLock(S.live.oriWant, true); })   // после разблокировки телефона — снова закрепить, как было
      .catch(() => {});
  }
  /* Ориентация экрана: по умолчанию поворачивается вместе с телефоном. Кнопка «закрепить» фиксирует
     текущее положение (чтобы при ходьбе экран не переворачивался). Браузер разрешает это только в полном экране (Android). */
  const lvOriType = () => (screen.orientation && screen.orientation.type) || (matchMedia('(orientation: landscape)').matches ? 'landscape-primary' : 'portrait-primary');
  async function lvOriLock(type, quiet) {
    const L_ = S.live; if (!L_) return;
    if (!(screen.orientation && screen.orientation.lock)) { if (!quiet) toast('Этот телефон не даёт сайту закрепить поворот — включите блокировку поворота в шторке телефона', 'err'); return; }
    try {
      if (!document.fullscreenElement) { L_.wantFs = true; await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); }
      await screen.orientation.lock(type); L_.oriWant = type; L_.oriOn = true;
      if (!quiet) toast(/landscape/.test(type) ? 'Экран закреплён боком' : 'Экран закреплён вертикально');
    } catch (e) { L_.oriOn = false; if (!quiet) toast('Не получилось закрепить поворот — включите блокировку поворота в шторке телефона', 'err'); }
    lvUiSync();
  }
  function lvOriToggle() {
    const L_ = S.live; if (!L_) return;
    if (L_.oriOn) { try { screen.orientation.unlock(); } catch (e) {} L_.oriOn = false; L_.oriWant = null; toast('Экран снова поворачивается вместе с телефоном'); lvUiSync(); return; }
    lvOriLock(lvOriType());
  }
  function lvFsToggle() {
    if (lvFsCan()) { if (document.fullscreenElement) { S.live.wantFs = false; document.exitFullscreen().catch(() => {}); } else { S.live.wantFs = true; lvFsOn(); } return; }
    // iPhone: браузер не даёт сайту полный экран — только как приложение с экрана «Домой»
    openDialog({ title: 'Полный экран на iPhone', body: `<div class="note">Safari на iPhone не даёт сайтам убрать свою панель. Зато можно открыть сайт как приложение — без адресной строки:<br><br>
      1. Нажмите <b>«Поделиться»</b> (квадрат со стрелкой вверх).<br>2. Выберите <b>«На экран „Домой“»</b> → «Добавить».<br>3. Открывайте сайт значком с экрана «Домой» и войдите как админ — дальше лайф-карта на весь экран.</div>` });
  }
  document.addEventListener('fullscreenchange', () => { if (map) setTimeout(() => map.invalidateSize(), 50); if (S.live && !document.fullscreenElement) S.live.oriOn = false; lvUiSync(); });
  addEventListener('resize', () => { if (S.live && map) { clearTimeout(lvRsT); lvRsT = setTimeout(() => map.invalidateSize(), 120); } });
  let lvRsT = 0;
  // телефон заблокировали — браузер сам вышел из полного экрана; первое касание после разблокировки вернёт его
  const lvFsBack = e => { if (S.live && S.live.wantFs && !document.fullscreenElement && lvFsCan() && !(e.target.closest && e.target.closest('#lvFs, #lvExit'))) lvFsOn(); };
  ['click', 'touchend'].forEach(t => document.addEventListener(t, lvFsBack, true));
  let lvWakeLock = null;
  async function lvWake() {   // экран не гаснет, пока открыта лайф-карта
    if (!S.live || !navigator.wakeLock || document.hidden || lvWakeLock) return;
    try { lvWakeLock = await navigator.wakeLock.request('screen'); lvWakeLock.addEventListener('release', () => { lvWakeLock = null; }); } catch (e) { lvWakeLock = null; }
  }
  /** Замок карты: не сдвинуть и не приблизить пальцем (кнопки +/− работают, метки ставятся). */
  function lvMapLock(on, quiet) {
    const hs = [map.dragging, map.touchZoom, map.boxZoom, map.keyboard];
    hs.forEach(h => h && (on ? h.disable() : h.enable()));
    if (S.live) { S.live.mapLock = on; if (!quiet) { ls.set('pm-live-maplock', on); toast(on ? 'Карта закреплена — не сдвинется от случайного касания' : 'Карту снова можно двигать'); } }
    app.classList.toggle('lv-maplock', !!on);
    lvUiSync();
  }
  function lvSelectGame(id) {
    const g = D().games.find(x => x.id === id); if (!g) return false;
    S.live.game = id; S.phase = 'after'; S.pointId = null; S.placeId = null;
    selectScenario(g.scenarioId, g.id); lvUiSync();
    return true;
  }
  const liveGame = () => S.live && D().games.find(g => g.id === S.live.game) || null;

  /* ---------- обмен с базой ---------- */
  function lvSchedule() {
    const L_ = S.live; if (!L_) return; clearTimeout(L_.timer);
    L_.timer = setTimeout(async () => { await lvPoll(); lvSchedule(); }, document.hidden ? 15000 : L_.viewer ? LV_POLL_VIEW : LV_POLL);
  }
  async function lvPoll() {
    const L_ = S.live; if (!L_ || L_.busy) return; L_.busy = true;
    try {
      await lvFlush();
      const since = L_.since ? new Date(Date.parse(L_.since) - 5000).toISOString() : null;   // небольшое перекрытие — ничего не теряем
      const r = L_.token ? await store.live.view(L_.token, since) : await store.live.pull(L_.game, since);
      if (S.live !== L_) return;
      if (L_.token && r.game && r.game !== L_.game) { if (!lvSelectGame(r.game)) { L_.err = 'Игра по этой ссылке не найдена на сайте'; } }
      L_.skew = Date.parse(r.now) - Date.now();
      let changedPts = false;
      (r.rows || []).forEach(row => {
        const cur = L_.rows.get(row.id);
        if (cur && cur.pending) return;                          // свою неотправленную правку не затираем
        if (cur && cur.updated_at > row.updated_at) return;
        if (row.kind === 'pt') changedPts = true;
        L_.rows.set(row.id, row);
        if (!L_.since || row.updated_at > L_.since) L_.since = row.updated_at;
      });
      if (!L_.since) L_.since = r.now;
      L_.online = true; L_.lastOk = Date.now(); L_.err = L_.err && /не найдена/.test(L_.err) ? L_.err : '';
      if (changedPts || !L_.drawn) { L_.drawn = true; renderMap(); } else lvRenderMarks();
      lvGuestInbox();
      { L_.acks = L_.acks || {}; LVrow().forEach(g => { if ((g.kind !== 'guest' && g.kind !== 'ack') || !g.data) return; const a = g.data.ack || '';
        const mine = (() => { const m = LVrow().get(a); return m && m.data && m.data.dev === lvDevice(); })();   // всплывает тому, кто отправил   // гость нажал «Принял» — админу всплывает
        if (L_.acksInit && a && (L_.acks[g.id] || '') !== a && mine) { toast(`✓ ${g.data.name || 'Гость'}: принял`); if (navigator.vibrate) navigator.vibrate(80); } L_.acks[g.id] = a; }); L_.acksInit = true; }
    } catch (e) {
      if (S.live !== L_) return;
      L_.online = false;
      const m = String(e.message || e);
      if (/link_expired/.test(m)) { L_.err = 'Ссылка устарела или отключена — попросите новую'; clearTimeout(L_.timer); L_.dead = true; }
      else if (/not_admin/.test(m)) L_.err = 'Нет доступа: вход истёк или роль не выдана — войдите заново';
      else if (/live_(pull|put|view|player)|Could not find the function|404/.test(m)) L_.err = 'В базе нет функций лайф-карты — выполните supabase/live.sql в Supabase';
      else if (e.status) L_.err = 'База ответила ошибкой: ' + m;   // это не обрыв сети — покажем причину
      else L_.err = '';
    } finally { L_.busy = false; if (S.live === L_) lvStatus(); }
  }
  async function lvFlush() {
    const L_ = S.live; if (!L_) return;
    while (L_.queue.length) {
      const m = L_.queue[0];
      let t;
      try { t = m.guest ? (L_.token ? await store.live.guestPut(L_.token, m) : await store.live.playerPut(m)) : await store.live.put(m); }
      catch (e) {
        // нет сети — метка ждёт в очереди. База ответила «нельзя» — повторять бессмысленно: убираем, иначе очередь встанет навсегда
        if (!(e.status >= 400 && e.status < 500) || /link_expired/.test(e.message || '')) throw e;
        L_.queue.shift(); ls.set('pm-live-q', JSON.stringify(L_.queue));
        const row = L_.rows.get(m.id); if (row && row.pending && row.qid === m.qid) L_.rows.delete(m.id);
        const why = /not_admin/.test(e.message) ? 'нет прав' : /bad_id/.test(e.message) ? 'чужая метка' : 'база её отклонила'; console.warn('Метка отклонена', m, e.message);
        toast(`Метка не сохранилась (${why}) — убрана`, 'err'); L_.drawn = false; continue;
      }
      L_.queue.shift(); ls.set('pm-live-q', JSON.stringify(L_.queue));
      const row = L_.rows.get(m.id);
      if (row && row.pending && row.qid === m.qid) { row.pending = false; delete row.qid; if (typeof t === 'string') row.updated_at = t; }
    }
  }
  /** Поставить / изменить / снять метку: сразу на экране, в базу — как будет связь. */
  function lvPut(kind, id, data, gone = false) {
    const L_ = S.live; if (!L_ || (L_.viewer && kind !== 'guest')) return;   // гость по ссылке может только отмечать себя
    if (kind !== 'pt') data = Object.assign({ dev: lvDevice() }, data);   // чьё это (для «моих приказов»)
    const qid = Store.uid(), m = { id, game: L_.game, kind, data, gone, qid, guest: L_.viewer };
    L_.queue = L_.queue.filter(q => q.id !== id); L_.queue.push(m); ls.set('pm-live-q', JSON.stringify(L_.queue));
    L_.rows.set(id, { id, game_id: L_.game, kind, data, gone, author: store.live.who(), updated_at: new Date(lvNow()).toISOString(), pending: true, qid });
    if (kind === 'pt') renderMap(); else lvRenderMarks();
    lvStatus(); lvPoll();
  }
  const lvName = () => { const a = store.account && store.account(); return ls.get('pm-live-name', '') || (a && (a.callsign || a.login)) || 'Админ'; };
  function lvPutMe(x, y, extra = {}) {
    if (S.live.viewer) return lvGuestMe(x, y, extra);
    const key = lvMeKey(), here = { x, y };
    const acc = store.account && store.account();
    lvPut('me', 'me:' + key, Object.assign({ x, y, name: lvName(), team: (acc && acc.team) || '' }, extra));
    const go = LVrow().get('go:' + key);                          // дошёл до цели — стрелка «иду сюда» гаснет
    if (go && !go.gone && lvMeters(here, go.data) < 25) lvPut('go', go.id, go.data, true);
  }

  /* ---------- точки игры на живой карте ---------- */
  /** Точки игры с правками лайф-карты (позиция, владелец, замок). */
  function livePoints(g) {
    return g.points.map(p => { const o = LVrow().get('pt:' + g.id + ':' + p.id), d = o && !o.gone ? o.data : null;
      return Object.assign({}, p, { x: d && d.x != null ? d.x : p.x, y: d && d.y != null ? d.y : p.y, live: d && d.owner !== undefined ? d.owner : p.after, lock: !!(d && d.lock), edited: !!d }); });
  }
  function lvPtSave(g, p, patch) {
    const id = 'pt:' + g.id + ':' + p.id, o = LVrow().get(id);
    lvPut('pt', id, Object.assign({ x: p.x, y: p.y, owner: p.live, lock: p.lock, name: p.name }, o && !o.gone ? o.data : {}, patch));
  }
  function renderLivePoints(g) {
    const L_ = S.live, can = lvAdmin();   // точки игры двигает и перекрашивает только админ
    livePoints(g).forEach(p => {
      const color = sideColor(p.live), o = g.points.find(q => q.id === p.id);   // зона едет вместе с точкой
      if (S.f.areas && p.area.length >= 3) L.polygon(polyLL(p.area.map(([ax, ay]) => [ax + p.x - o.x, ay + p.y - o.y])),
        { pane: 'areas', color, weight: 1.6, opacity: .9, fillColor: color, fillOpacity: .22, interactive: false }).addTo(areasLayer);
      const html = markerHtml(p, color).replace('class="mk"', `class="mk${p.lock ? ' mk--lock' : ''}"`);
      const m = L.marker(toLL(p.x, p.y), {
        icon: L.divIcon({ className: 'mk-wrap', html, iconSize: [34, 34], iconAnchor: [17, 17] }),
        draggable: can && !L_.lockAll && !p.lock, title: p.name, riseOnHover: true
      });
      m.on('click', () => lvPointMenu(g, p));
      m.on('dragend', () => { const { x, y } = fromLL(m.getLatLng()); lvPtSave(g, p, { x, y }); });
      m.addTo(markersLayer); markerById.set(p.id, m);
    });
  }
  function lvPointMenu(g, p) {
    const L_ = S.live, can = lvAdmin();
    const html = `<div class="lvm__t">${esc(p.name)}</div><div class="lvm__s">${esc(lvWhere(p.x, p.y))} · сейчас: <b style="color:${sideColor(p.live)}">${esc(sideName(p.live))}</b></div>
      ${can ? `<div class="lvm__row">${D().sides.map(s => `<button type="button" class="lvm__side${p.live === s.id ? ' on' : ''}" style="--c:${esc(s.color)}" data-own="${esc(s.id)}">${esc(s.name)}</button>`).join('')}<button type="button" class="lvm__side${!p.live ? ' on' : ''}" data-own="">Ничья</button></div>
      <div class="lvm__row"><button type="button" class="lvm__b" data-plock>${p.lock ? '🔓 Открепить точку' : '🔒 Закрепить точку'}</button>${p.edited ? '<button type="button" class="lvm__b" data-preset>↺ Как в игре</button>' : ''}</div>
      ${L_.lockAll ? '<div class="lvm__s">Двигать точки: «Слои» → «Можно двигать точки игры».</div>' : ''}` : ''}`;
    lvSheet(html, p, (e, sh) => {
      if (!can) return;
      const o = e.target.closest('[data-own]'); if (o) { lvPtSave(g, p, { owner: o.dataset.own }); sh.close(); toast(`${p.name}: ${sideName(o.dataset.own)}`); return; }
      if (e.target.closest('[data-plock]')) { lvPtSave(g, p, { lock: !p.lock }); sh.close(); return; }
      if (e.target.closest('[data-preset]')) { lvPut('pt', 'pt:' + g.id + ':' + p.id, { name: p.name }, true); sh.close(); }
    });
  }

  /* ---------- шторка снизу: все меню лайф-карты (видно целиком, удобно большим пальцем) ---------- */
  let lvSh = null;
  function lvSheetClose() {
    if (!lvSh) return; const s_ = lvSh; lvSh = null;
    s_.el.remove(); if (s_.pin) s_.pin.remove(); if (s_.onClose) s_.onClose();
    app.classList.remove('lv-sheet');
  }
  /** html — содержимое; at — {x, y} куда поставить булавку; onClick(e, api) — нажатия внутри. */
  function lvSheet(html, at, onClick, onClose) {
    lvSheetClose(); map.closePopup();
    const ui = $('#liveUi'); if (!ui) return null;
    const el = document.createElement('div'); el.className = 'lvui__sheet';
    el.innerHTML = `<button type="button" class="lvui__shx" data-shx aria-label="Закрыть">✕</button><div class="lvm" data-body>${html}</div>`;
    ui.appendChild(el); app.classList.add('lv-sheet');
    const pin = at ? L.marker(toLL(at.x, at.y), { pane: 'live', interactive: false, keyboard: false, zIndexOffset: 3000,
      icon: L.divIcon({ className: 'lv-wrap', html: '<div class="lv-pin"></div>', iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(map) : null;
    const api = { el, close: lvSheetClose, set: h => { el.querySelector('[data-body]').innerHTML = h; } };
    lvSh = { el, pin, onClose };
    el.addEventListener('click', e => { e.stopPropagation(); if (e.target.closest('[data-shx]')) { lvSheetClose(); return; } onClick && onClick(e, api); });
    ['pointerdown', 'dblclick', 'contextmenu', 'wheel'].forEach(t => el.addEventListener(t, e => e.stopPropagation()));
    return api;
  }

  /* ---------- метки ---------- */
  const lvCat = r => r.kind === 'route' && r.data && r.data.type === 'enemy' ? 'enemy' : r.kind === 'go' || r.kind === 'route' ? 'route' : r.kind === 'pl' ? 'guest' : r.kind;
  const lvMine = r => r.data && r.data.dev ? r.data.dev === lvDevice() : r.author && r.author === store.live.who();
  /** Команды этой игры: id → { t, side, color }. */
  function lvGameTeams() {
    const g = liveGame(), m = new Map(); if (!g) return m;
    for (const sid in g.sides) sideEntries(g.sides[sid]).forEach(e => m.set(e.id, { t: e.t, side: sid, color: sideColor(sid) }));
    return m;
  }
  /** Команда для значка: из этой игры (с цветом стороны) или просто из справочника (нейтральная рамка). */
  function lvTeamInfo(id, teams) {
    if (!id) return null; const m = (teams || lvGameTeams()).get(id); if (m) return m;
    const t = teamById(id); return t ? { t, side: '', color: '#c3c4b2' } : null;
  }
  /** Эмблема команды в рамке цвета стороны (или первые буквы, если эмблемы нет). */
  const lvEmblem = (tm, cls = '') => `<span class="lv-em ${cls}" style="--c:${esc(tm.color)}">${tm.t.logo && safeUrl(tm.t.logo) ? `<img src="${esc(photoSrc(tm.t.logo, 96))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<i>${esc(tm.t.name.slice(0, 2).toUpperCase())}</i></span>`;
  /** На карте у каждой команды — только последние N приказов/маршрутов; старые прячутся (в журнале остаются). */
  function lvCapped() {
    const cap = lvPref().cap || 3, by = new Map(), out = new Set();
    LVrow().forEach(r => { if (r.kind !== 'route' || r.gone || !r.data || r.data.toKind !== 'team' || !r.data.to) return; (by.get(r.data.to) || by.set(r.data.to, []).get(r.data.to)).push(r); });
    by.forEach(l => l.sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(cap).forEach(r => out.add(r.id)));
    return out;
  }
  function lvAlive(r) {
    if (r.gone || r.kind === 'pt' || r.kind === 'msg' || r.kind === 'freq' || r.kind === 'ack') return false;
    if (r.kind === 'enemy' && lvAge(r) > LV_ENEMY_TTL) return false;
    if (r.kind === 'guest' && lvAge(r) > 3 * 3600e3) return false;
    if (r.kind === 'route' && r.data && r.data.of && r.data.type === 'enemy') { const o = LVrow().get(r.data.of); if (!o || !lvAlive(o)) return false; }   // путь противника гаснет вместе с ним
    return true;
  }
  function lvVisible(r, capped) {
    if (!lvAlive(r)) return false;
    if (capped instanceof Set && capped.has(r.id)) return false;   // filter(lvVisible) передаёт сюда номер — его игнорируем
    const P = lvPref(); if (P.show[lvCat(r)] === false) return false;
    return !P.hidden.includes(r.id);
  }
  function lvRenderMarks() {
    if (!S.live || !liveLayer) return;
    liveLayer.clearLayers();
    const capped = lvCapped(), teams = lvGameTeams();
    const rows = [...LVrow().values()].filter(r => lvVisible(r, capped)), meKey = 'me:' + lvMeKey(), can = !S.live.viewer;
    const ico = (r, cls, inner, size = 30) => L.marker(toLL(r.data.x, r.data.y), { pane: 'live', keyboard: false, zIndexOffset: r.kind === 'me' ? 1000 : 0,
      icon: L.divIcon({ className: 'lv-wrap', html: `<div class="lv ${cls}">${inner}</div>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] }) });
    rows.forEach(r => {
      const d = r.data || {}, age = lvAge(r), ago = lvAgo(age); let m;
      if (r.kind === 'me') {
        const st = age > LV_OLD ? ' lv--old' : age > LV_STALE ? ' lv--stale' : '';
        const cone = r.id === meKey && S.live.heading != null ? `<i class="lv__cone" style="transform:rotate(${Math.round(S.live.heading + ROT * 90)}deg)"></i>` : '';
        const tm = lvTeamInfo(d.team, teams);
        m = ico(r, 'lv--me' + st + (r.id === meKey ? ' lv--mine' : '') + (tm ? ' lv--gt lv--met' : ''), `${cone}${tm ? lvEmblem(tm) : '<i class="lv__dot"></i>'}<span class="lv__lbl">${esc(d.name || 'Админ')}${tm ? ' · ' + esc(tm.t.name) : ''} · ${ago}${d.gps ? ' · GPS' : ''}</span>`, tm ? 30 : 26);
      } else if (r.kind === 'go') {
        const me = LVrow().get(r.id.replace(/^go:/, 'me:'));
        if (d.pts && d.pts.length > 1) lvRoute(d.pts, '#79b8ff', '9 7');
        else if (me && !me.gone) {
          const a = [me.data.x * W, me.data.y * H], b = [d.x * W, d.y * H], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), len = 16 * Math.pow(2, Z - map.getZoom());
          L.polyline([pxLL(a), pxLL([b[0] - len * .7 * Math.cos(ang), b[1] - len * .7 * Math.sin(ang)])], { pane: 'live', color: '#79b8ff', weight: 3, dashArray: '8 7', opacity: .95, interactive: false }).addTo(liveLayer);
          L.polygon([pxLL(b), pxLL([b[0] - len * Math.cos(ang - .45), b[1] - len * Math.sin(ang - .45)]), pxLL([b[0] - len * Math.cos(ang + .45), b[1] - len * Math.sin(ang + .45)])], { pane: 'live', color: '#79b8ff', weight: 1, fillOpacity: .95, interactive: false }).addTo(liveLayer);
        }
        m = ico(r, 'lv--go', `<i class="lv__ring"></i><span class="lv__lbl">${esc(d.name || '')} → сюда</span>`, 22);
      } else if (r.kind === 'order') {
        if (d.pts && d.pts.length > 1) lvRoute(d.pts, '#fac775');
        m = ico(r, 'lv--order', `<span class="lv__chip" title="${esc(d.name || '')} · ${ago}">${LV_ICON.order}${esc(d.text || 'Приказ')}</span>`, 24);
      } else if (r.kind === 'route') {
        const T = LV_RT[d.type] || LV_RT.go, col = d.color || T.c;
        lvRoute(d.pts, col, T.dash);
        const [sx, sy] = d.pts[0];
        L.marker(toLL(sx, sy), { pane: 'live', keyboard: false, zIndexOffset: 500, icon: L.divIcon({ className: 'lv-wrap', iconSize: [22, 22], iconAnchor: [11, 11],
          html: `<div class="lv lv--rn" style="--c:${esc(col)}"><b>${esc(d.n || '')}</b></div>` }) }).on('click', () => lvRouteMenu(r)).addTo(liveLayer);
        m = ico(r, 'lv--rend', `<span class="lv__rl" style="--c:${esc(col)}">${esc(d.n || '')} · ${esc(d.text || T.n)}${d.toName ? ' → ' + esc(d.toName) : ''}${d.label ? ' — ' + esc(d.label) : ''}</span>`, 18);
        m.on('click', () => lvRouteMenu(r)); m.addTo(liveLayer); return;
      } else if (r.kind === 'pl') {   // игрок, поставленный админом вручную (без телефона)
        const tm = lvTeamInfo(d.team, teams), adm = lvAdmin();
        m = L.marker(toLL(d.x, d.y), { pane: 'live', keyboard: false, draggable: adm, zIndexOffset: 200,
          icon: L.divIcon({ className: 'lv-wrap', iconSize: [tm ? 30 : 24, tm ? 30 : 24], iconAnchor: [tm ? 15 : 12, tm ? 15 : 12],
            html: `<div class="lv lv--pl${tm ? ' lv--gt' : ''}">${tm ? lvEmblem(tm) : '<i class="lv__dot"></i>'}<span class="lv__lbl lv__lbl--p">${esc(d.name || 'Игрок')}${tm ? ' · ' + esc(tm.t.name) : ''}</span></div>` }) });
        if (adm) m.on('dragend', () => { const { x, y } = fromLL(m.getLatLng()); lvPut('pl', r.id, Object.assign({}, d, { x, y })); });
        m.on('click', () => lvPlMenu(r)); m.addTo(liveLayer); return;
      } else if (r.kind === 'guest') {
        const st = age > LV_OLD ? ' lv--old' : age > LV_STALE ? ' lv--stale' : '', mine = r.id === 'gu:' + lvDevice();
        const cone = mine && S.live.heading != null ? `<i class="lv__cone" style="transform:rotate(${Math.round(S.live.heading + ROT * 90)}deg)"></i>` : '';
        const tm = lvTeamInfo(d.team, teams);
        m = ico(r, 'lv--guest' + st + (mine ? ' lv--mine' : '') + (tm ? ' lv--gt' : ''), `${cone}${tm ? lvEmblem(tm) : '<i class="lv__dot"></i>'}<span class="lv__lbl lv__lbl--g"${tm ? ` style="--c:${esc(tm.color)}"` : ''}>${esc(d.name || 'Гость')}${tm ? ' · ' + esc(tm.t.name) : ''} · ${ago}</span>`, tm ? 30 : 24);
        m.on('click', () => lvGuestMenu(r)); m.addTo(liveLayer); return;
      } else if (r.kind === 'enemy') {
        m = ico(r, 'lv--enemy' + (age > LV_ENEMY_TTL / 2 ? ' lv--stale' : ''), `<i class="lv__dia"></i><span class="lv__lbl lv__lbl--r">враг${d.count ? ' ×' + esc(d.count) : ''} · ${ago}</span>`, 24);
      } else if (r.kind === 'medic') {
        m = ico(r, 'lv--medic', `<i class="lv__med">${LV_ICON.medic}</i><span class="lv__lbl">медик · ${ago}</span>`, 26);
      }
      if (!m) return;
      m.on('click', () => lvMarkMenu(r));
      m.addTo(liveLayer);
    });
    lvListRender(); lvFreqSync();
  }
  /** Ручной игрок: переименовать, команда, маршрут, убрать (только админ). */
  function lvPlForm(at, r) {
    const d = (r && r.data) || {}, teams = D().teams.slice().sort((x, y) => x.name.localeCompare(y.name, 'ru'));
    let sel = d.team || '';
    const html = nm => `<div class="lvm__t">${r ? 'Игрок на карте' : 'Поставить игрока'}</div><div class="lvm__s">Для тех, у кого нет телефона: метку двигаете вы, перетаскиванием.</div>
      <div class="lvm__row"><input class="lvm__in" data-pn maxlength="24" placeholder="позывной" value="${esc(nm)}"></div>
      <div class="lvm__s">Команда (необязательно)</div><div class="lvm__teams">${teams.map(t => { const tm = lvTeamInfo(t.id); return `<button type="button" class="lvm__tm${sel === t.id ? ' on' : ''}" style="--c:${esc(tm.color)}" data-tm="${esc(t.id)}">${lvEmblem(tm, 'lv-em--s')}<b>${esc(t.name)}</b></button>`; }).join('')}
        <button type="button" class="lvm__tm${sel ? '' : ' on'}" style="--c:#888780" data-tm=""><span class="lv-em lv-em--s" style="--c:#888780"><i>—</i></span><b>без команды</b></button></div>
      <div class="lvm__row"><button type="button" class="lvm__b lvm__b--ok" data-ok>${r ? 'Сохранить' : 'Поставить'}</button></div>`;
    lvSheet(html(d.name || ''), at, (e, sh) => {
      const t = e.target.closest('[data-tm]'); if (t) { sel = t.dataset.tm; sh.set(html(sh.el.querySelector('[data-pn]').value)); return; }
      if (!e.target.closest('[data-ok]')) return;
      const n = (sh.el.querySelector('[data-pn]').value || '').trim().slice(0, 24); if (!n) { toast('Впишите позывной', 'err'); return; }
      lvPut('pl', r ? r.id : 'pl:' + Store.uid(), Object.assign({}, d, { x: at.x, y: at.y, name: n, team: sel })); sh.close(); toast(r ? 'Сохранено' : `${n} на карте — двигайте перетаскиванием`);
    });
    setTimeout(() => { const i = document.querySelector('[data-pn]'); if (i && !i.value) i.focus(); }, 50);
  }
  function lvPlMenu(r) {
    const d = r.data || {}, tm = lvTeamInfo(d.team), adm = lvAdmin(), can = !S.live.viewer;
    lvSheet(`<div class="lvm__t">${tm ? lvEmblem(tm, 'lv-em--s') + ' ' : ''}${esc(d.name || 'Игрок')}</div><div class="lvm__s">Поставлен вручную${tm ? ' · ' + esc(tm.t.name) : ''} · ${esc(lvWhere(d.x, d.y))} · ${lvAgo(lvAge(r))}${adm ? ' · двигайте перетаскиванием' : ''}</div>
      ${can ? `<div class="lvm__row"><button type="button" class="lvm__b" data-path>✎ Задать маршрут</button>${adm ? '<button type="button" class="lvm__b" data-edit>Позывной и команда</button><button type="button" class="lvm__b lvm__b--del" data-rm>Убрать</button>' : ''}</div>` : ''}`, d, (e, sh) => {
      if (!can) return;
      if (e.target.closest('[data-path]')) { sh.close(); lvDrawStart({ of: r.id, toName: d.name, toKind: 'pl' }); return; }
      if (adm && e.target.closest('[data-edit]')) { lvPlForm({ x: d.x, y: d.y }, r); return; }
      if (adm && e.target.closest('[data-rm]')) { lvPut('pl', r.id, d, true); sh.close(); }
    });
  }
  const LV_WHAT = { me: 'Я тут', pl: 'Игрок', route: 'Маршрут', go: 'Иду сюда / маршрут', order: 'Приказ', enemy: 'Противник', medic: 'Нужен медик' };
  /** Последнее сообщение человеку и принял ли он его. */
  function lvMsgState(dev) {
    const last = [...LVrow().values()].filter(m => m.kind === 'msg' && !m.gone && m.data && m.data.to === dev).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
    if (!last) return '';
    const g = LVrow().get('gu:' + dev), ak = LVrow().get('ak:' + dev), ack = (g && g.data && g.data.ack) || (ak && ak.data && ak.data.ack) || '';
    return `Последнее: «${esc(last.data.text)}» · ${ack === last.id ? '<b style="color:#6fd14a">✓ принял</b>' : '<b style="color:var(--amber)">ждём ответа</b>'}`;
  }
  const lvMsgButtons = () => `<div class="lvm__s">Сообщение — придёт на телефон</div><div class="lvm__row">${LV_MSG.map(t => `<button type="button" class="lvm__b" data-msg="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <div class="lvm__row"><input class="lvm__in" data-mtxt maxlength="80" placeholder="свой текст"><button type="button" class="lvm__b" data-msg="">Отправить</button></div>`;
  function lvSendMsg(e, sh, d) {
    const m = e.target.closest('[data-msg]'); if (!m) return false;
    const t = (m.dataset.msg || (sh.el.querySelector('[data-mtxt]') || {}).value || '').trim(); if (!t) { toast('Впишите текст', 'err'); return true; }
    lvPut('msg', 'ms:' + Store.uid(), { to: d.dev, toName: d.name, text: t.slice(0, 80), name: lvName(), x: d.x, y: d.y }); sh.close(); toast(`Отправлено: ${d.name || 'человеку'}`); return true;
  }
  function lvMarkMenu(r) {
    const d = r.data || {}, can = !S.live.viewer, other = r.kind === 'me' && r.id !== 'me:' + lvMeKey();
    const st = other && d.dev ? lvMsgState(d.dev) : '';
    const html = `<div class="lvm__t">${LV_WHAT[r.kind] || 'Метка'}${r.kind === 'order' ? ': ' + esc(d.text || '') : r.kind === 'enemy' && d.count ? ' ×' + esc(d.count) : ''}</div>
      <div class="lvm__s">${esc(d.name || '')}${d.name ? ' · ' : ''}${esc(lvWhere(d.x, d.y))} · ${lvAgo(lvAge(r))}${d.pts && d.pts.length > 1 ? ' · по маршруту' : ''}${r.pending ? ' · <b style="color:var(--amber)">ещё не отправлено</b>' : ''}</div>
      ${st ? `<div class="lvm__s">${st}</div>` : ''}${can && other && d.dev ? lvMsgButtons() : ''}
      ${can ? `<div class="lvm__row">${r.kind === 'enemy' ? '<button type="button" class="lvm__b" data-path>✎ Куда идут</button>' : other ? '<button type="button" class="lvm__b" data-path>✎ Задать маршрут</button>' : ''}<button type="button" class="lvm__b lvm__b--del" data-rm>Снять метку</button></div>` : ''}`;
    lvSheet(html, d, (e, sh) => {
      if (!can) return;
      if (other && lvSendMsg(e, sh, d)) return;
      if (e.target.closest('[data-rm]')) { lvPut(r.kind, r.id, r.data, true); sh.close(); return; }
      if (e.target.closest('[data-path]')) { sh.close(); lvDrawStart(r.kind === 'enemy' ? { type: 'enemy', of: r.id, quick: true } : { of: r.id, to: d.dev, toName: d.name, toKind: 'admin' }); }
    });
  }
  /** Гость на карте: админ шлёт ему сообщение или маршрут. */
  function lvGuestMenu(r) {
    const d = r.data || {}, can = !S.live.viewer, mine = r.id === 'gu:' + lvDevice();
    const st = lvMsgState(d.dev);
    const tm = lvTeamInfo(d.team);
    const html = `<div class="lvm__t">${tm ? lvEmblem(tm, 'lv-em--s') + ' ' : ''}${esc(d.name || 'Гость')}${mine ? ' (вы)' : ''}</div><div class="lvm__s">${tm ? esc(tm.t.name) + (tm.side ? ' · ' + esc(sideName(tm.side)) : '') : 'Гость по ссылке'} · ${esc(lvWhere(d.x, d.y))} · ${lvAgo(lvAge(r))}${d.gps ? ' · GPS' : ''}</div>
      ${st ? `<div class="lvm__s">${st}</div>` : ''}
      ${can ? `<div class="lvm__s">Сообщение — придёт ему на телефон</div><div class="lvm__row">${LV_MSG.map(t => `<button type="button" class="lvm__b" data-msg="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        <div class="lvm__row"><input class="lvm__in" data-mtxt maxlength="80" placeholder="свой текст"><button type="button" class="lvm__b" data-msg="">Отправить</button></div>
        <div class="lvm__row"><button type="button" class="lvm__b" data-path>✎ Задать маршрут</button><button type="button" class="lvm__b lvm__b--del" data-rm>Убрать с карты</button></div>` : ''}`;
    lvSheet(html, d, (e, sh) => {
      if (!can) return;
      const m = e.target.closest('[data-msg]');
      if (m) { const t = (m.dataset.msg || (sh.el.querySelector('[data-mtxt]') || {}).value || '').trim(); if (!t) { toast('Впишите текст', 'err'); return; }
        lvPut('msg', 'ms:' + Store.uid(), { to: d.dev, toName: d.name, text: t.slice(0, 80), name: lvName(), x: d.x, y: d.y }); sh.close(); toast(`Отправлено: ${d.name || 'гость'}`); return; }
      if (e.target.closest('[data-path]')) { sh.close(); lvDrawStart({ of: r.id, to: d.dev, toName: d.name, toKind: 'guest' }); return; }
      if (e.target.closest('[data-rm]')) { lvPut('guest', r.id, d, true); sh.close(); }
    });
  }
  /** Гость отмечает себя: двойное нажатие или GPS. Ник спрашиваем один раз. */
  const lvMyTeam = () => { const a = lvAcc(); return a ? a.team || '' : ls.get('pm-guest-team', ''); };
  function lvGuestMe(x, y, extra = {}) {
    const a = lvAcc();
    const go = (name, team) => lvPut('guest', 'gu:' + lvDevice(), Object.assign({ x, y, name, team: team || '', ack: (LVrow().get('gu:' + lvDevice()) || { data: {} }).data.ack || '' }, extra));
    if (a) { go(a.callsign || a.login, a.team || ''); return; }   // игрок с аккаунтом: позывной и команда — из профиля
    const nm = ls.get('pm-guest-name', ''), tmSet = ls.get('pm-guest-team', null) !== null || !lvGameTeams().size;
    if (nm && tmSet) { go(nm, ls.get('pm-guest-team', '')); return; }
    lvAskNick((n, t) => go(n, t), { x, y });
  }
  /** Позывной и команда — один раз. Команды — только те, что играют в этой игре. */
  function lvAskNick(cb, at) {
    const teams = [...lvGameTeams().entries()];
    let sel = ls.get('pm-guest-team', null); if (sel === null) sel = teams.length ? null : '';
    const html = nick => `<div class="lvm__t">Ваш позывной</div><div class="lvm__s">Его увидят организаторы рядом с вашей меткой.</div>
      <div class="lvm__row"><input class="lvm__in" data-nick maxlength="24" placeholder="например, Сокол" value="${esc(nick)}"></div>
      ${teams.length ? `<div class="lvm__s">За какую команду</div><div class="lvm__teams">${teams.map(([id, tm]) => `<button type="button" class="lvm__tm${sel === id ? ' on' : ''}" style="--c:${esc(tm.color)}" data-tm="${esc(id)}">${lvEmblem(tm, 'lv-em--s')}<b>${esc(tm.t.name)}</b><small>${esc(sideName(tm.side))}</small></button>`).join('')}
        <button type="button" class="lvm__tm${sel === '' ? ' on' : ''}" style="--c:#888780" data-tm=""><span class="lv-em lv-em--s" style="--c:#888780"><i>—</i></span><b>Без команды</b></button></div>` : ''}
      <div class="lvm__row"><button type="button" class="lvm__b lvm__b--ok" data-ok>Готово</button></div>`;
    lvSheet(html(ls.get('pm-guest-name', '')), at || null, (e, sh) => {
      const t = e.target.closest('[data-tm]'); if (t) { sel = t.dataset.tm; sh.set(html(sh.el.querySelector('[data-nick]').value)); return; }
      if (!e.target.closest('[data-ok]')) return;
      const n = (sh.el.querySelector('[data-nick]').value || '').trim().slice(0, 24); if (!n) { toast('Впишите позывной', 'err'); return; }
      if (sel === null) { toast('Выберите команду — или «Без команды»', 'err'); return; }
      ls.set('pm-guest-name', n); ls.set('pm-guest-team', sel); sh.close(); cb && cb(n, sel);
    });
    setTimeout(() => { const i = document.querySelector('[data-nick]'); if (i && !i.value) i.focus(); }, 50);
  }
  /** Гостю: новые сообщения и маршруты от организаторов — баннер сверху и вибрация. */
  function lvGuestInbox() {
    const L_ = S.live; if (!L_) return;
    const me = lvDevice(), seen = ls.get('pm-guest-seen', []) || [];
    const box = $('#lvMsg'); if (!box) return;
    const myTeam = lvMyTeam(), capped = lvCapped();
    const items = [...LVrow().values()].filter(r => !r.gone && r.data && (r.data.to === me || (myTeam && r.data.toKind === 'team' && r.data.to === myTeam && !capped.has(r.id))) && (r.kind === 'msg' || r.kind === 'route') && lvAge(r) < 3 * 3600e3)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const fresh = items.find(r => !seen.includes(r.id));
    if (!fresh) { box.hidden = true; return; }
    const d = fresh.data, T = LV_RT[d.type] || LV_RT.go;
    if (box.dataset.id !== fresh.id) { box.dataset.id = fresh.id; if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
    box.hidden = false;
    box.innerHTML = `<b>📣 ${esc(d.name || 'Организатор')}:</b> ${fresh.kind === 'route' ? `${d.toKind === 'team' ? 'команде ' + esc(d.toName || '') + ' — маршрут' : 'ваш маршрут'} <span class="lv-n" style="--c:${esc(d.color || T.c)}">${esc(d.n || '')}</span> ${esc(d.text || T.n)}${d.label ? ' — ' + esc(d.label) : ''}` : esc(d.text)}
      <span class="lvmsg__a">${fresh.kind === 'route' ? '<button type="button" data-show>Показать</button>' : ''}<button type="button" data-ack>Принял</button></span>`;
    box.onclick = e => {
      e.stopPropagation();
      if (e.target.closest('[data-show]') && d.pts) map.fitBounds(L.latLngBounds(d.pts.map(([x, y]) => toLL(x, y))), { padding: [40, 120] });
      if (e.target.closest('[data-ack]')) {
        ls.set('pm-guest-seen', seen.concat(fresh.id).slice(-200));
        if (L_.viewer) { const g = LVrow().get('gu:' + me); if (g && !g.gone) lvPut('guest', g.id, Object.assign({}, g.data, { ack: fresh.id })); }
        else lvPut('ack', 'ak:' + me, { ack: fresh.id, name: lvName() });   // админ/командир: отметка «принял» отдельной строкой
        box.hidden = true; lvGuestInbox();
      }
    };
  }
  const lvOrderPick = title => `<div class="lvm__t">${title}</div><div class="lvm__row">${LV_ORDERS.map(o => `<button type="button" class="lvm__b lvm__b--big" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>
    <div class="lvm__row"><input class="lvm__in" maxlength="30" placeholder="свой текст"><button type="button" class="lvm__b" data-o="">OK</button></div>`;
  /** Меню по долгому нажатию: я тут / иду сюда / приказ / противник / медик. */
  function lvAddMenu(x, y) {
    if (!S.live || S.live.viewer) return;
    const key = lvMeKey(), meRow = LVrow().get('me:' + key), hasMe = meRow && !meRow.gone;
    const main = `<div class="lvm__s">${esc(lvWhere(x, y))}</div><div class="lvm__grid">
      <button type="button" data-a="me">${LV_ICON.me}Я тут</button>
      <button type="button" data-a="go">${LV_ICON.go}Иду сюда</button>
      <button type="button" data-a="order">${LV_ICON.order}Приказ</button>
      <button type="button" data-a="enemy" class="r">${LV_ICON.enemy}Противник</button>
      <button type="button" data-a="medic">${LV_ICON.medic}Медик</button>${lvAdmin() ? '<button type="button" data-a="pl">👤 Игрок</button>' : ''}</div>`;
    lvSheet(main, { x, y }, (e, sh) => {
      const b = e.target.closest('button'); if (!b) return;
      const a = b.dataset.a, base = { x, y, name: lvName() };
      if (a === 'me') { lvPutMe(x, y); sh.close(); return; }
      if (a === 'go') { if (!hasMe) { toast('Сначала отметьте, где вы: двойное нажатие по карте или «Я тут»', 'err'); return; } lvPut('go', 'go:' + key, base); sh.close(); return; }
      if (a === 'medic') { lvPut('medic', 'md:' + Store.uid(), base); sh.close(); return; }
      if (a === 'pl') { lvPlForm({ x, y }); return; }
      if (a === 'order') { sh.set(lvOrderPick('Приказ')); return; }
      if (a === 'enemy') { sh.set(`<div class="lvm__t">Противник — сколько?</div><div class="lvm__row">${['?', '1', '2', '3', '5', '10+'].map(n => `<button type="button" class="lvm__b lvm__b--big" data-n="${n}">${n}</button>`).join('')}</div><div class="lvm__s">Метка погаснет сама через 10 минут.</div>`); return; }
      if (b.dataset.o !== undefined) { const t = b.dataset.o || (sh.el.querySelector('.lvm__in') || {}).value || ''; if (!t.trim()) { toast('Впишите текст приказа', 'err'); return; } lvPut('order', 'or:' + Store.uid(), Object.assign(base, { text: t.trim().slice(0, 30) })); sh.close(); return; }
      if (b.dataset.n !== undefined) { const id = 'en:' + Store.uid(); lvPut('enemy', id, Object.assign(base, { count: b.dataset.n === '?' ? '' : b.dataset.n }));
        sh.set(`<div class="lvm__t">Противник${b.dataset.n === '?' ? '' : ' ×' + esc(b.dataset.n)} отмечен</div><div class="lvm__s">Куда они идут? Проведите путь от метки пальцем.</div>
          <div class="lvm__grid lvm__grid--2"><button type="button" data-epath="${esc(id)}">${LV_ICON.go}Указать, куда идут</button><button type="button" data-edone>Готово</button></div>`); return; }
      if (b.dataset.epath) { sh.close(); lvDrawStart({ type: 'enemy', of: b.dataset.epath, quick: true }); return; }
      if (b.dataset.edone !== undefined) { sh.close(); }
    });
  }

  /* ---------- жесты: двойное нажатие — «я тут», долгое — меню ---------- */
  let lvTap = null, lvHold = null, lvHoldAt = 0, lvSwallow = false;
  function lvGestures() {
    map.on('click', e => {
      if (!S.live || S.mode || S.live.draw) return;
      const p = e.containerPoint, t = Date.now();
      if (lvSh && !(lvTap && t - lvTap.t < 400)) { lvSheetClose(); lvTap = { t, p }; return; }
      if (lvTap && t - lvTap.t < 400 && p.distanceTo(lvTap.p) < 30) { lvTap = null; const { x, y } = fromLL(e.latlng); map.closePopup(); lvPutMe(x, y); return; }
      lvTap = { t, p };
    });
    map.on('contextmenu', e => { if (!S.live || S.live.draw || Date.now() - lvHoldAt < 900) return; const { x, y } = fromLL(e.latlng); lvAddMenu(x, y); });
    const el = map.getContainer();
    el.addEventListener('pointerdown', e => {
      if (!S.live || S.live.viewer || S.live.draw || e.pointerType === 'mouse' || e.target.closest('.leaflet-marker-icon, .leaflet-popup')) return;
      const at = { x: e.clientX, y: e.clientY };
      clearTimeout(lvHold && lvHold.t);
      lvHold = { at, t: setTimeout(() => { lvHoldAt = Date.now(); lvSwallow = true; const r = el.getBoundingClientRect(); const { x, y } = fromLL(map.containerPointToLatLng([at.x - r.left, at.y - r.top])); if (navigator.vibrate) navigator.vibrate(30); lvAddMenu(x, y); }, 550) };
    });
    // палец отпустили после долгого нажатия — этот «клик» не должен закрыть только что открытое меню
    // палец отпустили после долгого нажатия — этот «клик» никуда не идёт: ни в карту, ни в только что открытое меню под пальцем
    document.addEventListener('pointerdown', () => { lvSwallow = false; }, true);
    document.addEventListener('click', e => { if (lvSwallow && Date.now() - lvHoldAt < 1500) { e.stopPropagation(); e.preventDefault(); } lvSwallow = false; }, true);
    const cancel = e => { if (lvHold && (e.type !== 'pointermove' || Math.hypot(e.clientX - lvHold.at.x, e.clientY - lvHold.at.y) > 10)) { clearTimeout(lvHold.t); lvHold = null; } };
    ['pointermove', 'pointerup', 'pointercancel'].forEach(t => el.addEventListener(t, cancel));
    map.on('zoomend', () => { if (S.live) lvRenderMarks(); });
    // карандаш: ведём пальцем (или мышью) — рисуется маршрут
    el.addEventListener('pointerdown', e => {
      const D_ = S.live && S.live.draw; if (!D_ || e.target.closest('.leaflet-popup') || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault(); e.stopPropagation(); if (lvSh) { const k = lvSh; k.onClose = null; lvSheetClose(); }
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      D_.on = e.pointerId; D_.pts = []; D_.scr = null; lvDrawAdd(e);
    }, true);
    el.addEventListener('pointermove', e => { const D_ = S.live && S.live.draw; if (D_ && D_.on === e.pointerId) { e.preventDefault(); lvDrawAdd(e); } }, true);
    const up = e => { const D_ = S.live && S.live.draw; if (D_ && D_.on === e.pointerId) { D_.on = null; lvDrawEnd(); } };
    el.addEventListener('pointerup', up, true); el.addEventListener('pointercancel', up, true);
  }

  /* ---------- карандаш: маршрут → «иду этим путём» или «приказ по маршруту» ---------- */
  function lvDrawStart(preset) {
    const L_ = S.live; if (!L_ || L_.viewer) return;
    if (L_.draw) { lvSheetClose(); lvDrawStop(); if (!preset || preset instanceof Event) return; }
    if (preset instanceof Event) preset = null;
    lvSheetClose();
    const pc = preset && preset.type ? LV_RT[preset.type].c : '#ffd166';
    L_.draw = { pts: [], on: null, preset: preset || null, line: L.polyline([], { pane: 'live', color: pc, weight: 4, opacity: .95, interactive: false }).addTo(map) };
    map.dragging.disable(); map.touchZoom.disable();
    app.classList.add('lv-drawing'); lvUiSync();
    const h = $('#lvHint'); if (h) { h.textContent = preset && preset.type === 'enemy' ? 'Ведите пальцем, куда идёт противник' : preset && preset.toName ? `Маршрут для: ${preset.toName} — ведите пальцем` : 'Ведите пальцем путь · ✎ ещё раз — отмена'; h.classList.remove('fade'); }
  }
  function lvDrawStop() {
    const L_ = S.live; if (!L_ || !L_.draw) return;
    L_.draw.line.remove(); L_.draw = null;
    if (!L_.mapLock) { map.dragging.enable(); map.touchZoom.enable(); }
    app.classList.remove('lv-drawing'); lvUiSync();
    const h = $('#lvHint'); if (h) { h.textContent = '2× нажатие — я тут · удержать — метки · ✎ — путь'; h.classList.add('fade'); }
  }
  function lvDrawAdd(e) {
    const D_ = S.live.draw, r = map.getContainer().getBoundingClientRect(), cp = L.point(e.clientX - r.left, e.clientY - r.top);
    if (D_.scr && cp.distanceTo(D_.scr) < 5) return;
    D_.scr = cp; const { x, y } = fromLL(map.containerPointToLatLng(cp)); D_.pts.push([x, y]);
    D_.line.setLatLngs(D_.pts.map(([px, py]) => toLL(px, py)));
  }
  /** Упрощение линии (Дуглас — Пекер) в пикселях подложки: меньше точек — легче передавать. */
  function lvSimplify(pts, tol) {
    if (pts.length < 3) return pts;
    const P = pts.map(([x, y]) => [x * W, y * H]), keep = new Uint8Array(P.length); keep[0] = keep[P.length - 1] = 1;
    const st = [[0, P.length - 1]];
    while (st.length) {
      const [a, b] = st.pop(); let md = 0, mi = -1; const [ax, ay] = P[a], [bx, by] = P[b], L2 = (bx - ax) ** 2 + (by - ay) ** 2;
      for (let i = a + 1; i < b; i++) { const [px, py] = P[i]; let t = L2 ? ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / L2 : 0; t = Math.max(0, Math.min(1, t));
        const d = Math.hypot(px - ax - t * (bx - ax), py - ay - t * (by - ay)); if (d > md) { md = d; mi = i; } }
      if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
    }
    return pts.filter((_, i) => keep[i]);
  }
  const lvLen = pts => pts.slice(1).reduce((a, q, i) => a + lvMeters({ x: pts[i][0], y: pts[i][1] }, { x: q[0], y: q[1] }), 0);
  const lvNextN = () => [...LVrow().values()].filter(r => r.kind === 'route').reduce((m, r) => Math.max(m, +(r.data && r.data.n) || 0), 0) + 1;
  /** Кому можно дать маршрут: команды этой игры и гости на карте. */
  function lvTargets() {
    const g = liveGame(), out = [];
    if (g) for (const sid in g.sides) sideEntries(g.sides[sid]).forEach(e => out.push({ id: e.id, name: e.t.name, kind: 'team', color: sideColor(sid) }));
    [...LVrow().values()].filter(r => r.kind === 'guest' && lvAlive(r)).forEach(r => out.push({ id: r.data.dev, name: r.data.name || 'Гость', kind: 'guest', color: '#ffb347' }));
    return out;
  }
  function lvDrawEnd() {
    const L_ = S.live, D_ = L_.draw; if (!D_) return;
    if (D_.pts.length < 3) { D_.pts = []; D_.line.setLatLngs([]); return; }   // это было касание, а не линия
    const pre = D_.preset || {};
    let pts = lvSimplify(D_.pts, 2.5 * Math.pow(2, Z - map.getZoom()));
    while (pts.length > 150) pts = lvSimplify(pts, 2 * Math.pow(2, Z - map.getZoom()) * (pts.length / 100));
    if (pre.of) { const o = LVrow().get(pre.of); if (o && o.data && lvMeters({ x: o.data.x, y: o.data.y }, { x: pts[0][0], y: pts[0][1] }) > 10) pts.unshift([o.data.x, o.data.y]); }   // путь начинается от метки
    pts = pts.map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
    D_.line.setLatLngs(pts.map(([x, y]) => toLL(x, y)));
    const [ex, ey] = pts[pts.length - 1], P = lvPref();
    if (pre.quick) {   // противник: сразу на карту, без вопросов
      lvPut('route', 'rt:' + Store.uid(), { x: ex, y: ey, pts, type: pre.type, color: LV_RT[pre.type].c, n: lvNextN(), name: lvName(), of: pre.of || '', text: '', label: '' });
      lvDrawStop(); toast('Направление противника отмечено'); return;
    }
    const st = { type: pre.type || (LV_RT[P.rt] ? P.rt : 'go'), label: '', text: '', to: pre.to ? { id: pre.to, name: pre.toName || '', kind: pre.toKind || '' } : null };
    st.color = P.rc[st.type] || LV_RT[st.type].c;
    let keep = false;   // «Заново» / «Ещё маршрут» — остаёмся с карандашом
    const paint = () => { D_.line.setStyle({ color: st.color, dashArray: LV_RT[st.type].dash }); };
    const html = () => { const tg = lvTargets(); if (st.to && !tg.some(t => t.id === st.to.id)) tg.unshift(Object.assign({ color: '#79b8ff' }, st.to));
      return `<div class="lvm__t">Маршрут ${lvNextN()} · ${Math.round(lvLen(pts))} м${st.to ? ' → ' + esc(st.to.name) : ''}</div>
      <div class="lvm__s">Что это</div><div class="lvm__row">${Object.entries(LV_RT).map(([k, v]) => `<button type="button" class="lvm__b${st.type === k ? ' on' : ''}" data-t="${k}">${v.n}</button>`).join('')}</div>
      ${st.type === 'order' ? `<div class="lvm__s">Приказ</div><div class="lvm__row">${LV_ORDERS.map(o => `<button type="button" class="lvm__b${st.text === o ? ' on' : ''}" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div>` : ''}
      ${tg.length ? `<div class="lvm__s">Кому</div><div class="lvm__row">${tg.map(t => `<button type="button" class="lvm__b lvm__who${st.to && st.to.id === t.id ? ' on' : ''}" style="--c:${esc(t.color)}" data-to="${esc(t.id)}" data-tn="${esc(t.name)}" data-tk="${t.kind}">${t.kind === 'guest' ? '👤 ' : ''}${esc(t.name)}</button>`).join('')}</div>` : ''}
      <div class="lvm__s">Цвет</div><div class="lvm__row lvm__sw">${LV_COLORS.map(c => `<button type="button" class="lvsw${st.color === c ? ' on' : ''}" style="--c:${c}" data-c="${c}" aria-label="Цвет ${c}"></button>`).join('')}</div>
      <div class="lvm__row"><input class="lvm__in" data-lbl maxlength="40" placeholder="${st.type === 'order' ? 'свой текст приказа или подпись' : 'подпись, например «через овраг»'}" value="${esc(st.label)}"></div>
      <div class="lvm__row lvm__acts"><button type="button" class="lvm__b" data-r="again">↺ Заново</button><button type="button" class="lvm__b" data-r="more">✎ Ещё маршрут</button><button type="button" class="lvm__b lvm__b--ok" data-r="ok">Готово</button></div>`; };
    paint();
    const save = () => {
      const lbl = (sh_.el.querySelector('[data-lbl]') || {}).value || '';
      let text = '', label = lbl.trim().slice(0, 40);
      if (st.type === 'order') { text = st.text || label.slice(0, 30); if (!st.text) label = ''; if (!text) { toast('Выберите приказ или впишите свой текст', 'err'); return false; } }
      const id = 'rt:' + Store.uid(), n = lvNextN();
      lvPut('route', id, { x: ex, y: ey, pts, type: st.type, color: st.color, n, name: lvName(), text, label, of: pre.of || '', to: st.to ? st.to.id : '', toName: st.to ? st.to.name : '', toKind: st.to ? st.to.kind : '' });
      const rc = lvPref().rc; rc[st.type] = st.color; lvPrefSet({ rt: st.type, rc });
      return true;
    };
    const sh_ = lvSheet(html(), { x: ex, y: ey }, (e, sh) => {
      const b = e.target.closest('button'); if (!b) return;
      const lblNow = (sh.el.querySelector('[data-lbl]') || {}).value || '';
      if (b.dataset.t) { st.type = b.dataset.t; st.color = lvPref().rc[st.type] || LV_RT[st.type].c; st.text = ''; st.label = lblNow; sh.set(html()); paint(); return; }
      if (b.dataset.c) { st.color = b.dataset.c; st.label = lblNow; sh.set(html()); paint(); return; }
      if (b.dataset.to !== undefined) { st.to = st.to && st.to.id === b.dataset.to ? null : { id: b.dataset.to, name: b.dataset.tn, kind: b.dataset.tk }; st.label = lblNow; sh.set(html()); return; }
      if (b.dataset.o !== undefined) { st.text = st.text === b.dataset.o ? '' : b.dataset.o; st.label = lblNow; sh.set(html()); return; }
      const r = b.dataset.r;
      if (r === 'again') { keep = true; sh.close(); D_.pts = []; D_.line.setLatLngs([]); return; }
      if (r === 'more') { if (!save()) return; keep = true; sh.close(); D_.pts = []; D_.line.setLatLngs([]); toast('Маршрут сохранён — рисуйте следующий'); return; }
      if (r === 'ok') { if (!save()) return; sh.close(); toast(st.to && st.to.kind === 'guest' ? `Маршрут отправлен: ${st.to.name}` : 'Маршрут отмечен'); }
    }, () => { if (!keep && S.live && S.live.draw === D_) lvDrawStop(); });
  }
  function lvRouteMenu(r) {
    const d = r.data || {}, T = LV_RT[d.type] || LV_RT.go, can = !S.live.viewer, hid = lvPref().hidden.includes(r.id);
    lvSheet(`<div class="lvm__t"><span class="lv-n" style="--c:${esc(d.color || T.c)}">${esc(d.n || '')}</span> ${esc(d.text || T.n)}${d.label ? ' — ' + esc(d.label) : ''}</div>
      <div class="lvm__s">${T.n} · ${esc(d.name || '')} · ${Math.round(lvLen(d.pts || []))} м · ${lvAgo(lvAge(r))}${r.pending ? ' · <b style="color:var(--amber)">ещё не отправлено</b>' : ''}</div>
      <div class="lvm__row"><button type="button" class="lvm__b" data-h>${hid ? 'Показать' : 'Скрыть у меня'}</button>${can ? '<button type="button" class="lvm__b lvm__b--del" data-rm>Удалить у всех</button>' : ''}</div>`, d, (e, sh) => {
      if (e.target.closest('[data-h]')) { lvHide(r.id); sh.close(); return; }
      if (can && e.target.closest('[data-rm]')) { lvPut(r.kind, r.id, r.data, true); sh.close(); }
    });
  }
  function lvHide(id) { const P = lvPref(), h = P.hidden.includes(id) ? P.hidden.filter(x => x !== id) : P.hidden.concat(id); lvPrefSet({ hidden: h.slice(-300) }); lvRenderMarks(); }

  /* ---------- «Мои приказы»: маленький список, разворачивается по нажатию ---------- */
  function lvListRender() {
    const box = $('#lvList'); if (!box || !S.live) return;
    const P = lvPref(), all = P.listAll || S.live.viewer, tab = P.list === 'teams' ? 'teams' : P.list ? 'orders' : '';
    const capped = lvCapped();
    const items = [...LVrow().values()].filter(r => lvAlive(r) && !capped.has(r.id) && (r.kind === 'order' || r.kind === 'route' || (r.kind === 'go' && r.data && r.data.pts)) && (all || lvMine(r)))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const guests = [...LVrow().values()].filter(r => r.kind === 'guest' && lvAlive(r));
    const head = `<div class="lvl__hs"><button type="button" class="lvl__h${tab === 'orders' ? ' on' : ''}" data-lt="orders">📋 ${all ? 'Приказы' : 'Мои'} · ${items.length}</button><button type="button" class="lvl__h${tab === 'teams' ? ' on' : ''}" data-lt="teams">👥 Команды</button></div>`;
    box.classList.toggle('open', !!tab);
    if (!tab) { box.innerHTML = head; return; }
    if (tab === 'teams') {
      const g = liveGame(), onMap = id => guests.filter(r => r.data.team === id).length;
      const sides = g ? D().sides.filter(sd => g.sides[sd.id] && sideEntries(g.sides[sd.id]).length) : [];
      box.innerHTML = head + `<div class="lvl__b">${sides.map(sd => { const v = g.sides[sd.id], tot = sideTotal(v);
          return `<div class="lvl__side" style="--c:${esc(sd.color)}">${esc(sd.name)}${tot ? ` · ${tot} чел.` : ''}</div>` + sideEntries(v).map(e => `<div class="lvl__i" data-team="${esc(e.id)}" data-tn="${esc(e.t.name)}">${teamBadge(e.id, sd.id, 'tb--s')}
            <button type="button" class="lvl__go" data-tgo><b>${esc(e.t.name)}</b><small>${e.players != null ? e.players + ' чел.' : e.t.players.length ? e.t.players.length + ' в составе' : ''}${onMap(e.id) ? ` · <b style="color:#ffb347">${onMap(e.id)} на карте</b>` : ''}${e.t.captain ? ' · кэп ' + esc(e.t.captain) : ''}</small></button>
            ${S.live.viewer ? '' : '<button type="button" class="lvl__x" data-tpath title="Задать маршрут команде">✎</button>'}</div>`).join(''); }).join('')
        || '<p class="lvl__e">В этой игре команды не назначены — «Изменить игру» → стороны и команды.</p>'}
        ${guests.filter(r => !r.data.team).length ? `<div class="lvl__side" style="--c:#ffb347">Гости без команды · ${guests.filter(r => !r.data.team).length}</div>` + guests.filter(r => !r.data.team).map(r => `<div class="lvl__i" data-id="${esc(r.id)}"><span class="lv-n" style="--c:#ffb347">👤</span>
            <button type="button" class="lvl__go" data-go><b>${esc(r.data.name || 'Гость')}</b><small>${esc(lvWhere(r.data.x, r.data.y))} · ${lvAgo(lvAge(r))}</small></button></div>`).join('') : ''}</div>`;
      return;
    }
    box.innerHTML = head + `<div class="lvl__b">${items.length ? items.map(r => { const d = r.data || {}, T = LV_RT[d.type] || (r.kind === 'order' ? LV_RT.order : LV_RT.go), hid = P.hidden.includes(r.id);
        const title = r.kind === 'route' ? `${esc(d.text || T.n)}${d.toName ? ' → ' + esc(d.toName) : ''}${d.label ? ' — ' + esc(d.label) : ''}` : r.kind === 'order' ? `Приказ «${esc(d.text || '')}»` : 'Иду';
        return `<div class="lvl__i${hid ? ' hid' : ''}" data-id="${esc(r.id)}"><span class="lv-n" style="--c:${esc(d.color || T.c)}">${esc(d.n || '•')}</span>
          <button type="button" class="lvl__go" data-go><b>${title}</b><small>${all ? esc(d.name || '') + ' · ' : ''}${esc(lvWhere(d.x, d.y))} · ${lvAgo(lvAge(r))}</small></button>
          <button type="button" class="lvl__x" data-hide title="${hid ? 'Показать' : 'Скрыть у меня'}">${hid ? '◌' : '◉'}</button>${S.live.viewer ? '' : '<button type="button" class="lvl__x" data-del title="Удалить у всех">✕</button>'}</div>`; }).join('')
      : '<p class="lvl__e">Пока пусто — приказы и маршруты появятся здесь</p>'}
      ${S.live.viewer ? '' : `<label class="lvl__all"><input type="checkbox" data-all ${P.listAll ? 'checked' : ''}> показывать приказы всех админов</label>`}</div>`;
  }
  function lvListClick(e) {
    e.stopPropagation();
    const lt = e.target.closest('[data-lt]'); if (lt) { const cur = lvPref().list; lvPrefSet({ list: (cur === lt.dataset.lt || (cur === true && lt.dataset.lt === 'orders')) ? false : lt.dataset.lt }); lvListRender(); return; }
    const all = e.target.closest('[data-all]'); if (all) { lvPrefSet({ listAll: all.checked }); lvListRender(); return; }
    const tm = e.target.closest('[data-team]');
    if (tm) { if (e.target.closest('[data-tpath]')) lvDrawStart({ to: tm.dataset.team, toName: tm.dataset.tn, toKind: 'team', type: 'group' }); else lvTeamSheet(tm.dataset.team); return; }
    const it = e.target.closest('[data-id]'); if (!it) return; const r = LVrow().get(it.dataset.id); if (!r) return;
    if (e.target.closest('[data-hide]')) { lvHide(r.id); return; }
    const del = e.target.closest('[data-del]');
    if (del) { if (!del.classList.contains('armed')) { del.classList.add('armed'); del.textContent = 'точно?'; return; } lvPut(r.kind, r.id, r.data, true); return; }
    if (e.target.closest('[data-go]')) { const d = r.data; const b = d.pts && d.pts.length > 1 ? L.latLngBounds(d.pts.map(([x, y]) => toLL(x, y))) : null;
      if (b) map.fitBounds(b, { paddingTopLeft: [30, 90], paddingBottomRight: [30, 110], maxZoom: map.getMaxZoom() - 1 }); else map.setView(toLL(d.x, d.y), Math.max(map.getZoom(), map.getMinZoom() + 2));
      if (r.kind === 'route') lvRouteMenu(r); else if (r.kind === 'guest') lvGuestMenu(r); else lvMarkMenu(r); }
  }

  /** Команда: кто из неё на карте и её последние приказы. */
  function lvTeamSheet(id) {
    const tm = lvGameTeams().get(id); if (!tm) { openTeamCard(id); return; }
    const can = !S.live.viewer, cap = lvPref().cap || 3;
    const people = [...LVrow().values()].filter(r => r.kind === 'guest' && lvAlive(r) && r.data.team === id);
    const ords = [...LVrow().values()].filter(r => r.kind === 'route' && !r.gone && r.data && r.data.toKind === 'team' && r.data.to === id).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const html = `<div class="lvm__t">${lvEmblem(tm, 'lv-em--s')} ${esc(tm.t.name)}</div><div class="lvm__s">${esc(sideName(tm.side))} · на карте: ${people.length ? people.map(r => esc(r.data.name || 'гость')).join(', ') : 'никого'}</div>
      ${ords.length ? `<div class="lvm__s">Приказы (на карте последние ${cap})</div>` + ords.slice(0, cap).map(r => { const d = r.data, T = LV_RT[d.type] || LV_RT.go;
        return `<div class="lvo" data-rid="${esc(r.id)}"><span class="lv-n" style="--c:${esc(d.color || T.c)}">${esc(d.n || '')}</span><span>${esc(d.text || T.n)}${d.label ? ' — ' + esc(d.label) : ''}</span><small>${lvAgo(lvAge(r))}</small></div>`; }).join('')
        + (ords.length > cap ? `<div class="lvm__s">ещё ${ords.length - cap} ${plural(ords.length - cap, 'старый', 'старых', 'старых')} — в журнале</div>` : '') : '<div class="lvm__s">Приказов пока нет.</div>'}
      <div class="lvm__row">${can ? '<button type="button" class="lvm__b" data-tpath>✎ Маршрут команде</button>' : ''}<button type="button" class="lvm__b" data-card>Карточка команды</button></div>`;
    lvSheet(html, null, (e, sh) => {
      const o = e.target.closest('[data-rid]'); if (o) { const r = LVrow().get(o.dataset.rid); if (r) { map.fitBounds(L.latLngBounds(r.data.pts.map(([x, y]) => toLL(x, y))), { paddingTopLeft: [30, 90], paddingBottomRight: [30, 200] }); } return; }
      if (e.target.closest('[data-tpath]')) { sh.close(); lvDrawStart({ to: id, toName: tm.t.name, toKind: 'team', type: 'group' }); return; }
      if (e.target.closest('[data-card]')) { sh.close(); openTeamCard(id); }
    });
  }

  /* ---------- частота: видят все, меняет админ ---------- */
  function lvFreqSync() {
    const el = $('#lvFreq'); if (!el || !S.live) return;
    const f = LVrow().get('freq'), t = f && !f.gone && f.data ? f.data.text : '';
    el.innerHTML = t ? `📻 <b>${esc(t)}</b>` : (S.live.viewer ? '' : '📻 <i>частота</i>');
    el.hidden = !t && S.live.viewer;
  }
  function lvFreqEdit() {
    if (!S.live || S.live.viewer) return;
    const f = LVrow().get('freq'), cur = f && !f.gone && f.data ? f.data.text : '', hist = ls.get('pm-live-freqs', []) || [];
    lvSheet(`<div class="lvm__t">Частота для всех</div><div class="lvm__s">Видна вверху у админов и гостей по ссылке.</div>
      <div class="lvm__row"><input class="lvm__in" data-fq maxlength="40" placeholder="например, 446.075 · PMR 3" value="${esc(cur)}"><button type="button" class="lvm__b lvm__b--ok" data-ok>Сохранить</button></div>
      ${hist.length ? `<div class="lvm__row">${hist.map(h => `<button type="button" class="lvm__b" data-h="${esc(h)}">${esc(h)}</button>`).join('')}</div>` : ''}
      ${cur ? '<div class="lvm__row"><button type="button" class="lvm__b lvm__b--del" data-clr>Убрать частоту</button></div>' : ''}`, null, (e, sh) => {
      const h = e.target.closest('[data-h]'); if (h) { sh.el.querySelector('[data-fq]').value = h.dataset.h; return; }
      if (e.target.closest('[data-clr]')) { lvPut('freq', 'freq', { text: '' }, true); sh.close(); return; }
      if (!e.target.closest('[data-ok]')) return;
      const t = (sh.el.querySelector('[data-fq]').value || '').trim().slice(0, 40); if (!t) { toast('Впишите частоту', 'err'); return; }
      lvPut('freq', 'freq', { text: t }); ls.set('pm-live-freqs', [t].concat(hist.filter(x => x !== t)).slice(0, 5)); sh.close(); toast('Частота: ' + t);
    });
  }

  /* ---------- поворот и роза ветров ---------- */
  function lvFit() { const b = D().border; if (b.length >= 3) map.fitBounds(L.latLngBounds(polyLL(b)), { paddingTopLeft: [10, 60], paddingBottomRight: [10, 70] }); else fitAll(); }
  function lvRose() {}

  /* ---------- «Слои»: что видно на моём экране ---------- */
  function lvLayersSheet() {
    const L_ = S.live; if (!L_) return;
    const tg = (k, label, on) => `<label class="lvt"><span>${label}</span><input type="checkbox" data-k="${k}" ${on ? 'checked' : ''}><i></i></label>`;
    const html = () => { const P = lvPref();
      return `<div class="lvm__t">Слои</div>
      <div class="lvm__s">Точки игры — видимость: <b data-opv>${Math.round(P.ptOp * 100)}%</b></div>
      <input type="range" class="lvr" min="0" max="100" step="5" value="${Math.round(P.ptOp * 100)}" data-op aria-label="Видимость точек игры">
      <div class="lvm__s">Размер значков карты: <b data-szv>${Math.round((P.ptSize || 1) * 100)}%</b></div>
      <input type="range" class="lvr" min="40" max="160" step="10" value="${Math.round((P.ptSize || 1) * 100)}" data-sz aria-label="Размер значков карты">
      <div class="lvt__g">${tg('f:areas', 'Зоны точек', S.f.areas)}${tg('f:labels', 'Названия точек', S.f.labels)}${tg('f:arrows', 'Стрелки игры', S.f.arrows)}${tg('f:places', 'Объекты полигона', S.f.places)}
        ${tg('f:relief', 'Рельеф', S.f.relief)}${tg('f:grid', 'Сетка', S.f.grid)}${tg('f:border', 'Граница', S.f.border)}${tg('f:mapLabels', 'Подписи полигона', S.f.mapLabels)}</div>
      <div class="lvm__s">Метки</div>
      <div class="lvt__g">${Object.entries(LV_SHOW).map(([k, v]) => tg('s:' + k, v, P.show[k] !== false)).join('')}</div>
      ${P.btn && (Object.keys(P.btn.p || {}).length || Object.keys(P.btn.l || {}).length) ? '<div class="lvm__row"><button type="button" class="lvm__b" data-btnreset>Вернуть кнопки на место</button></div>' : ''}
      ${P.hidden.length ? `<div class="lvm__row"><button type="button" class="lvm__b" data-unhide>Показать скрытые (${P.hidden.length})</button></div>` : ''}
      <div class="lvm__s">Прочее</div>
      <div class="lvt__g">${L_.viewer ? '' : (lvAdmin() ? tg('x:pts', 'Можно двигать точки игры', !L_.lockAll) : '')}${tg('x:compass', 'Компас — куда я смотрю', !!L_.compass)}</div>
      <div class="lvm__s">Приказов на команду на карте</div><div class="lvm__row">${[2, 3, 5].map(n => `<button type="button" class="lvm__b${(P.cap || 3) === n ? ' on' : ''}" data-cap="${n}">${n}</button>`).join('')}</div>`; };
    lvSheet(html(), null, (e, sh) => {
      if (e.target.closest('[data-unhide]')) { lvPrefSet({ hidden: [] }); lvRenderMarks(); sh.set(html()); }
      if (e.target.closest('[data-btnreset]')) { lvPrefSet({ btn: {} }); lvBtnPlace(); sh.set(html()); toast('Кнопки на своих местах'); }
      const c = e.target.closest('[data-cap]'); if (c) { lvPrefSet({ cap: +c.dataset.cap }); lvRenderMarks(); sh.set(html()); }
    });
    const el = lvSh && lvSh.el; if (!el) return;
    el.addEventListener('input', e => { if (e.target.matches('[data-sz]')) { const v = +e.target.value / 100; lvPrefSet({ ptSize: v }); lvApplyOp(); el.querySelector('[data-szv]').textContent = Math.round(v * 100) + '%'; return; }
      if (e.target.matches('[data-op]')) { const v = +e.target.value / 100; lvPrefSet({ ptOp: v }); lvApplyOp(); el.querySelector('[data-opv]').textContent = Math.round(v * 100) + '%'; } });
    el.addEventListener('change', e => {
      const k = e.target.dataset && e.target.dataset.k; if (!k) return; const on = e.target.checked, [t, n] = k.split(':');
      if (t === 'f') { S.f[n] = on; ls.set('pm-layers', S.f); applyLayers(); renderMap(); }
      if (t === 's') { const sh = lvPref().show; sh[n] = on; lvPrefSet({ show: sh }); lvRenderMarks(); }
      if (t === 'x' && n === 'pts') { L_.lockAll = !on; renderMap(); toast(on ? 'Точки игры можно перетаскивать' : 'Точки игры закреплены'); }
      if (t === 'x' && n === 'compass') { lvCompass(on); }
    });
  }
  /** Прозрачность точек и зон игры — вплоть до полностью невидимых (тогда они и не мешают нажатиям). */
  function lvApplyOp() {
    const v = S.live ? lvPref().ptOp : 1, mp = map.getPane('markerPane'), ap = map.getPane('areas');
    [mp, ap].forEach(pn => { if (!pn) return; pn.style.opacity = v < 1 ? v : ''; pn.style.pointerEvents = v < .15 ? 'none' : ''; });
    if (mp) mp.classList.toggle('lv-ghost', v < .15);
    map.getContainer().style.setProperty('--mks', S.live ? (lvPref().ptSize || 1) : 1);   // размер значков точек и объектов
  }

  /* ---------- компас: стрелка «куда я смотрю» на моей метке (карта не крутится) ---------- */
  function lvCompass(on) {
    const L_ = S.live; if (!L_) return;
    if (L_.compassFn) { removeEventListener('deviceorientationabsolute', L_.compassFn); removeEventListener('deviceorientation', L_.compassFn); L_.compassFn = null; }
    clearTimeout(L_.compassT); L_.compass = false; L_.heading = null; lvPrefSet({ compass: !!on });
    if (!on) { lvRenderMarks(); return; }
    const start = () => {
      let raf = 0;
      L_.compassFn = e => {
        let h = e.webkitCompassHeading != null ? e.webkitCompassHeading : (e.absolute || e.type === 'deviceorientationabsolute') && e.alpha != null ? 360 - e.alpha : null;
        if (h == null) return;
        const so = (screen.orientation && screen.orientation.angle) || window.orientation || 0; h = (h + so + 360) % 360;
        clearTimeout(L_.compassT); L_.heading = h;
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; const c = document.querySelector('.lv--mine .lv__cone'); if (c) c.style.transform = `rotate(${Math.round(L_.heading + ROT * 90)}deg)`; else lvRenderMarks(); });
      };
      addEventListener('ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation', L_.compassFn);
      L_.compass = true;
      L_.compassT = setTimeout(() => { if (S.live === L_ && L_.heading == null) { toast('Телефон не даёт направление — компас недоступен', 'err'); lvCompass(false); } }, 4000);
      if (!LVrow().get('me:' + lvMeKey())) toast('Компас включён — стрелка появится на вашей метке «я тут»');
    };
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function')   // iPhone: нужно разрешение
      DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') start(); else { toast('Разрешите доступ к датчикам движения', 'err'); lvPrefSet({ compass: false }); } }).catch(() => { toast('Компас недоступен', 'err'); lvPrefSet({ compass: false }); });
    else if (typeof DeviceOrientationEvent === 'undefined') { toast('Компас недоступен на этом устройстве', 'err'); lvPrefSet({ compass: false }); }
    else start();
  }

  /** Маршрут на карте: обводка, линия и стрелка на конце. */
  function lvRoute(pts, color, dash) {
    if (!pts || pts.length < 2) return;
    const P = pts.map(([x, y]) => [x * W, y * H]), n = P.length, len = 16 * Math.pow(2, Z - map.getZoom());
    let k = n - 2; while (k > 0 && Math.hypot(P[n - 1][0] - P[k][0], P[n - 1][1] - P[k][1]) < len) k--;
    const [x1, y1] = P[k], [x2, y2] = P[n - 1], ang = Math.atan2(y2 - y1, x2 - x1);
    const body = P.slice(0, -1).concat([[x2 - len * .7 * Math.cos(ang), y2 - len * .7 * Math.sin(ang)]]).map(pxLL);
    L.polyline(body, { pane: 'live', color: '#000', weight: 6, opacity: .45, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(liveLayer);
    L.polyline(body, { pane: 'live', color, weight: 3.5, opacity: .95, dashArray: dash || null, interactive: false, lineCap: 'round', lineJoin: 'round' }).addTo(liveLayer);
    L.polygon([[x2, y2], [x2 - len * Math.cos(ang - .45), y2 - len * Math.sin(ang - .45)], [x2 - len * Math.cos(ang + .45), y2 - len * Math.sin(ang + .45)]].map(pxLL), { pane: 'live', color: '#000', weight: 1, fillColor: color, fillOpacity: 1, interactive: false }).addTo(liveLayer);
  }

  /* ---------- GPS ---------- */
  function lvGpsFix(once) {
    if (!navigator.geolocation) { toast('Телефон не даёт координаты', 'err'); return; }
    if (!relief || !relief.bounds) { toast('Подложка не привязана к местности — GPS недоступен', 'err'); return; }
    const ok = pos => {
      const c = pos.coords, p = geoToXY(c.latitude, c.longitude); if (!S.live || !p) return;
      if (p.x < -0.05 || p.x > 1.05 || p.y < -0.05 || p.y > 1.05) {
        const g = geoCenter(), km = g ? (Math.hypot((c.latitude - g[0]) * 111.32, (c.longitude - g[1]) * 111.32 * Math.cos(g[0] * Math.PI / 180))).toFixed(1).replace('.', ',') : '?';
        toast(`Вы вне полигона — до центра ${km} км`, 'err'); return;
      }
      const G = S.live.gps, now = Date.now();
      if (!once && G && G.last && now - G.last.t < 20000 && lvMeters(G.last, p) < 8) return;   // не дёргаем базу без нужды
      if (G) G.last = { t: now, x: p.x, y: p.y };
      lvPutMe(clamp01(p.x), clamp01(p.y), { gps: true, acc: Math.round(c.accuracy) });
      if (once) { map.setView(toLL(p.x, p.y), Math.max(map.getZoom(), map.getMinZoom() + 2)); toast(`Отмечено по GPS, точность ~${Math.round(c.accuracy)} м`); }
    };
    const bad = e => toast(e.code === 1 ? 'Разрешите сайту доступ к геопозиции в настройках браузера' : 'Не удалось получить координаты — попробуйте на открытом месте', 'err');
    if (once) navigator.geolocation.getCurrentPosition(ok, bad, { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 });
    else return navigator.geolocation.watchPosition(ok, e => { bad(e); lvGpsStop(); lvUiSync(); }, { enableHighAccuracy: true, maximumAge: 10000 });
  }
  function lvGpsToggle() {
    const L_ = S.live; if (!L_) return;
    if (L_.gps) { lvGpsStop(); toast('Слежение по GPS выключено'); }
    else { L_.gps = { watch: null, last: null }; L_.gps.watch = lvGpsFix(false); if (L_.gps && L_.gps.watch == null) L_.gps = null; else toast('GPS: ваша метка обновляется сама, пока открыт сайт'); }
    lvUiSync();
  }
  function lvGpsStop() { const L_ = S.live; if (L_ && L_.gps) { if (L_.gps.watch != null) navigator.geolocation.clearWatch(L_.gps.watch); L_.gps = null; } }

  /* ---------- интерфейс поверх карты ---------- */
  function lvUi() {
    const old = $('#liveUi'); if (old) old.remove();
    const v = S.live.viewer, box = document.createElement('div'); box.id = 'liveUi'; box.className = 'lvui';
    box.innerHTML = `<div class="lvui__top"><span class="lvui__st" id="lvSt"></span><div class="lvui__ttl"><b>${v ? 'Лайф-карта' : 'Лайф-карта'}</b><span id="lvGame"></span></div><button type="button" class="lvui__fq" id="lvFreq" ${v ? 'disabled' : ''}></button>
        ${v ? '' : '<button type="button" class="lvui__ib" id="lvMapLock" title="Закрепить карту">✋</button>'}<button type="button" class="lvui__ib" id="lvClean" title="Спрятать всё — только карта">👁</button><button type="button" class="lvui__ib" id="lvOri" title="Закрепить поворот экрана">↻</button><button type="button" class="lvui__ib" id="lvFs" title="Полный экран">⛶</button>
        <button type="button" class="lvui__x" id="lvExit" title="${v ? 'Перейти на сайт' : 'Выйти из лайф-карты'}">${v ? 'На сайт' : '✕'}</button></div>
      <div class="lvui__err" id="lvErr" hidden></div>
      ${v ? '' : `<div class="lvui__hint" id="lvHint">2× нажатие — я тут · удержать — метки · ✎ — путь</div>
      <div class="lvui__bot">
        <button type="button" id="lvMe"><b>◎</b>Я тут</button>
        <button type="button" id="lvDraw"><b>✎</b><span>Путь</span></button>
        <button type="button" id="lvLayers"><b>◫</b>Слои</button>
        <button type="button" id="lvGps"><b>⌖</b><span>GPS</span></button>
        <button type="button" id="lvMore"><b>☰</b>Ещё</button></div>`}
      <div class="lvl" id="lvList"></div>
      <button type="button" class="lvui__show" id="lvShow" title="Вернуть кнопки">👁</button>
      <div class="lvui__side"><button type="button" class="lvui__rose" id="lvRose" title="Север — вверху карты"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#0e130ccc" stroke="#47583b"/><path d="M20 4l5 16h-10z" fill="#ef5a42"/><path d="M20 36l5-16h-10z" fill="#cfd6c2"/><text x="20" y="13.5" text-anchor="middle" font-size="7" font-weight="700" fill="#fff">С</text></svg></button></div>
      <div class="lvmsg" id="lvMsg" hidden></div>
      ${v ? `<div class="lvui__hint" id="lvHint">2× нажатие по карте — отметить, где вы</div>
      <div class="lvui__bot lvui__bot--v"><button type="button" id="lvMe"><b>◎</b>Я тут</button><button type="button" id="lvNick"><b>✎</b><span>Позывной</span></button><button type="button" id="lvLayers"><b>◫</b>Слои</button></div>` : ''}`;
    $('.stage').appendChild(box);
    $('#lvExit').onclick = () => exitLive();
    $('#lvFs').onclick = lvFsToggle;
    $('#lvOri').onclick = lvOriToggle;
    $('#lvClean').onclick = () => lvClean(true); $('#lvShow').onclick = () => lvClean(false);
    lvBtnDrag(); lvBtnPlace();
    $('#lvLayers').onclick = lvLayersSheet;
    $('#lvRose').onclick = () => toast('Север — вверху карты');
    $('#lvFreq').onclick = lvFreqEdit;
    ['pointerdown', 'dblclick', 'contextmenu'].forEach(t => [$('#lvRose'), $('#lvMsg')].forEach(el => el.addEventListener(t, e => e.stopPropagation())));
    if (v) { $('#lvMe').onclick = () => lvGpsFix(true);
      const upd = (n, t) => { const g = LVrow().get('gu:' + lvDevice()); if (g && !g.gone) lvPut('guest', g.id, Object.assign({}, g.data, { name: n, team: t })); };
      $('#lvNick').onclick = () => lvAcc() ? openProfileForm(() => { const a = store.account(); upd(a.callsign || a.login, a.team); }) : lvAskNick(upd); }
    $('#lvList').addEventListener('click', lvListClick);
    ['pointerdown', 'dblclick', 'contextmenu', 'wheel'].forEach(t => $('#lvList').addEventListener(t, e => e.stopPropagation()));
    if (!v) {
      $('#lvMapLock').onclick = () => lvMapLock(!S.live.mapLock);
      $('#lvDraw').onclick = lvDrawStart;
      $('#lvMe').onclick = () => lvGpsFix(true);
      $('#lvGps').onclick = lvGpsToggle;
      $('#lvMore').onclick = lvMoreMenu;
      setTimeout(() => { const h = $('#lvHint'); if (h) h.classList.add('fade'); }, 8000);
    }
    lvUiSync(); lvStatus(); lvListRender(); lvFreqSync(); lvRose();
  }
  /** «Только карта»: прячем все кнопки и панели, остаётся одна кнопка, чтобы вернуть. Сообщения всё равно всплывают. */
  function lvClean(on) { app.classList.toggle('lv-clean', !!on); lvSheetClose(); if (S.live) S.live.clean = !!on; }

  /* Кнопки можно перетащить: держать ~0,7 с, потом тянуть. Место запоминается отдельно для «вертикально» и «боком». */
  const LV_BTNS = ['lvMe', 'lvDraw', 'lvLayers', 'lvGps', 'lvMore', 'lvNick'];
  const lvOri = () => matchMedia('(orientation: landscape)').matches ? 'l' : 'p';
  function lvBtnPlace() {
    const ui = $('#liveUi'); if (!ui) return; const bot = ui.querySelector('.lvui__bot'); if (!bot) return;
    const pos = (lvPref().btn || {})[lvOri()] || {};
    LV_BTNS.forEach(id => { const b = ui.querySelector('#' + id); if (!b) return; const p = pos[id];
      if (p) { if (b.parentElement !== ui) ui.appendChild(b); b.classList.add('lv-free'); b.style.left = (p.x * 100) + '%'; b.style.top = (p.y * 100) + '%'; }
      else if (b.classList.contains('lv-free')) { b.classList.remove('lv-free'); b.style.left = b.style.top = ''; } });
    // вернуть «свободные» без места в панель в исходном порядке
    LV_BTNS.forEach(id => { const b = ui.querySelector('#' + id); if (b && !b.classList.contains('lv-free') && b.parentElement !== bot) bot.appendChild(b); });
    LV_BTNS.forEach(id => { const b = bot.querySelector('#' + id); if (b) bot.appendChild(b); });
    bot.classList.toggle('lv-empty', !bot.children.length);
  }
  function lvBtnDrag() {
    const ui = $('#liveUi'); if (!ui) return; let st = null;
    ui.addEventListener('pointerdown', e => {
      const b = e.target.closest(LV_BTNS.map(i => '#' + i).join(',')); if (!b || (e.pointerType === 'mouse' && e.button !== 0)) return;
      st = { b, x: e.clientX, y: e.clientY, id: e.pointerId, on: false, t: setTimeout(() => {
        st.on = true; b.classList.add('lv-dragging'); if (navigator.vibrate) navigator.vibrate(40);
        const r = b.getBoundingClientRect(), u = ui.getBoundingClientRect(); st.dx = st.x - r.left; st.dy = st.y - r.top;
        if (b.parentElement !== ui) { ui.appendChild(b); b.classList.add('lv-free'); }
        b.style.left = ((r.left - u.left) / u.width * 100) + '%'; b.style.top = ((r.top - u.top) / u.height * 100) + '%';
        try { b.setPointerCapture(st.id); } catch (x) {}
      }, 700) };
    });
    ui.addEventListener('pointermove', e => {
      if (!st || e.pointerId !== st.id) return;
      if (!st.on) { if (Math.hypot(e.clientX - st.x, e.clientY - st.y) > 10) { clearTimeout(st.t); st = null; } return; }
      e.preventDefault(); const u = ui.getBoundingClientRect(), b = st.b, w = b.offsetWidth, h = b.offsetHeight;
      const l = Math.min(u.width - w, Math.max(0, e.clientX - u.left - st.dx)), t = Math.min(u.height - h, Math.max(0, e.clientY - u.top - st.dy));
      b.style.left = (l / u.width * 100) + '%'; b.style.top = (t / u.height * 100) + '%';
    });
    const end = e => {
      if (!st || e.pointerId !== st.id) return; clearTimeout(st.t);
      if (st.on) { const b = st.b, u = ui.getBoundingClientRect(), r = b.getBoundingClientRect(); b.classList.remove('lv-dragging');
        const all = lvPref().btn || {}, o = lvOri(); all[o] = Object.assign({}, all[o], { [b.id]: { x: (r.left - u.left) / u.width, y: (r.top - u.top) / u.height } }); lvPrefSet({ btn: all });
        b.dataset.noclick = '1'; setTimeout(() => { delete b.dataset.noclick; }, 400); lvBtnPlace(); toast('Кнопка перенесена. Вернуть все на место — в «Слоях»'); }
      st = null;
    };
    ui.addEventListener('pointerup', end); ui.addEventListener('pointercancel', end);
    ui.addEventListener('click', e => { const b = e.target.closest('[data-noclick]'); if (b) { e.stopPropagation(); e.preventDefault(); } }, true);
    ui.addEventListener('contextmenu', e => { if (e.target.closest(LV_BTNS.map(i => '#' + i).join(','))) e.preventDefault(); });
  }
  addEventListener('resize', () => { if (S.live) { clearTimeout(lvBpT); lvBpT = setTimeout(lvBtnPlace, 150); } });
  let lvBpT = 0;
  function lvUiSync() {
    const L_ = S.live; if (!L_) return; const g = liveGame();
    const ge = $('#lvGame'); if (ge) ge.textContent = g ? `${fmtDate(g.date)} · ${g.title}` : '';
    const ml = $('#lvMapLock'); if (ml) { ml.classList.toggle('on', !!L_.mapLock); ml.textContent = L_.mapLock ? '🔒' : '✋'; ml.title = L_.mapLock ? 'Карта закреплена — нажмите, чтобы снова двигать' : 'Закрепить карту (не сдвинется от касаний)'; }
    const ori = $('#lvOri'); if (ori) { ori.classList.toggle('on', !!L_.oriOn); ori.textContent = L_.oriOn ? '🔒' : '↻'; ori.title = L_.oriOn ? 'Поворот закреплён — нажмите, чтобы экран снова поворачивался с телефоном' : 'Закрепить поворот экрана как сейчас';
      ori.hidden = !(screen.orientation && screen.orientation.lock) || (!lvFsCan() && !lvStandalone()); }
    const fs = $('#lvFs'); if (fs) { const on = !!document.fullscreenElement; fs.classList.toggle('on', on); fs.hidden = lvStandalone() && !lvFsCan(); fs.title = on ? 'Выйти из полного экрана' : 'Полный экран'; }
    const dr = $('#lvDraw'); if (dr) { dr.classList.toggle('on', !!L_.draw); dr.querySelector('span').textContent = L_.draw ? 'Отмена' : 'Путь'; }
    const gp = $('#lvGps'); if (gp) { gp.classList.toggle('on', !!L_.gps); gp.querySelector('span').textContent = L_.gps ? 'GPS вкл' : 'GPS'; }
  }
  function lvStatus() {
    const L_ = S.live, st = $('#lvSt'); if (!L_ || !st) return;
    const q = L_.queue.length, ok = L_.online && Date.now() - L_.lastOk < 20000;
    st.className = 'lvui__st ' + (L_.online == null ? 'wait' : ok ? (q ? 'q' : 'ok') : 'off');
    st.title = L_.online == null ? 'Подключение…' : ok ? (q ? `Отправляю: ${q}` : 'На связи') : 'Нет связи' + (q ? ` — в очереди ${q}` : '');
    st.textContent = L_.online == null ? '…' : ok ? (q ? '↑' + q : '') : (q ? '✕ ' + q : '✕');
    const er = $('#lvErr'); if (er) { er.hidden = !L_.err && ok !== false; er.textContent = L_.err || (L_.online === false ? 'Нет связи — метки отправятся, когда появится сеть' : ''); if (!L_.err && L_.online !== false) er.hidden = true; }
  }
  function lvMoreMenu() {
    const L_ = S.live, g = liveGame(); if (!g) return;
    const edits = livePoints(g).filter(p => p.edited).length, marks = [...L_.rows.values()].filter(lvVisible).length;
    openDialog({
      title: 'Лайф-карта',
      body: `<div class="lvmore">
        ${lvAdmin() ? '<button type="button" class="btn" data-lv="share">🔗 Ссылки и QR-код (только просмотр)</button>' : ''}
        <button type="button" class="btn" data-lv="log">☰ Журнал игры</button>
        <button type="button" class="btn" data-lv="name">✎ Позывной: ${esc(lvName())}</button>
        <button type="button" class="btn" data-lv="game">⇄ Другая игра</button>
        ${lvAdmin() ? '' : '<!--'}<button type="button" class="btn" data-lv="apply" ${edits ? '' : 'disabled'}>⤓ Перенести итог в игру${edits ? ` (${edits} ${plural(edits, 'точка', 'точки', 'точек')})` : ''}</button>
        <button type="button" class="btn danger" data-lv="clear" ${marks ? '' : 'disabled'}>Убрать все метки${marks ? ` (${marks})` : ''}</button>${lvAdmin() ? '' : '-->'}</div>
        <small class="hint">Точки, которые вы двигали или перекрасили, остаются на лайф-карте. «Перенести итог в игру» запишет их владельцев в «после игры» — это увидят посетители сайта.</small>`,
      onOpen: f => f.addEventListener('click', async e => {
        const b = e.target.closest('[data-lv]'); if (!b) return; const a = b.dataset.lv;
        if (a === 'share') { $('#dlg').close(); lvShareForm(); }
        if (a === 'log') { $('#dlg').close(); lvJournal(); }
        if (a === 'name') { const n = prompt('Позывной на карте', lvName()); if (n && n.trim()) { ls.set('pm-live-name', n.trim().slice(0, 24)); const me = LVrow().get('me:' + lvMeKey()); if (me && !me.gone) lvPut('me', me.id, Object.assign({}, me.data, { name: n.trim().slice(0, 24) })); $('#dlg').close(); } }
        if (a === 'game') { $('#dlg').close(); exitLive(true); openLiveStart(); }
        if (a === 'apply') { if (!b.classList.contains('armed')) { b.classList.add('armed'); b.textContent = 'Точно? Посетители увидят это как итог игры'; return; } $('#dlg').close(); await lvApply(); }
        if (a === 'clear') { if (!b.classList.contains('armed')) { b.classList.add('armed'); b.textContent = 'Точно убрать все метки? Нажмите ещё раз'; return; }
          try { await store.live.clear(L_.game); LVrow().forEach(r => { if (r.kind !== 'pt') r.gone = true; }); lvRenderMarks(); toast('Метки убраны'); } catch (err) { toast('Нет связи — попробуйте позже', 'err'); } $('#dlg').close(); }
      })
    });
  }
  async function lvApply() {
    const g = D().games.find(x => x.id === S.live.game); if (!g) return;
    const lp = livePoints(g); let n = 0;
    lp.filter(p => p.edited).forEach(p => { const q = g.points.find(z => z.id === p.id); if (!q) return; q.x = p.x; q.y = p.y; q.after = p.live || ''; if (isFuture(g)) q.before = q.after; n++; });
    await commit(`Итог перенесён в игру: ${n} ${plural(n, 'точка', 'точки', 'точек')}`);
  }
  /** QR-код ссылки: библиотека грузится только когда нужна. */
  function lvQr(box, url) {
    const draw = () => { const q = window.qrcode(0, 'M'); q.addData(url); q.make(); box.innerHTML = q.createSvgTag({ cellSize: 6, margin: 3, scalable: true }); };
    if (window.qrcode) return draw();
    box.innerHTML = '<p class="hint">Рисую QR-код…</p>';
    const sc = document.createElement('script'); sc.src = 'vendor/qrcode/qrcode.js'; sc.onload = draw; sc.onerror = () => { box.innerHTML = '<p class="hint">Не удалось загрузить QR-код — отправьте ссылку текстом.</p>'; }; document.head.appendChild(sc);
  }
  /** Ссылки для просмотра: создать с подписью, список действующих (все игры), QR, копировать, отключить по одной. Только админ. */
  function lvShareForm(showTk) {
    const L_ = S.live, base = location.origin + location.pathname, url = tk => `${base}?live=${tk}`;
    const gname = id => { const g = D().games.find(x => x.id === id); return g ? `${fmtDate(g.date)} · ${g.title}` : 'игра удалена'; };
    const until = iso => { const d = new Date(iso), h = Math.round((d - Date.now()) / 3600e3); return `до ${d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}${h > 0 ? ` (≈${h} ч)` : ' (меньше часа)'}`; };
    openDialog({
      title: 'Ссылки на лайф-карту',
      body: `<div class="note">По ссылке видно точки и метки игры; гости отмечают себя и получают ваши сообщения. Ставить приказы и двигать точки по ссылке нельзя. Ссылки видит только админ.${store.live.shared ? '' : '<br><b style="color:var(--amber)">Без базы ссылка откроется только в этом браузере.</b>'}</div>
        <div class="sec__t">Новая ссылка — на эту игру: ${esc(gname(L_.game))}</div>
        <div class="row2">${fld('Для кого (подпись)', '<input name="lbl" maxlength="60" placeholder="например, гости субботы">')}${fld('Работает', `<select name="h"><option value="3">3 часа</option><option value="6" selected>6 часов</option><option value="12">12 часов</option><option value="24">сутки</option><option value="72">3 дня</option></select>`)}</div>
        <button type="button" class="btn primary" id="lvMk">Создать ссылку и QR-код</button>
        <div class="lvqr" id="lvQrBox" hidden><div class="lvqr__img" id="lvQr"></div><div class="lvqr__t" id="lvQrT"></div><div class="lvshare"><input readonly id="lvUrl"><button type="button" class="btn" id="lvCopy">Копировать</button></div></div>
        <div class="sec__t">Действующие ссылки</div><div id="lvShares"><p class="hint">Загружаю…</p></div>`,
      onOpen: f => {
        const showQr = (tk, label, game) => { const u = url(tk); f.querySelector('#lvQrBox').hidden = false; f.querySelector('#lvUrl').value = u;
          f.querySelector('#lvQrT').innerHTML = `<b>${esc(label || 'без подписи')}</b><small>${esc(gname(game))}</small>`; lvQr(f.querySelector('#lvQr'), u);
          f.querySelector('#lvQrBox').scrollIntoView({ block: 'nearest' }); };
        let list = [];
        const load = async () => {
          const box = f.querySelector('#lvShares');
          try { list = await store.live.shareList(); } catch (e) { box.innerHTML = `<p class="hint">${/function|404/.test(e.message) ? 'Выполните обновлённый supabase/live.sql в Supabase' : 'Нет связи — список не загрузился'}</p>`; return; }
          box.innerHTML = list.length ? list.map(x => `<div class="lvsh" data-tk="${esc(x.token)}"><div class="lvsh__t"><b>${esc(x.label || 'без подписи')}</b><small>${esc(gname(x.game_id))} · ${esc(until(x.expires_at))}${x.created_by ? ' · ' + esc(String(x.created_by).split('@')[0]) : ''}</small></div>
              <button type="button" class="btn" data-qr title="Показать QR-код">QR</button><button type="button" class="btn" data-cp title="Копировать ссылку">⧉</button><button type="button" class="btn danger" data-off title="Отключить">✕</button></div>`).join('')
            : '<p class="hint">Действующих ссылок нет.</p>';
          if (showTk) { const x = list.find(y => y.token === showTk); if (x) showQr(x.token, x.label, x.game_id); showTk = null; }
        };
        load();
        f.querySelector('#lvMk').onclick = async () => {
          const lbl = f.querySelector('[name=lbl]').value.trim();
          try { const tk = await store.live.shareNew(L_.game, +f.querySelector('[name=h]').value, lbl); f.querySelector('[name=lbl]').value = ''; showQr(tk, lbl, L_.game); load(); toast('Ссылка создана'); }
          catch (e) { toast(/function|404/.test(e.message) ? 'Выполните обновлённый supabase/live.sql в Supabase' : /not_admin/.test(e.message) ? 'Ссылки выдаёт только админ' : 'Нет связи — попробуйте ещё раз', 'err'); }
        };
        const copy = async u => { try { await navigator.clipboard.writeText(u); } catch (e) { const i = f.querySelector('#lvUrl'); i.value = u; i.select(); document.execCommand('copy'); } toast('Ссылка скопирована'); };
        f.querySelector('#lvCopy').onclick = () => copy(f.querySelector('#lvUrl').value);
        f.querySelector('#lvShares').addEventListener('click', async e => {
          const r = e.target.closest('[data-tk]'); if (!r) return; const x = list.find(y => y.token === r.dataset.tk); if (!x) return;
          if (e.target.closest('[data-qr]')) showQr(x.token, x.label, x.game_id);
          if (e.target.closest('[data-cp]')) copy(url(x.token));
          const off = e.target.closest('[data-off]');
          if (off) { if (!off.classList.contains('armed')) { off.classList.add('armed'); off.textContent = 'Точно?'; return; }
            try { await store.live.shareDel(x.token); toast(`Ссылка «${x.label || 'без подписи'}» отключена`); if (f.querySelector('#lvUrl').value === url(x.token)) f.querySelector('#lvQrBox').hidden = true; load(); } catch (err) { toast('Нет связи — попробуйте ещё раз', 'err'); } }
        });
      }
    });
  }
  async function lvJournal() {
    const L_ = S.live; let list = [];
    try { list = await store.live.journal(L_.game, 300); } catch (e) { toast('Нет связи — журнал не загрузился', 'err'); return; }
    const t = s => { const d = new Date(s); return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); };
    const line = l => { const d = l.data || {}, w = d.x != null ? lvWhere(d.x, d.y) : '', who = d.name || (l.author || '').split('@')[0] || 'админ';
      if (l.kind === 'pt') return l.gone ? `точка «${esc(d.name || '')}» — как в игре` : `точка «${esc(d.name || '')}»: ${esc(sideName(d.owner))}${d.lock ? ', закреплена' : ''} · ${esc(w)}`;
      const route = d.pts && d.pts.length > 1 ? ' по маршруту' : '';
      const RT = LV_RT[d.type] || LV_RT.go;
      if (l.kind === 'guest') return `<b>${esc(d.name || 'гость')}</b> (гость): ${l.gone ? 'убран с карты' : d.ack ? 'принял сообщение' : 'отметился'} · ${esc(w)}`;
      if (l.kind === 'pl') return `<b>${esc(who)}</b>: игрок «${esc(d.name || '')}» ${l.gone ? 'убран' : 'на карте'} · ${esc(w)}`;
      if (l.kind === 'ack') return `<b>${esc(d.name || who)}</b>: принял сообщение`;
      if (l.kind === 'msg') return `<b>${esc(who)}</b> → ${esc(d.toName || 'гость')}: «${esc(d.text || '')}»`;
      if (l.kind === 'freq') return `<b>${esc(who)}</b>: частота ${l.gone ? 'убрана' : '«' + esc(d.text || '') + '»'}`;
      const what = { route: `маршрут ${esc(d.n || '')} «${esc(d.text || RT.n)}»${d.label ? ' — ' + esc(d.label) : ''}`, me: d.gps ? 'я тут (GPS)' : 'я тут', go: route ? 'иду по маршруту' : 'иду сюда', order: `приказ «${esc(d.text || '')}»${route}`, enemy: `противник${d.count ? ' ×' + esc(d.count) : ''}`, medic: 'нужен медик' }[l.kind] || l.kind;
      return `<b>${esc(who)}</b>: ${l.gone ? 'снял — ' : ''}${what} · ${esc(w)}`; };
    openDialog({
      title: 'Журнал игры',
      body: list.length ? `<ol class="lvlog">${list.map(l => `<li><time>${t(l.at)}</time><span>${line(l)}</span></li>`).join('')}</ol>` : '<p class="hint">Пока пусто — здесь появится каждая метка со временем.</p>'
    });
  }

  /** Вход по ссылке ?live=… — только просмотр. */
  function lvFromUrl() {
    const tk = new URLSearchParams(location.search).get('live');
    if (tk && /^[\w-]{8,80}$/.test(tk)) { enterLive({ token: tk }); return true; }
    return false;
  }

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
    lvGestures();
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
    if (lvFromUrl()) { /* зритель по ссылке — сразу на лайф-карту */ }
    else if (wantsAdmin() && !store.canWrite()) openLogin();
    else if (store.mode === 'supabase' && store.canWrite() && store.isEmpty()) await afterSbLogin();
    else if (store.mode === 'supabase' && store.canWrite()) setTimeout(peopleNotice, 2500);
    // другой админ мог сохранить свою версию, пока вкладка была в фоне — подтягиваем
    if (store.mode === 'supabase') addEventListener('focus', async () => {
      if (!store.canWrite() || $('#dlg').open || S.mode || S.live) return;
      try { const r = await store.remoteVersion(); if (r && r.version > store.meta().version) { await reload(); toast(`Данные обновил ${r.updated_by || 'другой админ'} — показана свежая версия`); } } catch (e) {}
    });
  } catch (e) {
    console.error(e);
    $('#panelBody').innerHTML = `<div class="empty" style="color:var(--enemy)">Ошибка: ${esc(e.message)}</div>`;
  }
})();
