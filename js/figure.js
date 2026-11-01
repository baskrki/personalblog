/* figure.js - draws the figure at the top of the home page: the digits of pi turn to dust.

   The plate starts as a wall made of the digits of pi. After a moment it is "snapped": a ragged
   front sweeps across the wall, every digit crumbles into grains, and the wind carries the grains
   off to the right. As they go they uncover the symbol pi, in gold. The grains are the pixels of
   the digits themselves, so nothing is added: the dust is the wall.

   The digits are worked out here (Machin's formula, in exact whole-number arithmetic), the symbol is
   the letter pi of the site's own italic font, and the picture is a plain <canvas> filled in with
   arithmetic: no library, no image file. It plays once, when the home page first opens, and a click
   on the figure plays it again. If the visitor's device asks for reduced motion, the finished picture
   is shown at once and nothing moves.

   To change how it plays, edit TIMING, WIND and SPREAD just below. */
(function () {
  "use strict";

  const L = window.Lemmata;

  /* ---------- settings ---------- */
  const W0 = 640, H0 = 440;   // the shape of the plate (as before); it scales to fit its column
  const TIMING = {            // all in seconds
    fadeIn: 0.45,             // the wall of digits appears, top to bottom
    snap:   1.25,             // the wall stands still, then the snap
    sweep:  1.9,              // the snap crosses the plate, left to right
    life:   [0.9, 1.8],       // a grain stays in the air for between these two times
    ember:  0.6               // the uncovered symbol cools from white to gold
  };
  const WIND = 28;            // degrees above the horizontal: the dust blows to the right and a little upwards...
  const SPREAD = 40;          // ...and fans out over this many degrees

  // Colours. The deep blue and the gold come from css/theme.css (change them there); the soft blue and
  // the near white are the two ends of the colour the old curves had.
  const SOFT = [104, 150, 255], PALE = [238, 245, 255];
  const hex = (name, fallback) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const h = /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
    return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  };

  /* ---------- small tools ---------- */
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const mix = (a, b, t) => a + (b - a) * t;

  // a seeded random-number generator (mulberry32), so the dust falls the same way every time
  const rng = seed => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // smooth noise: a random value at every whole-number point, blended in between
  const lattice = (i, j) => {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j;
    const s = u * u * (3 - 2 * u), t = v * v * (3 - 2 * v);
    const a = lattice(i, j), b = lattice(i + 1, j), c = lattice(i, j + 1), d = lattice(i + 1, j + 1);
    return a + (b - a) * s + (c - a) * t + (a - b - c + d) * s * t;
  };
  // patchy at three sizes at once, between 0 and 1
  const patchy = (x, y) => 0.62 * noise(x, y) + 0.28 * noise(2.3 * x + 5.2, 2.3 * y + 1.3) + 0.10 * noise(5.1 * x + 9.7, 5.1 * y + 3.1);

  // The digits of pi, "31415...", worked out with Machin's formula  pi = 16 arctan(1/5) - 4 arctan(1/239),
  // using whole numbers with ten spare digits. (BigInt is called, not written 10n, so that a very old
  // browser still reads this file; if it has no BigInt it gets the first hundred digits instead.)
  const HUNDRED = "31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679";
  const piDigits = n => {
    try {
      const B = BigInt, one = B(10) ** B(n + 10);
      const arctan = x => {                         // arctan(1/x) * one, from 1/x - 1/(3x^3) + 1/(5x^5) - ...
        x = B(x);
        let sum = B(0), term = one / x, k = B(1), sign = B(1);
        while (term > B(0)) { sum += sign * (term / k); term /= x * x; k += B(2); sign = -sign; }
        return sum;
      };
      return ((B(16) * arctan(5) - B(4) * arctan(239)) / B(10) ** B(10)).toString();
    } catch (e) {
      return HUNDRED;
    }
  };

  /* ---------- the picture, worked out for one size of plate ---------- */
  const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  const pen = c => c.getContext("2d", { willReadFrequently: true });

  // When the snap reaches a place: 0 at the left-hand edge (the bottom a little sooner) up to 1 at the far
  // side. The noise makes the front ragged, with bays and headlands about as wide as a hand.
  const reach = (W, H, x, y) => {
    const u = 0.84 * (x / W) + 0.16 * (1 - y / H);
    const v = u + 0.5 * (patchy(x / (0.14 * W), y / (0.14 * W)) - 0.5);
    return clamp((v + 0.25) / 1.5, 0, 1);
  };

  // The plate itself: deep blue with a faint grid whose centre is where the symbol will stand.
  const backdrop = sc => {
    const { pw, ph, dpr } = sc, g = pen(canvas(pw, ph));
    g.fillStyle = "rgb(" + sc.deep + ")";
    g.fillRect(0, 0, pw, ph);
    const cell = pw / 8, line = Math.max(1, Math.round(dpr * 0.8));
    for (let i = -4; i <= 4; i++) {                       // vertical lines, one every eighth of the width
      g.fillStyle = "rgba(255,255,255," + (i % 2 ? 0.055 : 0.12) + ")";
      g.fillRect(Math.round(pw / 2 + i * cell - line / 2), 0, line, ph);
    }
    for (let j = -3; j <= 3; j++) {                       // horizontal lines, the same distance apart
      g.fillStyle = "rgba(255,255,255," + (j % 2 ? 0.055 : 0.12) + ")";
      g.fillRect(0, Math.round(ph / 2 + j * cell - line / 2), pw, line);
    }
    return g.getImageData(0, 0, pw, ph).data;
  };

  // The symbol: the letter pi of the site's italic font, in the middle, about 60% as tall as the plate.
  // Every pixel it covers is listed with the moment the snap uncovers it.
  const symbol = sc => {
    const { W, H, pw, ph, dpr } = sc, g = pen(canvas(pw, ph));
    const face = size => 'italic 560 ' + size + 'px "Source Serif 4", Charter, Georgia, "Times New Roman", serif';
    g.font = face(200);
    let m = g.measureText("π");
    const k = Math.min(0.60 * ph / Math.max(1, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent),
                       0.56 * pw / Math.max(1, m.actualBoundingBoxLeft + m.actualBoundingBoxRight));
    g.font = face(200 * k);
    m = g.measureText("π");
    g.fillStyle = "#fff"; g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.fillText("π", pw / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2,
                    ph / 2 - (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2);

    const px = g.getImageData(0, 0, pw, ph).data, mask = new Uint8Array(pw * ph);
    let n = 0;
    for (let i = 0; i < mask.length; i++) if ((mask[i] = px[i * 4 + 3])) n++;
    const idx = new Uint32Array(n), cov = new Uint8Array(n), rev = new Float32Array(n), rand = rng(7);
    let latest = 0;
    for (let i = 0, j = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      idx[j] = i; cov[j] = mask[i];
      rev[j] = TIMING.snap + TIMING.sweep * reach(W, H, (i % pw) / dpr, Math.floor(i / pw) / dpr) + 0.34 + 0.22 * rand();
      if (rev[j] > latest) latest = rev[j];
      j++;
    }
    return { n, idx, cov, rev, mask, end: latest + TIMING.ember };
  };

  // The wall: rows of the digits of pi, drawn once in white and then cut into grains (about one pixel of the
  // page each). A grain remembers where it started, when the snap reaches it and how it will fly.
  const veil = sc => {
    const { W, H, pw, ph, dpr } = sc;
    const fs = clamp(W / 46, 8, 13), cw = fs * 0.62, rh = fs * 1.45;           // a digit's size and its room, in CSS pixels
    const cols = Math.floor(W / cw) - 2, rows = Math.floor(H / rh) - 2;
    const x0 = (W - cols * cw) / 2, y0 = (H - rows * rh) / 2;
    const digits = piDigits(cols * rows), text = digits[0] + "." + digits.slice(1);

    const g = pen(canvas(pw, ph));
    g.font = "500 " + fs * dpr + 'px "Hanken Grotesk", system-ui, sans-serif';
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    for (let r = 0; r < rows; r++)
      for (let q = 0; q < cols; q++)
        g.fillText(text[(r * cols + q) % text.length], (x0 + (q + 0.5) * cw) * dpr, (y0 + (r + 0.5) * rh) * dpr);

    // cut the wall into grains: one for every square of `step` device pixels that is at least a quarter inked
    const px = g.getImageData(0, 0, pw, ph).data;
    const step = Math.max(1, Math.round(Math.max(1, W / 560) * dpr)), list = [];
    for (let y = 0; y + step <= ph; y += step)
      for (let x = 0; x + step <= pw; x += step) {
        let a = 0;
        for (let v = 0; v < step; v++) for (let u = 0; u < step; u++) a += px[((y + v) * pw + x + u) * 4 + 3];
        a /= 255 * step * step;
        if (a > 0.28) list.push(x, y, a);
      }

    const n = list.length / 3, rand = rng(11), mask = sc.sym.mask;
    const f = {
      n, step, hx: new Float32Array(n), hy: new Float32Array(n), t0: new Float32Array(n), life: new Float32Array(n),
      spd: new Float32Array(n), amp: new Float32Array(n), phs: new Float32Array(n), dx: new Float32Array(n), dy: new Float32Array(n),
      cr: new Uint8Array(n), cg: new Uint8Array(n), cb: new Uint8Array(n), gold: new Uint8Array(n), end: 0
    };
    for (let k = 0; k < n; k++) {
      const hx = (list[3 * k] + step / 2) / dpr, hy = (list[3 * k + 1] + step / 2) / dpr, cover = list[3 * k + 2];
      f.hx[k] = hx; f.hy[k] = hy;

      // colour: soft blue at the edges, paler and brighter towards the middle; each digit a little different;
      // the first digits, "3.14159", the palest of all so that the wall reads as the digits of pi
      const col = Math.floor((hx - x0) / cw), row = Math.floor((hy - y0) / rh);
      const mid = clamp(1 - Math.hypot((hx - W / 2) / (W / 2), (hy - H / 2) / (H / 2)) / Math.SQRT2, 0, 1);
      const first = row === 0 && col < 7;
      const tone = first ? 1 : mid, lum = first ? 1 : (0.46 + 0.40 * mid) * (0.82 + 0.36 * lattice(col, row));
      f.cr[k] = mix(SOFT[0], PALE[0], tone) * lum * cover;
      f.cg[k] = mix(SOFT[1], PALE[1], tone) * lum * cover;
      f.cb[k] = mix(SOFT[2], PALE[2], tone) * lum * cover;

      // flight: when it lets go, how long it stays up, how fast it goes, how it sways across the wind.
      // Grains close together sway together (the phase comes from smooth noise), which makes streaks and swirls.
      f.t0[k] = TIMING.snap + TIMING.sweep * reach(W, H, hx, hy) + 0.30 * rand();
      f.life[k] = mix(TIMING.life[0], TIMING.life[1], Math.pow(rand(), 1.6));
      const way = (WIND + SPREAD * (rand() - 0.5)) * Math.PI / 180;      // its own direction, near the wind's
      f.dx[k] = Math.cos(way); f.dy[k] = -Math.sin(way);                 // (up is negative on the screen)
      f.spd[k] = W * (0.10 + 0.32 * rand());
      f.amp[k] = W * (0.010 + 0.050 * rand()) * (rand() < 0.5 ? -1 : 1);
      f.phs[k] = 6.2832 * patchy(hx / 90, hy / 90 + 40) + 0.8 * rand();
      // the grains that lay where the symbol is turn to gold as they go
      f.gold[k] = mask[Math.floor(hy * dpr) * pw + Math.floor(hx * dpr)] > 128 && rand() < 0.55 ? 1 : 0;
      f.end = Math.max(f.end, f.t0[k] + f.life[k]);
    }
    return f;
  };

  const scene = (W, H, dpr, withVeil) => {
    const sc = { W, H, dpr, pw: Math.round(W * dpr), ph: Math.round(H * dpr), deep: hex("--deep", "#0b2447"), gold: hex("--gold", "#e8a92b") };
    sc.bg = backdrop(sc);
    sc.sym = symbol(sc);
    sc.veil = withVeil ? veil(sc) : null;
    sc.sym.mask = null;                                       // only needed to find the grains that lie on the symbol
    sc.end = Math.max(sc.sym.end, sc.veil ? sc.veil.end : 0) + 0.05;
    return sc;
  };

  /* ---------- painting one moment of the picture ---------- */
  const CRUMBLE = 0.16;                                       // a grain shakes this long, then lets go

  // The symbol, uncovered pixel by pixel: a pixel appears white-hot and cools to gold.
  // d is the picture's pixels (red, green, blue, alpha, in turn); t is the time in seconds.
  const paintSymbol = (sc, d, t) => {
    const { n, idx, cov, rev } = sc.sym, G = sc.gold;
    for (let k = 0; k < n; k++) {
      const age = t - rev[k];
      if (age < 0) continue;
      const heat = age < TIMING.ember ? 1 - age / TIMING.ember : 0, w = heat * heat;    // how white it still is
      const q = cov[k] / 255 * Math.min(1, age * 8), o = idx[k] * 4;
      d[o]     += (G[0] + (255 - G[0]) * w - d[o]) * q;
      d[o + 1] += (G[1] + (255 - G[1]) * w - d[o + 1]) * q;
      d[o + 2] += (G[2] + (255 - G[2]) * w - d[o + 2]) * q;
    }
  };

  // The wall and its dust. Every grain is added to the light already there, so where grains overlap the dust glows.
  const paintVeil = (sc, d, t) => {
    const f = sc.veil, G = sc.gold, { W, H, dpr, pw, ph } = sc, size = f.step, half = size / 2, lift = 0.06 * W;
    for (let k = 0; k < f.n; k++) {
      const s = t - f.t0[k];                                  // seconds since the snap reached this grain
      let x = f.hx[k], y = f.hy[k], r = f.cr[k], g = f.cg[k], b = f.cb[k], al = 1;
      if (s < 0) {                                            // still part of the wall; the rows appear one after another
        al = clamp((t - 0.5 * TIMING.fadeIn * y / H) / (0.5 * TIMING.fadeIn), 0, 1);
        if (al === 0) continue;
      } else {
        if (s >= f.life[k]) continue;                         // gone
        if (f.gold[k]) { r = G[0] * 0.85; g = G[1] * 0.85; b = G[2] * 0.85; }
        const white = Math.max(0, 1 - s / 0.35) * 0.9;        // a flash as it lets go: this is the bright edge of the snap
        r += (255 - r) * white; g += (255 - g) * white; b += (255 - b) * white;
        const fly = s - CRUMBLE;
        if (fly < 0) {                                        // shaking, just before it goes
          x += Math.sin(k * 12.9898 + s * 70) * 0.7;
          y += Math.cos(k * 78.233 + s * 70) * 0.7;
        } else {                                              // blown away: faster and faster, swaying, and rising
          const dx = f.dx[k], dy = f.dy[k];                   // its direction; (-dy, dx) is across it
          const along = f.spd[k] * fly * Math.sqrt(fly), sway = f.amp[k] * Math.sin(f.phs[k] + 3.1 * fly) * fly;
          x += dx * along - dy * sway;
          y += dy * along + dx * sway - 0.5 * lift * fly * fly;
          if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
          al = 1 - fly / (f.life[k] - CRUMBLE);
          al *= al;
        }
      }
      r *= al; g *= al; b *= al;
      const X = Math.round(x * dpr - half), Y = Math.round(y * dpr - half);
      for (let v = 0; v < size; v++) {
        const yy = Y + v;
        if (yy < 0 || yy >= ph) continue;
        for (let u = 0; u < size; u++) {
          const xx = X + u;
          if (xx < 0 || xx >= pw) continue;
          const o = (yy * pw + xx) * 4;
          d[o] += r; d[o + 1] += g; d[o + 2] += b;
        }
      }
    }
  };

  // Draw the picture as it is t seconds after the start (Infinity = the finished picture).
  const paint = (sc, ctx, img, t) => {
    img.data.set(sc.bg);
    paintSymbol(sc, img.data, t);
    if (sc.veil) paintVeil(sc, img.data, t);
    ctx.putImageData(img, 0, 0);
  };

  /* ---------- the page side: starting, resizing, playing again ---------- */
  const still = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  // the two fonts the picture uses, loaded before it is drawn (it never waits longer than a moment)
  const fontsReady = () => {
    const f = document.fonts;
    if (!f || !f.load) return Promise.resolve();
    const both = Promise.all([f.load('italic 560 100px "Source Serif 4"', "π"), f.load('500 12px "Hanken Grotesk"', "3.14159")]);
    return Promise.race([both, new Promise(done => setTimeout(done, 1500))]).catch(() => {});
  };

  // run `go` once, when at least 40% of the plate is on the screen (so nobody misses the snap)
  const whenSeen = (el, go) => {
    if (!("IntersectionObserver" in window)) return go();
    const io = new IntersectionObserver(list => {
      if (list.some(e => e.isIntersecting)) { io.disconnect(); go(); }
    }, { threshold: 0.4 });
    io.observe(el);
  };

  // One of these is made every time the home page is drawn. mode: "still" (the finished picture),
  // "wait" (the wall is ready, waiting to be seen) or "play" (the snap is happening).
  const run = (plate, cv, autoplay) => {
    const ctx = cv.getContext("2d", { alpha: false });
    let sc = null, img = null, mode = "still", t = Infinity, raf = 0, start = null, lastW = 0, lastDpr = 0, ro = null, timer = 0;

    const build = withVeil => {
      const W = plate.getBoundingClientRect().width, dpr = clamp(window.devicePixelRatio || 1, 1, 3);
      if (W < 40) return false;                              // not showing (hidden): nothing to draw on
      sc = scene(W, W * H0 / W0, dpr, withVeil);
      cv.width = sc.pw; cv.height = sc.ph;
      img = ctx.createImageData(sc.pw, sc.ph);
      lastW = W; lastDpr = dpr;
      return true;
    };
    const show = at => { t = at; paint(sc, ctx, img, at); };

    const tick = ts => {
      raf = 0;
      if (!cv.isConnected || mode !== "play") return;
      if (start === null) start = ts;
      const at = (ts - start) / 1000;
      if (at >= sc.end) { mode = "still"; sc.veil = null; show(Infinity); return; }
      show(at);
      raf = requestAnimationFrame(tick);
    };
    const begin = () => { mode = "play"; start = null; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };

    // a click (or Enter, or Space) on the figure plays it again
    const replay = () => {
      if (!sc || (!sc.veil && !build(true))) return;
      show(0);
      begin();
    };
    plate.addEventListener("click", replay);
    plate.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); replay(); }
    });

    // keep the picture sharp when the plate changes size (a turned phone, a resized window)
    const resize = () => {
      if (!cv.isConnected) { if (ro) ro.disconnect(); return; }
      const W = plate.getBoundingClientRect().width, dpr = clamp(window.devicePixelRatio || 1, 1, 3);
      if (!sc || (Math.abs(W - lastW) < 0.5 && dpr === lastDpr)) return;
      if (build(mode !== "still")) show(t);
    };
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(resize, 120); });
      ro.observe(plate);
    }

    return fontsReady().then(() => {
      if (!cv.isConnected || !build(autoplay)) return;
      if (!autoplay) return show(Infinity);
      mode = "wait";
      show(0);                                               // the bare grid, until the plate is on the screen
      whenSeen(plate, () => { if (cv.isConnected && mode === "wait") begin(); });
    });
  };

  /* ---------- what the rest of the site uses ---------- */
  // Called by the router after the home page is in place: finds the figure and brings it to life.
  L.mountFigure = function (root) {
    const plate = root && root.querySelector(".plate"), cv = plate && plate.querySelector("canvas");
    if (!cv || !cv.getContext) return;
    const warn = e => { if (window.console) console.warn("[Lemmata] The figure could not be drawn: " + (e && e.message)); };
    try { run(plate, cv, plate.dataset.play === "1").catch(warn); } catch (e) { warn(e); }
  };

  // L.figure({ play }) -> { html, caption }.  play = true plays the snap (the home page does this once).
  L.figure = function (opt) {
    const note = L.bySlug && L.bySlug.get("basel-via-parseval");
    const moves = !still(), play = moves && !!(opt && opt.play);
    const label = moves
      ? "The digits of pi turn to dust and uncover the symbol pi. Press to play it again."
      : "The symbol pi, in gold on dark blue squared paper.";
    return {
      html: `<div class="plate${moves ? " live" : ""}" data-play="${play ? 1 : 0}" ` +
            (moves ? `role="button" tabindex="0"` : `role="img"`) + ` aria-label="${label}"><canvas></canvas></div>`,
      caption:
        `<b>Figure 1.</b> The digits of <span class="m">π</span>, 3.14159 26535 89793 …, turn to dust and uncover the symbol they stand for.` +
        (moves ? ` Click the figure to see it again.` : ``) +
        (note ? ` The sum <span class="m">Σ 1/<i>n</i>² = π²/6</span> is proved in <a href="#/post/${note.slug}">${L.esc(note.title)}</a>.` : "")
    };
  };

})();
