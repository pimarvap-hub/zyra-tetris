/* ═══════════════════════════════════════════
   ZYRA TETRIS — cans as blocks
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

  // 7 classic pieces → flavor index (6 flavors, I reuses anar glow style)
  const PIECE_FLAVOR = [0, 1, 2, 3, 4, 5, 0]; // I O T S Z J L

  // Tetromino shapes (4x4 matrices, rotations)
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

  // ── DOM ───────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const boardCanvas = $("board");
  const nextCanvas = $("next");
  const holdCanvas = $("hold");
  const ctx = boardCanvas.getContext("2d");
  const nctx = nextCanvas.getContext("2d");
  const hctx = holdCanvas.getContext("2d");

  const startScreen = $("start-screen");
  const gameScreen = $("game-screen");
  const overScreen = $("over-screen");
  const pauseOverlay = $("pause-overlay");
  const boardWrap = document.querySelector(".board-wrap");

  // ── State ─────────────────────────────────
  let images = {};
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

  // ── Audio (WebAudio beeps) ────────────────
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
    move: () => beep(220, 0.04, "square", 0.03),
    rotate: () => beep(330, 0.05, "triangle", 0.04),
    drop: () => beep(120, 0.08, "square", 0.05),
    lock: () => beep(180, 0.07, "triangle", 0.04),
    clear: () => {
      beep(440, 0.08, "sine", 0.05);
      setTimeout(() => beep(660, 0.1, "sine", 0.05), 60);
      setTimeout(() => beep(880, 0.12, "sine", 0.05), 120);
    },
    over: () => {
      beep(300, 0.15, "sawtooth", 0.04);
      setTimeout(() => beep(200, 0.2, "sawtooth", 0.04), 120);
      setTimeout(() => beep(120, 0.3, "sawtooth", 0.04), 260);
    },
    start: () => {
      beep(392, 0.08, "sine", 0.05);
      setTimeout(() => beep(523, 0.1, "sine", 0.05), 80);
      setTimeout(() => beep(659, 0.14, "sine", 0.05), 160);
    },
  };

  // ── Load images ───────────────────────────
  function loadImages() {
    return Promise.all(
      FLAVORS.map(
        (f) =>
          new Promise((resolve, reject) => {
            const img = new Image();
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

  // ── Bubbles background ────────────────────
  function spawnBubbles() {
    const host = $("bubbles");
    host.innerHTML = "";
    for (let i = 0; i < 22; i++) {
      const s = document.createElement("span");
      const size = 6 + Math.random() * 18;
      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDuration = 8 + Math.random() * 14 + "s";
      s.style.animationDelay = Math.random() * 10 + "s";
      host.appendChild(s);
    }
  }

  // ── Flavor preview on start ───────────────
  function fillFlavorPreview() {
    const row = $("flavor-preview");
    row.innerHTML = "";
    FLAVORS.forEach((f) => {
      const img = document.createElement("img");
      img.src = f.src;
      img.alt = f.name;
      row.appendChild(img);
    });
  }

  // ── Bag randomizer ────────────────────────
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
    const flavorIdx = PIECE_FLAVOR[typeIndex];
    return {
      type,
      rot: 0,
      x: 3,
      y: 0,
      flavor: flavorIdx,
    };
  }

  function shapeOf(piece) {
    return SHAPES[piece.type][piece.rot];
  }

  // ── Grid helpers ──────────────────────────
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
        if (y < ROWS && x >= 0 && x < COLS) {
          grid[y][x] = current.flavor;
        }
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
    flashTimer = 220;
    boardWrap.classList.add("flash");
    setTimeout(() => boardWrap.classList.remove("flash"), 350);
    sfx.clear();

    // particles
    full.forEach((y) => {
      for (let x = 0; x < COLS; x++) {
        const flavor = grid[y][x];
        const col = FLAVORS[flavor]?.color || "#fff";
        for (let i = 0; i < 4; i++) {
          particles.push({
            x: (x + 0.5) * cellW,
            y: (y + 0.5) * cellH,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.8) * 5,
            life: 1,
            color: col,
            size: 3 + Math.random() * 4,
          });
        }
      }
    });

    // remove after flash
    setTimeout(() => {
      const keep = grid.filter((_, y) => !full.includes(y));
      while (keep.length < ROWS) keep.unshift(Array(COLS).fill(null));
      grid = keep;
      flashRows = [];

      const n = full.length;
      const points = [0, 100, 300, 500, 800][n] * level;
      score += points;
      lines += n;
      const newLevel = Math.floor(lines / 8) + 1;
      if (newLevel !== level) {
        level = newLevel;
        dropInterval = Math.max(100, 800 - (level - 1) * 70);
      }
      updateHUD();
    }, 200);
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
    if (!current || paused || gameOver) return;
    if (!collides(current, 0, 1)) {
      current.y++;
      score += 1;
      updateHUD();
    } else {
      lockPiece();
    }
  }

  function move(dx) {
    if (!current || paused || gameOver) return;
    if (!collides(current, dx, 0)) {
      current.x += dx;
      sfx.move();
    }
  }

  function rotate(dir = 1) {
    if (!current || paused || gameOver) return;
    const nextRot = (current.rot + dir + 4) % 4;
    // wall kicks
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks) {
      if (!collides(current, k, 0, nextRot)) {
        current.rot = nextRot;
        current.x += k;
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

  // ── Ghost piece ───────────────────────────
  function ghostY() {
    if (!current) return 0;
    let gy = 0;
    while (!collides(current, 0, gy + 1)) gy++;
    return current.y + gy;
  }

  // ── Drawing ───────────────────────────────
  function resizeBoard() {
    const rect = boardWrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = rect.width;
    const cssH = rect.height;
    boardCanvas.width = Math.floor(cssW * dpr);
    boardCanvas.height = Math.floor(cssH * dpr);
    boardCanvas.style.width = cssW + "px";
    boardCanvas.style.height = cssH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cellW = cssW / COLS;
    cellH = cssH / ROWS;
  }

  function drawCan(c, img, x, y, w, h, alpha = 1, glow = null) {
    if (!img) return;
    c.save();
    c.globalAlpha = alpha;
    if (glow) {
      c.shadowColor = glow;
      c.shadowBlur = 12;
    }
    // fit full can into cell with small padding
    const padX = w * 0.08;
    const padY = h * 0.04;
    const dw = w - padX * 2;
    const dh = h - padY * 2;
    const ir = img.width / img.height;
    let rw = dw;
    let rh = rw / ir;
    if (rh > dh) {
      rh = dh;
      rw = rh * ir;
    }
    const dx = x + (w - rw) / 2;
    const dy = y + (h - rh) / 2;
    c.drawImage(img, dx, dy, rw, rh);
    c.restore();
  }

  function drawCellBg(c, x, y, w, h, color, alpha = 0.15) {
    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = color;
    const r = Math.min(w, h) * 0.18;
    roundRect(c, x + 1, y + 1, w - 2, h - 2, r);
    c.fill();
    c.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function drawBoard() {
    const W = boardCanvas.clientWidth;
    const H = boardCanvas.clientHeight;
    ctx.clearRect(0, 0, W, H);

    // subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellW, 0);
      ctx.lineTo(x * cellW, H);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellH);
      ctx.lineTo(W, y * cellH);
      ctx.stroke();
    }

    // locked cells
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const f = grid[y][x];
        if (f === null) continue;
        const flavor = FLAVORS[f];
        const flashing = flashRows.includes(y);
        drawCellBg(ctx, x * cellW, y * cellH, cellW, cellH, flavor.color, flashing ? 0.55 : 0.18);
        drawCan(
          ctx,
          images[flavor.id],
          x * cellW,
          y * cellH,
          cellW,
          cellH,
          flashing ? 0.4 + 0.6 * Math.abs(Math.sin(performance.now() / 40)) : 1,
          flavor.color
        );
      }
    }

    // ghost
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
          drawCan(
            ctx,
            images[flavor.id],
            x * cellW,
            y * cellH,
            cellW,
            cellH,
            0.22,
            null
          );
        }
      }
    }

    // active piece
    if (current && !gameOver) {
      const shape = shapeOf(current);
      const flavor = FLAVORS[current.flavor];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!shape[r][c]) continue;
          const x = current.x + c;
          const y = current.y + r;
          if (y < 0) continue;
          drawCellBg(ctx, x * cellW, y * cellH, cellW, cellH, flavor.color, 0.28);
          drawCan(
            ctx,
            images[flavor.id],
            x * cellW,
            y * cellH,
            cellW,
            cellH,
            1,
            flavor.color
          );
        }
      }
    }

    // particles
    particles = particles.filter((p) => p.life > 0);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= 0.025;
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
    const W = c.canvas.width;
    const H = c.canvas.height;
    c.clearRect(0, 0, W, H);
    if (!piece) return;
    const shape = SHAPES[piece.type][0];
    const flavor = FLAVORS[piece.flavor];
    const img = images[flavor.id];
    // bounding box of shape
    let minR = 4, maxR = -1, minC = 4, maxC = -1;
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
    const cell = Math.min(W / (bw + 0.6), H / (bh + 0.6));
    const ox = (W - bw * cell) / 2;
    const oy = (H - bh * cell) / 2;
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        if (!shape[r][col]) continue;
        const x = ox + (col - minC) * cell;
        const y = oy + (r - minR) * cell;
        drawCan(c, img, x, y, cell, cell, 1, flavor.color);
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

  // ── Game loop ─────────────────────────────
  function loop(ts) {
    if (!running) return;
    if (!lastFrame) lastFrame = ts;
    const dt = ts - lastFrame;
    lastFrame = ts;

    if (!paused && !gameOver && current) {
      if (flashTimer > 0) {
        flashTimer -= dt;
      } else if (ts - lastDrop >= dropInterval) {
        if (!collides(current, 0, 1)) {
          current.y++;
        } else {
          lockPiece();
        }
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
    pauseOverlay.classList.add("hidden");
    running = true;
    lastDrop = performance.now();
    lastFrame = 0;
    show(gameScreen);
    resizeBoard();
    spawnPiece();
    drawSide(hctx, null);
    updateHUD();
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function endGame() {
    if (gameOver) return;
    gameOver = true;
    running = false;
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
    setTimeout(() => show(overScreen), 400);
  }

  function togglePause() {
    if (gameOver || startScreen.classList.contains("hidden") === false) return;
    if (!gameScreen.classList.contains("hidden") === false) return;
    paused = !paused;
    pauseOverlay.classList.toggle("hidden", !paused);
    if (!paused) {
      lastDrop = performance.now();
      lastFrame = 0;
    }
  }

  // ── Share ─────────────────────────────────
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

  // ── Input ─────────────────────────────────
  const keys = {};
  let softDropHeld = false;

  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
    }
    if (keys[e.code]) return;
    keys[e.code] = true;

    if (e.code === "KeyP" || e.code === "Escape") {
      togglePause();
      return;
    }
    if (paused || gameOver || !running) return;

    switch (e.code) {
      case "ArrowLeft":
      case "KeyA":
        move(-1);
        break;
      case "ArrowRight":
      case "KeyD":
        move(1);
        break;
      case "ArrowDown":
      case "KeyS":
        softDropHeld = true;
        softDrop();
        break;
      case "ArrowUp":
      case "KeyW":
      case "KeyX":
        rotate(1);
        break;
      case "KeyZ":
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
    keys[e.code] = false;
    if (e.code === "ArrowDown" || e.code === "KeyS") softDropHeld = false;
  });

  // touch / buttons
  function bindControls() {
    const controls = $("controls");
    let holdTimer = null;
    let repeatTimer = null;

    function act(action) {
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
          rotate(1);
          break;
        case "drop":
          hardDrop();
          break;
        case "hold":
          hold();
          break;
      }
    }

    controls.querySelectorAll("button").forEach((btn) => {
      const action = btn.dataset.act;
      const start = (e) => {
        e.preventDefault();
        act(action);
        if (action === "left" || action === "right" || action === "down") {
          clearTimeout(holdTimer);
          clearInterval(repeatTimer);
          holdTimer = setTimeout(() => {
            repeatTimer = setInterval(() => act(action), action === "down" ? 50 : 80);
          }, 220);
        }
      };
      const end = () => {
        clearTimeout(holdTimer);
        clearInterval(repeatTimer);
      };
      btn.addEventListener("pointerdown", start);
      btn.addEventListener("pointerup", end);
      btn.addEventListener("pointerleave", end);
      btn.addEventListener("pointercancel", end);
    });

    // swipe on board
    let sx = 0, sy = 0, moved = false;
    boardCanvas.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches[0]) return;
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
        moved = false;
      },
      { passive: true }
    );
    boardCanvas.addEventListener(
      "touchmove",
      (e) => {
        if (!e.touches[0] || paused || gameOver) return;
        const dx = e.touches[0].clientX - sx;
        const dy = e.touches[0].clientY - sy;
        if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) {
          move(dx > 0 ? 1 : -1);
          sx = e.touches[0].clientX;
          moved = true;
        } else if (dy > 36 && Math.abs(dy) > Math.abs(dx)) {
          softDrop();
          sy = e.touches[0].clientY;
          moved = true;
        }
      },
      { passive: true }
    );
    boardCanvas.addEventListener("touchend", (e) => {
      if (moved || paused || gameOver) return;
      // tap = rotate
      rotate(1);
    });
  }

  // ── Init ──────────────────────────────────
  async function init() {
    spawnBubbles();
    $("best-start").textContent = best;
    fillFlavorPreview();

    try {
      await loadImages();
    } catch (err) {
      console.error("Asset load failed", err);
      toast("Не удалось загрузить банки — проверь файлы assets/");
    }

    $("btn-start").addEventListener("click", startGame);
    $("btn-again").addEventListener("click", startGame);
    $("btn-share").addEventListener("click", shareGame);
    $("btn-pause").addEventListener("click", togglePause);
    $("btn-resume").addEventListener("click", togglePause);

    bindControls();
    window.addEventListener("resize", () => {
      if (running) resizeBoard();
    });
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        if (running) resizeBoard();
      }, 200);
    });
  }

  init();
})();
