import { animate } from "animejs";
import {
  prefersReducedMotion,
  pulseElement,
  revealSequence,
} from "../regent/js/regent";

type MotionHandle = {
  timers: number[];
  cleanup: Array<() => void>;
} | null;

type HomeEntryCtaElements = {
  root: HTMLElement;
  visual: HTMLElement | null;
  logo: HTMLElement | null;
  arrow: HTMLElement | null;
};

export function revertAnimation(handle: MotionHandle | undefined): void {
  handle?.timers.forEach((timer) => window.clearTimeout(timer));
  handle?.cleanup.forEach((cleanup) => cleanup());
}

function queuePulses(root: ParentNode, selector: string, startDelay = 120, step = 90): number[] {
  if (prefersReducedMotion()) return [];

  return Array.from(root.querySelectorAll(selector)).map((element, index) =>
    window.setTimeout(() => pulseElement(element), startDelay + index * step)
  );
}

function mountCardDepth(root: ParentNode): Array<() => void> {
  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-platform-card]"));
  if (cards.length === 0) return [];

  return cards.map((card) => {
    const scene = card.querySelector<HTMLElement>(".pp-card-surface .rg-surface-scene");
    let bounds = card.getBoundingClientRect();
    let pointerX = 0;
    let pointerY = 0;
    let rafToken: number | null = null;

    const animateCard = (
      tiltX: number,
      tiltY: number,
      lift: number,
      driftX: number,
      driftY: number,
      sheenX: number,
      sheenY: number,
      duration = 320,
    ) => {
      animate(card, {
        "--pp-card-tilt-x": `${tiltX}deg`,
        "--pp-card-tilt-y": `${tiltY}deg`,
        "--pp-card-lift": `${lift}px`,
        "--pp-card-sheen-x": `${sheenX}%`,
        "--pp-card-sheen-y": `${sheenY}%`,
        duration,
        ease: "outQuart",
      });

      if (!scene) return;

      animate(scene, {
        "--pp-card-scene-drift-x": `${driftX}px`,
        "--pp-card-scene-drift-y": `${driftY}px`,
        duration,
        ease: "outQuart",
      });
    };

    const setCardDepth = (
      tiltX: number,
      tiltY: number,
      lift: number,
      driftX: number,
      driftY: number,
      sheenX: number,
      sheenY: number,
    ) => {
      card.style.setProperty("--pp-card-tilt-x", `${tiltX}deg`);
      card.style.setProperty("--pp-card-tilt-y", `${tiltY}deg`);
      card.style.setProperty("--pp-card-lift", `${lift}px`);
      card.style.setProperty("--pp-card-sheen-x", `${sheenX}%`);
      card.style.setProperty("--pp-card-sheen-y", `${sheenY}%`);
      scene?.style.setProperty("--pp-card-scene-drift-x", `${driftX}px`);
      scene?.style.setProperty("--pp-card-scene-drift-y", `${driftY}px`);
    };

    const refreshBounds = () => {
      bounds = card.getBoundingClientRect();
    };

    const flushPointerDepth = () => {
      rafToken = null;

      const offsetX = pointerX / Math.max(bounds.width, 1) - 0.5;
      const offsetY = pointerY / Math.max(bounds.height, 1) - 0.5;

      setCardDepth(
        offsetY * -7.5,
        offsetX * 9.5,
        -8,
        offsetX * 10,
        offsetY * 8,
        50 + offsetX * 34,
        26 + offsetY * 22,
      );
    };

    const resetCard = () => animateCard(0, 0, 0, 0, 0, 50, 24, 360);

    const onPointerMove = (event: PointerEvent) => {
      if (prefersReducedMotion()) return;

      pointerX = event.clientX - bounds.left;
      pointerY = event.clientY - bounds.top;

      if (rafToken !== null) return;
      rafToken = window.requestAnimationFrame(flushPointerDepth);
    };

    const onPointerEnter = () => refreshBounds();
    const onPointerLeave = () => {
      if (rafToken !== null) {
        window.cancelAnimationFrame(rafToken);
        rafToken = null;
      }

      resetCard();
    };
    const onFocus = () => animateCard(-3.5, 4, -6, 3, -2, 62, 18, 280);
    const onBlur = () => resetCard();
    const onWindowResize = () => refreshBounds();

    if (!prefersReducedMotion() && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      card.addEventListener("pointerenter", onPointerEnter);
      card.addEventListener("pointermove", onPointerMove);
      card.addEventListener("pointerleave", onPointerLeave);
      window.addEventListener("resize", onWindowResize);
    }

    card.addEventListener("focusin", onFocus);
    card.addEventListener("focusout", onBlur);

    return () => {
      if (rafToken !== null) window.cancelAnimationFrame(rafToken);
      card.removeEventListener("pointerenter", onPointerEnter);
      card.removeEventListener("pointermove", onPointerMove);
      card.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onWindowResize);
      card.removeEventListener("focusin", onFocus);
      card.removeEventListener("focusout", onBlur);
      resetCard();
    };
  });
}

function mountHomeEntryCtas(root: ParentNode): Array<() => void> {
  if (prefersReducedMotion()) return [];

  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!supportsHover) return [];

  const ctas = Array.from(
    root.querySelectorAll<HTMLElement>("[data-home-cta-root]"),
  ).map<HomeEntryCtaElements>((entry) => ({
    root: entry,
    visual: entry.querySelector<HTMLElement>("[data-home-cta-visual]"),
    logo: entry.querySelector<HTMLElement>("[data-home-cta-logo]"),
    arrow: entry.querySelector<HTMLElement>("[data-home-cta-arrow]"),
  }));

  return ctas.map(({ root: cta, visual, logo, arrow }) => {
    if (!visual) return () => undefined;

    const motion = { progress: 0 };
    let animation: ReturnType<typeof animate> | undefined;
    let expandedWidth = visual.getBoundingClientRect().width;
    let collapsedWidth = visual.getBoundingClientRect().height;
    let expandedGap = 0;
    let expandedPadStart = 0;
    let expandedPadEnd = 0;
    let logoOffset = 0;
    let lockedCollapsed = false;

    const resetInlineState = () => {
      visual.style.width = "";
      visual.style.gap = "";
      visual.style.paddingLeft = "";
      visual.style.paddingRight = "";

      if (logo) {
        logo.style.transform = "translateX(0px)";
      }

      if (arrow) {
        arrow.style.opacity = "";
        arrow.style.transform = "";
      }
    };

    const applyProgress = () => {
      const progress = motion.progress;
      const width = expandedWidth + (collapsedWidth - expandedWidth) * progress;
      const gap = expandedGap * (1 - progress);
      const padEnd = expandedPadEnd + (expandedPadStart - expandedPadEnd) * progress;

      visual.style.width = `${width}px`;
      visual.style.gap = `${gap}px`;
      visual.style.paddingLeft = `${expandedPadStart}px`;
      visual.style.paddingRight = `${padEnd}px`;

      if (logo) {
        logo.style.transform = `translateX(${logoOffset * progress}px)`;
      }

      if (arrow) {
        arrow.style.opacity = "";
        arrow.style.transform = "";
      }
    };

    const measureState = () => {
      resetInlineState();

      const visualRect = visual.getBoundingClientRect();
      const visualStyles = window.getComputedStyle(visual);

      expandedWidth = visualRect.width;
      expandedGap = Number.parseFloat(visualStyles.columnGap || visualStyles.gap) || 0;
      expandedPadStart = Number.parseFloat(visualStyles.paddingLeft) || 0;
      expandedPadEnd = Number.parseFloat(visualStyles.paddingRight) || 0;
      collapsedWidth = Math.round(visualRect.height);
      resetInlineState();

      visual.style.width = `${collapsedWidth}px`;
      visual.style.gap = "0px";
      visual.style.paddingLeft = `${expandedPadStart}px`;
      visual.style.paddingRight = `${expandedPadStart}px`;

      const collapsedLogoRect = logo?.getBoundingClientRect();

      if (collapsedLogoRect) {
        const collapsedLogoTargetLeft = visual.getBoundingClientRect().left + expandedPadStart;
        logoOffset =
          collapsedLogoTargetLeft - collapsedLogoRect.left;
      } else {
        logoOffset = 0;
      }

      resetInlineState();
    };

    const stopAnimation = () => {
      animation?.cancel();
      animation = undefined;
    };

    const animateTo = (progress: number, duration: number, ease: string) => {
      stopAnimation();

      animation = animate(motion, {
        progress,
        duration,
        ease,
        onUpdate: applyProgress,
        onComplete: applyProgress,
      });
    };

    const onPointerEnter = () => animateTo(1, 500, "inOutQuart");
    const onPointerLeave = () => {
      if (lockedCollapsed) return;
      animateTo(0, 500, "inOutQuart");
    };
    const onFocus = () => animateTo(1, 500, "inOutQuart");
    const onBlur = () => {
      if (lockedCollapsed) return;
      animateTo(0, 500, "inOutQuart");
    };
    const onClick = () => {
      lockedCollapsed = true;
      animateTo(1, 320, "outQuart");
    };
    const onResize = () => {
      const currentProgress = motion.progress;
      stopAnimation();
      measureState();
      motion.progress = lockedCollapsed || currentProgress >= 0.5 ? 1 : 0;
      applyProgress();
    };

    measureState();
    motion.progress = 0;
    applyProgress();

    cta.addEventListener("pointerenter", onPointerEnter);
    cta.addEventListener("pointerleave", onPointerLeave);
    cta.addEventListener("focusin", onFocus);
    cta.addEventListener("focusout", onBlur);
    cta.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);

    return () => {
      stopAnimation();
      cta.removeEventListener("pointerenter", onPointerEnter);
      cta.removeEventListener("pointerleave", onPointerLeave);
      cta.removeEventListener("focusin", onFocus);
      cta.removeEventListener("focusout", onBlur);
      cta.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      resetInlineState();
    };
  });
}

export function mountHomeReveal(root: HTMLElement): MotionHandle {
  revealSequence(root, "[data-home-header]", {
    translateY: 16,
    duration: 460,
    delay: 40,
  });

  revealSequence(root, "[data-platform-card]", {
    translateY: 28,
    duration: 620,
    delay: 80,
  });

  const timers = [
    ...queuePulses(root, "[data-platform-card] .rg-surface-scene", 180, 120),
    ...queuePulses(root, "[data-platform-card] .rg-sigil-marker", 320, 70),
  ];

  return { timers, cleanup: [...mountCardDepth(root), ...mountHomeEntryCtas(root)] };
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

  return { timers, cleanup: [] };
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

  return { timers, cleanup: [] };
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

  return { timers, cleanup: [] };
}
