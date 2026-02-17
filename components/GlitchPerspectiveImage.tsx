"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { CSSProperties } from "react";

type Props = {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
};

export default function GlitchPerspectiveImage({ src, alt, sizes, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const activeRef = useRef(false);
  const targetRef = useRef({ rx: 0, ry: 0, tx: 0, ty: 0, sx: 0, sy: 0, s: 1, mx: 50, my: 50 });
  const currentRef = useRef({ rx: 0, ry: 0, tx: 0, ty: 0, sx: 0, sy: 0, s: 1, mx: 50, my: 50 });
  const [active, setActive] = useState(false);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarseMedia = window.matchMedia("(hover: none), (pointer: coarse)");

    const sync = () => {
      setDisabled(motionMedia.matches || coarseMedia.matches);
      if (motionMedia.matches || coarseMedia.matches) {
        activeRef.current = false;
        setActive(false);
      }
    };

    sync();
    motionMedia.addEventListener("change", sync);
    coarseMedia.addEventListener("change", sync);

    return () => {
      motionMedia.removeEventListener("change", sync);
      coarseMedia.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const updateTargetFromPointer = () => {
    if (!rootRef.current || !pointerRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const px = pointerRef.current.x - rect.left;
    const py = pointerRef.current.y - rect.top;
    const nx = rect.width > 0 ? px / rect.width : 0.5;
    const ny = rect.height > 0 ? py / rect.height : 0.5;
    const cx = nx * 2 - 1;
    const cy = ny * 2 - 1;

    targetRef.current = {
      rx: -cy * 10,
      ry: cx * 12,
      tx: cx * 8,
      ty: cy * 6,
      sx: cx * 6,
      sy: cy * 5,
      s: 1.06,
      mx: nx * 100,
      my: ny * 100,
    };
  };

  const tick = () => {
    if (!rootRef.current) {
      rafRef.current = null;
      return;
    }

    if (pointerRef.current) {
      updateTargetFromPointer();
    }

    const current = currentRef.current;
    const target = targetRef.current;
    const ease = 0.15;

    current.rx += (target.rx - current.rx) * ease;
    current.ry += (target.ry - current.ry) * ease;
    current.tx += (target.tx - current.tx) * ease;
    current.ty += (target.ty - current.ty) * ease;
    current.sx += (target.sx - current.sx) * ease;
    current.sy += (target.sy - current.sy) * ease;
    current.s += (target.s - current.s) * ease;
    current.mx += (target.mx - current.mx) * ease;
    current.my += (target.my - current.my) * ease;

    rootRef.current.style.setProperty("--rx", `${current.rx.toFixed(2)}deg`);
    rootRef.current.style.setProperty("--ry", `${current.ry.toFixed(2)}deg`);
    rootRef.current.style.setProperty("--tx", `${current.tx.toFixed(2)}px`);
    rootRef.current.style.setProperty("--ty", `${current.ty.toFixed(2)}px`);
    rootRef.current.style.setProperty("--sx", `${current.sx.toFixed(2)}px`);
    rootRef.current.style.setProperty("--sy", `${current.sy.toFixed(2)}px`);
    rootRef.current.style.setProperty("--s", `${current.s.toFixed(4)}`);
    rootRef.current.style.setProperty("--mx", `${current.mx.toFixed(2)}%`);
    rootRef.current.style.setProperty("--my", `${current.my.toFixed(2)}%`);

    const settling =
      Math.abs(target.rx - current.rx) +
        Math.abs(target.ry - current.ry) +
        Math.abs(target.tx - current.tx) +
        Math.abs(target.ty - current.ty) +
        Math.abs(target.s - current.s) <
      0.15;

    if (activeRef.current || !settling) {
      rafRef.current = window.requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
    }
  };

  const startLoop = () => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(tick);
  };

  const queuePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerRef.current = { x: event.clientX, y: event.clientY };
    startLoop();
  };

  return (
    <div
      ref={rootRef}
      className={`gpi ${active ? "is-active" : ""} ${className}`.trim()}
      style={{ ["--gpi-img" as "--gpi-img"]: `url(${src})` } as CSSProperties}
      onPointerEnter={(event) => {
        if (disabled) return;
        activeRef.current = true;
        setActive(true);
        queuePointer(event);
      }}
      onPointerMove={(event) => {
        if (disabled) return;
        queuePointer(event);
      }}
      onPointerLeave={() => {
        activeRef.current = false;
        setActive(false);
        pointerRef.current = null;
        targetRef.current = { rx: 0, ry: 0, tx: 0, ty: 0, sx: 0, sy: 0, s: 1, mx: 50, my: 50 };
        startLoop();
      }}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => {
        const target = event.target as HTMLElement | null;
        if (!target) return;
        if (target.tagName === "IMG" || target.tagName === "A") {
          event.preventDefault();
        }
      }}
    >
      <div className="gpi__clip">
        <div className="gpi__inner">
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className="gpi__img object-cover object-top"
            draggable={false}
            priority
            onContextMenu={(event) => event.preventDefault()}
            onDragStart={(event) => event.preventDefault()}
          />
          {!disabled ? (
            <>
              <div aria-hidden className="gpi__layer gpi__layer--a" />
              <div aria-hidden className="gpi__layer gpi__layer--b" />
              <div aria-hidden className="gpi__scan" />
            </>
          ) : null}
        </div>
      </div>
      {!disabled ? <div aria-hidden className="gpi__glow" /> : null}
    </div>
  );
}
