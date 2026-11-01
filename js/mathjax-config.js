/* mathjax-config.js - settings for MathJax, the library that draws the maths.
   Must load BEFORE the MathJax script itself (index.html takes care of that). */
window.MathJax = {
  tex: {
    inlineMath:  [["$", "$"], ["\\(", "\\)"]],     // $x^2$   or   \(x^2\)
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],   // $$x^2$$ or   \[x^2\]
    tags: "ams"                                    // number \begin{equation}...\end{equation}
  },
  svg: { fontCache: "global" },
  options: { skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"] },
  startup: {
    // when MathJax finishes its first pass over the page, tidy the punctuation next to formulas (see js/router.js)
    pageReady: () => MathJax.startup.defaultPageReady().then(() => {
      if (window.Lemmata && Lemmata.tidyMath) Lemmata.tidyMath(document.getElementById("main"));
    })
  }
};
