/* ==========================================================================
   MATHQUEST PRO — CORE APPLICATION & MULTI-LESSON ENGINE
   Educator: Mr Ahmed Abd El-Motaal
   Math Teacher & Content Creator
   Lessons Included:
   1. Lesson One: Proportion (Unit 1: Numbers & Operations)
   2. Lesson Two: The Distance Between Two Points (Coordinate Geometry)
   ========================================================================== */

// --- AUDIO SYNTHESIZER (Web Audio API, Zero External MP3 Dependencies) ---
const AudioEngine = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  },
  playTone(freq, type, duration, gainVal = 0.1) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  },
  click() { this.playTone(600, 'sine', 0.08, 0.05); },
  success() {
    this.playTone(523.25, 'triangle', 0.12, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.18, 0.12), 100);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.28, 0.14), 220);
  },
  wrong() {
    this.playTone(220, 'sawtooth', 0.18, 0.1);
    setTimeout(() => this.playTone(180, 'sawtooth', 0.25, 0.1), 120);
  }
};

// ==========================================================================
// ==========================================================================
// 1. IPAD STYLUS & NOTEBOOK CANVAS ENGINE (Hi-DPI, Palm Rejection & Undo)
// ==========================================================================
const StylusEngine = {
  canvases: {},
  buffers: {}, // In-memory offscreen buffers to prevent stroke loss on switchTab
  stylusOnlyMode: true, // Apple Pencil / Stylus & Mouse only (Finger rejected to prevent choppy writing & palm interference)

  initCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    const wrap = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 280;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.canvases[id] = {
      canvas,
      ctx,
      dpr,
      width,
      height,
      mode: 'draw',
      activeTool: 'pen',
      shapeStartX: 0,
      shapeStartY: 0,
      color: '#182038',
      strokeWidth: 4,
      isEraser: false,
      isDrawing: false,
      history: [],
      lastSnapshot: null,
      prevX: 0,
      prevY: 0,
      lastMidX: 0,
      lastMidY: 0,
      hasMoved: false
    };

    this.restoreCanvas(id);

    // Prevent drag & drop, selection, and context menus on the canvas
    canvas.setAttribute('draggable', 'false');
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('selectstart', (e) => e.preventDefault());
    canvas.addEventListener('touchstart', (e) => {
      if (this.canvases[id]?.mode === 'draw') e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      if (this.canvases[id]?.mode === 'draw') e.preventDefault();
    }, { passive: false });

    const wrapEl = canvas.parentElement;
    if (wrapEl) {
      wrapEl.addEventListener('contextmenu', (e) => e.preventDefault());
      wrapEl.addEventListener('selectstart', (e) => {
        if (this.canvases[id]?.mode === 'draw') e.preventDefault();
      });
    }

    canvas.addEventListener('pointerdown', (e) => this.startDraw(id, e));
    canvas.addEventListener('pointermove', (e) => this.draw(id, e));
    canvas.addEventListener('pointerup', (e) => this.stopDraw(id, e));
    canvas.addEventListener('pointercancel', (e) => this.stopDraw(id, e));

    const textLayer = document.getElementById(id.replace('can-', 'text-'));
    if (textLayer) {
      const savedText = localStorage.getItem('math_text_' + id);
      if (savedText) textLayer.value = savedText;
      textLayer.addEventListener('input', () => {
        localStorage.setItem('math_text_' + id, textLayer.value);
      });
    }
  },

  startDraw(id, e) {
    // Dismiss any active text selection or iOS callout popup immediately
    if (window.getSelection) {
      try { window.getSelection().removeAllRanges(); } catch (err) {}
    }

    // 1. REJECT FINGER TOUCH (Apple Pencil / Stylus / Mouse ONLY)
    // Prevents accidental finger writing and acts as True Palm Rejection
    if (this.stylusOnlyMode && e.pointerType === 'touch') {
      e.preventDefault(); // Stop iOS from initiating text selection on palm press!
      return;
    }

    e.preventDefault();

    const inst = this.canvases[id];
    if (!inst || inst.mode !== 'draw') return;

    this.lastActiveCanvasId = id;
    inst.isDrawing = true;

    try {
      inst.canvas.setPointerCapture(e.pointerId);
    } catch (err) {}

    // Save snapshot before new stroke for UNDO and live shape preview
    inst.lastSnapshot = inst.ctx.getImageData(0, 0, inst.canvas.width, inst.canvas.height);

    const rect = inst.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    inst.shapeStartX = x;
    inst.shapeStartY = y;
    inst.prevX = x;
    inst.prevY = y;
    inst.lastMidX = x;
    inst.lastMidY = y;
    inst.hasMoved = false;

    const ctx = inst.ctx;
    if (inst.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = inst.strokeWidth * 4;
    } else if (inst.activeTool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = inst.color;
      ctx.lineWidth = Math.max(inst.strokeWidth * 5, 24);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = inst.color;
      ctx.lineWidth = inst.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    // Draw initial touch dot only for freehand pen / highlighter mode
    if (inst.activeTool === 'pen' || inst.activeTool === 'highlighter') {
      ctx.beginPath();
      const dotR = inst.isEraser
        ? inst.strokeWidth * 2
        : (inst.activeTool === 'highlighter' ? Math.max(inst.strokeWidth * 2.5, 12) : inst.strokeWidth / 2);
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fillStyle = inst.isEraser ? 'rgba(0,0,0,1)' : inst.color;
      ctx.fill();
    }
  },

  draw(id, e) {
    if (this.stylusOnlyMode && e.pointerType === 'touch') {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    const inst = this.canvases[id];
    if (!inst || !inst.isDrawing) return;

    const rect = inst.canvas.getBoundingClientRect();

    // High-frequency iPad digitizer sampling: extract all coalesced sub-frame points
    const events = (typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length > 0)
      ? e.getCoalescedEvents()
      : [e];

    const ctx = inst.ctx;

    if (inst.activeTool === 'pen' || inst.activeTool === 'highlighter') {
      if (inst.activeTool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = Math.max(inst.strokeWidth * 5, 24);
      } else if (!inst.isEraser) {
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = inst.strokeWidth;
      }
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        const currentX = ev.clientX - rect.left;
        const currentY = ev.clientY - rect.top;

        const dx = currentX - inst.prevX;
        const dy = currentY - inst.prevY;
        if (dx * dx + dy * dy < 0.2) continue; // Skip identical jitter points

        inst.hasMoved = true;
        const midX = (inst.prevX + currentX) / 2;
        const midY = (inst.prevY + currentY) / 2;

        // Continuous bezier curve: from previous midpoint through previous coordinate to new midpoint
        ctx.beginPath();
        ctx.moveTo(inst.lastMidX, inst.lastMidY);
        ctx.quadraticCurveTo(inst.prevX, inst.prevY, midX, midY);
        ctx.stroke();

        inst.lastMidX = midX;
        inst.lastMidY = midY;
        inst.prevX = currentX;
        inst.prevY = currentY;
      }
    } else {
      // Geometric Shape Drawing with Live Interactive Preview
      const ev = events[events.length - 1];
      const currentX = ev.clientX - rect.left;
      const currentY = ev.clientY - rect.top;
      inst.hasMoved = true;

      // Restore snapshot to erase previous frame's preview
      ctx.putImageData(inst.lastSnapshot, 0, 0);

      ctx.strokeStyle = inst.color;
      ctx.lineWidth = inst.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const sx = inst.shapeStartX;
      const sy = inst.shapeStartY;

      if (inst.activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
      } else if (inst.activeTool === 'rect') {
        const rx = Math.min(sx, currentX);
        const ry = Math.min(sy, currentY);
        const rw = Math.abs(currentX - sx);
        const rh = Math.abs(currentY - sy);
        ctx.strokeRect(rx, ry, rw, rh);
      } else if (inst.activeTool === 'circle') {
        const rx = Math.abs(currentX - sx) / 2;
        const ry = Math.abs(currentY - sy) / 2;
        const cx = (sx + currentX) / 2;
        const cy = (sy + currentY) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (inst.activeTool === 'axis') {
        // Cartesian X-Y Coordinate Axes with directional arrows
        ctx.beginPath();
        ctx.moveTo(sx, sy); ctx.lineTo(currentX, sy); // X-axis
        ctx.moveTo(sx, sy); ctx.lineTo(sx, currentY); // Y-axis
        ctx.stroke();

        const arrow = Math.max(inst.strokeWidth * 2.2, 7);
        const xDir = currentX >= sx ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(currentX, sy);
        ctx.lineTo(currentX - xDir * arrow, sy - arrow / 1.6);
        ctx.lineTo(currentX - xDir * arrow, sy + arrow / 1.6);
        ctx.closePath();
        ctx.fillStyle = inst.color;
        ctx.fill();

        const yDir = currentY >= sy ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(sx, currentY);
        ctx.lineTo(sx - arrow / 1.6, currentY - yDir * arrow);
        ctx.lineTo(sx + arrow / 1.6, currentY - yDir * arrow);
        ctx.closePath();
        ctx.fill();
      }
    }
  },

  stopDraw(id, e) {
    const inst = this.canvases[id];
    if (!inst || !inst.isDrawing) return;

    if (e) e.preventDefault();
    inst.isDrawing = false;
    if (e && e.pointerId) {
      try {
        inst.canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }

    if (window.getSelection) {
      try { window.getSelection().removeAllRanges(); } catch (err) {}
    }

    // Connect final segment smoothly for freehand pen / highlighter
    if ((inst.activeTool === 'pen' || inst.activeTool === 'highlighter') && inst.hasMoved) {
      const ctx = inst.ctx;
      ctx.beginPath();
      ctx.moveTo(inst.lastMidX, inst.lastMidY);
      ctx.lineTo(inst.prevX, inst.prevY);
      ctx.stroke();
    }
    inst.ctx.globalAlpha = 1.0;

    // Commit snapshot to Undo stack
    if (inst.lastSnapshot) {
      if (!inst.history) inst.history = [];
      inst.history.push(inst.lastSnapshot);
      if (inst.history.length > 30) inst.history.shift();
      inst.lastSnapshot = null;
    }

    this.saveCanvas(id);
  },

  undo(id) {
    const inst = this.canvases[id];
    if (!inst || !inst.history || inst.history.length === 0) return;

    const prevState = inst.history.pop();
    inst.ctx.putImageData(prevState, 0, 0);
    this.saveCanvas(id);
    AudioEngine.click();
  },

  saveCanvas(id) {
    const inst = this.canvases[id];
    if (!inst) return;
    try {
      const dataUrl = inst.canvas.toDataURL();
      localStorage.setItem('math_canvas_' + id, dataUrl);
      this.buffers[id] = dataUrl;
    } catch (e) {
      console.warn("Auto-save canvas warning:", e);
    }
  },

  restoreCanvas(id) {
    const inst = this.canvases[id];
    if (!inst) return;
    const dataUrl = this.buffers[id] || localStorage.getItem('math_canvas_' + id);
    if (dataUrl) {
      const img = new Image();
      img.onload = () => {
        inst.ctx.clearRect(0, 0, inst.width, inst.height);
        inst.ctx.drawImage(img, 0, 0, inst.width, inst.height);
      };
      img.src = dataUrl;
    }
  },

  redrawAll() {
    Object.keys(this.canvases).forEach((id) => this.restoreCanvas(id));
  },

  handleResize() {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      Object.keys(this.canvases).forEach((id) => {
        const inst = this.canvases[id];
        if (!inst || !inst.canvas) return;
        const wrap = inst.canvas.parentElement;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const newWidth = rect.width;
        if (newWidth && Math.abs(newWidth - inst.width) > 5) {
          const tempUrl = inst.canvas.toDataURL();
          const dpr = window.devicePixelRatio || 1;
          inst.width = newWidth;
          inst.canvas.width = newWidth * dpr;
          inst.canvas.height = inst.height * dpr;
          inst.canvas.style.width = newWidth + 'px';
          inst.canvas.style.height = inst.height + 'px';
          const ctx = inst.canvas.getContext('2d', { willReadFrequently: true });
          ctx.scale(dpr, dpr);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          inst.ctx = ctx;

          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0, newWidth, inst.height);
          img.src = tempUrl;
        }
      });
    }, 250);
  },

  clearCanvas(id) {
    const inst = this.canvases[id];
    if (!inst) return;

    // Push current snapshot into history so Clear itself can be UNDONE!
    const snapshot = inst.ctx.getImageData(0, 0, inst.canvas.width, inst.canvas.height);
    if (!inst.history) inst.history = [];
    inst.history.push(snapshot);

    inst.ctx.save();
    inst.ctx.setTransform(1, 0, 0, 1, 0, 0);
    inst.ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);
    inst.ctx.restore();
    localStorage.removeItem('math_canvas_' + id);
    delete this.buffers[id];
    AudioEngine.click();
  }
};

// Global Orientation & Resize Listeners
window.addEventListener('resize', () => StylusEngine.handleResize());
window.addEventListener('orientationchange', () => StylusEngine.handleResize());

// Global Selection Guardian: Clear accidental text selections while drawing
document.addEventListener('selectionchange', () => {
  const isAnyDrawing = Object.values(StylusEngine.canvases).some(c => c.isDrawing) || FullScreenPen.isDrawing;
  if (isAnyDrawing && window.getSelection) {
    try { window.getSelection().removeAllRanges(); } catch (err) {}
  }
});

function undoCanvas(id) {
  StylusEngine.undo(id);
}

function toggleStylusMode(btn) {
  StylusEngine.stylusOnlyMode = !StylusEngine.stylusOnlyMode;
  FullScreenPen.stylusOnlyMode = StylusEngine.stylusOnlyMode;

  const allBadges = document.querySelectorAll('.stylus-indicator');
  allBadges.forEach(b => {
    b.classList.toggle('active', StylusEngine.stylusOnlyMode);
    b.classList.toggle('touch-allowed', !StylusEngine.stylusOnlyMode);
    const txt = b.querySelector('.stylus-mode-text');
    if (txt) {
      txt.innerText = StylusEngine.stylusOnlyMode ? 'Stylus Only' : 'Touch Allowed';
    }
  });
  AudioEngine.click();
}

function setCanvasTool(id, tool, btn) {
  const inst = StylusEngine.canvases[id];
  if (!inst) return;
  inst.activeTool = tool;
  inst.mode = 'draw';
  inst.isEraser = false;

  const toolbar = btn.closest('.stylus-toolbar');
  if (toolbar) {
    toolbar.querySelectorAll('.tool-btn').forEach(b => {
      const txt = b.innerText.trim();
      if (txt.includes('Pen') || txt.includes('Highlighter') || txt.includes('Line') || txt.includes('Box') || txt.includes('Circle') || txt.includes('Axes') || txt.includes('Type') || txt.includes('Eraser')) {
        b.classList.remove('active');
      }
    });
  }
  btn.classList.add('active');

  const canvas = inst.canvas;
  const textLayer = document.getElementById(id.replace('can-', 'text-'));
  if (canvas) canvas.style.pointerEvents = 'auto';
  if (textLayer) textLayer.style.display = 'none';

  AudioEngine.click();
}

function loadBlobToCanvas(id, blob) {
  if (!blob) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const inst = StylusEngine.canvases[id];
      if (!inst) return;
      const ctx = inst.ctx;

      // Save history for undo
      const snapshot = ctx.getImageData(0, 0, inst.canvas.width, inst.canvas.height);
      inst.history.push(snapshot);

      // Fit inside canvas gracefully
      const maxW = inst.width * 0.85;
      const maxH = inst.height * 0.85;
      let drawW = img.width;
      let drawH = img.height;

      if (drawW > maxW) {
        drawH = (drawH * maxW) / drawW;
        drawW = maxW;
      }
      if (drawH > maxH) {
        drawW = (drawW * maxH) / drawH;
        drawH = maxH;
      }

      const x = (inst.width - drawW) / 2;
      const y = (inst.height - drawH) / 2;

      ctx.drawImage(img, x, y, drawW, drawH);
      AudioEngine.success();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(blob);
}

function triggerCanvasImagePaste(id) {
  AudioEngine.click();
  StylusEngine.lastActiveCanvasId = id;

  // 1. Try modern clipboard read API
  if (navigator.clipboard && navigator.clipboard.read) {
    navigator.clipboard.read().then(items => {
      let found = false;
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            item.getType(type).then(blob => {
              loadBlobToCanvas(id, blob);
            });
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) {
        const fileInput = document.getElementById(`file-${id}`);
        if (fileInput) fileInput.click();
      }
    }).catch(() => {
      const fileInput = document.getElementById(`file-${id}`);
      if (fileInput) fileInput.click();
    });
  } else {
    const fileInput = document.getElementById(`file-${id}`);
    if (fileInput) fileInput.click();
  }
}

function handleCanvasImageUpload(id, input) {
  if (!input.files || !input.files[0]) return;
  StylusEngine.lastActiveCanvasId = id;
  loadBlobToCanvas(id, input.files[0]);
  input.value = '';
}

function exportCanvasImage(id) {

  const inst = StylusEngine.canvases[id];
  if (!inst) return;

  const canvas = inst.canvas;
  const card = canvas.closest('.try-it-card') || canvas.closest('article') || canvas.closest('.idea-block');

  // 1. Extract Question Header Tag & Question Text
  let badgeText = 'Exercise & Practice';
  let questionText = '';

  if (card) {
    const badgeEl = card.querySelector('.try-it-badge') || card.querySelector('.example-tag') || card.querySelector('.rw-tag');
    if (badgeEl) {
      badgeText = badgeEl.innerText.replace(/\s+/g, ' ').trim();
    }
    const promptEl = card.querySelector('.try-it-prompt') || card.querySelector('.example-question') || card.querySelector('.rw-desc');
    if (promptEl) {
      questionText = promptEl.innerText.replace(/\s+/g, ' ').trim();
    }
  }

  if (!questionText) {
    questionText = 'Mathematical Problem Derivation & Solution Workspace';
  }

  const dpr = window.devicePixelRatio || 1;
  const padding = 28 * dpr;
  const headerHeight = 76 * dpr;

  const contentWidth = Math.max(inst.canvas.width, 740 * dpr);
  const maxTextWidth = contentWidth - 36 * dpr;

  // Text Wrapping Helper
  function wrapLines(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Measure Question Box Height
  const testCanvas = document.createElement('canvas');
  const testCtx = testCanvas.getContext('2d');
  testCtx.font = `bold ${14 * dpr}px 'Outfit', 'Plus Jakarta Sans', sans-serif`;

  const questionLines = wrapLines(testCtx, questionText, maxTextWidth - 28 * dpr);
  const lineSpacing = 22 * dpr;
  const qBoxPadding = 16 * dpr;
  const badgeHeight = 26 * dpr;
  const questionBoxHeight = badgeHeight + 12 * dpr + (questionLines.length * lineSpacing) + qBoxPadding * 2;

  // Textarea typed layer content if any
  const textLayer = document.getElementById(id.replace('can-', 'text-'));
  const typedText = textLayer?.value?.trim() || '';
  let typedLines = [];
  let typedBoxHeight = 0;
  if (typedText) {
    testCtx.font = `${12.5 * dpr}px 'Plus Jakarta Sans', sans-serif`;
    typedLines = wrapLines(testCtx, typedText, maxTextWidth - 28 * dpr);
    typedBoxHeight = 30 * dpr + (typedLines.length * 20 * dpr) + 16 * dpr;
  }

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = contentWidth + padding * 2;
  exportCanvas.height = headerHeight + questionBoxHeight + (typedBoxHeight ? typedBoxHeight + 16 * dpr : 0) + inst.canvas.height + padding * 2 + 36 * dpr;

  const ctx = exportCanvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  // Helper function for rounded rectangles
  function drawRoundedRect(c, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // 1. Top Teacher Branding Header
  ctx.fillStyle = '#182038';
  ctx.font = `bold ${16 * dpr}px 'Outfit', sans-serif`;
  ctx.fillText('Mr Ahmed Abd El-Motaal • Math Teacher & Content Creator', padding, padding + 20 * dpr);

  ctx.fillStyle = '#5e6b8c';
  ctx.font = `${11 * dpr}px 'Plus Jakarta Sans', sans-serif`;
  const lessonLabel = (currentLessonKey === 'proportion') ? 'Prep 3 • Unit 1: Numbers & Operations • Proportion' : 'Prep 3 • Unit 2: Functions • Quadratic Function';
  ctx.fillText(`${lessonLabel} | 📞 01019775590 | 📺 YouTube: mr Motaal`, padding, padding + 42 * dpr);

  // Top Separator
  ctx.strokeStyle = '#6c5ce7';
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  ctx.moveTo(padding, headerHeight + padding - 10 * dpr);
  ctx.lineTo(exportCanvas.width - padding, headerHeight + padding - 10 * dpr);
  ctx.stroke();

  // 2. Question Box
  const qBoxY = headerHeight + padding;
  const qBoxWidth = exportCanvas.width - padding * 2;

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5 * dpr;
  drawRoundedRect(ctx, padding, qBoxY, qBoxWidth, questionBoxHeight, 14 * dpr);
  ctx.fill();
  ctx.stroke();

  // Badge pill inside Question Box
  ctx.fillStyle = '#6c5ce7';
  const badgeWidth = Math.min(240 * dpr, testCtx.measureText(badgeText).width + 30 * dpr);
  drawRoundedRect(ctx, padding + qBoxPadding, qBoxY + qBoxPadding, badgeWidth, badgeHeight, 12 * dpr);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${10.5 * dpr}px 'Outfit', sans-serif`;
  ctx.fillText(badgeText, padding + qBoxPadding + 10 * dpr, qBoxY + qBoxPadding + 17 * dpr);

  // Render Question Lines
  ctx.fillStyle = '#182038';
  ctx.font = `bold ${13.5 * dpr}px 'Outfit', 'Plus Jakarta Sans', sans-serif`;
  let lineY = qBoxY + qBoxPadding + badgeHeight + 16 * dpr;
  questionLines.forEach(line => {
    ctx.fillText(line, padding + qBoxPadding + 4 * dpr, lineY);
    lineY += lineSpacing;
  });

  let currentY = qBoxY + questionBoxHeight + 16 * dpr;

  // 3. Render Typed Text Layer if available
  if (typedLines.length > 0) {
    ctx.fillStyle = '#f0fdf4';
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 1 * dpr;
    drawRoundedRect(ctx, padding, currentY, qBoxWidth, typedBoxHeight, 10 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#166534';
    ctx.font = `bold ${11 * dpr}px 'Outfit', sans-serif`;
    ctx.fillText('Typed Mathematical Steps:', padding + 14 * dpr, currentY + 20 * dpr);

    ctx.fillStyle = '#1e293b';
    ctx.font = `${12 * dpr}px 'Plus Jakarta Sans', sans-serif`;
    let typedY = currentY + 40 * dpr;
    typedLines.forEach(tl => {
      ctx.fillText(tl, padding + 14 * dpr, typedY);
      typedY += 20 * dpr;
    });

    currentY += typedBoxHeight + 16 * dpr;
  }

  // 4. Draw Notebook Grid or Lines Pattern for Canvas Area
  const isGrid = inst.canvas.parentElement?.classList.contains('grid-bg');
  ctx.strokeStyle = isGrid ? '#e7eefc' : '#e3ebf8';
  ctx.lineWidth = 1 * dpr;

  const canvasStartY = currentY;
  const canvasEndY = canvasStartY + inst.canvas.height;

  if (isGrid) {
    const gridSize = 24 * dpr;
    for (let x = padding; x <= exportCanvas.width - padding; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, canvasStartY); ctx.lineTo(x, canvasEndY); ctx.stroke();
    }
    for (let y = canvasStartY; y <= canvasEndY; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(exportCanvas.width - padding, y); ctx.stroke();
    }
  } else {
    const lineStep = 32 * dpr;
    for (let y = canvasStartY + 24 * dpr; y <= canvasEndY; y += lineStep) {
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(exportCanvas.width - padding, y); ctx.stroke();
    }
  }

  // 5. Draw Handwritten Canvas Content
  ctx.drawImage(inst.canvas, padding, canvasStartY);

  // 6. Border around Canvas Area
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1 * dpr;
  drawRoundedRect(ctx, padding, canvasStartY, qBoxWidth, inst.canvas.height, 12 * dpr);
  ctx.stroke();

  // 7. Footer Watermark
  ctx.fillStyle = '#94a3b8';
  ctx.font = `${10 * dpr}px 'Plus Jakarta Sans', sans-serif`;
  ctx.fillText('MathQuest Pro Interactive Smartboard • Math with Mr Ahmed Abd El-Motaal', padding, exportCanvas.height - 12 * dpr);

  // Direct PNG Download
  const cleanBadge = badgeText.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
  const link = document.createElement('a');
  link.download = `Mr_Motaal_${cleanBadge}_${Date.now()}.png`;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();

  AudioEngine.success();
}

function toggleStudioMode() {
  const isStudio = document.body.classList.toggle('studio-recording-mode');
  const btn = document.getElementById('studioModeBtn');
  if (btn) {
    btn.classList.toggle('active', isStudio);
    const span = btn.querySelector('span');
    if (span) span.innerText = isStudio ? 'Exit Studio' : 'Studio Mode';
  }
  AudioEngine.click();
}

function setCanvasMode(id, mode, btn) {
  const inst = StylusEngine.canvases[id];
  if (!inst) return;
  inst.mode = mode;

  if (mode === 'draw') {
    inst.isEraser = false;
    inst.activeTool = 'pen';
  }

  const toolbar = btn.closest('.stylus-toolbar');
  if (toolbar) {
    toolbar.querySelectorAll('.tool-btn').forEach(b => {
      const txt = b.innerText.trim();
      if (txt.includes('Pen') || txt.includes('Highlighter') || txt.includes('Line') || txt.includes('Box') || txt.includes('Circle') || txt.includes('Axes') || txt.includes('Type') || txt.includes('Eraser')) {
        b.classList.remove('active');
      }
    });
  }
  btn.classList.add('active');

  const canvas = inst.canvas;
  const textLayer = document.getElementById(id.replace('can-', 'text-'));

  if (mode === 'text') {
    canvas.style.pointerEvents = 'none';
    if (textLayer) {
      textLayer.style.display = 'block';
      textLayer.focus();
    }
  } else {
    canvas.style.pointerEvents = 'auto';
    if (textLayer) textLayer.style.display = 'none';
  }
  AudioEngine.click();
}

function setCanvasEraser(id, btn) {
  const inst = StylusEngine.canvases[id];
  if (!inst) return;
  inst.isEraser = !inst.isEraser;
  btn.classList.toggle('active', inst.isEraser);

  const toolbar = btn.closest('.stylus-toolbar');
  if (inst.isEraser) {
    inst.mode = 'draw';
    if (toolbar) {
      toolbar.querySelectorAll('.tool-btn').forEach(b => {
        const txt = b.innerText.trim();
        if (txt.includes('Pen') || txt.includes('Highlighter') || txt.includes('Line') || txt.includes('Box') || txt.includes('Circle') || txt.includes('Axes') || txt.includes('Type')) {
          b.classList.remove('active');
        }
      });
    }
    const canvas = inst.canvas;
    const textLayer = document.getElementById(id.replace('can-', 'text-'));
    if (canvas) canvas.style.pointerEvents = 'auto';
    if (textLayer) textLayer.style.display = 'none';
  } else {
    inst.mode = 'draw';
    inst.activeTool = 'pen';
    const penBtn = toolbar?.querySelector('.fa-pen')?.closest('.tool-btn');
    if (penBtn) penBtn.classList.add('active');
  }
  AudioEngine.click();
}

function setCanvasColor(id, color, dot) {
  const inst = StylusEngine.canvases[id];
  if (!inst) return;
  inst.color = color;
  inst.isEraser = false;
  inst.mode = 'draw';
  inst.activeTool = 'pen';

  const wrap = dot.parentElement;
  wrap.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');

  const toolbar = dot.closest('.stylus-toolbar');
  const eraserBtn = toolbar?.querySelector('.fa-eraser')?.closest('.tool-btn');
  if (eraserBtn) eraserBtn.classList.remove('active');
  const penBtn = toolbar?.querySelector('.fa-pen')?.closest('.tool-btn');
  if (penBtn) penBtn.classList.add('active');

  const canvas = inst.canvas;
  const textLayer = document.getElementById(id.replace('can-', 'text-'));
  if (canvas) canvas.style.pointerEvents = 'auto';
  if (textLayer) textLayer.style.display = 'none';

  AudioEngine.click();
}

function setCanvasWidth(id, width) {
  const inst = StylusEngine.canvases[id];
  if (inst) inst.strokeWidth = parseInt(width, 10);
}

function toggleCanvasGrid(wrapId, btn) {
  const wrap = document.getElementById(wrapId);
  if (wrap) {
    wrap.classList.toggle('grid-bg');
    btn.classList.toggle('active', wrap.classList.contains('grid-bg'));
    AudioEngine.click();
  }
}

function clearCanvasPrompt(id) {
  if (confirm("Clear your notes and drawings on this workspace? (You can use Undo to revert)")) {
    StylusEngine.clearCanvas(id);
    const textLayer = document.getElementById(id.replace('can-', 'text-'));
    if (textLayer) {
      textLayer.value = '';
      localStorage.removeItem('math_text_' + id);
    }
  }
}

// ==========================================================================
// 2. FULL-SCREEN IPAD SCREEN PEN OVERLAY (Ultra-Smooth, Shapes & Undo)
// ==========================================================================
const FullScreenPen = {
  active: false,
  canvas: null,
  ctx: null,
  isDrawing: false,
  stylusOnlyMode: true,
  activeTool: 'pen',
  shapeStartX: 0,
  shapeStartY: 0,
  history: [],
  lastSnapshot: null,
  prevX: 0,
  prevY: 0,
  lastMidX: 0,
  lastMidY: 0,
  hasMoved: false,
  color: '#6c5ce7',
  strokeWidth: 6,
  isEraser: false,
  timerInterval: null,
  secondsElapsed: 0,

  init() {
    this.canvas = document.getElementById('fullscreenPenCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.canvas.setAttribute('draggable', 'false');
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('selectstart', (e) => e.preventDefault());
    this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    this.canvas.addEventListener('pointerdown', (e) => this.start(e));
    this.canvas.addEventListener('pointermove', (e) => this.draw(e));
    this.canvas.addEventListener('pointerup', (e) => this.stop(e));
    this.canvas.addEventListener('pointercancel', (e) => this.stop(e));

    const btn = document.getElementById('fullscreenPenBtn');
    if (btn) btn.addEventListener('click', () => this.toggle());
  },

  resize() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  },

  smoothWidth: 6,

  computeStrokeWidth(baseWidth, pressure, pointerType) {
    if (pointerType === 'pen' && typeof pressure === 'number' && pressure > 0 && pressure <= 1) {
      const eased = Math.pow(pressure, 0.85);
      return Math.max(1, baseWidth * (0.35 + 1.25 * eased));
    }
    return baseWidth;
  },

  toggle() {
    if (this.active) this.exit();
    else this.enter();
  },

  enter() {
    this.active = true;
    const overlay = document.getElementById('fullscreenPenOverlay');
    if (overlay) overlay.classList.add('active');
    const fab = document.getElementById('floatingScreenPenFab');
    if (fab) {
      fab.classList.add('active');
      const span = fab.querySelector('span');
      if (span) span.innerText = 'Close Pen';
      const icon = fab.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-xmark';
    }
    this.startStopwatch();
    AudioEngine.success();
  },

  exit() {
    this.active = false;
    const overlay = document.getElementById('fullscreenPenOverlay');
    if (overlay) overlay.classList.remove('active');
    const fab = document.getElementById('floatingScreenPenFab');
    if (fab) {
      fab.classList.remove('active');
      const span = fab.querySelector('span');
      if (span) span.innerText = 'Write on Screen';
      const icon = fab.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-pen-nib';
    }
    this.stopStopwatch();
    AudioEngine.click();
  },

  start(e) {
    if (window.getSelection) {
      try { window.getSelection().removeAllRanges(); } catch (err) {}
    }

    if (this.stylusOnlyMode && e.pointerType === 'touch') {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    this.isDrawing = true;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch (err) {}

    this.lastSnapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    const x = e.clientX;
    const y = e.clientY;
    this.shapeStartX = x;
    this.shapeStartY = y;
    this.prevX = x;
    this.prevY = y;
    this.lastMidX = x;
    this.lastMidY = y;
    this.hasMoved = false;

    const initialW = this.computeStrokeWidth(this.strokeWidth, e.pressure, e.pointerType);
    this.smoothWidth = initialW;

    if (this.isEraser) {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.lineWidth = Math.max(16, this.strokeWidth * 4);
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      if (this.strokeWidth >= 12) {
        this.ctx.strokeStyle = 'rgba(253, 203, 110, 0.45)';
      } else {
        this.ctx.strokeStyle = this.color;
      }
      this.ctx.lineWidth = initialW;
    }

    if (this.activeTool === 'pen') {
      this.ctx.beginPath();
      this.ctx.arc(x, y, (this.isEraser ? Math.max(8, this.strokeWidth * 2) : initialW / 2), 0, Math.PI * 2);
      this.ctx.fillStyle = this.isEraser ? 'rgba(0,0,0,1)' : (this.strokeWidth >= 12 ? 'rgba(253, 203, 110, 0.45)' : this.color);
      this.ctx.fill();
    }
  },

  draw(e) {
    if (this.stylusOnlyMode && e.pointerType === 'touch') {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    if (!this.isDrawing) return;

    const events = (typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length > 0)
      ? e.getCoalescedEvents()
      : [e];

    if (this.activeTool === 'pen') {
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        const currentX = ev.clientX;
        const currentY = ev.clientY;

        const dx = currentX - this.prevX;
        const dy = currentY - this.prevY;
        if (dx * dx + dy * dy < 0.2) continue;

        const targetW = this.computeStrokeWidth(this.strokeWidth, ev.pressure, ev.pointerType);
        this.smoothWidth = this.smoothWidth * 0.65 + targetW * 0.35;
        this.ctx.lineWidth = this.isEraser ? Math.max(16, this.strokeWidth * 4) : this.smoothWidth;

        this.hasMoved = true;
        const midX = (this.prevX + currentX) / 2;
        const midY = (this.prevY + currentY) / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastMidX, this.lastMidY);
        this.ctx.quadraticCurveTo(this.prevX, this.prevY, midX, midY);
        this.ctx.stroke();

        this.lastMidX = midX;
        this.lastMidY = midY;
        this.prevX = currentX;
        this.prevY = currentY;
      }
    } else {
      // Fullscreen Shape Live Preview
      const ev = events[events.length - 1];
      const currentX = ev.clientX;
      const currentY = ev.clientY;
      this.hasMoved = true;

      this.ctx.putImageData(this.lastSnapshot, 0, 0);

      this.ctx.strokeStyle = this.strokeWidth >= 12 ? 'rgba(253, 203, 110, 0.45)' : this.color;
      this.ctx.lineWidth = this.strokeWidth;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      const sx = this.shapeStartX;
      const sy = this.shapeStartY;

      if (this.activeTool === 'line') {
        this.ctx.beginPath();
        this.ctx.moveTo(sx, sy);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();
      } else if (this.activeTool === 'rect') {
        const rx = Math.min(sx, currentX);
        const ry = Math.min(sy, currentY);
        const rw = Math.abs(currentX - sx);
        const rh = Math.abs(currentY - sy);
        this.ctx.strokeRect(rx, ry, rw, rh);
      } else if (this.activeTool === 'circle') {
        const rx = Math.abs(currentX - sx) / 2;
        const ry = Math.abs(currentY - sy) / 2;
        const cx = (sx + currentX) / 2;
        const cy = (sy + currentY) / 2;
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (this.activeTool === 'axis') {
        this.ctx.beginPath();
        this.ctx.moveTo(sx, sy); this.ctx.lineTo(currentX, sy);
        this.ctx.moveTo(sx, sy); this.ctx.lineTo(sx, currentY);
        this.ctx.stroke();

        const arrow = Math.max(this.strokeWidth * 2.2, 8);
        const xDir = currentX >= sx ? 1 : -1;
        this.ctx.beginPath();
        this.ctx.moveTo(currentX, sy);
        this.ctx.lineTo(currentX - xDir * arrow, sy - arrow / 1.6);
        this.ctx.lineTo(currentX - xDir * arrow, sy + arrow / 1.6);
        this.ctx.closePath();
        this.ctx.fillStyle = this.color;
        this.ctx.fill();

        const yDir = currentY >= sy ? 1 : -1;
        this.ctx.beginPath();
        this.ctx.moveTo(sx, currentY);
        this.ctx.lineTo(sx - arrow / 1.6, currentY - yDir * arrow);
        this.ctx.lineTo(sx + arrow / 1.6, currentY - yDir * arrow);
        this.ctx.closePath();
        this.ctx.fill();
      }
    }
  },

  stop(e) {
    if (!this.isDrawing) return;
    if (e) e.preventDefault();
    this.isDrawing = false;
    if (e && e.pointerId) {
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }

    if (window.getSelection) {
      try { window.getSelection().removeAllRanges(); } catch (err) {}
    }

    if (this.activeTool === 'pen' && this.hasMoved) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastMidX, this.lastMidY);
      this.ctx.lineTo(this.prevX, this.prevY);
      this.ctx.stroke();
    }

    if (this.lastSnapshot) {
      this.history.push(this.lastSnapshot);
      if (this.history.length > 30) this.history.shift();
      this.lastSnapshot = null;
    }
  },

  undo() {
    if (!this.history || this.history.length === 0) return;
    const prevState = this.history.pop();
    this.ctx.putImageData(prevState, 0, 0);
    AudioEngine.click();
  },

  clear() {
    if (this.ctx && this.canvas) {
      const snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.history.push(snapshot);
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }
    AudioEngine.click();
  },

  startStopwatch() {
    this.secondsElapsed = 0;
    const badge = document.getElementById('dockStopwatch');
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.secondsElapsed++;
      const m = Math.floor(this.secondsElapsed / 60).toString().padStart(2, '0');
      const s = (this.secondsElapsed % 60).toString().padStart(2, '0');
      if (badge) badge.innerText = `⏱️ ${m}:${s}`;
    }, 1000);
  },

  stopStopwatch() {
    clearInterval(this.timerInterval);
  }
};

function setFsTool(tool, btn) {
  FullScreenPen.activeTool = tool;
  FullScreenPen.isEraser = false;

  const dock = btn.closest('.floating-stylus-dock');
  if (dock) {
    dock.querySelectorAll('#btnFsToolPen, #btnFsToolLine, #btnFsToolRect, #btnFsToolCircle, #btnFsToolAxis, #btnFsEraser').forEach(b => b.classList.remove('active'));
  }
  btn.classList.add('active');
  AudioEngine.click();
}

function exportFsCanvasImage() {
  if (!FullScreenPen.canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = FullScreenPen.canvas.width;
  exportCanvas.height = FullScreenPen.canvas.height;
  const ctx = exportCanvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  ctx.drawImage(FullScreenPen.canvas, 0, 0);

  ctx.fillStyle = 'rgba(24, 32, 56, 0.75)';
  ctx.font = `bold ${14 * dpr}px 'Outfit', sans-serif`;
  ctx.fillText('Mr Ahmed Abd El-Motaal • YouTube: mr Motaal • 01019775590', 24 * dpr, exportCanvas.height - 24 * dpr);

  const link = document.createElement('a');
  link.download = `Mr_Motaal_FullScreen_Whiteboard_${Date.now()}.png`;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
  AudioEngine.success();
}

function undoFsCanvas() {
  FullScreenPen.undo();
}

function setFsPenColor(col, dot) {
  FullScreenPen.color = col;
  FullScreenPen.isEraser = false;
  const wrap = dot.parentElement;
  wrap.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');
  const eraserBtn = document.getElementById('btnFsEraser');
  if (eraserBtn) eraserBtn.classList.remove('active');
  AudioEngine.click();
}

function setFsPenWidth(val) {
  FullScreenPen.strokeWidth = parseInt(val, 10);
}

function toggleFsEraser() {
  FullScreenPen.isEraser = !FullScreenPen.isEraser;
  const eraserBtn = document.getElementById('btnFsEraser');
  if (eraserBtn) eraserBtn.classList.toggle('active', FullScreenPen.isEraser);

  if (FullScreenPen.isEraser) {
    const dock = document.querySelector('.floating-stylus-dock');
    if (dock) {
      dock.querySelectorAll('#btnFsToolPen, #btnFsToolLine, #btnFsToolRect, #btnFsToolCircle, #btnFsToolAxis').forEach(b => b.classList.remove('active'));
    }
  }
  AudioEngine.click();
}

function clearFsCanvas() {
  FullScreenPen.clear();
}

function exitFsPenMode() {
  FullScreenPen.exit();
}

// ==========================================================================
// INFINITE CANVAS WHITEBOARD CONTROLLER
// Features: Two-Finger Pinch Zoom, One-Finger Pan, Stylus-Only Strict Mode,
// Palm Rejection, Zero-Latency Handwriting & Math Shapes
// ==========================================================================
const InfiniteWhiteboard = {
  isOpen: false,
  canvas: null,
  ctx: null,
  overlay: null,

  // Viewport transformation (Infinite Canvas)
  panX: 0,
  panY: 0,
  zoom: 1.0,
  minZoom: 0.1,
  maxZoom: 5.0,

  // Settings
  stylusOnlyMode: true, // Default to true as requested by teacher
  color: '#ffffff',
  strokeWidth: 5,
  activeTool: 'pen', // 'pen', 'line', 'rect', 'circle', 'axis', 'eraser', 'hand'
  gridMode: 'math-grid', // 'math-grid', 'dot-grid', 'dark', 'light'
  
  // Data
  strokes: [],
  undoStack: [],
  redoStack: [],

  // Tracking & Drawing State
  isDrawing: false,
  isPenDrawing: false,
  isPanning: false,
  isSingleTouchPanning: false,
  lastPenTime: 0,
  activeTouches: new Map(), // pointerId -> { startX, startY, clientX, clientY, prevX, prevY }
  prevPinchDist: 0,
  prevPinchMidX: 0,
  prevPinchMidY: 0,
  panStartMouseX: 0,
  panStartMouseY: 0,

  // Active stroke in progress
  currentStroke: null,
  lastScreenPt: null,
  lastMidScreenPt: null,
  shapeStartWorld: null,
  shapeCurrentWorld: null,
  smoothWidth: 5,
  eraseSnapshot: null,
  hasErasedAnything: false,

  computeStrokeWidth(baseWidth, pressure, pointerType) {
    if (pointerType === 'pen' && typeof pressure === 'number' && pressure > 0 && pressure <= 1) {
      // Natural responsive curve for Apple Pencil / Stylus pressure
      const eased = Math.pow(pressure, 0.85);
      return Math.max(1, baseWidth * (0.35 + 1.25 * eased));
    }
    return baseWidth;
  },

  distToSegmentSq(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return (px - projX) * (px - projX) + (py - projY) * (py - projY);
  },

  eraseAtPoint(screenX, screenY) {
    const eraserRadius = Math.max(20, this.strokeWidth * 2.5);
    const worldRadius = eraserRadius / this.zoom;
    const worldRadiusSq = worldRadius * worldRadius;
    const worldPt = this.screenToWorld(screenX, screenY);

    let modified = false;
    const nextStrokes = [];

    for (let i = 0; i < this.strokes.length; i++) {
      const s = this.strokes[i];
      if (s.tool === 'pen') {
        if (!s.points || s.points.length === 0) continue;

        let anyHit = false;
        for (let j = 0; j < s.points.length; j++) {
          const p = s.points[j];
          const d2 = (p.x - worldPt.x) * (p.x - worldPt.x) + (p.y - worldPt.y) * (p.y - worldPt.y);
          if (d2 <= worldRadiusSq) {
            anyHit = true;
            break;
          }
          if (j > 0) {
            const prevP = s.points[j - 1];
            if (this.distToSegmentSq(worldPt.x, worldPt.y, prevP.x, prevP.y, p.x, p.y) <= worldRadiusSq) {
              anyHit = true;
              break;
            }
          }
        }

        if (anyHit) {
          modified = true;
          let curChunk = [];
          for (let j = 0; j < s.points.length; j++) {
            const p = s.points[j];
            const d2 = (p.x - worldPt.x) * (p.x - worldPt.x) + (p.y - worldPt.y) * (p.y - worldPt.y);
            if (d2 > worldRadiusSq) {
              curChunk.push(p);
            } else {
              if (curChunk.length > 0) {
                nextStrokes.push({
                  ...s,
                  id: Date.now() + Math.random(),
                  points: curChunk
                });
                curChunk = [];
              }
            }
          }
          if (curChunk.length > 0) {
            nextStrokes.push({
              ...s,
              id: Date.now() + Math.random(),
              points: curChunk
            });
          }
        } else {
          nextStrokes.push(s);
        }
      } else {
        // Geometric Shapes
        if (s.startWorld && s.endWorld) {
          const minX = Math.min(s.startWorld.x, s.endWorld.x) - worldRadius;
          const maxX = Math.max(s.startWorld.x, s.endWorld.x) + worldRadius;
          const minY = Math.min(s.startWorld.y, s.endWorld.y) - worldRadius;
          const maxY = Math.max(s.startWorld.y, s.endWorld.y) + worldRadius;

          if (worldPt.x >= minX && worldPt.x <= maxX && worldPt.y >= minY && worldPt.y <= maxY) {
            modified = true;
          } else {
            nextStrokes.push(s);
          }
        } else {
          nextStrokes.push(s);
        }
      }
    }

    if (modified) {
      this.strokes = nextStrokes;
      this.hasErasedAnything = true;
      this.render();
    }
  },

  drawEraserCursor(screenX, screenY) {
    const dpr = window.devicePixelRatio || 1;
    const eraserRadius = Math.max(20, this.strokeWidth * 2.5);
    this.ctx.save();
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.beginPath();
    this.ctx.arc(screenX, screenY, eraserRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(238, 82, 83, 0.9)';
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(238, 82, 83, 0.15)';
    this.ctx.fill();
    this.ctx.restore();
  },

  init() {
    this.overlay = document.getElementById('infiniteWhiteboardOverlay');
    this.canvas = document.getElementById('infiniteWhiteboardCanvas');
    if (!this.canvas || !this.overlay) return;

    // Direct Context with desynchronized: true for Zero Latency
    this.ctx = this.canvas.getContext('2d', { desynchronized: true, alpha: false });

    // Center the origin in the middle of viewport
    this.panX = window.innerWidth / 2;
    this.panY = window.innerHeight / 2;

    this.resize();
    window.addEventListener('resize', () => {
      if (this.isOpen) {
        this.resize();
        this.render();
      }
    });

    // Touch gesture cancellation on canvas to completely eliminate iOS Safari native magnifiers & callouts
    const preventTouchDefaults = (e) => {
      e.preventDefault();
    };
    this.canvas.addEventListener('touchstart', preventTouchDefaults, { passive: false });
    this.canvas.addEventListener('touchmove', preventTouchDefaults, { passive: false });
    this.canvas.addEventListener('touchend', preventTouchDefaults, { passive: false });
    this.canvas.addEventListener('touchcancel', preventTouchDefaults, { passive: false });
    this.canvas.addEventListener('gesturestart', preventTouchDefaults, { passive: false });
    this.canvas.addEventListener('gesturechange', preventTouchDefaults, { passive: false });
    this.canvas.addEventListener('gestureend', preventTouchDefaults, { passive: false });

    // Touch & Pointer Bindings with passive: false
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e), { passive: false });
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e), { passive: false });
    this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e), { passive: false });
    this.canvas.addEventListener('pointercancel', (e) => this.onPointerCancel(e), { passive: false });

    // Wheel Zooming
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Prevent default context menu and selection on the entire overlay and window when open
    this.overlay.addEventListener('contextmenu', (e) => e.preventDefault());
    this.overlay.addEventListener('selectstart', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => {
      if (this.isOpen) e.preventDefault();
    }, { capture: true });
    document.addEventListener('selectstart', (e) => {
      if (this.isOpen) e.preventDefault();
    }, { capture: true });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => this.onKeyDown(e));

    // Update initial UI
    this.updateStylusIndicator();
    this.updateZoomDisplay();
  },

  resize() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
  },

  open() {
    this.isOpen = true;
    if (this.overlay) this.overlay.classList.add('active');
    this.resize();
    this.render();
    if (window.AudioEngine && typeof AudioEngine.success === 'function') AudioEngine.success();
  },

  close() {
    this.isOpen = false;
    if (this.overlay) this.overlay.classList.remove('active');
    this.activeTouches.clear();
    this.isPenDrawing = false;
    this.isDrawing = false;
    this.isPanning = false;
    this.isSingleTouchPanning = false;
    if (window.AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
  },

  getCanvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  },

  // Coordinate transformations
  screenToWorld(sx, sy) {
    return {
      x: (sx - this.panX) / this.zoom,
      y: (sy - this.panY) / this.zoom
    };
  },

  worldToScreen(wx, wy) {
    return {
      x: wx * this.zoom + this.panX,
      y: wy * this.zoom + this.panY
    };
  },

  // Pointer Down
  onPointerDown(e) {
    e.preventDefault();
    const pt = this.getCanvasPoint(e);

    // 1. PEN HANDLING (Apple Pencil / Stylus)
    if (e.pointerType === 'pen') {
      this.lastPenTime = Date.now();
      this.isPenDrawing = true;
      this.isPanning = false;
      this.isSingleTouchPanning = false;
      this.activeTouches.clear(); // Pen takes total priority; clear any touches

      // DO NOT call setPointerCapture! On iOS WebKit, pointer capture causes pointercancel when palm touches!
      this.startDrawing(pt.x, pt.y, true, e.pressure, e.pointerType);
      return;
    }

    // 2. TOUCH HANDLING (Fingers / Palm)
    if (e.pointerType === 'touch') {
      // PALM REJECTION 1: While pen is touching glass, block all touches!
      if (this.isPenDrawing) {
        return;
      }

      // PALM REJECTION 2: Immunity Window (500ms after pen lift)
      // Resting palm during brief pauses between words or letters must NOT pan the board!
      if (Date.now() - this.lastPenTime < 500) {
        return;
      }

      // PALM REJECTION 3: Broad contact geometry check
      // A finger touch is small; a palm contact has large width/height (>30px).
      if ((e.width && e.width > 30) || (e.height && e.height > 30)) {
        return;
      }

      this.activeTouches.set(e.pointerId, {
        startX: pt.x,
        startY: pt.y,
        clientX: pt.x,
        clientY: pt.y,
        prevX: pt.x,
        prevY: pt.y
      });

      if (this.stylusOnlyMode) {
        // In Stylus Only mode, finger(s) are strictly for Panning & Zooming!
        if (this.activeTouches.size === 1) {
          // Do not pan immediately; wait for drag threshold in pointermove to protect resting palms
          this.isSingleTouchPanning = false;
        } else if (this.activeTouches.size === 2) {
          this.isPanning = true;
          this.isSingleTouchPanning = false;
          const touches = Array.from(this.activeTouches.values());
          const t1 = touches[0];
          const t2 = touches[1];
          this.prevPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          this.prevPinchMidX = (t1.clientX + t2.clientX) / 2;
          this.prevPinchMidY = (t1.clientY + t2.clientY) / 2;
        }
        return;
      } else {
        // Stylus Only is OFF:
        if (this.activeTool === 'hand' || this.activeTouches.size >= 2) {
          this.isPanning = true;
          if (this.activeTouches.size === 2) {
            const touches = Array.from(this.activeTouches.values());
            const t1 = touches[0];
            const t2 = touches[1];
            this.prevPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            this.prevPinchMidX = (t1.clientX + t2.clientX) / 2;
            this.prevPinchMidY = (t1.clientY + t2.clientY) / 2;
          }
        } else {
          this.startDrawing(pt.x, pt.y, false, e.pressure, e.pointerType);
        }
        return;
      }
    }

    // 3. MOUSE HANDLING
    if (e.pointerType === 'mouse') {
      if (e.button === 1 || e.button === 2 || this.activeTool === 'hand' || e.spaceKey) {
        this.isPanning = true;
        this.panStartMouseX = pt.x;
        this.panStartMouseY = pt.y;
        this.canvas.classList.add('cursor-grabbing');
      } else if (e.button === 0) {
        this.startDrawing(pt.x, pt.y, false, e.pressure, e.pointerType);
      }
    }
  },

  // Pointer Move
  onPointerMove(e) {
    e.preventDefault();
    const pt = this.getCanvasPoint(e);

    // 1. PEN HANDLING (Zero Latency Writing, NO PANNING)
    if (e.pointerType === 'pen') {
      this.lastPenTime = Date.now();
      if (!this.isPenDrawing || !this.isDrawing) return;
      this.continueDrawing(e);
      return;
    }

    // 2. TOUCH HANDLING (1-Finger Pan with threshold, 2-Finger Pinch Zoom)
    if (e.pointerType === 'touch') {
      if (this.isPenDrawing) return; // Strict palm rejection
      if (Date.now() - this.lastPenTime < 500) return; // Palm immunity window
      if (!this.activeTouches.has(e.pointerId)) return;

      const touch = this.activeTouches.get(e.pointerId);
      touch.prevX = touch.clientX;
      touch.prevY = touch.clientY;
      touch.clientX = pt.x;
      touch.clientY = pt.y;

      if (this.stylusOnlyMode || this.activeTool === 'hand' || this.activeTouches.size >= 2) {
        if (this.activeTouches.size === 1) {
          // ONE-FINGER PAN: Require 8px drag threshold so resting palms don't jitter the canvas
          const totalDist = Math.hypot(touch.clientX - touch.startX, touch.clientY - touch.startY);
          if (!this.isSingleTouchPanning && totalDist > 8) {
            this.isSingleTouchPanning = true;
            this.canvas.classList.add('cursor-grabbing');
          }

          if (this.isSingleTouchPanning) {
            const dx = touch.clientX - touch.prevX;
            const dy = touch.clientY - touch.prevY;
            this.panX += dx;
            this.panY += dy;
            this.render();
          }
        } else if (this.activeTouches.size >= 2) {
          // TWO-FINGER PINCH TO ZOOM & TWO-FINGER PAN
          const touches = Array.from(this.activeTouches.values()).slice(0, 2);
          const t1 = touches[0];
          const t2 = touches[1];
          const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          const currentMidX = (t1.clientX + t2.clientX) / 2;
          const currentMidY = (t1.clientY + t2.clientY) / 2;

          if (this.prevPinchDist > 0 && currentDist > 0) {
            const zoomFactor = currentDist / this.prevPinchDist;
            const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * zoomFactor));

            // Zoom centered on the midpoint between the two fingers
            const worldMid = this.screenToWorld(currentMidX, currentMidY);
            this.zoom = newZoom;
            this.panX = currentMidX - worldMid.x * this.zoom + (currentMidX - this.prevPinchMidX);
            this.panY = currentMidY - worldMid.y * this.zoom + (currentMidY - this.prevPinchMidY);

            this.updateZoomDisplay();
            this.render();
          }

          this.prevPinchDist = currentDist;
          this.prevPinchMidX = currentMidX;
          this.prevPinchMidY = currentMidY;
        }
        return;
      } else {
        // Finger drawing when Stylus Only is OFF
        if (this.isDrawing) {
          this.continueDrawing(e);
        }
        return;
      }
    }

    // 3. MOUSE HANDLING
    if (e.pointerType === 'mouse') {
      if (this.isPanning) {
        const dx = pt.x - this.panStartMouseX;
        const dy = pt.y - this.panStartMouseY;
        this.panX += dx;
        this.panY += dy;
        this.panStartMouseX = pt.x;
        this.panStartMouseY = pt.y;
        this.render();
      } else if (this.isDrawing) {
        this.continueDrawing(e);
      }
    }
  },

  // Pointer Up
  onPointerUp(e) {
    e.preventDefault();

    if (e.pointerType === 'pen') {
      this.lastPenTime = Date.now();
      if (this.isPenDrawing) {
        this.finishDrawing();
        this.isPenDrawing = false;
      }
      return;
    }

    if (e.pointerType === 'touch') {
      this.activeTouches.delete(e.pointerId);
      if (this.activeTouches.size === 0) {
        this.isPanning = false;
        this.isSingleTouchPanning = false;
        this.canvas.classList.remove('cursor-grabbing');
        this.prevPinchDist = 0;
      } else if (this.activeTouches.size === 1) {
        this.prevPinchDist = 0;
      }
      if (this.isDrawing) {
        this.finishDrawing();
      }
      return;
    }

    if (e.pointerType === 'mouse') {
      if (this.isPanning) {
        this.isPanning = false;
        this.canvas.classList.remove('cursor-grabbing');
      }
      if (this.isDrawing) {
        this.finishDrawing();
      }
    }
  },

  onPointerCancel(e) {
    if (e.pointerType === 'pen') {
      this.lastPenTime = Date.now();
      // Only finalize if pen was actually lifted from glass (buttons === 0)
      if (e.buttons === 0) {
        this.onPointerUp(e);
      }
      return;
    }
    this.onPointerUp(e);
  },

  // Mouse Wheel Zoom
  onWheel(e) {
    e.preventDefault();
    const pt = this.getCanvasPoint(e);
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * zoomFactor));

    // Zoom centered on mouse location
    const worldPoint = this.screenToWorld(pt.x, pt.y);
    this.zoom = newZoom;
    this.panX = pt.x - worldPoint.x * this.zoom;
    this.panY = pt.y - worldPoint.y * this.zoom;

    this.updateZoomDisplay();
    this.render();
  },

  // Start Drawing Stroke
  startDrawing(screenX, screenY, isPen, pressure, pointerType) {
    if (this.activeTool === 'eraser') {
      this.isDrawing = true;
      this.lastScreenPt = { x: screenX, y: screenY };
      this.eraseSnapshot = [...this.strokes];
      this.hasErasedAnything = false;
      this.eraseAtPoint(screenX, screenY);
      this.drawEraserCursor(screenX, screenY);
      return;
    }

    this.isDrawing = true;
    const worldPt = this.screenToWorld(screenX, screenY);
    this.shapeStartWorld = worldPt;
    this.shapeCurrentWorld = worldPt;

    this.lastScreenPt = { x: screenX, y: screenY };
    this.lastMidScreenPt = { x: screenX, y: screenY };

    const initialWidth = this.computeStrokeWidth(this.strokeWidth, pressure, pointerType);
    this.smoothWidth = initialWidth;
    worldPt.w = initialWidth;

    this.currentStroke = {
      id: Date.now() + Math.random(),
      tool: this.activeTool,
      color: this.color,
      width: this.strokeWidth,
      points: [worldPt]
    };

    // For freehand pen, draw initial dot directly on canvas for 0-latency instant feedback
    if (this.activeTool === 'pen') {
      const dpr = window.devicePixelRatio || 1;
      this.ctx.save();
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Screen coordinates
      this.ctx.beginPath();
      const dotRadius = Math.max((initialWidth * this.zoom) / 2, 1);
      this.ctx.arc(screenX, screenY, dotRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.strokeWidth >= 20 ? this.getHighlighterColor() : this.color;
      this.ctx.fill();
      this.ctx.restore();
    }
  },

  // Continue Drawing (Using Coalesced Events for Maximum Precision, Zero Latency & Pressure Smoothing)
  continueDrawing(e) {
    const rect = this.canvas.getBoundingClientRect();

    if (this.activeTool === 'eraser') {
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;
      const dist = Math.hypot(curX - this.lastScreenPt.x, curY - this.lastScreenPt.y);
      const steps = Math.max(1, Math.ceil(dist / 6));
      for (let s = 1; s <= steps; s++) {
        const ix = this.lastScreenPt.x + (curX - this.lastScreenPt.x) * (s / steps);
        const iy = this.lastScreenPt.y + (curY - this.lastScreenPt.y) * (s / steps);
        this.eraseAtPoint(ix, iy);
      }
      this.lastScreenPt = { x: curX, y: curY };
      this.drawEraserCursor(curX, curY);
      return;
    }

    if (!this.currentStroke) return;

    const events = (typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length > 0)
      ? e.getCoalescedEvents()
      : [e];

    const dpr = window.devicePixelRatio || 1;

    if (this.activeTool === 'pen') {
      this.ctx.save();
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Direct screen rendering
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = this.strokeWidth >= 20 ? this.getHighlighterColor() : this.color;

      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        const curScreenX = ev.clientX - rect.left;
        const curScreenY = ev.clientY - rect.top;

        const dx = curScreenX - this.lastScreenPt.x;
        const dy = curScreenY - this.lastScreenPt.y;
        if (dx * dx + dy * dy < 0.25) continue; // Skip sub-micro jitter

        const targetW = this.computeStrokeWidth(this.strokeWidth, ev.pressure, ev.pointerType);
        this.smoothWidth = this.smoothWidth * 0.65 + targetW * 0.35;

        const midX = (this.lastScreenPt.x + curScreenX) / 2;
        const midY = (this.lastScreenPt.y + curScreenY) / 2;

        // Quadratic Bezier stroke directly rendered in real-time with pressure width
        this.ctx.lineWidth = Math.max(1, this.smoothWidth * this.zoom);
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastMidScreenPt.x, this.lastMidScreenPt.y);
        this.ctx.quadraticCurveTo(this.lastScreenPt.x, this.lastScreenPt.y, midX, midY);
        this.ctx.stroke();

        this.lastMidScreenPt = { x: midX, y: midY };
        this.lastScreenPt = { x: curScreenX, y: curScreenY };

        // Save into world coordinates with dynamic point width
        const worldPt = this.screenToWorld(curScreenX, curScreenY);
        worldPt.w = this.smoothWidth;
        this.currentStroke.points.push(worldPt);
      }

      this.ctx.restore();
    } else {
      // Geometric Shapes (Line, Rect, Circle, Axis): Render live preview
      const lastEv = events[events.length - 1];
      const curX = lastEv.clientX - rect.left;
      const curY = lastEv.clientY - rect.top;
      this.shapeCurrentWorld = this.screenToWorld(curX, curY);
      this.render(); // Redraw board and render live shape preview
    }
  },

  // Finish Drawing
  finishDrawing() {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.activeTool === 'eraser') {
      this.render(); // Clear eraser cursor ring, leaving clean canvas with grid
      if (this.hasErasedAnything && this.eraseSnapshot) {
        this.undoStack.push({
          type: 'erase_batch',
          before: this.eraseSnapshot,
          after: [...this.strokes]
        });
        this.redoStack = [];
        if (window.AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
      }
      this.eraseSnapshot = null;
      this.hasErasedAnything = false;
      return;
    }

    if (this.activeTool === 'pen') {
      if (this.currentStroke && this.currentStroke.points.length > 0) {
        this.pushStroke(this.currentStroke);
      }
    } else {
      // Shape tool: finalize stroke
      const shapeStroke = {
        id: Date.now() + Math.random(),
        tool: this.activeTool,
        color: this.color,
        width: this.strokeWidth,
        startWorld: this.shapeStartWorld,
        endWorld: this.shapeCurrentWorld
      };
      this.pushStroke(shapeStroke);
      this.render();
    }

    this.currentStroke = null;
    this.shapeStartWorld = null;
    this.shapeCurrentWorld = null;
  },

  pushStroke(stroke) {
    this.strokes.push(stroke);
    this.undoStack.push(stroke);
    this.redoStack = []; // Clear redo stack on new action
  },

  undo() {
    if (this.undoStack.length === 0) return;
    const action = this.undoStack.pop();
    if (action.type === 'erase_batch') {
      this.strokes = [...action.before];
      this.redoStack.push(action);
    } else {
      const idx = this.strokes.indexOf(action);
      if (idx !== -1) {
        this.strokes.splice(idx, 1);
      } else {
        this.strokes.pop();
      }
      this.redoStack.push(action);
    }
    this.render();
    if (window.AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
  },

  redo() {
    if (this.redoStack.length === 0) return;
    const action = this.redoStack.pop();
    if (action.type === 'erase_batch') {
      this.strokes = [...action.after];
      this.undoStack.push(action);
    } else {
      this.strokes.push(action);
      this.undoStack.push(action);
    }
    this.render();
    if (window.AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
  },

  clear() {
    if (this.strokes.length === 0) return;
    if (confirm('Clear the entire infinite whiteboard?')) {
      this.undoStack.push([...this.strokes]);
      this.strokes = [];
      this.redoStack = [];
      this.render();
      if (window.AudioEngine && typeof AudioEngine.success === 'function') AudioEngine.success();
    }
  },

  // Rendering Engine
  render() {
    if (!this.ctx || !this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;

    // Clear background
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.fillStyle = this.getBackgroundColor();
    this.ctx.fillRect(0, 0, width, height);

    // Draw Infinite Grid
    this.drawGrid(width, height);

    // Set Transformation Matrix for World Coordinates
    this.ctx.setTransform(
      dpr * this.zoom,
      0,
      0,
      dpr * this.zoom,
      dpr * this.panX,
      dpr * this.panY
    );

    // Draw Stored Strokes
    for (let i = 0; i < this.strokes.length; i++) {
      this.renderStroke(this.strokes[i]);
    }

    // Draw In-Progress Shape Preview
    if (this.isDrawing && this.shapeStartWorld && this.shapeCurrentWorld && this.activeTool !== 'pen' && this.activeTool !== 'eraser') {
      this.renderShape(
        this.activeTool,
        this.shapeStartWorld,
        this.shapeCurrentWorld,
        this.color,
        this.strokeWidth
      );
    }
  },

  renderStroke(s) {
    if (s.tool === 'pen') {
      if (!s.points || s.points.length === 0) return;
      this.ctx.save();
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = s.width >= 20 ? this.getHighlighterColor() : s.color;
      this.ctx.fillStyle = s.width >= 20 ? this.getHighlighterColor() : s.color;

      if (s.points.length === 1) {
        const p = s.points[0];
        const r = (p.w || s.width) / 2;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        let lastMidX = s.points[0].x;
        let lastMidY = s.points[0].y;
        for (let j = 1; j < s.points.length; j++) {
          const pt = s.points[j];
          const prevPt = s.points[j - 1];
          const midX = (prevPt.x + pt.x) / 2;
          const midY = (prevPt.y + pt.y) / 2;
          this.ctx.beginPath();
          this.ctx.lineWidth = pt.w || s.width;
          this.ctx.moveTo(lastMidX, lastMidY);
          this.ctx.quadraticCurveTo(prevPt.x, prevPt.y, midX, midY);
          this.ctx.stroke();
          lastMidX = midX;
          lastMidY = midY;
        }
        const lastPt = s.points[s.points.length - 1];
        this.ctx.beginPath();
        this.ctx.lineWidth = lastPt.w || s.width;
        this.ctx.moveTo(lastMidX, lastMidY);
        this.ctx.lineTo(lastPt.x, lastPt.y);
        this.ctx.stroke();
      }
      this.ctx.restore();
    } else {
      this.renderShape(s.tool, s.startWorld, s.endWorld, s.color, s.width);
    }
  },

  renderShape(tool, start, end, color, width) {
    this.ctx.save();
    this.ctx.strokeStyle = width >= 20 ? this.getHighlighterColor() : color;
    this.ctx.fillStyle = width >= 20 ? this.getHighlighterColor() : color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const sx = start.x;
    const sy = start.y;
    const ex = end.x;
    const ey = end.y;

    if (tool === 'line') {
      this.ctx.beginPath();
      this.ctx.moveTo(sx, sy);
      this.ctx.lineTo(ex, ey);
      this.ctx.stroke();
    } else if (tool === 'rect') {
      const rx = Math.min(sx, ex);
      const ry = Math.min(sy, ey);
      const rw = Math.abs(ex - sx);
      const rh = Math.abs(ey - sy);
      this.ctx.strokeRect(rx, ry, rw, rh);
    } else if (tool === 'circle') {
      const rx = Math.abs(ex - sx) / 2;
      const ry = Math.abs(ey - sy) / 2;
      const cx = (sx + ex) / 2;
      const cy = (sy + ey) / 2;
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
      this.ctx.stroke();
    } else if (tool === 'axis') {
      // Coordinate Cartesian Axes
      this.ctx.beginPath();
      // X Axis
      this.ctx.moveTo(sx, sy);
      this.ctx.lineTo(ex, sy);
      // Y Axis
      this.ctx.moveTo(sx, sy);
      this.ctx.lineTo(sx, ey);
      this.ctx.stroke();

      // Arrow heads
      const arrow = Math.max(width * 2.5, 8);
      const xDir = ex >= sx ? 1 : -1;
      const yDir = ey >= sy ? 1 : -1;

      // X arrow
      this.ctx.beginPath();
      this.ctx.moveTo(ex, sy);
      this.ctx.lineTo(ex - arrow * xDir, sy - arrow * 0.5);
      this.ctx.lineTo(ex - arrow * xDir, sy + arrow * 0.5);
      this.ctx.closePath();
      this.ctx.fill();

      // Y arrow
      this.ctx.beginPath();
      this.ctx.moveTo(sx, ey);
      this.ctx.lineTo(sx - arrow * 0.5, ey - arrow * yDir);
      this.ctx.lineTo(sx + arrow * 0.5, ey - arrow * yDir);
      this.ctx.closePath();
      this.ctx.fill();

      // Origin dot
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, Math.max(width * 0.8, 3), 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  },

  // Draw Grid Lines or Dots
  drawGrid(width, height) {
    if (this.gridMode === 'dark' || this.gridMode === 'light') return;

    const dpr = window.devicePixelRatio || 1;
    this.ctx.save();
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const stepWorld = 50; // 50px grid in world space
    const stepScreen = stepWorld * this.zoom;

    if (stepScreen < 10) {
      this.ctx.restore();
      return; // Skip if too dense
    }

    const startX = (this.panX % stepScreen);
    const startY = (this.panY % stepScreen);

    if (this.gridMode === 'math-grid') {
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';

      this.ctx.beginPath();
      for (let x = startX; x <= width; x += stepScreen) {
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, height);
      }
      for (let y = startY; y <= height; y += stepScreen) {
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(width, y);
      }
      this.ctx.stroke();

      // Major grid lines every 5 steps
      const majorStep = stepScreen * 5;
      const majorStartX = (this.panX % majorStep);
      const majorStartY = (this.panY % majorStep);

      this.ctx.beginPath();
      this.ctx.strokeStyle = 'rgba(108, 92, 231, 0.22)';
      this.ctx.lineWidth = 1.5;
      for (let x = majorStartX; x <= width; x += majorStep) {
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, height);
      }
      for (let y = majorStartY; y <= height; y += majorStep) {
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(width, y);
      }
      this.ctx.stroke();
    } else if (this.gridMode === 'dot-grid') {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
      const dotRadius = Math.max(1, Math.min(2.5, 1.5 * this.zoom));
      for (let x = startX; x <= width; x += stepScreen) {
        for (let y = startY; y <= height; y += stepScreen) {
          this.ctx.beginPath();
          this.ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    this.ctx.restore();
  },

  getBackgroundColor() {
    if (this.gridMode === 'light') return '#f8f9fc';
    return '#0f141c'; // Classic math chalkboard dark slate
  },

  getHighlighterColor() {
    return 'rgba(254, 211, 48, 0.4)';
  },

  // Stylus Only Mode Toggle
  toggleStylusOnly() {
    this.stylusOnlyMode = !this.stylusOnlyMode;
    this.updateStylusIndicator();
    if (window.AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
  },

  updateStylusIndicator() {
    const btn = document.getElementById('wbStylusOnlyBtn');
    const tag = document.getElementById('wbStylusStatusTag');
    const txt = btn?.querySelector('.wb-stylus-btn-text');

    if (this.stylusOnlyMode) {
      if (btn) btn.classList.add('active');
      if (txt) txt.innerText = 'Stylus Only: ON';
      if (tag) {
        tag.classList.remove('disabled');
        tag.innerHTML = '<i class="fa-solid fa-pen-nib"></i> Stylus Only Active';
      }
    } else {
      if (btn) btn.classList.remove('active');
      if (txt) txt.innerText = 'Stylus Only: OFF';
      if (tag) {
        tag.classList.add('disabled');
        tag.innerHTML = '<i class="fa-solid fa-hand"></i> Touch Drawing Enabled';
      }
    }
  },

  // Zoom Controls
  zoomIn() {
    this.setZoomAtCenter(this.zoom * 1.25);
    if (window.AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
  },

  zoomOut() {
    this.setZoomAtCenter(this.zoom * 0.8);
    if (window.AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
  },

  setZoomAtCenter(newZoom) {
    const clamped = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const worldCenter = this.screenToWorld(cx, cy);

    this.zoom = clamped;
    this.panX = cx - worldCenter.x * this.zoom;
    this.panY = cy - worldCenter.y * this.zoom;

    this.updateZoomDisplay();
    this.render();
  },

  resetView() {
    this.zoom = 1.0;
    this.panX = window.innerWidth / 2;
    this.panY = window.innerHeight / 2;
    this.updateZoomDisplay();
    this.render();
    if (window.AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
  },

  updateZoomDisplay() {
    const badge = document.getElementById('wbZoomDisplay');
    if (badge) {
      badge.innerText = `${Math.round(this.zoom * 100)}%`;
    }
  },

  // Color & Width Settings
  setColor(col, btn) {
    this.color = col;
    if (this.activeTool === 'eraser') {
      this.setTool('pen', document.getElementById('wbToolPen'));
    }
    const wrap = btn?.parentElement;
    if (wrap) {
      wrap.querySelectorAll('.wb-color-circle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    if (window.AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
  },

  setWidth(w, btn) {
    this.strokeWidth = parseInt(w, 10);
    const wrap = btn?.parentElement;
    if (wrap) {
      wrap.querySelectorAll('.wb-stroke-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    if (window.AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
  },

  setTool(tool, btn) {
    this.activeTool = tool;
    const dock = document.getElementById('wbFloatingDock');
    if (dock) {
      dock.querySelectorAll('.wb-tools-group .wb-dock-btn').forEach(b => b.classList.remove('active'));
    }
    if (btn) btn.classList.add('active');

    // Update cursor
    if (this.canvas) {
      this.canvas.classList.toggle('cursor-hand', tool === 'hand');
    }
    if (window.AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
  },

  cycleGrid() {
    const modes = ['math-grid', 'dot-grid', 'dark', 'light'];
    const idx = modes.indexOf(this.gridMode);
    this.gridMode = modes[(idx + 1) % modes.length];

    const label = document.getElementById('wbGridLabel');
    if (label) {
      if (this.gridMode === 'math-grid') label.innerText = 'Math Grid';
      else if (this.gridMode === 'dot-grid') label.innerText = 'Dot Grid';
      else if (this.gridMode === 'dark') label.innerText = 'Dark Board';
      else if (this.gridMode === 'light') label.innerText = 'Light Board';
    }
    this.render();
    if (window.AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
  },

  // Export Board Snapshot as High-Resolution PNG
  exportPNG() {
    const dpr = window.devicePixelRatio || 1;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.canvas.width;
    exportCanvas.height = this.canvas.height;
    const expCtx = exportCanvas.getContext('2d');

    // Draw current canvas
    expCtx.drawImage(this.canvas, 0, 0);

    // Watermark credentials
    expCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    expCtx.font = `bold ${16 * dpr}px 'Outfit', sans-serif`;
    expCtx.fillText('Mr Ahmed Abd El-Motaal • YouTube: mr Motaal • 01019775590', 28 * dpr, exportCanvas.height - 24 * dpr);

    const link = document.createElement('a');
    link.download = `Mr_Motaal_Math_Whiteboard_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
    if (window.AudioEngine && typeof AudioEngine.success === 'function') AudioEngine.success();
  },

  // Keyboard Navigation
  onKeyDown(e) {
    if (!this.isOpen) return;

    if (e.key === 'Escape') {
      this.close();
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.redo();
        else this.undo();
        return;
      }
      if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.redo();
        return;
      }
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        this.zoomIn();
        return;
      }
      if (e.key === '-') {
        e.preventDefault();
        this.zoomOut();
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        this.resetView();
        return;
      }
    }

    // Single key tool selectors (only if not typing in an input)
    if (['input', 'textarea', 'select'].includes(document.activeElement?.tagName?.toLowerCase())) return;

    const k = e.key.toLowerCase();
    if (k === 'p') this.setTool('pen', document.getElementById('wbToolPen'));
    else if (k === 'e') this.setTool('eraser', document.getElementById('wbToolEraser'));
    else if (k === 'l') this.setTool('line', document.getElementById('wbToolLine'));
    else if (k === 'r') this.setTool('rect', document.getElementById('wbToolRect'));
    else if (k === 'c') this.setTool('circle', document.getElementById('wbToolCircle'));
    else if (k === 'a') this.setTool('axis', document.getElementById('wbToolAxis'));
    else if (k === 'h') this.setTool('hand', document.getElementById('wbToolHand'));
  }
};

function openWhiteboard() {
  InfiniteWhiteboard.open();
}

// ==========================================================================
// 3. MULTI-LESSON DATA STORE (PROPORTION & QUADRATIC)
// Data loaded via modular scripts: proportion_data.js & quadratic_data.js
// ==========================================================================
let currentLessonKey = 'quadratic';

// ==========================================================================
// 4. RENDERING & LESSON SWITCHING
// ==========================================================================
let mcqScore = 0;
let mcqAnswered = 0;
let activeQuizModelIndex = 0;
let quizUserAnswers = {};
let quizTimerSeconds = 600;
let quizTimerInterval = null;
let quizSubmitted = false;

// ==========================================================================
// RESIZABLE WORKSPACE & INTERACTIVE SOLUTION ENGINES
// ==========================================================================
let isResizingCanvas = false;
let currentResizeWrap = null;
let startY = 0;
let startHeight = 0;

function startCanvasResize(e, wrapId) {
  e.preventDefault();
  isResizingCanvas = true;
  currentResizeWrap = document.getElementById(wrapId);
  if (!currentResizeWrap) return;
  startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
  startHeight = currentResizeWrap.offsetHeight;

  const onMove = (ev) => {
    if (!isResizingCanvas || !currentResizeWrap) return;
    const clientY = ev.clientY || (ev.touches && ev.touches[0].clientY) || 0;
    const deltaY = clientY - startY;
    const newHeight = Math.max(200, Math.min(900, startHeight + deltaY));
    currentResizeWrap.style.height = newHeight + 'px';
    const canvas = currentResizeWrap.querySelector('canvas');
    if (canvas && StylusEngine.canvases[canvas.id]) {
      const inst = StylusEngine.canvases[canvas.id];
      inst.height = newHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.height = newHeight * dpr;
      canvas.style.height = newHeight + 'px';
      inst.ctx.scale(dpr, dpr);
      StylusEngine.restoreCanvas(canvas.id);
    }
  };

  const onEnd = () => {
    isResizingCanvas = false;
    currentResizeWrap = null;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onEnd);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onEnd);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onEnd);
}

function adjustCanvasHeight(wrapId, delta) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const canvas = wrap.querySelector('canvas');
  if (!canvas) return;
  const inst = StylusEngine.canvases[canvas.id];
  if (!inst) return;

  const currentHeight = wrap.offsetHeight || inst.height || 300;
  const newHeight = Math.max(200, Math.min(1200, currentHeight + delta));
  if (newHeight === currentHeight) return;

  const tempUrl = canvas.toDataURL();
  const dpr = window.devicePixelRatio || 1;

  wrap.style.height = newHeight + 'px';
  inst.height = newHeight;
  canvas.style.height = newHeight + 'px';
  canvas.width = inst.width * dpr;
  canvas.height = newHeight * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.strokeStyle = inst.color;
  ctx.lineWidth = inst.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  inst.ctx = ctx;

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, inst.width, currentHeight);
  };
  img.src = tempUrl;

  AudioEngine.click();
}

function toggleSolutionReveal(btn) {
  const wrap = btn.closest('.solution-reveal-wrap') || btn.parentElement;
  if (!wrap) return;
  const body = wrap.querySelector('.revealed-solution-body') || wrap.querySelector('.try-it-solution-drawer');
  if (!body) return;
  const isHidden = (body.style.display === 'none' || !body.style.display);
  body.style.display = isHidden ? 'block' : 'none';
  btn.classList.toggle('active', isHidden);
  const span = btn.querySelector('span');
  if (span) {
    span.innerText = isHidden ? 'Hide Detailed Solution' : 'Reveal Detailed Step-by-Step Solution';
  }
  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-lightbulb';
  }
  AudioEngine.click();
}

function handleReadinessChoice(qId, optIdx, isCorrect, btn) {
  const card = btn.closest('.readiness-q-card');
  if (!card) return;
  
  card.querySelectorAll('.readiness-opt-btn').forEach(b => {
    b.classList.remove('selected-correct', 'selected-wrong', 'highlight-correct');
  });

  if (isCorrect) {
    btn.classList.add('selected-correct');
    AudioEngine.success();
    // Micro celebratory burst
    triggerCardSparkles(btn);
  } else {
    btn.classList.add('selected-wrong');
    btn.classList.add('shake-anim');
    setTimeout(() => btn.classList.remove('shake-anim'), 500);
    AudioEngine.error();
    
    // Softly reveal which one was correct to maximize learning
    card.querySelectorAll('.readiness-opt-btn').forEach(b => {
      if (b.getAttribute('onclick')?.includes('true')) {
        b.classList.add('highlight-correct');
      }
    });
  }

  card.setAttribute('data-answered', isCorrect ? 'correct' : 'wrong');
  const exp = card.querySelector('.readiness-explanation');
  if (exp) {
    exp.style.display = 'block';
    exp.classList.add('fade-slide-in');
  }

  updateReadinessScore();
}

function triggerCardSparkles(targetElement) {
  const rect = targetElement.getBoundingClientRect();
  const container = document.createElement('div');
  container.className = 'sparkle-burst-container';
  container.style.position = 'fixed';
  container.style.left = `${rect.left + rect.width / 2}px`;
  container.style.top = `${rect.top + rect.height / 2}px`;
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';

  const colors = ['#00b894', '#6c5ce7', '#fdcb6e', '#0984e3', '#ff7675'];
  for (let i = 0; i < 14; i++) {
    const particle = document.createElement('span');
    particle.className = 'sparkle-particle';
    const angle = (Math.PI * 2 * i) / 14;
    const dist = 30 + Math.random() * 35;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    particle.style.setProperty('--dx', `${x}px`);
    particle.style.setProperty('--dy', `${y}px`);
    particle.style.backgroundColor = colors[i % colors.length];
    container.appendChild(particle);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 750);
}

function updateReadinessScore() {
  const allCards = document.querySelectorAll('.readiness-q-card');
  if (!allCards.length) return;
  const correctCount = document.querySelectorAll('.readiness-q-card[data-answered="correct"]').length;
  const total = allCards.length;
  const badgeText = document.getElementById('readinessScoreText');
  if (badgeText) {
    if (correctCount === total) {
      badgeText.innerHTML = `🎉 100% Ready (${correctCount}/${total})! Ready to Master the Lesson!`;
    } else {
      badgeText.innerHTML = `Readiness Progress: ${correctCount} / ${total} Correct`;
    }
  }
}

function generateCalcTable() {
  const funcSelect = document.getElementById('calcFuncSelect');
  const startInput = document.getElementById('calcStartVal');
  const endInput = document.getElementById('calcEndVal');
  const stepInput = document.getElementById('calcStepVal');
  const outputWrap = document.getElementById('calcOutputTableWrap');
  if (!funcSelect || !startInput || !endInput || !stepInput || !outputWrap) return;

  const funcType = funcSelect.value;
  const start = parseFloat(startInput.value);
  const end = parseFloat(endInput.value);
  const step = Math.max(0.1, parseFloat(stepInput.value) || 1);

  if (start > end) {
    alert('Start value must be less than or equal to End value.');
    return;
  }

  let evaluate = (x) => x * x - 2 * x - 3;
  let vertexX = 1;
  if (funcType === 'ex1') {
    evaluate = (x) => x * x - 2 * x - 3;
    vertexX = 1;
  } else if (funcType === 'ex2') {
    evaluate = (x) => -x * x + 6 * x - 5;
    vertexX = 3;
  } else if (funcType === 'try1') {
    evaluate = (x) => 3 * x - x * x;
    vertexX = 1.5;
  } else if (funcType === 'try2') {
    evaluate = (x) => (x - 2) * (x - 2) - 4;
    vertexX = 2;
  } else if (funcType === 'vertex1') {
    evaluate = (x) => 5 - 2 * (x + 1) * (x + 1);
    vertexX = -1;
  }

  let html = `
    <table class="calc-table">
      <thead>
        <tr>
          <th>#</th>
          <th>x</th>
          <th>f(x)</th>
          <th>Point (x, f(x))</th>
          <th>Analysis</th>
        </tr>
      </thead>
      <tbody>
  `;

  let rowNum = 1;
  for (let x = start; x <= end + 0.001; x += step) {
    const roundX = Math.round(x * 100) / 100;
    const roundY = Math.round(evaluate(roundX) * 100) / 100;
    const isVertex = Math.abs(roundX - vertexX) < 0.01;
    const isRoot = Math.abs(roundY) < 0.01;
    const isYInt = Math.abs(roundX) < 0.01;

    let notes = '';
    if (isVertex) notes += '<span class="badge" style="background:#eb4d4b;color:#fff;padding:2px 6px;border-radius:10px;font-size:10px;">Vertex</span> ';
    if (isRoot) notes += '<span class="badge" style="background:#00b894;color:#fff;padding:2px 6px;border-radius:10px;font-size:10px;">Root</span> ';
    if (isYInt) notes += '<span class="badge" style="background:#6c5ce7;color:#fff;padding:2px 6px;border-radius:10px;font-size:10px;">y-Intercept</span> ';

    html += `
      <tr class="${isVertex ? 'vertex-row' : ''}">
        <td>${rowNum++}</td>
        <td><strong>${roundX}</strong></td>
        <td><strong>${roundY}</strong></td>
        <td>(${roundX}, ${roundY})</td>
        <td>${notes || '—'}</td>
      </tr>
    `;
  }

  html += `</tbody></table>`;
  outputWrap.innerHTML = html;
  AudioEngine.success();
}

// ==========================================================================
// MCQ RANDOMIZATION UTILITY (SHUFFLE OPTIONS & MAINTAIN CORRECT ANSWER)
// ==========================================================================
function randomizeMCQ(q) {
  if (!q || !Array.isArray(q.options) || q.options.length <= 1) return q;

  const originalOptions = q.options;
  const originalCorrect = (typeof q.correct === 'number') ? q.correct : 0;

  // Create array of original indices [0, 1, 2, 3]
  const indices = originalOptions.map((_, i) => i);

  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;
  }

  const shuffledOptions = indices.map(i => originalOptions[i]);
  const newCorrectIndex = indices.indexOf(originalCorrect);

  return {
    ...q,
    options: shuffledOptions,
    correct: newCorrectIndex
  };
}

// ==========================================================================
// LESSON LOADER & CONTROLLER
// ==========================================================================
function loadLesson(lessonKey) {
  currentLessonKey = lessonKey || localStorage.getItem('math_active_lesson') || 'similarity';
  localStorage.setItem('math_active_lesson', currentLessonKey);
  AudioEngine.click();

  // Choose data source based on current lesson
  let data = null;
  if (currentLessonKey === 'similarity' && typeof LESSON_SIMILARITY !== 'undefined') {
    data = LESSON_SIMILARITY;
  } else if (currentLessonKey === 'quadratic' && typeof LESSON_QUADRATIC !== 'undefined') {
    data = LESSON_QUADRATIC;
  } else if (currentLessonKey === 'proportion' && typeof LESSON_PROPORTION !== 'undefined') {
    data = LESSON_PROPORTION;
  } else if (typeof LESSON_SIMILARITY !== 'undefined') {
    data = LESSON_SIMILARITY;
    currentLessonKey = 'similarity';
  } else if (typeof LESSON_QUADRATIC !== 'undefined') {
    data = LESSON_QUADRATIC;
    currentLessonKey = 'quadratic';
  } else if (typeof LESSON_PROPORTION !== 'undefined') {
    data = LESSON_PROPORTION;
    currentLessonKey = 'proportion';
  }

  if (!data) return;

  // Update Header Stage
  const headerStage = document.getElementById('headerStageBadge');
  if (headerStage && data.stageBadge) {
    headerStage.innerHTML = data.stageBadge;
  }

  // Update Lesson Switcher Pills in Dock
  const btnProp = document.getElementById('btnLessonProportion');
  const btnQuad = document.getElementById('btnLessonQuadratic');
  const btnSim = document.getElementById('btnLessonSimilarity');
  [
    { btn: btnProp, key: 'proportion' },
    { btn: btnQuad, key: 'quadratic' },
    { btn: btnSim, key: 'similarity' }
  ].forEach(item => {
    if (item.btn) {
      item.btn.classList.toggle('active', currentLessonKey === item.key);
      const existingTag = item.btn.querySelector('.mini-tag');
      if (currentLessonKey === item.key) {
        if (!existingTag) item.btn.insertAdjacentHTML('beforeend', ' <span class="mini-tag">Active</span>');
      } else if (existingTag) {
        existingTag.remove();
      }
    }
  });

  // 1. Update Hero Banner
  const unitTag = document.getElementById('heroUnitTag');
  const title = document.getElementById('heroLessonTitle');
  const sub = document.getElementById('heroLessonSubtitle');
  if (unitTag) unitTag.innerHTML = data.unitTag;
  if (title) title.innerText = data.title;
  if (sub) sub.innerText = data.subtitle;

  // Update hero 3D visuals
  const visualBox = document.querySelector('.hero-3d-visual');
  if (visualBox) {
    if (currentLessonKey === 'proportion') {
      visualBox.innerHTML = `
        <span class="floating-shape s1">⚖️</span>
        <span class="floating-shape s2">🍰</span>
        <span class="floating-shape s3">🚀</span>
      `;
    } else if (currentLessonKey === 'similarity') {
      visualBox.innerHTML = `
        <span class="floating-shape s1">📐</span>
        <span class="floating-shape s2">🔷</span>
        <span class="floating-shape s3">🔶</span>
      `;
    } else {
      visualBox.innerHTML = `
        <span class="floating-shape s1">📐</span>
        <span class="floating-shape s2">📈</span>
        <span class="floating-shape s3">🎯</span>
      `;
    }
  }

  // 2. Render Tab 1 (Concept & Practice with Pre-Study & Resizable Workspaces)
  renderConceptTab(data);

  // 3. Render Tab 2 (MCQ Bank)
  renderMCQBank(data.mcqs);

  // 4. Render Tab 3 (Quiz Engine)
  initQuizModel(0, data.quizModels);

  // Switch to Tab 1 (Concept)
  switchTab('tab-concept');

  // Re-render KaTeX math formulas
  setTimeout(() => {
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ]
      });
    }
    // Initialize all Resizable Workspaces & Stylus Canvases automatically
    document.querySelectorAll('.stylus-canvas').forEach(canvas => {
      StylusEngine.initCanvas(canvas.id);
    });
  }, 100);
}

function renderWorkspaceWidget(canvasId, wrapId) {
  return `
    <div class="notebook-workspace" id="ws-${canvasId}">
      <div class="stylus-toolbar">
        <!-- Row 1: Drawing & Mathematical Shape Tools + Quick Utilities -->
        <div class="toolbar-row toolbar-row-top">
          <div class="toolbar-group">
            <button class="tool-btn active" onclick="setCanvasTool('${canvasId}', 'pen', this)" title="Pen Tool">
              <i class="fa-solid fa-pen"></i> Pen
            </button>
            <button class="tool-btn" onclick="setCanvasTool('${canvasId}', 'line', this)" title="Straight Line Tool">
              <i class="fa-solid fa-ruler"></i> Line
            </button>
            <button class="tool-btn" onclick="setCanvasTool('${canvasId}', 'rect', this)" title="Box / Rectangle Tool">
              <i class="fa-regular fa-square"></i> Box
            </button>
            <button class="tool-btn" onclick="setCanvasTool('${canvasId}', 'circle', this)" title="Circle Tool">
              <i class="fa-regular fa-circle"></i> Circle
            </button>
            <button class="tool-btn" onclick="setCanvasTool('${canvasId}', 'axis', this)" title="Coordinate Axes (X-Y Plane)">
              <i class="fa-solid fa-chart-line"></i> Axes
            </button>
            <button class="tool-btn" onclick="setCanvasMode('${canvasId}', 'text', this)" title="Type mathematical steps">
              <i class="fa-solid fa-keyboard"></i> Type
            </button>
            <button class="tool-btn" onclick="setCanvasEraser('${canvasId}', this)" title="Eraser Tool">
              <i class="fa-solid fa-eraser"></i> Eraser
            </button>
            <button class="tool-btn btn-undo" onclick="undoCanvas('${canvasId}')" title="Undo last stroke">
              <i class="fa-solid fa-rotate-left"></i> Undo
            </button>
          </div>

          <div class="toolbar-group">
            <button class="tool-btn" onclick="toggleCanvasGrid('${wrapId}', this)" title="Grid / Graph Paper Overlay">
              <i class="fa-solid fa-border-all"></i> Grid
            </button>
            <button class="tool-btn btn-export-board" onclick="exportCanvasImage('${canvasId}')" title="Save Board as High-Resolution Image">
              <i class="fa-solid fa-camera"></i> Save Board
            </button>
            <button class="tool-btn stylus-indicator active" onclick="toggleStylusMode(this)" title="Stylus Only Mode (Palm Rejection Active)">
              <i class="fa-solid fa-pen-nib"></i> <span class="stylus-mode-text">Stylus Only</span>
            </button>
          </div>
        </div>

        <!-- Row 2: Color Palette, Stroke Width, Clear & Autosave Status -->
        <div class="toolbar-row toolbar-row-bottom">
          <div class="toolbar-group">
            <div class="color-dot active" style="background:#182038;" onclick="setCanvasColor('${canvasId}', '#182038', this)" title="Navy Black"></div>
            <div class="color-dot" style="background:#6c5ce7;" onclick="setCanvasColor('${canvasId}', '#6c5ce7', this)" title="Purple"></div>
            <div class="color-dot" style="background:#eb4d4b;" onclick="setCanvasColor('${canvasId}', '#eb4d4b', this)" title="Red"></div>
            <div class="color-dot" style="background:#00b894;" onclick="setCanvasColor('${canvasId}', '#00b894', this)" title="Mint Green"></div>
            <div class="color-dot" style="background:#fdcb6e;" onclick="setCanvasColor('${canvasId}', '#fdcb6e', this)" title="Golden Yellow"></div>

            <select class="stroke-select" onchange="setCanvasWidth('${canvasId}', this.value)" title="Stroke Width">
              <option value="2">Fine 2px</option>
              <option value="4" selected>Medium 4px</option>
              <option value="7">Bold 7px</option>
            </select>

            <button class="tool-btn" onclick="clearCanvasPrompt('${canvasId}')" title="Clear Canvas">
              <i class="fa-solid fa-trash-can"></i> Clear
            </button>
          </div>

          <div class="autosave-indicator">
            <span class="autosave-dot"></span>
            <span>Auto-saved to Storage</span>
          </div>
        </div>
      </div>

      <div class="notebook-canvas-wrap" id="${wrapId}">
        <canvas id="${canvasId}" class="stylus-canvas"></canvas>
        <textarea id="${canvasId.replace('can-', 'text-')}" class="typed-text-layer" placeholder="Type your step-by-step mathematical derivation here..."></textarea>
      </div>

      <!-- Canvas Height Expansion / Shrink Controls -->
      <div class="workspace-resize-bar">
        <div class="resize-drag-indicator">
          <i class="fa-solid fa-arrows-up-down"></i> <span>Drag Bar to Resize Workspace Vertically</span>
        </div>
        <div class="workspace-size-btns">
          <button class="btn-resize-ctrl" onclick="adjustCanvasHeight('${wrapId}', 140)" title="Expand Workspace Height">+ Expand</button>
          <button class="btn-resize-ctrl" onclick="adjustCanvasHeight('${wrapId}', -140)" title="Shrink Workspace Height">- Shrink</button>
        </div>
      </div>
    </div>
  `;
}

function renderConceptTab(data) {
  const container = document.getElementById('lessonConceptDynamicContainer');
  if (!container) return;

  // 1. PRE-STUDY & PREREQUISITES REVIEW SECTION (IF AVAILABLE)
  let preStudyHtml = '';
  if (data.preStudy) {
    const ps = data.preStudy;
    preStudyHtml = `
      <section class="pre-study-section">
        <div class="pre-study-header">
          <div class="pre-study-title-group">
            <h2><i class="fa-solid fa-graduation-cap" style="color:var(--primary);"></i> ${ps.title}</h2>
            <p style="color:var(--text-secondary); margin-top:0.3rem;">${ps.subtitle}</p>
          </div>
          <span class="pre-study-badge"><i class="fa-solid fa-clock-rotate-left"></i> Prerequisite Review</span>
        </div>

        <div class="pre-study-grid">
          ${ps.cards.map(c => `
            <div class="pre-study-card">
              <div class="pre-study-card-head">
                <div class="pre-study-card-icon" style="background:${c.iconBg};">
                  <i class="${c.icon}"></i>
                </div>
                <h3>${c.title}</h3>
              </div>
              <div class="pre-study-card-body">
                ${c.desc}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="readiness-quiz-container">
          <div class="readiness-quiz-head">
            <div class="readiness-quiz-title">
              <i class="fa-solid fa-list-check" style="color:#00b894;"></i>
              <span>Diagnostic Check: Test Your Readiness</span>
            </div>
            <div class="readiness-quiz-status">
              <span class="pill-badge readiness-score-badge" id="readinessScoreText">
                <i class="fa-solid fa-star" style="color:#fdcb6e;"></i> 0 / ${(ps.diagnosticQuestions || []).length} Mastered
              </span>
            </div>
          </div>
          <div class="readiness-questions-list">
            ${((ps.diagnosticQuestions || []).map(randomizeMCQ)).map((q, qIdx, arr) => {
              const optionLetters = ['A', 'B', 'C', 'D'];
              return `
              <div class="readiness-q-card" id="${q.id}">
                <div class="readiness-q-meta">
                  <span class="readiness-q-badge">Question ${qIdx + 1} of ${arr.length}</span>
                </div>
                <div class="readiness-q-text">${q.text}</div>
                <div class="readiness-options-grid">
                  ${q.options.map((opt, optIdx) => `
                    <button class="readiness-opt-btn" onclick="handleReadinessChoice('${q.id}', ${optIdx}, ${optIdx === q.correct}, this)">
                      <span class="opt-letter">${optionLetters[optIdx]}</span>
                      <span class="opt-text">${opt}</span>
                    </button>
                  `).join('')}
                </div>
                <div class="readiness-explanation">
                  <strong><i class="fa-solid fa-circle-info"></i> Explanation:</strong> ${q.explanation}
                </div>
              </div>
            `;}).join('')}
          </div>
        </div>
      </section>
    `;
  }

  // 2. REAL-WORLD APPLICATIONS (VISUAL SHOWCASE & MATHEMATICAL COMMENTARY - NO SOLVING WORKSPACE)
  const appsHtml = data.realWorldApps.map((app, idx) => `
    <article class="rw-showcase-card" style="border-top: 4px solid ${app.accent}; margin-top: 1.5rem;">
      <div class="rw-showcase-header">
        <div class="rw-showcase-badge" style="background: ${app.accent}; color: #fff;">
          <i class="${app.icon}"></i> ${app.tag} • ${app.title}
        </div>
        <span class="pill-badge" style="background: rgba(0, 184, 148, 0.12); color: #00b894;">
          <i class="fa-solid fa-earth-americas"></i> STEM Real-World Application
        </span>
      </div>
      <p class="rw-showcase-desc">${app.desc}</p>
      ${app.svg ? `<div class="rw-visual-box">${app.svg}</div>` : ''}
      <div class="rw-commentary-box">
        <div class="rw-commentary-header">
          <i class="fa-solid fa-lightbulb" style="color: #f1c40f;"></i>
          <strong>Mathematical Connection & STEM Analysis:</strong>
        </div>
        <div class="rw-commentary-content">
          ${app.commentaryHtml || app.solutionHtml || ''}
        </div>
      </div>
    </article>
  `).join('');

  // 3. CORE FOUNDATIONS & SPECIAL CASES
  const f = data.foundation;
  const rulesHtml = f.rules.map(r => `
    <div class="rule-pill-card">
      <span class="rule-num">${r.num}</span>
      <div>
        <h4>${r.title}</h4>
        <p>${r.desc}</p>
      </div>
    </div>
  `).join('');

  const casesHtml = data.specialCases.map(c => `
    <article class="encyclo-card">
      <h4><i class="${c.icon}" style="color:var(--primary);"></i> ${c.title}</h4>
      <div class="encyclo-diagram">${c.diagramSvg}</div>
      <ul class="encyclo-list">
        ${c.items.map(it => `<li><span>•</span> ${it}</li>`).join('')}
      </ul>
    </article>
  `).join('');

  // 4. INTERACTIVE CASIO TABLE GENERATOR WIDGET (TEXTBOOK PAGE 6)
  const casioSimulatorHtml = `
    <div class="calc-simulator-card">
      <div class="calc-simulator-header">
        <div class="calc-simulator-title">
          <i class="fa-solid fa-microchip"></i>
          <span>Casio fx TABLE Mode Simulator</span>
        </div>
        <span class="pill-badge" style="background:rgba(0,210,211,0.2); color:#00d2d3;">Page 6 Textbook Activity</span>
      </div>
      <p style="font-size:0.9rem; color:#d2dae2; margin-bottom:1.2rem;">
        As demonstrated in Page 6 of the textbook, enter the function rule and interval boundaries to generate the exact $(x, f(x))$ coordinate table:
      </p>
      <div class="calc-controls-row">
        <div class="calc-control-group">
          <label>Function Rule $f(x)$:</label>
          <select id="calcFuncSelect">
            <option value="ex1">f(x) = x² - 2x - 3 (Example 1.1)</option>
            <option value="ex2">f(x) = -x² + 6x - 5 (Example 1.2)</option>
            <option value="try1">f(x) = 3x - x² (Self-Assessment 1)</option>
            <option value="try2">f(x) = (x - 2)² - 4 (Self-Assessment 2)</option>
            <option value="vertex1">f(x) = 5 - 2(x + 1)² (Example 2.1)</option>
          </select>
        </div>
        <div class="calc-control-group">
          <label>Start Value:</label>
          <input type="number" id="calcStartVal" value="-2">
        </div>
        <div class="calc-control-group">
          <label>End Value:</label>
          <input type="number" id="calcEndVal" value="4">
        </div>
        <div class="calc-control-group">
          <label>Step Size:</label>
          <input type="number" id="calcStepVal" value="1" min="0.5" step="0.5">
        </div>
        <button class="calc-generate-btn" onclick="generateCalcTable()">
          <i class="fa-solid fa-play"></i> Generate Table of Values
        </button>
      </div>
      <div class="calc-output-table-wrap" id="calcOutputTableWrap">
        <p style="text-align:center; color:#a4b0be; font-size:0.9rem; padding:1.5rem 0;">
          Click "Generate Table of Values" to inspect coordinate points and vertex identification.
        </p>
      </div>
    </div>
  `;

  // 5. INSTRUCTIONAL IDEAS (ALL WITH DIRECT ACTIVE NOTEBOOK WORKSPACES & HIDDEN MODEL SOLUTIONS)
  const ideasHtml = data.ideas.map(idea => {
    let cardsHtml = '';
    if (Array.isArray(idea.cards) && idea.cards.length > 0) {
      cardsHtml = idea.cards.map((card, cIdx) => {
        const isTryIt = card.type === 'try';
        const canvasId = card.canvasId || `can-c-${idea.id}-${cIdx + 1}`;
        const wrapId = card.wrapId || `can-wrap-c-${idea.id}-${cIdx + 1}`;
        const solId = card.solId || `sol-c-${idea.id}-${cIdx + 1}`;
        const badgeGrad = card.badgeGradient || (isTryIt ? 'linear-gradient(135deg, #00b894, #55efc4)' : (card.accent ? `linear-gradient(135deg, ${card.accent}, ${card.accent}dd)` : 'linear-gradient(135deg, #6c5ce7, #8075e5)'));
        const badgeIcon = card.icon || (isTryIt ? 'fa-solid fa-pencil' : 'fa-solid fa-chalkboard-user');
        
        return `
          <article class="try-it-card ${isTryIt ? '' : 'solved-example-card'}" style="margin-top: 1.8rem; border-color: ${card.accent || (isTryIt ? '#00b894' : '#6c5ce7')};">
            <div class="try-it-header">
              <div class="try-it-badge" style="background: ${badgeGrad}; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">
                <i class="${badgeIcon}"></i> ${card.tag}
              </div>
              <span class="pill-badge" style="background: rgba(108, 92, 231, 0.12); color: var(--primary);">iPad Apple Pencil Workspace</span>
            </div>
            
            <div class="try-it-prompt" style="font-size: 1.18rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.85rem; line-height: 1.65;">
              ${card.q}
            </div>

            ${card.svg ? `<div class="diagram-frame-box" style="margin-bottom: 1.2rem; padding: 1.2rem; background: #ffffff; border-radius: 16px; border: 1.5px solid #eef0f7; box-shadow: inset 0 2px 8px rgba(0,0,0,0.03); overflow-x: auto;">${card.svg}</div>` : ''}

            <!-- Teacher / Student Workspace for this exact single question -->
            ${renderWorkspaceWidget(canvasId, wrapId)}

            <button class="show-solution-btn" onclick="toggleSolutionDrawer('${solId}', this)">
              <i class="fa-solid fa-eye"></i> <span>Show Model Solution</span>
            </button>
            <div id="${solId}" class="try-it-solution-drawer" style="display:none;">
              ${card.steps ? `
                <div class="solution-steps-accordion">
                  ${card.steps.map(st => `
                    <div class="step-row">
                      <span class="step-num-pill">${st.num}</span>
                      <div class="step-body">${st.text}</div>
                    </div>
                  `).join('')}
                  ${card.ans ? `
                    <div class="final-answer-badge">
                      <i class="fa-solid fa-circle-check"></i> ${card.ans}
                    </div>
                  ` : ''}
                </div>
              ` : `
                <div style="line-height:1.7; color:var(--text-main);">
                  ${card.solutionHtml}
                </div>
              `}
            </div>
          </article>
        `;
      }).join('');
    } else {
      // Legacy fallback for proportion and quadratic
      cardsHtml = `
        <article class="try-it-card solved-example-card">
          <div class="try-it-header">
            <div class="try-it-badge" style="background: linear-gradient(135deg, #6c5ce7, #8075e5); box-shadow: 0 4px 12px rgba(108, 92, 231, 0.35);">
              <i class="fa-solid fa-chalkboard-user"></i> ${idea.ex1Tag}
            </div>
            <span class="pill-badge" style="background: rgba(108, 92, 231, 0.12); color: var(--primary);">iPad Apple Pencil Workspace</span>
          </div>
          <div class="try-it-prompt" style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem;">
            ${idea.ex1Q}
          </div>
          ${idea.ex1Svg ? `<div class="diagram-frame-box" style="margin-bottom: 1rem;">${idea.ex1Svg}</div>` : ''}
          ${renderWorkspaceWidget(`can-ex1-${idea.id}`, `can-wrap-ex1-${idea.id}`)}
          <button class="show-solution-btn" onclick="toggleSolutionDrawer('sol-ex1-${idea.id}', this)">
            <i class="fa-solid fa-eye"></i> <span>Show Model Solution</span>
          </button>
          <div id="sol-ex1-${idea.id}" class="try-it-solution-drawer" style="display:none;">
            <div class="solution-steps-accordion">
              ${idea.ex1Steps ? idea.ex1Steps.map(st => `
                <div class="step-row">
                  <span class="step-num-pill">${st.num}</span>
                  <div class="step-body">${st.text}</div>
                </div>
              `).join('') : ''}
              ${idea.ex1Ans ? `
                <div class="final-answer-badge">
                  <i class="fa-solid fa-circle-check"></i> ${idea.ex1Ans}
                </div>
              ` : ''}
            </div>
          </div>
        </article>

        ${idea.ex2Q ? `
        <article class="try-it-card solved-example-card" style="border-color: #6c5ce7; margin-top: 2rem;">
          <div class="try-it-header">
            <div class="try-it-badge" style="background: linear-gradient(135deg, #0984e3, #74b9ff); box-shadow: 0 4px 12px rgba(9, 132, 227, 0.35);">
              <i class="fa-solid fa-chalkboard-user"></i> ${idea.ex2Tag}
            </div>
            <span class="pill-badge" style="background: rgba(108, 92, 231, 0.12); color: var(--primary);">iPad Apple Pencil Workspace</span>
          </div>
          <div class="try-it-prompt" style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem;">
            ${idea.ex2Q}
          </div>
          ${idea.ex2Svg ? `<div class="diagram-frame-box" style="margin-bottom: 1rem;">${idea.ex2Svg}</div>` : ''}
          ${renderWorkspaceWidget(`can-ex2-${idea.id}`, `can-wrap-ex2-${idea.id}`)}
          <button class="show-solution-btn" onclick="toggleSolutionDrawer('sol-ex2-${idea.id}', this)">
            <i class="fa-solid fa-eye"></i> <span>Show Model Solution</span>
          </button>
          <div id="sol-ex2-${idea.id}" class="try-it-solution-drawer" style="display:none;">
            <div class="solution-steps-accordion">
              ${idea.ex2Steps ? idea.ex2Steps.map(st => `
                <div class="step-row">
                  <span class="step-num-pill">${st.num}</span>
                  <div class="step-body">${st.text}</div>
                </div>
              `).join('') : ''}
              ${idea.ex2Ans ? `
                <div class="final-answer-badge">
                  <i class="fa-solid fa-circle-check"></i> ${idea.ex2Ans}
                </div>
              ` : ''}
            </div>
          </div>
        </article>
        ` : ''}

        ${idea.tryPrompt ? `
        <div class="try-it-card">
          <div class="try-it-header">
            <div class="try-it-badge">
              <i class="fa-solid fa-pencil"></i> ${idea.tryBadge}
            </div>
            <span class="pill-badge" style="background: rgba(108, 92, 231, 0.12); color: var(--primary);">iPad Apple Pencil Workspace</span>
          </div>
          <div class="try-it-prompt" style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem;">
            ${idea.tryPrompt}
          </div>
          ${renderWorkspaceWidget(idea.tryCanvasId, `can-wrap-try-${idea.id}`)}
          <button class="show-solution-btn" onclick="toggleSolutionDrawer('${idea.trySolId || `sol-try-${idea.id}`}', this)">
            <i class="fa-solid fa-eye"></i> <span>Show Model Solution</span>
          </button>
          <div id="${idea.trySolId || `sol-try-${idea.id}`}" class="try-it-solution-drawer" style="display:none;">
            <h4 style="color:var(--accent-mint); font-weight:800; margin-bottom:0.75rem;"><i class="fa-solid fa-check-circle"></i> Model Solution:</h4>
            <div style="line-height:1.7; color:var(--text-main);">
              ${idea.trySolution}
            </div>
          </div>
        </div>
        ` : ''}
      `;
    }

    return `
      <section class="idea-block">
        <div class="pedagogical-flashcard">
          <div class="flashcard-badge-3d">${idea.badge}</div>
          <div class="flashcard-content">
            <span class="pill-badge" style="background:rgba(225,112,85,0.2); color:#d63031; margin-bottom:0.4rem;">Concept Flashcard & Strategy Guide</span>
            <h3>${idea.flashcardTitle}</h3>
            <p>${idea.flashcardText}</p>
          </div>
        </div>
        ${cardsHtml}
      </section>
    `;
  }).join('');

  container.innerHTML = `
    <!-- 1. Pre-Study & Readiness Review Module -->
    ${preStudyHtml}

    <!-- 2. Real-World Connections -->
    <div class="section-title-wrap">
      <h2 class="section-title">
        <span class="title-icon">🌍</span>
        <span>Real-World Connections (Mathematics in Everyday Life)</span>
      </h2>
      <span class="pill-badge">Precision Plots & Modeling</span>
    </div>
    <div class="real-world-grid">${appsHtml}</div>

    <!-- 3. Core Mathematical Foundation Card -->
    <section class="foundation-card">
      <div class="foundation-header">
        <span class="foundation-badge"><i class="fa-solid fa-shield-halved"></i> Essential Curriculum Standards</span>
        <span style="font-weight:700; color:var(--text-muted); font-size:0.9rem;">Definitions & Standard Forms</span>
      </div>
      <div class="foundation-rules-grid">${rulesHtml}</div>
    </section>

    <!-- 4. Special Cases & Graphical Representation -->
    <section class="special-cases-section">
      <div class="section-title-wrap">
        <h2 class="section-title">
          <span class="title-icon">🏛️</span>
          <span>${data.key === 'quadratic' ? 'Encyclopedic Guide: Orientation, Vertex & Extrema' : (data.key === 'similarity' ? 'Special Quadrilateral Criteria & Regular Polygons' : 'Special Cases, Graphical Models & Geometric Properties')}</span>
        </h2>
        <span class="pill-badge">Geometric Analysis</span>
      </div>
      <div class="special-cases-grid">${casesHtml}</div>
    </section>

    <!-- 5. Casio Table Simulator Widget (Quadratic Activity) -->
    ${data.key === 'quadratic' ? casioSimulatorHtml : ''}

    <!-- 6. Main Instructional Ideas (All with Precision Graphs, Hidden Solutions, & Resizable Workspaces) -->
    ${ideasHtml}

    <!-- 7. Interactive Self-Assessment Understanding Meter -->
    <div class="comprehension-eval-card" style="margin-top: 3rem; background: linear-gradient(135deg, #ffffff, #f8f9fe); border: 2px solid var(--border-color); border-radius: 20px; padding: 1.8rem; box-shadow: var(--shadow-sm); text-align: center;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 0.6rem;">
        <span style="font-size: 1.5rem;">⭐</span>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 0;">Self-Assessment Reflection</h3>
      </div>
      <p style="font-size: 1rem; color: var(--text-muted); margin-bottom: 1.5rem;">
        How confident do you feel with ${data.title}? Click your current level:
      </p>
      <div class="emoji-ratings-grid" style="display: flex; justify-content: center; gap: 1.2rem; flex-wrap: wrap;">
        <button class="emoji-rating-btn" onclick="rateUnderstanding(1, this)" style="background: rgba(235, 77, 75, 0.1); border: 2px solid #eb4d4b; border-radius: 16px; padding: 1rem 1.4rem; cursor: pointer; transition: all 0.25s ease;">
          <div style="font-size: 2rem;">🤔</div>
          <div style="font-size: 0.85rem; font-weight: 800; color: #eb4d4b; margin-top: 0.4rem;">Need Practice</div>
        </button>
        <button class="emoji-rating-btn" onclick="rateUnderstanding(2, this)" style="background: rgba(241, 196, 15, 0.1); border: 2px solid #f1c40f; border-radius: 16px; padding: 1rem 1.4rem; cursor: pointer; transition: all 0.25s ease;">
          <div style="font-size: 2rem;">💡</div>
          <div style="font-size: 0.85rem; font-weight: 800; color: #d69e2e; margin-top: 0.4rem;">Getting It</div>
        </button>
        <button class="emoji-rating-btn" onclick="rateUnderstanding(3, this)" style="background: rgba(9, 132, 227, 0.1); border: 2px solid #0984e3; border-radius: 16px; padding: 1rem 1.4rem; cursor: pointer; transition: all 0.25s ease;">
          <div style="font-size: 2rem;">😃</div>
          <div style="font-size: 0.85rem; font-weight: 800; color: #0984e3; margin-top: 0.4rem;">Good Understanding</div>
        </button>
        <button class="emoji-rating-btn" onclick="rateUnderstanding(4, this)" style="background: rgba(0, 184, 148, 0.1); border: 2px solid #00b894; border-radius: 16px; padding: 1rem 1.4rem; cursor: pointer; transition: all 0.25s ease;">
          <div style="font-size: 2rem;">🏆</div>
          <div style="font-size: 0.85rem; font-weight: 800; color: #00b894; margin-top: 0.4rem;">Mastered Confidently</div>
        </button>
      </div>
      <div id="selfRatingFeedback" style="margin-top: 1rem; font-weight: 800; font-size: 1rem; color: var(--primary);"></div>
    </div>
  `;
}

function rateUnderstanding(level, btn) {
  AudioEngine.success();
  document.querySelectorAll('.emoji-rating-btn').forEach(b => {
    b.style.transform = 'scale(1)';
    b.style.boxShadow = 'none';
  });
  btn.style.transform = 'scale(1.08)';
  btn.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
  const msgs = [
    '💪 Keep practicing! Review the worked examples and use the stylus workspace to re-try step-by-step.',
    '👍 Great progress! Try the Try-It exercises and practice MCQs to solidify your intuition.',
    '🌟 Excellent! You have a solid grasp of core theorems and algebraic setups.',
    '🏆 Outstanding! You are fully prepared for advanced exam problems and higher-order applications!'
  ];
  const fb = document.getElementById('selfRatingFeedback');
  if (fb) fb.innerHTML = msgs[level - 1];
  localStorage.setItem(`math_rating_${currentLessonKey}`, level);
}

// ==========================================================================
// 5. MCQ REVISION BANK (10 QUESTIONS)
// ==========================================================================
let currentMCQs = [];
let rawMCQList = null;

function renderMCQBank(mcqList) {
  if (mcqList) rawMCQList = mcqList;
  const source = rawMCQList || ((typeof LESSON_QUADRATIC !== 'undefined') ? LESSON_QUADRATIC.mcqs : (typeof LESSON_PROPORTION !== 'undefined' ? LESSON_PROPORTION.mcqs : []));
  currentMCQs = (source || []).map(randomizeMCQ);
  mcqScore = 0;
  mcqAnswered = 0;

  const total = currentMCQs.length;
  const dial = document.getElementById('mcqScoreDial');
  const status = document.getElementById('mcqStatusText');
  if (dial) dial.innerText = `0/${total}`;
  if (status) status.innerText = `Not Started`;

  const container = document.getElementById('mcqQuestionsList');
  if (!container) return;

  container.innerHTML = '';
  currentMCQs.forEach((q, idx) => {
    const qId = (q.id !== undefined) ? q.id : (idx + 1);
    q.id = qId;

    const card = document.createElement('article');
    card.className = 'mcq-card';
    card.id = `mcq-card-${qId}`;

    const letters = ['A', 'B', 'C', 'D'];
    const optionsHtml = q.options.map((opt, optIdx) => `
      <button class="mcq-option-btn" id="mcq-opt-${qId}-${optIdx}" onclick="handleMCQSelect(${qId}, ${optIdx})">
        <span class="option-letter-badge">${letters[optIdx]}</span>
        <span>${opt}</span>
      </button>
    `).join('');

    card.innerHTML = `
      <span class="mcq-number-pill">Question ${qId} of ${total}</span>
      <p class="mcq-question-text">${q.q}</p>
      ${q.diagramSvg ? `<div class="mcq-diagram-wrap" style="display:flex; justify-content:center; align-items:center; margin:1rem 0; background:rgba(248,249,254,0.8); border:1px solid var(--border-color); border-radius:12px; padding:1rem; overflow-x:auto;">${q.diagramSvg}</div>` : ''}
      <div class="mcq-options-grid">
        ${optionsHtml}
      </div>
      <div class="mcq-explanation-drawer" id="mcq-exp-${qId}">
        <h5><i class="fa-solid fa-graduation-cap"></i> Complete Mathematical Proof:</h5>
        <p>${q.proof}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

function handleMCQSelect(qId, selectedIdx) {
  const q = currentMCQs.find(item => item.id == qId) || currentMCQs[qId - 1];
  if (!q) return;

  const card = document.getElementById(`mcq-card-${qId}`);
  if (!card) return;

  const buttons = card.querySelectorAll('.mcq-option-btn');
  buttons.forEach(btn => btn.disabled = true);

  const selectedBtn = document.getElementById(`mcq-opt-${qId}-${selectedIdx}`);
  const correctBtn = document.getElementById(`mcq-opt-${qId}-${q.correct}`);

  if (selectedIdx === q.correct) {
    if (selectedBtn) selectedBtn.classList.add('correct');
    AudioEngine.success();
    mcqScore++;
  } else {
    if (selectedBtn) selectedBtn.classList.add('wrong');
    if (correctBtn) correctBtn.classList.add('correct');
    AudioEngine.wrong();
  }

  mcqAnswered++;
  const total = currentMCQs.length;
  const dial = document.getElementById('mcqScoreDial');
  const status = document.getElementById('mcqStatusText');
  if (dial) dial.innerText = `${mcqScore}/${total}`;
  if (status) status.innerText = `${mcqAnswered} of ${total} Answered`;

  const drawer = document.getElementById(`mcq-exp-${qId}`);
  if (drawer) drawer.style.display = 'block';
}

// ==========================================================================
// 6. TIMED QUIZ - 10 MARKS (3 MODELS • 30 QUESTIONS)
// ==========================================================================
let currentQuizModels = [];
let rawQuizModels = null;

function initQuizModel(modelIdx, modelsList) {
  if (modelsList) rawQuizModels = modelsList;
  if (rawQuizModels && rawQuizModels.length > 0) {
    currentQuizModels = rawQuizModels.map(m => ({
      ...m,
      questions: (m.questions || []).map(randomizeMCQ)
    }));
  }
  activeQuizModelIndex = modelIdx;
  quizUserAnswers = {};
  quizSubmitted = false;
  quizTimerSeconds = 600;

  const titleEl = document.getElementById('quizActiveModelTitle');
  if (titleEl && currentQuizModels[modelIdx]) titleEl.innerText = currentQuizModels[modelIdx].title;

  const tabs = document.querySelectorAll('.model-tab-btn');
  tabs.forEach((tab, i) => tab.classList.toggle('active', i === modelIdx));

  const report = document.getElementById('quizFeedbackReport');
  if (report) report.style.display = 'none';
  const submitBar = document.getElementById('submitQuizBar');
  if (submitBar) submitBar.style.display = 'block';

  renderQuizQuestions();
  updateQuizProgress();
  startQuizTimer();
}

function switchQuizModel(modelIdx) {
  if (!quizSubmitted && Object.keys(quizUserAnswers).length > 0) {
    if (!confirm("Switching quiz models will reset your ongoing 10-minute quiz. Continue?")) return;
  }
  AudioEngine.click();
  initQuizModel(modelIdx);
}

function renderQuizQuestions() {
  const container = document.getElementById('quizQuestionsContainer');
  if (!container) return;

  const currentModel = currentQuizModels[activeQuizModelIndex];
  container.innerHTML = '';

  currentModel.questions.forEach((qItem, qIdx) => {
    const card = document.createElement('article');
    card.className = 'quiz-question-card';
    card.id = `quiz-q-card-${qIdx}`;

    const letters = ['A', 'B', 'C', 'D'];
    const optionsHtml = qItem.options.map((opt, optIdx) => `
      <button class="mcq-option-btn" id="quiz-opt-${qIdx}-${optIdx}" onclick="selectQuizAnswer(${qIdx}, ${optIdx})">
        <span class="option-letter-badge">${letters[optIdx]}</span>
        <span>${opt}</span>
      </button>
    `).join('');

    card.innerHTML = `
      <p style="font-family:var(--font-heading); font-size:1.1rem; font-weight:700; margin-bottom:1rem; color:var(--text-main);">
        ${qItem.q}
      </p>
      ${qItem.diagramSvg ? `<div class="quiz-diagram-wrap" style="display:flex; justify-content:center; align-items:center; margin:1rem 0; background:rgba(248,249,254,0.8); border:1px solid var(--border-color); border-radius:12px; padding:1rem; overflow-x:auto;">${qItem.diagramSvg}</div>` : ''}
      <div class="mcq-options-grid">
        ${optionsHtml}
      </div>
    `;

    container.appendChild(card);
  });

  if (window.renderMathInElement) {
    renderMathInElement(container, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ]
    });
  }
}

function selectQuizAnswer(qIdx, optIdx) {
  if (quizSubmitted) return;

  quizUserAnswers[qIdx] = optIdx;
  AudioEngine.click();

  const card = document.getElementById(`quiz-q-card-${qIdx}`);
  if (card) {
    card.querySelectorAll('.mcq-option-btn').forEach((btn, idx) => {
      btn.classList.toggle('correct', idx === optIdx);
    });
  }

  updateQuizProgress();
}

function updateQuizProgress() {
  const answeredCount = Object.keys(quizUserAnswers).length;
  const fill = document.getElementById('quizProgressFill');
  if (fill) fill.style.width = `${(answeredCount / 10) * 100}%`;
}

function startQuizTimer() {
  clearInterval(quizTimerInterval);
  const timerText = document.getElementById('quizTimerText');
  const timerBox = document.getElementById('quizTimerBox');

  quizTimerInterval = setInterval(() => {
    if (quizTimerSeconds <= 0) {
      clearInterval(quizTimerInterval);
      submitQuizAssessment(true);
      return;
    }

    quizTimerSeconds--;
    const mins = Math.floor(quizTimerSeconds / 60).toString().padStart(2, '0');
    const secs = (quizTimerSeconds % 60).toString().padStart(2, '0');
    if (timerText) timerText.innerText = `${mins}:${secs}`;

    if (quizTimerSeconds <= 30) {
      timerBox.className = 'timer-pill-box danger';
    } else if (quizTimerSeconds <= 120) {
      timerBox.className = 'timer-pill-box warning';
    } else {
      timerBox.className = 'timer-pill-box';
    }
  }, 1000);
}

function submitQuizAssessment(isAuto = false) {
  if (quizSubmitted) return;

  const answeredCount = Object.keys(quizUserAnswers).length;
  if (!isAuto && answeredCount < 10) {
    if (!confirm(`You have answered ${answeredCount} of 10 questions. Are you sure you want to submit now?`)) {
      return;
    }
  }

  quizSubmitted = true;
  clearInterval(quizTimerInterval);

  const currentModel = currentQuizModels[activeQuizModelIndex];
  let score = 0;

  currentModel.questions.forEach((qItem, idx) => {
    if (quizUserAnswers[idx] === qItem.correct) score++;
  });

  const submitBar = document.getElementById('submitQuizBar');
  if (submitBar) submitBar.style.display = 'none';

  const report = document.getElementById('quizFeedbackReport');
  const percentText = document.getElementById('scorePercentText');
  const fractionText = document.getElementById('scoreFractionText');
  const ratingBadge = document.getElementById('scoreRatingBadge');
  const trophy = document.getElementById('scoreTrophy');
  const breakdownList = document.getElementById('feedbackBreakdownList');

  const percent = Math.round((score / 10) * 100);
  if (percentText) percentText.innerText = `${percent}%`;
  if (fractionText) fractionText.innerText = `${score} / 10 Marks`;

  if (percent >= 90) {
    trophy.innerText = '🏆';
    ratingBadge.innerText = 'Outstanding Mastery! A+ Exemplary';
    ratingBadge.style.color = 'var(--accent-mint)';
    AudioEngine.success();
  } else if (percent >= 70) {
    trophy.innerText = '🌟';
    ratingBadge.innerText = 'Great Job! Solid Mathematical Foundation';
    ratingBadge.style.color = 'var(--primary)';
    AudioEngine.success();
  } else {
    trophy.innerText = '💪';
    ratingBadge.innerText = 'Needs Review — Check Proofs Below';
    ratingBadge.style.color = 'var(--accent-coral)';
    AudioEngine.wrong();
  }

  if (breakdownList) {
    breakdownList.innerHTML = '';
    currentModel.questions.forEach((qItem, idx) => {
      const studentChoice = quizUserAnswers[idx];
      const isCorrect = studentChoice === qItem.correct;
      const letters = ['A', 'B', 'C', 'D'];

      const itemEl = document.createElement('div');
      itemEl.style.cssText = `
        background: var(--bg-main);
        border-radius: var(--radius-md);
        padding: 1.25rem;
        margin-bottom: 1rem;
        border-left: 5px solid ${isCorrect ? 'var(--accent-mint)' : '#eb4d4b'};
      `;

      itemEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <strong>Question ${idx + 1}</strong>
          <span class="pill-badge" style="background:${isCorrect ? 'rgba(0,184,148,0.2)' : 'rgba(235,77,75,0.2)'}; color:${isCorrect ? 'var(--accent-mint)' : '#eb4d4b'};">
            ${isCorrect ? '✓ Correct (+1 Mark)' : '✗ Incorrect (0 Marks)'}
          </span>
        </div>
        <p style="font-size:0.95rem; margin-bottom:0.5rem;">${qItem.q}</p>
        <div style="font-size:0.88rem; color:var(--text-muted); margin-bottom:0.5rem;">
          <span>Your Answer: <strong>${studentChoice !== undefined ? letters[studentChoice] + '. ' + qItem.options[studentChoice] : 'Unanswered'}</strong></span> • 
          <span>Correct Answer: <strong style="color:var(--accent-mint);">${letters[qItem.correct]}. ${qItem.options[qItem.correct]}</strong></span>
        </div>
        <div style="font-size:0.85rem; background:var(--bg-surface); padding:0.75rem; border-radius:var(--radius-sm); border:1px solid var(--border-light);">
          <strong>Derivation & Step-by-Step Proof:</strong><br>${qItem.proof}
        </div>
      `;

      breakdownList.appendChild(itemEl);
    });

    if (window.renderMathInElement) {
      renderMathInElement(breakdownList, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ]
      });
    }
  }

  const nextBtn = document.getElementById('btnNextQuizModel');
  if (nextBtn) {
    if (activeQuizModelIndex < 2) {
      nextBtn.style.display = 'inline-flex';
      nextBtn.innerHTML = `<i class="fa-solid fa-forward-step"></i> Advance to Quiz #${activeQuizModelIndex + 2}`;
    } else {
      nextBtn.style.display = 'none';
    }
  }

  if (report) {
    report.style.display = 'block';
    report.scrollIntoView({ behavior: 'smooth' });
  }
}

function retakeCurrentQuiz() {
  AudioEngine.click();
  initQuizModel(activeQuizModelIndex);
}

function advanceNextQuizModel() {
  if (activeQuizModelIndex < 2) {
    AudioEngine.click();
    initQuizModel(activeQuizModelIndex + 1);
  }
}

// ==========================================================================
// 7. TAB NAVIGATION & SOLUTION DRAWERS
// ==========================================================================
function switchTab(targetTabId) {
  AudioEngine.click();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === targetTabId);
  });

  document.querySelectorAll('.tab-content').forEach(panel => {
    panel.classList.toggle('active', panel.id === targetTabId);
  });

  setTimeout(() => {
    StylusEngine.redrawAll();
  }, 50);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSolutionDrawer(drawerId, btn) {
  AudioEngine.click();
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  const isHidden = (window.getComputedStyle(drawer).display === 'none' || drawer.style.display === 'none');
  drawer.style.display = isHidden ? 'block' : 'none';
  if (btn) {
    const icon = isHidden ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    btn.innerHTML = `${icon} <span>${isHidden ? 'Hide Model Solution' : 'Show Model Solution'}</span>`;
  }
}

// ==========================================================================
// 8. LESSON IMPORTER & FILE UPLOAD ENGINE
// ==========================================================================
function openImportModal() {
  AudioEngine.click();
  const modal = document.getElementById('importModal');
  if (modal) modal.classList.add('active');
}

function closeImportModal() {
  AudioEngine.click();
  const modal = document.getElementById('importModal');
  if (modal) modal.classList.remove('active');
}

function handleLessonFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  alert(`File "${file.name}" received successfully!\n\nProcessing new lesson content with Mr Ahmed Abd El-Motaal's 3D Pixar styles, iPad stylus engine, and 30 assessment quiz questions.`);
  closeImportModal();
}

// ==========================================================================
// 9. THEME SWITCHER (DARK / LIGHT MODE)
// ==========================================================================
function initTheme() {
  const savedTheme = localStorage.getItem('math_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('math_theme', next);
      updateThemeIcon(next);
      AudioEngine.click();
    });
  }
}

function updateThemeIcon(theme) {
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (!toggleBtn) return;
  toggleBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun" style="color:#fdcb6e;"></i>' : '<i class="fa-solid fa-moon"></i>';
}

function exportActiveLessonJson() {
  AudioEngine.click();
  let filename = 'lesson_proportion.json';
  if (currentLessonKey === 'similarity') filename = 'lesson_similarity.json';
  else if (currentLessonKey === 'quadratic') filename = 'lesson_quadratic.json';
  const a = document.createElement('a');
  a.href = filename;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ==========================================================================
// SHARE LESSON MODAL & STUDENT LINK CONTROLLER
// ==========================================================================
function openShareModal() {
  AudioEngine.click();
  const modal = document.getElementById('shareLessonModal');
  if (!modal) return;

  const currentLesson = currentLessonKey || 'similarity';
  const origin = window.location.origin;
  
  // Clean, professional SPA student link (e.g. https://.../quadratic or https://.../similarity)
  const studentUrl = `${origin}/${currentLesson}`;
  
  const shareInput = document.getElementById('shareDirectLinkInput');
  if (shareInput) {
    shareInput.value = studentUrl;
  }

  const qrImg = document.getElementById('shareQrImg');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(studentUrl)}`;
  }

  modal.classList.add('active');
}

function closeShareModal() {
  AudioEngine.click();
  const modal = document.getElementById('shareLessonModal');
  if (modal) modal.classList.remove('active');
}

function copyShareLink() {
  const shareInput = document.getElementById('shareDirectLinkInput');
  if (!shareInput) return;
  shareInput.select();
  shareInput.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(shareInput.value).then(() => {
    const copyBtn = document.getElementById('btnCopyShareLink');
    if (copyBtn) {
      const origHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      copyBtn.style.background = '#00b894';
      setTimeout(() => {
        copyBtn.innerHTML = origHtml;
        copyBtn.style.background = '';
      }, 2000);
    }
  });
}

function exitStudentMode() {
  document.body.classList.remove('student-only-mode');
  window.history.pushState({}, '', '/');
  loadLesson(currentLessonKey || 'similarity');
}

// ==========================================================================
// 10. APPLICATION INITIALIZATION (SINGLE PAGE APPLICATION ROUTER)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      switchTab(target);
    });
  });

  FullScreenPen.init();
  InfiniteWhiteboard.init();

  const importBtn = document.getElementById('importLessonBtn');
  if (importBtn) importBtn.addEventListener('click', openImportModal);

  // Global Clipboard Paste Support (Ctrl + V / Cmd + V):
  window.addEventListener('paste', (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const targetId = StylusEngine.lastActiveCanvasId || document.querySelector('.stylus-canvas')?.id;
        if (targetId) {
          loadBlobToCanvas(targetId, blob);
        }
        break;
      }
    }
  });

  // 1. Clean URL Route Detection (/similarity, /quadratic, /proportion)
  const pathClean = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const knownLessons = ['similarity', 'quadratic', 'proportion'];
  
  // 2. URL Query Parameters Detection (?lesson=similarity&student=true)
  const urlParams = new URLSearchParams(window.location.search);
  const paramLesson = urlParams.get('lesson');

  let chosenLesson = null;
  let isStudent = false;

  if (knownLessons.includes(pathClean)) {
    chosenLesson = pathClean;
    isStudent = true; // Clean routes are dedicated student URLs
  } else if (paramLesson && knownLessons.includes(paramLesson.toLowerCase())) {
    chosenLesson = paramLesson.toLowerCase();
    isStudent = true; // Any link with ?lesson= is automatically student mode
  } else if (urlParams.get('student') === 'true' || urlParams.get('only') === 'true') {
    isStudent = true;
  }

  if (isStudent) {
    document.body.classList.add('student-only-mode');
  } else {
    document.body.classList.remove('student-only-mode');
  }

  // Load target lesson, or remember last active lesson, or default to similarity
  const initialLesson = chosenLesson || localStorage.getItem('math_active_lesson') || 'similarity';
  loadLesson(initialLesson);

  // URL Print Section Auto-Trigger (for direct export links or automated headless PDF generation)
  const printSectionParam = urlParams.get('printSection');
  if (printSectionParam) {
    const withSol = urlParams.get('solutions') === 'true';
    document.body.setAttribute('data-print-section', printSectionParam);
    document.body.setAttribute('data-print-solutions', withSol ? 'true' : 'false');
    
    // Update Print Header Titles
    const printLessonTitle = document.getElementById('printHeaderLessonTitle');
    const printSectionBadge = document.getElementById('printHeaderSectionBadge');
    let activeData = (initialLesson === 'similarity') ? (typeof LESSON_SIMILARITY !== 'undefined' ? LESSON_SIMILARITY : null) :
                     (initialLesson === 'quadratic') ? (typeof LESSON_QUADRATIC !== 'undefined' ? LESSON_QUADRATIC : null) :
                     (typeof LESSON_PROPORTION !== 'undefined' ? LESSON_PROPORTION : null);
    if (printLessonTitle && activeData) {
      printLessonTitle.innerText = activeData.title || 'Math Lesson';
    }
    const sectionNames = {
      'concept': 'Section 1: Concept & Practice',
      'mcq': 'Section 2: MCQ Revision Bank (10 Questions)',
      'quiz': 'Section 3: Timed Quiz - 10 Marks (3 Models)',
      'all': 'Complete Lesson'
    };
    if (printSectionBadge) {
      printSectionBadge.innerText = sectionNames[printSectionParam] || 'Mathematics Worksheet';
    }

    if (printSectionParam === 'quiz' || printSectionParam === 'all') {
      prepareQuizForPrint(true);
    }
  }

  if (urlParams.get('openPdfModal') === 'true') {
    setTimeout(openPdfExportModal, 150);
  }
});

// ==========================================================================
// 11. PDF EXPORT CONTROLLER (SEPARATE SECTIONS • STRICT ZERO-SPLIT GUARANTEE)
// Educator: Mr Ahmed Abd El-Motaal
// ==========================================================================
let exportSelectedLessonKey = 'similarity';

function openPdfExportModal() {
  AudioEngine.click();
  exportSelectedLessonKey = currentLessonKey || 'similarity';
  updateExportModalPills();
  const modal = document.getElementById('pdfExportModal');
  if (modal) modal.classList.add('active');
}

function closePdfExportModal() {
  AudioEngine.click();
  const modal = document.getElementById('pdfExportModal');
  if (modal) modal.classList.remove('active');
}

function selectExportLesson(key) {
  AudioEngine.click();
  exportSelectedLessonKey = key;
  if (currentLessonKey !== key) {
    loadLesson(key);
  }
  updateExportModalPills();
}

function updateExportModalPills() {
  const pSim = document.getElementById('modalBtnSim');
  const pQuad = document.getElementById('modalBtnQuad');
  const pProp = document.getElementById('modalBtnProp');
  if (pSim) pSim.classList.toggle('active', exportSelectedLessonKey === 'similarity');
  if (pQuad) pQuad.classList.toggle('active', exportSelectedLessonKey === 'quadratic');
  if (pProp) pProp.classList.toggle('active', exportSelectedLessonKey === 'proportion');
}

function triggerSectionPdfExport(sectionKey) {
  const includeSolutions = document.getElementById('chkIncludeSolutions')?.checked || false;
  closePdfExportModal();
  exportSectionToPdf(sectionKey, { includeSolutions });
}

function prepareQuizForPrint(includeAllModels = true) {
  const container = document.getElementById('quizQuestionsContainer');
  if (!container || !currentQuizModels || currentQuizModels.length === 0) return;

  if (includeAllModels) {
    container.innerHTML = '';
    currentQuizModels.forEach((model, mIdx) => {
      const modelHeader = document.createElement('div');
      modelHeader.className = mIdx > 0 ? 'quiz-model-page-break' : '';
      modelHeader.innerHTML = `
        <div style="margin: 1.25rem 0 1rem; padding: 0.65rem 1rem; background: #0f172a; color: #ffffff; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #ffffff !important;">Model #${mIdx + 1}: ${model.name || 'Standardized Assessment Model'}</h3>
          <span style="font-weight: 700; font-size: 0.85rem; color: #94a3b8 !important;">10 Questions • 10 Marks</span>
        </div>
      `;
      container.appendChild(modelHeader);

      model.questions.forEach((qItem, qIdx) => {
        const card = document.createElement('article');
        card.className = 'quiz-question-card print-card-avoid-split';
        card.id = `quiz-print-card-${mIdx}-${qIdx}`;
        const letters = ['A', 'B', 'C', 'D'];
        const optionsHtml = qItem.options.map((opt, optIdx) => `
          <div class="mcq-option-btn">
            <span class="option-letter-badge">${letters[optIdx]}</span>
            <span>${opt}</span>
          </div>
        `).join('');

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <span class="mcq-number-pill">Question ${qIdx + 1} of ${model.questions.length}</span>
            <span style="font-size:0.85rem; font-weight:700; color:#475569;">[ 1 Mark ]</span>
          </div>
          <p class="quiz-question-text" style="font-family:var(--font-heading); font-size:1.1rem; font-weight:700; margin-bottom:0.75rem; color:var(--text-main);">
            ${qItem.q}
          </p>
          ${qItem.diagramSvg ? `<div class="quiz-diagram-wrap" style="display:flex; justify-content:center; align-items:center; margin:0.75rem 0; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:0.75rem; overflow-x:auto;">${qItem.diagramSvg}</div>` : ''}
          <div class="mcq-options-grid">
            ${optionsHtml}
          </div>
          ${qItem.explanation ? `<div class="mcq-explanation-box"><strong>Explanation & Proof:</strong> ${qItem.explanation}</div>` : ''}
        `;
        container.appendChild(card);
      });
    });
  }

  if (window.renderMathInElement) {
    renderMathInElement(container, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ]
    });
  }
}

function exportSectionToPdf(sectionKey, options = {}) {
  // Ensure light theme for crisp high-contrast printing
  const previousTheme = document.documentElement.getAttribute('data-theme');
  document.documentElement.setAttribute('data-theme', 'light');

  // Set print attributes
  document.body.setAttribute('data-print-section', sectionKey);
  document.body.setAttribute('data-print-solutions', options.includeSolutions ? 'true' : 'false');

  // Update Header Banner
  const printLessonTitle = document.getElementById('printHeaderLessonTitle');
  const printSectionBadge = document.getElementById('printHeaderSectionBadge');

  let activeData = (currentLessonKey === 'similarity') ? LESSON_SIMILARITY :
                   (currentLessonKey === 'quadratic') ? LESSON_QUADRATIC : LESSON_PROPORTION;

  if (printLessonTitle && activeData) {
    printLessonTitle.innerText = activeData.title || 'Math Lesson';
  }

  const sectionNames = {
    'concept': 'Section 1: Concept & Practice (المفاهيم والتمارين)',
    'mcq': 'Section 2: MCQ Revision Bank (بنك أسئلة الاختيار من متعدد)',
    'quiz': 'Section 3: Timed Quiz - 10 Marks (نماذج الاختبارات الموقوتة)',
    'all': 'Comprehensive Lesson Package (جميع أقسام الدرس كاملة)'
  };

  if (printSectionBadge) {
    printSectionBadge.innerText = sectionNames[sectionKey] || 'Mathematics Assessment';
  }

  // If printing quiz, format all 3 models nicely
  if (sectionKey === 'quiz' || sectionKey === 'all') {
    prepareQuizForPrint(true);
  }

  // If printing concept with solutions, reveal solution drawers
  if (options.includeSolutions) {
    document.querySelectorAll('.try-it-solution-drawer').forEach(el => el.style.display = 'block');
  }

  // Rerender math formulas
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ]
    });
  }

  // Cleanup handler
  const cleanup = () => {
    document.body.removeAttribute('data-print-section');
    document.body.removeAttribute('data-print-solutions');
    if (previousTheme) {
      document.documentElement.setAttribute('data-theme', previousTheme);
    }
    // Restore single interactive quiz model
    renderQuizQuestions();
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  // Trigger print dialog
  setTimeout(() => {
    window.print();
  }, 250);
}



