/* core.js - the shared namespace, the post registry and small helpers.
   Loaded first. Everything else hangs off window.Lemmata. */
(function () {
  "use strict";

  const L = (window.Lemmata = window.Lemmata || {});

  /* ---------- problems: collected here, shown in a yellow box on the page ---------- */
  L.problems = [];
  L.problem = function (msg) {
    L.problems.push(msg);
    if (window.console) console.warn("[Lemmata] " + msg);
  };

  /* ---------- small helpers ---------- */
  const ENT = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  L.esc = s => String(s).replace(/[&<>"']/g, c => ENT[c]);

  const day = d => new Date(d + "T00:00:00");
  L.fmtDate = d => day(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  L.fmtShort = d => day(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  L.fmtMonth = m => {
    const d = day(m + "-01");
    return isNaN(d) ? m : d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };
  L.catHref = c => "#/cat/" + encodeURIComponent(c);

  /* ---------- PDF links on the Math page ----------
     A link in Lemmata.math (config.js) whose address ends in .pdf opens in the site's own PDF viewer
     (js/pdfviewer.js) instead of a new browser tab. */
  L.isPdf = url => /\.pdf(?:[?#]|$)/i.test(String(url || ""));
  // the PDF links of one Math entry, in order: [ ["View PDF", "https://…/notes.pdf"], … ]
  L.pdfLinks = m => (m && Array.isArray(m.links) ? m.links : []).filter(l => Array.isArray(l) && L.isPdf(l[1]));
  // where the viewer for the n-th PDF (1, 2, …) of an entry lives:  #/math/Real_Analysis/pdf
  L.pdfHref = (m, n) => "#/math/" + encodeURIComponent(m.id) + "/pdf" + (n > 1 ? "/" + n : "");
  // the file name at the end of an address: ".../realanalysis.pdf?raw=true" -> "realanalysis.pdf"
  L.pdfName = url => {
    const s = String(url || "").split("#")[0].split("?")[0].split("/").pop();
    try { return decodeURIComponent(s) || "document.pdf"; } catch (e) { return s || "document.pdf"; }
  };

  /* ---------- the post registry ---------- */
  const posts = [];             // valid posts, in the order their files ran
  const slugs = new Set();      // to catch two posts with the same slug
  L.posts = posts;
  L.loadedFiles = new Set();    // post files that called addPost at least once

  const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const isRealDate = s => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s + "T00:00:00Z");
    return !isNaN(d) && d.toISOString().slice(0, 10) === s;   // rejects 2026-02-31
  };

  // name of the post file that is running right now (e.g. "2026-10-18-my-post.js")
  const runningFile = () => {
    const cs = document.currentScript;
    if (!cs || !cs.src) return "";
    const name = cs.src.split("#")[0].split("?")[0].split("/").pop();
    try { return decodeURIComponent(name); } catch (e) { return name; }
  };

  // Every post file calls this once. A bad post is reported and skipped, never fatal.
  L.addPost = function (p) {
    const file = runningFile();
    if (file) L.loadedFiles.add(file);
    const bad = msg => L.problem((file ? "posts/" + file : "A post") + ": " + msg + " This post was skipped.");

    if (!p || typeof p !== "object") return bad("Lemmata.addPost needs an object: { slug, title, date, cats, body }.");
    if (typeof p.slug !== "string" || !SLUG.test(p.slug))
      return bad('"slug" must be lowercase letters, digits and hyphens only, like "my-first-post".');
    if (slugs.has(p.slug))
      return bad('The slug "' + p.slug + '" is already used by another post. Every slug must be different.');
    if (typeof p.title !== "string" || !p.title.trim()) return bad('"title" is missing.');
    if (typeof p.date !== "string" || !isRealDate(p.date))
      return bad('"date" must be a real date written year-month-day, like "2026-10-18".');
    if (p.cats != null && !(Array.isArray(p.cats) && p.cats.every(c => typeof c === "string" && c.trim())))
      return bad('"cats" must be a list of words, like ["algebra", "expository"].');
    if (typeof p.body !== "string") return bad('"body" is missing. It should be String.raw`...` holding the post.');
    if (p.summary != null && typeof p.summary !== "string") return bad('"summary" must be plain text between quotes.');

    slugs.add(p.slug);
    posts.push({
      slug: p.slug,
      title: p.title.trim(),
      date: p.date,
      cats: [...new Set((p.cats || []).map(c => c.trim()))],
      summary: (p.summary || "").trim(),
      body: p.body
    });
  };

  // If a post file has a typo, the browser reports an error naming that file.
  // Remember the message so the yellow box can show it.
  const errors = {};
  window.addEventListener("error", e => {
    const m = /\/posts\/([^\/?#]+)$/.exec(e.filename || "");
    if (!m) return;
    let f = m[1];
    try { f = decodeURIComponent(f); } catch (err) { /* keep raw name */ }
    if (!errors[f]) errors[f] = e.message;
  });
  L.errorFor = f => errors[f] || "";

  /* ---------- reading time and excerpts (used by the lists of notes) ---------- */
  const MATHS = /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]*?\$/g;

  // minutes to read a note: words at a slow, careful pace; each formula counts as three words
  L.readMinutes = p => {
    if (p._min) return p._min;
    const text = p.body.replace(MATHS, " x x x ").replace(/<[^>]+>/g, " ");
    const words = (text.match(/\S+/g) || []).length;
    return (p._min = Math.max(1, Math.round(words / 160)));
  };

  // is a formula still open at the end of this text? (counts unescaped $, and \( against \) )
  const mathIsOpen = s => {
    let dollars = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "\\") { i++; continue; }
      if (s[i] === "$") dollars++;
    }
    return dollars % 2 === 1 || (s.match(/\\\(/g) || []).length > (s.match(/\\\)/g) || []).length;
  };

  // the opening paragraph of a note as short text (HTML-safe; formulas stay as LaTeX for MathJax)
  L.excerpt = (p, max) => {
    max = max || 280;
    if (p.summary) return L.esc(p.summary);
    if (p._ex != null) return p._ex;
    const open = p.body.replace(/<div class="(?:thm|defn|rem)\b[\s\S]*?<\/div>/gi, "");
    const m = /<p\b[^>]*>([\s\S]*?)<\/p>/i.exec(open);
    let s = (m ? m[1] : "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (s.length > max) {
      let cut = s.lastIndexOf(". ", max);                       // prefer ending on a full sentence
      cut = cut > max * 0.45 ? cut + 1 : s.lastIndexOf(" ", max);
      let out = s.slice(0, cut > 0 ? cut : max);
      while (mathIsOpen(out)) {                                  // never cut through the middle of a formula
        const i = Math.max(out.lastIndexOf("$"), out.lastIndexOf("\\("));
        if (i <= 0) break;
        out = out.slice(0, i).trimEnd();
      }
      out = out.replace(/[\s,;:(]+$/, "");
      s = out + (/[.!?]$/.test(out) ? "" : "…");
    }
    return (p._ex = s.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
  };

  // Called once, after every post file has been loaded.
  L.finalize = function () {
    posts.sort((a, b) => b.date.localeCompare(a.date));   // newest first; same-day posts keep manifest order
    L.bySlug = new Map(posts.map(p => [p.slug, p]));

    const counts = new Map();
    posts.forEach(p => p.cats.forEach(c => counts.set(c, (counts.get(c) || 0) + 1)));
    L.cats = [...counts].sort((a, b) => a[0].localeCompare(b[0]));    // [[name, count], ...]
    L.months = [...new Set(posts.map(p => p.date.slice(0, 7)))];      // ["2026-10", ...] newest first
  };
})();
