import Image from "next/image";

export default function Hero() {
  return (
    <section className="min-h-[80vh] py-20 sm:py-28" aria-labelledby="hero-title">
      <div className="grid items-stretch gap-14 md:grid-cols-2 md:gap-16">
        <div className="space-y-8 animate-fade-up">
          <p className="text-sm uppercase tracking-[0.16em] text-ink-muted/80">Product Manager</p>

          <div className="space-y-4">
            <h1 id="hero-title" className="text-4xl font-semibold tracking-tight leading-[1.05] text-balance md:text-6xl">
              Salut, je suis <span className="text-gradient-name">Lilian Praca.</span>
            </h1>
            <p className="max-w-2xl text-xl font-medium tracking-tight text-ink sm:text-2xl">
              Je transforme des frictions utilisateurs en décisions produit concrètes.
            </p>
          </div>

          <p className="max-w-2xl text-base leading-relaxed text-ink-muted/90 md:text-lg">
            Ex-dev Java avec 10+ ans cumulés sur des funnels e-commerce (CRO/growth).
          </p>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-bg transition hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Me contacter
              </a>
              <a
                href="https://www.linkedin.com/in/lilianpraca/"
                target="_blank"
                rel="noreferrer"
                aria-label="Ouvrir LinkedIn dans un nouvel onglet"
                className="rounded-full border border-border bg-transparent px-6 py-3 text-sm font-medium text-ink transition hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                LinkedIn
              </a>
            </div>
            <p className="text-sm text-ink-muted/80">Disponible pour missions produit / freelance</p>
          </div>
        </div>

        <div className="md:self-stretch">
          <div className="relative mx-auto h-[360px] w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-surface-2/45 shadow-[0_24px_60px_-36px_rgba(125,87,69,0.45)] sm:h-[420px] md:h-full md:max-h-full lg:max-h-[560px]">
            <Image
              src="/hero.png"
              alt="Portrait de Lilian Praca"
              fill
              sizes="(min-width: 1024px) 520px, (min-width: 768px) 44vw, 92vw"
              className="object-cover object-top"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
