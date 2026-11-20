// app.js — Leonida Grid's wiring: the panel state, photo intake, drag and
// zoom editing, the control panel, PNG exports, and the ?shot= capture modes
// the maker uses to photograph the app for its screenshots.

import { GRADES, LAYOUTS, TREATMENTS, drawPostcard, layoutById } from './postcard.js';

export const EXPORT_SIZES = [
  { id: 'square', name: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', name: '1920 × 1080', w: 1920, h: 1080 },
];

const DEMO_CYCLE = ['sunset', 'palms', 'harbor', 'causeway', 'palms', 'sunset', 'harbor'];

export function demoPanels() {
  return DEMO_CYCLE.map((scene) => ({ type: 'scene', scene, zoom: 1, ox: 0, oy: 0 }));
}

export const state = {
  layout: 'hero-left',
  grade: 'gold',
  treatment: 'classic',
  title: 'LEONIDA GRID',
  subtitle: 'your photos, posted from Leonida',
  popout: true,
  size: 'wide',
  panels: demoPanels(),
  selected: 0,
};

let fillCursor = 0;
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

export function currentSize() {
  return EXPORT_SIZES.find((s) => s.id === state.size) ?? EXPORT_SIZES[2];
}

export function panelRectsNow() {
  const size = currentSize();
  const probe = document.createElement('canvas');
  probe.width = size.w;
  probe.height = size.h;
  return drawPostcard(probe.getContext('2d'), size.w, size.h, state);
}

export function render() {
  const size = currentSize();
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  const rects = drawPostcard(ctx, size.w, size.h, state);
  // Selection ring (preview only — exports draw without it).
  const rect = rects[state.selected];
  if (rect && !document.body.classList.contains('shot')) {
    ctx.save();
    ctx.strokeStyle = '#19d3e6';
    ctx.lineWidth = Math.max(3, size.w * 0.004);
    ctx.setLineDash([size.w * 0.02, size.w * 0.012]);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
  return rects;
}

function loadPhotoFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addPhotos(files) {
  const images = [];
  for (const file of files) {
    if (file.type.startsWith('image/')) images.push(await loadPhotoFile(file));
  }
  for (const img of images.slice(0, 6)) {
    state.panels[fillCursor % state.panels.length] = { type: 'photo', source: img, zoom: 1, ox: 0, oy: 0 };
    state.selected = fillCursor % state.panels.length;
    fillCursor += 1;
  }
  syncControls();
  render();
}

async function setDemoPhoto(panelIndex, src) {
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
  state.panels[panelIndex] = { type: 'photo', source: img, zoom: 1, ox: 0, oy: 0 };
  state.selected = panelIndex;
  fillCursor = panelIndex + 1;
  syncControls();
  render();
}

function exportPng(sizeId) {
  const size = EXPORT_SIZES.find((s) => s.id === sizeId);
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawPostcard(off.getContext('2d'), size.w, size.h, state);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leonida-grid-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

// ---- controls ------------------------------------------------------------

function buttonGroup(containerId, options, current, onPick) {
  const box = document.getElementById(containerId);
  box.innerHTML = '';
  for (const opt of options) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = opt.name;
    b.dataset.id = opt.id;
    if (opt.id === current) b.classList.add('active');
    b.addEventListener('click', () => onPick(opt.id));
    box.appendChild(b);
  }
}

function syncControls() {
  buttonGroup('layout-picker', LAYOUTS, state.layout, (id) => { state.layout = id; syncControls(); render(); });
  buttonGroup('grade-picker', GRADES, state.grade, (id) => { state.grade = id; syncControls(); render(); });
  buttonGroup('treatment-picker', TREATMENTS, state.treatment, (id) => { state.treatment = id; syncControls(); render(); });
  buttonGroup('size-picker', EXPORT_SIZES, state.size, (id) => { state.size = id; syncControls(); render(); });
  const zoom = document.getElementById('zoom');
  const panel = state.panels[state.selected];
  zoom.value = panel && panel.type === 'photo' ? String(panel.zoom ?? 1) : '1';
  document.getElementById('panel-label').textContent =
    `Panel ${state.selected + 1} of ${layoutById(state.layout).build({ x: 0, y: 0, w: 100, h: 100 }).length} — click to select, drag to reposition.`;
}

function wireControls() {
  document.getElementById('photo-input').addEventListener('change', (e) => {
    addPhotos([...e.target.files]);
    e.target.value = '';
  });
  document.getElementById('demo-pier').addEventListener('click', () => setDemoPhoto(state.selected, './samples/pier.jpg'));
  document.getElementById('demo-boulevard').addEventListener('click', () => setDemoPhoto(state.selected, './samples/boulevard.jpg'));
  document.getElementById('reset-demo').addEventListener('click', () => {
    state.panels = demoPanels();
    state.selected = 0;
    fillCursor = 0;
    syncControls();
    render();
  });
  document.getElementById('title-input').addEventListener('input', (e) => {
    state.title = e.target.value.toUpperCase() || 'LEONIDA GRID';
    render();
  });
  document.getElementById('subtitle-input').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    render();
  });
  document.getElementById('popout-toggle').addEventListener('change', (e) => {
    state.popout = e.target.checked;
    render();
  });
  document.getElementById('zoom').addEventListener('input', (e) => {
    const panel = state.panels[state.selected];
    if (panel) {
      panel.zoom = Number(e.target.value);
      render();
    }
  });
  for (const size of EXPORT_SIZES) {
    document.getElementById(`export-${size.id}`).addEventListener('click', () => exportPng(size.id));
  }
  const stageWrap = document.getElementById('stage-wrap');
  stageWrap.addEventListener('dragover', (e) => {
    e.preventDefault();
    stageWrap.classList.add('dragover');
  });
  stageWrap.addEventListener('dragleave', () => stageWrap.classList.remove('dragover'));
  stageWrap.addEventListener('drop', (e) => {
    e.preventDefault();
    stageWrap.classList.remove('dragover');
    addPhotos([...e.dataTransfer.files]);
  });

  // Click to select a panel; drag inside it to reposition its photo.
  let drag = null;
  const toCanvasPoint = (e) => {
    const box = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - box.left) / box.width) * canvas.width,
      y: ((e.clientY - box.top) / box.height) * canvas.height,
    };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const rects = render();
    const p = toCanvasPoint(e);
    const idx = rects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
    if (idx >= 0) {
      state.selected = idx;
      drag = { x: p.x, y: p.y, ox: state.panels[idx].ox ?? 0, oy: state.panels[idx].oy ?? 0, rect: rects[idx] };
      canvas.setPointerCapture(e.pointerId);
      syncControls();
      render();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toCanvasPoint(e);
    const panel = state.panels[state.selected];
    if (panel && panel.type === 'photo') {
      panel.ox = clamp(drag.ox + ((p.x - drag.x) / drag.rect.w) * 2, -1, 1);
      panel.oy = clamp(drag.oy + ((p.y - drag.y) / drag.rect.h) * 2, -1, 1);
      render();
    }
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// ---- fonts + boot ----------------------------------------------------------

async function loadFonts() {
  const faces = [
    new FontFace('Anton', "url('./fonts/Anton-Regular.ttf')"),
    new FontFace('Pacifico', "url('./fonts/Pacifico-Regular.ttf')"),
  ];
  for (const face of faces) {
    try {
      await face.load();
      document.fonts.add(face);
    } catch {
      // A missing display font falls back to the condensed system stack.
    }
  }
  await document.fonts.ready;
}

// ?shot= modes: the maker photographs the app by loading one of these URLs in
// a browser at an exact window size. Each sets window.__shotReady when the
// frame is fully drawn.
async function applyShotMode(params) {
  document.body.classList.add('shot');
  const sizeParam = params.get('size');
  if (sizeParam) {
    const [w, h] = sizeParam.split('x').map(Number);
    const match = EXPORT_SIZES.find((s) => s.w === w && s.h === h);
    if (match) state.size = match.id;
  }
  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('treatment')) state.treatment = params.get('treatment');
  if (params.get('title')) state.title = params.get('title');
  if (params.get('popout') === '0') state.popout = false;
  if (params.get('mode') === 'editor') {
    document.body.classList.remove('shot');
    document.body.classList.add('shot-editor');
    await setDemoPhoto(0, './samples/pier.jpg');
    await setDemoPhoto(2, './samples/boulevard.jpg');
    state.selected = 0;
    syncControls();
  }
  render();
  window.__shotReady = true;
}

async function boot() {
  await loadFonts();
  const params = new URLSearchParams(location.search);
  if (params.has('shot')) {
    await applyShotMode(params);
    return;
  }
  wireControls();
  syncControls();
  render();
}

boot();
