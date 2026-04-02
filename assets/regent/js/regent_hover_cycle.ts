import { animate, stagger } from "../vendor/anime.esm.js"
import type { HoverCycleMode, HoverCycleSpec } from "./regent_scene_protocol"

type AnimationHandle = ReturnType<typeof animate>

export interface NormalizedHoverCycleSpec {
  key: string
  group: string
  durationMs: number
  loopDelayMs: number
  staggerMs: number
  easing: string
  mode: HoverCycleMode
  fill?: string
  stroke?: string
  opacity: number
  scale: number
  translate: number
  shadow?: string
  includeMarker: boolean
  includePolygons: boolean
}

interface ActiveCycle {
  animations: AnimationHandle[]
  targets: SVGElement[]
}

const HOVER_CYCLE_DEFAULTS: Omit<NormalizedHoverCycleSpec, "key" | "group"> = {
  durationMs: 1000,
  loopDelayMs: 0,
  staggerMs: 40,
  easing: "inOutSine",
  mode: "collapse",
  fill: undefined,
  stroke: undefined,
  opacity: 0.2,
  scale: 0.72,
  translate: 12,
  shadow: undefined,
  includeMarker: true,
  includePolygons: true,
}

function encodedHoverCycleKey(group: string): string {
  return encodeURIComponent(group.trim().toLowerCase())
}

function minOpacity(spec: NormalizedHoverCycleSpec): number {
  return Math.min(Math.max(spec.opacity, 0.05), 1)
}

function polygonVector(target: SVGElement, spec: NormalizedHoverCycleSpec): { x: number; y: number } {
  if (spec.mode === "collapse") return { x: 0, y: 0 }
  if (spec.mode === "phase") return { x: 0, y: -Math.max(2, spec.translate * 0.2) }

  switch (target.dataset.face) {
    case "top":
      return { x: 0, y: -spec.translate }
    case "left":
      return { x: -Math.max(2, spec.translate * 0.75), y: Math.max(1, spec.translate * 0.25) }
    case "right":
      return { x: Math.max(2, spec.translate * 0.75), y: Math.max(1, spec.translate * 0.25) }
    case "front":
      return { x: 0, y: spec.translate * 0.45 }
    case "back":
      return { x: 0, y: -spec.translate * 0.25 }
    default:
      return { x: 0, y: -spec.translate * 0.5 }
  }
}

function markerShift(spec: NormalizedHoverCycleSpec): number {
  switch (spec.mode) {
    case "explode":
      return -Math.max(3, spec.translate * 0.45)
    case "phase":
      return -Math.max(2, spec.translate * 0.25)
    default:
      return -Math.max(2, spec.translate * 0.18)
  }
}

function polygonScale(spec: NormalizedHoverCycleSpec): number {
  switch (spec.mode) {
    case "explode":
      return Math.max(spec.scale, 1.08)
    case "phase":
      return Math.max(spec.scale, 0.88)
    default:
      return Math.min(spec.scale, 0.95)
  }
}

function markerScale(spec: NormalizedHoverCycleSpec): number {
  switch (spec.mode) {
    case "explode":
      return 1.1
    case "phase":
      return 0.92
    default:
      return Math.max(spec.scale, 0.8)
  }
}

function destroyDuration(spec: NormalizedHoverCycleSpec): number {
  return Math.max(140, Math.round(spec.durationMs * 0.46))
}

function createDuration(spec: NormalizedHoverCycleSpec): number {
  return Math.max(180, spec.durationMs - destroyDuration(spec))
}

function basePaint(target: SVGElement, attr: "fill" | "stroke"): string | undefined {
  const key = attr === "fill" ? "regentBaseFill" : "regentBaseStroke"
  if (!target.dataset[key]) {
    const value = target.getAttribute(attr) ?? ""
    target.dataset[key] = value
  }

  const paint = target.dataset[key]
  return paint && paint.length > 0 ? paint : undefined
}

function prepareTarget(target: SVGElement): void {
  target.classList.add("rg-hover-cycle-target", "is-hover-cycling")
}

function resetTarget(target: SVGElement): void {
  target.classList.remove("is-hover-cycling")
  target.style.removeProperty("transform")
  target.style.removeProperty("opacity")
  target.style.removeProperty("filter")
  target.style.removeProperty("fill")
  target.style.removeProperty("stroke")
}

function polygonAnimation(targets: SVGElement[], spec: NormalizedHoverCycleSpec): AnimationHandle {
  return animate(targets, {
    loop: true,
    delay: stagger(spec.staggerMs),
    keyframes: [
      {
        opacity: minOpacity(spec),
        scale: polygonScale(spec),
        translateX: (target: SVGElement) => polygonVector(target, spec).x,
        translateY: (target: SVGElement) => polygonVector(target, spec).y,
        fill: spec.fill,
        stroke: spec.stroke,
        filter: spec.shadow,
        duration: destroyDuration(spec),
        ease: spec.easing,
      },
      {
        opacity: 1,
        scale: 1,
        translateX: 0,
        translateY: 0,
        fill: (target: SVGElement) => basePaint(target, "fill"),
        stroke: (target: SVGElement) => basePaint(target, "stroke"),
        filter: "none",
        duration: createDuration(spec),
        ease: spec.easing,
        delay: spec.loopDelayMs,
      },
    ],
  })
}

function markerAnimation(targets: SVGElement[], spec: NormalizedHoverCycleSpec): AnimationHandle {
  return animate(targets, {
    loop: true,
    delay: stagger(Math.max(18, Math.round(spec.staggerMs * 0.75))),
    keyframes: [
      {
        opacity: Math.min(Math.max(minOpacity(spec) + 0.16, 0.24), 1),
        scale: markerScale(spec),
        translateY: markerShift(spec),
        filter: spec.shadow ?? "drop-shadow(0 0 12px rgba(168, 220, 255, 0.34))",
        duration: destroyDuration(spec),
        ease: spec.easing,
      },
      {
        opacity: 1,
        scale: 1,
        translateY: 0,
        filter: "none",
        duration: createDuration(spec),
        ease: spec.easing,
        delay: spec.loopDelayMs,
      },
    ],
  })
}

export function HoverCycle(spec: HoverCycleSpec = {}): HoverCycleSpec {
  return spec
}

export function normalizeHoverCycleSpec(
  spec: HoverCycleSpec | boolean | null | undefined,
  fallbackGroup: string,
): NormalizedHoverCycleSpec | null {
  if (spec === false || spec === null || spec === undefined) return null

  const raw = spec === true ? {} : spec
  if (raw.enabled === false) return null

  const group = (raw.group ?? fallbackGroup).trim() || fallbackGroup

  return {
    key: encodedHoverCycleKey(group),
    group,
    durationMs: raw.durationMs ?? HOVER_CYCLE_DEFAULTS.durationMs,
    loopDelayMs: raw.loopDelayMs ?? HOVER_CYCLE_DEFAULTS.loopDelayMs,
    staggerMs: raw.staggerMs ?? HOVER_CYCLE_DEFAULTS.staggerMs,
    easing: raw.easing ?? HOVER_CYCLE_DEFAULTS.easing,
    mode: raw.mode ?? HOVER_CYCLE_DEFAULTS.mode,
    fill: raw.fill ?? HOVER_CYCLE_DEFAULTS.fill,
    stroke: raw.stroke ?? HOVER_CYCLE_DEFAULTS.stroke,
    opacity: raw.opacity ?? HOVER_CYCLE_DEFAULTS.opacity,
    scale: raw.scale ?? HOVER_CYCLE_DEFAULTS.scale,
    translate: raw.translate ?? HOVER_CYCLE_DEFAULTS.translate,
    shadow: raw.shadow ?? HOVER_CYCLE_DEFAULTS.shadow,
    includeMarker: raw.includeMarker ?? HOVER_CYCLE_DEFAULTS.includeMarker,
    includePolygons: raw.includePolygons ?? HOVER_CYCLE_DEFAULTS.includePolygons,
  }
}

export class HoverCycleController {
  private configs = new Map<string, NormalizedHoverCycleSpec>()
  private groups = new Map<string, SVGElement[]>()
  private active = new Map<string, ActiveCycle>()
  private teardownFns: Array<() => void> = []

  attach(root: ParentNode, configs: Iterable<[string, NormalizedHoverCycleSpec]>): void {
    this.destroy()
    this.configs = new Map(configs)
    if (this.configs.size === 0) return

    const elements = Array.from(root.querySelectorAll<SVGElement>("[data-regent-hover-key]"))

    elements.forEach((element) => {
      const key = element.dataset.regentHoverKey
      if (!key || !this.configs.has(key)) return

      const nextGroup = this.groups.get(key) ?? []
      nextGroup.push(element)
      this.groups.set(key, nextGroup)

      const onMouseEnter = () => this.start(key)
      const onMouseLeave = (event: MouseEvent) => {
        if (this.isSameGroupTarget(key, event.relatedTarget)) return
        this.stop(key)
      }
      const onFocus = () => this.start(key)
      const onBlur = (event: FocusEvent) => {
        if (this.isSameGroupTarget(key, event.relatedTarget)) return
        this.stop(key)
      }

      element.addEventListener("mouseenter", onMouseEnter)
      element.addEventListener("mouseleave", onMouseLeave)

      if (element.hasAttribute("tabindex")) {
        element.addEventListener("focus", onFocus)
        element.addEventListener("blur", onBlur)
      }

      this.teardownFns.push(() => {
        element.removeEventListener("mouseenter", onMouseEnter)
        element.removeEventListener("mouseleave", onMouseLeave)
        if (element.hasAttribute("tabindex")) {
          element.removeEventListener("focus", onFocus)
          element.removeEventListener("blur", onBlur)
        }
      })
    })
  }

  destroy(): void {
    this.active.forEach((_entry, key) => this.stop(key))
    this.active.clear()
    while (this.teardownFns.length > 0) this.teardownFns.pop()?.()
    this.groups.clear()
    this.configs.clear()
  }

  private start(key: string): void {
    if (this.active.has(key)) return

    const spec = this.configs.get(key)
    const group = this.groups.get(key) ?? []
    if (!spec || group.length === 0) return

    const polygonTargets = spec.includePolygons
      ? group.filter((element) => element.dataset.regentHoverKind === "polygon")
      : []
    const markerTargets = spec.includeMarker
      ? group.filter((element) => element.dataset.regentHoverKind === "marker")
      : []
    const targets = [...polygonTargets, ...markerTargets]

    if (targets.length === 0) return

    targets.forEach(prepareTarget)

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.active.set(key, { animations: [], targets })
      return
    }

    const animations: AnimationHandle[] = []

    if (polygonTargets.length > 0) animations.push(polygonAnimation(polygonTargets, spec))
    if (markerTargets.length > 0) animations.push(markerAnimation(markerTargets, spec))

    this.active.set(key, { animations, targets })
  }

  private stop(key: string): void {
    const entry = this.active.get(key)
    if (!entry) return

    entry.animations.forEach((animation) => {
      animation.pause?.()
      animation.cancel?.()
      animation.revert?.()
    })
    entry.targets.forEach(resetTarget)
    this.active.delete(key)
  }

  private isSameGroupTarget(key: string, target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false

    const owner = target.closest<SVGElement>("[data-regent-hover-key]")
    return owner?.dataset.regentHoverKey === key
  }
}
