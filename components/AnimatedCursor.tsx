"use client";

import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], input, textarea, select, summary, label, .gooey-phrase, .gpi, [data-cursor='interactive']";

type Dot = {
  aDeg: number;
  r: number;
  ox: number;
  oy: number;
  d: number;
  s: number;
  jx1: number;
  jy1: number;
  jx2: number;
  jy2: number;
  dur: number;
  tone: "a" | "b" | "c";
};

export default function AnimatedCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const sRef = useRef({
    enabled: true,
    visible: false,
    hovering: false,
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    lastMove: 0,
  });

  const dots = useMemo<Dot[]>(() => {
    const count = 216;
    const out: Dot[] = [];
    for (let i = 0; i < count; i += 1) {
      const aDeg = (i / count) * 360;
      out.push({
        aDeg: aDeg + (Math.random() - 0.5) * 7.6,
        r: 15 + Math.random() * 12,
        ox: (Math.random() - 0.5) * 30,
        oy: (Math.random() - 0.5) * 30,
        d: Math.random() * 0.95,
        s: 0.48 + Math.random() * 1.2,
        jx1: (Math.random() - 0.5) * 4.8,
        jy1: (Math.random() - 0.5) * 4.8,
        jx2: (Math.random() - 0.5) * 7.4,
        jy2: (Math.random() - 0.5) * 7.4,
        dur: 0.52 + Math.random() * 0.72,
        tone: i % 3 === 0 ? "a" : i % 3 === 1 ? "b" : "c",
      });
    }
    return out;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarseMedia = window.matchMedia("(hover: none), (pointer: coarse)");

    const syncEnabled = () => {
      const disabled = motionMedia.matches || coarseMedia.matches;
      sRef.current.enabled = !disabled;
      root.style.display = disabled ? "none" : "block";
      if (disabled) {
        root.classList.remove("is-visible", "is-hover");
        sRef.current.visible = false;
        sRef.current.hovering = false;
      }
    };

    syncEnabled();
    motionMedia.addEventListener("change", syncEnabled);
    coarseMedia.addEventListener("change", syncEnabled);

    const show = () => {
      if (!sRef.current.visible) {
        sRef.current.visible = true;
        root.classList.add("is-visible");
      }
    };

    const hide = () => {
      sRef.current.visible = false;
      root.classList.remove("is-visible", "is-hover");
      sRef.current.hovering = false;
    };

    const onMove = (event: PointerEvent) => {
      if (!sRef.current.enabled) return;
      sRef.current.tx = event.clientX;
      sRef.current.ty = event.clientY;
      sRef.current.lastMove = performance.now();
      show();
    };

    const onLeaveWin = () => hide();

    const setHover = (next: boolean) => {
      if (sRef.current.hovering === next) return;
      sRef.current.hovering = next;
      root.classList.toggle("is-hover", next);
    };

    const onOver = (event: PointerEvent) => {
      if (!sRef.current.enabled) return;
      const target = event.target as Element | null;
      if (!target) return;
      if (target.closest(INTERACTIVE_SELECTOR)) setHover(true);
    };

    const onOut = (event: PointerEvent) => {
      if (!sRef.current.enabled) return;
      const from = (event.target as Element | null)?.closest(INTERACTIVE_SELECTOR);
      if (!from) return;
      const to = (event.relatedTarget as Element | null)?.closest(INTERACTIVE_SELECTOR);
      if (!to) setHover(false);
    };

    const tick = (now: number) => {
      const s = sRef.current;
      if (!s.enabled || !root) return;

      const dx = s.tx - s.x;
      const dy = s.ty - s.y;
      const dist = Math.hypot(dx, dy);

      const idleMs = now - s.lastMove;
      const ease = idleMs < 70 ? 0.14 : 0.45;

      if (dist < 0.35) {
        s.x = s.tx;
        s.y = s.ty;
      } else {
        s.x += dx * ease;
        s.y += dy * ease;
      }

      root.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeaveWin, { passive: true });
    document.addEventListener("pointerover", onOver as EventListener, { passive: true });
    document.addEventListener("pointerout", onOut as EventListener, { passive: true });

    return () => {
      motionMedia.removeEventListener("change", syncEnabled);
      coarseMedia.removeEventListener("change", syncEnabled);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeaveWin);
      document.removeEventListener("pointerover", onOver as EventListener);
      document.removeEventListener("pointerout", onOut as EventListener);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={rootRef} className="acursor" aria-hidden>
      <div className="acursor__wrap">
        <svg className="acursor__ring" viewBox="0 0 48 48">
          <circle className="acursor__ringC" cx="24" cy="24" r="18" />
        </svg>

        <div className="acursor__dots">
          {dots.map((dot, index) => (
            <span
              key={index}
              className={`acursor__dot acursor__dot--${dot.tone}`}
              style={
                {
                  ["--a" as never]: `${dot.aDeg}deg`,
                  ["--r" as never]: `${dot.r}px`,
                  ["--ox" as never]: `${dot.ox}px`,
                  ["--oy" as never]: `${dot.oy}px`,
                  ["--d" as never]: `${dot.d}s`,
                  ["--s" as never]: `${dot.s}`,
                  ["--jx1" as never]: `${dot.jx1}px`,
                  ["--jy1" as never]: `${dot.jy1}px`,
                  ["--jx2" as never]: `${dot.jx2}px`,
                  ["--jy2" as never]: `${dot.jy2}px`,
                  ["--dur" as never]: `${dot.dur}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
