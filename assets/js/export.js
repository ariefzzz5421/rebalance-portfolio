/**
 * Export — draws the saved split onto a canvas, then hands it back as a JPG or
 * wraps that same image in a one-page PDF.
 *
 * Local official logo files are preferred wherever available. marks.js remains
 * the fallback for assets that do not yet have a local PNG/SVG.
 */
window.Exporter = (function () {
  'use strict';

  const W = 1080;
  const SCALE = 2;
  const PAD = 72;
  const ROW_H = 78;
  const imageCache = new Map();

  /* ── Small helpers ──────────────────────────────────────────────────────── */

  function rgb(hex) {
    const h = String(hex || '#888').replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const int = parseInt(full.slice(0, 6), 16) || 0;
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  }

  function mix(hexA, hexB, amount) {
    const a = rgb(hexA), b = rgb(hexB);
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  function roundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function logoSrcFor(row) {
    if (!row || row.rest) return null;
    if (row.logoSrc) return row.logoSrc;
    const files = window.LOGO_FILES || {};
    return files[row.label] || null;
  }

  function loadLogo(src) {
    if (!src) return Promise.resolve(null);
    if (imageCache.has(src)) return imageCache.get(src);

    const promise = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn('Logo gagal dimuat untuk export:', src);
        resolve(null);
      };
      img.src = src;
    });

    imageCache.set(src, promise);
    return promise;
  }

  /** Keep the official logo's original colours; add only a dual halo for contrast. */
  function drawContainedImage(ctx, img, x, y, width, height) {
    if (!img) return;

    const iw = img.naturalWidth || img.width || width;
    const ih = img.naturalHeight || img.height || height;
    const scale = Math.min(width / iw, height / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = x + (width - dw) / 2;
    const dy = y + (height - dh) / 2;

    ctx.save();
    ctx.filter =
      'drop-shadow(0 0 2px rgba(255,255,255,.82)) ' +
      'drop-shadow(0 2px 3px rgba(0,0,0,.68))';
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  /** Paint a marks.js vector mark at (x, y) scaled to size. */
  function drawMark(ctx, mark, x, y, size, color) {
    if (!mark) return;
    const vb = mark.vb || 24;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / vb, size / vb);

    for (const part of mark.poly || []) {
      ctx.fillStyle = color || part.fill;
      ctx.fill(new Path2D(part.d));
    }

    ctx.fillStyle = color || mark.hex;
    ctx.strokeStyle = color || mark.hex;
    for (const d of mark.d || []) {
      ctx.fill(new Path2D(d), mark.rule === 'evenodd' ? 'evenodd' : 'nonzero');
    }

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const d of mark.sd || []) ctx.stroke(new Path2D(d));
    ctx.restore();
  }

  /** Draw an official local logo, fallback mark, or monogram inside a tile. */
  function drawTile(ctx, spec, x, y, size) {
    const { mark, logoImage, color, ticker, surface, rest } = spec;
    const brand = color || (mark && mark.hex) || '#8b8981';

    ctx.save();
    roundRect(ctx, x, y, size, size, size * 0.28);
    ctx.fillStyle = mix(surface, brand, 0.18);
    ctx.fill();

    if (logoImage) {
      const inner = size * 0.70;
      drawContainedImage(
        ctx,
        logoImage,
        x + (size - inner) / 2,
        y + (size - inner) / 2,
        inner,
        inner
      );
    } else if (mark) {
      const inner = size * 0.58;
      drawMark(
        ctx,
        mark,
        x + (size - inner) / 2,
        y + (size - inner) / 2,
        inner,
        mark.poly ? null : brand
      );
    } else if (!rest) {
      ctx.fillStyle = brand;
      ctx.font = `700 ${Math.round(size * 0.4)}px "Bricolage Grotesque", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        String(ticker || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase(),
        x + size / 2,
        y + size / 2 + 1
      );
    }

    ctx.restore();
  }

  /* ── The card ───────────────────────────────────────────────────────────── */

  async function renderCard(data) {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch { /* use system font */ }
    }

    const t = data.theme;
    const rows = data.slices;

    await Promise.all(rows.map(async (row) => {
      row.logoSrc = logoSrcFor(row);
      row.logoImage = row.logoSrc ? await loadLogo(row.logoSrc) : null;
    }));

    const pieBox = 460;
    const headH = 300;
    const listH = rows.length * ROW_H;
    const H = headH + pieBox + 56 + listH + 128;

    const canvas = document.createElement('canvas');
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);

    const font = (weight, size) =>
      `${weight} ${size}px "Bricolage Grotesque", system-ui, -apple-system, sans-serif`;

    /* Ground */
    ctx.fillStyle = t.surface;
    ctx.fillRect(0, 0, W, H);

    /* Header */
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = t.ink;
    ctx.font = font(800, 40);
    ctx.fillText(data.title, PAD, PAD + 34);
    ctx.fillStyle = t.muted;
    ctx.font = font(500, 22);
    ctx.textAlign = 'right';
    ctx.fillText(data.generatedAt, W - PAD, PAD + 32);
    ctx.textAlign = 'left';

    /* Total */
    ctx.fillStyle = t.muted;
    ctx.font = font(650, 20);
    ctx.fillText(data.totalLabel.toUpperCase(), PAD, PAD + 108);
    ctx.fillStyle = t.ink;
    ctx.font = font(800, 76);
    ctx.fillText(data.totalText, PAD, PAD + 182);

    /* Divider */
    ctx.strokeStyle = t.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, headH - 30);
    ctx.lineTo(W - PAD, headH - 30);
    ctx.stroke();

    /* Pie */
    const cx = W / 2;
    const cy = headH + pieBox / 2;
    const r = pieBox / 2 - 22;
    const sum = rows.reduce((s, d) => s + d.pct, 0) || 1;
    const gap = 2 / r;
    let a = -Math.PI / 2;

    for (const d of rows) {
      const sweep = (d.pct / sum) * Math.PI * 2;
      const inset = sweep > gap * 2 ? gap / 2 : 0;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a + inset, a + sweep - inset);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();

      const share = d.pct / sum;
      const withIcon = share >= 0.13 && !!(d.logoImage || d.mark);
      const mid = a + sweep / 2;
      const reach = withIcon ? 0.55 : 0.62;
      const px = cx + Math.cos(mid) * r * reach;
      const py = cy + Math.sin(mid) * r * reach;

      if (withIcon) {
        if (d.logoImage) {
          drawContainedImage(ctx, d.logoImage, px - 19, py - 34, 38, 38);
        } else if (d.mark) {
          drawMark(ctx, d.mark, px - 19, py - 34, 38, d.ink);
        }
      }

      if (share >= 0.09) {
        ctx.fillStyle = d.ink;
        ctx.font = font(700, 26);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.pieText || d.pctText, px, withIcon ? py + 16 : py);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }

      a += sweep;
    }

    /* Legend rows */
    let y = headH + pieBox + 40;
    for (const d of rows) {
      drawTile(
        ctx,
        {
          mark: d.mark,
          logoImage: d.logoImage,
          color: d.brand,
          ticker: d.label,
          surface: t.surface,
          rest: d.rest,
        },
        PAD,
        y + 8,
        52
      );

      ctx.fillStyle = t.ink;
      ctx.font = font(700, 27);
      ctx.fillText(d.label, PAD + 72, y + 32);

      if (d.sub) {
        ctx.fillStyle = t.muted;
        ctx.font = font(500, 20);
        ctx.fillText(d.sub, PAD + 72, y + 58);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = t.ink;
      ctx.font = font(700, 27);
      ctx.fillText(d.amountText, W - PAD, y + 32);
      ctx.fillStyle = t.muted;
      ctx.font = font(600, 20);
      ctx.fillText(d.pctText, W - PAD, y + 58);
      ctx.textAlign = 'left';

      ctx.strokeStyle = t.line;
      ctx.beginPath();
      ctx.moveTo(PAD, y + ROW_H - 6);
      ctx.lineTo(W - PAD, y + ROW_H - 6);
      ctx.stroke();
      y += ROW_H;
    }

    /* Footer */
    ctx.fillStyle = t.muted;
    ctx.font = font(500, 20);
    ctx.fillText(data.footer, PAD, H - PAD + 18);

    return canvas;
  }

  /* ── Output ─────────────────────────────────────────────────────────────── */

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('canvas kosong'))),
        type,
        quality
      );
    });
  }

  /** Wrap a JPEG in the smallest PDF that can show it. */
  function jpegToPDF(bytes, pxW, pxH) {
    const pageW = 595.28;
    const pageH = Math.round((pageW * pxH) / pxW * 100) / 100;
    const enc = new TextEncoder();
    const chunks = [];
    let length = 0;

    const push = (part) => {
      const b = typeof part === 'string' ? enc.encode(part) : part;
      chunks.push(b);
      length += b.length;
      return length;
    };

    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Count 1 /Kids [3 0 R] >>',
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] ` +
        `/Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
      { stream: `q ${pageW} 0 0 ${pageH} 0 0 cm /Im0 Do Q` },
      {
        dict: `<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} ` +
          `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>`,
        bytes,
      },
    ];

    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    const offsets = [];

    objects.forEach((obj, i) => {
      const id = i + 1;
      offsets[id] = length;

      if (typeof obj === 'string') {
        push(`${id} 0 obj\n${obj}\nendobj\n`);
      } else if (obj.stream !== undefined) {
        push(`${id} 0 obj\n<< /Length ${enc.encode(obj.stream).length} >>\nstream\n${obj.stream}\nendstream\nendobj\n`);
      } else {
        push(`${id} 0 obj\n${obj.dict}\nstream\n`);
        push(obj.bytes);
        push('\nendstream\nendobj\n');
      }
    });

    const xrefAt = length;
    const count = objects.length + 1;
    let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
    for (let i = 1; i < count; i++) {
      xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }

    push(xref);
    push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

    const out = new Uint8Array(length);
    let at = 0;
    for (const c of chunks) {
      out.set(c, at);
      at += c.length;
    }

    return new Blob([out], { type: 'application/pdf' });
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /** @param format 'jpg' | 'pdf' */
  async function save(data, format) {
    const canvas = await renderCard(data);
    const jpeg = await canvasToBlob(canvas, 'image/jpeg', 0.93);
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === 'jpg') {
      download(jpeg, `porsi-${stamp}.jpg`);
      return;
    }

    const bytes = new Uint8Array(await jpeg.arrayBuffer());
    download(jpegToPDF(bytes, canvas.width, canvas.height), `porsi-${stamp}.pdf`);
  }

  return { save, renderCard };
})();