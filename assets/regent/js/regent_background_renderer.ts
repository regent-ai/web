import {
  DEFAULT_HOME_CAMERA_STATE,
  subscribeHomeCameraState,
  type HomeCameraState,
} from "./home_camera_state"
import { prefersReducedMotion } from "./regent_motion"
import { animate } from "../vendor/anime.esm.js"

type Point = { x: number; y: number }
type Polygon = [Point, Point, Point, Point]
type AnimationHandle = ReturnType<typeof animate>

interface BackgroundOptions {
  cubeWidth: number
  cubeHeight: number
  cubeDepth: number
  overscan: number
  neighborRadius: number
  hideCursor: boolean
  suppressSelector: string | null
  trailMs: number
}

interface BackgroundCell {
  row: number
  col: number
  key: string
  center: Point
  top: Polygon
  left: Polygon
  right: Polygon
  order: number
  group: SVGGElement
}

function svgEl<K extends keyof SVGElementTagNameMap>(name: K): SVGElementTagNameMap[K] {
  return document.createElementNS("http://www.w3.org/2000/svg", name)
}

function parseNumber(raw: string | undefined, fallback: number): number {
  const value = Number(raw)
  return Number.isFinite(value) ? value : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function pointInPolygon(point: Point, polygon: Polygon): boolean {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersects = ((yi > point.y) !== (yj > point.y)) && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 1e-9) + xi)
    if (intersects) inside = !inside
  }

  return inside
}

function polygonPoints(points: Polygon): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ")
}

export class RegentBackgroundRenderer {
  private static readonly hitScaleDurationMs = 700
  private svg: SVGSVGElement
  private cells: BackgroundCell[] = []
  private cellMap = new Map<string, BackgroundCell>()
  private viewWidth = 0
  private viewHeight = 0
  private activeKey: string | null = null
  private activePainted = new Set<string>()
  private rafToken: number | null = null
  private queuedPointer: PointerEvent | null = null
  private resizeToken: number | null = null
  private trailMap = new Map<string, number>()
  private hitScaleAnimations = new Map<string, AnimationHandle>()
  private pointerInsideSuppressedTarget = false
  private isPointerDown = false
  private cameraState: HomeCameraState = { ...DEFAULT_HOME_CAMERA_STATE }
  private stopCameraSubscription: (() => void) | null = null

  private readonly onPointerMove = (event: PointerEvent) => {
    this.queuedPointer = event
    this.scheduleFrame()
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    this.isPointerDown = true
    this.queuedPointer = event
    this.updateFromPointer(event, performance.now())
    this.scheduleFrame()
  }

  private readonly onPointerUp = () => {
    this.isPointerDown = false
  }

  private readonly onPointerLeave = () => {
    this.isPointerDown = false
    this.pointerInsideSuppressedTarget = false
    this.trailMap.clear()
    this.setCursorHidden(false)
    this.clearActive()
    if (this.trailMap.size > 0) this.scheduleFrame()
  }
  private readonly onResize = () => {
    if (this.resizeToken !== null) window.clearTimeout(this.resizeToken)
    this.resizeToken = window.setTimeout(() => this.rebuild(), 80)
  }
  private readonly onVisibilityChange = () => { if (document.hidden) this.clearActive() }

  constructor(private readonly mountEl: HTMLElement) {
    const existing = mountEl.querySelector("svg")
    this.svg = existing instanceof SVGSVGElement ? existing : svgEl("svg")
    if (!existing) this.mountEl.appendChild(this.svg)
  }

  private options(): BackgroundOptions {
    return {
      cubeWidth: parseNumber(this.mountEl.dataset.cubeWidth, 44),
      cubeHeight: parseNumber(this.mountEl.dataset.cubeHeight, 24),
      cubeDepth: parseNumber(this.mountEl.dataset.cubeDepth, 14),
      overscan: parseNumber(this.mountEl.dataset.overscan, 4),
      neighborRadius: parseNumber(this.mountEl.dataset.neighborRadius, 1),
      hideCursor: this.mountEl.dataset.hideCursor === "false" ? false : true,
      suppressSelector: this.mountEl.dataset.suppressSelector?.trim() || null,
      trailMs: Math.max(parseNumber(this.mountEl.dataset.trailMs, 0), 0),
    }
  }

  private setCursorHidden(hidden: boolean): void {
    document.documentElement.classList.toggle("rg-cursor-hidden", hidden)
  }

  private isProjectCardTarget(target: EventTarget | null): boolean {
    return target instanceof Element && target.closest(".pp-entry-card") !== null
  }

  mount(): void {
    this.setCursorHidden(false)
    this.stopCameraSubscription = subscribeHomeCameraState((state) => {
      this.cameraState = state
      this.rebuild()
    })
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true })
    window.addEventListener("pointerup", this.onPointerUp, { passive: true })
    window.addEventListener("pointermove", this.onPointerMove, { passive: true })
    window.addEventListener("pointerleave", this.onPointerLeave)
    window.addEventListener("blur", this.onPointerLeave)
    window.addEventListener("resize", this.onResize, { passive: true })
    document.addEventListener("visibilitychange", this.onVisibilityChange)
    this.rebuild()
  }

  private scheduleFrame(): void {
    if (this.rafToken !== null) return
    this.rafToken = window.requestAnimationFrame((now) => this.runFrame(now))
  }

  private runFrame(now: number): void {
    this.rafToken = null

    if (this.queuedPointer) {
      this.updateFromPointer(this.queuedPointer, now)
      this.queuedPointer = null
    }

    if (this.decayTrail(now)) this.paintState()
    if (this.trailMap.size > 0 || this.isPointerDown) this.scheduleFrame()
  }

  private buildCells(width: number, height: number): BackgroundCell[] {
    const options = this.options()
    const halfW = options.cubeWidth / 2
    const halfH = options.cubeHeight / 2
    const originX = width / 2
    const originY = -options.cubeDepth - halfH
    const range = Math.ceil(width / halfW) + Math.ceil(height / halfH) + options.overscan * 2
    const minIndex = -range
    const maxIndex = range
    const cells: BackgroundCell[] = []

    for (let row = minIndex; row <= maxIndex; row += 1) {
      for (let col = minIndex; col <= maxIndex; col += 1) {
        const centerX = originX + (col - row) * halfW
        const centerY = originY + (col + row) * halfH

        const top: Polygon = [
          { x: centerX, y: centerY - halfH },
          { x: centerX + halfW, y: centerY },
          { x: centerX, y: centerY + halfH },
          { x: centerX - halfW, y: centerY },
        ]

        const left: Polygon = [
          { x: centerX - halfW, y: centerY },
          { x: centerX, y: centerY + halfH },
          { x: centerX, y: centerY + halfH + options.cubeDepth },
          { x: centerX - halfW, y: centerY + options.cubeDepth },
        ]

        const right: Polygon = [
          { x: centerX + halfW, y: centerY },
          { x: centerX, y: centerY + halfH },
          { x: centerX, y: centerY + halfH + options.cubeDepth },
          { x: centerX + halfW, y: centerY + options.cubeDepth },
        ]

        const transformedTop = this.transformPolygon(top)
        const transformedLeft = this.transformPolygon(left)
        const transformedRight = this.transformPolygon(right)

        const xs = [...transformedTop, ...transformedLeft, ...transformedRight].map((point) => point.x)
        const ys = [...transformedTop, ...transformedLeft, ...transformedRight].map((point) => point.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)
        if (maxX < -halfW || minX > width + halfW || maxY < -options.cubeDepth || minY > height + options.cubeDepth) continue

        const key = `${row}:${col}`
        const group = svgEl("g")
        group.setAttribute("class", "rg-bg-cube")
        group.dataset.row = String(row)
        group.dataset.col = String(col)
        group.dataset.key = key

        const topPolygon = svgEl("polygon")
        topPolygon.setAttribute("class", "rg-bg-cube-face rg-bg-cube-face-top")
        topPolygon.setAttribute("points", polygonPoints(transformedTop))

        const leftPolygon = svgEl("polygon")
        leftPolygon.setAttribute("class", "rg-bg-cube-face rg-bg-cube-face-left")
        leftPolygon.setAttribute("points", polygonPoints(transformedLeft))

        const rightPolygon = svgEl("polygon")
        rightPolygon.setAttribute("class", "rg-bg-cube-face rg-bg-cube-face-right")
        rightPolygon.setAttribute("points", polygonPoints(transformedRight))

        group.append(leftPolygon, rightPolygon, topPolygon)
        cells.push({
          row,
          col,
          key,
          center: this.transformPoint({ x: centerX, y: centerY }),
          top: transformedTop,
          left: transformedLeft,
          right: transformedRight,
          order: row + col,
          group,
        })
      }
    }

    cells.sort((a, b) => a.order - b.order || a.row - b.row || a.col - b.col)
    return cells
  }

  private activeCameraState(): HomeCameraState {
    return this.cameraState.target === "background"
      ? this.cameraState
      : DEFAULT_HOME_CAMERA_STATE
  }

  private transformPoint(point: Point): Point {
    const state = this.activeCameraState()
    const centerX = this.viewWidth / 2
    const centerY = this.viewHeight / 2
    const dx = point.x - centerX
    const dy = point.y - centerY
    const spin = ((state.angle - DEFAULT_HOME_CAMERA_STATE.angle) * Math.PI) / 180 * 0.18
    const cos = Math.cos(spin)
    const sin = Math.sin(spin)
    const rotatedX = dx * cos - dy * sin
    const rotatedY = dx * sin + dy * cos
    const camYOffset = state.camY - DEFAULT_HOME_CAMERA_STATE.camY
    const distanceDelta =
      (state.distance - DEFAULT_HOME_CAMERA_STATE.distance) /
      DEFAULT_HOME_CAMERA_STATE.distance
    const yRatio = clamp(rotatedY / Math.max(this.viewHeight * 0.56, 1), -1.2, 1.2)
    const perspectiveFactor = clamp(
      1 - yRatio * (0.14 + distanceDelta * 0.09),
      0.74,
      1.32,
    )
    const verticalFactor = clamp(1 + camYOffset * 0.035, 0.76, 1.24)
    const depthLift = camYOffset * 5 + distanceDelta * 14

    return {
      x: centerX + rotatedX * perspectiveFactor,
      y: centerY + rotatedY * verticalFactor - depthLift,
    }
  }

  private transformPolygon(polygon: Polygon): Polygon {
    return [
      this.transformPoint(polygon[0]),
      this.transformPoint(polygon[1]),
      this.transformPoint(polygon[2]),
      this.transformPoint(polygon[3]),
    ]
  }

  rebuild(): void {
    const rect = this.mountEl.getBoundingClientRect()
    const width = Math.max(Math.round(rect.width), 1)
    const height = Math.max(Math.round(rect.height), 1)
    this.viewWidth = width
    this.viewHeight = height

    this.svg.setAttribute("class", "rg-background-grid-svg")
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`)
    this.svg.setAttribute("width", String(width))
    this.svg.setAttribute("height", String(height))
    this.svg.setAttribute("preserveAspectRatio", "none")
    this.cancelHitScaleAnimations()
    this.svg.innerHTML = ""

    this.cells = this.buildCells(width, height)
    this.cellMap.clear()

    const frag = document.createDocumentFragment()
    for (const cell of this.cells) {
      this.cellMap.set(cell.key, cell)
      frag.appendChild(cell.group)
    }

    this.svg.appendChild(frag)
    this.clearActive()
  }

  private approximateCell(point: Point): { row: number; col: number } {
    const options = this.options()
    const halfW = options.cubeWidth / 2
    const halfH = options.cubeHeight / 2
    const originX = this.viewWidth / 2
    const originY = -options.cubeDepth - halfH
    const u = (point.x - originX) / halfW
    const v = (point.y - originY) / halfH
    return { col: Math.round((u + v) / 2), row: Math.round((v - u) / 2) }
  }

  private pointFromClient(clientX: number, clientY: number): Point {
    const rect = this.mountEl.getBoundingClientRect()
    const width = rect.width || 1
    const height = rect.height || 1

    return {
      x: ((clientX - rect.left) / width) * this.viewWidth,
      y: ((clientY - rect.top) / height) * this.viewHeight,
    }
  }

  private hitTest(point: Point): BackgroundCell | null {
    const approx = this.approximateCell(point)
    const candidates: BackgroundCell[] = []
    const searchRadius = 4

    // The projected home grid skews enough near the viewport edges that a tight
    // search window can miss the actual top face under the pointer.
    for (let dr = -searchRadius; dr <= searchRadius; dr += 1) {
      for (let dc = -searchRadius; dc <= searchRadius; dc += 1) {
        const cell = this.cellMap.get(`${approx.row + dr}:${approx.col + dc}`)
        if (cell) candidates.push(cell)
      }
    }

    candidates.sort((a, b) => b.order - a.order)
    for (const cell of candidates) {
      if (pointInPolygon(point, cell.top)) return cell
    }
    return null
  }

  private paintState(): void {
    const keys = new Set<string>(this.trailMap.keys())
    if (this.activeKey) keys.add(this.activeKey)

    for (const key of this.activePainted) {
      const cell = this.cellMap.get(key)
      cell?.group.classList.remove(
        "is-active",
        "is-neighbor",
        "is-trail",
      )
    }

    this.activePainted = keys
    keys.forEach((key) => {
      const cell = this.cellMap.get(key)
      if (!cell) return

      if (key === this.activeKey) {
        cell.group.classList.add("is-active")
        return
      }

      const trailMs = this.options().trailMs
      if (trailMs <= 0) return

      cell.group.classList.add("is-trail")
    })
  }

  private updateFromPointer(event: PointerEvent, now: number): void {
    const options = this.options()
    const liveTarget = document.elementFromPoint(event.clientX, event.clientY)
    const suppressed = this.isSuppressedTarget(liveTarget, options.suppressSelector)

    if (suppressed) {
      this.pointerInsideSuppressedTarget = true
      this.trailMap.clear()
      this.setCursorHidden(false)
      this.clearActive()
      return
    }

    this.pointerInsideSuppressedTarget = false
    this.setCursorHidden(options.hideCursor && !this.isProjectCardTarget(liveTarget))
    const localPoint = this.pointFromClient(event.clientX, event.clientY)
    const cell = this.hitTest(localPoint)
    if (!cell) {
      this.releaseActiveToTrail(now)
      this.paintState()
      return
    }

    if (cell.key === this.activeKey && !this.isPointerDown) return
    const previousActiveKey = this.activeKey
    const nextActiveKey = cell.key

    this.releaseActiveToTrail(now, nextActiveKey)
    this.activeKey = nextActiveKey
    this.trailMap.delete(nextActiveKey)
    if (nextActiveKey !== previousActiveKey) {
      this.animateHitScale(cell)
    }
    this.paintState()
  }

  clearActive(): void {
    this.activeKey = null
    this.paintState()
  }

  private decayTrail(now: number): boolean {
    const trailMs = this.options().trailMs
    if (trailMs <= 0 || this.trailMap.size === 0) return false

    let changed = false
    this.trailMap.forEach((startedAt, key) => {
      if (now - startedAt < trailMs) return
      this.trailMap.delete(key)
      changed = true
    })

    return changed
  }

  private releaseActiveToTrail(now: number, exceptKey?: string): void {
    const previousActiveKey = this.activeKey
    this.activeKey = null

    if (!previousActiveKey || previousActiveKey === exceptKey) return
    if (this.options().trailMs <= 0) {
      this.trailMap.delete(previousActiveKey)
      return
    }

    this.trailMap.set(previousActiveKey, now)
  }

  private isSuppressedTarget(target: EventTarget | null, selector: string | null): boolean {
    if (!(target instanceof Element)) return false

    const interactiveSelector =
      "a,button,input,select,textarea,summary,label,[role='button'],[role='link'],[contenteditable='true']"

    if (target.closest(interactiveSelector) !== null) return true
    if (!selector) return false
    return target.closest(selector) !== null
  }

  destroy(): void {
    if (this.rafToken !== null) window.cancelAnimationFrame(this.rafToken)
    if (this.resizeToken !== null) window.clearTimeout(this.resizeToken)
    window.removeEventListener("pointerdown", this.onPointerDown)
    window.removeEventListener("pointerup", this.onPointerUp)
    window.removeEventListener("pointermove", this.onPointerMove)
    window.removeEventListener("pointerleave", this.onPointerLeave)
    window.removeEventListener("blur", this.onPointerLeave)
    window.removeEventListener("resize", this.onResize)
    document.removeEventListener("visibilitychange", this.onVisibilityChange)
    this.stopCameraSubscription?.()
    this.stopCameraSubscription = null
    this.cancelHitScaleAnimations()
    this.setCursorHidden(false)
    this.mountEl.innerHTML = ""
  }

  private animateHitScale(cell: BackgroundCell): void {
    const existing = this.hitScaleAnimations.get(cell.key)
    existing?.cancel?.()

    if (prefersReducedMotion()) {
      cell.group.style.transform = "scale(1)"
      this.hitScaleAnimations.delete(cell.key)
      return
    }

    cell.group.style.transform = "scale(0)"

    const animation = animate(cell.group, {
      scale: [0, 1],
      duration: RegentBackgroundRenderer.hitScaleDurationMs,
      ease: "outExpo",
      onComplete: () => {
        cell.group.style.transform = "scale(1)"
        if (this.hitScaleAnimations.get(cell.key) === animation) {
          this.hitScaleAnimations.delete(cell.key)
        }
      },
    })

    this.hitScaleAnimations.set(cell.key, animation)
  }

  private cancelHitScaleAnimations(): void {
    this.hitScaleAnimations.forEach((animation) => animation.cancel?.())
    this.hitScaleAnimations.clear()
  }
}
