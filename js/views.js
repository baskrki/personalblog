/* views.js - builds the HTML for each page.
   Every view returns { kind, title, nav, html }:
     kind  - a word for the type of page (used by the style sheet and the page-change code)
     title - text for the browser tab
     nav   - which top link to highlight ("math", "archive", "about", or "" for none)
     html  - what goes in the main area */
(function () {
  "use strict";

  const L = window.Lemmata, esc = L.esc;

  const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");

  /* ---------- pieces ---------- */
  const when = p => `<time datetime="${p.date}">${L.fmtDate(p.date)}</time>`;
  const mins = p => `${L.readMinutes(p)} min read`;
  const topicLinks = p => p.cats.map(c => `<a href="${L.catHref(c)}">${esc(c)}</a>`).join(" ");

  // one note in a list: date and reading time on the left; title, opening lines and topics beside them
  const row = p =>
    `<article class="row"><div class="when">${when(p)}<span>${mins(p)}</span></div>` +
    `<div class="what"><h2><a href="#/post/${p.slug}">${esc(p.title)}</a></h2>` +
    `<p class="excerpt">${L.excerpt(p)}</p>` +
    (p.cats.length ? `<p class="topics">${topicLinks(p)}</p>` : "") +
    `</div></article>`;

  // a whole note: title across the top, then the details on the left and the text beside them
  const meta = p =>
    `<div class="art-meta">${when(p)}<span>${mins(p)}</span>` +
    (p.cats.length ? `<span class="topics">${topicLinks(p)}</span>` : "") +
    (L.site.author ? `<span class="by">${esc(L.site.author)}</span>` : "") +
    `</div>`;

  const article = (p, single) => {
    const head = single ? `<h1>${esc(p.title)}</h1>` : `<h2><a href="#/post/${p.slug}">${esc(p.title)}</a></h2>`;
    return `<article class="art${single ? "" : " in-list"}"><header class="art-head">${head}</header>` +
           `<div class="art-grid">${meta(p)}<div class="body">${p.body}</div></div></article>`;
  };

  // a list of notes, as rows or (with homeStyle "full") as whole notes
  const items = posts => L.homeStyle === "full" ? posts.map(p => article(p, false)).join("") : posts.map(row).join("");

  // « older (left)  ...  newer » (right)
  const prevNext = p => {
    const i = L.posts.indexOf(p), newer = L.posts[i - 1], older = L.posts[i + 1];
    if (!older && !newer) return "";
    const link = (q, cls, label) => q
      ? `<a class="${cls}" href="#/post/${q.slug}"><span>${label}</span><b>${esc(q.title)}</b></a>`
      : "";
    // with only one neighbour, that link gets the whole width
    return `<nav class="pn" aria-label="Other notes"><div class="pn-in${older && newer ? "" : " one"}">${link(older, "older", "Older")}${link(newer, "newer", "Newer")}</div></nav>`;
  };

  // topics and months, down the right-hand side of the list pages
  const rail = (active, opt) => {
    opt = opt || {};
    const topics = L.cats.length
      ? `<section><h2>Topics</h2><ul>${L.cats.map(([c, n]) =>
          `<li><a href="${L.catHref(c)}"${c === active ? ' aria-current="page"' : ""}>${esc(c)}</a><span>${n}</span></li>`).join("")}</ul></section>`
      : "";
    const months = opt.months === false || !L.months.length ? ""
      : `<section><h2>Archive</h2><ul>${L.months.map(m =>
          `<li><a href="#/month/${m}"${m === opt.month ? ' aria-current="page"' : ""}>${esc(L.fmtMonth(m))}</a><span>${L.posts.filter(p => p.date.startsWith(m)).length}</span></li>`).join("")}</ul></section>`;
    return topics || months ? `<aside class="rail" aria-label="Browse">${topics}${months}</aside>` : "";
  };

  // a page that is a heading, a count, a list of notes, and the side lists
  // (the count and the first side list share one rule, so the two columns line up)
  const listPage = (title, n, list, active, opt) =>
    `<div class="wrap"><header class="page-head"><h1>${title}</h1></header>` +
    `<div class="cols"><div class="list"><p class="sec-h sec-n">${plural(n, "note")}</p>${list}</div>${rail(active, opt)}</div></div>`;

  // searchable text of a post: title plus body with the HTML tags removed
  const haystack = p => p._text || (p._text = (p.title + " " + p.body.replace(/<[^>]+>/g, " ")).toLowerCase());

  // the opening of the home page: the tagline, the author, and the figure
  const hero = () => {
    const s = L.site, fig = L.figure ? L.figure({ play: !L._played }) : null;
    L._played = true;
    const stat = L.posts.length
      ? `${plural(L.posts.length, "note")} · ${plural(L.cats.length, "topic")} · Latest note ${L.fmtDate(L.posts[0].date)}`
      : "";
    return `<section class="hero"><div class="wrap hero-in${fig ? "" : " solo"}">` +
      `<div class="hero-text"><h1>${esc(s.tagline || s.title)}</h1>` +
      (s.author || stat
        ? `<div class="hero-foot">` +
          (s.author ? `<p class="by"><a href="#/about">${esc(s.author)}</a></p>` : "") +
          (stat ? `<p class="stat">${stat}</p>` : "") + `</div>`
        : "") + `</div>` +
      (fig ? `<figure class="plate-fig">${fig.html}<figcaption>${fig.caption}</figcaption></figure>` : "") +
      `</div></section>`;
  };

  // a page with a title, a few details on the left and some text: About, Not found
  const plainPage = (title, details, body) =>
    `<div class="wrap"><article class="art"><header class="art-head"><h1>${esc(title)}</h1></header>` +
    `<div class="art-grid"><div class="art-meta">${details}</div><div class="body">${body}</div></div></article></div>`;

  // One link of a Math entry. A link to a PDF opens the site's own PDF viewer (js/pdfviewer.js), on a page of
  // its own; any other link opens in a new tab. (An entry needs an id for its PDF page to have an address.)
  const mathLink = (m, l) => {
    const [name, url] = l, n = L.pdfLinks(m).indexOf(l) + 1, label = `${esc(name)}: ${esc(m.title)}`;
    return n && m.id
      ? `<a href="${L.pdfHref(m, n)}" aria-label="${label}">${esc(name)}</a>`
      : `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${label}">${esc(name)}</a>`;
  };

  // the Math page (the entries are Lemmata.math in config.js): each note or problem set is a heading,
  // a few words about it, and its links
  const mathItems = () => L.math.map(m =>
    `<section class="math-item"${m.id ? ` id="math-${esc(m.id)}"` : ""}><h3>${esc(m.title)}</h3>` +
    (m.text ? `<p>${m.text}</p>` : "") +
    (m.links && m.links.length ? `<div class="math-links">${m.links.map(l => mathLink(m, l)).join("")}</div>` : "") +
    `</section>`).join("") || `<p class="empty">Nothing here yet.</p>`;

  /* ---------- views ---------- */
  const notFound = () => ({
    kind: "missing", title: "Not found", nav: "",
    html: plainPage("Page not found", "",
      `<p>There is nothing at this address. It may have been renamed or removed. Go to the <a href="#/">home page</a> or browse the <a href="#/archive">archive</a>.</p>`)
  });

  L.views = {
    home: () => {
      const full = L.homeStyle === "full";
      const shown = full ? L.posts : L.posts.slice(0, L.recentCount);
      const more = !full && L.posts.length > shown.length;
      return {
        kind: "home", title: L.site.title, nav: "",
        html: hero() +
          `<div class="wrap"><div class="cols"><section class="list" aria-labelledby="recent-h"><h2 class="sec-h" id="recent-h">Recent notes</h2>` +
          (items(shown) || `<p class="empty">No notes yet.</p>`) +
          (more ? `<p class="more"><a href="#/archive">Browse all ${L.posts.length} notes in the archive</a></p>` : "") +
          `</section>${rail()}</div></div>`
      };
    },

    post: slug => {
      const p = L.bySlug.get(slug);
      return p ? { kind: "post", title: p.title, nav: "", html: `<div class="wrap">${article(p, true)}${prevNext(p)}</div>` } : notFound();
    },

    about: () => ({
      kind: "about", title: "About", nav: "about",
      html: plainPage("About",
        (L.site.author ? `<span class="by">${esc(L.site.author)}</span>` : "") +
        (L.site.email ? `<a href="mailto:${esc(L.site.email)}">${esc(L.site.email)}</a>` : ""),
        L.about || "")
    }),

    math: () => ({
      kind: "math", title: "Math", nav: "math",
      html: plainPage("Math", "", mathItems())
    }),

    // one PDF of the Math page, in the viewer: a way back, the title, the file card and the viewer
    // (js/pdfviewer.js), and under them the few words about it and the entry's other links
    pdf: (id, n) => {
      const m = L.math.find(e => e.id === id), link = m && L.pdfLinks(m)[n - 1];
      if (!link) return notFound();
      const others = m.links.filter(l => l !== link).map(l => mathLink(m, l)).join("");
      return {
        kind: "pdf", title: m.title, nav: "math",
        html: `<div class="wrap"><article class="art doc">` +
          `<header class="art-head"><p class="crumb"><a href="#/math/${encodeURIComponent(m.id)}">← Math</a></p><h1>${esc(m.title)}</h1></header>` +
          `<div class="doc-file">${L.pdfBlock ? L.pdfBlock(link[1], m.type)
            : `<p><a href="${esc(link[1])}" target="_blank" rel="noopener noreferrer">Open the PDF</a></p>`}</div>` +
          (m.text || others
            ? `<div class="doc-in">` +
                (m.text ? `<div class="doc-text"><p>${m.text}</p></div>` : "") +
                (others ? `<div class="doc-links">${others}</div>` : "") +
              `</div>`
            : "") +
        `</article></div>`
      };
    },

    archive: () => ({
      kind: "archive", title: "Archive", nav: "archive",
      html: listPage("Archive", L.posts.length,
        L.months.map(m =>
          `<section class="arch-m"><h2><a href="#/month/${m}">${esc(L.fmtMonth(m))}</a></h2><ul>${
            L.posts.filter(p => p.date.startsWith(m)).map(p =>
              `<li><a href="#/post/${p.slug}">${esc(p.title)}</a><time datetime="${p.date}">${L.fmtShort(p.date)}</time></li>`
            ).join("")
          }</ul></section>`
        ).join("") || `<p class="empty">No notes yet.</p>`, null, { months: false })
    }),

    category: c => {
      const list = L.posts.filter(p => p.cats.includes(c));
      return {
        kind: "list", title: "Topic: " + c, nav: "",
        html: listPage(`Topic: ${esc(c)}`, list.length,
          items(list) || `<p class="empty">No notes found.</p>`, c)
      };
    },

    month: m => {
      if (!/^\d{4}-\d{2}$/.test(m)) return notFound();
      const t = L.fmtMonth(m), list = L.posts.filter(p => p.date.startsWith(m));
      return {
        kind: "list", title: t, nav: "",
        html: listPage(esc(t), list.length,
          items(list) || `<p class="empty">No notes found.</p>`, null, { month: m })
      };
    },

    search: q => {
      const needle = q.toLowerCase(), list = L.posts.filter(p => haystack(p).includes(needle));
      return {
        kind: "list", title: "Search: " + q, nav: "",
        html: listPage(`Search results for “${esc(q)}”`, list.length,
          items(list) || `<p class="empty">No notes match “${esc(q)}”. Try fewer words, or browse the <a href="#/archive">archive</a>.</p>`)
      };
    }
  };
})();
