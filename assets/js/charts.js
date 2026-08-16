/**
 * Charts — hand-rolled SVG, no dependencies.
 *
 * Palette, mark specs and interaction follow the project's dataviz rules:
 *   · categorical hues are assigned in fixed slot order and follow the entity,
 *     never its rank, so sorting or filtering never repaints a series
 *   · touching marks are separated by a 2px surface gap, never a stroke
 *   · lines are 2px, end markers ≥8px with a 2px surface ring
 *   · gridlines and axes are solid hairlines one step off the surface
 *   · every chart has a hover/focus tooltip, and every value it shows is also
 *     reachable from the table view beside the chart
 */
window.Charts = (function () {
  'use strict';

  /* Validated categorical palette, stepped per surface. Slot order is the
     colourblind-safety mechanism — do not reorder. */
  const SERIES = {
    light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
    dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  };
  /* Diverging arms for drift (under ↔ over) and the neutral midpoint. */
  const DIVERGING = {
    light: { under: '#2a78d6', over: '#e34948', mid: '#e1e0d9' },
    dark: { under: '#3987e5', over: '#e66767', mid: '#383835' },
  };
  const CHROME = {
    light: { surface: '#fcfcfb', grid: '#e1e0d9', axis: '#c3c2b7', muted: '#898781', other: '#898781' },
    dark: { surface: '#1a1a19', grid: '#2c2c2a', axis: '#383835', muted: '#898781', other: '#898781' },
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const TAU = Math.PI * 2;

  /* Indonesian number formatting — decimal comma, real minus sign. */
  const nf1 = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmtPct = (v) => nf1.format(v || 0) + '%';
  const fmtPP = (v) => (v > 0 ? '+' : v < 0 ? '\u2212' : '') + nf1.format(Math.abs(v || 0)) + ' pp';

  function theme() {
    return document.documentElement.dataset.themeResolved === 'dark' ? 'dark' : 'light';
  }
  function reduceMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function seriesColor(slot) {
    return SERIES[theme()][(slot - 1) % 8];
  }
  function el(tag, attrs) {
    const n = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ── Tooltip ────────────────────────────────────────────────────────────── */

  let tipEl = null;
  function tooltip() {
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.className = 'viz-tip';
      tipEl.setAttribute('role', 'status');
      document.body.appendChild(tipEl);
    }
    return tipEl;
  }
  /** rows: [{color, label, value, muted}] — label/value inserted as text only. */
  function showTip(x, y, title, rows) {
    const t = tooltip();
    t.textContent = '';
    if (title) {
      const h = document.createElement('div');
      h.className = 'viz-tip__title';
      h.textContent = title;
      t.appendChild(h);
    }
    for (const r of rows) {
      const row = document.createElement('div');
      row.className = 'viz-tip__row';
      if (r.color) {
        const key = document.createElement('span');
        key.className = 'viz-tip__key';
        key.style.background = r.color;
        row.appendChild(key);
      }
      const val = document.createElement('span');
      val.className = 'viz-tip__value';
      val.textContent = r.value;
      const lab = document.createElement('span');
      lab.className = 'viz-tip__label';
      lab.textContent = r.label;
      row.append(val, lab);
      t.appendChild(row);
    }
    t.classList.add('is-on');
    const pad = 14;
    const rect = t.getBoundingClientRect();
    let left = x + pad;
    let top = y - rect.height - pad;
    if (left + rect.width > window.innerWidth - 8) left = x - rect.width - pad;
    if (top < 8) top = y + pad;
    t.style.transform = `translate(${Math.max(8, left)}px, ${top}px)`;
  }
  function hideTip() {
    if (tipEl) tipEl.classList.remove('is-on');
  }

  /* ── Tween ──────────────────────────────────────────────────────────────── */

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function tween(node, duration, step) {
    if (node._raf) cancelAnimationFrame(node._raf);
    if (reduceMotion() || duration <= 0) {
      step(1);
      return;
    }
    const t0 = performance.now();
    const frame = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      step(easeOut(p));
      if (p < 1) node._raf = requestAnimationFrame(frame);
      else node._raf = null;
    };
    node._raf = requestAnimationFrame(frame);
  }

  /* ── Donut ──────────────────────────────────────────────────────────────── */

  const R_OUT = 112, R_IN = 72, R_MID = (R_OUT + R_IN) / 2, CX = 130, CY = 130;

  function annulus(a0, a1, lift) {
    const rOut = R_OUT + lift, rIn = R_IN + lift * 0.35;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const pt = (r, a) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
    if (a1 - a0 >= TAU - 1e-6) {
      /* A single 100% segment: two half arcs, otherwise the path collapses. */
      const m = a0 + Math.PI;
      const [x0, y0] = pt(rOut, a0), [x1, y1] = pt(rOut, m);
      const [i0, j0] = pt(rIn, a0), [i1, j1] = pt(rIn, m);
      return `M${x0} ${y0}A${rOut} ${rOut} 0 0 1 ${x1} ${y1}A${rOut} ${rOut} 0 0 1 ${x0} ${y0}` +
        `M${i0} ${j0}A${rIn} ${rIn} 0 0 0 ${i1} ${j1}A${rIn} ${rIn} 0 0 0 ${i0} ${j0}`;
    }
    const [x0, y0] = pt(rOut, a0), [x1, y1] = pt(rOut, a1);
    const [x2, y2] = pt(rIn, a1), [x3, y3] = pt(rIn, a0);
    return `M${x0} ${y0}A${rOut} ${rOut} 0 ${large} 1 ${x1} ${y1}` +
      `L${x2} ${y2}A${rIn} ${rIn} 0 ${large} 0 ${x3} ${y3}Z`;
  }

  /**
   * @param {HTMLElement} node   container
   * @param {object} opts
   *   segments  [{key, label, color, value}]
   *   total     number (denominator; falls back to the segment sum)
   *   centerLabel / centerValue  strings for the middle of the ring
   *   format    (value) => string, used by the tooltip
   */
  function donut(node, opts) {
    const segs = (opts.segments || []).filter((s) => s.value > 0);
    const sum = segs.reduce((a, s) => a + s.value, 0);
    const total = opts.total || sum;

    let svg = node.querySelector('svg.donut');
    if (!svg) {
      node.textContent = '';
      svg = el('svg', { class: 'donut', viewBox: '0 0 260 260', role: 'img' });
      node.appendChild(svg);
      node._paths = new Map();
      node._prev = new Map();
    }
    svg.setAttribute('aria-label', opts.ariaLabel || 'Diagram donat alokasi');

    if (!segs.length || sum <= 0) {
      svg.textContent = '';
      node._paths.clear();
      node._prev.clear();
      svg.appendChild(el('circle', {
        cx: CX, cy: CY, r: (R_OUT + R_IN) / 2, fill: 'none',
        stroke: CHROME[theme()].grid, 'stroke-width': R_OUT - R_IN,
      }));
      writeCenter(node, opts, true);
      return;
    }

    /* Drop paths for segments that no longer exist. */
    for (const [key, p] of node._paths) {
      if (!segs.some((s) => s.key === key)) {
        p.remove();
        node._paths.delete(key);
        node._prev.delete(key);
      }
    }

    const from = new Map(node._prev);
    for (const s of segs) {
      let p = node._paths.get(s.key);
      if (!p) {
        p = el('path', { class: 'donut__seg', tabindex: '0', role: 'listitem' });
        svg.appendChild(p);
        node._paths.set(s.key, p);
      }
      p.setAttribute('fill', s.color);
      p.setAttribute('aria-label', `${s.label}: ${opts.format(s.value)}`);
      p._seg = s;
      p._node = node;
      bindSegment(p, opts, () => total);
    }

    const gap = 2 / R_MID;
    tween(node, 620, (t) => {
      let a = -Math.PI / 2;
      for (const s of segs) {
        const prev = from.has(s.key) ? from.get(s.key) : 0;
        const v = prev + (s.value - prev) * t;
        const sweep = (v / Math.max(sum, 1e-9)) * TAU * (from.size ? 1 : t);
        const inset = sweep > gap * 1.6 ? gap / 2 : 0;
        const p = node._paths.get(s.key);
        p.setAttribute('d', annulus(a + inset, a + sweep - inset, p._lift || 0));
        p._a0 = a + inset;
        p._a1 = a + sweep - inset;
        a += sweep;
      }
      if (t === 1) for (const s of segs) node._prev.set(s.key, s.value);
    });

    writeCenter(node, opts, false);
  }

  function bindSegment(p, opts, getTotal) {
    if (p._bound) return;
    p._bound = true;
    const show = (ev) => {
      const s = p._seg;
      const pct = (s.value / Math.max(getTotal(), 1e-9)) * 100;
      const box = p.getBoundingClientRect();
      const x = ev && ev.clientX != null ? ev.clientX : box.left + box.width / 2;
      const y = ev && ev.clientY != null ? ev.clientY : box.top + box.height / 2;
      showTip(x, y, s.label, [
        { color: s.color, value: opts.format(s.value), label: fmtPct(pct) },
      ]);
      lift(p, 4);
    };
    const hide = () => { hideTip(); lift(p, 0); };
    p.addEventListener('pointerenter', show);
    p.addEventListener('pointermove', show);
    p.addEventListener('pointerleave', hide);
    p.addEventListener('focus', show);
    p.addEventListener('blur', hide);
  }

  function lift(p, px) {
    p._lift = px;
    const mid = ((p._a0 + p._a1) / 2) || 0;
    const d = px * 0.5;
    p.style.transform = `translate(${Math.cos(mid) * d}px, ${Math.sin(mid) * d}px)`;
  }

  function writeCenter(node, opts, empty) {
    let c = node.querySelector('.donut__center');
    if (!c) {
      c = document.createElement('div');
      c.className = 'donut__center';
      node.appendChild(c);
    }
    c.textContent = '';
    const label = document.createElement('span');
    label.className = 'donut__center-label';
    label.textContent = opts.centerLabel || '';
    const value = document.createElement('span');
    value.className = 'donut__center-value';
    value.textContent = empty ? '—' : (opts.centerValue || '');
    c.append(label, value);
    if (opts.centerNote) {
      const note = document.createElement('span');
      note.className = 'donut__center-note';
      note.textContent = opts.centerNote;
      c.appendChild(note);
    }
  }

  /* ── Drift bars (diverging) ─────────────────────────────────────────────── */

  /**
   * @param rows [{key, label, color, drift (pp), now, target}]
   * @param band tolerance in percentage points
   */
  function driftBars(node, rows, opts) {
    const d = DIVERGING[theme()];
    node.textContent = '';
    if (!rows.length) {
      node.appendChild(emptyNote('Belum ada aset untuk dihitung.'));
      return;
    }
    const max = Math.max(2, ...rows.map((r) => Math.abs(r.drift))) * 1.15;

    const wrap = document.createElement('div');
    wrap.className = 'drift';
    for (const r of rows) {
      const row = document.createElement('div');
      row.className = 'drift__row';
      row.tabIndex = 0;

      const name = document.createElement('span');
      name.className = 'drift__name';
      const dot = document.createElement('span');
      dot.className = 'drift__dot';
      dot.style.background = r.color;
      const nm = document.createElement('span');
      nm.textContent = r.label;
      name.append(dot, nm);

      const track = document.createElement('span');
      track.className = 'drift__track';
      const zero = document.createElement('span');
      zero.className = 'drift__zero';
      zero.style.background = d.mid;
      const bar = document.createElement('span');
      const over = r.drift > 0;
      bar.className = 'drift__bar ' + (over ? 'is-over' : 'is-under');
      bar.style.background = over ? d.over : d.under;
      const w = (Math.abs(r.drift) / max) * 50;
      bar.style.width = w + '%';
      bar.style[over ? 'left' : 'right'] = '50%';
      track.append(zero, bar);

      const val = document.createElement('span');
      val.className = 'drift__value';
      val.textContent = fmtPP(r.drift);

      row.append(name, track, val);
      const show = (ev) => {
        const box = row.getBoundingClientRect();
        showTip(
          ev && ev.clientX != null ? ev.clientX : box.left + box.width / 2,
          ev && ev.clientY != null ? ev.clientY : box.top,
          r.label,
          [
            { color: r.color, value: fmtPct(r.now), label: 'bobot sekarang' },
            { value: fmtPct(r.target), label: 'target' },
            {
              value: fmtPP(r.drift),
              label: Math.abs(r.drift) > (opts && opts.band || 0) ? 'di luar toleransi' : 'dalam toleransi',
            },
          ]
        );
      };
      row.addEventListener('pointerenter', show);
      row.addEventListener('pointermove', show);
      row.addEventListener('pointerleave', hideTip);
      row.addEventListener('focus', show);
      row.addEventListener('blur', hideTip);
      wrap.appendChild(row);
    }

    const scale = document.createElement('div');
    scale.className = 'drift__scale';
    const lo = document.createElement('span');
    lo.textContent = '− kurang dari target';
    const mid = document.createElement('span');
    mid.textContent = '0';
    const hi = document.createElement('span');
    hi.textContent = 'lebih dari target +';
    scale.append(lo, mid, hi);

    node.append(wrap, scale);
  }

  /* ── Line chart (portfolio history) ─────────────────────────────────────── */

  const L = { w: 760, h: 260, top: 18, right: 18, bottom: 34, left: 68 };

  function lineChart(node, points, opts) {
    const c = CHROME[theme()];
    node.textContent = '';
    if (points.length < 2) {
      node.appendChild(emptyNote(
        points.length === 1
          ? 'Simpan satu snapshot lagi untuk melihat grafik pertumbuhan.'
          : 'Belum ada snapshot. Simpan yang pertama untuk mulai melacak.'
      ));
      return;
    }

    const svg = el('svg', {
      class: 'line', viewBox: `0 0 ${L.w} ${L.h}`, role: 'img',
      'aria-label': opts.ariaLabel || 'Grafik nilai portofolio dari waktu ke waktu',
    });
    const plotW = L.w - L.left - L.right, plotH = L.h - L.top - L.bottom;
    const values = points.map((p) => p.value);
    const lo = Math.min(...values), hi = Math.max(...values);
    const pad = (hi - lo) * 0.15 || Math.max(hi * 0.1, 1);
    const yMin = Math.max(0, lo - pad), yMax = hi + pad;
    const x = (i) => L.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
    const y = (v) => L.top + plotH - ((v - yMin) / Math.max(yMax - yMin, 1e-9)) * plotH;

    /* Gridlines + y ticks — solid hairlines, rounded values. */
    const ticks = niceTicks(yMin, yMax, 4);
    for (const t of ticks) {
      svg.appendChild(el('line', {
        x1: L.left, x2: L.w - L.right, y1: y(t), y2: y(t),
        stroke: c.grid, 'stroke-width': 1,
      }));
      const lab = el('text', { x: L.left - 10, y: y(t) + 4, 'text-anchor': 'end', class: 'line__tick' });
      lab.textContent = opts.formatTick(t);
      svg.appendChild(lab);
    }
    svg.appendChild(el('line', {
      x1: L.left, x2: L.w - L.right, y1: L.top + plotH, y2: L.top + plotH,
      stroke: c.axis, 'stroke-width': 1,
    }));

    const color = seriesColor(1);
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.value)}`).join(' ');
    svg.appendChild(el('path', {
      d: `${line} L${x(points.length - 1)} ${L.top + plotH} L${x(0)} ${L.top + plotH} Z`,
      fill: color, opacity: '0.10',
    }));
    const stroke = el('path', {
      d: line, fill: 'none', stroke: color, 'stroke-width': 2,
      'stroke-linejoin': 'round', 'stroke-linecap': 'round', class: 'line__path',
    });
    svg.appendChild(stroke);

    /* x labels: first, last, and the middle one when there is room. */
    const idxs = points.length > 3 ? [0, Math.floor((points.length - 1) / 2), points.length - 1] : points.map((_, i) => i);
    for (const i of new Set(idxs)) {
      const lab = el('text', { x: x(i), y: L.h - 10, 'text-anchor': i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle', class: 'line__tick' });
      lab.textContent = points[i].label;
      svg.appendChild(lab);
    }

    /* End marker: ≥8px with a 2px surface ring. */
    const last = points.length - 1;
    svg.appendChild(el('circle', { cx: x(last), cy: y(points[last].value), r: 6, fill: color, stroke: c.surface, 'stroke-width': 2 }));
    const endLab = el('text', { x: x(last), y: y(points[last].value) - 14, 'text-anchor': 'end', class: 'line__endlabel' });
    endLab.textContent = opts.formatTick(points[last].value);
    svg.appendChild(endLab);

    /* Crosshair + nearest-point tooltip. */
    const cross = el('line', { y1: L.top, y2: L.top + plotH, stroke: c.axis, 'stroke-width': 1, opacity: '0', class: 'line__cross' });
    const focus = el('circle', { r: 5, fill: color, stroke: c.surface, 'stroke-width': 2, opacity: '0' });
    svg.append(cross, focus);
    const hit = el('rect', { x: L.left, y: L.top, width: plotW, height: plotH, fill: 'transparent', tabindex: '0' });
    svg.appendChild(hit);

    let active = last;
    const paint = (i, ev) => {
      active = i;
      const px = x(i), py = y(points[i].value);
      cross.setAttribute('x1', px);
      cross.setAttribute('x2', px);
      cross.setAttribute('opacity', '1');
      focus.setAttribute('cx', px);
      focus.setAttribute('cy', py);
      focus.setAttribute('opacity', '1');
      const box = svg.getBoundingClientRect();
      const sx = box.left + (px / L.w) * box.width;
      const sy = box.top + (py / L.h) * box.height;
      const prev = i > 0 ? points[i - 1].value : null;
      const rows = [{ color, value: opts.format(points[i].value), label: 'total portofolio' }];
      if (prev != null) {
        const delta = points[i].value - prev;
        rows.push({ value: (delta >= 0 ? '+' : '−') + opts.format(Math.abs(delta)), label: 'vs snapshot sebelumnya' });
      }
      showTip(ev ? ev.clientX : sx, ev ? ev.clientY : sy, points[i].title || points[i].label, rows);
    };
    const nearest = (ev) => {
      const box = svg.getBoundingClientRect();
      const local = ((ev.clientX - box.left) / box.width) * L.w;
      let best = 0, bestD = Infinity;
      for (let i = 0; i < points.length; i++) {
        const d2 = Math.abs(x(i) - local);
        if (d2 < bestD) { bestD = d2; best = i; }
      }
      paint(best, ev);
    };
    hit.addEventListener('pointermove', nearest);
    hit.addEventListener('pointerdown', nearest);
    hit.addEventListener('pointerleave', () => {
      hideTip();
      cross.setAttribute('opacity', '0');
      focus.setAttribute('opacity', '0');
    });
    hit.addEventListener('focus', () => paint(active));
    hit.addEventListener('blur', () => {
      hideTip();
      cross.setAttribute('opacity', '0');
      focus.setAttribute('opacity', '0');
    });
    hit.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { paint(Math.min(points.length - 1, active + 1)); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { paint(Math.max(0, active - 1)); e.preventDefault(); }
    });

    node.appendChild(svg);

    if (!reduceMotion()) {
      const len = stroke.getTotalLength();
      stroke.style.strokeDasharray = len;
      stroke.style.strokeDashoffset = len;
      requestAnimationFrame(() => {
        stroke.style.transition = 'stroke-dashoffset 900ms cubic-bezier(.22,.61,.36,1)';
        stroke.style.strokeDashoffset = '0';
      });
    }
  }

  function niceTicks(min, max, count) {
    const span = max - min || 1;
    const raw = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
    const out = [];
    for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(v);
    return out;
  }

  function emptyNote(text) {
    const p = document.createElement('p');
    p.className = 'chart-empty';
    p.textContent = text;
    return p;
  }

  return { donut, driftBars, lineChart, seriesColor, SERIES, DIVERGING, CHROME, theme, hideTip, tween, reduceMotion };
})();
