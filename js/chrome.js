/* chrome.js - fills in the title in the top bar and the footer, and runs the search box. */
(function () {
  "use strict";

  const L = window.Lemmata, esc = L.esc, $ = s => document.querySelector(s);

  // Title in the top bar, and the footer: the name, the topics, the months, and the links.
  L.renderChrome = function () {
    const s = L.site;
    $("#st").textContent = s.title;

    const inMonth = m => L.posts.filter(p => p.date.startsWith(m)).length;
    const col = (name, items) => items ? `<div><h2>${name}</h2><ul>${items}</ul></div>` : "";

    $("#ft").innerHTML =
      `<div class="wrap foot-in">` +
        `<div><a class="fb" href="#/">${esc(s.title)}</a>` +
          (s.tagline ? `<p class="who">${esc(s.tagline)}</p>` : "") +
          `<p class="legal">${esc(["© " + new Date().getFullYear(), s.author].filter(Boolean).join(" "))}. Mathematics typeset with MathJax.</p>` +
          (s.farewell ? `<p class="legal">${esc(s.farewell)}</p>` : "") + `</div>` +
        col("Topics", L.cats.map(([c, n]) => `<li><a href="${L.catHref(c)}">${esc(c)}</a><span>${n}</span></li>`).join("")) +
        col("Archive", L.months.map(m => `<li><a href="#/month/${m}">${esc(L.fmtMonth(m))}</a><span>${inMonth(m)}</span></li>`).join("")) +
        col("Elsewhere", L.links.map(([name, url]) => `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}</a></li>`).join("")) +
      `</div>`;
  };

  // "Skip to the content" for keyboard users. Here the address decides which page is shown, so the
  // link must not change it (a plain #main link would send the reader to the home page): it only moves
  // the keyboard position to the content.
  L.wireSkip = function () {
    const skip = $(".skip"), main = $("#main");
    if (!skip || !main) return;
    skip.addEventListener("click", e => { e.preventDefault(); main.focus(); main.scrollIntoView(); });
  };

  // Search as you type: the box just changes the address; the router shows the results.
  // A short pause after the last key press avoids re-drawing the maths on every letter.
  let timer;
  L.wireSearch = function () {
    const box = $("#q");
    box.addEventListener("input", e => {
      const v = e.target.value.trim();
      clearTimeout(timer);
      timer = setTimeout(() => { location.hash = v ? "#/search/" + encodeURIComponent(v) : "#/"; }, 150);
    });

    // pressing "/" anywhere on the page jumps to the search box
    document.addEventListener("keydown", e => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target, tag = t && t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable)) return;
      e.preventDefault();
      box.focus();
      box.select();
    });
  };

  // Keep the box in step with the address (a shared search link fills it in;
  // leaving the search page empties it). Never touch it while the person is typing.
  L.syncSearch = function (route) {
    const box = $("#q");
    if (document.activeElement === box) return;
    clearTimeout(timer);
    box.value = route.k === "search" ? route.v : "";
  };
})();
