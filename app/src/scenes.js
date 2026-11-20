// scenes.js — the four built-in Leonida demo scenes.
//
// Each painter draws one postcard panel's worth of scenery directly into a
// rectangle of a 2D context: a sunset bay, a palm strip, a neon harbour and a
// causeway at dusk. Everything is painted in code — gradients, silhouettes and
// light streaks — so the app ships no scene imagery at all and the demo grid
// looks finished the moment the page opens. Painters are pure functions of
// (ctx, x, y, w, h): same rectangle in, same picture out.

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixColor(c1, c2, t) {
  const r = Math.round(lerp(c1[0], c2[0], t));
  const g = Math.round(lerp(c1[1], c2[1], t));
  const b = Math.round(lerp(c1[2], c2[2], t));
  return `rgb(${r}, ${g}, ${b})`;
}

function skyGradient(ctx, x, y, w, h, stops) {
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  for (const [at, color] of stops) grad.addColorStop(at, color);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  return grad;
}

// A tiny deterministic scatter (fixed seed per scene) for stars and grain, so
// a scene never changes between renders or exports.
function scatter(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function drawSun(ctx, cx, cy, r, core, glow) {
  const halo = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 3.1);
  halo.addColorStop(0, glow);
  halo.addColorStop(1, 'rgba(255, 160, 60, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(cx - r * 3.1, cy - r * 3.1, r * 6.2, r * 6.2);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = core;
  ctx.fill();
}

function drawPalm(ctx, baseX, baseY, height, lean, color) {
  const topX = baseX + lean * height;
  const topY = baseY - height;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, height * 0.045);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(baseX + lean * height * 0.3, baseY - height * 0.6, topX, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.4, height * 0.028);
  for (let i = 0; i < 7; i++) {
    const angle = Math.PI * (0.08 + (i / 6) * 0.84) + Math.PI;
    const len = height * (0.34 + (i % 3) * 0.05);
    const ex = topX + Math.cos(angle) * len;
    const ey = topY + Math.sin(angle) * len * 0.42 + len * 0.16;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(angle) * len * 0.6, topY + Math.sin(angle) * len * 0.3 - len * 0.1, ex, ey);
    ctx.stroke();
  }
}

function drawBirds(ctx, x, y, w, count, color, seed) {
  const rnd = scatter(seed);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, w * 0.004);
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const bx = x + rnd() * w;
    const by = y + rnd() * w * 0.16;
    const s = w * (0.012 + rnd() * 0.012);
    ctx.beginPath();
    ctx.moveTo(bx - s, by);
    ctx.quadraticCurveTo(bx - s * 0.4, by - s * 0.7, bx, by);
    ctx.quadraticCurveTo(bx + s * 0.4, by - s * 0.7, bx + s, by);
    ctx.stroke();
  }
}

function waterStreaks(ctx, x, y, w, h, color, seed, rows = 26) {
  const rnd = scatter(seed);
  ctx.fillStyle = color;
  for (let i = 0; i < rows; i++) {
    const t = i / rows;
    const sy = y + t * h;
    const len = w * (0.05 + rnd() * 0.3) * (0.4 + t);
    const sx = x + rnd() * (w - len);
    ctx.globalAlpha = 0.05 + rnd() * 0.16;
    ctx.fillRect(sx, sy, len, Math.max(1, h * 0.012));
  }
  ctx.globalAlpha = 1;
}

export function paintSunsetBay(ctx, x, y, w, h) {
  skyGradient(ctx, x, y, w, h, [
    [0, '#2e1a47'],
    [0.34, '#8e2f63'],
    [0.58, '#e85d75'],
    [0.74, '#ffb35c'],
    [1, '#ffd98a'],
  ]);
  const horizon = y + h * 0.62;
  drawSun(ctx, x + w * 0.62, horizon - h * 0.03, h * 0.115, '#fff3b0', 'rgba(255, 170, 70, 0.55)');
  // Distant headland on the left.
  ctx.fillStyle = '#3a2140';
  ctx.beginPath();
  ctx.moveTo(x, horizon);
  ctx.quadraticCurveTo(x + w * 0.2, horizon - h * 0.16, x + w * 0.44, horizon - h * 0.05);
  ctx.lineTo(x + w * 0.5, horizon);
  ctx.closePath();
  ctx.fill();
  // Sea.
  const sea = ctx.createLinearGradient(0, horizon, 0, y + h);
  sea.addColorStop(0, '#ff9e5e');
  sea.addColorStop(0.25, '#c94f6d');
  sea.addColorStop(1, '#33204d');
  ctx.fillStyle = sea;
  ctx.fillRect(x, horizon, w, y + h - horizon);
  // Sun's reflection column.
  const refl = ctx.createLinearGradient(0, horizon, 0, y + h);
  refl.addColorStop(0, 'rgba(255, 220, 140, 0.75)');
  refl.addColorStop(1, 'rgba(255, 220, 140, 0)');
  ctx.fillStyle = refl;
  const rw = w * 0.13;
  ctx.fillRect(x + w * 0.62 - rw / 2, horizon, rw, (y + h - horizon) * 0.9);
  waterStreaks(ctx, x, horizon, w, y + h - horizon, '#ffe9b8', 11);
  drawBirds(ctx, x + w * 0.08, y + h * 0.08, w * 0.5, 5, 'rgba(30, 16, 40, 0.8)', 12);
  drawPalm(ctx, x + w * 0.06, y + h * 1.0, h * 0.52, 0.22, '#241331');
  drawPalm(ctx, x + w * 0.97, y + h * 1.0, h * 0.4, -0.3, '#241331');
}

export function paintPalmStrip(ctx, x, y, w, h) {
  skyGradient(ctx, x, y, w, h, [
    [0, '#7fd8d0'],
    [0.45, '#bfe8c8'],
    [0.72, '#ffe3a3'],
    [1, '#ffc98a'],
  ]);
  drawSun(ctx, x + w * 0.2, y + h * 0.2, h * 0.07, '#fff7cf', 'rgba(255, 230, 150, 0.5)');
  const groundY = y + h * 0.74;
  // Promenade and road.
  ctx.fillStyle = '#e8d9b0';
  ctx.fillRect(x, groundY, w, h * 0.1);
  ctx.fillStyle = '#4c4453';
  ctx.fillRect(x, groundY + h * 0.1, w, y + h - groundY - h * 0.1);
  ctx.fillStyle = '#ffd94d';
  const dashW = w * 0.07;
  for (let dx = x + w * 0.03; dx < x + w; dx += dashW * 2) {
    ctx.fillRect(dx, y + h * 0.925, dashW, Math.max(1.5, h * 0.012));
  }
  // A low hotel block behind the palms.
  ctx.fillStyle = '#f2e6cf';
  ctx.fillRect(x + w * 0.52, groundY - h * 0.34, w * 0.4, h * 0.34);
  ctx.fillStyle = '#e2607a';
  ctx.fillRect(x + w * 0.52, groundY - h * 0.34, w * 0.4, h * 0.045);
  ctx.fillStyle = '#7fb3c8';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      ctx.fillRect(x + w * (0.55 + c * 0.07), groundY - h * (0.27 - r * 0.09), w * 0.045, h * 0.05);
    }
  }
  // The strip of palms.
  const ink = '#1f3a33';
  const spots = [0.06, 0.2, 0.34, 0.47, 0.63, 0.78, 0.92];
  spots.forEach((t, i) => {
    const ph = h * (0.44 + (i % 3) * 0.07);
    drawPalm(ctx, x + w * t, groundY + h * 0.02, ph, i % 2 ? 0.16 : -0.14, ink);
  });
  // Lamp posts.
  ctx.fillStyle = '#2b2b33';
  for (let i = 0; i < 4; i++) {
    const lx = x + w * (0.13 + i * 0.24);
    ctx.fillRect(lx, groundY - h * 0.2, Math.max(1.5, w * 0.006), h * 0.2);
    ctx.beginPath();
    ctx.arc(lx + w * 0.003, groundY - h * 0.21, Math.max(2, w * 0.011), 0, Math.PI * 2);
    ctx.fillStyle = '#fff2b0';
    ctx.fill();
    ctx.fillStyle = '#2b2b33';
  }
}

export function paintNeonHarbor(ctx, x, y, w, h) {
  skyGradient(ctx, x, y, w, h, [
    [0, '#070b26'],
    [0.55, '#141b45'],
    [0.8, '#3a1d5c'],
    [1, '#57255c'],
  ]);
  // Stars.
  const rnd = scatter(31);
  ctx.fillStyle = '#dfe8ff';
  for (let i = 0; i < 42; i++) {
    ctx.globalAlpha = 0.25 + rnd() * 0.7;
    ctx.fillRect(x + rnd() * w, y + rnd() * h * 0.4, Math.max(1, w * 0.004), Math.max(1, w * 0.004));
  }
  ctx.globalAlpha = 1;
  const waterY = y + h * 0.66;
  // Skyline blocks with lit windows.
  const blocks = [
    [0.0, 0.3, 0.13], [0.12, 0.42, 0.1], [0.24, 0.24, 0.12], [0.38, 0.38, 0.09],
    [0.5, 0.28, 0.14], [0.63, 0.45, 0.1], [0.75, 0.26, 0.11], [0.87, 0.36, 0.13],
  ];
  const winRnd = scatter(77);
  for (const [bx, bh, bw] of blocks) {
    ctx.fillStyle = '#0a0e24';
    ctx.fillRect(x + w * bx, waterY - h * bh, w * bw, h * bh);
    for (let wy = waterY - h * bh + h * 0.03; wy < waterY - h * 0.03; wy += h * 0.055) {
      for (let wx = x + w * bx + w * 0.012; wx < x + w * (bx + bw) - w * 0.012; wx += w * 0.02) {
        if (winRnd() > 0.45) {
          ctx.fillStyle = winRnd() > 0.25 ? '#ffd98a' : '#8ef6ff';
          ctx.globalAlpha = 0.5 + winRnd() * 0.5;
          ctx.fillRect(wx, wy, w * 0.009, h * 0.02);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  // Neon signs on the two tallest blocks.
  neonSign(ctx, x + w * 0.145, waterY - h * 0.4, w * 0.05, h * 0.2, '#ff5da2');
  neonSign(ctx, x + w * 0.655, waterY - h * 0.43, w * 0.05, h * 0.24, '#39d5f0');
  // Water with neon reflections.
  const sea = ctx.createLinearGradient(0, waterY, 0, y + h);
  sea.addColorStop(0, '#1b1440');
  sea.addColorStop(1, '#05060f');
  ctx.fillStyle = sea;
  ctx.fillRect(x, waterY, w, y + h - waterY);
  reflectionStreaks(ctx, x + w * 0.16, waterY, w * 0.03, h * 0.3, '#ff5da2');
  reflectionStreaks(ctx, x + w * 0.67, waterY, w * 0.03, h * 0.32, '#39d5f0');
  waterStreaks(ctx, x, waterY, w, y + h - waterY, '#a8c8ff', 32, 18);
  // A moored boat silhouette.
  ctx.fillStyle = '#04050c';
  const bx = x + w * 0.4, by = waterY + h * 0.1;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + w * 0.2, by);
  ctx.lineTo(bx + w * 0.16, by + h * 0.045);
  ctx.lineTo(bx + w * 0.03, by + h * 0.045);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(bx + w * 0.09, by - h * 0.16, Math.max(1.5, w * 0.006), h * 0.16);
  ctx.beginPath();
  ctx.moveTo(bx + w * 0.095, by - h * 0.155);
  ctx.lineTo(bx + w * 0.095, by - h * 0.02);
  ctx.lineTo(bx + w * 0.16, by - h * 0.02);
  ctx.closePath();
  ctx.fillStyle = 'rgba(200, 220, 255, 0.5)';
  ctx.fill();
}

function neonSign(ctx, sx, sy, sw, sh, color) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.6, sw * 0.1);
  ctx.strokeRect(sx, sy, sw, sh);
  ctx.beginPath();
  ctx.moveTo(sx + sw * 0.25, sy + sh * 0.78);
  ctx.lineTo(sx + sw * 0.5, sy + sh * 0.25);
  ctx.lineTo(sx + sw * 0.75, sy + sh * 0.78);
  ctx.stroke();
  ctx.restore();
}

function reflectionStreaks(ctx, sx, sy, sw, len, color) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < 12; i++) {
    const t = i / 12;
    ctx.globalAlpha = 0.35 * (1 - t) + 0.05;
    const wob = Math.sin(i * 2.3) * sw * 0.4;
    ctx.fillRect(sx + wob - sw / 2, sy + t * len, sw * (1 + t * 0.6), Math.max(1, len * 0.03));
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function paintCausewayDusk(ctx, x, y, w, h) {
  skyGradient(ctx, x, y, w, h, [
    [0, '#1d1440'],
    [0.4, '#5b2a6e'],
    [0.68, '#c24d78'],
    [0.86, '#ff9a5c'],
    [1, '#ffc46b'],
  ]);
  drawSun(ctx, x + w * 0.3, y + h * 0.66, h * 0.075, '#ffe9a8', 'rgba(255, 170, 80, 0.5)');
  // Cloud bands.
  ctx.fillStyle = 'rgba(40, 20, 60, 0.35)';
  for (const [cy, cw] of [[0.16, 0.5], [0.3, 0.36], [0.46, 0.58]]) {
    ctx.beginPath();
    ctx.ellipse(x + w * (0.2 + cw * 0.3), y + h * cy, w * cw * 0.5, h * 0.028, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const waterY = y + h * 0.7;
  const sea = ctx.createLinearGradient(0, waterY, 0, y + h);
  sea.addColorStop(0, '#e2706b');
  sea.addColorStop(0.3, '#6e3560');
  sea.addColorStop(1, '#191038');
  ctx.fillStyle = sea;
  ctx.fillRect(x, waterY, w, y + h - waterY);
  waterStreaks(ctx, x, waterY, w, y + h - waterY, '#ffc98a', 47, 20);
  // The causeway: a long deck running to a vanishing point, lamps receding.
  const vx = x + w * 0.86, vy = waterY - h * 0.02;
  ctx.fillStyle = '#241631';
  ctx.beginPath();
  ctx.moveTo(x - w * 0.05, y + h * 0.98);
  ctx.lineTo(x + w * 0.34, waterY + h * 0.02);
  ctx.lineTo(vx, vy);
  ctx.lineTo(vx + w * 0.02, vy + h * 0.03);
  ctx.lineTo(x + w * 0.42, waterY + h * 0.1);
  ctx.lineTo(x + w * 0.06, y + h * 1.02);
  ctx.closePath();
  ctx.fill();
  // Deck edge light line.
  ctx.strokeStyle = '#ffb35c';
  ctx.lineWidth = Math.max(1.2, h * 0.006);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.02, y + h * 0.965);
  ctx.lineTo(vx, vy);
  ctx.stroke();
  // Lamp posts shrinking toward the vanishing point, plus car light dots.
  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    const lx = lerp(x + w * 0.1, vx, Math.pow(t, 1.4));
    const ly = lerp(y + h * 0.94, vy, Math.pow(t, 1.4));
    const lh = h * 0.16 * (1 - t * 0.75);
    ctx.strokeStyle = '#160d24';
    ctx.lineWidth = Math.max(1.2, w * 0.006 * (1 - t * 0.6));
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx, ly - lh);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(lx, ly - lh, Math.max(1.4, w * 0.008 * (1 - t * 0.5)), 0, Math.PI * 2);
    ctx.fillStyle = '#ffe2a0';
    ctx.fill();
  }
  ctx.fillStyle = '#fff6d8';
  for (const t of [0.12, 0.3, 0.52]) {
    const cxp = lerp(x + w * 0.16, vx, t);
    const cyp = lerp(y + h * 0.955, vy, t);
    ctx.globalAlpha = 0.9;
    ctx.fillRect(cxp, cyp, w * 0.012 * (1 - t * 0.5), h * 0.008);
  }
  ctx.globalAlpha = 1;
  drawBirds(ctx, x + w * 0.5, y + h * 0.06, w * 0.4, 4, 'rgba(20, 10, 30, 0.75)', 48);
}

export const SCENE_PAINTS = {
  sunset: paintSunsetBay,
  palms: paintPalmStrip,
  harbor: paintNeonHarbor,
  causeway: paintCausewayDusk,
};

export const SCENE_LABELS = {
  sunset: 'Sunset Bay',
  palms: 'Palm Strip',
  harbor: 'Neon Harbor',
  causeway: 'Causeway at Dusk',
};

// Paint one scene into a rectangle, clipped so painters can overdraw safely.
export function paintScene(ctx, kind, x, y, w, h) {
  const paint = SCENE_PAINTS[kind] ?? paintSunsetBay;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  paint(ctx, x, y, w, h);
  ctx.restore();
}
