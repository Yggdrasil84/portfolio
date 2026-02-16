"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";

export type TrailNodeViewport = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
};

export type GooeyTrailSnapshot = {
  nodes: TrailNodeViewport[];
  activeTargetId: string | null;
  speed: number;
  running: boolean;
};

type GooeyTrailContextValue = {
  registerTarget: (id: string, getRect: () => DOMRect | null) => void;
  unregisterTarget: (id: string) => void;
  setPointer: (id: string, clientX: number, clientY: number, active: boolean) => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => GooeyTrailSnapshot;
};

type Zone = { id: string; rect: DOMRect };

const TRAIL_COUNT = 18;
const LEAVE_GRACE_MS = 120;
const SPEED_FRICTION = 0.92;
const MIN_RADIUS = 0.18;
const AUTO_TRANSITION_MS = 350;

const GooeyTrailContext = createContext<GooeyTrailContextValue | null>(null);

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const randomRange = (min: number, max: number) => min + Math.random() * (max - min);

function createNodes(x: number, y: number): TrailNodeViewport[] {
  return Array.from({ length: TRAIL_COUNT }, (_, index) => {
    const t = index / (TRAIL_COUNT - 1);
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 0,
      baseRadius: 14 - t * 10,
    };
  });
}

function collectZones(targets: Map<string, () => DOMRect | null>): Zone[] {
  const zones: Zone[] = [];
  for (const [id, getRect] of targets) {
    const rect = getRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) continue;
    zones.push({ id, rect });
  }
  return zones;
}

function pointInZone(zone: Zone, t: number) {
  const { rect } = zone;
  const ampX = clamp(rect.width * 0.46, 18, 140);
  const ampY = clamp(rect.height * 0.4, 10, 70);

  let x = rect.left + rect.width / 2 + Math.cos(t * 0.9) * ampX + Math.sin(t * 1.7) * 8;
  let y = rect.top + rect.height / 2 + Math.sin(t * 1.1) * ampY + Math.cos(t * 1.3) * 6;

  const padX = Math.max(10, rect.width * 0.08);
  const padY = Math.max(6, rect.height * 0.18);
  x = clamp(x, rect.left + padX, rect.right - padX);
  y = clamp(y, rect.top + padY, rect.bottom - padY);

  return { x, y };
}

export function GooeyTrailProvider({ children }: { children: React.ReactNode }) {
  const targetsRef = useRef(new Map<string, () => DOMRect | null>());
  const listenersRef = useRef(new Set<() => void>());
  const rafRef = useRef<number | null>(null);
  const nodesRef = useRef<TrailNodeViewport[]>(createNodes(0, 0));

  const stateRef = useRef({
    activeTargetId: null as string | null,
    isActive: false,
    lastLeaveAt: 0,
    pointerX: 0,
    pointerY: 0,
    pointerTime: 0,
    speed: 0,
    running: false,

    isMobileLike: false,
    reduceMotion: false,

    autoZoneIndex: 0,
    autoNextSwitchAt: 0,
    autoTransitionStart: 0,
    autoTransitionEnd: 0,
    autoFromX: 0,
    autoFromY: 0,
    autoTime: 0,
  });

  const notify = useCallback(() => {
    for (const listener of listenersRef.current) {
      listener();
    }
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    stateRef.current.running = false;
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    stateRef.current.running = true;

    const tick = (time: number) => {
      const state = stateRef.current;
      const zones = collectZones(targetsRef.current);
      const autoEnabled = state.isMobileLike && !state.reduceMotion && zones.length > 0;

      if (autoEnabled) {
        if (state.autoTime === 0) {
          state.autoTime = time / 1000;
          const zone = zones[0];
          const p = pointInZone(zone, state.autoTime * 2.6);
          state.pointerX = p.x;
          state.pointerY = p.y;
          state.pointerTime = time;
          state.activeTargetId = zone.id;
          state.autoZoneIndex = 0;
          state.autoNextSwitchAt = time + randomRange(1600, 2400);
          nodesRef.current = createNodes(p.x, p.y);
        } else {
          state.autoTime += Math.min(0.05, (time - state.pointerTime) / 1000);
        }

        if (time >= state.autoNextSwitchAt && state.autoTransitionStart === 0 && zones.length > 1) {
          state.autoFromX = state.pointerX;
          state.autoFromY = state.pointerY;
          state.autoTransitionStart = time;
          state.autoTransitionEnd = time + AUTO_TRANSITION_MS;
          state.autoZoneIndex = (state.autoZoneIndex + 1) % zones.length;
          state.autoNextSwitchAt = time + randomRange(1600, 2400);
        }

        const zone = zones[state.autoZoneIndex % zones.length];
        const base = pointInZone(zone, state.autoTime * 2.6);
        let nextX = base.x;
        let nextY = base.y;

        if (state.autoTransitionStart > 0) {
          const progress = clamp((time - state.autoTransitionStart) / (state.autoTransitionEnd - state.autoTransitionStart), 0, 1);
          const eased = easeOutCubic(progress);
          nextX = lerp(state.autoFromX, base.x, eased);
          nextY = lerp(state.autoFromY, base.y, eased);
          if (progress >= 1) {
            state.autoTransitionStart = 0;
            state.autoTransitionEnd = 0;
          }
        }

        const dt = Math.max(1, time - (state.pointerTime || time));
        const dx = nextX - state.pointerX;
        const dy = nextY - state.pointerY;
        const speed = (Math.sqrt(dx * dx + dy * dy) / dt) * 16;

        state.pointerX = nextX;
        state.pointerY = nextY;
        state.pointerTime = time;
        state.speed = Math.max(state.speed * 0.8, speed);
        state.activeTargetId = zone.id;
        state.isActive = true;
      }

      const activeWithGrace = state.isActive || time - state.lastLeaveAt < LEAVE_GRACE_MS;
      const targetId = state.activeTargetId;
      const targetRect = targetId ? targetsRef.current.get(targetId)?.() ?? null : null;

      const centerX = targetRect ? targetRect.left + targetRect.width / 2 : state.pointerX;
      const centerY = targetRect ? targetRect.top + targetRect.height / 2 : state.pointerY;
      const headTargetX = activeWithGrace ? state.pointerX : centerX;
      const headTargetY = activeWithGrace ? state.pointerY : centerY;

      let hasVisible = false;

      for (let index = 0; index < nodesRef.current.length; index += 1) {
        const node = nodesRef.current[index];
        const leader = index === 0 ? null : nodesRef.current[index - 1];
        const follow = Math.max(0.08, 0.28 - index * 0.01);

        const tx = leader ? leader.x : headTargetX;
        const ty = leader ? leader.y : headTargetY;
        const intensity = Math.min(1, state.speed / 36);
        const targetRadius = activeWithGrace ? node.baseRadius * (1 + intensity * (index === 0 ? 0.15 : 0.08)) : 0;

        node.vx = (tx - node.x) * follow;
        node.vy = (ty - node.y) * follow;
        node.x += node.vx;
        node.y += node.vy;
        node.radius += (targetRadius - node.radius) * (activeWithGrace ? 0.22 : 0.18);

        if (node.radius > MIN_RADIUS) {
          hasVisible = true;
        }
      }

      state.speed *= SPEED_FRICTION;
      notify();

      if (autoEnabled || activeWithGrace || hasVisible) {
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        stopLoop();
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);
  }, [notify, stopLoop]);

  useEffect(() => {
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarseMedia = window.matchMedia("(hover: none), (pointer: coarse)");

    const syncMedia = () => {
      const state = stateRef.current;
      state.reduceMotion = motionMedia.matches;
      state.isMobileLike = coarseMedia.matches;

      if (state.reduceMotion) {
        state.isActive = false;
        state.lastLeaveAt = performance.now();
        state.autoTime = 0;
        stopLoop();
      } else if (state.isMobileLike) {
        startLoop();
      }
    };

    syncMedia();
    motionMedia.addEventListener("change", syncMedia);
    coarseMedia.addEventListener("change", syncMedia);

    return () => {
      motionMedia.removeEventListener("change", syncMedia);
      coarseMedia.removeEventListener("change", syncMedia);
      stopLoop();
    };
  }, [startLoop, stopLoop]);

  const registerTarget = useCallback(
    (id: string, getRect: () => DOMRect | null) => {
      targetsRef.current.set(id, getRect);
      const state = stateRef.current;
      if (state.isMobileLike && !state.reduceMotion) {
        startLoop();
      }
    },
    [startLoop]
  );

  const unregisterTarget = useCallback((id: string) => {
    targetsRef.current.delete(id);
    const state = stateRef.current;
    if (state.activeTargetId === id) {
      state.isActive = false;
      state.lastLeaveAt = performance.now();
    }
  }, []);

  const setPointer = useCallback(
    (id: string, clientX: number, clientY: number, active: boolean) => {
      const state = stateRef.current;
      if (state.isMobileLike) return;

      const now = performance.now();
      if (active) {
        const dt = Math.max(1, now - (state.pointerTime || now));
        const dx = clientX - state.pointerX;
        const dy = clientY - state.pointerY;
        const speed = (Math.sqrt(dx * dx + dy * dy) / dt) * 16;

        state.pointerX = clientX;
        state.pointerY = clientY;
        state.pointerTime = now;
        state.speed = Math.max(state.speed * 0.8, speed);
        state.activeTargetId = id;
        state.isActive = true;

        if (!state.running) {
          nodesRef.current = createNodes(clientX, clientY);
        }
        startLoop();
      } else if (state.activeTargetId === id) {
        state.isActive = false;
        state.lastLeaveAt = now;
        startLoop();
      }
    },
    [startLoop]
  );

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getSnapshot = useCallback((): GooeyTrailSnapshot => {
    const state = stateRef.current;
    return {
      nodes: nodesRef.current,
      activeTargetId: state.activeTargetId,
      speed: state.speed,
      running: state.running,
    };
  }, []);

  const value = useMemo<GooeyTrailContextValue>(
    () => ({ registerTarget, unregisterTarget, setPointer, subscribe, getSnapshot }),
    [registerTarget, unregisterTarget, setPointer, subscribe, getSnapshot]
  );

  return <GooeyTrailContext.Provider value={value}>{children}</GooeyTrailContext.Provider>;
}

export function useGooeyTrail() {
  const context = useContext(GooeyTrailContext);
  if (!context) {
    throw new Error("useGooeyTrail must be used within GooeyTrailProvider");
  }
  return context;
}
