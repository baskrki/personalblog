/* main.js - start-up. Loads every post file listed in posts/manifest.js, checks
   them, then draws the page. Loaded last. */
(function () {
  "use strict";

  const L = window.Lemmata;

  // fill in anything config.js left out
  L.site = Object.assign({ title: "Lemmata", tagline: "", author: "", email: "", farewell: "" }, L.site);
  L.links = Array.isArray(L.links) ? L.links : [];
  L.math = Array.isArray(L.math) ? L.math : [];
  L.recentCount = L.recentCount > 0 ? Math.floor(L.recentCount) : 5;
  L.homeStyle = L.homeStyle === "full" ? "full" : "list";

  if (!Array.isArray(L.manifest)) {
    L.problem('posts/manifest.js is missing or broken. It should contain: Lemmata.manifest = [ "2026-01-01-my-post.js" ];');
  }
  const names = Array.isArray(L.manifest) ? L.manifest : [];

  // Add a <script> tag for one post file. async = false means the files download
  // side by side but run in manifest order, so same-day posts keep the order you listed.
  const loadPost = name => new Promise(done => {
    const file = /\.js$/i.test(name) ? name : name + ".js";
    const s = document.createElement("script");
    s.async = false;
    s.src = "posts/" + file;
    s.onload = () => done({ file, ok: true });
    s.onerror = () => done({ file, ok: false });
    document.head.appendChild(s);
  });

  Promise.all(names.map(loadPost)).then(results => {
    results.forEach(r => {
      if (!r.ok) {
        L.problem("posts/" + r.file + " could not be loaded. Check the spelling, the capital letters and the .js ending in posts/manifest.js.");
      } else if (!L.loadedFiles.has(r.file)) {
        const why = L.errorFor(r.file);
        L.problem("posts/" + r.file + " loaded but did not add a post. " +
          (why ? "The browser reports: " + why + ". " : "") +
          'Look for a backtick or a "$" followed by "{" inside the post text, or a missing quote or comma. ' +
          "The browser console (F12, or Cmd+Option+J on a Mac) shows the exact error.");
      }
    });

    L.finalize();
    L.renderChrome();
    L.wireSkip();
    L.wireSearch();
    window.addEventListener("hashchange", L.route);
    L.route();
  });
})();
