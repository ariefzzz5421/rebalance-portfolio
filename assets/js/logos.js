/**
 * Logo rendering.
 *
 * Three tiers, in order:
 *   1. a real brand mark from `brandmarks.js` (simple-icons, CC0)
 *   2. a hand-drawn glyph from `CUSTOM_MARKS` for things that have no brand
 *      logo — an index, physical gold, a token not covered by simple-icons
 *   3. a monogram tile built from the first two characters of the ticker
 *
 * Every tier renders into the same tile, so a list mixing all three still reads
 * as one set. `--brand` drives the tile wash and the glyph ink; the stylesheet
 * clamps its lightness per theme so a near-black or near-white brand colour
 * stays legible on both surfaces.
 */

/* Glyphs drawn for this project. `d` paths are filled, `sd` paths are stroked. */
window.CUSTOM_MARKS = {
  /* S&P 500 — a rising line with an arrow head. */
  SPX: {
    hex: '#2a78d6',
    sd: ['M2.6 16.9 8.7 10.7l3.8 3.6 9-8.9', 'M15.9 5.4h5.6v5.6'],
  },
  /* Physical gold — a stack of three ingots. */
  GOLD: {
    hex: '#eda100',
    d: [
      'M9.4 5.6h5.2l1.4 4.4H8L9.4 5.6Z',
      'M4.4 12.4h5.2L11 16.8H3L4.4 12.4Z',
      'M14.4 12.4h5.2L21 16.8h-8L14.4 12.4Z',
    ],
  },
  /* Hyperliquid — a hexagon holding a bolt. */
  HYPE: {
    hex: '#12a48a',
    sd: ['M12 2.9 20 7.5v9l-8 4.6-8-4.6v-9L12 2.9Z'],
    d: ['M13.3 6.9 8.9 13.6h2.9L10.7 18l4.5-6.9h-3l1.1-4.2Z'],
  },
};

/** The mark for a ticker, or null if it has neither a brand nor a custom glyph. */
window.getMark = function (ticker) {
  return (window.CUSTOM_MARKS && window.CUSTOM_MARKS[ticker]) ||
    (window.BRAND_MARKS && window.BRAND_MARKS[ticker]) || null;
};

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Build a logo tile element.
 * @param {object} asset  entry from ASSET_LIBRARY (needs ticker, color)
 * @param {string} size   'sm' | 'md' | 'lg'
 */
window.logoEl = function (asset, size) {
  const tile = document.createElement('span');
  tile.className = 'logo logo--' + (size || 'md');
  const mark = window.getMark(asset.ticker);
  tile.style.setProperty('--brand', (mark && mark.hex) || asset.color || '#898781');

  if (mark) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    for (const d of mark.d || []) {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'currentColor');
      svg.appendChild(p);
    }
    for (const d of mark.sd || []) {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', 'currentColor');
      p.setAttribute('stroke-width', '2');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(p);
    }
    tile.appendChild(svg);
  } else {
    const mono = document.createElement('span');
    mono.className = 'logo__mono';
    /* Ticker text is data — never innerHTML. */
    mono.textContent = String(asset.ticker || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
    tile.appendChild(mono);
  }
  return tile;
};
