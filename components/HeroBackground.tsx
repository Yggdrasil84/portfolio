"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";

type HeroBackgroundProps = {
  containerRef: React.RefObject<HTMLElement | null>;
};

type Vec2 = { x: number; y: number };

type Dot = {
  top: string;
  left?: string;
  right?: string;
  size: string;
  duration: string;
  delay: string;
  driftX: string;
  driftY: string;
};

const DEBUG_BOUNDS = false;
const LERP = 0.1;
const HALO_MAX_SHIFT = 32;
const DOT_MAX_SHIFT = 16;
const LINE_MAX_SHIFT = 6;

const DOTS: Dot[] = [
  { top: "12%", left: "6%", size: "0.625rem", duration: "4.2s", delay: "0ms", driftX: "8px", driftY: "-6px" },
  { top: "20%", right: "8%", size: "0.625rem", duration: "4.6s", delay: "180ms", driftX: "-7px", driftY: "5px" },
  { top: "30%", left: "18%", size: "0.5rem", duration: "3.9s", delay: "320ms", driftX: "6px", driftY: "7px" },
  { top: "38%", right: "22%", size: "0.5rem", duration: "4.8s", delay: "90ms", driftX: "-8px", driftY: "-5px" },
  { top: "50%", left: "10%", size: "0.625rem", duration: "4.4s", delay: "410ms", driftX: "9px", driftY: "4px" },
  { top: "58%", right: "12%", size: "0.625rem", duration: "4.1s", delay: "220ms", driftX: "-7px", driftY: "6px" },
  { top: "70%", left: "24%", size: "0.5rem", duration: "3.8s", delay: "510ms", driftX: "7px", driftY: "-6px" },
  { top: "78%", right: "28%", size: "0.5rem", duration: "4.7s", delay: "360ms", driftX: "-6px", driftY: "6px" },
  { top: "84%", left: "7%", size: "0.625rem", duration: "4.3s", delay: "140ms", driftX: "8px", driftY: "5px" },
  { top: "86%", right: "9%", size: "0.625rem", duration: "5s", delay: "280ms", driftX: "-8px", driftY: "-5px" },
];

export default function HeroBackground({ containerRef }: HeroBackgroundProps) {
  const [motion, setMotion] = useState<Vec2>({ x: 0, y: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);
  const targetRef = useRef<Vec2>({ x: 0, y: 0 });
  const currentRef = useRef<Vec2>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => {
      setReduceMotion(media.matches);
    };

    syncMotionPreference();
    media.addEventListener("change", syncMotionPreference);

    return () => {
      media.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || reduceMotion) {
      targetRef.current = { x: 0, y: 0 };
      currentRef.current = { x: 0, y: 0 };
      setMotion({ x: 0, y: 0 });
      return;
    }

    const onMouseMove = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;

      targetRef.current = {
        x: Math.max(-1, Math.min(1, nx)),
        y: Math.max(-1, Math.min(1, ny)),
      };
    };

    const onMouseLeave = () => {
      targetRef.current = { x: 0, y: 0 };
    };

    const tick = () => {
      const current = currentRef.current;
      const target = targetRef.current;

      current.x += (target.x - current.x) * LERP;
      current.y += (target.y - current.y) * LERP;

      setMotion({ x: current.x, y: current.y });
      rafRef.current = window.requestAnimationFrame(tick);
    };

    node.addEventListener("mousemove", onMouseMove);
    node.addEventListener("mouseleave", onMouseLeave);
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      node.removeEventListener("mousemove", onMouseMove);
      node.removeEventListener("mouseleave", onMouseLeave);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [containerRef, reduceMotion]);

  const transformFor = (maxShift: number, factor: number, scale = 1) => {
    const x = motion.x * maxShift * factor;
    const y = motion.y * maxShift * factor;
    return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale})`;
  };

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden
      style={
        DEBUG_BOUNDS
          ? {
              outline: "1px solid rgba(125,87,69,0.35)",
            }
          : undefined
      }
    >
      <div className="hero-bg-grid absolute inset-0" />

      <div className="absolute inset-0" style={{ transform: transformFor(HALO_MAX_SHIFT, 0.6) }}>
        <div className="hero-bg-halo hero-bg-halo-primary absolute right-[-10%] top-[8%] h-[640px] w-[640px]" />
      </div>

      <div className="absolute inset-0" style={{ transform: transformFor(HALO_MAX_SHIFT, 1.0) }}>
        <div className="hero-bg-halo hero-bg-halo-secondary absolute right-[20%] bottom-[-18%] h-[500px] w-[500px]" />
      </div>

      <div className="absolute inset-0" style={{ transform: transformFor(HALO_MAX_SHIFT, 0.75) }}>
        <div className="hero-bg-halo hero-bg-halo-tertiary absolute left-[-8%] top-[42%] h-[360px] w-[360px]" />
      </div>

      <div className="absolute inset-0" style={{ transform: transformFor(LINE_MAX_SHIFT, 0.35) }}>
        <div
          className="hero-bg-line absolute left-[-70%] top-[16%] w-[240%] -rotate-[12deg]"
          style={{ animation: "heroLineSlide 7s ease-in-out infinite" }}
        />
        <div
          className="hero-bg-line absolute left-[-68%] top-[46%] w-[235%] rotate-[8deg]"
          style={{ animation: "heroLineSlide 10s ease-in-out infinite", animationDelay: "1.2s" }}
        />
        <div
          className="hero-bg-line absolute left-[-66%] top-[74%] w-[230%] rotate-[18deg]"
          style={{ animation: "heroLineSlide 12s ease-in-out infinite", animationDelay: "2.4s" }}
        />
      </div>

      <div className="absolute inset-0" style={{ transform: transformFor(DOT_MAX_SHIFT, 1.0) }}>
        {DOTS.map((dot, index) => (
          <span
            key={`${dot.top}-${dot.left ?? dot.right}-${index}`}
            className="hero-bg-dot absolute"
            style={
              {
                top: dot.top,
                left: dot.left,
                right: dot.right,
                width: dot.size,
                height: dot.size,
                "--dot-drift-x": dot.driftX,
                "--dot-drift-y": dot.driftY,
                animation: `heroDotPulse ${dot.duration} ease-in-out infinite, heroDotDrift ${dot.duration} ease-in-out infinite`,
                animationDelay: dot.delay,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
