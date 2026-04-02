export type RegentApp = "techtree" | "autolaunch" | "platform" | "regents_sh" | "generic"
export type CameraType = "oblique" | "perspective"
export type FaceOrientation = "front" | "back" | "left" | "right" | "top" | "bottom"
export type RegentSigilName = "gate" | "eye" | "seed" | "fuse" | "seal" | "wedge"
export type HoverCycleMode = "collapse" | "explode" | "phase"
export type CameraPresetName = "overview" | "focus_travel" | "node_focus" | "grid_focus"
export type HeerichBooleanMode = "union" | "subtract" | "intersect" | "exclude"
export type HeerichPrimitive = "box" | "sphere" | "line" | "fill"
export type HeerichOperation = "add" | "remove" | "style"
export type ConduitShape = "rounded" | "square"
export type RegentInteractionIntent = "scene_action" | "navigate" | "back" | "status_only" | "danger"

export interface CameraSpec {
  type: CameraType
  angle?: number
  distance?: number
  position?: [number, number]
}

export interface CameraPresetSpec extends CameraSpec {
  zoom?: number
  padding?: number
}

export interface RotateSpec {
  axis: "x" | "y" | "z"
  turns: number
  center?: [number, number, number]
}

export type ScaleVector = [number, number, number]
export type BoundsSpec = [[number, number, number], [number, number, number]]
export type BoxSizeSpec = number | [number, number, number]

export interface FaceStyleSpec {
  fill?: string
  stroke?: string
  strokeWidth?: number | string
  opacity?: number | string
  strokeDasharray?: string
  strokeLinecap?: string
  strokeLinejoin?: string
  [key: string]: unknown
}

export interface StyleSpec {
  default?: FaceStyleSpec
  top?: FaceStyleSpec
  bottom?: FaceStyleSpec
  left?: FaceStyleSpec
  right?: FaceStyleSpec
  front?: FaceStyleSpec
  back?: FaceStyleSpec
}

export interface HoverCycleSpec {
  enabled?: boolean
  group?: string
  durationMs?: number
  loopDelayMs?: number
  staggerMs?: number
  easing?: string
  mode?: HoverCycleMode
  fill?: string
  stroke?: string
  opacity?: number
  scale?: number
  translate?: number
  shadow?: string
  includeMarker?: boolean
  includePolygons?: boolean
}

interface BaseCommandSpec {
  id: string
  primitive: HeerichPrimitive
  op: HeerichOperation
  mode?: HeerichBooleanMode
  style?: StyleSpec
  content?: string | null
  opaque?: boolean
  meta?: Record<string, unknown>
  rotate?: RotateSpec
  scale?: ScaleVector
  scaleOrigin?: ScaleVector
  hoverCycle?: HoverCycleSpec | boolean
  targetId?: string | null
}

export interface BoxCommandSpec extends BaseCommandSpec {
  primitive: "box"
  position?: [number, number, number]
  center?: [number, number, number]
  size: BoxSizeSpec
}

export interface SphereCommandSpec extends BaseCommandSpec {
  primitive: "sphere"
  position?: [number, number, number]
  center?: [number, number, number]
  radius?: number
  size?: number
}

export interface LineCommandSpec extends BaseCommandSpec {
  primitive: "line"
  from: [number, number, number]
  to: [number, number, number]
  radius?: number
  shape?: ConduitShape
}

export interface FillCommandSpec extends BaseCommandSpec {
  primitive: "fill"
  bounds?: BoundsSpec
  position?: [number, number, number]
  center?: [number, number, number]
  size?: BoxSizeSpec
  test?: unknown
}

export type SceneCommandSpec = BoxCommandSpec | SphereCommandSpec | LineCommandSpec | FillCommandSpec

export interface MarkerSpec {
  id: string
  label?: string
  actionLabel?: string
  sigil?: RegentSigilName | string
  kind?: string
  status?: string
  intent?: RegentInteractionIntent
  backTargetId?: string | null
  historyKey?: string | null
  groupRole?: string | null
  clickTone?: string | null
  meta?: Record<string, unknown>
  position?: [number, number, number]
  commandId?: string | null
  color?: string
  contentSvg?: string | null
}

export interface FaceSpec {
  id: string
  title?: string
  sigil?: RegentSigilName | string
  orientation?: FaceOrientation
  landmarkTargetId?: string | null
  commands: SceneCommandSpec[]
  markers?: MarkerSpec[]
  meta?: Record<string, unknown>
}

export interface SceneSpec {
  app?: RegentApp
  activeFace?: string
  theme?: string
  sceneVersion?: number
  camera?: CameraSpec
  cameraPresets?: Partial<Record<CameraPresetName, CameraPresetSpec>>
  activeCameraPreset?: CameraPresetName
  cameraTargetId?: string | null
  faces: FaceSpec[]
  meta?: Record<string, unknown>
}

export interface NodeSelectPayload {
  target_id: string
  face_id: string
  kind?: string
  sigil?: string
  status?: string
  intent?: RegentInteractionIntent
  action_label?: string
  back_target_id?: string | null
  history_key?: string | null
  group_role?: string | null
  click_tone?: string | null
  meta?: Record<string, unknown>
}

export interface NodeHoverPayload {
  target_id: string
  face_id: string
  kind?: string
  sigil?: string
  status?: string
  intent?: RegentInteractionIntent
  action_label?: string
  back_target_id?: string | null
  history_key?: string | null
  group_role?: string | null
  click_tone?: string | null
  meta?: Record<string, unknown>
}

export interface FaceFlipPayload {
  from_face_id?: string
  to_face_id: string
}

export interface SurfaceReadyPayload {
  scene_version?: number
  active_face?: string | null
  rendered_targets: number
}

export interface SurfaceErrorPayload {
  phase: "parse" | "render" | "interact"
  message: string
}

export interface SceneReplacePayload {
  scene: SceneSpec
}

export interface ScenePatchPayload {
  activeFace?: string
  selectedTargetId?: string | null
  sceneVersion?: number
}

export interface SceneFocusPayload {
  target_id: string | null
}

export interface ScenePulsePayload {
  target_id: string
  state: string
}

export interface SceneGhostPayload {
  target_id: string
  diff: Record<string, unknown>
}

export type ClientToServerEvent =
  | "regent:surface_ready"
  | "regent:surface_error"
  | "regent:node_select"
  | "regent:node_hover"
  | "regent:face_flip"

export type ServerToClientEvent =
  | "regent:scene_replace"
  | "regent:scene_patch"
  | "regent:scene_focus"
  | "regent:scene_pulse"
  | "regent:scene_ghost"
