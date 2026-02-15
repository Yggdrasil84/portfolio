"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";

const BURST_DURATION_MS = 650;

const PARTICLES: Array<{ dx: string; dy: string; rot: string; delay: string }> = [
  { dx: "-26px", dy: "-22px", rot: "-28deg", delay: "0ms" },
  { dx: "20px", dy: "-24px", rot: "24deg", delay: "34ms" },
  { dx: "32px", dy: "2px", rot: "16deg", delay: "52ms" },
  { dx: "-34px", dy: "6px", rot: "-18deg", delay: "70ms" },
  { dx: "-8px", dy: "-30px", rot: "-10deg", delay: "44ms" },
  { dx: "10px", dy: "28px", rot: "8deg", delay: "62ms" },
  { dx: "-18px", dy: "24px", rot: "-14deg", delay: "78ms" },
  { dx: "26px", dy: "18px", rot: "14deg", delay: "88ms" },
];

type ImpactBurstProps = {
  text?: string;
};

export default function ImpactBurst({ text = "impact mesurable" }: ImpactBurstProps) {
  const [isBursting, setIsBursting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const rootRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const setPreference = () => {
      setReduceMotion(media.matches);
    };

    setPreference();
    media.addEventListener("change", setPreference);

    return () => {
      media.removeEventListener("change", setPreference);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const setOriginFromPointer = (event: React.MouseEvent<HTMLSpanElement>) => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    setOrigin({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const setOriginToCenter = () => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    setOrigin({
      x: rect.width / 2,
      y: rect.height / 2,
    });
  };

  const triggerBurst = () => {
    if (reduceMotion) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsBursting(false);
    requestAnimationFrame(() => {
      setIsBursting(true);
      timeoutRef.current = setTimeout(() => {
        setIsBursting(false);
        timeoutRef.current = null;
      }, BURST_DURATION_MS);
    });
  };

  return (
    <span
      ref={rootRef}
      tabIndex={0}
      onMouseMove={setOriginFromPointer}
      onMouseEnter={(event) => {
        setOriginFromPointer(event);
        triggerBurst();
      }}
      onFocus={() => {
        setOriginToCenter();
        triggerBurst();
      }}
      className="impact-burst group relative inline-block rounded-[0.2em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <span className={`impact-text ${isBursting ? "impact-text--active impact-shake" : ""}`}>{text}</span>
      {isBursting &&
        PARTICLES.map((particle, index) => (
          <span
            key={`${particle.dx}-${particle.dy}-${index}`}
            aria-hidden
            className="impact-particle"
            style={
              {
                left: `${origin.x}px`,
                top: `${origin.y}px`,
                "--dx": particle.dx,
                "--dy": particle.dy,
                "--rot": particle.rot,
                "--delay": particle.delay,
              } as CSSProperties
            }
          >
            {"\u26A1"}
          </span>
        ))}
    </span>
  );
}
