// postcard.js — grades, panel layouts and the renderer that draws a complete
// Leonida postcard: perforated edge, photo grid, stamp, postmark and caption
// bar. The same drawPostcard() paints the on-screen preview and every export,
// so what a person sees is exactly the PNG they download.

import { paintScene } from './scenes.js';

export const GRADES = [
  {
    id: 'bronze', name: 'Bronze', tint: '#b0793f', deep: '#5e3c1c',
    paper: '#f7ecd4', flavour: 'Sun-bleached and still standing.', glyph: 'sun',
  },
  {
    id: 'silver', name: 'Silver', tint: '#9aa7b1', deep: '#46525c',
    paper: '#f4f1e8', flavour: 'Chrome reflections on warm water.', glyph: 'wave',
  },
  {
    id: 'gold', name: 'Gold', tint: '#d9a441', deep: '#7a5514',
    paper: '#f9efd2', flavour: 'Golden hour, golden state of mind.', glyph: 'star',
  },
  {
    id: 'platinum', name: 'Platinum', tint: '#63c7b2', deep: '#1f5c50',
    paper: '#eef7ef', flavour: 'Cool metal, hot pavement.', glyph: 'gem',
  },
  {
    id: 'legend', name: 'Leonida Legend', tint: '#7a4fd0', deep: '#3c2064',
    paper: '#f6eefc', flavour: 'Posted from the edge of the map.', glyph: 'crown',
  },
];

export const TREATMENTS = [
  { id: 'classic', name: 'Classic' },
  { id: 'neon', name: 'Neon' },
  { id: 'newsprint', name: 'Newsprint' },
];

// A layout is a list of panel cells on a cols x rows grid; the first cell is
// the hero. Rects come back in grid-area pixels.
function cellsToRects(cells, cols, rows, area) {
  const cw = area.w / cols;
  const ch = area.h / rows;
  return cells.map(([cx, cy, cs, rs]) => ({
    x: area.x + cx * cw,
    y: area.y + cy * ch,
    w: cs * cw,
    h: rs * ch,
  }));
}

export const LAYOUTS = [
  {
    id: 'hero-left', name: 'Hero Left',
    build(area) {
      return cellsToRects([
        [0, 0, 2, 2], [2, 0, 1, 1], [2, 1, 1, 1],
        [0, 2, 1, 1], [1, 2, 1, 1], [2, 2, 1, 1],
      ], 3, 3, area);
    },
  },
  {
    id: 'hero-top', name: 'Hero Top',
    build(area) {
      return cellsToRects([
        [0, 0, 3, 1], [0, 1, 1, 1], [1, 1, 1, 1], [2, 1, 1, 1],
        [0, 2, 1, 1], [1, 2, 1, 1], [2, 2, 1, 1],
      ], 3, 3, area);
    },
  },
  {
    id: 'twin-strip', name: 'Twin Strip',
    build(area) {
      return cellsToRects([
        [0, 0, 1, 1], [1, 0, 1, 1], [0, 1, 1, 1],
        [1, 1, 1, 1], [0, 2, 1, 1], [1, 2, 1, 1],
      ], 2, 3, area);
    },
  },
  {
    id: 'quad', name: 'Quad',
    build(area) {
      return cellsToRects([
        [0, 0, 1, 1], [1, 0, 1, 1], [0, 1, 1, 1], [1, 1, 1, 1],
      ], 2, 2, area);
    },
  },
  {
    id: 'six-up', name: 'Six-Up',
    build(area) {
      return cellsToRects([
        [0, 0, 1, 1], [1, 0, 1, 1], [2, 0, 1, 1],
        [0, 1, 1, 1], [1, 1, 1, 1], [2, 1, 1, 1],
      ], 3, 2, area);
    },
  },
  {
    id: 'classic-cover', name: 'Classic Cover',
    build(area) {
      const hero = { x: area.x, y: area.y, w: area.w, h: area.h };
      const insetW = area.w * 0.26;
      const insetH = area.h * 0.3;
      const insetY = area.y + area.h - insetH - area.h * 0.03;
      return [
        hero,
        { x: area.x + area.w * 0.03, y: insetY, w: insetW, h: insetH },
        { x: area.x + area.w * 0.03 + insetW + area.w * 0.015, y: insetY, w: insetW, h: insetH },
      ];
    },
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[2];
}

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

// Draw one panel's content (a photo or a painted scene) cover-cropped into a
// rect, honouring the panel's zoom and drag offset.
export function drawPanelContent(ctx, item, rect) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (item.type === 'scene') {
    paintScene(ctx, item.scene, rect.x, rect.y, rect.w, rect.h);
  } else if (item.type === 'photo' && item.source) {
    const src = item.source;
    const iw = src.naturalWidth || src.width;
    const ih = src.naturalHeight || src.height;
    if (iw > 0 && ih > 0) {
      const zoom = item.zoom ?? 1;
      const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
      const dw = iw * scale;
      const dh = ih * scale;
      const roomX = Math.max(0, (dw - rect.w) / 2);
      const roomY = Math.max(0, (dh - rect.h) / 2);
      const dx = rect.x + (rect.w - dw) / 2 + (item.ox ?? 0) * roomX;
      const dy = rect.y + (rect.h - dh) / 2 + (item.oy ?? 0) * roomY;
      ctx.drawImage(src, dx, dy, dw, dh);
    }
  }
  ctx.restore();
}

// Render a panel's content to an offscreen canvas so the hero can break its
// frame: the pop-out copy is drawn larger than the panel, over the gutter.
function renderPanelTile(item, w, h) {
  const tile = document.createElement('canvas');
  tile.width = Math.max(2, Math.round(w));
  tile.height = Math.max(2, Math.round(h));
  const tctx = tile.getContext('2d');
  drawPanelContent(tctx, item, { x: 0, y: 0, w: tile.width, h: tile.height });
  return tile;
}

function drawStampGlyph(ctx, glyph, cx, cy, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.4, r * 0.14);
  ctx.lineCap = 'round';
  if (glyph === 'sun') {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62);
      ctx.lineTo(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92);
      ctx.stroke();
    }
  } else if (glyph === 'wave') {
    for (const off of [-0.35, 0, 0.35]) {
      ctx.beginPath();
      for (let px = -1; px <= 1; px += 0.1) {
        const py = Math.sin(px * Math.PI) * 0.28 + off;
        const X = cx + px * r * 0.85;
        const Y = cy + py * r * 0.8;
        if (px === -1) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
    }
  } else if (glyph === 'star') {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const rad = i % 2 === 0 ? r * 0.95 : r * 0.42;
      const X = cx + Math.cos(a) * rad;
      const Y = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.closePath();
    ctx.fill();
  } else if (glyph === 'gem') {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.85, cy - r * 0.3);
    ctx.lineTo(cx + r * 0.85, cy - r * 0.3);
    ctx.lineTo(cx, cy + r * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.85, cy - r * 0.3);
    ctx.lineTo(cx - r * 0.3, cy - r * 0.85);
    ctx.lineTo(cx + r * 0.3, cy - r * 0.85);
    ctx.lineTo(cx + r * 0.85, cy - r * 0.3);
    ctx.stroke();
  } else {
    // crown
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.9, cy + r * 0.55);
    ctx.lineTo(cx - r * 0.9, cy - r * 0.35);
    ctx.lineTo(cx - r * 0.45, cy + r * 0.05);
    ctx.lineTo(cx, cy - r * 0.6);
    ctx.lineTo(cx + r * 0.45, cy + r * 0.05);
    ctx.lineTo(cx + r * 0.9, cy - r * 0.35);
    ctx.lineTo(cx + r * 0.9, cy + r * 0.55);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawStamp(ctx, grade, x, y, w, h) {
  ctx.save();
  // Perforated stamp edge: paper-coloured dots punched around a tinted card.
  ctx.fillStyle = grade.tint;
  roundRect(ctx, x, y, w, h, Math.min(w, h) * 0.06);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 251, 240, 0.92)';
  const step = Math.min(w, h) * 0.16;
  const dotR = step * 0.3;
  for (let px = x + step * 0.5; px < x + w; px += step) {
    ctx.beginPath(); ctx.arc(px, y + dotR * 0.7, dotR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px, y + h - dotR * 0.7, dotR, 0, Math.PI * 2); ctx.fill();
  }
  for (let py = y + step * 0.5; py < y + h; py += step) {
    ctx.beginPath(); ctx.arc(x + dotR * 0.7, py, dotR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w - dotR * 0.7, py, dotR, 0, Math.PI * 2); ctx.fill();
  }
  const inner = { x: x + w * 0.1, y: y + h * 0.09, w: w * 0.8, h: h * 0.82 };
  ctx.fillStyle = grade.paper;
  roundRect(ctx, inner.x, inner.y, inner.w, inner.h, Math.min(w, h) * 0.04);
  ctx.fill();
  drawStampGlyph(ctx, grade.glyph, inner.x + inner.w / 2, inner.y + inner.h * 0.36, Math.min(inner.w, inner.h) * 0.26, grade.deep);
  ctx.fillStyle = grade.deep;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const nameSize = fitFontSize(ctx, grade.name.toUpperCase(), inner.w * 0.92, inner.h * 0.16, 'Anton');
  ctx.font = `${nameSize}px Anton, 'Arial Narrow', sans-serif`;
  ctx.fillText(grade.name.toUpperCase(), inner.x + inner.w / 2, inner.y + inner.h * 0.68);
  ctx.font = `${Math.round(inner.h * 0.1)}px 'Courier New', monospace`;
  ctx.fillText('LEONIDA · 26', inner.x + inner.w / 2, inner.y + inner.h * 0.85);
  ctx.restore();
}

function drawPostmark(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.21);
  ctx.strokeStyle = 'rgba(35, 45, 85, 0.72)';
  ctx.fillStyle = 'rgba(35, 45, 85, 0.72)';
  ctx.lineWidth = Math.max(1.4, r * 0.045);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, r * 0.028);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(r * 0.34)}px Anton, 'Arial Narrow', sans-serif`;
  ctx.fillText('LEONIDA', 0, -r * 0.3);
  ctx.font = `${Math.round(r * 0.27)}px Anton, 'Arial Narrow', sans-serif`;
  ctx.fillText('MAY 26 2026', 0, r * 0.08);
  ctx.font = `${Math.round(r * 0.2)}px 'Courier New', monospace`;
  ctx.fillText('FIRST DAY', 0, r * 0.42);
  ctx.restore();
  // Wavy cancellation lines running right, across the stamp's corner.
  ctx.save();
  ctx.strokeStyle = 'rgba(35, 45, 85, 0.6)';
  ctx.lineWidth = Math.max(1.4, r * 0.05);
  ctx.lineCap = 'round';
  for (let line = 0; line < 3; line++) {
    const baseY = cy - r * 0.45 + line * r * 0.42;
    ctx.beginPath();
    for (let px = 0; px <= r * 2.5; px += 4) {
      const py = baseY + Math.sin(px / (r * 0.28)) * r * 0.09;
      if (px === 0) ctx.moveTo(cx + px, py); else ctx.lineTo(cx + px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function fitFontSize(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}, 'Arial Narrow', sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 8) {
    size *= 0.92;
    ctx.font = `${size}px ${family}, 'Arial Narrow', sans-serif`;
  }
  return size;
}

// Shrink a styled font (given as a builder from pixel size to font string)
// until its text fits maxWidth, and leave ctx.font set at the fitted size.
// The caption bar caps left-hand text at 58% of the bar and right-hand text
// at 38%, so the two columns can never collide at any export size.
function fitStyled(ctx, text, maxWidth, startSize, build) {
  let size = startSize;
  ctx.font = build(size);
  while (ctx.measureText(text).width > maxWidth && size > 7) {
    size *= 0.92;
    ctx.font = build(size);
  }
  return size;
}

function drawCaptionBar(ctx, state, grade, bar) {
  const { title, subtitle, treatment } = state;
  const pad = bar.w * 0.035;
  const leftMax = bar.w * 0.56;
  const rightMax = bar.w * 0.36;
  ctx.save();
  ctx.textBaseline = 'middle';
  if (treatment === 'neon') {
    ctx.fillStyle = '#0b0714';
    ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    ctx.fillStyle = '#ff5da2';
    ctx.fillRect(bar.x, bar.y, bar.w, Math.max(2, bar.h * 0.03));
    ctx.textAlign = 'left';
    ctx.save();
    ctx.shadowColor = '#ff5da2';
    ctx.shadowBlur = bar.h * 0.16;
    ctx.fillStyle = '#ffd7ec';
    const ts = fitFontSize(ctx, title, leftMax, bar.h * 0.52, 'Anton');
    ctx.font = `${ts}px Anton, 'Arial Narrow', sans-serif`;
    ctx.fillText(title, bar.x + pad, bar.y + bar.h * 0.4);
    ctx.restore();
    ctx.fillStyle = '#7df9ff';
    fitStyled(ctx, subtitle, leftMax, bar.h * 0.3, (s) => `${s}px Pacifico, cursive`);
    ctx.fillText(subtitle, bar.x + pad + 2, bar.y + bar.h * 0.78);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(230, 240, 255, 0.75)';
    fitStyled(ctx, grade.flavour, rightMax, bar.h * 0.16, (s) => `${s}px 'Courier New', monospace`);
    ctx.fillText(grade.flavour, bar.x + bar.w - pad, bar.y + bar.h * 0.74);
  } else if (treatment === 'newsprint') {
    ctx.fillStyle = '#f3ead6';
    ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    ctx.fillStyle = '#191919';
    ctx.fillRect(bar.x, bar.y, bar.w, Math.max(2, bar.h * 0.045));
    // Halftone dot row.
    ctx.fillStyle = 'rgba(25, 25, 25, 0.5)';
    const dr = Math.max(1.2, bar.h * 0.02);
    for (let px = bar.x + pad; px < bar.x + bar.w - pad; px += dr * 4.4) {
      ctx.beginPath();
      ctx.arc(px, bar.y + bar.h * 0.14, dr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#141414';
    ctx.textAlign = 'left';
    const ts = fitFontSize(ctx, title, leftMax, bar.h * 0.5, 'Anton');
    ctx.font = `${ts}px Anton, 'Arial Narrow', sans-serif`;
    ctx.fillText(title, bar.x + pad, bar.y + bar.h * 0.52);
    ctx.fillRect(bar.x + pad, bar.y + bar.h * 0.74, ctx.measureText(title).width, Math.max(2, bar.h * 0.03));
    fitStyled(ctx, subtitle.toUpperCase(), leftMax, bar.h * 0.19, (s) => `${s}px 'Courier New', monospace`);
    ctx.fillText(subtitle.toUpperCase(), bar.x + pad, bar.y + bar.h * 0.89);
    ctx.textAlign = 'right';
    fitStyled(ctx, grade.flavour, rightMax, bar.h * 0.17, (s) => `italic ${s}px Georgia, serif`);
    ctx.fillText(grade.flavour, bar.x + bar.w - pad, bar.y + bar.h * 0.4);
  } else {
    // Classic: deep grade-coloured bar, cream Anton title.
    ctx.fillStyle = grade.deep;
    ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    ctx.fillStyle = grade.tint;
    ctx.fillRect(bar.x, bar.y, bar.w, Math.max(2, bar.h * 0.035));
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fdf6e0';
    const ts = fitFontSize(ctx, title, leftMax, bar.h * 0.54, 'Anton');
    ctx.font = `${ts}px Anton, 'Arial Narrow', sans-serif`;
    ctx.fillText(title, bar.x + pad, bar.y + bar.h * 0.42);
    ctx.fillStyle = 'rgba(253, 246, 224, 0.85)';
    fitStyled(ctx, subtitle, leftMax, bar.h * 0.21, (s) => `italic ${s}px Georgia, serif`);
    ctx.fillText(subtitle, bar.x + pad, bar.y + bar.h * 0.78);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(253, 246, 224, 0.7)';
    fitStyled(ctx, 'VIA AIR MAIL · LEONIDA', rightMax, bar.h * 0.16, (s) => `${s}px 'Courier New', monospace`);
    ctx.fillText('VIA AIR MAIL · LEONIDA', bar.x + bar.w - pad, bar.y + bar.h * 0.3);
    fitStyled(ctx, grade.flavour, rightMax, bar.h * 0.16, (s) => `${s}px 'Courier New', monospace`);
    ctx.fillText(grade.flavour, bar.x + bar.w - pad, bar.y + bar.h * 0.74);
  }
  ctx.restore();
}

// Draw the whole postcard into ctx at pixel size W x H.
// state: { layout, grade, treatment, title, subtitle, popout, panels: [...] }
export function drawPostcard(ctx, W, H, state) {
  const grade = gradeById(state.grade);
  const layout = layoutById(state.layout);
  ctx.save();
  // Paper body and grade-tinted frame band.
  ctx.fillStyle = grade.paper;
  ctx.fillRect(0, 0, W, H);
  const band = Math.round(Math.min(W, H) * 0.022);
  ctx.strokeStyle = grade.tint;
  ctx.lineWidth = band;
  ctx.strokeRect(band / 2, band / 2, W - band, H - band);

  const perfW = W * 0.045;
  const captionH = H * 0.17;
  const gridArea = {
    x: perfW + W * 0.018,
    y: H * 0.035,
    w: W - perfW - W * 0.036,
    h: H - captionH - H * 0.06,
  };

  // Perforated left edge: punched holes down a tinted strip + tear line.
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, perfW * 0.62, H - captionH);
  ctx.fillStyle = grade.paper;
  const holeR = perfW * 0.16;
  for (let py = holeR * 1.6; py < H - captionH; py += holeR * 3.1) {
    ctx.beginPath();
    ctx.arc(perfW * 0.31, py, holeR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(60, 45, 25, 0.45)';
  ctx.lineWidth = Math.max(1, W * 0.0012);
  ctx.setLineDash([H * 0.008, H * 0.006]);
  ctx.beginPath();
  ctx.moveTo(perfW * 0.82, H * 0.02);
  ctx.lineTo(perfW * 0.82, H - captionH - H * 0.015);
  ctx.stroke();
  ctx.setLineDash([]);

  // Panels with cream gutters and ink borders.
  const rects = layout.build(gridArea);
  const gutter = Math.max(4, Math.min(W, H) * 0.008);
  const ink = '#20180f';
  const panelRects = rects.map((r) => ({
    x: r.x + gutter / 2, y: r.y + gutter / 2, w: r.w - gutter, h: r.h - gutter,
  }));
  panelRects.forEach((rect, i) => {
    const item = state.panels[i] ?? state.panels[state.panels.length - 1];
    if (item) drawPanelContent(ctx, item, rect);
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.0035);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Pop-out hero: the hero image redrawn larger, breaking the top frame.
  // Skipped when the hero already fills the whole grid (Classic Cover) —
  // there is no frame left to break, and the enlarged copy would bury the
  // inset panels.
  const heroIsFullBleed = panelRects.length > 0 &&
    panelRects[0].w >= gridArea.w * 0.95 && panelRects[0].h >= gridArea.h * 0.95;
  if (state.popout && !heroIsFullBleed && panelRects.length > 0 && state.panels[0]) {
    const hero = panelRects[0];
    const grow = 1.13;
    const tw = hero.w * grow;
    const th = hero.h * grow;
    const tx = hero.x + (hero.w - tw) / 2;
    const ty = hero.y + (hero.h - th) - hero.h * 0.02;
    const tile = renderPanelTile(state.panels[0], tw, th);
    ctx.save();
    ctx.shadowColor = 'rgba(15, 8, 4, 0.55)';
    ctx.shadowBlur = Math.min(W, H) * 0.03;
    ctx.shadowOffsetY = Math.min(W, H) * 0.012;
    ctx.drawImage(tile, tx, ty, tw, th);
    ctx.restore();
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.0035);
    ctx.strokeRect(tx, ty, tw, th);
  }

  // Caption bar.
  const bar = { x: 0, y: H - captionH, w: W, h: captionH };
  drawCaptionBar(ctx, state, grade, bar);

  // Stamp and postmark over the grid's top-right corner.
  const stampW = W * 0.115;
  const stampH = stampW * 1.22;
  const stampX = W - stampW - W * 0.028;
  const stampY = H * 0.028;
  drawStamp(ctx, grade, stampX, stampY, stampW, stampH);
  const pmR = stampW * 0.52;
  drawPostmark(ctx, stampX - pmR * 0.25, stampY + stampH * 0.72, pmR);

  ctx.restore();
  return panelRects;
}
