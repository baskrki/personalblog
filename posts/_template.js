/* _template.js - copy this file to start a new post. It is not listed in
   manifest.js, so it never appears on the site itself.

   HOW TO PUBLISH A POST
   1. Copy this file and rename the copy  YYYY-MM-DD-short-title.js
      for example  2026-11-02-sylow-theorems.js
      (the file name is only for you; the site reads the fields below).
   2. Change slug, title, date and cats, then write the post inside body.
   3. Open manifest.js (same folder) and add the new file name to the list.
   4. Refresh index.html in the browser. The post is live.

   THE FIELDS
   slug     The post's address: index.html#/post/<slug>. Lowercase letters,
            digits and hyphens only, different for every post. Don't change it
            after you share the post, or old links will break.
   title    The heading, also used in lists, the footer and the browser tab.
            Plain text (no maths or HTML here).
   date     Year-month-day. Posts are sorted newest first by this date.
   cats     Topics, as a list of words. Each one becomes a link beside the
            post and an entry in the Topics lists. Spell it the same way every
            time: "algebra" and "Algebra" count as two topics.
   summary  Optional. One or two sentences of plain text, shown under the title
            in lists. Leave the line out (as below) and the site uses the first
            paragraph of the body instead.
   body     The post itself: HTML, with LaTeX maths. Everything between the two
            backticks is the post. Two things must NOT appear in the body:
              - a backtick
              - a dollar sign immediately followed by an opening curly brace
                (write a space in between instead: "$ {a}_b$")
            To show a real dollar sign in the text, write \$

   WRITING THE BODY (all of this is shown in the example below)
   $...$ or \(...\)    maths inside a line
   \[...\] or $$...$$  maths on its own line
   \begin{equation} ... \end{equation}   a numbered equation
   <div class="thm"><p><b>Theorem 1.</b> ...</p></div>   a boxed statement (italic)
   <div class="defn"><p><b>Definition 2.</b> ...</p></div>   a definition (green edge)
   <div class="rem"><p><b>Remark.</b> ...</p></div>   a remark or example (grey edge)
   <span class="qed">∎</span>   the end-of-proof square, placed at the end of the last paragraph
   <h3>...</h3>   a heading inside the post
   <ul><li>...</li></ul> and <ol><li>...</li></ol>   lists
   <a href="...">text</a>   a link
   <figure><img src="images/name.png" alt="what it shows"><figcaption>Caption</figcaption></figure>
          a picture: save the file in the images folder first
   The first paragraph is set a little larger, as an introduction, so use it to say what the post is about.
*/

Lemmata.addPost({
  slug:  "my-first-post",
  title: "Your post title",
  date:  "2026-10-24",
  cats:  ["algebra"],
  // summary: "One or two plain sentences for the lists. Optional.",
  body:  String.raw`
<p>Start with a paragraph that says what the post is about. Maths inside a line sits between single dollar signs, like $e^{i\pi}+1=0$.</p>

<div class="thm"><p><b>Theorem 1.</b> Put each theorem, lemma, proposition or corollary in a block like this one. For every positive integer $n$,
\[ 1+2+\dots+n=\frac{n(n+1)}{2}. \]</p></div>

<p><em>Proof.</em> Write the proof as ordinary paragraphs. Pair the terms $k$ and $n+1-k$: each pair sums to $n+1$, and there are $n/2$ pairs, which gives the formula. End the proof with the square. <span class="qed">∎</span></p>

<div class="defn"><p><b>Definition 2.</b> A <em>triangular number</em> is a number of the form $1+2+\dots+n$.</p></div>

<div class="rem"><p><b>Remark.</b> A remark, an example or a warning goes in a quieter box like this one.</p></div>

<h3>A heading inside the post</h3>
<ul>
<li>Lists work too, with maths in them: $x^2\ge 0$ for every real $x$.</li>
<li>And <a href="https://example.org">links</a>.</li>
</ul>`
});
