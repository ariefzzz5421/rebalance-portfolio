/**
 * A tiny PDF writer, built for this report and nothing else.
 *
 * No library: it emits PDF 1.4 by hand — one content stream of drawing
 * operators, the two base-14 Helvetica fonts, and a cross-reference table. The
 * donut is real vector art (circular arcs approximated by cubic béziers), so
 * the report stays sharp at any zoom and prints cleanly.
 *
 * Coordinates here are top-down (0,0 = top-left) like CSS; `flip()` converts to
 * PDF's bottom-up space at the last moment.
 */
window.buildReportPDF = (function () {
  'use strict';

  /* ── Page geometry (A4, points) ─────────────────────────────────────────── */
  const PAGE_W = 595.28, PAGE_H = 841.89;
  const M = 42;                       // page margin
  const CONTENT_W = PAGE_W - M * 2;

  /* ── Base-14 Helvetica advance widths (units/1000), chars 32–126 ────────── */
  const W_REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  const W_BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];

  /* Characters the report may carry that WinAnsi/Helvetica cannot draw well. */
  const TRANSLIT = {
    '−': '-', '–': '-', '—': '-', '→': '->', '←': '<-',
    '≈': '~', '±': '+/-', '…': '...', '“': '"', '”': '"',
    '‘': "'", '’': "'", '×': 'x', '≥': '>=', '≤': '<=',
    '·': '-', '•': '-', ' ': ' ',
  };

  function ascii(text) {
    let out = '';
    for (const ch of String(text == null ? '' : text)) {
      if (TRANSLIT[ch] !== undefined) out += TRANSLIT[ch];
      else if (ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) <= 126) out += ch;
      else if (ch.charCodeAt(0) > 126) out += '?';
    }
    return out;
  }

  function widthOf(text, size, bold) {
    const table = bold ? W_BOLD : W_REG;
    let total = 0;
    const s = ascii(text);
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      total += (c >= 32 && c <= 126) ? table[c - 32] : 556;
    }
    return (total / 1000) * size;
  }

  function esc(text) {
    return ascii(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  const n = (v) => (Math.round(v * 100) / 100).toString();

  function rgb(hex) {
    const h = String(hex || '#000').replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const int = parseInt(full.slice(0, 6), 16) || 0;
    return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
  }

  /* ── Page: a buffer of operators in top-down coordinates ────────────────── */

  function Page() {
    this.ops = [];
  }
  Page.prototype = {
    flip(y) { return PAGE_H - y; },
    op(s) { this.ops.push(s); return this; },
    fill(hex) { const [r, g, b] = rgb(hex); return this.op(`${n(r)} ${n(g)} ${n(b)} rg`); },
    stroke(hex) { const [r, g, b] = rgb(hex); return this.op(`${n(r)} ${n(g)} ${n(b)} RG`); },
    lineWidth(w) { return this.op(`${n(w)} w`); },

    rect(x, y, w, h, hex) {
      return this.fill(hex).op(`${n(x)} ${n(this.flip(y + h))} ${n(w)} ${n(h)} re f`);
    },

    roundRect(x, y, w, h, r, hex) {
      const k = r * 0.5523;
      const y0 = this.flip(y + h), y1 = this.flip(y);
      this.fill(hex);
      this.op(`${n(x + r)} ${n(y0)} m`);
      this.op(`${n(x + w - r)} ${n(y0)} l`);
      this.op(`${n(x + w - r + k)} ${n(y0)} ${n(x + w)} ${n(y0 + r - k)} ${n(x + w)} ${n(y0 + r)} c`);
      this.op(`${n(x + w)} ${n(y1 - r)} l`);
      this.op(`${n(x + w)} ${n(y1 - r + k)} ${n(x + w - r + k)} ${n(y1)} ${n(x + w - r)} ${n(y1)} c`);
      this.op(`${n(x + r)} ${n(y1)} l`);
      this.op(`${n(x + r - k)} ${n(y1)} ${n(x)} ${n(y1 - r + k)} ${n(x)} ${n(y1 - r)} c`);
      this.op(`${n(x)} ${n(y0 + r)} l`);
      this.op(`${n(x)} ${n(y0 + r - k)} ${n(x + r - k)} ${n(y0)} ${n(x + r)} ${n(y0)} c`);
      return this.op('h f');
    },

    line(x1, y1, x2, y2, hex, w) {
      return this.stroke(hex).lineWidth(w || 0.7)
        .op(`${n(x1)} ${n(this.flip(y1))} m ${n(x2)} ${n(this.flip(y2))} l S`);
    },

    /** @param align 'left' | 'right' | 'center' */
    text(str, x, y, opts) {
      const o = opts || {};
      const size = o.size || 9.5;
      const bold = !!o.bold;
      const s = esc(str);
      if (!s) return this;
      let tx = x;
      if (o.align === 'right') tx = x - widthOf(str, size, bold);
      else if (o.align === 'center') tx = x - widthOf(str, size, bold) / 2;
      this.fill(o.color || '#0b0b0b');
      return this.op(`BT /${bold ? 'F2' : 'F1'} ${n(size)} Tf ${n(tx)} ${n(this.flip(y + size * 0.78))} Td (${s}) Tj ET`);
    },

    /** Lines `str` would take at width `w` — lets callers reserve space exactly. */
    measure(str, w, opts) {
      const o = opts || {};
      const size = o.size || 8.5;
      const words = ascii(str).split(/\s+/).filter(Boolean);
      let line = '', lines = 0;
      for (const word of words) {
        const next = line ? line + ' ' + word : word;
        if (widthOf(next, size, o.bold) > w && line) { lines++; line = word; }
        else line = next;
      }
      return (line ? lines + 1 : lines) * (o.lead || size * 1.35);
    },

    /** Wrap `str` to `w` and draw it; returns the height consumed. */
    paragraph(str, x, y, w, opts) {
      const o = opts || {};
      const size = o.size || 8.5;
      const lead = o.lead || size * 1.35;
      const words = ascii(str).split(/\s+/).filter(Boolean);
      let line = '', drawn = 0;
      for (const word of words) {
        const next = line ? line + ' ' + word : word;
        if (widthOf(next, size, o.bold) > w && line) {
          this.text(line, x, y + drawn * lead, o);
          drawn++;
          line = word;
        } else line = next;
      }
      if (line) { this.text(line, x, y + drawn * lead, o); drawn++; }
      return drawn * lead;
    },

    /** Horizontal gradient, faked with thin strips — good enough at print size. */
    gradient(x, y, w, h, fromHex, toHex) {
      const a = rgb(fromHex), b = rgb(toHex);
      const steps = 64, sw = w / steps;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const c = [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * t);
        this.op(`${n(c[0])} ${n(c[1])} ${n(c[2])} rg`);
        /* Overlap by a hair so no seam shows between strips. */
        this.op(`${n(x + i * sw)} ${n(this.flip(y + h))} ${n(sw + 0.6)} ${n(h)} re f`);
      }
      return this;
    },

    /** One donut segment, drawn as arcs from `a0` to `a1` (radians, 12 o'clock = -PI/2). */
    donutSegment(cx, cy, rOut, rIn, a0, a1, hex) {
      const seg = (r, from, to, move) => {
        const parts = Math.max(1, Math.ceil(Math.abs(to - from) / (Math.PI / 2)));
        const step = (to - from) / parts;
        for (let i = 0; i < parts; i++) {
          const s = from + step * i, e = s + step;
          const k = (4 / 3) * Math.tan((e - s) / 4);
          const p0 = [cx + r * Math.cos(s), cy + r * Math.sin(s)];
          const p3 = [cx + r * Math.cos(e), cy + r * Math.sin(e)];
          const c1 = [p0[0] - k * r * Math.sin(s), p0[1] + k * r * Math.cos(s)];
          const c2 = [p3[0] + k * r * Math.sin(e), p3[1] - k * r * Math.cos(e)];
          if (i === 0 && move) this.op(`${n(p0[0])} ${n(this.flip(p0[1]))} m`);
          this.op(`${n(c1[0])} ${n(this.flip(c1[1]))} ${n(c2[0])} ${n(this.flip(c2[1]))} ${n(p3[0])} ${n(this.flip(p3[1]))} c`);
        }
      };
      this.fill(hex);
      seg(rOut, a0, a1, true);
      const inEnd = [cx + rIn * Math.cos(a1), cy + rIn * Math.sin(a1)];
      this.op(`${n(inEnd[0])} ${n(this.flip(inEnd[1]))} l`);
      seg(rIn, a1, a0, false);
      return this.op('h f');
    },

    toString() { return this.ops.join('\n'); },
  };

  /* ── Document assembly ──────────────────────────────────────────────────── */

  function serialize(pages) {
    const enc = new TextEncoder();
    const chunks = [];
    let length = 0;
    const push = (s) => {
      const bytes = typeof s === 'string' ? enc.encode(s) : s;
      chunks.push(bytes);
      length += bytes.length;
      return length;
    };

    const pageIds = pages.map((_, i) => 5 + i * 2);
    const objects = [];

    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`;
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

    pages.forEach((page, i) => {
      const id = pageIds[i];
      const streamId = id + 1;
      objects[id] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(PAGE_W)} ${n(PAGE_H)}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`;
      objects[streamId] = { stream: page.toString() };
    });

    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const offsets = [];
    for (let i = 1; i < objects.length; i++) {
      const obj = objects[i];
      if (obj === undefined) continue;
      offsets[i] = length;
      if (typeof obj === 'string') {
        push(`${i} 0 obj\n${obj}\nendobj\n`);
      } else {
        const body = obj.stream;
        push(`${i} 0 obj\n<< /Length ${enc.encode(body).length} >>\nstream\n${body}\nendstream\nendobj\n`);
      }
    }

    const xrefAt = length;
    const count = objects.length;
    let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
    for (let i = 1; i < count; i++) {
      xref += offsets[i] === undefined
        ? '0000000000 65535 f \n'
        : String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    push(xref);
    push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

    const out = new Uint8Array(length);
    let at = 0;
    for (const c of chunks) { out.set(c, at); at += c.length; }
    return new Blob([out], { type: 'application/pdf' });
  }

  /* ── The report ─────────────────────────────────────────────────────────── */

  const INK = '#14140f', INK_2 = '#55544f', MUTED = '#8b8981';
  const HAIR = '#e2e1da', TILE = '#f4f3ee', WHITE = '#ffffff';
  const ACCENT = '#2a78d6', ACCENT_2 = '#4a3aa7';

  /**
   * @param {object} data
   *   title, subtitle, generatedAt, priceSource
   *   stats     [{label, value, note}]
   *   segments  [{label, colour, value, pct, valueText}]
   *   holdings  [{ticker, name, valueText, weightText, targetText, priceText}]
   *   plan      [{ticker, action, amountText, unitsText, afterText, afterPctText}]
   *   notes     [string]
   * @returns {Blob}
   */
  return function buildReportPDF(data) {
    const pages = [];
    let page = null;
    let y = 0;

    function header(first) {
      page = new Page();
      pages.push(page);
      const h = first ? 104 : 52;
      page.gradient(0, 0, PAGE_W, h, ACCENT, ACCENT_2);
      if (first) {
        page.text(data.title || 'Rencana Rebalance', M, 30, { size: 20, bold: true, color: WHITE });
        page.text(data.subtitle || '', M, 58, { size: 10, color: '#dce9fa' });
        page.text(data.generatedAt || '', PAGE_W - M, 30, { size: 9, color: '#dce9fa', align: 'right' });
        page.text('Rebalance', PAGE_W - M, 46, { size: 12, bold: true, color: WHITE, align: 'right' });
      } else {
        page.text(data.title || 'Rencana Rebalance', M, 18, { size: 11, bold: true, color: WHITE });
        page.text(data.generatedAt || '', PAGE_W - M, 19, { size: 8.5, color: '#dce9fa', align: 'right' });
      }
      y = h + 26;
    }

    function ensure(space) {
      if (y + space > PAGE_H - 48) header(false);
    }

    function sectionTitle(label) {
      ensure(34);
      page.text(label, M, y, { size: 11.5, bold: true, color: INK });
      y += 17;
      page.line(M, y, PAGE_W - M, y, HAIR, 0.8);
      y += 12;
    }

    header(true);

    /* Stat tiles */
    const stats = data.stats || [];
    if (stats.length) {
      const gap = 10;
      const w = (CONTENT_W - gap * (stats.length - 1)) / stats.length;
      stats.forEach((s, i) => {
        const x = M + i * (w + gap);
        page.roundRect(x, y, w, 62, 8, TILE);
        page.text(s.label, x + 11, y + 11, { size: 7.5, bold: true, color: MUTED });
        page.text(s.value, x + 11, y + 24, { size: 14, bold: true, color: INK });
        if (s.note) page.text(s.note, x + 11, y + 45, { size: 7.5, color: INK_2 });
      });
      y += 62 + 26;
    }

    /* Donut + legend */
    const segs = (data.segments || []).filter((s) => s.value > 0);
    if (segs.length) {
      sectionTitle('Alokasi setelah rebalance');
      const total = segs.reduce((a, s) => a + s.value, 0);
      const cx = M + 92, cy = y + 92, rOut = 78, rIn = 48;
      const gap = 2 / ((rOut + rIn) / 2);
      let a = -Math.PI / 2;
      for (const s of segs) {
        const sweep = (s.value / total) * Math.PI * 2;
        const inset = sweep > gap * 1.6 ? gap / 2 : 0;
        page.donutSegment(cx, cy, rOut, rIn, a + inset, a + sweep - inset, s.colour);
        a += sweep;
      }
      page.text(data.donutCaption || 'Total', cx, cy - 12, { size: 7.5, bold: true, color: MUTED, align: 'center' });
      page.text(data.donutValue || '', cx, cy + 1, { size: 12.5, bold: true, color: INK, align: 'center' });

      /* Legend: swatch + name + share + amount. The chart never carries the
         numbers itself, so nothing depends on telling colours apart. */
      const lx = M + 200, lw = PAGE_W - M - lx;
      let ly = y + 14;
      for (const s of segs) {
        page.roundRect(lx, ly + 1, 9, 9, 2, s.colour);
        page.text(s.label, lx + 16, ly, { size: 9, bold: true, color: INK });
        page.text(s.pct, lx + lw * 0.62, ly, { size: 9, color: INK_2, align: 'right' });
        page.text(s.valueText, lx + lw, ly, { size: 9, color: INK, align: 'right' });
        ly += 17;
      }
      y = Math.max(cy + rOut + 22, ly + 10);
    }

    /* Generic table renderer */
    function table(title, cols, rows) {
      if (!rows.length) return;
      sectionTitle(title);
      const drawHead = () => {
        page.rect(M, y - 4, CONTENT_W, 20, TILE);
        cols.forEach((c) => {
          page.text(c.label, c.align === 'right' ? M + c.x + c.w : M + c.x, y + 2,
            { size: 7.5, bold: true, color: MUTED, align: c.align || 'left' });
        });
        y += 22;
      };
      drawHead();
      for (const row of rows) {
        ensure(24);
        if (y < 120) { sectionTitle(title + ' (lanjutan)'); drawHead(); }
        cols.forEach((c) => {
          const v = row[c.key];
          if (v == null || v === '') return;
          page.text(v, c.align === 'right' ? M + c.x + c.w : M + c.x, y,
            { size: 9, bold: !!c.bold, color: c.muted ? INK_2 : INK, align: c.align || 'left' });
        });
        y += 15;
        page.line(M, y, PAGE_W - M, y, HAIR, 0.5);
        y += 6;
      }
      y += 14;
    }

    const colW = CONTENT_W;
    table('Aset & target', [
      { key: 'ticker', label: 'Aset', x: 0, w: 90, bold: true },
      { key: 'name', label: 'Nama', x: 92, w: 150, muted: true },
      { key: 'priceText', label: 'Harga', x: 250, w: 86, align: 'right' },
      { key: 'valueText', label: 'Nilai', x: 340, w: 90, align: 'right' },
      { key: 'weightText', label: 'Bobot', x: 434, w: 38, align: 'right' },
      { key: 'targetText', label: 'Target', x: 476, w: colW - 476, align: 'right' },
    ], data.holdings || []);

    table('Rencana eksekusi', [
      { key: 'ticker', label: 'Aset', x: 0, w: 74, bold: true },
      { key: 'action', label: 'Aksi', x: 78, w: 46 },
      { key: 'amountText', label: 'Nominal', x: 126, w: 96, align: 'right' },
      { key: 'unitsText', label: 'Perkiraan unit', x: 228, w: 100, align: 'right' },
      { key: 'afterText', label: 'Nilai setelahnya', x: 334, w: 106, align: 'right' },
      { key: 'afterPctText', label: 'Bobot', x: 446, w: colW - 446, align: 'right' },
    ], data.plan || []);

    /* Footnotes */
    const notes = data.notes || [];
    if (notes.length) {
      /* Reserve per note rather than for the whole block — one long footnote
         shouldn't push the others onto a page of their own. */
      const noteOpts = { size: 7.8, color: MUTED };
      ensure(12 + page.measure(notes[0], CONTENT_W, noteOpts));
      page.line(M, y, PAGE_W - M, y, HAIR, 0.8);
      y += 10;
      for (const note of notes) {
        ensure(page.measure(note, CONTENT_W, noteOpts) + 4);
        y += page.paragraph(note, M, y, CONTENT_W, noteOpts) + 4;
      }
    }

    /* Page numbers */
    pages.forEach((p, i) => {
      p.text(`Halaman ${i + 1} dari ${pages.length}`, PAGE_W - M, PAGE_H - 30,
        { size: 7.5, color: MUTED, align: 'right' });
      p.text('Dibuat dengan Rebalance - bukan nasihat investasi', M, PAGE_H - 30,
        { size: 7.5, color: MUTED });
    });

    return serialize(pages);
  };
})();
