/* pdfviewer.js - the PDF page: a file card (name, size, "Download File") with a PDF viewer under it.
   It opens from the "View PDF" links of the Math page (address  #/math/<id>/pdf ).

   Why not simply <iframe src="…pdf">?  The PDFs live on GitHub, which sends its raw files with
   "X-Frame-Options: deny" and as a plain download, so a browser refuses to show them inside another
   page. What GitHub does allow is a script reading the file. So this file reads the PDF itself and
   draws it with PDF.js (Mozilla's open-source PDF reader, loaded from a CDN the first time a PDF page
   is opened). The same viewer, with the same toolbar, then works in every browser and on phones.

   Pieces: the markup (L.pdfBlock), starting and stopping (L.mountPdf / L.unmountPdf, called by
   js/router.js), and start(), which is the viewer itself. Its look is in css/pdf.css. */
(function () {
  "use strict";

  const L = window.Lemmata, esc = L.esc;

  /* ---------- settings ---------- */
  // PDF.js (the open-source PDF reader that this viewer is built on) comes from the first of these addresses that
  // works. To use another version, change the number (the code below was written for version 6). To serve it from
  // this site instead of a CDN, see "The PDF viewer" in README.md and put the folder's address first in the list.
  const PDFJS_VERSION = "6.4.299";
  const PDFJS_HOSTS = [
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@" + PDFJS_VERSION + "/",
    "https://unpkg.com/pdfjs-dist@" + PDFJS_VERSION + "/"
  ];
  const PDFJS_BUILD = "legacy/build/";       // the build that also runs on somewhat older browsers

  const ZOOMS = [25, 33, 50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400];   // zoom steps in percent; 100% is printed size
  const PX_PER_PT = 96 / 72;                 // screen pixels in one PDF point at 100%
  const MIN_SCALE = ZOOMS[0] / 100 * PX_PER_PT, MAX_SCALE = ZOOMS[ZOOMS.length - 1] / 100 * PX_PER_PT;
  // the biggest picture drawn for one page: an iPhone or iPad gives a web page much less picture memory than a computer does
  const IOS = /iP(?:hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const MAX_PIXELS = (IOS ? 5 : 16) * 1024 * 1024;
  const THUMB = 112;                         // width of a page thumbnail in the side list

  /* ---------- small helpers ---------- */
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const sizeText = n => n < 999500 ? Math.max(1, Math.round(n / 1000)) + " kB" : (n / 1e6).toFixed(n < 9.95e6 ? 1 : 0) + " MB";
  const safeHref = u => /^(?:https?:|mailto:)/i.test(u || "");

  // GitHub's "…/raw/…" address redirects to raw.githubusercontent.com, and a script is not allowed to follow
  // that redirect; so ask for the final address straight away.
  const rawUrl = url => {
    const m = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/(?:raw|blob)\/([^?#]+)/i.exec(url);
    return m ? "https://raw.githubusercontent.com/" + m[1] + "/" + m[2] : url;
  };

  /* ---------- the markup ---------- */
  const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
  const ICON = {
    menu:     svg("M3 6h18M3 12h18M3 18h18"),
    minus:    svg("M5 12h14"),
    plus:     svg("M12 5v14M5 12h14"),
    fitPage:  svg("M9 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM12 7v10M10 9l2-2 2 2M10 15l2 2 2-2"),
    fitWidth: svg("M4 5v14M20 5v14M8 12h8M10.5 9.5 8 12l2.5 2.5M13.5 9.5 16 12l-2.5 2.5"),
    rotate:   svg("M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10"),
    download: svg("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"),
    open:     svg("M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"),
    full:     svg("M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"),
    unfull:   svg("M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M16 21v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"),
    chevron:  svg("M9 18l6-6-6-6"),
    arrow:    svg("M12 4v11M7.5 11 12 15.5 16.5 11M5 20h14")
  };

  const button = (act, label, icon, more) =>
    `<button type="button" class="pb" data-act="${act}" aria-label="${label}" title="${label}"${more || ""} disabled>${icon}</button>`;

  const toolbar = () =>
    `<div class="pdf-bar" role="toolbar" aria-label="PDF controls">` +
      button("side", "Show contents and pages", ICON.menu, ' aria-expanded="false" aria-controls="pdf-side"') +
      `<div class="pb-page"><input class="pb-num" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" value="1" aria-label="Page number" disabled>` +
        `<span aria-hidden="true">/</span><span class="pb-total">–</span></div>` +
      `<i class="pb-sep" aria-hidden="true"></i>` +
      button("out", "Zoom out", ICON.minus) + `<span class="pb-zoom" aria-live="polite"></span>` + button("in", "Zoom in", ICON.plus) +
      `<i class="pb-sep" aria-hidden="true"></i>` +
      button("fit", "Fit to page", ICON.fitPage) + button("rot", "Rotate clockwise", ICON.rotate) +
      `<span class="pb-fill"></span>` +
      button("dl", "Download", ICON.download) + button("open", "Open in a new tab", ICON.open) + button("full", "Full screen", ICON.full) +
    `</div>`;

  const sidebar = () =>
    `<aside class="pdf-side" id="pdf-side" aria-label="Contents and pages" hidden>` +
      `<div class="pdf-seg"><button type="button" data-tab="outline" aria-pressed="false">Contents</button>` +
        `<button type="button" data-tab="thumbs" aria-pressed="true">Pages</button></div>` +
      `<div class="pdf-panel" data-panel="outline" hidden></div><div class="pdf-panel" data-panel="thumbs"></div>` +
    `</aside>`;

  // The file card and the viewer, as one piece of HTML. `kind` is the optional "Resource Type" line above them.
  L.pdfBlock = (url, kind) => {
    const name = L.pdfName(url);
    return (kind ? `<p class="pdf-type"><b>Resource Type:</b> <span>${esc(kind)}</span></p>` : "") +
      `<div class="pdf-block mathjax_ignore tex2jax_ignore" data-src="${esc(url)}" data-name="${esc(name)}">` +    // (those two classes tell MathJax, old and new, to leave this block alone)
        `<div class="pdf-file">` +
          `<div class="pdf-ico"><b>PDF</b>${ICON.arrow}<span data-size>…</span></div>` +
          `<p class="pdf-name">${esc(name)}</p>` +
          `<a class="pdf-dl" href="${esc(url)}" download="${esc(name)}" target="_blank" rel="noopener" data-act="dl">Download File</a>` +
        `</div>` +
        `<div class="pdf-viewer" role="group" aria-label="PDF viewer: ${esc(name)}">` +
          toolbar() +
          `<div class="pdf-body">` + sidebar() +
            `<div class="pdf-stage" tabindex="0" role="region" aria-label="Pages of ${esc(name)}"><div class="pdf-pages"></div></div>` +
            `<div class="pdf-status" role="status"><p class="pdf-msg">Loading…</p><span class="pdf-prog" hidden><i></i></span><p class="pdf-alt" hidden></p></div>` +
          `</div>` +
        `</div>` +
      `</div>`;
  };

  /* ---------- getting the reader and the file ---------- */
  let libTries = 0, libPromise = null;
  // Load PDF.js, once. Resolves to { lib, host }: the library and the address it came from.
  const loadLib = () => libPromise || (libPromise = (async () => {
    let last = null;
    const bust = libTries++ ? "?retry=" + libTries : "";      // a failed address is remembered by the browser, so a retry asks differently
    for (const where of PDFJS_HOSTS) {
      const host = new URL(where, document.baseURI).href;      // an address inside this site (such as "vendor/pdfjs/") becomes a full address
      try {
        const lib = await import(host + PDFJS_BUILD + "pdf.min.mjs" + bust);
        lib.GlobalWorkerOptions.workerSrc = host + PDFJS_BUILD + "pdf.worker.min.mjs";
        return { lib, host };
      } catch (e) { last = e; }
    }
    libPromise = null;                                         // the next visit to a PDF page tries again
    throw last || new Error("PDF.js could not be loaded.");
  })());

  const blobs = new Map();                                     // address -> the file, kept while the site stays open

  // Download a PDF as a Blob, reporting progress. (A GitHub address is first turned into the direct one: see rawUrl.)
  const download = async (url, signal, onSize, onProgress) => {
    const res = await fetch(rawUrl(url), { signal, credentials: "omit" });
    if (!res.ok) throw Object.assign(new Error("HTTP " + res.status), { status: res.status });
    const total = +res.headers.get("content-length") || 0;
    if (total) onSize(total);
    const parts = [];
    let got = 0;
    if (res.body && res.body.getReader) {
      const rd = res.body.getReader();
      for (;;) {
        const { done, value } = await rd.read();
        if (done) break;
        parts.push(value);
        got += value.length;
        onProgress(got, total);
      }
    } else {
      parts.push(new Uint8Array(await res.arrayBuffer()));
    }
    const blob = new Blob(parts, { type: "application/pdf" });
    // a PDF starts with "%PDF-"; anything else (an error page, a Git LFS stand-in) is not one
    const head = new TextDecoder("latin1").decode(await blob.slice(0, 1024).arrayBuffer());
    if (head.indexOf("%PDF-") < 0) throw Object.assign(new Error("not a PDF"), { notPdf: true });
    return blob;
  };

  /* ---------- the viewer ---------- */
  let current = null;                          // the viewer on the screen (there is at most one)

  const start = root => {
    const q = s => root.querySelector(s), qa = s => Array.from(root.querySelectorAll(s));
    const viewer = q(".pdf-viewer"), stage = q(".pdf-stage"), pagesEl = q(".pdf-pages"), status = q(".pdf-status"),
          msg = q(".pdf-msg"), prog = q(".pdf-prog"), alt = q(".pdf-alt"), side = q(".pdf-side"),
          num = q(".pb-num"), total = q(".pb-total"), zoomEl = q(".pb-zoom"),
          outlineEl = q('[data-panel="outline"]'), thumbsEl = q('[data-panel="thumbs"]');
    const src = root.dataset.src, name = root.dataset.name;
    const ctl = act => q('.pdf-bar [data-act="' + act + '"]');

    let dead = false;                          // set when the visitor leaves the page: every unfinished job stops
    const abort = new AbortController();
    const undo = [];                           // listeners to remove when leaving
    const on = (el, type, fn, opt) => { el.addEventListener(type, fn, opt); undo.push(() => el.removeEventListener(type, fn, opt)); };

    let lib = null, task = null, doc = null, blob = null, tabUrl = null;
    let pages = [], io = null, ro = null;
    const visible = new Set();                 // the pages near the screen: only these are drawn
    let scale = 1, mode = "width", rot = 0, shown = 1;     // mode: "width" and "page" follow the window; "custom" stays put

    /* --- messages over the pages --- */
    const say = (text, o) => {
      o = o || {};
      status.hidden = false;
      status.classList.toggle("is-error", !!o.error);
      viewer.classList.toggle("is-failed", !!o.error);                 // css/pdf.css then leaves out the controls that cannot work
      viewer.classList.toggle("no-file", !!o.error && !blob);          // ...and the whole bar, when the file itself never arrived
      msg.textContent = text;
      prog.hidden = o.progress == null;
      prog.classList.toggle("ind", o.progress != null && o.progress < 0);       // length unknown: a bar that moves by itself
      if (o.progress != null && o.progress >= 0) prog.firstChild.style.width = Math.round(o.progress * 100) + "%";
      alt.hidden = !o.error;
      if (o.error) alt.innerHTML = `You can still <a href="${esc(src)}" target="_blank" rel="noopener">download the PDF</a>.`;
    };
    const hush = () => { status.hidden = true; };

    const setSize = n => qa("[data-size]").forEach(e => { e.textContent = sizeText(n); });

    /* --- download and "open in a new tab" use the copy of the file already in memory --- */
    const save = () => {
      if (!blob) return false;
      const u = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = u; a.download = name; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 30000);
      return true;
    };
    const openTab = () => {
      if (!blob) return;
      if (!tabUrl) tabUrl = URL.createObjectURL(blob);
      window.open(tabUrl, "_blank");               // the browser's own PDF reader shows it (it has print and search); this is our own copy of the file, so no "noopener" is needed
    };

    /* --- sizes: a page is drawn `scale` screen pixels per PDF point --- */
    const turned = () => rot % 180 !== 0;
    const pw = p => (turned() ? p.h : p.w), ph = p => (turned() ? p.w : p.h);      // size in points, as turned
    const sizePage = p => {
      p.el.style.width = Math.floor(pw(p) * scale) + "px";
      p.el.style.height = Math.floor(ph(p) * scale) + "px";
    };
    const pad = () => parseFloat(getComputedStyle(stage).paddingLeft) || 0;     // the space around the pages (css/pdf.css)
    const fitScale = m => {
      const p = pages[shown - 1] || pages[0], pd = pad();
      const aw = Math.max(50, stage.clientWidth - 2 * pd), ah = Math.max(50, stage.clientHeight - 2 * pd);
      return m === "page" ? Math.min(aw / pw(p), ah / ph(p)) : aw / pw(p);
    };

    // remember where we are (which page, how far down it, how far across), so a zoom keeps the same spot in view
    const anchor = () => {
      const p = pages[shown - 1];
      if (!p || !p.el.offsetHeight) return null;
      return { n: shown, f: (stage.scrollTop - p.el.offsetTop) / p.el.offsetHeight, x: (stage.scrollLeft + stage.clientWidth / 2) / Math.max(1, stage.scrollWidth) };
    };
    const restore = k => {
      if (!k) return;
      const p = pages[k.n - 1];
      stage.scrollTop = p.el.offsetTop + k.f * p.el.offsetHeight;
      stage.scrollLeft = Math.max(0, k.x * stage.scrollWidth - stage.clientWidth / 2);
    };

    const syncBar = () => {
      zoomEl.textContent = Math.round(scale / PX_PER_PT * 100) + "%";
      ctl("out").disabled = scale <= MIN_SCALE * 1.001;
      ctl("in").disabled = scale >= MAX_SCALE * 0.999;
      const b = ctl("fit"), toWidth = mode === "page", label = toWidth ? "Fit to width" : "Fit to page";
      b.innerHTML = toWidth ? ICON.fitWidth : ICON.fitPage;
      b.title = label; b.setAttribute("aria-label", label);
    };

    // set the zoom (and, optionally, the mode), then draw what is on the screen again
    const apply = (s, m) => {
      if (!pages.length) return;
      const keep = anchor();
      scale = clamp(s, MIN_SCALE, MAX_SCALE);
      if (m) mode = m;
      pagesEl.style.setProperty("--scale-factor", scale);          // PDF.js's text layer sizes itself from these
      pagesEl.style.setProperty("--total-scale-factor", scale);
      pages.forEach(sizePage);
      restore(keep);
      syncBar();
      visible.forEach(draw);
    };
    const fitTo = m => apply(fitScale(m), m);
    const zoomBy = dir => {
      const pct = scale / PX_PER_PT * 100;
      const next = dir > 0 ? ZOOMS.find(z => z > pct + 0.5) : ZOOMS.slice().reverse().find(z => z < pct - 0.5);
      if (next) apply(next / 100 * PX_PER_PT, "custom");
    };
    const rotate = () => {
      rot = (rot + 90) % 360;
      apply(mode === "custom" ? scale : fitScale(mode), mode);
    };

    /* --- which page is in view, and moving to another --- */
    let thumbBtns = [], marked = -1;
    const markThumb = n => {
      if (!thumbBtns.length) return;
      if (marked >= 0 && thumbBtns[marked]) thumbBtns[marked].removeAttribute("aria-current");
      marked = n - 1;
      const b = thumbBtns[marked];
      b.setAttribute("aria-current", "true");
      if (!side.hidden && !thumbsEl.hidden) {                       // keep the thumbnail of this page in view
        const t = b.offsetTop, h = b.offsetHeight;
        if (t < thumbsEl.scrollTop || t + h > thumbsEl.scrollTop + thumbsEl.clientHeight) thumbsEl.scrollTop = Math.max(0, t - 24);
      }
    };
    const setShown = n => {
      shown = n;
      if (document.activeElement !== num) num.value = n;
      markThumb(n);
    };
    const track = () => {                                           // the page under the middle of the window
      if (!pages.length) return;
      const mid = stage.scrollTop + stage.clientHeight / 2;
      let lo = 0, hi = pages.length - 1;
      while (lo < hi) {
        const m = (lo + hi + 1) >> 1;
        if (pages[m].el.offsetTop <= mid) lo = m; else hi = m - 1;
      }
      if (lo + 1 !== shown) setShown(lo + 1);
    };
    const goTo = (n, y) => {
      const p = pages[clamp(n, 1, pages.length) - 1];
      stage.scrollTop = Math.max(0, p.el.offsetTop + (y || 0) - (y ? 24 : pad() / 2));
    };

    // a destination inside the PDF: a name or a list like [page, {name: "XYZ"}, left, top, zoom]
    const goToDest = async dest => {
      try {
        const d = typeof dest === "string" ? await doc.getDestination(dest) : dest;
        if (!Array.isArray(d)) return;
        const idx = d[0] && typeof d[0] === "object" ? await doc.getPageIndex(d[0]) : +d[0];
        if (dead || !(idx >= 0 && idx < pages.length)) return;
        const kind = d[1] && d[1].name;
        let x = 0, top = null;
        if (kind === "XYZ") { x = d[2] || 0; top = d[3]; } else if (kind === "FitH" || kind === "FitBH") top = d[2];
        let y = 0;
        if (typeof top === "number") {
          const p = pages[idx], page = p.page || (p.page = await doc.getPage(idx + 1));
          y = page.getViewport({ scale, rotation: (page.rotate + rot) % 360 }).convertToViewportPoint(x, top)[1];
        }
        goTo(idx + 1, y);
      } catch (e) { /* a broken link: stay where we are */ }
    };

    /* --- drawing one page: the picture, the text on top (to select and copy), and the links --- */
    const links = (box, annots, vp) => {
      annots.forEach(a => {
        if (a.subtype !== "Link" || !a.rect) return;
        const href = a.url && safeHref(a.url) ? a.url : "";
        if (!href && !a.dest) return;
        const [x1, y1] = vp.convertToViewportPoint(a.rect[0], a.rect[1]), [x2, y2] = vp.convertToViewportPoint(a.rect[2], a.rect[3]);
        const el = document.createElement(href ? "a" : "button");
        if (href) { el.href = href; el.target = "_blank"; el.rel = "noopener noreferrer"; el.title = href; }
        else { el.type = "button"; el.title = "Go to the linked place"; el.addEventListener("click", () => goToDest(a.dest)); }
        el.style.left = Math.min(x1, x2) + "px"; el.style.top = Math.min(y1, y2) + "px";
        el.style.width = Math.abs(x2 - x1) + "px"; el.style.height = Math.abs(y2 - y1) + "px";
        box.appendChild(el);
      });
    };

    const layers = async (p, page, vp, run) => {
      const text = document.createElement("div");
      text.className = "pdf-text";
      try {
        await new lib.TextLayer({ textContentSource: page.streamTextContent(), container: text, viewport: vp }).render();
      } catch (e) { /* the page still shows; only selecting its text is lost */ }
      if (dead || p.run !== run) return;
      const end = document.createElement("div");
      end.className = "endOfContent";
      text.appendChild(end);
      const box = document.createElement("div");
      box.className = "pdf-links";
      try { links(box, await page.getAnnotations({ intent: "display" }), vp); } catch (e) { /* no links */ }
      if (dead || p.run !== run) return;
      p.el.append(text, box);
    };

    // Most PDFs have one page size throughout, but some mix, say, portrait and landscape pages. Every page is first
    // taken to be the size of page 1; when another size turns up, that page (and its thumbnail) is resized and the
    // place in the document is kept.
    const differs = (p, v) => Math.abs(v.width - p.w) > 0.5 || Math.abs(v.height - p.h) > 0.5;
    const resize = (p, v) => {
      const keep = anchor();
      p.w = v.width; p.h = v.height;
      sizePage(p);
      const t = thumbBtns[p.n - 1];
      if (t) t.firstChild.style.height = Math.round(THUMB * p.h / p.w) + "px";
      restore(keep);
    };
    const measure = async () => {                                  // once the first screen is up: ask for the size of every page
      for (let i = 1; i < pages.length && !dead; i++) {
        const p = pages[i];
        try {
          const page = p.page || (p.page = await doc.getPage(p.n));
          const v = page.getViewport({ scale: 1 });
          if (!dead && differs(p, v)) resize(p, v);
        } catch (e) { /* the page says so itself when it is drawn */ }
      }
    };

    const draw = async p => {
      const key = scale + "@" + rot;                               // what this page should look like
      if (p.key === key) return;                                   // already drawn (or being drawn) that way
      p.key = key;
      const run = p.run = (p.run || 0) + 1;                        // a later draw of this page, or letting it go, makes this one stale
      if (p.task) { p.task.cancel(); p.task = null; }
      try {
        const page = p.page || (p.page = await doc.getPage(p.n));
        if (dead || p.run !== run) return;
        const base = page.getViewport({ scale: 1 });
        if (differs(p, base)) resize(p, base);
        const vp = page.getViewport({ scale, rotation: (page.rotate + rot) % 360 });
        let out = window.devicePixelRatio || 1;                      // draw at the screen's sharpness, within the limit
        if (vp.width * vp.height * out * out > MAX_PIXELS) out = Math.sqrt(MAX_PIXELS / (vp.width * vp.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(vp.width * out));
        canvas.height = Math.max(1, Math.floor(vp.height * out));
        canvas.setAttribute("aria-hidden", "true");
        const t = page.render({ canvas, viewport: vp, transform: out === 1 ? null : [out, 0, 0, out, 0, 0] });
        p.task = t;
        await t.promise;
        if (dead || p.run !== run) return;
        p.task = null;
        p.el.replaceChildren(canvas);                                // the new picture replaces the old one in one step
        await layers(p, page, vp, run);
      } catch (e) {
        if (dead || p.run !== run || (e && e.name === "RenderingCancelledException")) return;
        p.key = ""; p.task = null;
        p.el.textContent = "This page could not be drawn.";
        if (window.console) console.warn("[Lemmata] PDF page " + p.n + " could not be drawn: " + (e && e.message));
      }
    };

    // a page that has gone far off the screen gives its memory back (it keeps its size)
    const free = p => {
      p.run = (p.run || 0) + 1;                                    // whatever is still being drawn for this page is now stale
      if (p.task) { p.task.cancel(); p.task = null; }
      p.key = "";
      p.el.replaceChildren();
      if (p.page) p.page.cleanup();
    };

    /* --- the list at the side: contents (the PDF's bookmarks) and page thumbnails --- */
    const showTab = t => {
      side.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tab === t)));
      side.querySelectorAll("[data-panel]").forEach(el => { el.hidden = el.dataset.panel !== t; });
      if (t === "thumbs" && marked >= 0) markThumb(marked + 1);
    };
    const toggleSide = open => {
      if (open == null) open = side.hidden;
      side.hidden = !open;
      ctl("side").setAttribute("aria-expanded", String(open));
      if (open && marked >= 0) markThumb(marked + 1);
    };

    const thumb = async (p, box) => {
      try {
        const page = p.page || (p.page = await doc.getPage(p.n));
        if (dead) return;
        const vp = page.getViewport({ scale: THUMB / page.getViewport({ scale: 1 }).width });
        const out = Math.min(window.devicePixelRatio || 1, 2);
        const c = document.createElement("canvas");
        c.width = Math.floor(vp.width * out); c.height = Math.floor(vp.height * out);
        await page.render({ canvas: c, viewport: vp, transform: out === 1 ? null : [out, 0, 0, out, 0, 0] }).promise;
        if (!dead) box.replaceChildren(c);
      } catch (e) { /* leave it blank */ }
    };
    const buildThumbs = () => {
      thumbsEl.innerHTML = pages.map(p =>
        `<button type="button" class="pdf-thumb" data-n="${p.n}" aria-label="Page ${p.n}">` +
        `<span class="pdf-th-img" style="width:${THUMB}px;height:${Math.round(THUMB * p.h / p.w)}px"></span><span class="pdf-th-n">${p.n}</span></button>`).join("");
      thumbBtns = Array.from(thumbsEl.querySelectorAll(".pdf-thumb"));
      const tio = new IntersectionObserver(list => list.forEach(e => {      // draw a thumbnail when it comes near the screen
        if (!e.isIntersecting) return;
        tio.unobserve(e.target);
        thumb(pages[+e.target.dataset.n - 1], e.target.firstChild);
      }), { root: thumbsEl, rootMargin: "300px 0px" });
      thumbBtns.forEach(b => tio.observe(b));
      undo.push(() => tio.disconnect());
      on(thumbsEl, "click", e => {
        const b = e.target.closest(".pdf-thumb");
        if (!b) return;
        goTo(+b.dataset.n);
        if (viewer.clientWidth < 640) toggleSide(false);            // on a phone the list covers the pages: close it
      });
      markThumb(shown);
    };

    const buildOutline = async () => {
      let items = null;
      try { items = await doc.getOutline(); } catch (e) { /* no bookmarks */ }
      if (dead) return;
      if (!items || !items.length) { side.querySelector('[data-tab="outline"]').hidden = true; return; }
      const flat = [];
      const count = a => a.reduce((n, it) => n + 1 + count(it.items || []), 0);
      const open = count(items) <= 60;                              // a long list starts with only the top level showing
      const list = (a, depth) => "<ul>" + a.map(it => {
        const i = flat.push(it) - 1, kids = it.items && it.items.length, title = it.title || "(untitled)";
        return `<li><div class="pdf-row" style="--d:${depth}">` +
          (kids ? `<button type="button" class="pdf-tg" aria-expanded="${open}" aria-label="Show or hide the parts of ${esc(title)}">${ICON.chevron}</button>` : `<span class="pdf-tg"></span>`) +
          `<button type="button" class="pdf-lnk" data-i="${i}">${esc(title)}</button></div>` +
          (kids ? `<div class="pdf-kids"${open ? "" : " hidden"}>${list(it.items, depth + 1)}</div>` : "") + `</li>`;
      }).join("") + "</ul>";
      outlineEl.innerHTML = list(items, 0);
      on(outlineEl, "click", e => {
        const tg = e.target.closest("button.pdf-tg"), lk = e.target.closest(".pdf-lnk");
        if (tg) {
          const o = tg.getAttribute("aria-expanded") !== "true";
          tg.setAttribute("aria-expanded", String(o));
          tg.closest("li").querySelector(".pdf-kids").hidden = !o;
        } else if (lk) {
          const it = flat[+lk.dataset.i];
          if (it.dest) goToDest(it.dest); else if (safeHref(it.url)) window.open(it.url, "_blank", "noopener");
          if (viewer.clientWidth < 640) toggleSide(false);
        }
      });
      side.querySelector('[data-tab="outline"]').hidden = false;
      showTab("outline");                                           // bookmarks first, when the PDF has them
    };

    /* --- opening the document --- */
    const build = () => {
      pagesEl.textContent = "";
      pages.forEach(p => {
        const el = document.createElement("div");
        el.className = "pdf-page";
        el.dataset.n = p.n;
        el.setAttribute("role", "group");
        el.setAttribute("aria-label", "Page " + p.n);
        p.el = el;
        pagesEl.appendChild(el);
      });
      io = new IntersectionObserver(list => list.forEach(e => {
        const p = pages[+e.target.dataset.n - 1];
        if (e.isIntersecting) { visible.add(p); draw(p); } else { visible.delete(p); free(p); }
      }), { root: stage, rootMargin: "100% 0px" });
      pages.forEach(p => io.observe(p.el));
    };

    const open = async r => {
      lib = r.lib;
      const data = new Uint8Array(await blob.arrayBuffer());       // PDF.js takes this array over, so `blob` stays the copy to download
      task = lib.getDocument({
        data, isEvalSupported: false, enableXfa: false,
        verbosity: 0,                                              // only real errors reach the console (set to 1 to see PDF.js's warnings too)
        cMapUrl: r.host + "cmaps/", standardFontDataUrl: r.host + "standard_fonts/",
        wasmUrl: r.host + "wasm/", iccUrl: r.host + "iccs/"
      });
      doc = await task.promise;
      if (dead) return;
      const first = await doc.getPage(1);
      if (dead) return;
      const base = first.getViewport({ scale: 1 });                // every page is taken to be this size until it is drawn
      pages = Array.from({ length: doc.numPages }, (_, i) => ({ n: i + 1, w: base.width, h: base.height, el: null, page: i ? null : first, task: null, key: "" }));
      build();
      total.textContent = doc.numPages;
      qa(".pdf-bar button, .pdf-bar input").forEach(c => { c.disabled = false; });
      apply(fitScale("width"), "width");
      hush();
      buildThumbs();
      buildOutline();
      measure();
    };

    // PDF.js could not be loaded (old browser, or no connection to the CDN): use the browser's own PDF reader, if it has one
    const native = e => {
      if (window.console) console.warn("[Lemmata] The PDF reader (PDF.js) could not be loaded: " + (e && e.message));
      if (navigator.pdfViewerEnabled && blob) {
        tabUrl = tabUrl || URL.createObjectURL(blob);
        const f = document.createElement("iframe");
        f.className = "pdf-native"; f.title = "PDF: " + name; f.src = tabUrl;
        viewer.replaceChildren(f);
      } else {
        say("The PDF reader could not be loaded. Are you online?", { error: true });
      }
    };

    const problem = e => {
      if (window.console) console.warn("[Lemmata] The PDF could not be shown: " + (e && e.message));
      if (!blob) qa("[data-size]").forEach(z => { z.textContent = ""; });      // the size of a file that never came is not known
      say(e && e.notPdf ? "That file does not look like a PDF."
        : e && e.status === 404 ? "The PDF was not found at its address."
        : e && e.name === "PasswordException" ? "This PDF is password protected."
        : "The PDF could not be shown here.", { error: true });
    };

    const begin = async () => {
      say("Loading…", { progress: -1 });
      const reader = loadLib();                                    // the reader loads while the file downloads
      reader.catch(() => {});                                      // a failure is dealt with below
      try {
        blob = blobs.get(src) || await download(src, abort.signal, setSize, (got, tot) =>
          say(tot && got <= tot ? "Loading… " + Math.round(100 * got / tot) + "%" : "Loading… " + sizeText(got), { progress: tot && got <= tot ? got / tot : -1 }));
        if (dead) return;
        blobs.set(src, blob);
        setSize(blob.size);
        ctl("dl").disabled = false; ctl("open").disabled = false;
        say("Preparing…", { progress: 1 });
        let r;
        try { r = await reader; } catch (e) { native(e); return; }
        if (dead) return;
        await open(r);
      } catch (e) {
        if (dead || (e && e.name === "AbortError")) return;
        problem(e);
      }
    };

    /* --- the controls --- */
    on(root, "click", e => {
      const b = e.target.closest("[data-act]");
      if (!b || b.disabled) return;
      switch (b.dataset.act) {
        case "side": toggleSide(); break;
        case "in":   zoomBy(1); break;
        case "out":  zoomBy(-1); break;
        case "fit":  fitTo(mode === "page" ? "width" : "page"); break;
        case "rot":  rotate(); break;
        case "open": openTab(); break;
        case "full": (document.fullscreenElement === viewer ? document.exitFullscreen() : viewer.requestFullscreen()).catch(() => {}); break;
        case "dl":   if (save()) e.preventDefault(); break;        // before the file is in memory, the link simply opens its address
      }
    });
    on(side.querySelector(".pdf-seg"), "click", e => {
      const b = e.target.closest("[data-tab]");
      if (b) showTab(b.dataset.tab);
    });

    on(num, "focus", () => num.select());
    on(num, "blur", () => { num.value = shown; });
    on(num, "keydown", e => {
      if (e.key === "Enter") { const n = parseInt(num.value, 10); if (n) goTo(n); }
      else if (e.key === "Escape") { num.value = shown; stage.focus(); }
    });

    on(root, "keydown", e => {
      if (e.target === num || e.ctrlKey || e.metaKey || e.altKey || !pages.length) return;
      if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomBy(1); }
      else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomBy(-1); }
      else if (e.key === "0") { e.preventDefault(); fitTo("width"); }
      else if (e.key === "Escape" && !side.hidden && side.contains(e.target)) { toggleSide(false); ctl("side").focus(); }
    });

    let ticking = false;
    on(stage, "scroll", () => {                                    // work out the page number once per screen refresh
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; if (!dead) track(); });
    }, { passive: true });

    // dragging across the blank space between lines must not make the selection jump (PDF.js's own trick)
    on(pagesEl, "mousedown", e => { const t = e.target.closest && e.target.closest(".pdf-text"); if (t) t.classList.add("selecting"); });
    on(document, "mouseup", () => pagesEl.querySelectorAll(".pdf-text.selecting").forEach(t => t.classList.remove("selecting")));

    if (document.fullscreenEnabled && viewer.requestFullscreen) {
      on(document, "fullscreenchange", () => {
        const b = ctl("full"), isFull = document.fullscreenElement === viewer, label = isFull ? "Exit full screen" : "Full screen";
        if (!b) return;
        b.innerHTML = isFull ? ICON.unfull : ICON.full;
        b.title = label; b.setAttribute("aria-label", label);
      });
    } else {
      ctl("full").remove();                                        // this browser cannot show an element full screen (an iPhone, for one)
    }

    if ("ResizeObserver" in window) {                              // the window (or the side list) changed size: fit again
      let t = 0, w = stage.clientWidth, h = stage.clientHeight;
      ro = new ResizeObserver(() => {
        if (stage.clientWidth === w && stage.clientHeight === h) return;
        w = stage.clientWidth; h = stage.clientHeight;
        clearTimeout(t);
        t = setTimeout(() => { if (!dead && pages.length && mode !== "custom") apply(fitScale(mode), mode); }, 120);
      });
      ro.observe(stage);
    }

    const destroy = () => {
      dead = true;
      abort.abort();
      undo.forEach(f => f());
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      pages.forEach(p => { try { if (p.task) p.task.cancel(); } catch (e) { /* already finished */ } });
      try { if (task) task.destroy().catch(() => {}); } catch (e) { /* already gone */ }
      if (tabUrl) { const u = tabUrl; setTimeout(() => URL.revokeObjectURL(u), 60000); }   // later, in case it is open in another tab
    };

    begin();
    return { destroy };
  };

  /* ---------- what the rest of the site uses ---------- */
  // Called by the router after a page is in place: if it holds a PDF block, brings the viewer to life.
  L.mountPdf = root => {
    const block = root && root.querySelector(".pdf-block");
    if (!block) return;
    try { current = start(block); }
    catch (e) { if (window.console) console.warn("[Lemmata] The PDF viewer could not start: " + (e && e.message)); }
  };
  // Called by the router before it replaces the page: stops downloads and gives the memory back.
  L.unmountPdf = () => { if (current) { current.destroy(); current = null; } };
})();
