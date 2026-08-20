/**
 * Porsi — split the money you have into percentage slices.
 *
 * One screen, one job: type an amount, type the percentages, watch the pie and
 * the rupiah/dollar figures follow. Everything lives in localStorage; there is
 * no server and no market data.
 */
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const STORE = 'porsi.v1';

  const i18n = window.I18N;
  const t = (key, vars) => i18n.t(key, vars);
  /* Class names live in i18n so they follow the chosen language; assets.js
     only carries the fallback wording. */
  const clsLabel = (id) => t('cls.' + id);
  const clsShort = (id) => t('clsShort.' + id);
  /* Instruments described rather than branded ("Kas / Tabungan") have a
     translation; a real company name does not, and keeps assets.js's wording. */
  const assetName = (a) => (a ? (i18n.maybe('asset.' + a.ticker) || a.name) : '');

  /* ── Currencies ─────────────────────────────────────────────────────────── */

  /* Formatting only. There is no FX feed here, so switching currency restyles
     the number — it never converts it. */
  const CURRENCIES = {
    IDR: { code: 'IDR', symbol: 'Rp', locale: 'id-ID', decimals: 0 },
    USD: { code: 'USD', symbol: '$', locale: 'en-US', decimals: 2 },
    EUR: { code: 'EUR', symbol: '\u20ac', locale: 'de-DE', decimals: 2 },
    SGD: { code: 'SGD', symbol: 'S$', locale: 'en-SG', decimals: 2 },
    CHF: { code: 'CHF', symbol: 'CHF', locale: 'de-CH', decimals: 2 },
    JPY: { code: 'JPY', symbol: '\u00a5', locale: 'ja-JP', decimals: 0 },
  };

  /** Five-point star, drawn point-up. Used by several of the flags below. */
  function starPath(cx, cy, r, turn) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r * 0.42 : r;
      const a = (Math.PI / 5) * i - Math.PI / 2 + (turn || 0);
      d += `${i ? 'L' : 'M'}${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
    }
    return d + 'Z';
  }

  /**
   * Flag icons, drawn rather than fetched — no network, no licence question.
   * Each one is simplified down to what still reads at 20px wide.
   */
  function flagEl(code) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 16');
    svg.setAttribute('class', 'flag');
    svg.setAttribute('aria-hidden', 'true');

    const add = (tag, attrs) => {
      const n = document.createElementNS(SVG_NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      svg.appendChild(n);
      return n;
    };
    const field = (fill) => add('rect', { x: 0, y: 0, width: 24, height: 16, fill });

    if (code === 'IDR') {
      add('rect', { x: 0, y: 0, width: 24, height: 8, fill: '#ce1126' });
      add('rect', { x: 0, y: 8, width: 24, height: 8, fill: '#ffffff' });

    } else if (code === 'JPY') {
      field('#ffffff');
      add('circle', { cx: 12, cy: 8, r: 4.6, fill: '#bc002d' });

    } else if (code === 'CHF') {
      /* The Swiss flag is square; on a 3:2 field the cross keeps its proportions. */
      field('#d52b1e');
      add('rect', { x: 10.6, y: 3.4, width: 2.8, height: 9.2, fill: '#ffffff' });
      add('rect', { x: 7.4, y: 6.6, width: 9.2, height: 2.8, fill: '#ffffff' });

    } else if (code === 'EUR') {
      field('#003399');
      /* Twelve stars in a ring — the count is fixed, not a member tally. */
      for (let i = 0; i < 12; i++) {
        const a = (Math.PI / 6) * i - Math.PI / 2;
        add('path', {
          d: starPath(12 + Math.cos(a) * 4.9, 8 + Math.sin(a) * 4.9, 1.05),
          fill: '#ffcc00',
        });
      }

    } else if (code === 'SGD') {
      add('rect', { x: 0, y: 0, width: 24, height: 8, fill: '#ed2939' });
      add('rect', { x: 0, y: 8, width: 24, height: 8, fill: '#ffffff' });
      /* Crescent: a white disc with a red disc bitten out of its right side. */
      add('circle', { cx: 5.2, cy: 4.1, r: 3.1, fill: '#ffffff' });
      add('circle', { cx: 6.9, cy: 4.1, r: 2.7, fill: '#ed2939' });
      /* Five stars in a ring beside it. */
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
        add('path', {
          d: starPath(10.6 + Math.cos(a) * 1.75, 4.1 + Math.sin(a) * 1.75, 0.82),
          fill: '#ffffff',
        });
      }

    } else {
      /* United States: 13 stripes, then the canton. */
      for (let i = 0; i < 13; i++) {
        add('rect', { x: 0, y: (16 / 13) * i, width: 24, height: 16 / 13, fill: i % 2 ? '#ffffff' : '#b22234' });
      }
      add('rect', { x: 0, y: 0, width: 10, height: (16 / 13) * 7, fill: '#3c3b6e' });
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
          const offset = row % 2 ? 1 : 0;
          if (offset && col === 4) continue;
          add('path', {
            d: starPath(1.1 + col * 1.95 + offset * 0.97, 1.15 + row * 2.05, 0.75),
            fill: '#ffffff',
          });
        }
      }
    }
    add('rect', { x: 0.25, y: 0.25, width: 23.5, height: 15.5, rx: 2, fill: 'none', stroke: 'rgba(0,0,0,.22)', 'stroke-width': 0.5 });
    return svg;
  }

  /* ── Palette ────────────────────────────────────────────────────────────── */

  const SERIES = {
    light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
    dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  };
  const theme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  const slotColor = (slot) => SERIES[theme()][(slot - 1) % 8];
  const restColor = () => (theme() === 'light' ? '#d9d8d0' : '#33332f');

  /* ── Asset marks ────────────────────────────────────────────────────────── */

  const MARKS = window.MARKS || {};
  const CLASS_MARKS = window.CLASS_MARKS || {};
  const LOGO_FILES = window.LOGO_FILES || {};

  function markFor(ticker) {
    if (!ticker) return null;
    if (MARKS[ticker]) return MARKS[ticker];
    const asset = window.assetByTicker(ticker);
    return (asset && MARKS[CLASS_MARKS[asset.cls]]) || null;
  }

  function brandOf(ticker) {
    const asset = ticker ? window.assetByTicker(ticker) : null;
    if (asset && asset.color) return asset.color;
    const mark = markFor(ticker);
    return (mark && mark.hex) || '#8b8981';
  }

  function paintMark(target, mark, color) {
    for (const part of mark.poly || []) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', part.d);
      path.setAttribute('fill', color || part.fill);
      target.appendChild(path);
    }
    for (const d of mark.d || []) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', color);
      if (mark.rule) path.setAttribute('fill-rule', mark.rule);
      target.appendChild(path);
    }
    for (const d of mark.sd || []) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      target.appendChild(path);
    }
  }

  const assetOf = (p) => (p && p.ticker ? window.assetByTicker(p.ticker) : null);

  function logoFileFor(ticker) {
    if (!ticker) return null;
    return LOGO_FILES[ticker] || null;
  }

  function paintLogoImage(target, src) {
    const image = document.createElementNS(SVG_NS, 'image');
    image.setAttribute('href', src);
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    image.setAttribute('width', '24');
    image.setAttribute('height', '24');
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    image.setAttribute('class', 'slice__brand-image');
    target.appendChild(image);
    return image;
  }

  function tileEl(ticker, label, size) {
    const tile = document.createElement('span');
    tile.className = 'tile tile--' + (size || 'md');

    const logoSrc = LOGO_FILES[ticker];
    const mark = markFor(ticker);
    tile.style.setProperty('--brand', brandOf(ticker));

    if (logoSrc) {
      const img = document.createElement('img');
      img.src = logoSrc;
      img.alt = '';
      img.className = 'tile__logo';
      tile.appendChild(img);
    } else if (mark) {
      const svg = document.createElementNS(SVG_NS, 'svg');
      const vb = mark.vb || 24;
      svg.setAttribute('viewBox', `0 0 ${vb} ${vb}`);
      svg.setAttribute('aria-hidden', 'true');
      paintMark(svg, mark, mark.poly ? null : 'currentColor');
      tile.appendChild(svg);
    } else {
      const mono = document.createElement('span');
      mono.className = 'tile__mono';
      mono.textContent = String(label || ticker || '?')
        .replace(/[^A-Za-z0-9]/g, '')
        .slice(0, 2)
        .toUpperCase() || '?';
      tile.appendChild(mono);
    }

    return tile;
  }

  /* ── State ──────────────────────────────────────────────────────────────── */

  const uid = () => 'p' + Math.random().toString(36).slice(2, 8);

  const defaults = () => ({
    currency: 'IDR',
    total: 0,
    theme: 'dark',
    lang: i18n.detect(),
    parts: [
      { id: uid(), ticker: 'BBCA', name: 'BBCA', pct: 40, slot: 1 },
      { id: uid(), ticker: 'BTC', name: 'BTC', pct: 25, slot: 2 },
      { id: uid(), ticker: 'GOLD', name: 'GOLD', pct: 20, slot: 3 },
      { id: uid(), ticker: 'CASH', name: 'CASH', pct: 15, slot: 4 },
    ],
  });

  let state = (function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.parts)) return defaults();
      return Object.assign(defaults(), parsed);
    } catch {
      return defaults();
    }
  })();

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* storage full or blocked */ }
    }, 150);
  }

  const cur = () => CURRENCIES[state.currency] || CURRENCIES.IDR;

  /* ── Numbers ────────────────────────────────────────────────────────────── */

  function money(v) {
    const c = cur();
    return c.symbol + ' ' + new Intl.NumberFormat(c.locale, {
      minimumFractionDigits: c.decimals,
      maximumFractionDigits: c.decimals,
    }).format(v || 0);
  }

  function moneyShort(v) {
    const c = cur();
    const n = Math.abs(v || 0);
    const fmt = (x, digits) => new Intl.NumberFormat(c.locale, { maximumFractionDigits: digits }).format(x);
    const unit = c.code === 'IDR' && i18n.lang === 'id'
      ? [[1e12, ' T'], [1e9, ' M'], [1e6, ' jt'], [1e3, ' rb']]
      : [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
    for (const [size, suffix] of unit) {
      if (n >= size) return c.symbol + ' ' + fmt(n / size, 1) + suffix;
    }
    return money(v);
  }

  const pctText = (v) =>
    new Intl.NumberFormat(cur().locale, { maximumFractionDigits: 1 }).format(v || 0) + '%';

  /**
   * Which characters this locale uses to group thousands and to mark the
   * decimal — asked of Intl rather than hardcoded, because de-CH groups with
   * an apostrophe and ja-JP with a comma.
   */
  const sepCache = new Map();
  function separators(locale) {
    if (!sepCache.has(locale)) {
      let group = ',', decimal = '.';
      for (const part of new Intl.NumberFormat(locale).formatToParts(12345.6)) {
        if (part.type === 'group') group = part.value;
        if (part.type === 'decimal') decimal = part.value;
      }
      sepCache.set(locale, { group, decimal });
    }
    return sepCache.get(locale);
  }

  const escapeClass = (c) => c.replace(/[\\\]^-]/g, '\\$&');

  /**
   * Read a number the way the active locale writes one: id-ID groups with a
   * dot and decimalises with a comma, en-US is the other way round. Anything
   * that still fails to parse falls back to "just the digits", so a figure
   * typed in another locale's punctuation is not silently read as zero.
   */
  function parseNum(raw) {
    const { group, decimal } = separators(cur().locale);
    const text = String(raw == null ? '' : raw);
    const keep = new RegExp(`[^0-9${escapeClass(group)}${escapeClass(decimal)}]`, 'g');
    let s = text.replace(keep, '');
    if (!s) return 0;
    s = s.split(group).join('').split(decimal).join('.');
    let n = Number(s);
    if (!Number.isFinite(n)) n = Number(text.replace(/\D/g, ''));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  const totalPct = () => state.parts.reduce((s, p) => s + (Number(p.pct) || 0), 0);
  const amountOf = (p) => (state.total * (Number(p.pct) || 0)) / 100;

  function nextSlot() {
    const used = new Set(state.parts.map((p) => p.slot));
    for (let s = 1; s <= 8; s++) if (!used.has(s)) return s;
    return (state.parts.length % 8) + 1;
  }

  const round1 = (v) => Math.round(v * 10) / 10;

  /** Biggest share first. Stable, so equal shares keep the order they arrived in. */
  const byShare = (a, b) => (Number(b.pct) || 0) - (Number(a.pct) || 0);

  /**
   * Put the stored list in display order. The screen does not depend on this —
   * rows are ranked live with CSS `order` — but it keeps what we save, what we
   * export and what we draw telling the same story.
   */
  function sortParts() {
    state.parts.sort(byShare);
  }

  /* ── Pie ────────────────────────────────────────────────────────────────── */

  const R = 104, CX = 120, CY = 120, TAU = Math.PI * 2;

  function arc(a0, a1, lift) {
    const cx = CX + Math.cos((a0 + a1) / 2) * lift;
    const cy = CY + Math.sin((a0 + a1) / 2) * lift;
    const pt = (a) => [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    if (a1 - a0 >= TAU - 1e-6) {
      const [x0, y0] = pt(a0), [x1, y1] = pt(a0 + Math.PI);
      return `M${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}A${R} ${R} 0 0 1 ${x0} ${y0}Z`;
    }
    const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${cx} ${cy}L${x0} ${y0}A${R} ${R} 0 ${large} 1 ${x1} ${y1}Z`;
  }

  let tip = null;
  function showTip(x, y, title, value, sub) {
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'tip';
      tip.setAttribute('role', 'status');
      document.body.appendChild(tip);
    }
    tip.textContent = '';
    const t = document.createElement('span');
    t.className = 'tip__title';
    t.textContent = title;
    const v = document.createElement('strong');
    v.textContent = value;
    const s = document.createElement('span');
    s.className = 'tip__sub';
    s.textContent = sub;
    tip.append(t, v, s);
    tip.classList.add('on');
    const box = tip.getBoundingClientRect();
    const left = Math.min(Math.max(8, x + 16), window.innerWidth - box.width - 8);
    const top = y - box.height - 14 < 8 ? y + 18 : y - box.height - 14;
    tip.style.transform = `translate(${left}px, ${top}px)`;
  }
  const hideTip = () => tip && tip.classList.remove('on');

  function slices() {
    const assigned = Math.min(totalPct(), 100);
    const out = state.parts
      .filter((p) => (Number(p.pct) || 0) > 0)
      .slice()
      .sort(byShare)
      .map((p) => ({
        key: p.id,
        ticker: p.ticker || null,
        label: p.ticker || p.name || t('pie.unnamed'),
        pct: Number(p.pct) || 0,
        color: slotColor(p.slot),
      }));
    if (assigned < 99.95) {
      out.push({ key: '__rest', label: t('pie.rest'), pct: 100 - assigned, color: restColor(), rest: true });
    }
    return out;
  }

  function renderPie() {
    const host = $('#pie');
    const data = slices();
    const sum = data.reduce((s, d) => s + d.pct, 0);

    let svg = host.querySelector('svg');
    if (!svg) {
      svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('viewBox', '0 0 240 240');
      svg.setAttribute('class', 'pie');
      svg.setAttribute('role', 'img');
      host.appendChild(svg);
      host._paths = new Map();
      host._prev = new Map();
    }
    svg.setAttribute('aria-label',
      data.map((d) => `${d.label} ${pctText(d.pct)}`).join(', ') || t('pie.none'));

    if (!data.length || sum <= 0) {
      svg.textContent = '';
      host._paths.clear();
      host._prev.clear();
      const ring = document.createElementNS(SVG_NS, 'circle');
      ring.setAttribute('cx', CX);
      ring.setAttribute('cy', CY);
      ring.setAttribute('r', R);
      ring.setAttribute('fill', restColor());
      svg.appendChild(ring);
      writeCaption(host);
      return;
    }

    for (const [key, node] of host._paths) {
      if (!data.some((d) => d.key === key)) {
        node.group.remove();
        host._paths.delete(key);
        host._prev.delete(key);
      }
    }

    const from = new Map(host._prev);
    for (const d of data) {
      let entry = host._paths.get(d.key);
      if (!entry) {
        const group = document.createElementNS(SVG_NS, 'g');
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('class', 'slice');
        path.setAttribute('tabindex', '0');
        const icon = document.createElementNS(SVG_NS, 'g');
        icon.setAttribute('class', 'slice__icon');
        const label = document.createElementNS(SVG_NS, 'text');
        label.setAttribute('class', 'slice__label');
        label.setAttribute('text-anchor', 'middle');
        group.append(path, icon, label);
        svg.appendChild(group);
        entry = { group, path, icon, label, markKey: undefined };
        host._paths.set(d.key, entry);
        bindSlice(entry, d.key);
      }

      entry.data = d;
      const logoSrc = d.rest ? null : logoFileFor(d.ticker);
      const markKey = `${d.ticker || ''}|${logoSrc || ''}|${d.color}`;

      if (entry.markKey !== markKey) {
        entry.markKey = markKey;
        entry.icon.textContent = '';
        entry.logoSrc = logoSrc;
        entry.mark = d.rest || logoSrc ? null : markFor(d.ticker);
        entry.hasIcon = !!(entry.logoSrc || entry.mark);

        if (entry.logoSrc) {
          paintLogoImage(entry.icon, entry.logoSrc);
          entry.iconScale = 20 / 24;
        } else if (entry.mark) {
          paintMark(entry.icon, entry.mark, readable(d.color));
          entry.iconScale = 20 / (entry.mark.vb || 24);
        } else {
          entry.iconScale = 1;
        }
      }

      entry.path.setAttribute('fill', d.color);
      entry.path.setAttribute('aria-label', `${d.label}: ${pctText(d.pct)}`);
      entry.path.classList.toggle('is-rest', !!d.rest);
    }

    const gap = 2 / R;
    animate(host, 480, (t) => {
      let a = -Math.PI / 2;
      for (const d of data) {
        const prev = from.has(d.key) ? from.get(d.key) : 0;
        const value = prev + (d.pct - prev) * t;
        const sweep = (value / Math.max(sum, 1e-9)) * TAU * (from.size ? 1 : t);
        const inset = sweep > gap * 2 ? gap / 2 : 0;
        const entry = host._paths.get(d.key);
        const a0 = a + inset, a1 = a + sweep - inset;
        entry.path.setAttribute('d', arc(a0, a1, entry.lift || 0));
        entry.a0 = a0;
        entry.a1 = a1;

        const share = (value / Math.max(sum, 1e-9)) * 100;
        const mid = (a0 + a1) / 2;
        const withIcon = share >= 13 && !!entry.hasIcon;
        const reach = withIcon ? 0.55 : 0.62;
        const px = CX + Math.cos(mid) * R * reach;
        const py = CY + Math.sin(mid) * R * reach;

        if (withIcon) {
          entry.icon.setAttribute(
            'transform',
            `translate(${px - 10} ${py - 18}) scale(${entry.iconScale})`
          );
          entry.icon.style.opacity = '1';
        } else {
          entry.icon.style.opacity = '0';
        }

        if (share >= 9 && !d.rest) {
          entry.label.textContent = pctText(share);
          entry.label.setAttribute('x', px);
          entry.label.setAttribute('y', withIcon ? py + 16 : py + 5);
          entry.label.setAttribute('fill', readable(d.color));
          entry.label.style.opacity = '1';
        } else {
          entry.label.textContent = '';
          entry.label.style.opacity = '0';
        }
        a += sweep;
      }
      if (t === 1) for (const d of data) host._prev.set(d.key, d.pct);
    });

    writeCaption(host);
  }

  function readable(hex) {
    const h = hex.replace('#', '');
    const int = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const [r, g, b] = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.179 ? '#14140f' : '#ffffff';
  }

  function bindSlice(entry, key) {
    const move = (ev) => {
      const d = entry.data;
      if (!d) return;
      const box = entry.path.getBoundingClientRect();
      showTip(
        ev && ev.clientX != null ? ev.clientX : box.left + box.width / 2,
        ev && ev.clientY != null ? ev.clientY : box.top + box.height / 2,
        d.label, money((state.total * d.pct) / 100), pctText(d.pct)
      );
      lift(entry, 7);
      const row = $(`.part[data-id="${key}"]`);
      if (row) row.classList.add('is-hot');
    };
    const out = () => {
      hideTip();
      lift(entry, 0);
      const row = $(`.part[data-id="${key}"]`);
      if (row) row.classList.remove('is-hot');
    };
    entry.path.addEventListener('pointerenter', move);
    entry.path.addEventListener('pointermove', move);
    entry.path.addEventListener('pointerleave', out);
    entry.path.addEventListener('focus', move);
    entry.path.addEventListener('blur', out);
  }

  function lift(entry, px) {
    entry.lift = px;
    entry.path.setAttribute('d', arc(entry.a0 || 0, entry.a1 || 0, px));
  }

  function writeCaption(host) {
    let box = host.querySelector('.pie__caption');
    if (!box) {
      box = document.createElement('p');
      box.className = 'pie__caption';
      host.appendChild(box);
    }
    const count = state.parts.filter((p) => (Number(p.pct) || 0) > 0).length;
    const left = 100 - totalPct();
    box.textContent = !count
      ? t('pie.none')
      : t('pie.count', { n: count }) + (left > 0.05 ? t('pie.left', { p: pctText(left) }) : '');
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animate(node, duration, step) {
    if (node._raf) cancelAnimationFrame(node._raf);
    if (reduced()) return step(1);
    const t0 = performance.now();
    const frame = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      step(easeOut(p));
      node._raf = p < 1 ? requestAnimationFrame(frame) : null;
    };
    node._raf = requestAnimationFrame(frame);
  }

  /* ── Parts list ─────────────────────────────────────────────────────────── */

  let signature = '';

  function renderParts() {
    const host = $('#parts');
    /* Where every row sits right now — including any slide still in flight.
       `rankParts` measures again afterwards and animates the difference. */
    const before = new Map();
    for (const row of $$('.part', host)) {
      before.set(row.dataset.id, row.getBoundingClientRect().top);
    }

    /* Which rows exist and what asset each points at. Order is deliberately
       left out: ranking is a CSS concern now, so a reshuffle never costs the
       list its DOM — and never costs a field its caret. */
    const sig = state.parts.map((p) => p.id + ':' + (p.ticker || '')).sort().join('|');
    /* Only a field being typed in blocks a rebuild — a focused button (say the
       delete X) must not, or the row it just removed would stay on screen. */
    const active = document.activeElement;
    const typing = !!(active && active.dataset && active.dataset.field && host.contains(active));

    if (sig !== signature && !typing) {
      host.textContent = '';
      state.parts.forEach((p, i) => host.appendChild(partRow(p, i)));
      signature = sig;
    }

    for (const p of state.parts) {
      const row = host.querySelector(`.part[data-id="${p.id}"]`);
      if (!row) continue;
      row.querySelector('.part__logo').style.setProperty('--slice', slotColor(p.slot));
      row.querySelector('.part__amount').textContent = money(amountOf(p));
      /* Buttons like "Bagi rata" rewrite the shares without rebuilding rows, so
         the field has to be told. Never the one under the cursor, though. */
      const field = row.querySelector('[data-field="pct"]');
      if (field && field !== document.activeElement) {
        const shown = p.pct ? String(p.pct).replace('.', separators(cur().locale).decimal) : '';
        if (field.value !== shown) field.value = shown;
      }
    }

    if (!state.parts.length) {
      const empty = document.createElement('p');
      empty.className = 'parts__empty';
      empty.textContent = t('parts.empty');
      host.appendChild(empty);
    }
    rankParts(before);
    renderBadge();
  }

  /**
   * Rank the rows biggest-share-first and slide them into place.
   *
   * The ordering is CSS `order`, not DOM order, so the row you are typing in
   * keeps its element, its focus and its caret while it climbs the list. The
   * movement itself is FLIP: measure where each row was, drop it into its new
   * slot, translate it back by the difference, then release the transform so
   * the stylesheet's transition carries it home.
   *
   * @param before  row id → viewport top, measured before the reshuffle.
   */
  function rankParts(before) {
    const rows = $$('.part', $('#parts'));
    if (!rows.length) return;

    const rank = new Map();
    state.parts.slice().sort(byShare).forEach((p, i) => rank.set(p.id, i));

    for (const row of rows) {
      const place = rank.has(row.dataset.id) ? rank.get(row.dataset.id) : rows.length;
      row.style.order = String(place);
      row.style.setProperty('--i', place);
      /* Clear any in-flight slide so the next measurement is of the real slot. */
      row.style.transition = 'none';
      row.style.transform = '';
    }

    if (reduced()) {
      rows.forEach((row) => { row.style.transition = ''; });
      return;
    }

    /* One read pass, then one write pass — measuring row by row while also
       writing would thrash layout. */
    const shift = rows.map((row) => (before.has(row.dataset.id)
      ? before.get(row.dataset.id) - row.getBoundingClientRect().top
      : 0));
    rows.forEach((row, i) => {
      if (Math.abs(shift[i]) > 0.5) row.style.transform = `translateY(${shift[i]}px)`;
    });
    requestAnimationFrame(() => {
      rows.forEach((row) => {
        row.style.transition = '';
        row.style.transform = '';
      });
    });
  }

  function partRow(p, index) {
    const row = document.createElement('div');
    row.className = 'part';
    row.dataset.id = p.id;
    row.style.setProperty('--i', index);

    const asset = assetOf(p);

    const logo = document.createElement('button');
    logo.type = 'button';
    logo.className = 'part__logo';
    logo.dataset.pick = p.id;
    logo.style.setProperty('--slice', slotColor(p.slot));
    logo.setAttribute('aria-label', t('parts.pickAria', { name: p.ticker || p.name || t('parts.thisOne') }));
    logo.appendChild(tileEl(p.ticker, p.name, 'md'));

    const ident = document.createElement('span');
    ident.className = 'part__ident';
    const name = document.createElement('input');
    name.className = 'part__name';
    name.type = 'text';
    name.value = p.ticker || p.name;
    name.placeholder = t('parts.namePh');
    name.maxLength = 28;
    name.dataset.field = 'name';
    name.setAttribute('aria-label', t('parts.nameAria'));
    const sub = document.createElement('small');
    sub.className = 'part__sub';
    sub.textContent = assetName(asset);
    ident.append(name, sub);

    const pctWrap = document.createElement('span');
    pctWrap.className = 'part__pct';
    const pct = document.createElement('input');
    pct.type = 'text';
    pct.inputMode = 'decimal';
    pct.value = p.pct ? String(p.pct).replace('.', separators(cur().locale).decimal) : '';
    pct.placeholder = '0';
    pct.dataset.field = 'pct';
    pct.setAttribute('aria-label', t('parts.pctAria', { name: p.name || t('parts.thisOne') }));
    const sign = document.createElement('span');
    sign.textContent = '%';
    pctWrap.append(pct, sign);

    const amount = document.createElement('span');
    amount.className = 'part__amount';
    amount.textContent = money(amountOf(p));

    const del = document.createElement('button');
    del.className = 'part__x';
    del.type = 'button';
    del.dataset.remove = p.id;
    del.setAttribute('aria-label', t('parts.removeAria', { name: p.name || t('parts.thisOne') }));
    del.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>';

    row.append(logo, ident, pctWrap, amount, del);
    return row;
  }

  function renderBadge() {
    const badge = $('#pct-badge');
    const sum = totalPct();
    badge.textContent = pctText(sum);
    badge.classList.toggle('is-ok', Math.abs(sum - 100) < 0.05);
    badge.classList.toggle('is-over', sum > 100.05);
    badge.title = Math.abs(sum - 100) < 0.05
      ? t('badge.exact')
      : sum > 100
        ? t('badge.over', { p: pctText(sum - 100) })
        : t('badge.under', { p: pctText(100 - sum) });
  }

  /* ── Actions ────────────────────────────────────────────────────────────── */

  function render() {
    $('#symbol').textContent = cur().symbol;
    $('#ccy-code').textContent = cur().code;
    const flagHost = $('#ccy-flag');
    flagHost.textContent = '';
    flagHost.appendChild(flagEl(cur().code));
    renderParts();
    renderPie();
    save();
  }

  function addPart() {
    const share = 100 / (state.parts.length + 1);
    const keep = 1 - share / 100;
    state.parts.forEach((p) => { p.pct = round1((Number(p.pct) || 0) * keep); });
    state.parts.push({ id: uid(), ticker: null, name: '', pct: round1(share), slot: nextSlot() });
    const added = state.parts[state.parts.length - 1];
    sortParts();
    render();
    openPicker(added.id);
  }

  function removePart(id) {
    if (!state.parts.some((p) => p.id === id)) return;
    if (document.activeElement) document.activeElement.blur();
    state.parts = state.parts.filter((p) => p.id !== id);
    signature = '';
    render();
  }

  function splitEvenly() {
    if (!state.parts.length) return;
    const each = round1(100 / state.parts.length);
    state.parts.forEach((p) => { p.pct = each; });
    fixRounding();
    sortParts();
    render();
  }

  function fitTo100() {
    const sum = totalPct();
    if (!state.parts.length || sum <= 0) return splitEvenly();
    state.parts.forEach((p) => { p.pct = round1(((Number(p.pct) || 0) / sum) * 100); });
    fixRounding();
    sortParts();
    render();
  }

  function fixRounding() {
    const sum = totalPct();
    const drift = round1(100 - sum);
    if (!drift || !state.parts.length) return;
    const biggest = state.parts.reduce((a, b) => ((a.pct || 0) >= (b.pct || 0) ? a : b));
    biggest.pct = Math.max(0, round1((biggest.pct || 0) + drift));
  }

  /* ── Asset picker ───────────────────────────────────────────────────────── */

  const pickUI = { partId: null, q: '', cls: 'all' };

  function openPicker(partId) {
    pickUI.partId = partId;
    pickUI.q = '';
    $('#pick-search').value = '';
    const sheet = $('#picker');
    sheet.hidden = false;
    document.body.classList.add('locked');
    requestAnimationFrame(() => sheet.classList.add('on'));
    renderPickChips();
    renderPickList();
    $('#pick-search').focus();
  }

  function closePicker() {
    const sheet = $('#picker');
    sheet.classList.remove('on');
    document.body.classList.remove('locked');
    setTimeout(() => { sheet.hidden = true; }, 200);
  }

  function renderPickChips() {
    const host = $('#pick-chips');
    host.textContent = '';
    const opts = [{ id: 'all', label: t('picker.all') }]
      .concat(window.ASSET_CLASSES.map((c) => ({ id: c.id, label: clsLabel(c.id) })));
    for (const o of opts) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pickchip' + (pickUI.cls === o.id ? ' is-on' : '');
      b.textContent = o.label;
      b.addEventListener('click', () => {
        pickUI.cls = o.id;
        $$('.pickchip', host).forEach((c) => c.classList.toggle('is-on', c === b));
        renderPickList();
      });
      host.appendChild(b);
    }
  }

  function renderPickList() {
    const host = $('#pick-list');
    host.textContent = '';
    const q = pickUI.q.trim().toLowerCase();
    const taken = new Set(state.parts
      .filter((p) => p.id !== pickUI.partId && p.ticker)
      .map((p) => p.ticker));

    const list = window.ASSETS.filter((a) =>
      (pickUI.cls === 'all' || a.cls === pickUI.cls) &&
      (!q || a.ticker.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) || assetName(a).toLowerCase().includes(q)));

    if (!list.length) {
      const empty = document.createElement('p');
      empty.className = 'parts__empty';
      empty.textContent = t('picker.none');
      host.appendChild(empty);
      return;
    }

    let currentClass = null;
    for (const a of list) {
      if (pickUI.cls === 'all' && a.cls !== currentClass) {
        currentClass = a.cls;
        const head = document.createElement('p');
        head.className = 'picklist__group';
        head.textContent = clsLabel(a.cls);
        host.appendChild(head);
      }
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'pickrow' + (taken.has(a.ticker) ? ' is-taken' : '');
      row.dataset.choose = a.ticker;
      row.appendChild(tileEl(a.ticker, a.ticker, 'md'));

      const text = document.createElement('span');
      text.className = 'pickrow__text';
      const tk = document.createElement('strong');
      tk.textContent = a.ticker;
      const nm = document.createElement('small');
      nm.textContent = assetName(a);
      text.append(tk, nm);

      const tag = document.createElement('span');
      tag.className = 'pickrow__tag';
      tag.textContent = taken.has(a.ticker) ? t('picker.taken') : clsShort(a.cls);

      row.append(text, tag);
      host.appendChild(row);
    }
  }

  function choosePart(ticker) {
    const p = state.parts.find((x) => x.id === pickUI.partId);
    if (!p) return closePicker();
    p.ticker = ticker;
    p.name = ticker;
    signature = '';
    render();
    closePicker();
  }

  function useCustomName() {
    const p = state.parts.find((x) => x.id === pickUI.partId);
    if (p) {
      p.ticker = null;
      signature = '';
      render();
    }
    closePicker();
    const row = p && $(`.part[data-id="${p.id}"]`);
    if (row) row.querySelector('.part__name').focus();
  }

  /* ── Export ─────────────────────────────────────────────────────────────── */

  function exportSlices() {
    const list = slices();
    const sum = list.reduce((s, d) => s + d.pct, 0) || 1;
    return list.map((d) => {
      const part = state.parts.find((p) => p.id === d.key);
      const asset = part ? assetOf(part) : null;
      return {
        label: d.label,
        sub: asset ? assetName(asset) : (d.rest ? t('pie.restSub') : ''),
        pct: d.pct,
        pctText: pctText(d.pct),
        pieText: pctText((d.pct / sum) * 100),
        amountText: money((state.total * d.pct) / 100),
        color: d.color,
        ink: readable(d.color),
        logoSrc: part ? logoFileFor(part.ticker) : null,
        mark: part ? markFor(part.ticker) : null,
        brand: part ? brandOf(part.ticker) : d.color,
        rest: !!d.rest,
      };
    });
  }

  async function saveAs(format, button) {
    const rows = exportSlices();
    if (!rows.length) return;
    const css = getComputedStyle(document.documentElement);
    const token = (name) => css.getPropertyValue(name).trim();

    const original = Array.from(button.childNodes);
    button.disabled = true;
    button.textContent = t('export.saving');
    try {
      await window.Exporter.save({
        title: t('app.title'),
        totalLabel: t('export.cardTotal'),
        totalText: money(state.total),
        generatedAt: new Date().toLocaleDateString(cur().locale, { day: 'numeric', month: 'long', year: 'numeric' }),
        footer: t('export.footer'),
        theme: {
          surface: token('--surface') || '#1a1a19',
          ink: token('--ink') || '#ffffff',
          muted: token('--muted') || '#8b8981',
          line: token('--line') || 'rgba(255,255,255,.1)',
        },
        slices: rows,
      }, format);
    } catch (err) {
      console.error(err);
      alert(t('export.failed', { err: (err && err.message) || '' }));
    } finally {
      button.disabled = false;
      button.textContent = '';
      original.forEach((node) => button.appendChild(node));
    }
  }

  /* ── Settings ───────────────────────────────────────────────────────────── */

  function renderCurrencyOptions() {
    const host = $('#ccy-options');
    host.textContent = '';
    for (const code of Object.keys(CURRENCIES)) {
      const c = CURRENCIES[code];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ccyopt' + (state.currency === code ? ' is-on' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(state.currency === code));
      btn.dataset.currency = code;

      const flag = document.createElement('span');
      flag.className = 'ccyopt__flag';
      flag.appendChild(flagEl(code));

      const text = document.createElement('span');
      text.className = 'ccyopt__text';
      const strong = document.createElement('strong');
      /* CHF is its own symbol; "CHF CHF" would just read as a stutter. */
      strong.textContent = c.symbol === c.code ? c.code : `${c.symbol} ${c.code}`;
      const small = document.createElement('small');
      small.textContent = `${t('ccy.' + c.code + '.name')} · ${t('ccy.' + c.code + '.country')}`;
      text.append(strong, small);

      const check = document.createElement('span');
      check.className = 'ccyopt__check';
      check.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

      btn.append(flag, text, check);
      host.appendChild(btn);
    }
  }

  function renderLanguageOptions() {
    const host = $('#lang-options');
    host.textContent = '';
    for (const l of i18n.LANGUAGES) {
      const on = state.lang === l.code;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'langopt' + (on ? ' is-on' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(on));
      btn.dataset.lang = l.code;

      const code = document.createElement('span');
      code.className = 'langopt__code';
      code.textContent = l.code.toUpperCase();

      const text = document.createElement('span');
      text.className = 'langopt__text';
      text.textContent = l.label;

      btn.append(code, text);
      host.appendChild(btn);
    }
  }

  /** Swap the interface language and repaint everything that carries words. */
  function setLanguage(code) {
    if (code === state.lang) return;
    state.lang = i18n.setLang(code);
    applyLang();
    /* Every row's placeholder and accessible name is now stale. */
    signature = '';
    renderLanguageOptions();
    renderCurrencyOptions();
    applyTheme(state.theme === 'light' ? 'light' : 'dark');
    render();
  }

  /** Push the active language through the markup and the page's own metadata. */
  function applyLang() {
    i18n.applyLang(document);
    document.title = `${t('app.title')} — ${t('app.tagline')}`;
  }

  function setCurrency(code) {
    if (!CURRENCIES[code] || code === state.currency) return;
    state.currency = code;
    $('#total').value = state.total ? formatInput(state.total) : '';
    signature = '';
    renderCurrencyOptions();
    render();
  }

  function formatInput(v) {
    const c = cur();
    return new Intl.NumberFormat(c.locale, { maximumFractionDigits: c.decimals }).format(v);
  }

  function openSheet() {
    const sheet = $('#settings');
    sheet.hidden = false;
    document.body.classList.add('locked');
    requestAnimationFrame(() => sheet.classList.add('on'));
  }

  function closeSheet() {
    const sheet = $('#settings');
    sheet.classList.remove('on');
    document.body.classList.remove('locked');
    setTimeout(() => { sheet.hidden = true; }, 200);
  }

  function applyTheme(next) {
    state.theme = next;
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    $('#theme-label').textContent = t(next === 'dark' ? 'settings.themeDark' : 'settings.themeLight');
    save();
  }

  /* ── Wiring ─────────────────────────────────────────────────────────────── */

  function boot() {
    i18n.setLang(state.lang);
    applyLang();
    applyTheme(state.theme === 'light' ? 'light' : 'dark');
    $('#total').value = state.total ? formatInput(state.total) : '';
    renderLanguageOptions();
    renderCurrencyOptions();
    render();

    $('#total').addEventListener('input', (e) => {
      state.total = parseNum(e.target.value);
      renderParts();
      save();
    });
    $('#total').addEventListener('blur', () => {
      $('#total').value = state.total ? formatInput(state.total) : '';
    });

    const parts = $('#parts');
    parts.addEventListener('input', (e) => {
      const field = e.target.dataset.field;
      if (!field) return;
      const row = e.target.closest('.part');
      const p = state.parts.find((x) => x.id === row.dataset.id);
      if (!p) return;
      if (field === 'name') {
        p.name = e.target.value;
        if (p.ticker && e.target.value !== p.ticker) {
          p.ticker = null;
          const sub = e.target.closest('.part').querySelector('.part__sub');
          if (sub) sub.textContent = '';
        }
      } else {
        p.pct = Math.min(1000, parseNum(e.target.value));
        /* Rank as you type: the list, the pie and the saved order all follow
           the new share straight away, and `rankParts` slides the rows. */
        sortParts();
      }
      render();
    });
    parts.addEventListener('click', (e) => {
      const remove = e.target.closest('[data-remove]');
      if (remove) return removePart(remove.dataset.remove);
      const pick = e.target.closest('[data-pick]');
      if (pick) openPicker(pick.dataset.pick);
    });
    parts.addEventListener('blur', (e) => {
      const field = e.target.dataset && e.target.dataset.field;
      if (!field) return;
      /* Ranking already happened live, on every keystroke. What was deferred
         while the field held focus is the rebuild — anything that changes a
         row's contents rather than its place — so run it now. */
      setTimeout(render, 0);
    }, true);

    $('#add').addEventListener('click', addPart);
    $('#even').addEventListener('click', splitEvenly);
    $('#fit').addEventListener('click', fitTo100);

    $('#open-settings').addEventListener('click', openSheet);
    $('#ccy-chip').addEventListener('click', openSheet);
    $$('#settings [data-close]').forEach((b) => b.addEventListener('click', closeSheet));
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!$('#picker').hidden) closePicker();
      else if (!$('#settings').hidden) closeSheet();
    });

    $$('#picker [data-close]').forEach((b) => b.addEventListener('click', closePicker));
    $('#pick-search').addEventListener('input', (e) => {
      pickUI.q = e.target.value;
      renderPickList();
    });
    $('#pick-list').addEventListener('click', (e) => {
      const row = e.target.closest('[data-choose]');
      if (row) choosePart(row.dataset.choose);
    });
    $('#pick-custom').addEventListener('click', useCustomName);

    $('#dl-jpg').addEventListener('click', (e) => saveAs('jpg', e.currentTarget));
    $('#dl-pdf').addEventListener('click', (e) => saveAs('pdf', e.currentTarget));
    $('#ccy-options').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-currency]');
      if (btn) setCurrency(btn.dataset.currency);
    });
    $('#lang-options').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lang]');
      if (btn) setLanguage(btn.dataset.lang);
    });
    $('#theme-toggle').addEventListener('click', () => {
      applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
      render();
    });
    $('#reset').addEventListener('click', () => {
      if (!confirm(t('settings.resetConfirm'))) return;
      const keepLang = state.lang;
      state = defaults();
      state.lang = keepLang;
      applyTheme('dark');
      $('#total').value = '';
      signature = '';
      renderLanguageOptions();
      renderCurrencyOptions();
      render();
      closeSheet();
    });

    window.addEventListener('resize', hideTip);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();