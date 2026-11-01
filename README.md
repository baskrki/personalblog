# Lemmata

A small blog for mathematics. Notes are written in HTML with LaTeX maths, and
MathJax draws the maths. There is nothing to install and nothing to build: open
`index.html` and it works.

The site is **always light**. It keeps its light look even when your computer or
phone is set to dark mode (a dark mode can be switched on; see [Change the site](#change-the-site)).

**Contents:** [Folder map](#folder-map) · [Open it, publish it](#open-it-publish-it) ·
[Write a post](#write-a-post) · [What the site does](#what-the-site-does) ·
[The PDF viewer](#the-pdf-viewer) · [Change the site](#change-the-site) ·
[Troubleshooting](#troubleshooting) · [Good to know](#good-to-know)

---

## Folder map

```
lemmata/
├── index.html            the page itself: open this
├── archive.html          an old address: passes visitors on to #/archive (see "Old links")
├── math.html             an old address: passes visitors on to #/math
├── config.js             site title, tagline, author, email, footer line and links, About text, Math page, list style
├── css/
│   ├── theme.css         colours, fonts and page widths (light only), and the colours of the PDF viewer
│   ├── layout.css        the frame: top bar, home-page figure, lists of notes, side lists, footer, phone layout, printing
│   ├── content.css       inside a note: title and details, theorem boxes, equations, images, archive, warning box
│   └── pdf.css           the PDF page: the file card and the viewer (toolbar, side list, pages)
├── fonts/                Source Serif 4 and Hanken Grotesk, with their licences
├── js/
│   ├── mathjax-config.js MathJax settings
│   ├── core.js           the list of posts, checks on each post, reading time, excerpts, small helpers
│   ├── views.js          builds each page: home, post, topic, month, search, about, archive, math, PDF
│   ├── figure.js         draws the figure at the top of the home page
│   ├── pdfviewer.js      the PDF viewer: file card, toolbar, pages (built on PDF.js, which it loads from a CDN)
│   ├── chrome.js         the title in the top bar, the footer, the search box
│   ├── router.js         reads the address and shows the right page
│   └── main.js           start-up: loads the posts named in the manifest
├── posts/
│   ├── manifest.js       the list of posts that appear on the site
│   ├── _template.js      copy this to start a new post
│   └── 2026-….js         one file per post
└── images/               pictures used in posts (the post "Abstraction" expects copy.png here: see images/README.txt)
```

| I want to…                                           | I edit…                                     |
| ---------------------------------------------------- | ------------------------------------------- |
| write, change or remove a post                       | a file in `posts/`, and `posts/manifest.js` |
| change the title, tagline, author, links, About text | `config.js`                                 |
| add or change a note or problem set on the Math page | `Lemmata.math` in `config.js`               |
| show another PDF in the viewer                       | an entry in `Lemmata.math` with an `id` and a link ending in `.pdf` ([how](#the-pdf-viewer)) |
| show notes as a list or in full on the home page     | `homeStyle` in `config.js`                  |
| change colours, fonts or page widths                 | `css/theme.css`                             |
| change the colours or layout of the PDF viewer       | `--pdf-…` in `css/theme.css`, and `css/pdf.css` |
| change or remove the figure on the home page         | `js/figure.js` (and its line in `index.html`) |
| change how maths is read (delimiters, numbering)     | `js/mathjax-config.js`                      |

## Open it, publish it

- **On your computer:** double-click `index.html`. No server is needed.
- **Maths needs the internet.** MathJax is loaded from `cdnjs.cloudflare.com`. With
  no connection the notes still show, but the maths appears as plain `$…$` text.
  The fonts are in the `fonts/` folder, so text looks the same offline.
- **PDFs need the internet, too.** The PDF page loads its reader (PDF.js, about half a megabyte) from
  `cdn.jsdelivr.net` the first time it is opened, with `unpkg.com` as a spare, and reads each PDF from GitHub.
  Offline, that page says so and offers the plain download link; the rest of the site is not affected.
  (The reader can also be kept in your own folder: see [The PDF viewer](#the-pdf-viewer).)
- **Online:** upload the whole folder to any static host (GitHub Pages, Netlify,
  Cloudflare Pages, …) so that `index.html` sits at the top. Those hosts care about
  capital letters: `Posts/` and `posts/` are different folders, and so are `A.js` and `a.js`.

---

## Write a post

### 1. Make the file

Copy `posts/_template.js` and rename the copy `YYYY-MM-DD-short-title.js`, for
example `2026-11-02-sylow-theorems.js`. The file name is only for your own
tidiness (it makes the folder list in date order); the site reads the fields inside.

### 2. Fill it in

```js
Lemmata.addPost({
  slug:  "sylow-theorems",
  title: "A proof of the Sylow theorems",
  date:  "2026-11-02",
  cats:  ["algebra", "expository"],
  body:  String.raw`
<p>Let $G$ be a finite group of order $n=p^a m$ with $p\nmid m$.</p>

<div class="thm"><p><b>Theorem 1 (Sylow).</b> $G$ has a subgroup of order $p^a$.</p></div>

<p><em>Proof.</em> Write the argument here, with display maths on its own line:
\[ |X| = \binom{n}{p^a} \not\equiv 0 \pmod p. \]
The last sentence ends with the proof square. <span class="qed">∎</span></p>`
});
```

| Field     | What it is |
| --------- | ---------- |
| `slug`    | The post's address: `index.html#/post/sylow-theorems`. Lowercase letters, digits and hyphens only. Every post needs a different one. Don't change it after you share the post, or old links break. |
| `title`   | The heading, also used in lists, the footer and the browser tab. Plain text: no maths or HTML. |
| `date`    | `"YYYY-MM-DD"`. Posts are sorted newest first by this date. |
| `cats`    | Topics, a list of words. Each becomes a link beside the post and an entry in the Topics lists (with a count). Spelling must match exactly: `"algebra"` and `"Algebra"` are two topics. May be `[]`. |
| `body`    | The post: HTML with LaTeX maths, between the two backticks of ``String.raw`…` ``. |
| `summary` | *Optional.* One or two sentences of plain text shown under the title in lists. Without it, the site uses the post's first paragraph (shortened, and never cut in the middle of a formula). |

### 3. List it

Open `posts/manifest.js` and add the file name:

```js
Lemmata.manifest = [
  "2026-11-02-sylow-theorems.js",
  "2026-10-18-cyclic-subgroups-of-fields.js",
  …
];
```

The order in this list does not matter, because posts are sorted by `date`. (If two
posts have the same date, the one listed first is shown first.) Keep a comma after every
name except the last. Writing the name without `.js` also works.

### 4. Look at it

Refresh `index.html` in the browser. The post is on the home page, in the Topics and
Archive lists and in the archive page. If a **yellow box** appears instead, it tells you
which file has a problem; see [Troubleshooting](#troubleshooting).

### What to put in the body

| You want…                         | Write… |
| --------------------------------- | ------ |
| a paragraph                       | `<p>…</p>`. The first one is set a little larger, as an introduction. |
| maths inside a line               | `$x^2+1$` or `\(x^2+1\)` |
| maths on its own line             | `\[ … \]` or `$$ … $$` |
| a numbered equation               | `\begin{equation} … \end{equation}` (also `align`). Numbers start at (1) on every page; with `homeStyle: "full"` they carry on from post to post on the home page. |
| a boxed theorem, lemma, …         | `<div class="thm"><p><b>Theorem 1.</b> …</p></div>` (you type the number yourself; text in the box is italic) |
| a definition                      | `<div class="defn"><p><b>Definition 2.</b> …</p></div>` (a green edge instead of a blue one; text stays upright) |
| a remark or example               | `<div class="rem"><p><b>Remark.</b> …</p></div>` (a quieter grey edge) |
| the end-of-proof square           | `<span class="qed">∎</span>` at the end of the last paragraph of the proof |
| a heading inside the post         | `<h3>…</h3>` (and `<h4>…</h4>` for a smaller one) |
| bullet / numbered list            | `<ul><li>…</li></ul>` / `<ol><li>…</li></ol>` |
| a link to the web                 | `<a href="https://…">text</a>` |
| a link to another of your posts   | `<a href="#/post/other-slug">text</a>` |
| a picture                         | save it in `images/`, then `<figure><img src="images/name.png" alt="what it shows"><figcaption>Figure 1. …</figcaption></figure>` |
| a quotation, code, a table        | `<blockquote>…</blockquote>`, `<pre><code>…</code></pre>`, `<table>…</table>` |
| a real dollar sign                | `\$` |

### Rules that save headaches

- **No backtick** anywhere in the body, and **no `$` directly followed by `{`**. Both
  end or break the text block. If you need `${a}_b$`, put a space: `$ {a}_b$`.
- **`<` and `>` inside maths:** write `&lt;` and `&gt;` (or put a space on both sides:
  `a < b`). Typed as `$a<b$`, the browser takes `<b…` for an HTML tag and swallows the text.
- **Labels:** if you use `\label{…}`, make every label different across *all* posts
  (for example `eq:parseval-1`), because the home page can draw many posts at once.
- **Titles are plain text.** Maths in a title would show as raw `$…$` in lists and
  the browser tab. Use Unicode instead (ℤ/8ℤ, ≤).
- **Keep the same spelling for topics.** A new spelling makes a new topic.

### Change or remove a post

- **Edit:** change the file and refresh. Changing `date` moves it in the order.
- **Hide it for now:** delete its line from `manifest.js` (or put `//` in front of it).
  The file stays in the folder. A post that is not in the manifest is not on the site.
- **Delete it:** remove the line and the file.
- Keep drafts out of what you upload if you don't want them public: anyone who knows a
  file's address can open it, listed or not.

---

## What the site does

**Pages.** Every page has its own address, so you can copy it from the address bar and share it.

| Address                    | Shows |
| -------------------------- | ----- |
| `#/`                       | Home: the figure, then the newest notes, with the Topics and Archive lists beside them |
| `#/post/<slug>`            | One post, with links to the next older and next newer post |
| `#/cat/<name>`             | All posts on one topic |
| `#/month/2026-10`          | All posts from a month |
| `#/archive`                | Every post title grouped by month, with dates |
| `#/about`                  | The About text from `config.js` (with your email address beside it, if you set one) |
| `#/math`                   | The Math page: your notes and problem sets kept as PDFs, each with its links (`Lemmata.math` in `config.js`) |
| `#/math/<id>`              | The same page, scrolled to one item, for example `#/math/Real_Analysis` |
| `#/math/<id>/pdf`          | One PDF of that item, in the viewer: `#/math/Real_Analysis/pdf` (an item with two PDFs: `…/pdf/2` for the second) |
| `#/search/<words>`         | Search results |
| anything else              | Home. A post address that doesn't exist shows "Page not found". |

**Old links.** The first version of this site was three pages: `index.html` with every note on it,
`math.html` and `archive.html`. Its addresses still work. `index.html#June-7-2026` opens the note dated
June 7, 2026 (any date that has a note works, and the router in `js/router.js` does this). `archive.html` and
`math.html` are two small pages that pass visitors on to `#/archive` and `#/math`; `math.html#Real_Analysis`
lands on that item of the Math page. If you don't need them any more, delete those two files.

**Home page.** The figure (see below), then the newest notes as a list: date and reading time on
the left; title, opening lines and topics beside them. The whole row is a link. The list stops at
`recentCount` notes with a "Browse all" link to the archive. With `homeStyle: "full"` in `config.js`
every note is shown in full instead (topic, month and search pages follow the same setting).

**A note.** The title runs across the top; the date, reading time, topics and author sit in a column
on the left, and the text beside them. At the bottom are links to the next older and newer note. On a
phone the details move to one line above the text.

**Math page.** A short list of notes and problem sets that live as PDFs (here, on GitHub): a heading, a few
words about each, and its links. It is filled in from `Lemmata.math` in `config.js`, so adding another PDF
means adding another entry there (the comment above it explains the fields). A link whose address ends in
`.pdf` (the "View PDF" buttons) opens that PDF **inside the site**, on its own page (see
[The PDF viewer](#the-pdf-viewer)); any other link, such as "View GitHub", opens in a new tab.

**Top bar and footer.** The name (a link home), Math, Archive and About, and the search box. The page you
are on is underlined. The footer repeats the tagline and lists the topics and months with counts, and
the links from `config.js` under "Elsewhere" (they open in a new tab). If `farewell` is set in `config.js`,
its line closes the footer's first column.

**Search** looks in post titles and text (including the LaTeX source, so you can find a formula),
ignores capitals, and updates a moment after you stop typing. Press **/** anywhere on the page to jump
to the box. Emptying the box returns to the home page. A search address that someone sends you fills the box in.

**The figure** at the top of the home page is drawn by `js/figure.js`. It starts as a wall made of the
digits of π (worked out in the browser with Machin's formula, so there is no list of digits to look after).
After a moment the wall is "snapped": a ragged front crosses it from left to right, every digit crumbles
into grains, and the wind carries the grains away. Where they were, the symbol π is uncovered, in gold.
It plays once, when the home page first opens (and it waits until the figure is on the screen); a click on
the figure, or Enter when it has the keyboard focus, plays it again. If the visitor's device asks for reduced
motion, the finished picture (the gold π) is shown at once and nothing moves. The colours are the site's own:
the plate is `--deep` and the symbol is `--gold` from `css/theme.css`, and the dust is the soft blue and
near white that the old curves had. Its caption links to the post with the slug `basel-via-parseval` if
there is one. It is a plain `<canvas>` filled in with arithmetic; there is no image file. (After it draws
the home page, `router.js` asks `figure.js` to bring the figure to life.)

**Maths.** MathJax draws it after every page change. Equation numbers restart for each page. A comma,
full stop or closing bracket that follows a formula always stays on the same line as the formula.

**Looks.** Light only. Reading text is set in Source Serif 4 and small interface text in Hanken Grotesk.
On a phone the side lists move below the notes, long equations scroll sideways inside their own line instead
of widening the page, and the layout keeps clear of phone notches. Keyboard focus is shown with a blue
outline, and the first Tab press offers a "Skip to the content" link. Printing a note gives clean text
(no menus, footer or figure).

**Safety net.** When the page loads, each post file is checked (see the table below). A
bad post is skipped, the rest of the site still works, and a yellow box on every page says what to fix.

**How it fits together.** `index.html` loads `core.js`, then `config.js` and `manifest.js`,
then `views.js`, `figure.js`, `pdfviewer.js`, `chrome.js`, `router.js` and `main.js`. `main.js` adds a `<script>` tag for every
file in the manifest. Each post file calls `Lemmata.addPost(…)`, which checks the post and adds it to the
list. When all are in, the posts are sorted by date, the footer is filled in, and the router shows the page
named in the address. If that page holds a PDF, the router then asks `pdfviewer.js` to bring the viewer to
life, and to stop it (and its downloads) when the visitor goes to another page.

---

## The PDF viewer

The "View PDF" buttons on the Math page open a page of their own, modelled on MIT OpenCourseWare's resource
pages: the title, a **Resource Type** line (the entry's `type`), a **file card** (a PDF icon with the file's size,
its name, and a blue **Download File** button) and, under it, the PDF in a dark viewer. The entry's own few
words and its other links (such as View GitHub) come below the viewer, so the PDF is the first thing on the screen.

**The toolbar** has: a button that opens the side list (the PDF's own bookmarks as **Contents**, when it has
any, and **Pages**, a list of thumbnails); the page box (type a number and press Enter); zoom out and in
(25% to 400%); fit to page / fit to width; rotate; download; open in a new tab (the browser's own reader, which
has print and search); and full screen. On a phone the bar keeps only the contents button, the page box, zoom
and fit, and download, and the side list covers the pages instead of squeezing them. Text can be selected and copied, and the links
inside the PDF work, both web addresses and jumps to another page. With the keyboard: **+**, **-** and **0**
zoom in, zoom out and fit to width; **Esc** closes the side list; Tab moves along the toolbar.

Pages are drawn only when they come near the screen and are let go when they are far away, so a long PDF
stays light even on a phone.

### Add a PDF

Put the file on GitHub (any web address that lets other sites read the file works) and add an entry to
`Lemmata.math` in `config.js`:

```js
{
  id:    "Topology",
  title: "Topology Notes",
  type:  "Notes",
  text:  `A few words about it.`,
  links: [
    ["View PDF",    "https://github.com/baskrki/Notes/raw/main/topology/topology.pdf"],
    ["View GitHub", "https://github.com/baskrki/Notes/tree/main/topology"]
  ]
}
```

- `id` gives the entry its address (`#/math/Topology`, and `#/math/Topology/pdf` for the viewer). A link to a
  PDF needs it; an entry without an `id` still works, but its "View PDF" simply opens the file in a new tab.
- `type` is optional: it is the **Resource Type** line ("Notes", "Problem Set", "Lecture Notes", …).
- The address of the PDF is the one GitHub shows under **Raw**, or, simpler, the file's page address with `/blob/`
  changed to `/raw/` (both forms are understood; `?raw=true` at the end is fine too). A PDF in a **private**
  repository cannot be shown: GitHub gives it only to visitors who are signed in.
- An entry can have more than one PDF: the second is at `#/math/<id>/pdf/2`.
- A PDF kept in this site's own folder (say `pdfs/notes.pdf`) works the same way once the site is on a web host.
  Opened straight from the folder, a browser does not let a script read a local file, so that page offers the plain
  download link instead.

### Why not simply an `<iframe>`?

GitHub sends its raw files with `X-Frame-Options: deny` and as a plain download, so a browser refuses to show
them inside another page. What GitHub does allow is a script reading the file, so `js/pdfviewer.js` downloads
the PDF itself and draws it with [PDF.js](https://mozilla.github.io/pdf.js/), Mozilla's open-source PDF reader
(the one inside Firefox). The same viewer, with the same toolbar, then looks the same in every browser, on phones
too. GitHub's `github.com/…/raw/…` addresses are turned into the direct `raw.githubusercontent.com` ones for this,
because the first kind redirects, and a script is not allowed to follow that redirect.

### Where PDF.js comes from, and keeping it yourself

At the top of `js/pdfviewer.js` are `PDFJS_VERSION` and `PDFJS_HOSTS`: the reader is loaded from the first
address in that list that works (jsDelivr, then unpkg), and the version is fixed so that a new release can never
break the page. To use a newer version, change the number and check that a PDF still opens (the code was written
for version 6).

To not depend on a CDN at all, serve PDF.js from your own folder (this works on a web host, not when the site is
opened straight from a folder):

1. Download the `pdfjs-dist` package of that version (for example `npm pack pdfjs-dist@6.4.299`, then unpack it).
2. Copy these into a folder `vendor/pdfjs/` next to `index.html` (about 6 MB): `legacy/build/pdf.min.mjs` and
   `legacy/build/pdf.worker.min.mjs` (keep that folder structure), and the folders `cmaps`, `standard_fonts`, `wasm` and `iccs`.
3. Put `"vendor/pdfjs/"` first in `PDFJS_HOSTS`.

The host must serve `.mjs` files as JavaScript (most do; if the viewer says its reader could not be loaded, check this first).

### If something goes wrong

If the PDF cannot be loaded, or the reader cannot, the page says what happened in the dark panel and keeps
the **Download File** link working; the table in [Troubleshooting](#troubleshooting) lists the messages.
If PDF.js itself cannot be loaded (no connection to the CDN) but the PDF has arrived, the viewer hands the file to
the browser's own PDF reader when it has one. A PDF with a password is not opened (the viewer says so, and
does not ask for the password): use Download for those.

---

## Change the site

- **`config.js`**: `title`, `tagline` (the headline on the home page), `author` (shown under the headline,
  beside every note and in the footer), `email` (optional), `farewell` (optional last line of the footer),
  `recentCount` (how many notes the home page lists),
  `homeStyle` (`"list"` or `"full"`), `links` (`["name", "address"]` pairs for the footer), `about`
  (the About page, written as HTML between backticks; `${Lemmata.site.author}` inserts your name,
  and no other backticks may appear in it), and `math` (the entries of the Math page: `id`, `title`, `type`
  (optional), `text` and `links` for each; `text` is HTML between backticks, and `links` are
  `["label", "address"]` pairs; a link that ends in `.pdf` opens the viewer, see [Add a PDF](#add-a-pdf)).
- **`css/theme.css`**: every colour is a variable at the top, with a note on where it is used, and so are
  both fonts and the page widths (`--wrap`, `--col-l`, `--col-c`, `--col-r`). Change a value and it changes
  everywhere. Every text colour is above 4.5 : 1 against its background (the accessibility minimum), and most
  are above 6 : 1.
- **The PDF viewer:** its colours are the five `--pdf-…` variables in `css/theme.css` (toolbar and side list, the
  dark behind the pages, icons and text, the page box, the red "PDF" label on the file card); the file card's
  button uses the site's own link blue. Sizes, spacing and the phone layout are in `css/pdf.css`. The zoom
  steps (`ZOOMS`) and the address of PDF.js (`PDFJS_VERSION`, `PDFJS_HOSTS`) are at the top of `js/pdfviewer.js`.
- **The figure:** its settings are at the top of `js/figure.js`: `TIMING` (how long the wall stands before the
  snap, how long the snap takes to cross the plate, how long a grain stays in the air), and `WIND` and `SPREAD`
  (which way the dust blows, and how widely it fans out). Its colours come from `--deep` and `--gold` in
  `css/theme.css` (write those two as six-digit hex colours, like `#0b2447`). To remove the figure, delete the line `<script src="js/figure.js"></script>` from
  `index.html`; the headline then spans the page.
- **The footer** (its columns and the © line) is built in `js/chrome.js`; its look is in `css/layout.css`.
- **Fonts:** the files in `fonts/` are subsets (Latin, Greek, punctuation and common mathematical symbols);
  any other script, such as Devanagari, is shown in the device's own font. Both fonts are free under the SIL Open
  Font License; the licences are in the same folder.
- **Dark mode (optional):** it is off on purpose. To switch it on, change the
  `<meta name="color-scheme">` line in `index.html` to `content="light dark"` and add this to the end of `css/theme.css`:

  ```css
  @media screen and (prefers-color-scheme: dark) {
    :root {
      --bg:#0f1420; --paper:#151b2a; --tint:#18202f;
      --ink:#e8ecf5; --soft:#cdd5e6; --mute:#9aa6bf;
      --rule:#27314a; --field:#6f7a95; --edge:#46526e;
      --link:#8db4f5; --bar:#8fb0ee; --brass:#d9a441; --defn:#4fc0ad;
      --warn-bg:#3a3217; --warn-line:#a98a2a;
      color-scheme: dark;
    }
  }
  ```

  The figure and the footer stay dark blue in both modes. Printing stays light.

## Troubleshooting

The yellow box quotes the file. What each message means:

| Message                                              | Fix |
| ---------------------------------------------------- | --- |
| `… could not be loaded`                              | The name in `manifest.js` doesn't match a file in `posts/`. Check spelling, capitals and `.js`. |
| `… loaded but did not add a post`                    | There is a mistake inside the file. Usual causes: a backtick or `${` in the body, or a missing quote or comma. Open the browser console (F12, or Cmd+Option+J on a Mac) for the exact line. |
| `"date" must be a real date…`                        | Use `"2026-10-18"` (year-month-day, a day that exists). |
| `"slug" must be lowercase letters, digits and hyphens` | No capitals, spaces or accents: `"my-first-post"`. |
| `The slug "…" is already used by another post`       | Two posts share a slug (often a copied file you forgot to change). |
| `"title" is missing` / `"cats" must be a list`       | Fill in the title; write topics like `["algebra", "expository"]`. |
| `"summary" must be plain text between quotes`        | `summary` is optional, but if present it must be a string: `summary: "One sentence."`. |
| `manifest.js is missing or broken`                   | `posts/manifest.js` must contain `Lemmata.manifest = [ … ];`. |

The PDF page shows its own messages in the dark panel where the pages would be:

| Message                                              | Fix |
| ---------------------------------------------------- | --- |
| `The PDF was not found at its address.`              | The address in `config.js` is wrong (check capitals, the folder, and the branch name: `main` or `master`), or the repository is private. Paste the address into a browser: it should download the file. |
| `That file does not look like a PDF.`                | The address gives a web page, or a Git LFS stand-in, instead of the file. Use the file's **Raw** address: `https://github.com/<user>/<repo>/raw/<branch>/<path>.pdf`. |
| `The PDF reader could not be loaded. Are you online?` | The browser could not reach `cdn.jsdelivr.net` or `unpkg.com` (no connection, a firewall, a content blocker), or the browser is very old. Reload when online, or keep PDF.js in your own folder (see [The PDF viewer](#the-pdf-viewer)). The Download buttons still work. |
| `The PDF could not be shown here.`                   | The connection dropped, the file is damaged, or the browser blocked the request. **Download File** still gives the file. The console (F12) has a line starting `[Lemmata]` with the reason. |
| `This PDF is password protected.`                    | The viewer does not ask for passwords. Remove the password from the PDF, or use Download. |

Other things people hit:

- **A post doesn't show and there is no yellow box:** it isn't in `manifest.js`.
- **Maths shows as `$…$`:** MathJax didn't load (no internet, or the connection blocks `cdnjs.cloudflare.com`), or the formula has a typo.
- **Part of a formula or paragraph vanished:** you typed `<` or `>` in maths; see the rules above.
- **The text is in a plain system font:** the `fonts/` folder must sit next to `css/` and `index.html`. When you upload the site, upload that folder too.
- **The figure at the top of the home page is an empty dark box:** the browser could not draw it. The console
  (F12) says why, in a message that starts `[Lemmata] The figure could not be drawn`. The rest of the site is not affected.
- **You changed a file but see the old page:** do a hard refresh (Ctrl+Shift+R, or Cmd+Shift+R on a Mac).
- **A shared link to a post stopped working:** its `slug` was changed.
- **"View PDF" opens GitHub in a new tab instead of the viewer:** the Math entry has no `id`, or the link's address
  does not end in `.pdf`.
- **You replaced a PDF on GitHub but the site shows the old one:** GitHub passes on changed files within a few
  minutes, and a browser keeps the PDF it has loaded while the tab is open. Wait a little, then hard refresh.

## Good to know

- Each note's opening lines come from its first paragraph, or from `summary` if you wrote one. Put the
  strongest sentence first, or write a `summary`.
- With `homeStyle: "full"`, the home, topic, month and search pages show posts **in full**. With dozens of
  posts they get long; the default list stays short, and so does the archive.
- All pages live inside one `index.html` (the `#/…` part of the address), so search engines
  will mostly see only the home page, and visitors need JavaScript.
- There are no comments and no RSS feed.
- Topics and months are built from your posts automatically; there is no list to maintain.
- The "reading time" counts words at a careful pace (about 160 a minute), with each formula counted as three words.
- A PDF page downloads the whole PDF before it shows it (a few hundred kilobytes for notes like these, with a
  progress bar), and the reader (about half a megabyte) the first time only: the browser keeps both. Very large
  PDFs, say tens of megabytes, would make visitors wait; for those, link to the file instead of using the viewer
  (give the entry's link an address that does not end in `.pdf`, such as the file's GitHub page).
- The text of a PDF is not searched by the site's search box (only posts are).
