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

  /* ── Currencies ─────────────────────────────────────────────────────────── */

  const CURRENCIES = {
    IDR: { code: 'IDR', symbol: 'Rp', locale: 'id-ID', decimals: 0, name: 'Rupiah', country: 'Indonesia' },
    USD: { code: 'USD', symbol: '$', locale: 'en-US', decimals: 2, name: 'Dolar Amerika', country: 'Amerika Serikat' },
  };

  /** Five-point star, used for the stars on the US flag. */
  function starPath(cx, cy, r) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r * 0.42 : r;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      d += `${i ? 'L' : 'M'}${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
    }
    return d + 'Z';
  }

  /** Flag icons, drawn rather than fetched. Simplified but recognisable at 20px. */
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

    if (code === 'IDR') {
      add('rect', { x: 0, y: 0, width: 24, height: 8, fill: '#ce1126' });
      add('rect', { x: 0, y: 8, width: 24, height: 8, fill: '#ffffff' });
    } else {
      /* 13 stripes, then the canton. */
      for (let i = 0; i < 13; i++) {
        add('rect', { x: 0, y: (16 / 13) * i, width: 24, height: 16 / 13, fill: i % 2 ? '#ffffff' : '#b22234' });
      }
      add('rect', { x: 0, y: 0, width: 10, height: (16 / 13) * 7, fill: '#3c3b6e' });
      /* A 5×4 lattice of stars stands in for the full 50. */
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

  /* Validated categorical steps: assigned in fixed slot order (never cycled by
     rank), so a slice keeps its colour when others are added or removed. */
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

  /** The logo for a ticker: its own brand mark, else its class glyph. */
  function markFor(ticker) {
    if (!ticker) return null;
    if (MARKS[ticker]) return MARKS[ticker];
    const asset = window.assetByTicker(ticker);
    return (asset && MARKS[CLASS_MARKS[asset.cls]]) || null;
  }

  /** Colour to paint a mark in: the asset's own brand beats a generic glyph. */
  function brandOf(ticker) {
    const asset = ticker ? window.assetByTicker(ticker) : null;
    if (asset && asset.color) return asset.color;
    const mark = markFor(ticker);
    return (mark && mark.hex) || '#8b8981';
  }

  /**
   * Append a mark's paths to an SVG node.
   * @param color  a single ink, or null to let a polychrome mark keep its own.
   */
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
  const image =
    document.createElementNS(
      SVG_NS,
      'image'
    );

  image.setAttribute('href', src);
  image.setAttribute('x', '0');
  image.setAttribute('y', '0');
  image.setAttribute('width', '24');
  image.setAttribute('height', '24');

  image.setAttribute(
    'preserveAspectRatio',
    'xMidYMid meet'
  );

  image.setAttribute(
    'class',
    'slice__brand-image'
  );

  target.appendChild(image);

  return image;
}

  /** Rounded tile holding a brand mark, a drawn glyph, or a two-letter monogram. */
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

    paintMark(
      svg,
      mark,
      mark.poly ? null : 'currentColor'
    );

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

  /** Short form for the middle of the pie: 12,4 jt / $12.4M. */
  function moneyShort(v) {
    const c = cur();
    const n = Math.abs(v || 0);
    const fmt = (x, digits) => new Intl.NumberFormat(c.locale, { maximumFractionDigits: digits }).format(x);
    const unit = c.code === 'IDR'
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
   * Read a number the way the active locale writes one: in id-ID a dot groups
   * thousands and a comma is the decimal point; en-US is the other way round.
   */
  function parseNum(raw) {
    let s = String(raw == null ? '' : raw).replace(/[^\d.,]/g, '');
    if (!s) return 0;
    const group = cur().code === 'IDR' ? '.' : ',';
    const decimal = group === '.' ? ',' : '.';
    s = s.split(group).join('').replace(decimal, '.');
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  const totalPct = () => state.parts.reduce((s, p) => s + (Number(p.pct) || 0), 0);
  const amountOf = (p) => (state.total * (Number(p.pct) || 0)) / 100;

  /** Lowest palette slot not already taken, so colours stay stable and distinct. */
  function nextSlot() {
    const used = new Set(state.parts.map((p) => p.slot));
    for (let s = 1; s <= 8; s++) if (!used.has(s)) return s;
    return (state.parts.length % 8) + 1;
  }

  const round1 = (v) => Math.round(v * 10) / 10;

  /**
   * Biggest slice first. Called at the moments a share settles — never while a
   * field is being typed in, or rows would jump under the cursor mid-keystroke.
   * Sort is stable, so equal shares keep the order they were added in.
   */
  function sortParts() {
    state.parts.sort((a, b) => (Number(b.pct) || 0) - (Number(a.pct) || 0));
    signature = '';
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

  /** Slices in fixed slot order, plus whatever share is still unassigned. */
  function slices() {
    const assigned = Math.min(totalPct(), 100);
    const out = state.parts
      .filter((p) => (Number(p.pct) || 0) > 0)
      .slice()
      .sort((a, b) => (Number(b.pct) || 0) - (Number(a.pct) || 0))
      .map((p) => ({
        key: p.id,
        ticker: p.ticker || null,
        label: p.ticker || p.name || 'Tanpa nama',
        pct: Number(p.pct) || 0,
        color: slotColor(p.slot),
      }));
    if (assigned < 99.95) {
      out.push({ key: '__rest', label: 'Belum dibagi', pct: 100 - assigned, color: restColor(), rest: true });
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
      data.map((d) => `${d.label} ${pctText(d.pct)}`).join(', ') || 'Belum ada porsi');

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
     /* Prefer official local logo; use marks.js only as fallback. */
const logoSrc =
  d.rest
    ? null
    : logoFileFor(d.ticker);

const markKey =
  (d.ticker || '') +
  '|' +
  (logoSrc || '') +
  '|' +
  d.color;

if (entry.markKey !== markKey) {
  entry.markKey = markKey;

  entry.icon.textContent = '';

  entry.logoSrc = logoSrc;

  entry.mark =
    d.rest || logoSrc
      ? null
      : markFor(d.ticker);

  entry.hasIcon =
    !!(entry.logoSrc || entry.mark);

  if (entry.logoSrc) {
    paintLogoImage(
      entry.icon,
      entry.logoSrc
    );

    entry.iconScale = 20 / 24;

  } else if (entry.mark) {
    paintMark(
      entry.icon,
      entry.mark,
      readable(d.color)
    );

    entry.iconScale =
      20 / (entry.mark.vb || 24);

  } else {
    entry.iconScale = 1;
  }
}

      entry.path.setAttribute('fill', d.color);

entry.path.setAttribute(
  'aria-label',
  `${d.label}: ${pctText(d.pct)}`
);

entry.path.classList.toggle(
  'is-rest',
  !!d.rest
);

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

        /* A wedge only carries a mark and a number when it has room for them:
           the logo needs more width than the text, so it has a higher bar. */
        const share = (value / Math.max(sum, 1e-9)) * 100;
        const mid = (a0 + a1) / 2;
        const withIcon = share >= 13 &&!!entry.hasIcon;
        const reach = withIcon ? 0.55 : 0.62;
        const px = CX + Math.cos(mid) * R * reach;
        const py = CY + Math.sin(mid) * R * reach;

        if (withIcon) {
          entry.icon.setAttribute('transform',`translate(${px - 10} ${py - 18}) scale(${entry.iconScale})`);
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

  /** White or ink, whichever survives on the fill behind it. */
  function readable(hex) {
    const h = hex.replace('#', '');
    const int = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const [r, g, b] = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    /* 0.179 is where white and black land on equal WCAG contrast against a
       fill; above it black wins, below it white does. */
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

  /* The total already sits huge at the top of the page, so the pie stays a
     pie — no disc over the middle — and just gets a line of context below. */
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
      ? 'Belum ada porsi'
      : `${count} porsi` + (left > 0.05 ? ` · ${pctText(left)} belum dibagi` : '');
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
    const sig = state.parts.map((p) => p.id + ':' + (p.ticker || '')).join('|');
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
    }

    if (!state.parts.length) {
      const empty = document.createElement('p');
      empty.className = 'parts__empty';
      empty.textContent = 'Belum ada porsi. Tambahkan satu untuk mulai membagi.';
      host.appendChild(empty);
    }
    renderBadge();
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
    logo.setAttribute('aria-label', `Pilih aset untuk ${p.ticker || p.name || 'porsi ini'}`);
    logo.appendChild(tileEl(p.ticker, p.name, 'md'));

    const ident = document.createElement('span');
    ident.className = 'part__ident';
    const name = document.createElement('input');
    name.className = 'part__name';
    name.type = 'text';
    name.value = p.ticker || p.name;
    name.placeholder = 'Nama porsi';
    name.maxLength = 28;
    name.dataset.field = 'name';
    name.setAttribute('aria-label', 'Nama atau ticker porsi');
    const sub = document.createElement('small');
    sub.className = 'part__sub';
    sub.textContent = asset ? asset.name : '';
    ident.append(name, sub);

    const pctWrap = document.createElement('span');
    pctWrap.className = 'part__pct';
    const pct = document.createElement('input');
    pct.type = 'text';
    pct.inputMode = 'decimal';
    pct.value = p.pct ? String(p.pct).replace('.', cur().code === 'IDR' ? ',' : '.') : '';
    pct.placeholder = '0';
    pct.dataset.field = 'pct';
    pct.setAttribute('aria-label', `Persen untuk ${p.name || 'porsi ini'}`);
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
    del.setAttribute('aria-label', `Hapus ${p.name || 'porsi'}`);
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
      ? 'Pas 100%.'
      : sum > 100
        ? `Kelebihan ${pctText(sum - 100)} dari 100%.`
        : `Masih ada ${pctText(100 - sum)} yang belum dibagi.`;
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

  /** Add a slice without wrecking the ratios already set: everyone shrinks. */
  function addPart() {
    const share = 100 / (state.parts.length + 1);
    const keep = 1 - share / 100;
    state.parts.forEach((p) => { p.pct = round1((Number(p.pct) || 0) * keep); });
    state.parts.push({ id: uid(), ticker: null, name: '', pct: round1(share), slot: nextSlot() });
    const added = state.parts[state.parts.length - 1];
    sortParts();
    render();
    /* Straight into the picker — choosing the asset is the point. */
    openPicker(added.id);
  }

  /**
   * Deleting takes the slice and its share with it. The freed percentage is
   * left unassigned — it shows up as "Belum dibagi" for you to place yourself,
   * rather than quietly inflating whatever happens to be left.
   */
  function removePart(id) {
    if (!state.parts.some((p) => p.id === id)) return;
    /* The button is about to be removed; don't leave focus stranded on it. */
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

  /** Push the rounding leftover onto the biggest slice so the total reads 100%. */
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
    if (host.dataset.built) return;
    host.dataset.built = '1';
    const opts = [{ id: 'all', label: 'Semua' }]
      .concat(window.ASSET_CLASSES.map((c) => ({ id: c.id, label: c.label })));
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
      (!q || a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)));

    if (!list.length) {
      const empty = document.createElement('p');
      empty.className = 'parts__empty';
      empty.textContent = 'Tidak ketemu. Coba kata kunci lain, atau pakai nama sendiri.';
      host.appendChild(empty);
      return;
    }

    let currentClass = null;
    for (const a of list) {
      if (pickUI.cls === 'all' && a.cls !== currentClass) {
        currentClass = a.cls;
        const head = document.createElement('p');
        head.className = 'picklist__group';
        head.textContent = window.classById(a.cls).label;
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
      nm.textContent = a.name;
      text.append(tk, nm);

      const tag = document.createElement('span');
      tag.className = 'pickrow__tag';
      tag.textContent = taken.has(a.ticker) ? 'sudah dipakai' : window.classById(a.cls).short;

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
    /* A wedge's width is its share of the circle, which only equals the typed
       percentage when the parts add up to 100. Label it with what it actually
       shows; the legend row keeps the number the user entered. */
    const sum = list.reduce((s, d) => s + d.pct, 0) || 1;
    return list.map((d) => {
      const part = state.parts.find((p) => p.id === d.key);
      const asset = part ? assetOf(part) : null;
      return {
        label: d.label,
        sub: asset ? asset.name : (d.rest ? 'sisa yang belum dibagi' : ''),
        pct: d.pct,
        pctText: pctText(d.pct),
        pieText: pctText((d.pct / sum) * 100),
        amountText: money((state.total * d.pct) / 100),
        color: d.color,
        ink: readable(d.color),
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

    /* Hold the original children so the icon survives the progress label. */
    const original = Array.from(button.childNodes);
    button.disabled = true;
    button.textContent = 'Menyimpan…';
    try {
      await window.Exporter.save({
        title: 'Porsi',
        totalLabel: 'Uang yang kamu punya',
        totalText: money(state.total),
        generatedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        footer: 'Dibuat dengan Porsi — kalkulator alokasi, bukan nasihat investasi.',
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
      alert('Gagal menyimpan: ' + (err && err.message));
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
      strong.textContent = `${c.symbol} ${c.code}`;
      const small = document.createElement('small');
      small.textContent = `${c.name} · ${c.country}`;
      text.append(strong, small);

      const check = document.createElement('span');
      check.className = 'ccyopt__check';
      check.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

      btn.append(flag, text, check);
      host.appendChild(btn);
    }
  }

  function setCurrency(code) {
    if (!CURRENCIES[code] || code === state.currency) return;
    state.currency = code;
    /* The amount is a plain number; only its formatting changes. */
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
    $('#theme-label').textContent = next === 'dark' ? 'Tema gelap' : 'Tema terang';
    save();
  }

  /* ── Wiring ─────────────────────────────────────────────────────────────── */

  function boot() {
    applyTheme(state.theme === 'light' ? 'light' : 'dark');
    $('#total').value = state.total ? formatInput(state.total) : '';
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
        /* Hand-typing an identity means this slice is no longer that asset. */
        p.name = e.target.value;
        if (p.ticker && e.target.value !== p.ticker) {
          p.ticker = null;
          const sub = e.target.closest('.part').querySelector('.part__sub');
          if (sub) sub.textContent = '';
        }
      } else p.pct = Math.min(1000, parseNum(e.target.value));
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
      /* Rebuilding is deferred while an input has focus; do it once it leaves —
         and that is also the moment a changed share may reorder the list. */
      if (field === 'pct') sortParts();
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

    /* Asset picker */
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

    /* Download */
    $('#dl-jpg').addEventListener('click', (e) => saveAs('jpg', e.currentTarget));
    $('#dl-pdf').addEventListener('click', (e) => saveAs('pdf', e.currentTarget));
    $('#ccy-options').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-currency]');
      if (btn) setCurrency(btn.dataset.currency);
    });
    $('#theme-toggle').addEventListener('click', () => {
      applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
      render();
    });
    $('#reset').addEventListener('click', () => {
      if (!confirm('Hapus semua isian dan mulai dari awal?')) return;
      state = defaults();
      applyTheme('dark');
      $('#total').value = '';
      signature = '';
      renderCurrencyOptions();
      render();
      closeSheet();
    });

    window.addEventListener('resize', hideTip);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
