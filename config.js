/* config.js - everything about the site itself. Edit freely.
   (To write a post, you don't need this file: see posts/_template.js.) */

Lemmata.site = {
  title:   "Lemmata",
  tagline: "Expository notes, worked problems and reading notes in algebra and analysis.",
  author:  "Basu Dev Karki",
  email:   "",    // optional, like "you@example.com"; adds a Contact line to the About page
  farewell: "Have a great day!"   // optional: a last line at the foot of every page
};

// How many notes the home page lists before the "Browse all" link to the archive.
Lemmata.recentCount = 5;

// How lists of notes look (home, topics, months, search):
//   "list" - each note is a title with a short excerpt; click through to read it (default)
//   "full" - every note is shown in full, one after the other
Lemmata.homeStyle = "list";

// the "Elsewhere" list in the footer: [ name, address ]
Lemmata.links = [
  ["Terence Tao: What’s new", "https://terrytao.wordpress.com"],
  ["arXiv: Mathematics", "https://arxiv.org/archive/math"],
  ["MathOverflow", "https://mathoverflow.net"],
  ["The Stacks Project", "https://stacks.math.columbia.edu"],
  ["MIT OpenCourseWare", "https://ocw.mit.edu"]
];

// the text of the About page: HTML between backticks (maths works here too).
// ${Lemmata.site.author} is replaced by the author name above; no other backticks inside, please.
Lemmata.about = `
<p>I am ${Lemmata.site.author}, an undergraduate student of mathematics. This blog collects expository notes, worked problems and reading notes, mostly in algebra and analysis, written as I try to move from olympiad-style problem solving towards research-level mathematics.</p>
<p>Everything is typeset in LaTeX and rendered with MathJax. Errors are likely in notes of this kind; corrections are welcome.</p>`;

// the Math page: notes and problem sets that live as PDFs (here, on GitHub).
// Every entry is { id, title, type, text, links }:
//   id     the item's anchor: index.html#/math/Real_Analysis opens the Math page at that item
//   title  its heading
//   type   optional: what kind of thing it is ("Notes", "Problem Set", …); shown as "Resource Type" above the PDF
//   text   a few words about it: HTML between backticks (no other backticks inside, please)
//   links  [ label, address ] pairs, shown under the text. A link whose address ends in .pdf opens in the
//          site's own PDF viewer (index.html#/math/Real_Analysis/pdf); any other link opens in a new tab.
//          The entry needs an id for the viewer page to have an address.
Lemmata.math = [
  {
    id:    "Real_Analysis",
    title: "Real Analysis Problem Set",
    type:  "Problem Set",
    text:  `Problem sets based on MIT OpenCourseWare 18.100B (Real Analysis, Spring 2025). Original problems © MIT OCW; solutions written by me. Shared under the <strong>CC BY-NC-SA 4.0</strong> license. I’m still working on problem sets 9 and 10. Visit my GitHub for source files and proper licensing.`,
    links: [
      ["View PDF",    "https://github.com/baskrki/Notes/raw/main/realanalysis/realanalysis.pdf"],
      ["View GitHub", "https://github.com/baskrki/Notes/blob/main/realanalysis"]
    ]
  },
  {
    id:    "Linear_Algebra",
    title: "Linear Algebra Notes",
    type:  "Notes",
    text:  `Personal notes based on Sheldon Axler’s <em>Linear Algebra Done Right</em>, written in my own words, with selected problem solutions.`,
    links: [
      ["View PDF",    "https://github.com/baskrki/Notes/raw/main/linearalgebra/linalgebra.pdf"],
      ["View GitHub", "https://github.com/baskrki/Notes/tree/main/linearalgebra"]
    ]
  },
  {
    id:    "Group_Theory",
    title: "Group Theory Notes",
    type:  "Notes",
    text:  `Abstract algebra notes written independently while studying standard textbooks. Includes original explanations and selected problem solutions.`,
    links: [
      ["View PDF",    "https://github.com/baskrki/Notes/raw/main/grouptheory/grouptheory.pdf"],
      ["View GitHub", "https://github.com/baskrki/Notes/tree/main/grouptheory"]
    ]
  }
];
