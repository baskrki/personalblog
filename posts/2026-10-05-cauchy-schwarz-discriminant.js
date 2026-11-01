Lemmata.addPost({
  slug:  "cauchy-schwarz-discriminant",
  title: "Cauchy–Schwarz from a non-negative quadratic",
  date:  "2026-10-05",
  cats:  ["analysis","olympiad"],
  body:  String.raw`
<p>The inequality $(\sum a_ib_i)^2\le(\sum a_i^2)(\sum b_i^2)$ is among the first tools learned in olympiad training. The proof below works verbatim in any real inner product space.</p>
<div class="thm"><p><b>Theorem 3 (Cauchy–Schwarz).</b> Let $u,v$ be vectors in a real inner product space. Then $\langle u,v\rangle^2\le\langle u,u\rangle\langle v,v\rangle$, with equality if and only if $u$ and $v$ are linearly dependent.</p></div>
<p><em>Proof.</em> If $v=0$ both sides are $0$ and $u,v$ are dependent. Otherwise, for every real $t$,
\[ 0\le\langle u-tv,\,u-tv\rangle=\langle u,u\rangle-2t\langle u,v\rangle+t^2\langle v,v\rangle. \]
Choosing $t=\langle u,v\rangle/\langle v,v\rangle$ gives $0\le\langle u,u\rangle-\langle u,v\rangle^2/\langle v,v\rangle$, and multiplying by $\langle v,v\rangle>0$ proves the inequality. Equality holds exactly when $\langle u-tv,u-tv\rangle=0$, that is, when $u=tv$; conversely, if $u=sv$ then both sides equal $s^2\langle v,v\rangle^2$. <span class="qed">∎</span></p>
<p>In coordinates, with $u=(a_i)$ and $v=(b_i)$, the quadratic $\sum_i(a_it-b_i)^2$ is non-negative for all $t$, so its discriminant is non-positive. This is the familiar olympiad argument.</p>`
});
