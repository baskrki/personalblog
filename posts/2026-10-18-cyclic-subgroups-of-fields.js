Lemmata.addPost({
  slug:  "cyclic-subgroups-of-fields",
  title: "Finite subgroups of the multiplicative group of a field",
  date:  "2026-10-18",
  cats:  ["algebra","expository"],
  body:  String.raw`
<p>A classical fact, used constantly in field theory and number theory, is that every finite subgroup of the multiplicative group of a field is cyclic. The proof below is a pure counting argument and does not need the structure theorem for finite abelian groups.</p>
<div class="thm"><p><b>Theorem 1.</b> Let $F$ be a field and let $G\subseteq F^{\times}$ be a finite subgroup of order $n$. Then $G$ is cyclic.</p></div>
<p><em>Proof.</em> For each divisor $d$ of $n$, let $\psi(d)$ be the number of elements of $G$ of order exactly $d$. Suppose $\psi(d)\ge 1$, and pick $a\in G$ of order $d$. The $d$ distinct elements $1,a,\dots,a^{d-1}$ are roots of $x^d-1$, a polynomial with at most $d$ roots in the field $F$, so these are all of its roots. Every element of order $d$ is a root of $x^d-1$, hence lies in $\langle a\rangle$, and the cyclic group $\langle a\rangle$ has exactly $\varphi(d)$ elements of order $d$. Therefore $\psi(d)\in\{0,\varphi(d)\}$ for every $d\mid n$.</p>
<p>By Lagrange’s theorem every element of $G$ has order dividing $n$, and $\sum_{d\mid n}\varphi(d)=n$, so
\[ n=\sum_{d\mid n}\psi(d)\le\sum_{d\mid n}\varphi(d)=n. \]
Equality must hold termwise, so $\psi(d)=\varphi(d)$ for all $d\mid n$. In particular $\psi(n)=\varphi(n)\ge 1$: $G$ contains an element of order $n$, so $G$ is cyclic. <span class="qed">∎</span></p>
<p>Two standard consequences: the group $\mathbb F_q^{\times}$ of a finite field is cyclic of order $q-1$ (for $q=p$ prime this is the existence of primitive roots modulo $p$), and the group $\mu_n(F)$ of $n$-th roots of unity in any field $F$ is cyclic. The field hypothesis matters: the unit group $(\mathbb Z/8\mathbb Z)^{\times}=\{1,3,5,7\}$ is not cyclic, because $x^2-1$ has four roots in $\mathbb Z/8\mathbb Z$.</p>`
});
