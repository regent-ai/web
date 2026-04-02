import type {
  BoxCommandSpec,
  CameraSpec,
  CameraPresetName,
  CameraPresetSpec,
  FaceSpec,
  FillCommandSpec,
  HoverCycleSpec,
  MarkerSpec,
  RegentInteractionIntent,
  SceneCommandSpec,
  SceneSpec,
  SphereCommandSpec,
  StyleSpec,
} from "./regent_scene_protocol"
import type { HeerichFace, HeerichInstance } from "./heerich_types"
import {
  HoverCycleController,
  normalizeHoverCycleSpec,
  type NormalizedHoverCycleSpec,
} from "./regent_hover_cycle"
import { sigilVoxelMarkup } from "./regent_sigils"
import { prefersReducedMotion } from "./regent_motion"
import { animate } from "../vendor/anime.esm.js"

interface SceneCallbacks {
  onTargetSelect?: (payload: { targetId: string; label?: string }) => void
  onTargetHover?: (payload: { targetId: string; label?: string }) => void
}

interface MarkerAnchor {
  position: [number, number, number]
  scale?: [number, number, number]
  scaleOrigin?: [number, number, number]
  rotate?: SceneCommandSpec["rotate"]
  hoverCycle?: HoverCycleSpec | boolean
  label?: string
  sigil?: string
  targetId?: string | null
}

interface ViewBoxState {
  x: number
  y: number
  w: number
  h: number
}

interface TargetMetadata {
  intent: RegentInteractionIntent
  actionLabel?: string
  backTargetId?: string | null
  historyKey?: string | null
  groupRole?: string | null
  clickTone?: string | null
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function parseFloatAttr(raw: string | undefined, fallback: number): number {
  const value = Number(raw)
  return Number.isFinite(value) ? value : fallback
}

export function buildSceneFromRoot(sceneEl: HTMLElement): SceneSpec {
  const base = parseJson<SceneSpec>(sceneEl.dataset.sceneJson, { faces: [] })

  return {
    ...base,
    activeFace: sceneEl.dataset.activeFace || base.activeFace || base.faces[0]?.id,
    theme: sceneEl.dataset.theme || base.theme || "regent",
    sceneVersion: parseFloatAttr(sceneEl.dataset.sceneVersion, Number(base.sceneVersion ?? 0)),
    camera: {
      type: (sceneEl.dataset.cameraType as CameraSpec["type"]) || base.camera?.type || "oblique",
      angle: parseFloatAttr(sceneEl.dataset.cameraAngle, Number(base.camera?.angle ?? 315)),
      distance: parseFloatAttr(sceneEl.dataset.cameraDistance, Number(base.camera?.distance ?? 25)),
      ...(base.camera?.position ? { position: base.camera.position } : {}),
    },
  }
}

function activeFace(scene: SceneSpec): FaceSpec | undefined {
  return scene.faces.find((face) => face.id === scene.activeFace) ?? scene.faces[0]
}

function selectedTargetId(raw: string | undefined): string | null {
  return raw && raw.length > 0 ? raw : null
}

function registerHoverCycle(
  registry: Map<string, NormalizedHoverCycleSpec>,
  spec: HoverCycleSpec | boolean | undefined,
  fallbackKey: string,
): NormalizedHoverCycleSpec | null {
  const normalized = normalizeHoverCycleSpec(spec, fallbackKey)
  if (!normalized) return null

  const existing = registry.get(normalized.key)
  const merged = existing ? { ...existing, ...normalized } : normalized
  registry.set(normalized.key, merged)
  return merged
}

function hoverCycleMeta(spec: NormalizedHoverCycleSpec | null): Record<string, string> | undefined {
  if (!spec) return undefined

  return {
    regentHoverKey: spec.key,
    regentHoverKind: "polygon",
  }
}

function centerFromBox(position: [number, number, number], size: [number, number, number]): [number, number, number] {
  const [x, y, z] = position
  const [w, h, d] = size
  return [x + Math.floor((w - 1) / 2), y + Math.floor((h - 1) / 2), z + Math.max(d - 1, 0)]
}

function normalizedBoxSize(size: BoxCommandSpec["size"]): [number, number, number] {
  return typeof size === "number" ? [size, size, size] : size
}

function positionFromCenter(center: [number, number, number], size: [number, number, number]): [number, number, number] {
  const [x, y, z] = center
  const [w, h, d] = size
  return [x - Math.floor((w - 1) / 2), y - Math.floor((h - 1) / 2), z - Math.max(d - 1, 0)]
}

function boxCenter(command: BoxCommandSpec): [number, number, number] {
  if (command.center) return command.center
  return centerFromBox(command.position ?? [0, 0, 0], normalizedBoxSize(command.size))
}

function centerFromSphere(center: [number, number, number]): [number, number, number] {
  return [Math.round(center[0]), Math.round(center[1]), Math.round(center[2])]
}

function sphereRadius(command: SphereCommandSpec): number {
  if (typeof command.radius === "number") return command.radius
  if (typeof command.size === "number") return Math.max((command.size - 1) / 2, 0)
  return 0
}

function sphereCenter(command: SphereCommandSpec): [number, number, number] {
  if (command.center) return centerFromSphere(command.center)

  const radius = sphereRadius(command)
  const [x, y, z] = command.position ?? [0, 0, 0]
  return [Math.round(x + radius), Math.round(y + radius), Math.round(z + radius)]
}

function centerFromLine(from: [number, number, number], to: [number, number, number]): [number, number, number] {
  return [
    Math.round((from[0] + to[0]) / 2),
    Math.round((from[1] + to[1]) / 2),
    Math.round((from[2] + to[2]) / 2),
  ]
}

function centerFromFill(bounds: FillCommandSpec["bounds"]): [number, number, number] {
  if (!bounds) return [0, 0, 0]
  const [[x0, y0, z0], [x1, y1, z1]] = bounds
  return [
    Math.round((x0 + x1) / 2),
    Math.round((y0 + y1) / 2),
    Math.round((z0 + z1) / 2),
  ]
}

function fillBounds(command: FillCommandSpec): FillCommandSpec["bounds"] {
  if (command.bounds) return command.bounds

  const size = normalizedBoxSize(command.size ?? 1)
  const origin = command.position ?? (command.center ? positionFromCenter(command.center, size) : [0, 0, 0])
  const [x, y, z] = origin
  const [w, h, d] = size

  return [
    origin,
    [x + Math.max(w - 1, 0), y + Math.max(h - 1, 0), z + Math.max(d - 1, 0)],
  ]
}

function commandAnchor(command: SceneCommandSpec): MarkerAnchor {
  switch (command.primitive) {
    case "box":
      return {
        position: boxCenter(command),
        scale: command.scale,
        scaleOrigin: command.scaleOrigin,
        rotate: command.rotate,
        hoverCycle: command.hoverCycle,
        targetId: command.targetId,
      }
    case "sphere":
      return {
        position: sphereCenter(command),
        scale: command.scale,
        scaleOrigin: command.scaleOrigin,
        rotate: command.rotate,
        hoverCycle: command.hoverCycle,
        targetId: command.targetId,
      }
    case "line":
      return {
        position: centerFromLine(command.from, command.to),
        scale: command.scale,
        scaleOrigin: command.scaleOrigin,
        rotate: command.rotate,
        hoverCycle: command.hoverCycle,
        targetId: command.targetId,
      }
    case "fill":
      return {
        position: centerFromFill(fillBounds(command)),
        scale: command.scale,
        scaleOrigin: command.scaleOrigin,
        rotate: command.rotate,
        hoverCycle: command.hoverCycle,
        targetId: command.targetId,
      }
  }
}

function markerTransform(anchor?: MarkerAnchor): string {
  if (!anchor?.scale) return "translate(-12 -12) scale(0.375)"

  const [sx, sy, sz] = anchor.scale
  const [ox, oy, oz] = anchor.scaleOrigin ?? [0.5, 0, 0.5]
  const uniformScale = Math.max(0.42, Math.min(1.18, (sx + sy + sz) / 3))
  const shiftX = ((0.5 - ox) * (1 - sx) * 14) + ((oz - 0.5) * (1 - sz) * 6)
  const shiftY = ((0.5 - oy) * (1 - sy) * 16) + ((0.5 - oz) * (1 - sz) * 4)

  return `translate(${(-12 + shiftX).toFixed(2)} ${(-12 + shiftY).toFixed(2)}) scale(${(0.375 * uniformScale).toFixed(4)})`
}

function markerColor(marker: MarkerSpec): string {
  if (marker.color) return marker.color

  switch (marker.intent) {
    case "scene_action":
      return "var(--rg-intent-color-scene-action, #2e1b00)"
    case "navigate":
      return "var(--rg-intent-color-navigate, #08283d)"
    case "back":
      return "var(--rg-intent-color-back, #152746)"
    case "danger":
      return "var(--rg-intent-color-danger, #3c0810)"
  }

  switch (marker.status) {
    case "active":
    case "focused":
      return "var(--rg-sigil-color-active, #08111f)"
    case "complete":
      return "var(--rg-sigil-color-complete, #0b2517)"
    case "invalid":
      return "var(--rg-sigil-color-invalid, #2b090f)"
    default:
      return "var(--rg-sigil-color, #0d1524)"
  }
}

function markerMarkup(
  marker: MarkerSpec,
  anchor: MarkerAnchor | undefined,
  hoverCycle: NormalizedHoverCycleSpec | null,
): string {
  const label = marker.label ?? marker.id
  const interactive = marker.intent !== "status_only"
  const hoverAttrs = hoverCycle
    ? ` data-regent-hover-key="${escapeAttr(hoverCycle.key)}" data-regent-hover-kind="marker"`
    : ""

  if (marker.contentSvg) {
    const accessibleLabel =
      marker.actionLabel && marker.actionLabel.trim().length > 0
        ? `${marker.actionLabel}: ${label}`
        : label

    return `<g data-regent-marker-id="${escapeAttr(marker.id)}" data-regent-target-id="${escapeAttr(marker.id)}"${hoverAttrs}${marker.intent ? ` data-intent="${escapeAttr(marker.intent)}"` : ""}${marker.groupRole ? ` data-group-role="${escapeAttr(marker.groupRole)}"` : ""}${marker.clickTone ? ` data-click-tone="${escapeAttr(marker.clickTone)}"` : ""}${marker.historyKey ? ` data-history-key="${escapeAttr(marker.historyKey)}"` : ""}${marker.backTargetId ? ` data-back-target-id="${escapeAttr(marker.backTargetId)}"` : ""} ${interactive ? 'tabindex="0" role="button"' : 'aria-hidden="true"'} aria-label="${escapeAttr(accessibleLabel)}">${interactive ? '<rect x="-18" y="-18" width="36" height="36" fill="transparent" style="pointer-events:all" />' : ""}${marker.contentSvg}<title>${escapeText(accessibleLabel)}</title></g>`
  }

  return sigilVoxelMarkup(marker.sigil, {
    targetId: marker.id,
    label,
    actionLabel: marker.actionLabel,
    color: markerColor(marker),
    hoverKey: hoverCycle?.key,
    innerTransform: markerTransform(anchor),
    interactive,
    intent: marker.intent,
    groupRole: marker.groupRole,
    clickTone: marker.clickTone,
    historyKey: marker.historyKey,
    backTargetId: marker.backTargetId,
  })
}

function mergeMeta(base: Record<string, unknown> | undefined, extra: Record<string, unknown>): Record<string, unknown> {
  return { ...(base ?? {}), ...extra }
}

function applyCommand(
  engine: HeerichInstance,
  command: SceneCommandSpec,
  hoverCycles: Map<string, NormalizedHoverCycleSpec>,
): MarkerAnchor {
  const hoverCycle = registerHoverCycle(hoverCycles, command.hoverCycle, command.id)
  const meta = mergeMeta(command.meta, {
    regentCommandId: command.id,
    regentTargetId: command.targetId ?? "",
    ...(hoverCycleMeta(hoverCycle) ?? {}),
  })

  const shared = {
    style: command.style,
    content: command.content ?? undefined,
    opaque: command.opaque,
    meta,
    rotate: command.rotate,
    scale: command.scale,
    scaleOrigin: command.scaleOrigin,
  }

  switch (command.primitive) {
    case "box":
      if (command.op === "remove") {
        engine.removeGeometry({
          type: "box",
          position: command.position,
          center: command.center,
          size: command.size,
          style: command.style,
          rotate: command.rotate,
          scale: command.scale,
          scaleOrigin: command.scaleOrigin,
          meta,
        })
      } else if (command.op === "style") {
        engine.applyStyle({
          type: "box",
          position: command.position,
          center: command.center,
          size: command.size,
          style: command.style ?? {},
        })
      } else {
        const input = {
          type: "box" as const,
          position: command.position,
          center: command.center,
          size: command.size,
          ...shared,
        }

        if (command.mode && command.mode !== "union") {
          engine.applyGeometry({ ...input, mode: command.mode })
        } else {
          engine.addGeometry(input)
        }
      }
      break
    case "sphere":
      if (command.op === "remove") {
        engine.removeGeometry({
          type: "sphere",
          center: command.center,
          position: command.position,
          radius: command.radius,
          size: command.size,
          style: command.style,
          rotate: command.rotate,
          scale: command.scale,
          scaleOrigin: command.scaleOrigin,
          meta,
        })
      } else if (command.op === "style") {
        engine.applyStyle({
          type: "sphere",
          center: command.center,
          position: command.position,
          radius: command.radius,
          size: command.size,
          style: command.style ?? {},
        })
      } else {
        const input = {
          type: "sphere" as const,
          center: command.center,
          position: command.position,
          radius: command.radius,
          size: command.size,
          ...shared,
        }

        if (command.mode && command.mode !== "union") {
          engine.applyGeometry({ ...input, mode: command.mode })
        } else {
          engine.addGeometry(input)
        }
      }
      break
    case "line":
      if (command.op === "remove") {
        engine.removeGeometry({
          type: "line",
          from: command.from,
          to: command.to,
          radius: command.radius,
          shape: command.shape,
          style: command.style,
          rotate: command.rotate,
          scale: command.scale,
          scaleOrigin: command.scaleOrigin,
          meta,
        })
      } else if (command.op === "style") {
        engine.applyStyle({
          type: "line",
          from: command.from,
          to: command.to,
          radius: command.radius,
          shape: command.shape,
          style: command.style ?? {},
        })
      } else {
        const input = {
          type: "line" as const,
          from: command.from,
          to: command.to,
          radius: command.radius,
          shape: command.shape,
          ...shared,
        }

        if (command.mode && command.mode !== "union") {
          engine.applyGeometry({ ...input, mode: command.mode })
        } else {
          engine.addGeometry(input)
        }
      }
      break
    case "fill":
      if (command.op === "remove") {
        engine.removeGeometry({
          type: "fill",
          bounds: command.bounds,
          position: command.position,
          center: command.center,
          size: command.size,
          test: command.test,
          style: command.style,
          rotate: command.rotate,
          scale: command.scale,
          scaleOrigin: command.scaleOrigin,
          meta,
        })
      } else if (command.op === "style") {
        engine.applyStyle({
          type: "fill",
          bounds: command.bounds,
          position: command.position,
          center: command.center,
          size: command.size,
          test: command.test,
          style: command.style ?? {},
        })
      } else {
        const input = {
          type: "fill" as const,
          bounds: command.bounds,
          position: command.position,
          center: command.center,
          size: command.size,
          test: command.test,
          ...shared,
        }

        if (command.mode && command.mode !== "union") {
          engine.applyGeometry({ ...input, mode: command.mode })
        } else {
          engine.addGeometry(input)
        }
      }
      break
  }

  return commandAnchor(command)
}

function fallbackMarkup(scene: SceneSpec): string {
  const face = activeFace(scene)
  const targetCount = face?.markers?.length ?? 0
  const title = face?.title ?? face?.id ?? "surface"

  return `
  <div class="rg-scene-error">
    <strong>Heerich scene engine not loaded.</strong>
    <span>Face: ${title}</span>
    <span>Targets: ${targetCount}</span>
    <span>Load Heerich before mounting RegentScene to render the voxel surface.</span>
  </div>
  `
}

function renderedTargetIds(face: FaceSpec): string[] {
  const ids = new Set<string>()
  face.commands.forEach((command) => {
    if (command.targetId) ids.add(command.targetId)
  })
  face.markers?.forEach((marker) => ids.add(marker.id))
  return [...ids]
}

function faceAttributes(face: HeerichFace): Record<string, string> {
  const meta = face.voxel?.meta ?? {}
  const attrs: Record<string, string> = {}
  const classes = ["rg-scene-face"]

  if (meta.regentCommandId) attrs["data-regent-command-id"] = String(meta.regentCommandId)
  if (meta.regentTargetId) {
    attrs["data-regent-target-id"] = String(meta.regentTargetId)
    classes.push("rg-scene-target")
  }
  if (meta.regentHoverKey) attrs["data-regent-hover-key"] = String(meta.regentHoverKey)
  if (meta.regentHoverKind) attrs["data-regent-hover-kind"] = String(meta.regentHoverKind)
  if (face.type) attrs["data-face"] = face.type
  attrs["class"] = classes.join(" ")

  return attrs
}

function normalizedIntent(marker: MarkerSpec | undefined): RegentInteractionIntent {
  return marker?.intent ?? "scene_action"
}

function markerTargetMetadata(face: FaceSpec): Map<string, TargetMetadata> {
  const metadata = new Map<string, TargetMetadata>()

  face.markers?.forEach((marker) => {
    metadata.set(marker.id, {
      intent: normalizedIntent(marker),
      actionLabel: marker.actionLabel,
      backTargetId: marker.backTargetId,
      historyKey: marker.historyKey,
      groupRole: marker.groupRole,
      clickTone: marker.clickTone,
    })
  })

  return metadata
}

export class RegentSceneRenderer {
  private engine: HeerichInstance | null = null
  private hoverCycle = new HoverCycleController()
  private teardownFns: Array<() => void> = []
  private currentViewBox: ViewBoxState | null = null
  private viewBoxMotion: { cancel?: () => void } | null = null

  constructor(private readonly mountEl: HTMLElement, private readonly callbacks: SceneCallbacks = {}) {}

  private ensureEngine(scene: SceneSpec): HeerichInstance | null {
    if (!window.Heerich) return null
    const preset = this.resolveCameraPreset(scene)
    const camera = {
      ...(scene.camera ?? { type: "oblique", angle: 315, distance: 25 }),
      ...(preset ?? {}),
    }

    if (!this.engine) {
      this.engine = new window.Heerich({
        tile: [30, 30],
        camera,
        style: {
          fill: "var(--rg-node-fill, rgba(214, 224, 255, 0.82))",
          stroke: "var(--rg-node-stroke, #ced8f6)",
          strokeWidth: 0.5,
        },
      }) as HeerichInstance
    } else if (this.engine.setCamera) {
      this.engine.setCamera(camera)
    }

    this.engine.clear()
    return this.engine
  }

  private bindInteractions(): void {
    this.teardown()
    const targets = this.mountEl.querySelectorAll<SVGElement>("[data-regent-marker-id]")

    targets.forEach((target) => {
      const payload = () => ({
        targetId: target.dataset.regentMarkerId || "",
        label: target.getAttribute("aria-label") ?? undefined,
      })

      const activate = () => {
        if (!target.dataset.regentMarkerId) return
        if (target.dataset.intent === "status_only") return
        this.callbacks.onTargetSelect?.(payload())
      }

      const hover = () => {
        if (!target.dataset.regentMarkerId) return
        this.callbacks.onTargetHover?.(payload())
      }

      const onClick = (event: Event) => {
        event.preventDefault()
        activate()
      }
      const onKeydown = (event: KeyboardEvent) => {
        if (target.dataset.intent === "status_only") return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          activate()
        }
      }

      target.addEventListener("click", onClick)
      target.addEventListener("keydown", onKeydown)
      target.addEventListener("mouseenter", hover)
      target.addEventListener("focus", hover)
      this.teardownFns.push(() => {
        target.removeEventListener("click", onClick)
        target.removeEventListener("keydown", onKeydown)
        target.removeEventListener("mouseenter", hover)
        target.removeEventListener("focus", hover)
      })
    })
  }

  private teardown(): void {
    while (this.teardownFns.length > 0) this.teardownFns.pop()?.()
  }

  private stopViewBoxMotion(): void {
    this.viewBoxMotion?.cancel?.()
    this.viewBoxMotion = null
  }

  private readTargetBounds(faces: HeerichFace[], targetId: string): ViewBoxState | null {
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    faces.forEach((face) => {
      const meta = face.voxel?.meta ?? {}
      if (String(meta.regentTargetId ?? "") !== targetId) return
      const points = face.points?.data ?? []
      for (let index = 0; index < points.length; index += 2) {
        const x = points[index]
        const y = points[index + 1]
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    })

    if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null

    return {
      x: minX,
      y: minY,
      w: Math.max(maxX - minX, 1),
      h: Math.max(maxY - minY, 1),
    }
  }

  private resolveCameraPreset(scene: SceneSpec): CameraPresetSpec | null {
    const presetName = scene.activeCameraPreset
    if (!presetName) return null
    return scene.cameraPresets?.[presetName] ?? null
  }

  private resolveTargetId(scene: SceneSpec, face: FaceSpec): string | null {
    return scene.cameraTargetId ?? face.landmarkTargetId ?? null
  }

  private resolveViewBox(scene: SceneSpec, face: FaceSpec, faces: HeerichFace[]): ViewBoxState {
    const overview = this.engine?.getBounds?.(30, faces) ?? { x: 0, y: 0, w: 100, h: 100 }
    const preset = this.resolveCameraPreset(scene)
    const targetId = this.resolveTargetId(scene, face)

    if (!preset || !targetId) return overview

    const targetBounds = this.readTargetBounds(faces, targetId)
    if (!targetBounds) return overview

    const padding = Math.max(preset.padding ?? 32, 10)
    const zoom = Math.max(preset.zoom ?? 1.6, 1)
    const width = Math.max(targetBounds.w + padding * 2, overview.w / zoom)
    const height = Math.max(targetBounds.h + padding * 2, overview.h / zoom)
    const centerX = targetBounds.x + targetBounds.w / 2
    const centerY = targetBounds.y + targetBounds.h / 2

    return {
      x: centerX - width / 2,
      y: centerY - height / 2,
      w: width,
      h: height,
    }
  }

  private decorateTargets(face: FaceSpec): void {
    const metadata = markerTargetMetadata(face)

    this.mountEl.querySelectorAll<SVGElement>("[data-regent-target-id]").forEach((element) => {
      const targetId = element.dataset.regentTargetId
      if (!targetId) return
      const targetMeta = metadata.get(targetId)
      if (!targetMeta) return

      element.dataset.intent = targetMeta.intent
      if (targetMeta.actionLabel) element.dataset.actionLabel = targetMeta.actionLabel
      if (targetMeta.groupRole) element.dataset.groupRole = targetMeta.groupRole
      if (targetMeta.clickTone) element.dataset.clickTone = targetMeta.clickTone
      if (targetMeta.historyKey) element.dataset.historyKey = targetMeta.historyKey
      if (targetMeta.backTargetId) element.dataset.backTargetId = targetMeta.backTargetId

      element.classList.add(`rg-intent-${targetMeta.intent.replace(/_/g, "-")}`)
    })
  }

  private animateViewBox(targetViewBox: ViewBoxState, presetName?: CameraPresetName | null): void {
    const svg = this.mountEl.querySelector<SVGSVGElement>("svg")
    if (!svg) {
      this.currentViewBox = targetViewBox
      return
    }

    const next = { ...targetViewBox }
    const current = this.currentViewBox ? { ...this.currentViewBox } : { ...next }
    svg.setAttribute("viewBox", `${current.x} ${current.y} ${current.w} ${current.h}`)

    this.stopViewBoxMotion()

    if (prefersReducedMotion() || !this.currentViewBox) {
      svg.setAttribute("viewBox", `${next.x} ${next.y} ${next.w} ${next.h}`)
      this.currentViewBox = next
      return
    }

    const duration = presetName === "focus_travel" ? 460 : 240
    this.viewBoxMotion = animate(current, {
      x: next.x,
      y: next.y,
      w: next.w,
      h: next.h,
      duration,
      ease: "outQuart",
      onUpdate: () => {
        svg.setAttribute(
          "viewBox",
          `${current.x.toFixed(2)} ${current.y.toFixed(2)} ${current.w.toFixed(2)} ${current.h.toFixed(2)}`,
        )
      },
      onComplete: () => {
        this.currentViewBox = next
        this.viewBoxMotion = null
      },
    })
  }

  render(scene: SceneSpec): number {
    const engine = this.ensureEngine(scene)

    if (!engine) {
      this.mountEl.innerHTML = fallbackMarkup(scene)
      return activeFace(scene)?.markers?.length ?? 0
    }

    const face = activeFace(scene)
    if (!face) {
      this.mountEl.innerHTML = `<div class="rg-scene-error"><strong>No face definition found.</strong></div>`
      return 0
    }

    const hoverCycles = new Map<string, NormalizedHoverCycleSpec>()
    const anchors = new Map<string, MarkerAnchor>()

    face.commands.forEach((command) => {
      anchors.set(command.id, applyCommand(engine, command, hoverCycles))
    })

    face.markers?.forEach((marker) => {
      const anchor = marker.commandId ? anchors.get(marker.commandId) : undefined
      const position = marker.position ?? anchor?.position
      if (!position) return

      const hoverCycle = registerHoverCycle(
        hoverCycles,
        anchor?.hoverCycle,
        marker.id,
      )

      engine.applyGeometry({
        type: "box",
        position,
        size: 1,
        opaque: false,
        content: markerMarkup(marker, anchor, hoverCycle),
      })
    })

    const faces = engine.getFaces()
    const targetViewBox = this.resolveViewBox(scene, face, faces)
    const renderViewBox = this.currentViewBox ?? targetViewBox

    this.mountEl.innerHTML = engine.toSVG({
      faces,
      viewBox: [renderViewBox.x, renderViewBox.y, renderViewBox.w, renderViewBox.h],
      faceAttributes,
    })
    this.decorateTargets(face)
    this.hoverCycle.attach(this.mountEl, hoverCycles)
    this.bindInteractions()
    this.animateViewBox(targetViewBox, scene.activeCameraPreset)
    return renderedTargetIds(face).length
  }

  focusTarget(targetId: string | null): void {
    const nextTargetId = selectedTargetId(targetId ?? undefined)
    this.mountEl.querySelectorAll<SVGElement>("[data-regent-target-id]").forEach((el) => {
      const focused = nextTargetId !== null && el.dataset.regentTargetId === nextTargetId
      const dimmed = nextTargetId !== null && el.dataset.regentTargetId !== nextTargetId
      el.classList.toggle("is-focused", focused)
      el.classList.toggle("is-dimmed", dimmed)
    })
  }

  pulseTarget(targetId: string, state: string): void {
    this.mountEl.querySelectorAll<SVGElement>("[data-regent-target-id]").forEach((el) => {
      const pulsing = el.dataset.regentTargetId === targetId
      el.classList.toggle("is-pulsing", pulsing)
      if (pulsing) {
        el.dataset.pulseState = state
      } else {
        delete el.dataset.pulseState
      }
    })
  }

  ghostTarget(targetId: string, diff: Record<string, unknown>): void {
    void diff
    this.mountEl.querySelectorAll<SVGElement>("[data-regent-target-id]").forEach((el) => {
      el.classList.toggle("is-ghosted", el.dataset.regentTargetId === targetId)
    })
  }

  clearTransient(): void {
    this.mountEl.querySelectorAll<SVGElement>("[data-regent-target-id]").forEach((el) => {
      el.classList.remove("is-pulsing", "is-ghosted")
      delete el.dataset.pulseState
    })
  }

  destroy(): void {
    this.stopViewBoxMotion()
    this.hoverCycle.destroy()
    this.teardown()
    this.mountEl.innerHTML = ""
    this.currentViewBox = null
  }
}
