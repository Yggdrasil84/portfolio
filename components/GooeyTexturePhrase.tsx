"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

type GooeyTexturePhraseProps = {
  children: string;
  className?: string;
};

type Particle = {
  x: number;
  y: number;
  radius: number;
  seed: number;
  speed: number;
};

const PARTICLE_COUNT = 24;

export default function GooeyTexturePhrase({ children, className = "" }: GooeyTexturePhraseProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const targetRef = useRef({ x: 0, y: 0, active: false });
  const textOffsetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [, setFrame] = useState(0);
  const [shouldRenderOverlay, setShouldRenderOverlay] = useState(true);
  const [textOffset, setTextOffset] = useState({ x: 0, y: 0 });
  const [textStyle, setTextStyle] = useState({
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: "700",
    letterSpacing: "normal",
  });

  const idBase = useId().replaceAll(":", "");
  const maskId = `gooey-mask-${idBase}`;
  const filterId = `gooey-filter-${idBase}`;
  const textId = `gooey-text-${idBase}`;

  const initializeParticles = (width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
      x: centerX,
      y: centerY,
      radius: 0,
      seed: index * 1.37,
      speed: 0.08 + ((index % 6) * 0.015),
    }));
    targetRef.current = { x: centerX, y: centerY, active: false };
  };

  const stopLoop = () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const animate = (time: number) => {
    const { width, height } = size;
    if (!shouldRenderOverlay || width === 0 || height === 0) {
      stopLoop();
      return;
    }

    const centerX = width / 2;
    const centerY = height / 2;
    let hasVisibleParticle = false;

    for (const particle of particlesRef.current) {
      const pulse = Math.sin(time * 0.004 + particle.seed);
      const jitterX = Math.sin(time * 0.003 + particle.seed * 1.2) * 0.9;
      const jitterY = Math.cos(time * 0.0035 + particle.seed * 1.3) * 0.9;

      const targetX = targetRef.current.active ? targetRef.current.x + jitterX : centerX + pulse * 4;
      const targetY = targetRef.current.active ? targetRef.current.y + jitterY : centerY + pulse * 2;
      const targetRadius = targetRef.current.active ? 12 + (pulse + 1) * 3.6 : 0;

      particle.x += (targetX - particle.x) * particle.speed;
      particle.y += (targetY - particle.y) * particle.speed;
      particle.radius += (targetRadius - particle.radius) * 0.16;

      if (particle.radius > 0.2) {
        hasVisibleParticle = true;
      }
    }

    setFrame((value) => value + 1);

    if (targetRef.current.active || hasVisibleParticle) {
      rafRef.current = window.requestAnimationFrame(animate);
    } else {
      stopLoop();
    }
  };

  const startLoop = () => {
    if (!shouldRenderOverlay || rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(animate);
  };

  const setPointerTarget = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    targetRef.current.x = event.clientX - rect.left;
    targetRef.current.y = event.clientY - rect.top;
  };

  useEffect(() => {
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarseMedia = window.matchMedia("(hover: none), (pointer: coarse)");

    const syncMedia = () => {
      const disableOverlay = motionMedia.matches || coarseMedia.matches;
      setShouldRenderOverlay(!disableOverlay);
      if (disableOverlay) {
        targetRef.current.active = false;
        stopLoop();
      }
    };

    syncMedia();
    motionMedia.addEventListener("change", syncMedia);
    coarseMedia.addEventListener("change", syncMedia);

    return () => {
      motionMedia.removeEventListener("change", syncMedia);
      coarseMedia.removeEventListener("change", syncMedia);
    };
  }, []);

  useLayoutEffect(() => {
    if (size.width === 0 || size.height === 0 || !shouldRenderOverlay) return;

    const measureAndAlign = () => {
      if (!textRef.current) return;
      try {
        const bbox = textRef.current.getBBox();
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        const dx = size.width / 2 - cx;
        const dy = size.height / 2 - cy;

        const prev = textOffsetRef.current;
        if (Math.abs(dx - prev.x) > 0.25 || Math.abs(dy - prev.y) > 0.25) {
          textOffsetRef.current = { x: dx, y: dy };
          setTextOffset({ x: dx, y: dy });
        }
      } catch {
        // Ignore transient measurement errors while SVG/text is initializing.
      }
    };

    let raf1 = 0;
    let raf2 = 0;
    let disposed = false;

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (!disposed) {
          measureAndAlign();
        }
      });
    });

    if (typeof document !== "undefined" && "fonts" in document) {
      void document.fonts.ready.then(() => {
        window.requestAnimationFrame(() => {
          if (!disposed) {
            measureAndAlign();
          }
        });
      });
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [
    size.width,
    size.height,
    textStyle.fontFamily,
    textStyle.fontSize,
    textStyle.fontWeight,
    textStyle.letterSpacing,
    children,
    shouldRenderOverlay,
  ]);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const node = wrapperRef.current;
    const observer = new ResizeObserver(() => {
      const rect = node.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      setSize({ width, height });
      initializeParticles(width, height);

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
      stopLoop();
    };
  }, []);

  return (
    <span
      ref={wrapperRef}
      className={`gooey-phrase ${className}`.trim()}
      onPointerEnter={(event) => {
        if (!shouldRenderOverlay) return;
        targetRef.current.active = true;
        setPointerTarget(event);
        startLoop();
      }}
      onPointerMove={(event) => {
        if (!shouldRenderOverlay) return;
        setPointerTarget(event);
      }}
      onPointerLeave={() => {
        targetRef.current.active = false;
      }}
    >
      <span className="gooey-phrase__base">{children}</span>
      {shouldRenderOverlay && size.width > 0 && size.height > 0 ? (
        <svg
          className="gooey-phrase__svg"
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
          aria-hidden
        >
          <defs>
            <text
              id={textId}
              ref={textRef}
              x={size.width / 2}
              y={size.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`translate(${textOffset.x} ${textOffset.y})`}
              style={{
                fontFamily: textStyle.fontFamily,
                fontSize: textStyle.fontSize,
                fontWeight: textStyle.fontWeight,
                letterSpacing: textStyle.letterSpacing,
              }}
            >
              {children}
            </text>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={size.width} height={size.height}>
              <rect x="0" y="0" width={size.width} height={size.height} fill="black" />
              <use href={`#${textId}`} fill="white" />
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

              <feFlood floodColor="rgb(125,87,69)" floodOpacity="0.55" result="tint" />
              <feComposite in="tint" in2="goo" operator="in" result="coloredGoo" />

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
              <feComposite in="texture" in2="goo" operator="in" result="texturedGoo" />
              <feBlend in="coloredGoo" in2="texturedGoo" mode="multiply" />
            </filter>
          </defs>

          <g mask={`url(#${maskId})`} filter={`url(#${filterId})`}>
            <rect x="0" y="0" width={size.width} height={size.height} fill="transparent" />
            {particlesRef.current.map((particle, index) => (
              <circle key={`${idBase}-${index}`} cx={particle.x} cy={particle.y} r={Math.max(0, particle.radius)} fill="white" />
            ))}
          </g>
        </svg>
      ) : null}
    </span>
  );
}
