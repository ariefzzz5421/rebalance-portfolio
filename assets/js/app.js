/**
 * Rebalance — portfolio planner.
 *
 * State lives in localStorage; there is no server and no market-data feed, so
 * every value in the portfolio is typed in by the user. The maths is in
 * `compute()`; everything else renders from its result.
 */
(function () {
  'use strict';

  const { ASSET_LIBRARY, ASSET_CLASSES, PRESET_PORTFOLIOS } = window;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* Tokens that live on a crypto exchange rather than a broker — they show on
     the Crypto page, everything else shows on Stock. */
  const CRYPTO_NATIVE = new Set(['USDT', 'USDC', 'XAUT']);
  const isCrypto = (a) => a.cls === 'kripto' || CRYPTO_NATIVE.has(a.ticker);

  const STORE_KEY = 'rebalance.state.v1';
  const THEME_KEY = 'rebalance.theme';

  /* ── Formatting ─────────────────────────────────────────────────────────── */

  const nfInt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const nf2 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
  const nf4 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 });

  const rp = (v) => 'Rp ' + nfInt.format(Math.round(v || 0));

  function rpCompact(v) {
    const n = Math.abs(v || 0);
    const sign = v < 0 ? '−' : '';
    if (n >= 1e12) return sign + 'Rp ' + nf2.format(n / 1e12) + ' T';
    if (n >= 1e9) return sign + 'Rp ' + nf2.format(n / 1e9) + ' M';
    if (n >= 1e6) return sign + 'Rp ' + nf2.format(n / 1e6) + ' jt';
    if (n >= 1e3) return sign + 'Rp ' + nf1(n / 1e3) + ' rb';
    return sign + 'Rp ' + nfInt.format(n);
  }
  const nf1 = (v) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);
  const pct = (v) => nf1(v || 0) + '%';

  /** Parse Indonesian-style numbers: "10.000.000" or "1.234,5" or "1234.5". */
  function parseNum(raw) {
    if (typeof raw === 'number') return raw;
    let s = String(raw || '').replace(/[^\d.,-]/g, '');
    if (!s) return 0;
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
    else if (lastDot > -1 && s.length - lastDot - 1 === 3 && lastComma === -1) s = s.replace(/\./g, '');
    else s = s.replace(/,/g, '');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  const groupDigits = (n) => (n ? nf4.format(n) : '');
  const todayISO = () => new Date().toISOString();
  const shortDate = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  const longDate = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const uid = () => 'h' + Math.random().toString(36).slice(2, 9);

  /* ── State ──────────────────────────────────────────────────────────────── */

  const defaults = () => ({
    holdings: [],
    custom: [],
    newMoney: 0,
    mode: 'nosell',
    band: 5,
    usdRate: 16300,
    groupBy: 'asset',
    snapshots: [],
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      return Object.assign(defaults(), parsed);
    } catch (err) {
      console.warn('Gagal membaca data tersimpan, mulai dari kosong.', err);
      return defaults();
    }
  }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch (err) {
        toast('Gagal menyimpan ke browser — penyimpanan mungkin penuh.', 'warn');
      }
    }, 180);
  }

  /** Library entry for a ticker, including user-defined ones. */
  function assetOf(ticker) {
    return ASSET_LIBRARY.find((a) => a.ticker === ticker) ||
      state.custom.find((a) => a.ticker === ticker) ||
      { ticker, name: ticker, cls: 'kas', ccy: 'IDR', color: '#898781', lot: 1, unit: 'unit' };
  }
  const allAssets = () => ASSET_LIBRARY.concat(state.custom);
  const classOf = (id) => ASSET_CLASSES.find((c) => c.id === id) || ASSET_CLASSES[0];
  const has = (ticker) => state.holdings.some((h) => h.ticker === ticker);

  /** Lowest palette slot not already taken, so colours stay distinct and stable. */
  function nextSlot() {
    const used = new Set(state.holdings.map((h) => h.slot));
    for (let s = 1; s <= 8; s++) if (!used.has(s)) return s;
    return (state.holdings.length % 8) + 1;
  }

  function addHolding(ticker, opts) {
    if (has(ticker)) {
      toast(`${ticker} sudah ada di portofolio.`, 'warn');
      return false;
    }
    state.holdings.push({
      id: uid(),
      ticker,
      value: (opts && opts.value) || 0,
      price: (opts && opts.price) || 0,
      target: (opts && opts.target) || 0,
      slot: nextSlot(),
    });
    save();
    renderAll(true);
    toast(`${ticker} ditambahkan ke portofolio.`, 'ok');
    return true;
  }

  function removeHolding(id) {
    const i = state.holdings.findIndex((h) => h.id === id);
    if (i < 0) return;
    const [gone] = state.holdings.splice(i, 1);
    save();
    renderAll(true);
    toast(`${gone.ticker} dihapus.`, 'ok');
  }

  /* ── The maths ──────────────────────────────────────────────────────────── */

  function compute() {
    const rate = state.usdRate || 1;
    const rows = state.holdings.map((h) => {
      const a = assetOf(h.ticker);
      const value = Number(h.value) || 0;
      return { h, a, base: a.ccy === 'USD' ? value * rate : value };
    });

    const total = rows.reduce((s, r) => s + r.base, 0);
    const targetSum = rows.reduce((s, r) => s + (Number(r.h.target) || 0), 0);
    const weights = rows.map((r) =>
      targetSum > 0 ? (Number(r.h.target) || 0) / targetSum : (rows.length ? 1 / rows.length : 0));

    const newMoney = Math.max(0, state.newMoney || 0);
    const future = total + newMoney;

    let deltas;
    if (state.mode === 'full') {
      deltas = rows.map((r, i) => future * weights[i] - r.base);
    } else {
      /* Cash-flow rebalancing: new money only, steered to whoever is furthest
         below target. Nothing is ever sold. */
      const need = rows.map((r, i) => Math.max(0, future * weights[i] - r.base));
      const needSum = need.reduce((s, n) => s + n, 0);
      deltas = needSum > 0 ? need.map((n) => (n / needSum) * newMoney) : rows.map(() => 0);
    }

    rows.forEach((r, i) => {
      r.weight = weights[i];
      r.targetPct = weights[i] * 100;
      r.nowPct = total > 0 ? (r.base / total) * 100 : 0;
      r.delta = deltas[i];
      r.after = r.base + deltas[i];
      r.afterPct = future > 0 ? (r.after / future) * 100 : 0;
      r.drift = r.nowPct - r.targetPct;
      r.outOfBand = Math.abs(r.drift) > (state.band || 0);
    });

    const maxDrift = rows.reduce((m, r) => Math.max(m, Math.abs(r.drift)), 0);
    return {
      rows, total, future, newMoney, targetSum, rate,
      maxDrift,
      outOfBand: rows.filter((r) => r.outOfBand).length,
      toBuy: rows.reduce((s, r) => s + Math.max(0, r.delta), 0),
      toSell: rows.reduce((s, r) => s + Math.max(0, -r.delta), 0),
    };
  }

  /* Donut segments — shared by both rings so the colours and the ring order
     match, which is what makes the two charts comparable. */
  function buildSegments(model) {
    const live = model.rows.filter((r) => r.base > 0 || r.after > 0);
    if (state.groupBy === 'class') {
      const byClass = new Map();
      for (const r of live) {
        const c = classOf(r.a.cls);
        const cur = byClass.get(c.id) || { key: c.id, label: c.label, slot: c.slot, now: 0, after: 0 };
        cur.now += r.base;
        cur.after += r.after;
        byClass.set(c.id, cur);
      }
      return ASSET_CLASSES
        .filter((c) => byClass.has(c.id))
        .map((c) => paint(byClass.get(c.id)));
    }

    let items = live.map((r) => ({
      key: r.h.id, label: r.a.ticker, slot: r.h.slot, now: r.base, after: r.after,
    }));
    /* A donut stays readable to about six slices; fold the tail into one. */
    if (items.length > 6) {
      const sorted = items.slice().sort((a, b) => b.now - a.now);
      const keep = sorted.slice(0, 5);
      const rest = sorted.slice(5);
      const other = {
        key: '__other', label: `Lainnya (${rest.length})`, slot: 0,
        now: rest.reduce((s, i) => s + i.now, 0),
        after: rest.reduce((s, i) => s + i.after, 0),
      };
      items = keep.sort((a, b) => a.slot - b.slot).concat([other]);
    } else {
      items.sort((a, b) => a.slot - b.slot);
    }
    return items.map(paint);
  }

  function paint(item) {
    const t = window.Charts.theme();
    item.color = item.slot === 0 ? window.Charts.CHROME[t].other : window.Charts.seriesColor(item.slot);
    return item;
  }

  /* ── Rendering ──────────────────────────────────────────────────────────── */

  let lastSignature = '';

  function renderAll(force) {
    const model = compute();
    renderStats(model);
    renderCharts(model);
    renderDrift(model);
    renderHoldings(model, force);
    renderPlan(model);
    renderHistory(model);
    renderNavCount();
    $('#mode-note').textContent = state.mode === 'full'
      ? 'Aset yang kelebihan bobot dijual, hasilnya dipakai membeli yang kurang.'
      : 'Dana baru diarahkan ke aset yang paling tertinggal. Tidak ada yang dijual.';
  }

  function statTile(label, value, opts) {
    const t = document.createElement('div');
    t.className = 'stat' + (opts && opts.hero ? ' stat--hero' : '');
    const l = document.createElement('span');
    l.className = 'stat__label';
    l.textContent = label;
    const v = document.createElement('span');
    v.className = 'stat__value';
    v.textContent = value;
    t.append(l, v);
    if (opts && opts.delta) {
      const d = document.createElement('span');
      d.className = 'stat__delta ' + (opts.deltaTone || '');
      d.textContent = opts.delta;
      t.appendChild(d);
    }
    if (opts && opts.note) {
      const n = document.createElement('span');
      n.className = 'stat__note';
      n.textContent = opts.note;
      t.appendChild(n);
    }
    return t;
  }

  function renderStats(model) {
    const host = $('#stats');
    host.textContent = '';

    const last = state.snapshots[state.snapshots.length - 1];
    let delta = null, tone = '';
    if (last && last.total > 0) {
      const diff = model.total - last.total;
      const p = (diff / last.total) * 100;
      delta = `${diff >= 0 ? '+' : '−'}${rpCompact(Math.abs(diff)).replace('−', '')} (${nf1(Math.abs(p))}%) sejak ${shortDate(last.t)}`;
      tone = diff >= 0 ? 'is-up' : 'is-down';
    }

    host.appendChild(statTile('Total portofolio', rpCompact(model.total), {
      hero: true, delta, deltaTone: tone,
      note: model.rows.length ? `${model.rows.length} aset` : 'belum ada aset',
    }));
    host.appendChild(statTile('Dana baru', rpCompact(model.newMoney), {
      note: model.newMoney ? 'siap dialokasikan' : 'isi di pengaturan',
    }));
    host.appendChild(statTile('Total setelah investasi', rpCompact(model.future), {
      note: model.newMoney ? `naik ${pct(model.total > 0 ? (model.newMoney / model.total) * 100 : 0)}` : 'sama dengan sekarang',
    }));

    const balanced = model.outOfBand === 0;
    host.appendChild(statTile('Drift maksimum', model.rows.length ? nf1(model.maxDrift) + ' pp' : '—', {
      note: !model.rows.length ? 'belum ada data'
        : balanced ? `semua dalam toleransi ±${nf1(state.band)} pp`
          : `${model.outOfBand} aset di luar toleransi`,
      delta: model.rows.length ? (balanced ? 'Seimbang' : 'Perlu rebalance') : null,
      deltaTone: model.rows.length ? (balanced ? 'is-ok' : 'is-warn') : '',
    }));

    stagger(host.children, 40);
  }

  function renderCharts(model) {
    const segs = buildSegments(model);
    const nowSegs = segs.map((s) => ({ key: s.key, label: s.label, color: s.color, value: s.now }));
    const afterSegs = segs.map((s) => ({ key: s.key, label: s.label, color: s.color, value: s.after }));

    window.Charts.donut($('#pie-now'), {
      segments: nowSegs, total: model.total, format: rp,
      centerLabel: 'Total sekarang', centerValue: rpCompact(model.total),
      centerNote: model.rows.length ? `${nowSegs.length} bagian` : '',
      ariaLabel: 'Alokasi portofolio saat ini',
    });
    window.Charts.donut($('#pie-after'), {
      segments: afterSegs, total: model.future, format: rp,
      centerLabel: 'Setelah rebalance', centerValue: rpCompact(model.future),
      centerNote: model.newMoney ? '+' + rpCompact(model.newMoney) + ' dana baru' : '',
      ariaLabel: 'Alokasi portofolio setelah rebalance',
    });

    renderTableView($('#table-now'), segs, 'now', model.total);
    renderTableView($('#table-after'), segs, 'after', model.future);
    renderLegend(segs, model);
  }

  function renderTableView(host, segs, key, total) {
    host.textContent = '';
    if (!segs.length) {
      host.appendChild(note('Belum ada aset.'));
      return;
    }
    const table = document.createElement('table');
    table.className = 'table table--mini';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th scope="col">Bagian</th><th scope="col" class="num">Nilai</th><th scope="col" class="num">Bobot</th></tr>';
    const tbody = document.createElement('tbody');
    for (const s of segs) {
      const tr = document.createElement('tr');
      tr.append(
        cell(s.label, '', s.color),
        cell(rp(s[key]), 'num'),
        cell(pct(total > 0 ? (s[key] / total) * 100 : 0), 'num')
      );
      tbody.appendChild(tr);
    }
    table.append(thead, tbody);
    host.appendChild(table);
  }

  function cell(text, cls, swatch) {
    const td = document.createElement('td');
    if (cls) td.className = cls;
    if (swatch) {
      const dot = document.createElement('span');
      dot.className = 'swatch';
      dot.style.background = swatch;
      td.appendChild(dot);
    }
    td.appendChild(document.createTextNode(text));
    return td;
  }

  function renderLegend(segs, model) {
    const host = $('#legend');
    host.textContent = '';
    if (!segs.length) {
      host.appendChild(note('Tambahkan aset untuk melihat alokasi.'));
      return;
    }
    for (const s of segs) {
      const nowPct = model.total > 0 ? (s.now / model.total) * 100 : 0;
      const afterPct = model.future > 0 ? (s.after / model.future) * 100 : 0;
      const item = document.createElement('div');
      item.className = 'legend__item';

      const key = document.createElement('span');
      key.className = 'legend__key';
      key.style.background = s.color;

      const label = document.createElement('span');
      label.className = 'legend__label';
      label.textContent = s.label;

      const bar = document.createElement('span');
      bar.className = 'legend__bar';
      const fill = document.createElement('span');
      fill.style.background = s.color;
      fill.style.width = Math.min(100, nowPct) + '%';
      bar.appendChild(fill);

      const val = document.createElement('span');
      val.className = 'legend__value';
      val.textContent = pct(nowPct);

      const arrow = document.createElement('span');
      arrow.className = 'legend__after';
      arrow.textContent = '→ ' + pct(afterPct);

      item.append(key, label, bar, val, arrow);
      host.appendChild(item);
    }
  }

  function renderDrift(model) {
    const host = $('#drift');
    const segs = buildSegments(model);
    const byKey = new Map(segs.map((s) => [s.key, s]));
    let rows;
    if (state.groupBy === 'class') {
      rows = segs.map((s) => {
        const now = model.total > 0 ? (s.now / model.total) * 100 : 0;
        const target = model.future > 0 ? (s.after / model.future) * 100 : 0;
        return { key: s.key, label: s.label, color: s.color, now, target, drift: now - target };
      });
    } else {
      rows = model.rows.map((r) => ({
        key: r.h.id,
        label: r.a.ticker,
        color: (byKey.get(r.h.id) || {}).color || window.Charts.seriesColor(r.h.slot),
        now: r.nowPct,
        target: r.targetPct,
        drift: r.drift,
      }));
    }
    rows.sort((a, b) => b.drift - a.drift);
    window.Charts.driftBars(host, rows, { band: state.band });
  }

  /* Holdings table. Inputs live here, so the rows are only rebuilt when the set
     of holdings changes — otherwise typing would lose focus on every keystroke. */
  function renderHoldings(model, force) {
    const body = $('#holdings-body');
    const signature = state.holdings.map((h) => h.id + ':' + h.ticker).join('|') + '|' + state.groupBy;
    const rebuild = force || signature !== lastSignature;
    lastSignature = signature;

    $('#holdings-empty').hidden = state.holdings.length > 0;

    if (rebuild) {
      body.textContent = '';
      for (const r of model.rows) body.appendChild(holdingRow(r));
    }
    for (const r of model.rows) {
      const tr = body.querySelector(`tr[data-id="${r.h.id}"]`);
      if (!tr) continue;
      const w = tr.querySelector('[data-cell="weight"]');
      w.textContent = pct(r.nowPct);
      w.classList.toggle('is-out', r.outOfBand && state.holdings.length > 1);
      const idr = tr.querySelector('[data-cell="idr"]');
      if (idr) idr.textContent = r.a.ccy === 'USD' ? '≈ ' + rpCompact(r.base) : '';
    }
    renderHoldingsFoot(model);
    renderPresets();
  }

  function holdingRow(r) {
    const tr = document.createElement('tr');
    tr.dataset.id = r.h.id;

    /* Asset cell */
    const tdA = document.createElement('td');
    const idn = document.createElement('div');
    idn.className = 'ident';
    idn.appendChild(window.logoEl(r.a, 'sm'));
    const txt = document.createElement('span');
    txt.className = 'ident__text';
    const tk = document.createElement('strong');
    tk.textContent = r.a.ticker;
    const nm = document.createElement('small');
    nm.textContent = r.a.name;
    txt.append(tk, nm);
    idn.appendChild(txt);
    const badge = document.createElement('span');
    badge.className = 'badge badge--slot';
    badge.style.setProperty('--slot', window.Charts.seriesColor(r.h.slot));
    badge.textContent = classOf(r.a.cls).short;
    idn.appendChild(badge);
    tdA.appendChild(idn);

    /* Value */
    const tdV = document.createElement('td');
    tdV.className = 'num';
    const vWrap = document.createElement('span');
    vWrap.className = 'cell-input';
    const vPre = document.createElement('span');
    vPre.className = 'cell-input__pre';
    vPre.textContent = r.a.ccy === 'USD' ? '$' : 'Rp';
    const vIn = document.createElement('input');
    vIn.type = 'text';
    vIn.inputMode = 'decimal';
    vIn.value = r.h.value ? groupDigits(r.h.value) : '';
    vIn.placeholder = '0';
    vIn.setAttribute('aria-label', `Nilai ${r.a.ticker}`);
    vIn.dataset.field = 'value';
    vWrap.append(vPre, vIn);
    const idr = document.createElement('small');
    idr.dataset.cell = 'idr';
    idr.className = 'cell-note';
    tdV.append(vWrap, idr);

    /* Price */
    const tdP = document.createElement('td');
    tdP.className = 'num';
    const pWrap = document.createElement('span');
    pWrap.className = 'cell-input';
    const pPre = document.createElement('span');
    pPre.className = 'cell-input__pre';
    pPre.textContent = r.a.ccy === 'USD' ? '$' : 'Rp';
    const pIn = document.createElement('input');
    pIn.type = 'text';
    pIn.inputMode = 'decimal';
    pIn.value = r.h.price ? groupDigits(r.h.price) : '';
    pIn.placeholder = '—';
    pIn.setAttribute('aria-label', `Harga per ${r.a.unit} ${r.a.ticker}`);
    pIn.dataset.field = 'price';
    pWrap.append(pPre, pIn);
    const unit = document.createElement('small');
    unit.className = 'cell-note';
    unit.textContent = 'per ' + r.a.unit;
    tdP.append(pWrap, unit);

    /* Target */
    const tdT = document.createElement('td');
    tdT.className = 'num';
    const tWrap = document.createElement('span');
    tWrap.className = 'cell-input cell-input--pct';
    const tIn = document.createElement('input');
    tIn.type = 'number';
    tIn.min = '0';
    tIn.max = '100';
    tIn.step = '0.5';
    tIn.value = r.h.target || 0;
    tIn.setAttribute('aria-label', `Target ${r.a.ticker} dalam persen`);
    tIn.dataset.field = 'target';
    const tSuf = document.createElement('span');
    tSuf.className = 'cell-input__suf';
    tSuf.textContent = '%';
    tWrap.append(tIn, tSuf);
    tdT.appendChild(tWrap);

    /* Current weight */
    const tdW = document.createElement('td');
    tdW.className = 'num';
    const w = document.createElement('span');
    w.className = 'weight';
    w.dataset.cell = 'weight';
    tdW.appendChild(w);

    /* Remove */
    const tdX = document.createElement('td');
    tdX.className = 'num';
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'icon-btn icon-btn--quiet';
    del.dataset.action = 'remove';
    del.setAttribute('aria-label', `Hapus ${r.a.ticker}`);
    del.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
    tdX.appendChild(del);

    tr.append(tdA, tdV, tdP, tdT, tdW, tdX);
    return tr;
  }

  function renderHoldingsFoot(model) {
    const foot = $('#holdings-foot');
    foot.textContent = '';
    if (!model.rows.length) return;
    const tr = document.createElement('tr');
    const label = document.createElement('th');
    label.scope = 'row';
    label.textContent = 'Total';
    const v = document.createElement('td');
    v.className = 'num';
    v.textContent = rp(model.total);
    const spacer = document.createElement('td');
    const t = document.createElement('td');
    t.className = 'num';
    const sum = model.targetSum;
    t.textContent = nf1(sum) + '%';
    if (Math.abs(sum - 100) > 0.05) {
      t.classList.add('is-out');
      t.title = 'Target belum berjumlah 100% — bobot dihitung proporsional.';
    }
    const w = document.createElement('td');
    w.className = 'num';
    w.textContent = model.total > 0 ? '100%' : '—';
    const x = document.createElement('td');
    tr.append(label, v, spacer, t, w, x);
    foot.appendChild(tr);
  }

  function renderPresets() {
    const host = $('#presets');
    if (host.dataset.built) return;
    host.dataset.built = '1';
    const title = document.createElement('h3');
    title.className = 'presets__title';
    title.textContent = 'Mulai dari racikan siap pakai';
    host.appendChild(title);
    const list = document.createElement('div');
    list.className = 'presets__list';
    for (const p of PRESET_PORTFOLIOS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset';
      b.dataset.preset = p.id;
      const strong = document.createElement('strong');
      strong.textContent = p.name;
      const small = document.createElement('small');
      small.textContent = p.desc;
      const chips = document.createElement('span');
      chips.className = 'preset__chips';
      for (const ticker of Object.keys(p.mix).slice(0, 5)) {
        const c = document.createElement('span');
        c.textContent = ticker;
        chips.appendChild(c);
      }
      b.append(strong, small, chips);
      list.appendChild(b);
    }
    host.appendChild(list);
  }

  function applyPreset(id) {
    const preset = PRESET_PORTFOLIOS.find((p) => p.id === id);
    if (!preset) return;
    const keepValues = new Map(state.holdings.map((h) => [h.ticker, h]));
    state.holdings = Object.entries(preset.mix).map(([ticker, target], i) => {
      const prev = keepValues.get(ticker);
      return {
        id: prev ? prev.id : uid(),
        ticker,
        value: prev ? prev.value : 0,
        price: prev ? prev.price : 0,
        target,
        slot: (i % 8) + 1,
      };
    });
    save();
    renderAll(true);
    toast(`Racikan “${preset.name}” diterapkan. Nilai aset yang sudah ada tetap disimpan.`, 'ok');
  }

  function renderPlan(model) {
    const body = $('#plan-body');
    body.textContent = '';
    const sub = $('#plan-sub');

    if (!model.rows.length) {
      sub.textContent = 'Tambahkan aset dan tentukan target untuk melihat rencananya.';
      return;
    }
    if (model.targetSum <= 0) {
      sub.textContent = 'Belum ada target. Pakai “Bagi rata” atau isi kolom target dulu — sementara ini bobot dianggap sama rata.';
    } else if (state.mode === 'nosell') {
      sub.textContent = model.newMoney > 0
        ? `${rp(model.newMoney)} dibagi ke aset yang bobotnya masih di bawah target. Tidak ada penjualan.`
        : 'Isi “dana baru” untuk melihat pembagiannya. Tanpa dana baru, metode ini tidak menyarankan transaksi apa pun.';
    } else {
      sub.textContent = `Jual ${rp(model.toSell)}, beli ${rp(model.toBuy)} agar bobot pas dengan target.`;
    }

    const ordered = model.rows.slice().sort((a, b) => b.delta - a.delta);
    for (const r of ordered) {
      const tr = document.createElement('tr');

      const tdA = document.createElement('td');
      const idn = document.createElement('div');
      idn.className = 'ident ident--tight';
      idn.appendChild(window.logoEl(r.a, 'sm'));
      const txt = document.createElement('span');
      txt.className = 'ident__text';
      const tk = document.createElement('strong');
      tk.textContent = r.a.ticker;
      const nm = document.createElement('small');
      nm.textContent = `${pct(r.nowPct)} → ${pct(r.targetPct)}`;
      txt.append(tk, nm);
      idn.appendChild(txt);
      tdA.appendChild(idn);

      const nominalIDR = Math.abs(r.delta);
      const meaningful = nominalIDR >= 1000;
      const buying = r.delta > 0;

      const tdAct = document.createElement('td');
      const act = document.createElement('span');
      act.className = 'action ' + (!meaningful ? 'is-hold' : buying ? 'is-buy' : 'is-sell');
      act.textContent = !meaningful ? 'Tahan' : buying ? 'Beli' : 'Jual';
      tdAct.appendChild(act);
      if (r.outOfBand && meaningful) {
        const flag = document.createElement('small');
        flag.className = 'cell-note is-out';
        flag.textContent = 'di luar toleransi';
        tdAct.appendChild(flag);
      }

      const tdN = document.createElement('td');
      tdN.className = 'num';
      if (meaningful) {
        const main = document.createElement('span');
        main.textContent = rp(nominalIDR);
        tdN.appendChild(main);
        if (r.a.ccy === 'USD') {
          const native = document.createElement('small');
          native.className = 'cell-note';
          native.textContent = '$' + nf2.format(nominalIDR / model.rate);
          tdN.appendChild(native);
        }
      } else {
        tdN.textContent = '—';
      }

      const tdU = document.createElement('td');
      tdU.className = 'num';
      const price = Number(r.h.price) || 0;
      if (meaningful && price > 0) {
        const nativeAmount = r.a.ccy === 'USD' ? nominalIDR / model.rate : nominalIDR;
        const units = nativeAmount / price;
        const main = document.createElement('span');
        if (r.a.lot > 1) {
          /* IDX trades in whole lots, so lots lead and the odd shares are dropped. */
          const lots = Math.floor(units / r.a.lot);
          main.textContent = nfInt.format(lots) + ' lot';
          const shares = document.createElement('small');
          shares.className = 'cell-note';
          shares.textContent = nfInt.format(lots * r.a.lot) + ' ' + r.a.unit;
          tdU.append(main, shares);
        } else {
          main.textContent = nf4.format(units) + ' ' + r.a.unit;
          tdU.appendChild(main);
        }
      } else {
        tdU.textContent = price > 0 ? '—' : '';
        if (price <= 0 && meaningful) {
          const hint = document.createElement('small');
          hint.className = 'cell-note';
          hint.textContent = 'isi harga';
          tdU.textContent = '';
          tdU.appendChild(hint);
        }
      }

      const tdAfter = document.createElement('td');
      tdAfter.className = 'num';
      tdAfter.textContent = rp(r.after);

      const tdW = document.createElement('td');
      tdW.className = 'num';
      tdW.textContent = pct(r.afterPct);

      tr.append(tdA, tdAct, tdN, tdU, tdAfter, tdW);
      body.appendChild(tr);
    }
  }

  /* ── Tracking ───────────────────────────────────────────────────────────── */

  function renderHistory(model) {
    const points = state.snapshots.map((s) => ({
      value: s.total,
      label: shortDate(s.t),
      title: longDate(s.t),
    }));
    window.Charts.lineChart($('#history-chart'), points, {
      format: rp,
      formatTick: rpCompact,
      ariaLabel: 'Nilai total portofolio pada tiap snapshot',
    });

    const wrap = $('#history-table-wrap');
    wrap.hidden = state.snapshots.length === 0;
    const body = $('#history-body');
    body.textContent = '';
    state.snapshots.slice().reverse().forEach((s, i, arr) => {
      const prev = arr[i + 1];
      const tr = document.createElement('tr');
      const d = document.createElement('th');
      d.scope = 'row';
      d.textContent = longDate(s.t);
      const total = cell(rp(s.total), 'num');
      let deltaText = '—';
      let tone = '';
      if (prev) {
        const diff = s.total - prev.total;
        const p = prev.total > 0 ? (diff / prev.total) * 100 : 0;
        deltaText = `${diff >= 0 ? '+' : '−'}${rp(Math.abs(diff)).replace('Rp ', 'Rp ')} (${nf1(Math.abs(p))}%)`;
        tone = diff >= 0 ? 'is-up' : 'is-down';
      }
      const delta = cell(deltaText, 'num ' + tone);
      const drift = cell(s.maxDrift != null ? nf1(s.maxDrift) + ' pp' : '—', 'num');
      const tdX = document.createElement('td');
      tdX.className = 'num';
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'icon-btn icon-btn--quiet';
      del.dataset.action = 'del-snapshot';
      del.dataset.t = s.t;
      del.setAttribute('aria-label', 'Hapus snapshot ' + longDate(s.t));
      del.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
      tdX.appendChild(del);
      tr.append(d, total, delta, drift, tdX);
      body.appendChild(tr);
    });
  }

  function takeSnapshot() {
    const model = compute();
    if (!model.rows.length || model.total <= 0) {
      toast('Isi dulu nilai asetmu sebelum menyimpan snapshot.', 'warn');
      return;
    }
    state.snapshots.push({
      t: todayISO(),
      total: model.total,
      maxDrift: model.maxDrift,
      byTicker: Object.fromEntries(model.rows.map((r) => [r.a.ticker, Math.round(r.base)])),
    });
    state.snapshots.sort((a, b) => new Date(a.t) - new Date(b.t));
    save();
    renderAll();
    toast('Snapshot tersimpan.', 'ok');
  }

  /* ── Listing pages (Stock / Crypto) ─────────────────────────────────────── */

  const LISTINGS = {
    stock: {
      title: 'Stock',
      sub: 'Bluechip Bursa Efek Indonesia, bluechip Amerika, ETF indeks, emas, obligasi dan kas.',
      pick: (a) => !isCrypto(a),
      filters: [
        { id: 'all', label: 'Semua' },
        { id: 'saham-id', label: 'Indonesia' },
        { id: 'saham-us', label: 'Amerika' },
        { id: 'etf', label: 'ETF & Indeks' },
        { id: 'emas', label: 'Emas' },
        { id: 'obligasi', label: 'Obligasi' },
        { id: 'kas', label: 'Kas' },
      ],
    },
    crypto: {
      title: 'Crypto',
      sub: 'Koin utama, stablecoin sebagai kas, dan emas dalam bentuk token.',
      pick: isCrypto,
      filters: [
        { id: 'all', label: 'Semua' },
        { id: 'kripto', label: 'Koin & token' },
        { id: 'kas', label: 'Stablecoin' },
        { id: 'emas', label: 'Emas token' },
      ],
    },
  };

  const listingState = { stock: { filter: 'all', q: '' }, crypto: { filter: 'all', q: '' } };

  function renderListing(page) {
    const cfg = LISTINGS[page];
    const host = $('#listing-' + page);
    const ls = listingState[page];
    host.textContent = '';

    /* Toolbar: search + filter chips, one row above everything it scopes. */
    const bar = document.createElement('div');
    bar.className = 'listing__bar';

    const search = document.createElement('div');
    search.className = 'search';
    const sIcon = document.createElement('span');
    sIcon.className = 'search__icon';
    sIcon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.8 15.8 20.5 20.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    const sInput = document.createElement('input');
    sInput.type = 'search';
    sInput.placeholder = 'Cari ticker atau nama…';
    sInput.value = ls.q;
    sInput.setAttribute('aria-label', 'Cari aset');
    sInput.addEventListener('input', () => {
      ls.q = sInput.value;
      renderListingBody(page);
    });
    search.append(sIcon, sInput);

    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const f of cfg.filters) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (ls.filter === f.id ? ' is-active' : '');
      b.textContent = f.label;
      b.addEventListener('click', () => {
        ls.filter = f.id;
        $$('.chip', chips).forEach((c) => c.classList.toggle('is-active', c === b));
        renderListingBody(page);
      });
      chips.appendChild(b);
    }

    bar.append(search, chips);

    const body = document.createElement('div');
    body.id = 'listing-body-' + page;
    host.append(bar, body);
    renderListingBody(page);
  }

  function renderListingBody(page) {
    const cfg = LISTINGS[page];
    const ls = listingState[page];
    const host = $('#listing-body-' + page);
    if (!host) return;
    host.textContent = '';

    const q = ls.q.trim().toLowerCase();
    const match = (a) =>
      cfg.pick(a) &&
      (ls.filter === 'all' || a.cls === ls.filter) &&
      (!q || a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));

    const pool = allAssets().filter(match);
    const featured = pool.filter((a) => a.featured);
    const rest = pool.filter((a) => !a.featured);

    if (!pool.length) {
      host.appendChild(note('Tidak ada aset yang cocok dengan pencarian itu.'));
      return;
    }
    if (featured.length) host.appendChild(assetGrid('Aset utama', featured, true));
    if (rest.length) host.appendChild(assetGrid(featured.length ? 'Semua aset' : 'Aset', rest, false));
  }

  function assetGrid(heading, assets, highlight) {
    const section = document.createElement('section');
    section.className = 'asset-section';
    const h = document.createElement('h2');
    h.className = 'asset-section__title';
    h.textContent = heading;
    const count = document.createElement('span');
    count.className = 'asset-section__count';
    count.textContent = assets.length + ' aset';
    h.appendChild(count);
    section.appendChild(h);

    const grid = document.createElement('div');
    grid.className = 'asset-grid';
    assets.forEach((a, i) => grid.appendChild(assetCard(a, highlight, i)));
    section.appendChild(grid);
    stagger(grid.children, 26);
    return section;
  }

  function assetCard(a, highlight, index) {
    const card = document.createElement('article');
    card.className = 'asset-card reveal' + (highlight ? ' is-featured' : '');
    card.style.setProperty('--i', index);

    const head = document.createElement('div');
    head.className = 'asset-card__head';
    head.appendChild(window.logoEl(a, 'lg'));
    const t = document.createElement('div');
    t.className = 'asset-card__ident';
    const ticker = document.createElement('strong');
    ticker.textContent = a.ticker;
    const name = document.createElement('span');
    name.textContent = a.name;
    t.append(ticker, name);
    head.appendChild(t);

    const badges = document.createElement('div');
    badges.className = 'asset-card__badges';
    const cls = document.createElement('span');
    cls.className = 'badge';
    cls.textContent = classOf(a.cls).short;
    const ccy = document.createElement('span');
    ccy.className = 'badge badge--ghost';
    ccy.textContent = a.ccy;
    badges.append(cls, ccy);

    const note_ = document.createElement('p');
    note_.className = 'asset-card__note';
    note_.textContent = a.note || '';

    const foot = document.createElement('div');
    foot.className = 'asset-card__foot';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--add';
    btn.dataset.add = a.ticker;
    setAddButton(btn, a.ticker);
    foot.appendChild(btn);

    card.append(head, badges, note_, foot);
    return card;
  }

  function setAddButton(btn, ticker) {
    const inPortfolio = has(ticker);
    btn.classList.toggle('is-owned', inPortfolio);
    btn.textContent = '';
    const icon = document.createElement('span');
    icon.className = 'btn__icon';
    icon.innerHTML = inPortfolio
      ? '<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>';
    btn.append(icon, document.createTextNode(inPortfolio ? 'Di portofolio' : 'Tambahkan'));
  }

  function refreshAddButtons() {
    $$('[data-add]').forEach((b) => setAddButton(b, b.dataset.add));
  }

  /* ── Asset picker modal ─────────────────────────────────────────────────── */

  const pickerState = { q: '', cls: 'all' };

  function openPicker() {
    const modal = $('#picker');
    modal.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    renderPickerChips();
    renderPickerList();
    $('#picker-search').focus();
  }

  function closePicker() {
    const modal = $('#picker');
    modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(() => { modal.hidden = true; }, 180);
  }

  function renderPickerChips() {
    const host = $('#picker-chips');
    if (host.dataset.built) return;
    host.dataset.built = '1';
    const opts = [{ id: 'all', label: 'Semua' }].concat(ASSET_CLASSES.map((c) => ({ id: c.id, label: c.label })));
    for (const o of opts) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (pickerState.cls === o.id ? ' is-active' : '');
      b.textContent = o.label;
      b.addEventListener('click', () => {
        pickerState.cls = o.id;
        $$('.chip', host).forEach((c) => c.classList.toggle('is-active', c === b));
        renderPickerList();
      });
      host.appendChild(b);
    }
  }

  function renderPickerList() {
    const host = $('#picker-list');
    host.textContent = '';
    const q = pickerState.q.trim().toLowerCase();
    const list = allAssets().filter((a) =>
      (pickerState.cls === 'all' || a.cls === pickerState.cls) &&
      (!q || a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)));

    if (!list.length) {
      host.appendChild(note('Tidak ketemu. Tambahkan lewat formulir di bawah.'));
      return;
    }
    for (const a of list.slice(0, 120)) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'pick';
      row.dataset.add = a.ticker;
      row.appendChild(window.logoEl(a, 'md'));
      const txt = document.createElement('span');
      txt.className = 'pick__text';
      const tk = document.createElement('strong');
      tk.textContent = a.ticker;
      const nm = document.createElement('small');
      nm.textContent = a.name;
      txt.append(tk, nm);
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = classOf(a.cls).short;
      const state_ = document.createElement('span');
      state_.className = 'pick__state';
      state_.textContent = has(a.ticker) ? '✓' : '+';
      row.append(txt, badge, state_);
      host.appendChild(row);
    }
  }

  /* ── Router ─────────────────────────────────────────────────────────────── */

  const ROUTES = {
    portofolio: { title: 'Portofolio', sub: 'Alokasi, rencana rebalance, dan pelacakan.' },
    stock: { title: LISTINGS.stock.title, sub: LISTINGS.stock.sub },
    crypto: { title: LISTINGS.crypto.title, sub: LISTINGS.crypto.sub },
  };

  function route() {
    const raw = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
    const name = ROUTES[raw] ? raw : 'portofolio';
    for (const key of Object.keys(ROUTES)) {
      const page = $('#page-' + key);
      page.hidden = key !== name;
    }
    $$('.nav__item').forEach((a) => {
      const on = a.dataset.route === name;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    $('#page-title').textContent = ROUTES[name].title;
    $('#page-sub').textContent = ROUTES[name].sub;
    document.title = `${ROUTES[name].title} — Rebalance`;

    if (name === 'stock' || name === 'crypto') renderListing(name);
    else renderAll(true);

    const active = $('#page-' + name);
    active.classList.remove('page--in');
    void active.offsetWidth;
    active.classList.add('page--in');
    stagger($$('.reveal', active), 45);
    /* Jump, don't glide — a long smooth scroll after a nav click reads as lag. */
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function stagger(nodes, step) {
    Array.from(nodes).forEach((n, i) => {
      n.style.setProperty('--delay', (i * step) + 'ms');
      n.classList.remove('is-in');
      void n.offsetWidth;
      n.classList.add('is-in');
    });
  }

  /* ── Theme ──────────────────────────────────────────────────────────────── */

  function applyTheme(pref) {
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const resolved = pref === 'system' ? system : pref;
    document.documentElement.dataset.theme = pref;
    document.documentElement.dataset.themeResolved = resolved;
    document.documentElement.style.colorScheme = resolved;
    $('#theme-label').textContent = resolved === 'dark' ? 'Tema gelap' : 'Tema terang';
    localStorage.setItem(THEME_KEY, pref);
  }

  function currentTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
  }

  /* ── Toasts ─────────────────────────────────────────────────────────────── */

  function toast(message, tone) {
    const host = $('#toasts');
    const t = document.createElement('div');
    t.className = 'toast ' + (tone ? 'toast--' + tone : '');
    t.textContent = message;
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add('is-in'));
    setTimeout(() => {
      t.classList.remove('is-in');
      setTimeout(() => t.remove(), 260);
    }, 3200);
  }

  function note(text) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = text;
    return p;
  }

  function renderNavCount() {
    const badge = $('#nav-count');
    badge.hidden = state.holdings.length === 0;
    badge.textContent = state.holdings.length;
  }

  /* ── Wiring ─────────────────────────────────────────────────────────────── */

  function boot() {
    applyTheme(currentTheme());
    $('#new-money').value = state.newMoney ? nfInt.format(state.newMoney) : '';
    $('#usd-rate').value = nfInt.format(state.usdRate);
    $('#mode').value = state.mode;
    $('#band').value = state.band;
    $$('.segmented [data-group]').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.group === state.groupBy));

    /* Custom-asset class options */
    const sel = $('#custom-class');
    for (const c of ASSET_CLASSES) {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.label;
      sel.appendChild(o);
    }

    window.addEventListener('hashchange', route);
    route();

    /* Global settings */
    $('#new-money').addEventListener('input', (e) => {
      state.newMoney = parseNum(e.target.value);
      save();
      renderAll();
    });
    $('#new-money').addEventListener('blur', (e) => {
      e.target.value = state.newMoney ? nfInt.format(state.newMoney) : '';
    });
    $('#usd-rate').addEventListener('input', (e) => {
      state.usdRate = parseNum(e.target.value) || 1;
      save();
      renderAll();
    });
    $('#usd-rate').addEventListener('blur', (e) => {
      e.target.value = nfInt.format(state.usdRate);
    });
    $('#mode').addEventListener('change', (e) => {
      state.mode = e.target.value;
      save();
      renderAll();
    });
    $('#band').addEventListener('input', (e) => {
      state.band = Math.max(0, parseNum(e.target.value));
      save();
      renderAll();
    });
    $$('.segmented [data-group]').forEach((b) => {
      b.addEventListener('click', () => {
        state.groupBy = b.dataset.group;
        $$('.segmented [data-group]').forEach((x) => x.classList.toggle('is-active', x === b));
        save();
        renderAll(true);
      });
    });

    /* Holdings table — delegated input + remove */
    const body = $('#holdings-body');
    body.addEventListener('input', (e) => {
      const field = e.target.dataset.field;
      if (!field) return;
      const tr = e.target.closest('tr');
      const h = state.holdings.find((x) => x.id === tr.dataset.id);
      if (!h) return;
      const v = parseNum(e.target.value);
      h[field] = field === 'target' ? Math.max(0, v) : Math.max(0, v);
      save();
      renderAll();
    });
    body.addEventListener('blur', (e) => {
      const field = e.target.dataset.field;
      if (field !== 'value' && field !== 'price') return;
      const tr = e.target.closest('tr');
      const h = state.holdings.find((x) => x.id === tr.dataset.id);
      if (h) e.target.value = h[field] ? groupDigits(h[field]) : '';
    }, true);
    body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="remove"]');
      if (!btn) return;
      removeHolding(btn.closest('tr').dataset.id);
    });

    /* Target helpers */
    $('#btn-equal').addEventListener('click', () => {
      if (!state.holdings.length) return toast('Belum ada aset.', 'warn');
      const each = Math.round((100 / state.holdings.length) * 10) / 10;
      state.holdings.forEach((h) => { h.target = each; });
      save();
      renderAll(true);
      toast('Target dibagi rata.', 'ok');
    });
    $('#btn-copy-now').addEventListener('click', () => {
      const model = compute();
      if (model.total <= 0) return toast('Isi nilai aset dulu.', 'warn');
      model.rows.forEach((r) => { r.h.target = Math.round(r.nowPct * 10) / 10; });
      save();
      renderAll(true);
      toast('Target disamakan dengan bobot sekarang.', 'ok');
    });
    $('#btn-normalize').addEventListener('click', () => {
      const sum = state.holdings.reduce((s, h) => s + (Number(h.target) || 0), 0);
      if (sum <= 0) return toast('Isi target dulu, minimal satu aset.', 'warn');
      state.holdings.forEach((h) => { h.target = Math.round(((h.target || 0) / sum) * 1000) / 10; });
      save();
      renderAll(true);
      toast('Target dinormalkan ke 100%.', 'ok');
    });

    /* Presets */
    $('#presets').addEventListener('click', (e) => {
      const b = e.target.closest('[data-preset]');
      if (b) applyPreset(b.dataset.preset);
    });

    /* Table-view toggles */
    $$('[data-table-toggle]').forEach((b) => {
      b.addEventListener('click', () => {
        const target = $('#' + b.dataset.tableToggle);
        target.hidden = !target.hidden;
        b.classList.toggle('is-on', !target.hidden);
        b.textContent = target.hidden ? 'Tabel' : 'Sembunyikan tabel';
      });
    });

    /* Tracking */
    $('#btn-snapshot').addEventListener('click', takeSnapshot);
    $('#history-body').addEventListener('click', (e) => {
      const b = e.target.closest('[data-action="del-snapshot"]');
      if (!b) return;
      state.snapshots = state.snapshots.filter((s) => s.t !== b.dataset.t);
      save();
      renderAll();
      toast('Snapshot dihapus.', 'ok');
    });
    $('#btn-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rebalance-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('File JSON diunduh.', 'ok');
    });
    $('#btn-import').addEventListener('click', () => $('#import-file').click());
    $('#import-file').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (!parsed || !Array.isArray(parsed.holdings)) throw new Error('format');
          state = Object.assign(defaults(), parsed);
          save();
          boot.refresh();
          toast('Data berhasil diimpor.', 'ok');
        } catch (err) {
          toast('File itu tidak bisa dibaca sebagai data Rebalance.', 'warn');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
    $('#btn-reset').addEventListener('click', () => {
      if (!confirm('Hapus semua aset, pengaturan, dan snapshot dari browser ini?')) return;
      state = defaults();
      save();
      boot.refresh();
      toast('Semua data direset.', 'ok');
    });

    /* Add buttons anywhere (listing cards + picker rows) */
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-add]');
      if (!b) return;
      const ticker = b.dataset.add;
      if (has(ticker)) {
        const h = state.holdings.find((x) => x.ticker === ticker);
        removeHolding(h.id);
      } else {
        addHolding(ticker);
      }
      refreshAddButtons();
      renderPickerList();
    });

    /* Picker */
    $('#open-picker').addEventListener('click', openPicker);
    $('#picker-search').addEventListener('input', (e) => {
      pickerState.q = e.target.value;
      renderPickerList();
    });
    $$('#picker [data-close]').forEach((b) => b.addEventListener('click', closePicker));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#picker').hidden) closePicker();
    });
    $('#custom-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const ticker = $('#custom-ticker').value.trim().toUpperCase().replace(/\s+/g, '-');
      if (!ticker) return;
      if (assetOf(ticker).name !== ticker || ASSET_LIBRARY.some((a) => a.ticker === ticker)) {
        /* Known ticker — just add it. */
        addHolding(ticker);
      } else {
        state.custom.push({
          ticker,
          name: $('#custom-name').value.trim() || ticker,
          cls: $('#custom-class').value,
          ccy: $('#custom-ccy').value,
          color: '#898781',
          lot: 1,
          unit: 'unit',
          note: 'Aset buatan sendiri',
        });
        addHolding(ticker);
      }
      $('#custom-ticker').value = '';
      $('#custom-name').value = '';
      renderPickerList();
      refreshAddButtons();
    });

    /* Theme */
    $('#theme-toggle').addEventListener('click', () => {
      const next = document.documentElement.dataset.themeResolved === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      renderAll(true);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (currentTheme() === 'system') {
        applyTheme('system');
        renderAll(true);
      }
    });

    window.addEventListener('resize', () => window.Charts.hideTip());
  }

  /** Re-seed the inputs and redraw after a wholesale state replacement. */
  boot.refresh = function () {
    $('#new-money').value = state.newMoney ? nfInt.format(state.newMoney) : '';
    $('#usd-rate').value = nfInt.format(state.usdRate);
    $('#mode').value = state.mode;
    $('#band').value = state.band;
    $$('.segmented [data-group]').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.group === state.groupBy));
    renderAll(true);
    refreshAddButtons();
  };

  document.addEventListener('DOMContentLoaded', boot);
})();
