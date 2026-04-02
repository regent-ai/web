import {
  animate,
  createDrawable,
  createTimeline,
  stagger,
} from "../vendor/anime.esm.js"

export interface RevealOptions {
  selector?: string
  translateY?: number
  duration?: number
  delay?: number
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function revealSequence(
  root: ParentNode,
  selector: string,
  options: RevealOptions = {},
): void {
  const targets = Array.from(root.querySelectorAll<HTMLElement>(selector))
  if (targets.length === 0) return

  if (prefersReducedMotion()) {
    targets.forEach((target) => {
      target.style.opacity = "1"
      target.style.transform = "none"
    })
    return
  }

  const timeline = createTimeline({
    defaults: {
      duration: options.duration ?? 580,
      ease: "outExpo",
    },
  })

  timeline.add(targets, {
    opacity: [0, 1],
    translateY: [options.translateY ?? 20, 0],
    delay: stagger(options.delay ?? 70),
  })
}

export function pulseElement(target: Element, duration = 320): void {
  if (!(target instanceof HTMLElement || target instanceof SVGElement)) return

  if (prefersReducedMotion()) {
    target.classList.add("is-updated")
    window.setTimeout(() => target.classList.remove("is-updated"), 120)
    return
  }

  animate(target, {
    scale: [0.985, 1],
    translateY: [2, 0],
    duration,
    ease: "outExpo",
  })
}

export function traceSvgPaths(
  root: ParentNode,
  selector: string,
  options: { duration?: number; delay?: number } = {},
): void {
  const paths = Array.from(root.querySelectorAll<SVGPathElement>(selector))
  if (paths.length === 0 || prefersReducedMotion()) return

  paths.forEach((path) => {
    animate(createDrawable(path), {
      draw: ["0 0", "0 1"],
      duration: options.duration ?? 420,
      delay: stagger(options.delay ?? 40),
      ease: "outExpo",
    })
  })
}
