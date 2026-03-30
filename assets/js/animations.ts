import {
  prefersReducedMotion,
  pulseElement,
  revealSequence,
} from "../../../../packages/regent_ui/assets/js/regent";

type MotionHandle = {
  timers: number[];
} | null;

export function revertAnimation(handle: MotionHandle | undefined): void {
  handle?.timers.forEach((timer) => window.clearTimeout(timer));
}

function queuePulses(root: ParentNode, selector: string, startDelay = 120, step = 90): number[] {
  if (prefersReducedMotion()) return [];

  return Array.from(root.querySelectorAll(selector)).map((element, index) =>
    window.setTimeout(() => pulseElement(element), startDelay + index * step)
  );
}

export function mountHomeReveal(root: HTMLElement): MotionHandle {
  revealSequence(root, "[data-platform-card]", {
    translateY: 28,
    duration: 620,
    delay: 110,
  });

  const timers = [
    ...queuePulses(root, "[data-platform-card] .rg-surface-scene", 180, 120),
    ...queuePulses(root, "[data-platform-card] .rg-sigil-marker", 320, 70),
  ];

  return { timers };
}

export function mountBridgeReveal(root: HTMLElement): MotionHandle {
  revealSequence(root, "[data-bridge-block]", {
    translateY: 18,
    duration: 520,
    delay: 70,
  });

  const timers = [
    ...queuePulses(root, ".pp-route-surface .rg-surface-scene", 180, 120),
    ...queuePulses(root, ".pp-route-surface .rg-sigil-marker.is-focused, .pp-route-surface .rg-sigil-marker", 320, 90),
  ];

  return { timers };
}

export function mountDashboardReveal(root: HTMLElement): MotionHandle {
  revealSequence(root, "[data-dashboard-block]", {
    translateY: 16,
    duration: 480,
    delay: 60,
  });

  const timers = [
    ...queuePulses(root, ".pp-dashboard-header-surface .rg-surface-scene", 150, 120),
    ...queuePulses(root, ".pp-dashboard-header-surface .rg-sigil-marker", 280, 90),
  ];

  return { timers };
}

export function mountDemoReveal(root: HTMLElement): MotionHandle {
  revealSequence(root, "[data-demo-block]", {
    translateY: 20,
    duration: 560,
    delay: 80,
  });

  revealSequence(root, "[data-demo-card]", {
    translateY: 18,
    duration: 520,
    delay: 70,
  });

  const timers = [
    ...queuePulses(root, "[data-demo-card] .rg-surface-scene", 180, 90),
    ...queuePulses(root, "[data-demo-card] .rg-sigil-marker", 280, 60),
  ];

  return { timers };
}
