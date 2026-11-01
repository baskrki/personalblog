Lemmata.addPost({
  slug:  "basel-via-parseval",
  title: "The Basel problem via Parseval’s identity",
  date:  "2026-10-12",
  cats:  ["analysis","expository"],
  body:  String.raw`
<p>Euler’s evaluation $\sum_{n\ge1}1/n^2=\pi^2/6$ has many proofs. One of the quickest applies Parseval’s identity to the Fourier series of $f(x)=x$ on $[-\pi,\pi]$.</p>
<div class="thm"><p><b>Theorem 2 (Parseval).</b> Let $f$ be square-integrable on $[-\pi,\pi]$, with Fourier coefficients $a_n=\frac1\pi\int_{-\pi}^{\pi}f(x)\cos nx\,dx$ and $b_n=\frac1\pi\int_{-\pi}^{\pi}f(x)\sin nx\,dx$. Then
\[ \frac1\pi\int_{-\pi}^{\pi}f(x)^2\,dx=\frac{a_0^2}{2}+\sum_{n\ge1}\bigl(a_n^2+b_n^2\bigr). \]</p></div>
<p>Take $f(x)=x$. Being odd, $f$ has $a_n=0$ for all $n\ge0$, and integration by parts gives, for $n\ge1$,
\[ b_n=\frac1\pi\int_{-\pi}^{\pi}x\sin nx\,dx=\frac1\pi\Bigl[-\frac{x\cos nx}{n}+\frac{\sin nx}{n^2}\Bigr]_{-\pi}^{\pi}=\frac{2(-1)^{n+1}}{n}. \]
The left side of Parseval’s identity is $\frac1\pi\int_{-\pi}^{\pi}x^2\,dx=\frac{2\pi^2}{3}$, hence
\[ \frac{2\pi^2}{3}=\sum_{n\ge1}\frac{4}{n^2}. \]</p>
<p>Dividing by $4$ gives $\sum_{n\ge1}1/n^2=\pi^2/6$. <span class="qed">∎</span></p>
<p>The same method applied to $f(x)=x^2$, for which $a_0=2\pi^2/3$, $a_n=4(-1)^n/n^2$ and $b_n=0$, yields $\sum_{n\ge1}1/n^4=\pi^4/90$.</p>`
});
