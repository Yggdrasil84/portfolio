"use client";

import { createContext, useCallback, useContext, useMemo, useRef } from "react";

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

const TRAIL_COUNT = 18;
const LEAVE_GRACE_MS = 120;
const SPEED_FRICTION = 0.92;
const MIN_RADIUS = 0.18;

const GooeyTrailContext = createContext<GooeyTrailContextValue | null>(null);

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

      if (activeWithGrace || hasVisible) {
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        stopLoop();
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);
  }, [notify, stopLoop]);

  const registerTarget = useCallback((id: string, getRect: () => DOMRect | null) => {
    targetsRef.current.set(id, getRect);
  }, []);

  const unregisterTarget = useCallback((id: string) => {
    targetsRef.current.delete(id);
    if (stateRef.current.activeTargetId === id) {
      stateRef.current.isActive = false;
      stateRef.current.lastLeaveAt = performance.now();
    }
  }, []);

  const setPointer = useCallback(
    (id: string, clientX: number, clientY: number, active: boolean) => {
      const state = stateRef.current;
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
