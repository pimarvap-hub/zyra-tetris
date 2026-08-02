/* ═══════════════════════════════════════════
   ZYRA TETRIS — cans as blocks (HQ + controls)
   ═══════════════════════════════════════════ */

(() => {
  "use strict";

  // ── Flavors / assets ──────────────────────
  const FLAVORS = [
    { id: "anar", name: "Анар", color: "#e63946", src: "assets/anar.png" },
    { id: "kiwi_lime", name: "Kiwi Lime", color: "#7dce2a", src: "assets/kiwi_lime.png" },
    { id: "mango_orange", name: "Mango Orange", color: "#ff8a00", src: "assets/mango_orange.png" },
    { id: "mango_passion", name: "Манго-Маракуйя", color: "#ffd60a", src: "assets/mango_passion.png" },
    { id: "strawberry_banana", name: "Клубника-Банан", color: "#ff4d6d", src: "assets/strawberry_banana.png" },
    { id: "zhidekti", name: "Жидекті", color: "#c9184a", src: "assets/zhidekti.png" },
  ];

  const PIECE_FLAVOR = [0, 1, 2, 3, 4, 5, 0]; // I O T S Z J L

  const SHAPES = {
    I: [
      [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
      [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
      [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    ],
    O: [
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    ],
    T: [
      [[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]],
      [[0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
    ],
    S: [
      [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,0,0]],
      [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
      [[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
    ],
    Z: [
      [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,0,1,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
      [[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]],
    ],
    J: [
      [[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0]],
    ],
    L: [
      [[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],
      [[1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
    ],
  };

  const PIECE_TYPES = ["I", "O", "T", "S", "Z", "J", "L"];
  const COLS = 10;
  const ROWS = 20;
  const STORAGE_BEST = "zyra_tetris_best";

  // Tetris-like DAS / ARR (ms)
  const DAS = 140;
  const ARR = 38;
  const SOFT_DROP_MS = 42;

  // ── DOM ───────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const boardCanvas = $("board");
  const nextCanvas = $("next");
  const holdCanvas = $("hold");
  const ctx = boardCanvas.getContext("2d", { alpha: true, desynchronized: true });
  const nctx = nextCanvas.getContext("2d", { alpha: true });
  const hctx = holdCanvas.getContext("2d", { alpha: true });

  const startScreen = $("start-screen");
  const gameScreen = $("game-screen");
  const overScreen = $("over-screen");
  const pauseOverlay = $("pause-overlay");
  const boardWrap = document.querySelector(".board-wrap");

  // ── State ─────────────────────────────────
  let images = {};
  /** Pre-rendered can sprites at current cell size (crisp) */
  let canSprites = {};
  let grid = [];
  let current = null;
  let nextPiece = null;
  let holdPiece = null;
  let holdUsed = false;
  let score = 0;
  let lines = 0;
  let level = 1;
  let best = Number(localStorage.getItem(STORAGE_BEST) || 0);
  let dropInterval = 800;
  let lastDrop = 0;
  let lastFrame = 0;
  let running = false;
  let paused = false;
  let gameOver = false;
  let bag = [];
  let particles = [];
  let flashRows = [];
  let flashTimer = 0;
  let cellW = 30;
  let cellH = 30;
  let animId = 0;
  let dpr = 1;
  let boardCssW = 300;
  let boardCssH = 600;

  // Input state
  let softDropHeld = false;
  let lastSoftDrop = 0;
  let dasDir = 0; // -1 left, 1 right, 0 none
  let dasArmedAt = 0;
  let dasRepeating = false;
  let lastArr = 0;

  // ── Audio ─────────────────────────────────
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) {}
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  function beep(freq, dur = 0.06, type = "square", gain = 0.04) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur);
  }

  const sfx = {
    move: () => beep(220, 0.035, "square", 0.025),
    rotate: () => beep(340, 0.045, "triangle", 0.035),
    drop: () => beep(110, 0.07, "square", 0.04),
    lock: () => beep(180, 0.06, "triangle", 0.035),
    clear: () => {
      beep(440, 0.07, "sine", 0.045);
      setTimeout(() => beep(660, 0.09, "sine", 0.045), 55);
      setTimeout(() => beep(880, 0.11, "sine", 0.045), 110);
    },
    over: () => {
      beep(300, 0.14, "sawtooth", 0.035);
      setTimeout(() => beep(200, 0.18, "sawtooth", 0.035), 110);
      setTimeout(() => beep(120, 0.28, "sawtooth", 0.035), 240);
    },
    start: () => {
      beep(392, 0.07, "sine", 0.045);
      setTimeout(() => beep(523, 0.09, "sine", 0.045), 70);
      setTimeout(() => beep(659, 0.12, "sine", 0.045), 140);
    },
  };

  // ── Browser / device auto-detect ──────────
  /** @type {ReturnType<typeof detectEnv>} */
  let env = null;

  function detectEnv() {
    const vv = window.visualViewport;
    const w = Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 360);
    const h = Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 640);
    const rawDpr = window.devicePixelRatio || 1;
    // Cap DPR by device class later; raw stored for sprites
    const coarse = matchMedia("(pointer: coarse)").matches;
    const fine = matchMedia("(pointer: fine)").matches;
    const hover = matchMedia("(hover: hover)").matches;
    const noHover = matchMedia("(hover: none)").matches;
    const touch =
      ("ontouchstart" in window) ||
      (navigator.maxTouchPoints || 0) > 0 ||
      coarse;
    const ua = navigator.userAgent || "";
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1);
    const android = /Android/i.test(ua);
    const safari = /Safari/i.test(ua) && !/Chrome|CriOS|Edg|OPR|Firefox/i.test(ua);
    const chrome = /Chrome|CriOS/i.test(ua) && !/Edg|OPR/i.test(ua);
    const standalone =
      matchMedia("(display-mode: standalone)").matches ||
      // iOS home-screen
      Boolean(navigator.standalone);
    const landscape = w > h;
    const portrait = !landscape;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = w < 430;
    const short = h < 700;
    const veryShort = h < 580;

    // Device tier: touch + size, not only UA
    let device = "desktop";
    if (touch && (w < 768 || (coarse && w < 1024 && noHover))) {
      device = w >= 700 && !narrow ? "tablet" : "phone";
    } else if (w < 700 && (touch || coarse)) {
      device = "phone";
    } else if (w < 1024 && touch) {
      device = "tablet";
    }

    // Prefer touch UI if primary input is coarse / no hover
    const preferTouchUI = device !== "desktop" || (touch && (coarse || noHover));
    const preferKeys = fine && hover && device === "desktop";

    // DPR budget: phones get up to 3, weak/low-end capped
    let dprCap = 3;
    if (device === "phone" && rawDpr >= 3) dprCap = 3;
    else if (device === "desktop") dprCap = Math.min(2.5, rawDpr);
    // Memory-ish heuristic: very high res screens still cap at 3
    const dpr = Math.min(rawDpr, dprCap);

    return {
      w,
      h,
      rawDpr,
      dpr,
      touch,
      coarse,
      fine,
      hover,
      noHover,
      ios,
      android,
      safari,
      chrome,
      standalone,
      landscape,
      portrait,
      reducedMotion,
      narrow,
      short,
      veryShort,
      device,
      preferTouchUI,
      preferKeys,
    };
  }

  function applyEnvToDom(e) {
    const root = document.documentElement;
    const body = document.body;
    const classes = [
      "is-" + e.device,
      e.touch ? "is-touch" : "no-touch",
      e.preferTouchUI ? "ui-touch" : "ui-keys",
      e.landscape ? "orient-landscape" : "orient-portrait",
      e.ios ? "is-ios" : "",
      e.android ? "is-android" : "",
      e.safari ? "is-safari" : "",
      e.standalone ? "is-standalone" : "",
      e.short ? "is-short" : "",
      e.veryShort ? "is-very-short" : "",
      e.narrow ? "is-narrow" : "",
      e.reducedMotion ? "reduce-motion" : "",
    ].filter(Boolean);

    // strip previous adaptive classes
    body.className = body.className
      .split(/\s+/)
      .filter((c) => !/^(is-|ui-|orient-|no-touch|reduce-motion)/.test(c))
      .concat(classes)
      .join(" ")
      .trim();

    root.style.setProperty("--vw", e.w + "px");
    root.style.setProperty("--vh", e.h + "px");
    root.style.setProperty("--dpr", String(e.dpr));
    root.dataset.device = e.device;
    root.dataset.orient = e.landscape ? "landscape" : "portrait";
  }

  /**
   * Fit board + UI into real viewport (accounts for mobile browser chrome).
   * Sets CSS vars used by styles.css
   */
  function computeLayout(e) {
    const padX = e.device === "phone" ? (e.narrow ? 8 : 10) : 14;
    const padY = e.device === "phone" ? 6 : 10;
    // rough chrome: top stats + gaps + controls (if touch UI)
    const topH = e.veryShort ? 40 : e.device === "phone" ? 46 : 52;
    const gap = e.veryShort ? 4 : 8;

    let sideW;
    if (e.device === "phone") sideW = e.narrow ? 52 : e.landscape ? 56 : 58;
    else if (e.device === "tablet") sideW = 72;
    else sideW = 88;

    let ctrlBlock = 0;
    if (e.preferTouchUI) {
      if (e.landscape && e.device === "phone") {
        // side controls — width reserved separately
        ctrlBlock = 0;
      } else {
        // portrait control pad height
        const btn = e.veryShort ? 42 : e.short ? 48 : e.narrow ? 52 : 56;
        const drop = e.veryShort ? 40 : 48;
        const rows = 2;
        const hint = e.veryShort ? 0 : 16;
        ctrlBlock = btn * rows + drop + gap * 3 + hint + 4;
      }
    } else {
      // minimal desktop pad or hidden — still leave a little room if controls shown compact
      ctrlBlock = e.preferKeys ? 0 : 100;
    }

    const availW = e.w - padX * 2;
    const availH = e.h - padY * 2 - (e.standalone ? 0 : 0);

    // game screen usable height
    let boardMaxH = availH - topH - gap - ctrlBlock;
    let boardMaxW = availW - sideW * 2 - gap * 2;

    if (e.landscape && e.device === "phone" && e.preferTouchUI) {
      // board left/center, controls column on right (~120px)
      const ctrlCol = e.veryShort ? 100 : 118;
      boardMaxW = availW - sideW * 2 - gap * 2 - ctrlCol - gap;
      boardMaxH = availH - topH - gap;
    }

    // Board is always 1:2 (width:height)
    let boardW = Math.min(boardMaxW, boardMaxH / 2);
    let boardH = boardW * 2;

    // If height-limited, recompute from height
    if (boardH > boardMaxH) {
      boardH = boardMaxH;
      boardW = boardH / 2;
    }

    // Clamp sensible bounds
    const minW = e.device === "phone" ? 140 : 200;
    const maxW =
      e.device === "phone" ? (e.landscape ? 280 : 340) : e.device === "tablet" ? 360 : 400;
    boardW = Math.max(minW, Math.min(maxW, boardW));
    boardH = boardW * 2;

    // Control button height from free space
    let ctrlBtn = 52;
    if (e.preferTouchUI) {
      if (e.landscape && e.device === "phone") {
        ctrlBtn = Math.max(40, Math.min(56, Math.floor((boardH - 24) / 6)));
      } else {
        const free = Math.max(0, availH - topH - gap - boardH - 8);
        // 3 rows roughly
        ctrlBtn = Math.max(40, Math.min(58, Math.floor((free - 20) / 3.2)));
      }
    }

    const uiScale =
      e.device === "phone" ? (e.narrow ? 0.92 : 1) : e.device === "tablet" ? 1.05 : 1.1;

    return {
      padX,
      padY,
      sideW,
      boardW: Math.round(boardW),
      boardH: Math.round(boardH),
      ctrlBtn: Math.round(ctrlBtn),
      topH,
      uiScale,
      ctrlCol: e.landscape && e.device === "phone" && e.preferTouchUI ? (e.veryShort ? 100 : 118) : 0,
    };
  }

  function applyLayout(layout, e) {
    const root = document.documentElement;
    root.style.setProperty("--pad-x", layout.padX + "px");
    root.style.setProperty("--pad-y", layout.padY + "px");
    root.style.setProperty("--side-w", layout.sideW + "px");
    root.style.setProperty("--board-w", layout.boardW + "px");
    root.style.setProperty("--board-h", layout.boardH + "px");
    root.style.setProperty("--ctrl-btn-h", layout.ctrlBtn + "px");
    root.style.setProperty("--ctrl-drop-h", Math.round(layout.ctrlBtn * 0.92) + "px");
    root.style.setProperty("--ui-scale", String(layout.uiScale));
    root.style.setProperty("--ctrl-col-w", layout.ctrlCol + "px");
    root.style.setProperty("--panel-canvas", Math.max(40, layout.sideW - 12) + "px");

    // landscape phone game chrome
    document.body.classList.toggle(
      "layout-side-controls",
      Boolean(layout.ctrlCol)
    );
  }

  function adaptUI() {
    env = detectEnv();
    applyEnvToDom(env);
    const layout = computeLayout(env);
    applyLayout(layout, env);

    // Start screen hints: touch vs keyboard
    const hints = document.querySelector(".hint-keys");
    if (hints) {
      if (env.preferTouchUI) {
        hints.innerHTML =
          "<span>свайпы на поле</span><span>кнопки внизу</span><span>тап = поворот</span>";
      } else {
        hints.innerHTML =
          "<span>← → двигать</span><span>↑ поворот</span><span>↓ ускорить</span><span>Space сброс</span><span>C hold</span>";
      }
    }

    return { env, layout };
  }

  // ── HiDPI canvas ──────────────────────────
  function setupCanvas(canvas, cssW, cssH) {
    const ratio = Math.min((env && env.dpr) || window.devicePixelRatio || 1, 3);
    const w = Math.max(1, Math.round(cssW * ratio));
    const h = Math.max(1, Math.round(cssH * ratio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    const c = canvas.getContext("2d");
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    c.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in c) c.imageSmoothingQuality = "high";
    return ratio;
  }

  function tuneCtx(c) {
    c.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in c) c.imageSmoothingQuality = "high";
  }

  // ── Load + pre-render cans ────────────────
  function loadImages() {
    return Promise.all(
      FLAVORS.map(
        (f) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.decoding = "async";
            img.onload = () => {
              images[f.id] = img;
              resolve();
            };
            img.onerror = reject;
            img.src = f.src;
          })
      )
    );
  }

  /** Bake each can into a sharp offscreen sprite for current cell size */
  function rebuildCanSprites() {
    canSprites = {};
    // render at 2x cell for sharpness when scaled slightly
    const px = Math.max(48, Math.round(Math.min(cellW, cellH) * dpr * 1.25));
    FLAVORS.forEach((f) => {
      const img = images[f.id];
      if (!img) return;
      const off = document.createElement("canvas");
      off.width = px;
      off.height = px;
      const oc = off.getContext("2d");
      oc.imageSmoothingEnabled = true;
      if ("imageSmoothingQuality" in oc) oc.imageSmoothingQuality = "high";

      // soft colored plate behind can (no canvas shadowBlur — keeps edges sharp)
      const pad = px * 0.06;
      const ir = img.naturalWidth / img.naturalHeight || img.width / img.height;
      let rw = px - pad * 2;
      let rh = rw / ir;
      if (rh > px - pad * 2) {
        rh = px - pad * 2;
        rw = rh * ir;
      }
      const dx = (px - rw) / 2;
      const dy = (px - rh) / 2;

      // subtle radial tint
      const g = oc.createRadialGradient(px / 2, px / 2, px * 0.1, px / 2, px / 2, px * 0.55);
      g.addColorStop(0, hexAlpha(f.color, 0.35));
      g.addColorStop(1, hexAlpha(f.color, 0));
      oc.fillStyle = g;
      oc.beginPath();
      oc.roundRect
        ? oc.roundRect(pad * 0.5, pad * 0.5, px - pad, px - pad, px * 0.18)
        : oc.rect(pad * 0.5, pad * 0.5, px - pad, px - pad);
      oc.fill();

      oc.drawImage(img, dx, dy, rw, rh);
      canSprites[f.id] = off;
    });
  }

  function hexAlpha(hex, a) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  // ── Bubbles ───────────────────────────────
  function spawnBubbles() {
    const host = $("bubbles");
    host.innerHTML = "";
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("span");
      const size = 6 + Math.random() * 16;
      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDuration = 9 + Math.random() * 14 + "s";
      s.style.animationDelay = Math.random() * 10 + "s";
      host.appendChild(s);
    }
  }

  function fillFlavorPreview() {
    const row = $("flavor-preview");
    row.innerHTML = "";
    FLAVORS.forEach((f) => {
      const img = document.createElement("img");
      img.src = f.src;
      img.alt = f.name;
      img.decoding = "async";
      img.loading = "eager";
      row.appendChild(img);
    });
  }

  // ── Bag ───────────────────────────────────
  function refillBag() {
    bag = PIECE_TYPES.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }

  function nextFromBag() {
    if (!bag.length) refillBag();
    const type = bag.pop();
    const typeIndex = PIECE_TYPES.indexOf(type);
    return { type, rot: 0, x: 3, y: 0, flavor: PIECE_FLAVOR[typeIndex] };
  }

  function shapeOf(piece) {
    return SHAPES[piece.type][piece.rot];
  }

  // ── Grid ──────────────────────────────────
  function emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function collides(piece, ox = 0, oy = 0, rot = piece.rot) {
    const shape = SHAPES[piece.type][rot];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!shape[r][c]) continue;
        const x = piece.x + c + ox;
        const y = piece.y + r + oy;
        if (x < 0 || x >= COLS || y >= ROWS) return true;
        if (y >= 0 && grid[y][x] !== null) return true;
      }
    }
    return false;
  }

  function lockPiece() {
    const shape = shapeOf(current);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!shape[r][c]) continue;
        const x = current.x + c;
        const y = current.y + r;
        if (y < 0) {
          endGame();
          return;
        }
        if (y < ROWS && x >= 0 && x < COLS) grid[y][x] = current.flavor;
      }
    }
    sfx.lock();
    holdUsed = false;
    clearLines();
    spawnPiece();
  }

  function clearLines() {
    const full = [];
    for (let y = 0; y < ROWS; y++) {
      if (grid[y].every((c) => c !== null)) full.push(y);
    }
    if (!full.length) return;

    flashRows = full.slice();
    flashTimer = 200;
    boardWrap.classList.add("flash");
    setTimeout(() => boardWrap.classList.remove("flash"), 320);
    sfx.clear();

    full.forEach((y) => {
      for (let x = 0; x < COLS; x++) {
        const flavor = grid[y][x];
        const col = FLAVORS[flavor]?.color || "#fff";
        for (let i = 0; i < 5; i++) {
          particles.push({
            x: (x + 0.5) * cellW,
            y: (y + 0.5) * cellH,
            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.85) * 6,
            life: 1,
            color: col,
            size: 2.5 + Math.random() * 3.5,
          });
        }
      }
    });

    setTimeout(() => {
      const keep = grid.filter((_, y) => !full.includes(y));
      while (keep.length < ROWS) keep.unshift(Array(COLS).fill(null));
      grid = keep;
      flashRows = [];

      const n = full.length;
      score += [0, 100, 300, 500, 800][n] * level;
      lines += n;
      const newLevel = Math.floor(lines / 8) + 1;
      if (newLevel !== level) {
        level = newLevel;
        dropInterval = Math.max(90, 800 - (level - 1) * 70);
      }
      updateHUD();
    }, 180);
  }

  function spawnPiece() {
    current = nextPiece || nextFromBag();
    nextPiece = nextFromBag();
    current.x = 3;
    current.y = 0;
    if (collides(current)) {
      endGame();
      return;
    }
    updateFlavorTip();
    drawSide(nctx, nextPiece);
  }

  function hardDrop() {
    if (!current || paused || gameOver) return;
    let dist = 0;
    while (!collides(current, 0, dist + 1)) dist++;
    current.y += dist;
    score += dist * 2;
    lockPiece();
    sfx.drop();
    updateHUD();
  }

  function softDrop() {
    if (!current || paused || gameOver) return false;
    if (!collides(current, 0, 1)) {
      current.y++;
      score += 1;
      updateHUD();
      return true;
    }
    lockPiece();
    return false;
  }

  function move(dx) {
    if (!current || paused || gameOver) return false;
    if (!collides(current, dx, 0)) {
      current.x += dx;
      sfx.move();
      return true;
    }
    return false;
  }

  function rotate(dir = 1) {
    if (!current || paused || gameOver) return;
    const nextRot = (current.rot + dir + 4) % 4;
    // SRS-lite wall kicks (+ up kick)
    const kicks = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, -1],
      [-2, 0],
      [2, 0],
      [-1, -1],
      [1, -1],
    ];
    for (const [kx, ky] of kicks) {
      if (!collides(current, kx, ky, nextRot)) {
        current.rot = nextRot;
        current.x += kx;
        current.y += ky;
        sfx.rotate();
        return;
      }
    }
  }

  function hold() {
    if (!current || paused || gameOver || holdUsed) return;
    holdUsed = true;
    const type = current.type;
    const flavor = current.flavor;
    if (!holdPiece) {
      holdPiece = { type, flavor, rot: 0, x: 3, y: 0 };
      spawnPiece();
    } else {
      const tmp = holdPiece;
      holdPiece = { type, flavor, rot: 0, x: 3, y: 0 };
      current = { type: tmp.type, flavor: tmp.flavor, rot: 0, x: 3, y: 0 };
      if (collides(current)) {
        endGame();
        return;
      }
    }
    drawSide(hctx, holdPiece);
    sfx.rotate();
  }

  function ghostY() {
    if (!current) return 0;
    let gy = 0;
    while (!collides(current, 0, gy + 1)) gy++;
    return current.y + gy;
  }

  // ── Drawing ───────────────────────────────
  function resizeBoard() {
    adaptUI();

    // Prefer computed CSS vars (stable) over rect race conditions
    const rootStyle = getComputedStyle(document.documentElement);
    const varW = parseFloat(rootStyle.getPropertyValue("--board-w")) || 0;
    const varH = parseFloat(rootStyle.getPropertyValue("--board-h")) || 0;
    const rect = boardWrap.getBoundingClientRect();

    boardCssW = varW || rect.width || 300;
    boardCssH = varH || rect.height || boardCssW * 2;

    // Force explicit pixel size so canvas matches layout exactly
    boardWrap.style.width = boardCssW + "px";
    boardWrap.style.height = boardCssH + "px";

    dpr = setupCanvas(boardCanvas, boardCssW, boardCssH);
    cellW = boardCssW / COLS;
    cellH = boardCssH / ROWS;
    rebuildCanSprites();

    const sideCss =
      parseFloat(rootStyle.getPropertyValue("--panel-canvas")) ||
      document.querySelector(".panel canvas")?.getBoundingClientRect().width ||
      64;
    setupCanvas(nextCanvas, sideCss, sideCss);
    setupCanvas(holdCanvas, sideCss, sideCss);
    if (nextPiece) drawSide(nctx, nextPiece);
    drawSide(hctx, holdPiece);
  }

  function drawCanSprite(c, flavorId, x, y, w, h, alpha = 1) {
    const sprite = canSprites[flavorId];
    const img = images[flavorId];
    if (!sprite && !img) return;
    c.save();
    c.globalAlpha = alpha;
    tuneCtx(c);
    const padX = w * 0.04;
    const padY = h * 0.03;
    if (sprite) {
      c.drawImage(sprite, x + padX, y + padY, w - padX * 2, h - padY * 2);
    } else {
      // fallback raw image
      const ir = img.width / img.height;
      let rw = w - padX * 2;
      let rh = rw / ir;
      if (rh > h - padY * 2) {
        rh = h - padY * 2;
        rw = rh * ir;
      }
      c.drawImage(img, x + (w - rw) / 2, y + (h - rh) / 2, rw, rh);
    }
    c.restore();
  }

  function drawCellBg(c, x, y, w, h, color, alpha = 0.15) {
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = color;
    const r = Math.min(w, h) * 0.16;
    roundRect(c, x + 1, y + 1, w - 2, h - 2, r);
    c.fill();
    c.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function drawBoard() {
    const W = boardCssW;
    const H = boardCssH;
    ctx.clearRect(0, 0, W, H);
    tuneCtx(ctx);

    // board fill
    ctx.fillStyle = "rgba(8,4,12,0.35)";
    ctx.fillRect(0, 0, W, H);

    // crisp grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1 / dpr;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(Math.round(x * cellW) + 0.5 / dpr, 0);
      ctx.lineTo(Math.round(x * cellW) + 0.5 / dpr, H);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, Math.round(y * cellH) + 0.5 / dpr);
      ctx.lineTo(W, Math.round(y * cellH) + 0.5 / dpr);
      ctx.stroke();
    }

    // locked
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const f = grid[y][x];
        if (f === null) continue;
        const flavor = FLAVORS[f];
        const flashing = flashRows.includes(y);
        const pulse = flashing
          ? 0.45 + 0.55 * Math.abs(Math.sin(performance.now() / 45))
          : 1;
        drawCellBg(ctx, x * cellW, y * cellH, cellW, cellH, flavor.color, flashing ? 0.5 : 0.14);
        drawCanSprite(ctx, flavor.id, x * cellW, y * cellH, cellW, cellH, pulse);
      }
    }

    // ghost (outline only — cleaner)
    if (current && !gameOver) {
      const gy = ghostY();
      const shape = shapeOf(current);
      const flavor = FLAVORS[current.flavor];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!shape[r][c]) continue;
          const x = current.x + c;
          const y = gy + r;
          if (y < 0) continue;
          drawCanSprite(ctx, flavor.id, x * cellW, y * cellH, cellW, cellH, 0.2);
          // dashed cell outline
          ctx.save();
          ctx.strokeStyle = hexAlpha(flavor.color, 0.55);
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          roundRect(
            ctx,
            x * cellW + 2,
            y * cellH + 2,
            cellW - 4,
            cellH - 4,
            Math.min(cellW, cellH) * 0.14
          );
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // active
    if (current && !gameOver) {
      const shape = shapeOf(current);
      const flavor = FLAVORS[current.flavor];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!shape[r][c]) continue;
          const x = current.x + c;
          const y = current.y + r;
          if (y < 0) continue;
          drawCellBg(ctx, x * cellW, y * cellH, cellW, cellH, flavor.color, 0.22);
          drawCanSprite(ctx, flavor.id, x * cellW, y * cellH, cellW, cellH, 1);
        }
      }
    }

    // particles
    particles = particles.filter((p) => p.life > 0);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.16;
      p.life -= 0.028;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawSide(c, piece) {
    const canvas = c.canvas;
    // work in CSS pixels via current transform from setupCanvas
    const css = parseFloat(canvas.style.width) || canvas.width / dpr;
    const W = css;
    const H = css;
    c.setTransform(1, 0, 0, 1, 0, 0);
    // re-apply dpr for this canvas
    const ratio = canvas.width / Math.max(1, parseFloat(canvas.style.width) || canvas.width);
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    c.clearRect(0, 0, W, H);
    tuneCtx(c);
    if (!piece) return;

    const shape = SHAPES[piece.type][0];
    const flavor = FLAVORS[piece.flavor];
    let minR = 4,
      maxR = -1,
      minC = 4,
      maxC = -1;
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        if (shape[r][col]) {
          minR = Math.min(minR, r);
          maxR = Math.max(maxR, r);
          minC = Math.min(minC, col);
          maxC = Math.max(maxC, col);
        }
      }
    }
    const bw = maxC - minC + 1;
    const bh = maxR - minR + 1;
    const cell = Math.min(W / (bw + 0.5), H / (bh + 0.5));
    const ox = (W - bw * cell) / 2;
    const oy = (H - bh * cell) / 2;
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        if (!shape[r][col]) continue;
        const x = ox + (col - minC) * cell;
        const y = oy + (r - minR) * cell;
        drawCanSprite(c, flavor.id, x, y, cell, cell, 1);
      }
    }
  }

  function updateFlavorTip() {
    if (!current) return;
    const f = FLAVORS[current.flavor];
    $("tip-img").src = f.src;
    $("tip-name").textContent = f.name;
  }

  function updateHUD() {
    $("score").textContent = score;
    $("level").textContent = level;
    $("lines").textContent = lines;
  }

  // ── Input helpers (DAS) ───────────────────
  function startDas(dir) {
    dasDir = dir;
    dasArmedAt = performance.now();
    dasRepeating = false;
    lastArr = 0;
    move(dir);
  }

  function stopDas(dir) {
    if (dasDir === dir) {
      dasDir = 0;
      dasRepeating = false;
    }
  }

  function processHeldInput(ts) {
    if (paused || gameOver || !running || !current) return;

    // soft drop hold
    if (softDropHeld) {
      if (ts - lastSoftDrop >= SOFT_DROP_MS) {
        softDrop();
        lastSoftDrop = ts;
        lastDrop = ts; // reset gravity while soft-dropping
      }
    }

    // DAS / ARR horizontal
    if (dasDir !== 0) {
      const held = ts - dasArmedAt;
      if (!dasRepeating) {
        if (held >= DAS) {
          dasRepeating = true;
          lastArr = ts;
          move(dasDir);
        }
      } else if (ts - lastArr >= ARR) {
        lastArr = ts;
        move(dasDir);
      }
    }
  }

  // ── Loop ──────────────────────────────────
  function loop(ts) {
    if (!running) return;
    if (!lastFrame) lastFrame = ts;
    lastFrame = ts;

    if (!paused && !gameOver && current) {
      processHeldInput(ts);

      if (flashTimer > 0) {
        flashTimer -= 16;
      } else if (!softDropHeld && ts - lastDrop >= dropInterval) {
        if (!collides(current, 0, 1)) current.y++;
        else lockPiece();
        lastDrop = ts;
      }
    }

    drawBoard();
    animId = requestAnimationFrame(loop);
  }

  // ── Screens ───────────────────────────────
  function show(screen) {
    startScreen.classList.add("hidden");
    gameScreen.classList.add("hidden");
    overScreen.classList.add("hidden");
    screen.classList.remove("hidden");
  }

  function startGame() {
    ensureAudio();
    sfx.start();
    grid = emptyGrid();
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 800;
    bag = [];
    holdPiece = null;
    holdUsed = false;
    nextPiece = null;
    current = null;
    particles = [];
    flashRows = [];
    gameOver = false;
    paused = false;
    softDropHeld = false;
    dasDir = 0;
    pauseOverlay.classList.add("hidden");
    running = true;
    lastDrop = performance.now();
    lastFrame = 0;
    lastSoftDrop = 0;
    show(gameScreen);
    // layout after visible
    requestAnimationFrame(() => {
      resizeBoard();
      spawnPiece();
      drawSide(hctx, null);
      updateHUD();
    });
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function endGame() {
    if (gameOver) return;
    gameOver = true;
    running = false;
    dasDir = 0;
    softDropHeld = false;
    sfx.over();
    if (score > best) {
      best = score;
      localStorage.setItem(STORAGE_BEST, String(best));
    }
    $("final-score").textContent = score;
    $("final-lines").textContent = lines;
    $("final-level").textContent = level;
    $("best-over").textContent = best;
    $("best-start").textContent = best;
    setTimeout(() => show(overScreen), 350);
  }

  function togglePause() {
    if (gameOver) return;
    if (gameScreen.classList.contains("hidden")) return;
    paused = !paused;
    pauseOverlay.classList.toggle("hidden", !paused);
    if (!paused) {
      lastDrop = performance.now();
      lastFrame = 0;
      lastSoftDrop = performance.now();
    } else {
      dasDir = 0;
      softDropHeld = false;
    }
  }

  async function shareGame() {
    const url = location.href;
    const text = `Я набрал(а) ${score} очков в ZYRA Tetris! 🥤 Попробуй обыграть:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "ZYRA Tetris", text, url });
        return;
      }
    } catch (_) {}
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast("Ссылка скопирована! Отправь друзьям 🔗");
    } catch (_) {
      prompt("Скопируй ссылку:", url);
    }
  }

  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 2400);
  }

  // ── Keyboard ──────────────────────────────
  window.addEventListener("keydown", (e) => {
    const block = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      " ",
      "Spacebar",
    ];
    if (block.includes(e.key) || e.code === "Space") e.preventDefault();

    if (e.repeat) {
      // allow native repeat only for soft drop feel; DAS handles L/R
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        if (!paused && running && !gameOver) softDrop();
      }
      return;
    }

    if (e.code === "KeyP" || e.code === "Escape") {
      togglePause();
      return;
    }
    if (paused || gameOver || !running) return;

    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        startDas(-1);
        break;
      case "ArrowRight":
      case "KeyD":
        startDas(1);
        break;
      case "ArrowDown":
      case "KeyS":
        softDropHeld = true;
        lastSoftDrop = 0;
        softDrop();
        break;
      case "ArrowUp":
      case "KeyW":
      case "KeyX":
        rotate(1);
        break;
      case "KeyZ":
      case "ControlLeft":
      case "ControlRight":
        rotate(-1);
        break;
      case "Space":
        hardDrop();
        break;
      case "KeyC":
      case "ShiftLeft":
      case "ShiftRight":
        hold();
        break;
    }
  });

  window.addEventListener("keyup", (e) => {
    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        stopDas(-1);
        break;
      case "ArrowRight":
      case "KeyD":
        stopDas(1);
        break;
      case "ArrowDown":
      case "KeyS":
        softDropHeld = false;
        break;
    }
  });

  window.addEventListener("blur", () => {
    dasDir = 0;
    softDropHeld = false;
  });

  // ── Touch / buttons ───────────────────────
  function bindControls() {
    const controls = $("controls");
    let holdTimer = null;
    let repeatTimer = null;

    function act(action, isRepeat = false) {
      ensureAudio();
      if (paused || gameOver || !running) return;
      switch (action) {
        case "left":
          move(-1);
          break;
        case "right":
          move(1);
          break;
        case "down":
          softDrop();
          break;
        case "rotate":
          if (!isRepeat) rotate(1);
          break;
        case "rotate-ccw":
          if (!isRepeat) rotate(-1);
          break;
        case "drop":
          if (!isRepeat) hardDrop();
          break;
        case "hold":
          if (!isRepeat) hold();
          break;
      }
    }

    controls.querySelectorAll("button").forEach((btn) => {
      const action = btn.dataset.act;
      const repeatable = action === "left" || action === "right" || action === "down";

      const start = (e) => {
        e.preventDefault();
        try {
          btn.setPointerCapture(e.pointerId);
        } catch (_) {}
        btn.classList.add("pressed");
        act(action, false);
        if (repeatable) {
          clearTimeout(holdTimer);
          clearInterval(repeatTimer);
          const interval = action === "down" ? SOFT_DROP_MS : ARR;
          holdTimer = setTimeout(() => {
            repeatTimer = setInterval(() => act(action, true), interval);
          }, DAS);
        }
      };
      const end = (e) => {
        btn.classList.remove("pressed");
        clearTimeout(holdTimer);
        clearInterval(repeatTimer);
        try {
          if (e && e.pointerId != null) btn.releasePointerCapture(e.pointerId);
        } catch (_) {}
      };
      btn.addEventListener("pointerdown", start);
      btn.addEventListener("pointerup", end);
      btn.addEventListener("pointerleave", end);
      btn.addEventListener("pointercancel", end);
      btn.addEventListener("contextmenu", (e) => e.preventDefault());
    });

    // Swipes on board
    let sx = 0,
      sy = 0,
      lx = 0,
      ly = 0,
      moved = false,
      startT = 0;

    const onStart = (x, y) => {
      sx = lx = x;
      sy = ly = y;
      moved = false;
      startT = performance.now();
    };

    const onMove = (x, y) => {
      if (paused || gameOver || !running) return;
      const dx = x - lx;
      const dy = y - ly;
      const cellPx = Math.max(22, cellW * 0.85);

      if (Math.abs(dx) >= cellPx && Math.abs(dx) > Math.abs(dy) * 1.1) {
        move(dx > 0 ? 1 : -1);
        lx = x;
        moved = true;
      } else if (dy >= cellPx * 0.7 && Math.abs(dy) > Math.abs(dx)) {
        softDrop();
        ly = y;
        moved = true;
      } else if (dy <= -cellPx * 1.2 && Math.abs(dy) > Math.abs(dx)) {
        // swipe up = hard drop
        hardDrop();
        ly = y;
        moved = true;
      }
    };

    const onEnd = () => {
      if (paused || gameOver || !running) return;
      const dt = performance.now() - startT;
      if (!moved && dt < 280) rotate(1); // tap = rotate
    };

    boardCanvas.addEventListener(
      "pointerdown",
      (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        boardCanvas.setPointerCapture(e.pointerId);
        onStart(e.clientX, e.clientY);
      },
      { passive: true }
    );
    boardCanvas.addEventListener(
      "pointermove",
      (e) => {
        if (!boardCanvas.hasPointerCapture?.(e.pointerId) && e.buttons === 0) return;
        onMove(e.clientX, e.clientY);
      },
      { passive: true }
    );
    boardCanvas.addEventListener("pointerup", onEnd);
    boardCanvas.addEventListener("pointercancel", () => {
      moved = true;
    });

    // Prevent page scroll while touching game
    boardWrap.addEventListener(
      "touchmove",
      (e) => {
        if (running && !paused) e.preventDefault();
      },
      { passive: false }
    );
  }

  // ── Init ──────────────────────────────────
  async function init() {
    // First paint: lock viewport units + device classes before UI shows
    adaptUI();
    spawnBubbles();
    $("best-start").textContent = best;
    fillFlavorPreview();

    try {
      await loadImages();
    } catch (err) {
      console.error("Asset load failed", err);
      toast("Не удалось загрузить банки — проверь assets/");
    }

    $("btn-start").addEventListener("click", startGame);
    $("btn-again").addEventListener("click", startGame);
    $("btn-share").addEventListener("click", shareGame);
    $("btn-pause").addEventListener("click", togglePause);
    $("btn-resume").addEventListener("click", togglePause);

    bindControls();

    let resizeT = 0;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        adaptUI();
        if (!gameScreen.classList.contains("hidden")) resizeBoard();
      }, 60);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", () => {
      // iOS fires early — wait for chrome settle
      setTimeout(onResize, 120);
      setTimeout(onResize, 320);
    });

    // Mobile browser URL bar show/hide
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onResize);
      window.visualViewport.addEventListener("scroll", onResize);
    }

    // Input capability can change (tablet with keyboard)
    const mqTouch = matchMedia("(pointer: coarse)");
    const mqHover = matchMedia("(hover: hover)");
    const onMq = () => onResize();
    if (mqTouch.addEventListener) {
      mqTouch.addEventListener("change", onMq);
      mqHover.addEventListener("change", onMq);
    } else {
      mqTouch.addListener(onMq);
      mqHover.addListener(onMq);
    }

    // Prevent iOS rubber-band scroll while playing
    document.body.addEventListener(
      "touchmove",
      (e) => {
        if (running && !paused && e.target.closest?.("#game-screen")) {
          if (!e.target.closest?.(".controls")) e.preventDefault();
        }
      },
      { passive: false }
    );
  }

  init();
})();
