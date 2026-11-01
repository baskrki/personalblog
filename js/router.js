/* router.js - reads the address (#/post/..., #/cat/..., #/search/...), picks the
   matching view and draws it. Runs again every time the address changes. */
(function () {
  "use strict";

  const L = window.Lemmata, $ = s => document.querySelector(s);

  const decode = s => { try { return decodeURIComponent(s); } catch (e) { return s; } };

  // "#/cat/number%20theory"  ->  { k: "cat", v: "number theory" }
  const parse = () => {
    const [, k = "", ...rest] = location.hash.slice(1).split("/");
    return { k: decode(k), v: decode(rest.join("/")) };
  };

  const pick = ({ k, v }) => {
    switch (k) {
      case "post":    return L.views.post(v);
      case "about":   return L.views.about();
      case "math": {                                    // #/math, or #/math/<id>/pdf for the viewer of that entry's PDF
        const p = /^(.+)\/pdf(?:\/(\d+))?$/.exec(v);
        return p ? L.views.pdf(p[1], +p[2] || 1) : L.views.math();
      }
      case "archive": return L.views.archive();
      case "cat":     return L.views.category(v);
      case "month":   return L.views.month(v);
      case "search":  return L.views.search(v);
      default:        return L.views.home();
    }
  };

  // Links from the old site look like  index.html#June-7-2026  (one anchor per note, named by its date).
  // Given the text after the #, return the note with that date (or null), so those old links keep working.
  const MONTHS = "january february march april may june july august september october november december".split(" ");
  const oldLink = h => {
    const m = /^([A-Za-z]+)-(\d{1,2})-(\d{4})$/.exec(h), mo = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
    if (mo < 0) return null;
    const date = m[3] + "-" + String(mo + 1).padStart(2, "0") + "-" + m[2].padStart(2, "0");
    return L.posts.find(p => p.date === date) || null;
  };

  // yellow box listing anything wrong with the post files (empty when all is well)
  const notice = () => !L.problems.length ? "" :
    `<div class="wrap"><div class="notice" role="alert"><strong>Something is wrong with the site files:</strong><ul>${
      L.problems.map(m => `<li>${L.esc(m)}</li>`).join("")
    }</ul><p>README.md has a Troubleshooting section that explains each of these.</p></div></div>`;

  // After MathJax has drawn the formulas: keep punctuation next to a formula on the same line.
  // A browser may start a new line between a formula and the comma that follows it, leaving the comma
  // alone at the start of the line. So each formula is wrapped, together with the punctuation just after
  // it (a comma, a full stop, a closing bracket, "-th", "'s") and an opening bracket just before it,
  // in a span that must not break (.nb in css/content.css).
  const AFTER = /^(?:[,.;:!?)\]}’”»]+|(?:-|’s|'s)[\p{L}\p{N}]*)/u, BEFORE = /[(\[{‘“«]+$/;
  L.tidyMath = root => {
    if (!root) return;
    root.querySelectorAll("mjx-container:not([display])").forEach(c => {
      const par = c.parentNode;
      if (!par || (par.classList && par.classList.contains("nb"))) return;       // already done
      const next = c.nextSibling, prev = c.previousSibling;
      const a = next && next.nodeType === 3 ? AFTER.exec(next.nodeValue) : null;
      const b = prev && prev.nodeType === 3 ? BEFORE.exec(prev.nodeValue) : null;
      if (!a && !b) return;
      const span = document.createElement("span");
      span.className = "nb";
      par.insertBefore(span, c);
      if (b) { prev.nodeValue = prev.nodeValue.slice(0, -b[0].length); span.appendChild(document.createTextNode(b[0])); }
      span.appendChild(c);
      if (a) { span.appendChild(document.createTextNode(a[0])); next.nodeValue = next.nodeValue.slice(a[0].length); }
    });
  };

  // MathJax: one typesetting job at a time, each after the previous has finished
  let queue = Promise.resolve();
  const typeset = el => {
    const mj = window.MathJax;
    if (!mj || !mj.typesetPromise) return;   // still loading: it will typeset the whole page itself when ready
    queue = queue
      .then(() => mj.startup && mj.startup.promise)
      .then(() => { mj.texReset(); return mj.typesetPromise([el]); })
      .then(() => L.tidyMath(el))
      .catch(() => {});
  };

  let first = true;
  L.route = function () {
    const route = parse(), old = oldLink(decode(location.hash.slice(1)));
    if (old) { location.replace("#/post/" + old.slug); return; }     // the address changes, so this runs again
    const view = pick(route);
    const main = $("#main"), mj = window.MathJax;

    if (L.unmountPdf) L.unmountPdf();                       // a PDF viewer on the old page stops its downloads (js/pdfviewer.js)
    if (mj && mj.typesetClear) mj.typesetClear([main]);     // forget the old page's maths
    main.innerHTML = notice() + view.html;
    if (L.mountFigure) L.mountFigure(main);                 // brings the home page's figure to life (js/figure.js)
    if (L.mountPdf) L.mountPdf(main);                       // brings a PDF viewer to life (js/pdfviewer.js)

    document.title = view.title === L.site.title ? view.title : view.title + " — " + L.site.title;
    document.body.dataset.page = view.kind || "";
    document.querySelectorAll("nav.top a").forEach(a =>
      a.dataset.k === view.nav ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
    L.syncSearch(route);

    // an old link to one item of the Math page (#/math/Real_Analysis) opens the page at that item
    const item = route.k === "math" && route.v && document.getElementById("math-" + route.v);
    if (item) item.scrollIntoView(); else window.scrollTo(0, 0);

    // After a click on a link, move the keyboard position to the new page, so screen readers and
    // the Tab key start from the top of it. Not while someone is typing in the search box.
    if (!first && document.activeElement !== $("#q")) main.focus({ preventScroll: true });
    first = false;

    typeset(main);
  };
})();
