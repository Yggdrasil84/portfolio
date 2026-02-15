"use client";

import { useEffect, useRef } from "react";

type SpotlightPhraseProps = {
  children: string;
  className?: string;
};

export default function SpotlightPhrase({ children, className = "" }: SpotlightPhraseProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const setReducedMotion = () => {
      reduceMotionRef.current = media.matches;
    };

    setReducedMotion();
    media.addEventListener("change", setReducedMotion);

    return () => {
      media.removeEventListener("change", setReducedMotion);
    };
  }, []);

  const handleMouseMove = (event: React.MouseEvent<HTMLSpanElement>) => {
    if (reduceMotionRef.current || !rootRef.current) return;

    const rect = rootRef.current.getBoundingClientRect();
    rootRef.current.style.setProperty("--sx", `${event.clientX - rect.left}px`);
    rootRef.current.style.setProperty("--sy", `${event.clientY - rect.top}px`);
  };

  return (
    <span
      ref={rootRef}
      onMouseMove={handleMouseMove}
      tabIndex={0}
      className={`spotlight-phrase group cursor-accent-target isolate align-baseline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${className}`}
    >
      <span className="spotlight-base font-bold">{children}</span>
      <span aria-hidden className="spotlight-glow font-bold">
        {children}
      </span>
    </span>
  );
}
