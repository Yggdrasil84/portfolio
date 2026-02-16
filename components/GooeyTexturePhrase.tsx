"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useGooeyTrail } from "@/components/GooeyTrailProvider";

type GooeyTexturePhraseProps = {
  children: string;
  className?: string;
  yNudge?: number;
};

let autoPilotOwnerId: string | null = null;

export default function GooeyTexturePhrase({ children, className = "", yNudge = 0 }: GooeyTexturePhraseProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const autoRef = useRef({ t: 0, raf: 0 as number | 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [shouldRenderOverlay, setShouldRenderOverlay] = useState(true);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [autoPilot, setAutoPilot] = useState(false);
  const [textStyle, setTextStyle] = useState({
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: "700",
    letterSpacing: "normal",
  });
  const [, forceRender] = useState(0);

  const { registerTarget, unregisterTarget, setPointer, subscribe, getSnapshot } = useGooeyTrail();
  const snapshot = getSnapshot();

  const idBase = useId().replaceAll(":", "");
  const targetId = `gooey-target-${idBase}`;
  const maskId = `gooey-mask-${idBase}`;
  const filterId = `gooey-filter-${idBase}`;

  useEffect(() => subscribe(() => forceRender((v) => v + 1)), [subscribe]);

  useEffect(() => {
    registerTarget(targetId, () => wrapperRef.current?.getBoundingClientRect() ?? null);
    return () => unregisterTarget(targetId);
  }, [registerTarget, targetId, unregisterTarget]);

  useEffect(() => {
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarseMedia = window.matchMedia("(hover: none), (pointer: coarse)");

    const syncMedia = () => {
      setReduceMotion(motionMedia.matches);
      setCoarsePointer(coarseMedia.matches);
      setShouldRenderOverlay(!motionMedia.matches);
    };

    syncMedia();
    motionMedia.addEventListener("change", syncMedia);
    coarseMedia.addEventListener("change", syncMedia);

    return () => {
      motionMedia.removeEventListener("change", syncMedia);
      coarseMedia.removeEventListener("change", syncMedia);
    };
  }, []);

  useEffect(() => {
    if (!wrapperRef.current || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setAutoPilot(coarsePointer && !reduceMotion && isVisible);
  }, [coarsePointer, reduceMotion, isVisible]);

  useEffect(() => {
    if (!autoPilot || !shouldRenderOverlay || size.width <= 0 || size.height <= 0 || !wrapperRef.current) {
      if (autoRef.current.raf) {
        window.cancelAnimationFrame(autoRef.current.raf);
        autoRef.current.raf = 0;
      }
      autoRef.current.t = 0;
      if (autoPilotOwnerId === targetId) {
        autoPilotOwnerId = null;
      }
      return;
    }

    if (autoPilotOwnerId && autoPilotOwnerId !== targetId) {
      return;
    }
    autoPilotOwnerId = targetId;

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    const step = (now: number) => {
      if (!wrapperRef.current || autoPilotOwnerId !== targetId) return;

      const prevT = autoRef.current.t || now;
      const dt = Math.min(0.05, (now - prevT) / 1000);
      autoRef.current.t = prevT + dt;
      const t = autoRef.current.t * 2.6;

      const centerX = size.width / 2;
      const centerY = size.height / 2;
      const ampX = clamp(size.width * 0.18, 10, 28);
      const ampY = clamp(size.height * 0.22, 8, 24);

      const localX = centerX + Math.cos(t * 0.9) * ampX + Math.sin(t * 1.7) * 6;
      const localY = centerY + Math.sin(t * 1.1) * ampY + Math.cos(t * 1.3) * 4;
      const rect = wrapperRef.current.getBoundingClientRect();

      setPointer(targetId, rect.left + localX, rect.top + localY, true);
      autoRef.current.raf = window.requestAnimationFrame(step);
    };

    autoRef.current.raf = window.requestAnimationFrame(step);

    return () => {
      if (autoRef.current.raf) {
        window.cancelAnimationFrame(autoRef.current.raf);
        autoRef.current.raf = 0;
      }
      if (autoPilotOwnerId === targetId) {
        autoPilotOwnerId = null;
        if (wrapperRef.current) {
          const rect = wrapperRef.current.getBoundingClientRect();
          setPointer(targetId, rect.left + size.width / 2, rect.top + size.height / 2, false);
        }
      }
    };
  }, [autoPilot, setPointer, shouldRenderOverlay, size.height, size.width, targetId]);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const node = wrapperRef.current;
    const observer = new ResizeObserver(() => {
      const rect = node.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      setSize({ width, height });

      const computed = window.getComputedStyle(node);
      setTextStyle({
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        letterSpacing: computed.letterSpacing,
      });
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const rect = wrapperRef.current?.getBoundingClientRect() ?? null;
  const localNodes =
    rect && shouldRenderOverlay
      ? snapshot.nodes
          .map((node) => ({
            x: node.x - rect.left,
            y: node.y - rect.top,
            vx: node.vx,
            vy: node.vy,
            radius: node.radius,
          }))
          .filter((node) => node.x >= -40 && node.x <= size.width + 40 && node.y >= -40 && node.y <= size.height + 40)
      : [];

  const showOverlay = shouldRenderOverlay && size.width > 0 && size.height > 0 && (snapshot.running || localNodes.length > 0);

  const setCursorPosition = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    wrapperRef.current.style.setProperty("--gcx", `${event.clientX - rect.left}px`);
    wrapperRef.current.style.setProperty("--gcy", `${event.clientY - rect.top}px`);
  };

  return (
    <span
      ref={wrapperRef}
      className={`gooey-phrase ${className}`.trim()}
      onPointerEnter={(event) => {
        if (!shouldRenderOverlay || autoPilot) return;
        setCursorPosition(event);
        setPointer(targetId, event.clientX, event.clientY, true);
      }}
      onPointerMove={(event) => {
        if (!shouldRenderOverlay || autoPilot) return;
        setCursorPosition(event);
        setPointer(targetId, event.clientX, event.clientY, true);
      }}
      onPointerLeave={(event) => {
        if (!shouldRenderOverlay || autoPilot) return;
        if (wrapperRef.current) {
          wrapperRef.current.style.setProperty("--gcx", "-9999px");
          wrapperRef.current.style.setProperty("--gcy", "-9999px");
        }
        setPointer(targetId, event.clientX, event.clientY, false);
      }}
    >
      <span className="gooey-phrase__base">{children}</span>
      <span aria-hidden className="gooey-phrase__cursor" />
      {showOverlay ? (
        <svg className="gooey-phrase__svg" width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={size.width} height={size.height}>
              <rect x="0" y="0" width={size.width} height={size.height} fill="black" />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                dy={`${yNudge}px`}
                fill="white"
                style={{
                  fontFamily: textStyle.fontFamily,
                  fontSize: textStyle.fontSize,
                  fontWeight: textStyle.fontWeight,
                  letterSpacing: textStyle.letterSpacing,
                }}
              >
                {children}
              </text>
            </mask>
            <filter
              id={filterId}
              filterUnits="userSpaceOnUse"
              primitiveUnits="userSpaceOnUse"
              x={-size.width * 0.5}
              y={-size.height * 0.8}
              width={size.width * 2}
              height={size.height * 2.6}
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 50 -10"
                result="goo"
              />
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2" result="noise">
                <animate attributeName="baseFrequency" dur="6s" values="0.7;0.95;0.7" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap
                in="goo"
                in2="noise"
                scale="10"
                xChannelSelector="R"
                yChannelSelector="G"
                result="gooDisplaced"
              />

              <feFlood floodColor="rgb(125,87,69)" floodOpacity="0.55" result="tint" />
              <feComposite in="tint" in2="gooDisplaced" operator="in" result="coloredGoo" />

              <feImage
                href="/textures/brushed.png"
                xlinkHref="/textures/brushed.png"
                x="0"
                y="0"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                result="texture"
              />
              <feComposite in="texture" in2="gooDisplaced" operator="in" result="texturedGoo" />
              <feBlend in="coloredGoo" in2="texturedGoo" mode="multiply" />
            </filter>
          </defs>

          <g mask={`url(#${maskId})`} filter={`url(#${filterId})`}>
            <rect x="0" y="0" width={size.width} height={size.height} fill="transparent" />
            {localNodes.map((node, index) => {
              const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
              const stretch = Math.min(0.85, speed / 18);
              const angle = speed > 0.04 ? (Math.atan2(node.vy, node.vx) * 180) / Math.PI : 0;
              const rx = Math.max(0, node.radius * (1 + stretch));
              const ry = Math.max(0, node.radius * (1 - stretch * 0.6));

              return (
                <ellipse
                  key={`${targetId}-${index}`}
                  cx={node.x}
                  cy={node.y}
                  rx={rx}
                  ry={ry}
                  transform={`rotate(${angle} ${node.x} ${node.y})`}
                  fill="white"
                />
              );
            })}
          </g>
        </svg>
      ) : null}
    </span>
  );
}
