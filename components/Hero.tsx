"use client";

import { useRef } from "react";
import GooeyTexturePhrase from "@/components/GooeyTexturePhrase";
import { GooeyTrailProvider } from "@/components/GooeyTrailProvider";
import HeroBackground from "@/components/HeroBackground";
import ImpactBurst from "@/components/ImpactBurst";
import GlitchPerspectiveImage from "@/components/GlitchPerspectiveImage";

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={heroRef}
      className="relative isolate w-screen left-1/2 -translate-x-1/2 overflow-x-clip min-h-[80vh] py-20 sm:py-28"
      aria-labelledby="hero-title"
    >
      <HeroBackground containerRef={heroRef} />

      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10 relative z-10">
        <div className="grid items-stretch gap-14 md:grid-cols-2 md:gap-16">
          <div className="space-y-8 animate-fade-up">
            <p className="text-sm uppercase tracking-[0.16em] text-ink-muted/80">PM · Growth &amp; CRO</p>

            <div className="space-y-4">
              <GooeyTrailProvider>
                <h1 id="hero-title" className="text-4xl font-bold tracking-tight leading-[1.05] text-balance md:text-6xl">
                  Je transforme les <GooeyTexturePhrase yNudge={4}>{"frictions\u00A0UX"}</GooeyTexturePhrase> en{" "}
                  <GooeyTexturePhrase yNudge={4}>{"leviers\u00A0de\u00A0"}</GooeyTexturePhrase>
                  <span className="hidden lg:inline"> </span>
                  {/* conversion + point toujours ensemble */}
                  <span className="md:block lg:inline">
                    <GooeyTexturePhrase yNudge={4}>conversion</GooeyTexturePhrase>
                    <span aria-hidden className="text-ink">
                      .
                    </span>
                  </span>
                </h1>
              </GooeyTrailProvider>
            </div>

            <p className="max-w-2xl text-base leading-relaxed text-ink-muted/90 md:text-lg">
              <button
                type="button"
                className="hover-keyterm rounded-[0.2em] border-0 bg-transparent p-0 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                10+ ans
              </button>{" "}
              entre tech et e-commerce : analyse, priorisation, delivery et <ImpactBurst />.
            </p>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <a
                  href="/cv.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="group relative inline-flex items-center overflow-hidden rounded-full bg-ink px-6 py-3 text-sm font-medium text-bg shadow-[0_8px_24px_-14px_rgba(8,10,16,0.85)] transition duration-200 hover:-translate-y-px hover:bg-ink/90 hover:shadow-[0_14px_30px_-16px_rgba(8,10,16,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  {/* TODO: Add public/cv.pdf */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  >
                    <span className="absolute -inset-x-6 -top-10 h-16 rotate-[-8deg] bg-gradient-to-r from-transparent via-bg/25 to-transparent" />
                  </span>
                  <span className="relative z-10">Télécharger mon CV</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/lilianpraca/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Ouvrir LinkedIn dans un nouvel onglet"
                  className="group inline-flex items-center rounded-full border border-border bg-transparent px-6 py-3 text-sm font-medium text-ink transition duration-200 hover:border-ink/60 hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  <span className="relative">
                    LinkedIn
                    <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-ink/70 transition-transform duration-200 group-hover:scale-x-100" />
                  </span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex justify-center md:self-stretch">
            <div className="relative h-[360px] w-[300px] overflow-hidden rounded-3xl border border-border/60 bg-surface-2/45 shadow-[0_24px_60px_-36px_rgba(125,87,69,0.45)] sm:h-[420px] sm:w-[340px] md:h-full md:w-[360px] md:max-h-full lg:max-h-[560px]">
              <GlitchPerspectiveImage
                src="/hero.png"
                alt="Portrait de Lilian Praca"
                sizes="(min-width: 1024px) 360px, (min-width: 768px) 360px, (min-width: 640px) 340px, 300px"
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
