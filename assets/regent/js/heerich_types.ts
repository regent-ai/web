import type {
  BoundsSpec,
  BoxSizeSpec,
  CameraSpec,
  RotateSpec,
  ScaleVector,
  StyleSpec,
} from "./regent_scene_protocol"

export interface HeerichFace {
  type: string
  voxel?: {
    x: number
    y: number
    z: number
    meta?: Record<string, unknown>
  }
  style?: Record<string, unknown>
  depth?: number
  points?: {
    data: number[]
  }
}

export interface HeerichSvgOptions {
  padding?: number
  faces?: HeerichFace[]
  viewBox?: [number, number, number, number]
  offset?: [number, number]
  prepend?: string
  append?: string
  faceAttributes?: (face: HeerichFace) => Record<string, string | number | boolean | null | undefined>
}

export interface HeerichBounds {
  x: number
  y: number
  w: number
  h: number
  faces?: HeerichFace[]
}

export interface HeerichVoxel {
  x: number
  y: number
  z: number
  meta?: Record<string, unknown>
  styles?: Record<string, unknown>
}

type QueryPoint = [number, number, number]
type QueryNeighbors = Partial<Record<"top" | "bottom" | "left" | "right" | "front" | "back", HeerichVoxel | null>>
type TileSpec = number | [number, number] | [number, number, number]

export type HeerichGeometryType = "box" | "sphere" | "line" | "fill"

export type HeerichGeometryInput = Record<string, unknown> & {
  type: HeerichGeometryType
  position?: QueryPoint
  size?: BoxSizeSpec
  center?: QueryPoint
  radius?: number
  from?: QueryPoint
  to?: QueryPoint
  bounds?: BoundsSpec
}

export type HeerichStyleInput = Record<string, unknown> & {
  type?: HeerichGeometryType
  style: StyleSpec | Record<string, unknown>
}

export interface HeerichInstance {
  clear(): void
  addGeometry(input: HeerichGeometryInput): void
  applyGeometry(input: HeerichGeometryInput): void
  removeGeometry(input: HeerichGeometryInput): void
  applyStyle(input: HeerichStyleInput): void
  rotate(input: RotateSpec | Record<string, unknown>): void
  getFaces(): HeerichFace[]
  renderTest(input: Record<string, unknown>): HeerichFace[]
  getBounds(padding?: number, faces?: HeerichFace[]): HeerichBounds
  getVoxel(position: QueryPoint): HeerichVoxel | null
  getVoxel(x: number, y: number, z: number): HeerichVoxel | null
  hasVoxel(position: QueryPoint): boolean
  hasVoxel(x: number, y: number, z: number): boolean
  getNeighbors(position: QueryPoint): QueryNeighbors
  getNeighbors(x: number, y: number, z: number): QueryNeighbors
  toJSON(): Record<string, unknown>
  toSVG(input?: HeerichSvgOptions | Record<string, unknown>): string
  setCamera(camera: CameraSpec | Record<string, unknown>): void
  [Symbol.iterator](): Iterator<HeerichVoxel>
}

export interface HeerichConstructor {
  new (options?: {
    tile?: TileSpec
    camera?: CameraSpec | Record<string, unknown>
    style?: Record<string, unknown>
  }): HeerichInstance
  fromJSON?(data: Record<string, unknown>): HeerichInstance
}

export type ScaleCapableShapeInput = {
  style?: StyleSpec
  rotate?: RotateSpec
  scale?: ScaleVector
  scaleOrigin?: ScaleVector
  opaque?: boolean
  meta?: Record<string, unknown>
  content?: string | null
  mode?: string
}

declare global {
  interface Window {
    Heerich?: HeerichConstructor
  }
}

export {}
