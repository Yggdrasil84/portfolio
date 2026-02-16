import Hero from "@/components/Hero";

export default function Home() {
  const projects = [
    {
      title: "Atlas Journal",
      category: "Direction artistique / Web",
      description:
        "Refonte d'un média indépendant avec une grille modulaire, une lecture apaisée et un rythme éditorial assumé.",
      year: "2025",
    },
    {
      title: "Studio Solstice",
      category: "Branding / UX Writing",
      description:
        "Conception d'une identité narrative et d'une interface claire pour présenter un catalogue de projets culturels.",
      year: "2024",
    },
    {
      title: "Notes de Terrain",
      category: "Produit / Contenu",
      description:
        "Création d'une plateforme long format orientée récits, avec hiérarchie typographique et navigation progressive.",
      year: "2023",
    },
  ];

  return (
    <div className="bg-bg text-ink">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
          <a href="#top" className="text-sm font-semibold uppercase tracking-[0.12em]">
            Portfolio
          </a>

          <nav className="hidden items-center gap-8 text-sm text-ink-muted/85 md:flex">
            <a href="#about" className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
              About
            </a>
            <a href="#projects" className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
              Projects
            </a>
            <a href="#contact" className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
              Contact
            </a>
          </nav>

          <a
            href="mailto:praca.lilian@gmail.com"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Email
          </a>
        </div>
      </header>

      <main id="top" className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        <Hero />

        <section id="about" className="scroll-mt-28 border-t border-border/65 py-20 sm:py-24" aria-labelledby="about-title">
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <h2 id="about-title" className="text-3xl font-semibold tracking-tight md:col-span-4 sm:text-4xl">
              About
            </h2>
            <div className="space-y-6 text-base leading-relaxed text-ink-muted/90 md:col-span-8 sm:text-lg">
              <p>
                J'aide des équipes à transformer des idées complexes en interfaces lisibles. Mon travail se situe à
                l'intersection du design produit, du storytelling et de la direction visuelle.
              </p>
              <p>
                Je privilégie des systèmes simples, une hiérarchie forte et des détails mesurés pour créer des
                expériences calmes, élégantes et efficaces.
              </p>
            </div>
          </div>
        </section>

        <section
          id="projects"
          className="scroll-mt-28 border-t border-border/65 py-20 sm:py-24"
          aria-labelledby="projects-title"
        >
          <div className="mb-12 flex items-end justify-between gap-6">
            <h2 id="projects-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Projects
            </h2>
            <a href="#contact" className="text-sm text-ink-muted/85 underline-offset-4 transition hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
              Disponible pour de nouveaux projets
            </a>
          </div>

          <div className="space-y-5">
            {projects.map((project) => (
              <article
                key={project.title}
                className="rounded-2xl border border-border/60 bg-surface/60 p-6 sm:p-8"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-medium tracking-tight">{project.title}</h3>
                    <p className="text-sm text-ink-muted/80">{project.category}</p>
                  </div>
                  <span className="text-sm text-ink-muted/80">{project.year}</span>
                </div>
                <p className="mt-5 max-w-3xl text-base leading-relaxed text-ink-muted/90 sm:text-lg">{project.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="contact"
          className="scroll-mt-28 border-t border-border/65 py-20 sm:py-24"
          aria-labelledby="contact-title"
        >
          <div className="max-w-3xl space-y-8">
            <h2 id="contact-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Contact
            </h2>
            <p className="text-lg leading-relaxed text-ink-muted/90 sm:text-xl">
              Vous lancez un projet digital, une refonte ou une plateforme de contenu ? Je suis disponible pour
              collaborer avec des studios, des marques et des équipes produit.
            </p>
            <a
              href="mailto:hello@example.com"
              className="inline-flex items-center rounded-full bg-ink px-7 py-3 text-sm font-medium text-bg transition hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              hello@example.com
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
