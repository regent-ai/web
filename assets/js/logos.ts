import { animate } from "animejs";
import type { HeerichInstance } from "../regent/js/heerich_types";

type ThemeMode = "blueprint" | "mono";
type BrandId = "regents" | "regent-elbow" | "techtree" | "autolaunch";
type DownloadFormat = "png" | "svg";
type Cell = readonly [number, number];
type VoxelCell = readonly [number, number, number];
type ScaleVector = [number, number, number];

type RectMark = {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
};

type LineMark = {
  kind: "line";
  from: Cell;
  to: Cell;
};

type PointsMark = {
  kind: "points";
  points: readonly Cell[];
};

type Mark = RectMark | LineMark | PointsMark;

type StudySpec = {
  id: string;
  depth: number;
  marks?: readonly Mark[];
  layerCells?: readonly (readonly Cell[])[];
  modeLabel: string;
  tile?: [number, number, number];
  cameraDistance?: number;
  cameraAngle?: number;
  voxelScale?: ScaleVector;
};

type ThemePalette = {
  canvas: string;
  fill: string;
  stroke: string;
  top: string;
  left: string;
  right: string;
  bottom: string;
};

type HookContext = {
  el: HTMLElement;
  __logosCleanup?: () => void;
};

const LOGO_CLICK_DISSOLVE_MS = 300;

const BLUEPRINT_THEME: ThemePalette = {
  canvas: "#0d4b77",
  fill: "#f5ecd7",
  stroke: "#d4c2a0",
  top: "#fff8e9",
  left: "#e7d9ba",
  right: "#efe1c4",
  bottom: "#d8c6a1",
};

const MONO_THEME: ThemePalette = {
  canvas: "#ffffff",
  fill: "#101010",
  stroke: "#2e2e2e",
  top: "#222222",
  left: "#050505",
  right: "#171717",
  bottom: "#000000",
};

const THEME_PALETTES: Record<ThemeMode, ThemePalette> = {
  blueprint: BLUEPRINT_THEME,
  mono: MONO_THEME,
};

const DEFAULT_TILE: [number, number, number] = [18, 18, 8];
const DEFAULT_CAMERA_ANGLE = 334;

function rect(x: number, y: number, width: number, height: number): RectMark {
  return { kind: "rect", x, y, width, height };
}

function line(from: Cell, to: Cell): LineMark {
  return { kind: "line", from, to };
}

function points(...pairs: Cell[]): PointsMark {
  return { kind: "points", points: pairs };
}

function rowCells(...rows: readonly (readonly number[])[]): Cell[] {
  return rows.flatMap((row, y) => row.map((x) => [x, y] as const));
}

function horizontalCells(y: number, startX: number, endX: number): Cell[] {
  const output: Cell[] = [];

  for (let x = startX; x <= endX; x += 1) {
    output.push([x, y]);
  }

  return output;
}

function uniqueCells(cells: readonly Cell[]): Cell[] {
  return Array.from(new Set(cells.map(([x, y]) => `${x}:${y}`)), (key) => {
    const [x, y] = key.split(":").map(Number);
    return [x, y] as const;
  });
}

function verticalCells(x: number, startY: number, endY: number): Cell[] {
  const output: Cell[] = [];

  for (let y = startY; y <= endY; y += 1) {
    output.push([x, y]);
  }

  return output;
}

type TNodeConfig = {
  base: Cell;
  leftArm: number;
  rightArm: number;
  stem: number;
};

function nodeBlockCells(baseX: number, baseY: number, size = 3): Cell[] {
  const output: Cell[] = [];

  for (let x = baseX; x < baseX + size; x += 1) {
    for (let y = baseY; y < baseY + size; y += 1) {
      output.push([x, y]);
    }
  }

  return output;
}

function tNodeCells(config: TNodeConfig): Cell[] {
  const [baseX, baseY] = config.base;
  const midY = baseY + 1;
  const centerX = baseX + 1;

  return uniqueCells([
    ...nodeBlockCells(baseX, baseY, 3),
    ...horizontalCells(midY, baseX - config.leftArm, baseX - 1),
    ...horizontalCells(midY, baseX + 3, baseX + 2 + config.rightArm),
    ...verticalCells(centerX, baseY + 3, baseY + 2 + config.stem),
  ]);
}

function shiftCells(cells: readonly Cell[], deltaX: number, deltaY: number): Cell[] {
  return cells.map(([x, y]) => [x + deltaX, y + deltaY] as const);
}

function techtreeAlphaBetaLayers(config: TNodeConfig): readonly (readonly Cell[])[] {
  const alpha = uniqueCells(tNodeCells(config));
  const [baseX, baseY] = config.base;
  const alphaBottom: Cell = [baseX + 1, baseY + 2 + config.stem];
  const betaLeftTip: Cell = [baseX - config.leftArm, baseY + 1];
  const beta = shiftCells(
    alpha,
    alphaBottom[0] - betaLeftTip[0],
    alphaBottom[1] - betaLeftTip[1],
  );

  return [alpha, alpha, beta, beta];
}

function lineCells(from: Cell, to: Cell): Cell[] {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const cells: Cell[] = [];
  const deltaX = Math.abs(x2 - x1);
  const deltaY = Math.abs(y2 - y1);
  const stepX = x1 < x2 ? 1 : -1;
  const stepY = y1 < y2 ? 1 : -1;

  let x = x1;
  let y = y1;
  let error = deltaX - deltaY;

  while (true) {
    cells.push([x, y]);
    if (x === x2 && y === y2) return cells;

    const doubled = error * 2;
    if (doubled > -deltaY) {
      error -= deltaY;
      x += stepX;
    }
    if (doubled < deltaX) {
      error += deltaX;
      y += stepY;
    }
  }
}

function collect2DCells(marks: readonly Mark[]): Cell[] {
  const output = new Set<string>();

  marks.forEach((mark) => {
    if (mark.kind === "rect") {
      for (let x = mark.x; x < mark.x + mark.width; x += 1) {
        for (let y = mark.y; y < mark.y + mark.height; y += 1) {
          output.add(`${x}:${y}`);
        }
      }
      return;
    }

    if (mark.kind === "line") {
      lineCells(mark.from, mark.to).forEach(([x, y]) => {
        output.add(`${x}:${y}`);
      });
      return;
    }

    mark.points.forEach(([x, y]) => {
      output.add(`${x}:${y}`);
    });
  });

  return Array.from(output, (key) => {
    const [x, y] = key.split(":").map(Number);
    return [x, y] as const;
  });
}

function centeredCells(cells: readonly Cell[]): Cell[] {
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const offsetX = Math.floor((minX + maxX) / 2);
  const offsetY = Math.floor((minY + maxY) / 2);

  return cells.map(([x, y]) => [x - offsetX, y - offsetY] as const);
}

function buildOccupancy(spec: StudySpec): {
  cells: VoxelCell[];
  bounds: [[number, number, number], [number, number, number]];
  voxelCount: number;
} {
  const cells = buildVoxelCells(spec);
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);
  const zs = cells.map(([, , z]) => z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  return {
    cells,
    bounds: [
      [minX, minY, minZ],
      [maxX + 1, maxY + 1, maxZ + 1],
    ],
    voxelCount: cells.length,
  };
}

function buildVoxelCells(spec: StudySpec): VoxelCell[] {
  if (spec.layerCells) {
    if (spec.layerCells.length !== spec.depth) {
      throw new Error(
        `Logo study ${spec.id} declares depth ${spec.depth} but has ${spec.layerCells.length} explicit layers.`,
      );
    }

    const rawCells = spec.layerCells.flatMap((layer, z) =>
      layer.map(([x, y]) => [x, y, z] as const),
    );

    return centeredVoxelCells(rawCells);
  }

  const cells = centeredCells(collect2DCells(spec.marks ?? []));

  return cells.flatMap(([x, y]) =>
    Array.from({ length: spec.depth }, (_value, z) => [x, y, z] as const),
  );
}

function centeredVoxelCells(cells: readonly VoxelCell[]): VoxelCell[] {
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const offsetX = Math.floor((minX + maxX) / 2);
  const offsetY = Math.floor((minY + maxY) / 2);

  return cells.map(([x, y, z]) => [x - offsetX, y - offsetY, z] as const);
}

function rotateQuarterTurns(cell: Cell, turns: number): Cell {
  const normalizedTurns = ((turns % 4) + 4) % 4;
  let [x, y] = cell;

  for (let index = 0; index < normalizedTurns; index += 1) {
    [x, y] = [-y, x];
  }

  return [x, y];
}

function regentQuadrantCells(
  rows: readonly (readonly number[])[],
  gap: number,
): readonly Cell[] {
  const cells = rows.flatMap((row, rowIndex) => row.map((x) => [x, rowIndex] as const));
  return placeQuadrantCells(cells, gap);
}

function placeQuadrantCells(cells: readonly Cell[], gap: number): readonly Cell[] {
  const maxY = Math.max(...cells.map(([, y]) => y));
  return cells.map(([x, y]) => [x + gap, y - (maxY + gap)] as const);
}

function regentQuadrantMarks(
  cells: readonly Cell[],
  gap: number,
  initialTurns = 0,
): readonly Mark[] {
  const quadrant = placeQuadrantCells(cells, gap);
  const rotated = uniqueCells(
    quadrant.flatMap((cell) => [
      rotateQuarterTurns(cell, initialTurns),
      rotateQuarterTurns(cell, initialTurns + 1),
      rotateQuarterTurns(cell, initialTurns + 2),
      rotateQuarterTurns(cell, initialTurns + 3),
    ]),
  );

  return [points(...rotated)];
}

function regentMarks(
  rows: readonly (readonly number[])[],
  gap: number,
): readonly Mark[] {
  const quadrant = regentQuadrantCells(rows, gap);
  const rotated = uniqueCells(
    quadrant.flatMap((cell) => [
      cell,
      rotateQuarterTurns(cell, 1),
      rotateQuarterTurns(cell, 2),
      rotateQuarterTurns(cell, 3),
    ]),
  );

  return [points(...rotated)];
}

type RegentElbowConfig = {
  outerSize: number;
  innerSize: number;
  innerOffsetX: number;
  innerOffsetY: number;
  outerThickness?: number;
  innerThickness?: number;
  outerCrookCells?: readonly Cell[];
  innerCrookCells?: readonly Cell[];
};

function diagonalSymmetricElbowCells(
  size: number,
  thickness = 1,
  crookCells: readonly Cell[] = [],
): readonly Cell[] {
  const seed = Array.from({ length: thickness }, (_value, rowIndex) =>
    horizontalCells(rowIndex, thickness, size - 1),
  ).flat();

  return uniqueCells([
    ...seed,
    ...seed.map(([x, y]) => [y, x] as const),
    ...crookCells,
    ...crookCells.map(([x, y]) => [y, x] as const),
  ]);
}

function flipHorizontalCells(cells: readonly Cell[], size: number): Cell[] {
  return cells.map(([x, y]) => [size - 1 - x, y] as const);
}

function flipVerticalCells(cells: readonly Cell[], size: number): Cell[] {
  return cells.map(([x, y]) => [x, size - 1 - y] as const);
}

function reflectDiagonalCells(cells: readonly Cell[]): Cell[] {
  return cells.map(([x, y]) => [y, x] as const);
}

function regentElbowCells(config: RegentElbowConfig): readonly Cell[] {
  const outer = flipHorizontalCells(
    diagonalSymmetricElbowCells(
      config.outerSize,
      config.outerThickness ?? 1,
      config.outerCrookCells ?? [],
    ),
    config.outerSize,
  );
  const inner = shiftCells(
    flipVerticalCells(
      diagonalSymmetricElbowCells(
        config.innerSize,
        config.innerThickness ?? 1,
        config.innerCrookCells ?? [],
      ),
      config.innerSize,
    ),
    config.innerOffsetX,
    config.innerOffsetY,
  );

  return uniqueCells([...outer, ...inner]);
}

function regentElbowMarks(config: RegentElbowConfig): readonly Mark[] {
  return [points(...regentElbowCells(config))];
}

const REGENT_VARIANTS = [
  {
    id: "study-1",
    gap: 2,
    quadrantCells: reflectDiagonalCells(
      regentElbowCells({
        outerSize: 11,
        innerSize: 6,
        innerOffsetX: 2,
        innerOffsetY: 3,
        outerThickness: 2,
        outerCrookCells: [
          [2, 2],
          [2, 3],
          [3, 3],
        ] as const,
        innerCrookCells: [[1, 1]] as const,
      }),
    ),
    modeLabel: "equidistant elbow quadrant",
    cameraDistance: 4.15,
    voxelScale: [0.94, 0.94, 0.88] as ScaleVector,
  },
  { id: "study-2", gap: 1, rows: [[0, 1], [0, 1], [0, 1, 2], [0, 1, 2], [1, 2], [1, 2], [2, 3]], modeLabel: "separate hinge hook", cameraDistance: 4.2, voxelScale: [0.96, 0.96, 0.88] as ScaleVector },
  { id: "study-3", gap: 1, rows: [[0, 1], [0, 1], [0, 1], [0, 1, 2], [0, 1, 2], [1, 2], [2, 3]], modeLabel: "separate gate hook", cameraDistance: 4.25, voxelScale: [0.97, 0.97, 0.88] as ScaleVector },
  { id: "study-4", gap: 1, rows: [[0, 1], [0, 1], [0, 1], [0, 1, 2], [1, 2], [1, 2, 3], [2, 3]], modeLabel: "separate chamber hook", cameraDistance: 4.3, voxelScale: [0.97, 0.97, 0.89] as ScaleVector },
  { id: "study-5", gap: 1, rows: [[0, 1], [0, 1], [0, 1, 2], [0, 1, 2], [1, 2], [2, 3], [2, 3]], modeLabel: "separate crest hook", cameraDistance: 4.35, voxelScale: [0.97, 0.97, 0.89] as ScaleVector },
  { id: "study-6", gap: 1, rows: [[0, 1], [0, 1], [0, 1], [0, 1, 2], [1, 2, 3], [1, 2], [2, 3]], modeLabel: "separate arc hook", cameraDistance: 4.4, voxelScale: [0.98, 0.98, 0.89] as ScaleVector },
  { id: "study-7", gap: 1, rows: [[0, 1], [0, 1, 2], [0, 1], [0, 1, 2], [1, 2], [1, 2], [2, 3]], modeLabel: "separate signal hook", cameraDistance: 4.45, voxelScale: [0.98, 0.98, 0.89] as ScaleVector },
  { id: "study-8", gap: 1, rows: [[0, 1], [0, 1], [0, 1, 2], [1, 2], [1, 2], [1, 2, 3], [2, 3]], modeLabel: "separate lintel hook", cameraDistance: 4.5, voxelScale: [0.98, 0.98, 0.89] as ScaleVector },
  { id: "study-9", gap: 2, rows: [[0, 1], [0, 1], [0, 1], [0, 1, 2], [1, 2], [2, 3], [1, 2, 3]], modeLabel: "wide-gap relay hook", cameraDistance: 4.55, voxelScale: [0.98, 0.98, 0.9] as ScaleVector },
  { id: "study-10", gap: 2, rows: [[0, 1], [0, 1, 2], [0, 1, 2], [1, 2], [1, 2], [1, 2], [2, 3]], modeLabel: "wide-gap mirror hook", cameraDistance: 4.6, voxelScale: [0.98, 0.98, 0.9] as ScaleVector },
  { id: "study-11", gap: 2, rows: [[0, 1], [0, 1], [0, 1, 2], [0, 1, 2], [1, 2], [1, 2], [1, 2]], modeLabel: "wide-gap vault hook", cameraDistance: 4.65, voxelScale: [0.99, 0.99, 0.9] as ScaleVector },
  { id: "study-12", gap: 2, rows: [[0, 1], [0, 1], [0, 1], [0, 1, 2], [0, 1, 2], [1, 2], [1, 2]], modeLabel: "wide-gap proof hook", cameraDistance: 4.7, voxelScale: [0.99, 0.99, 0.9] as ScaleVector },
  { id: "study-13", gap: 2, rows: [[0, 1], [0, 1, 2], [0, 1], [1, 2], [1, 2], [1, 2, 3], [2, 3]], modeLabel: "wide-gap crown hook", cameraDistance: 4.75, voxelScale: [0.99, 0.99, 0.9] as ScaleVector },
  { id: "study-14", gap: 2, rows: [[0, 1], [0, 1], [0, 1, 2], [0, 1], [1, 2], [1, 2, 3], [2, 3]], modeLabel: "wide-gap carve hook", cameraDistance: 4.8, voxelScale: [0.99, 0.99, 0.9] as ScaleVector },
  { id: "study-15", gap: 2, rows: [[0, 1], [0, 1], [0, 1, 2], [1, 2], [1, 2], [2, 3], [1, 2, 3]], modeLabel: "wide-gap observatory hook", cameraDistance: 4.85, voxelScale: [0.99, 0.99, 0.9] as ScaleVector },
  { id: "study-16", gap: 2, rows: [[0, 1], [0, 1, 2], [0, 1], [0, 1, 2], [1, 2], [2, 3], [2, 3]], modeLabel: "wide-gap direct hook", cameraDistance: 4.9, voxelScale: [1, 1, 0.9] as ScaleVector },
] as const;

const REGENTS_STUDIES: readonly StudySpec[] = REGENT_VARIANTS.map((variant) => ({
  id: variant.id,
  depth: 3,
  marks:
    "quadrantCells" in variant
      ? regentQuadrantMarks(variant.quadrantCells, variant.gap, 2)
      : regentMarks(variant.rows, variant.gap),
  modeLabel: variant.modeLabel,
  cameraDistance: variant.cameraDistance,
  tile: [10, 10, 5],
  voxelScale: variant.voxelScale,
}));

const REGENT_ELBOW_VARIANTS = [
  { id: "study-1", config: { outerSize: 11, innerSize: 6, innerOffsetX: 2, innerOffsetY: 4 }, modeLabel: "thin diagonal-symmetric elbows", cameraDistance: 4.48, voxelScale: [0.94, 0.94, 0.88] as ScaleVector },
  { id: "study-2", config: { outerSize: 10, innerSize: 6, innerOffsetX: 2, innerOffsetY: 4 }, modeLabel: "short crown elbows", cameraDistance: 4.5, voxelScale: [0.94, 0.94, 0.88] as ScaleVector },
  { id: "study-3", config: { outerSize: 10, innerSize: 5, innerOffsetX: 2, innerOffsetY: 4 }, modeLabel: "soft right fall", cameraDistance: 4.52, voxelScale: [0.94, 0.94, 0.88] as ScaleVector },
  { id: "study-4", config: { outerSize: 12, innerSize: 6, innerOffsetX: 2, innerOffsetY: 4 }, modeLabel: "long crown elbows", cameraDistance: 4.54, voxelScale: [0.95, 0.95, 0.88] as ScaleVector },
  { id: "study-5", config: { outerSize: 11, innerSize: 7, innerOffsetX: 2, innerOffsetY: 4 }, modeLabel: "long floor elbows", cameraDistance: 4.56, voxelScale: [0.95, 0.95, 0.88] as ScaleVector },
  {
    id: "study-6",
    config: {
      outerSize: 11,
      innerSize: 6,
      innerOffsetX: 2,
      innerOffsetY: 5,
      outerThickness: 2,
      outerCrookCells: [
        [2, 2],
        [2, 3],
        [3, 3],
      ] as const,
      innerCrookCells: [[1, 1]] as const,
    },
    modeLabel: "early bend elbows",
    cameraDistance: 4.58,
    voxelScale: [0.95, 0.95, 0.88] as ScaleVector,
  },
  { id: "study-7", config: { outerSize: 12, innerSize: 6, innerOffsetX: 2, innerOffsetY: 4 }, modeLabel: "wide chamber elbows", cameraDistance: 4.6, voxelScale: [0.95, 0.95, 0.88] as ScaleVector },
  { id: "study-8", config: { outerSize: 10, innerSize: 5, innerOffsetX: 3, innerOffsetY: 4 }, modeLabel: "quiet compact elbows", cameraDistance: 4.62, voxelScale: [0.95, 0.95, 0.88] as ScaleVector },
  { id: "study-9", config: { outerSize: 11, innerSize: 5, innerOffsetX: 3, innerOffsetY: 4 }, modeLabel: "narrow floor elbows", cameraDistance: 4.64, voxelScale: [0.96, 0.96, 0.88] as ScaleVector },
  { id: "study-10", config: { outerSize: 12, innerSize: 6, innerOffsetX: 3, innerOffsetY: 4 }, modeLabel: "stretched chamber elbows", cameraDistance: 4.66, voxelScale: [0.96, 0.96, 0.88] as ScaleVector },
  { id: "study-11", config: { outerSize: 12, innerSize: 6, innerOffsetX: 2, innerOffsetY: 5 }, modeLabel: "late outer exit", cameraDistance: 4.68, voxelScale: [0.96, 0.96, 0.88] as ScaleVector },
  { id: "study-12", config: { outerSize: 11, innerSize: 5, innerOffsetX: 2, innerOffsetY: 5 }, modeLabel: "short bottom sweep", cameraDistance: 4.7, voxelScale: [0.96, 0.96, 0.88] as ScaleVector },
  { id: "study-13", config: { outerSize: 10, innerSize: 6, innerOffsetX: 3, innerOffsetY: 4 }, modeLabel: "lean crown elbows", cameraDistance: 4.72, voxelScale: [0.96, 0.96, 0.88] as ScaleVector },
  { id: "study-14", config: { outerSize: 10, innerSize: 6, innerOffsetX: 2, innerOffsetY: 5 }, modeLabel: "tight right fall", cameraDistance: 4.74, voxelScale: [0.97, 0.97, 0.88] as ScaleVector },
  { id: "study-15", config: { outerSize: 12, innerSize: 7, innerOffsetX: 2, innerOffsetY: 4 }, modeLabel: "forward outer sweep", cameraDistance: 4.76, voxelScale: [0.97, 0.97, 0.88] as ScaleVector },
  { id: "study-16", config: { outerSize: 13, innerSize: 7, innerOffsetX: 2, innerOffsetY: 4 }, modeLabel: "stretched symmetric elbows", cameraDistance: 4.78, voxelScale: [0.97, 0.97, 0.88] as ScaleVector },
] as const;

const REGENT_ELBOW_STUDIES: readonly StudySpec[] = REGENT_ELBOW_VARIANTS.map((variant) => ({
  id: variant.id,
  depth: 3,
  marks: regentElbowMarks(variant.config),
  modeLabel: variant.modeLabel,
  cameraDistance: variant.cameraDistance,
  tile: [12, 12, 5],
  voxelScale: variant.voxelScale,
}));

const TECHTREE_VARIANTS = [
  { id: "study-1", modeLabel: "T alpha + T beta / close crop", cameraDistance: 5.3, cameraAngle: 332, voxelScale: [0.94, 0.94, 0.92] as ScaleVector },
  { id: "study-2", modeLabel: "T alpha + T beta / balanced crop", cameraDistance: 5.35, cameraAngle: 333, voxelScale: [0.94, 0.94, 0.92] as ScaleVector },
  { id: "study-3", modeLabel: "T alpha + T beta / quiet span", cameraDistance: 5.4, cameraAngle: 334, voxelScale: [0.95, 0.95, 0.92] as ScaleVector },
  { id: "study-4", modeLabel: "T alpha + T beta / flatter read", cameraDistance: 5.45, cameraAngle: 333, voxelScale: [0.95, 0.95, 0.92] as ScaleVector },
  { id: "study-5", modeLabel: "T alpha + T beta / compact field", cameraDistance: 5.5, cameraAngle: 332, voxelScale: [0.95, 0.95, 0.92] as ScaleVector },
  { id: "study-6", modeLabel: "T alpha + T beta / denser relief", cameraDistance: 5.55, cameraAngle: 334, voxelScale: [0.96, 0.96, 0.92] as ScaleVector },
  { id: "study-7", modeLabel: "T alpha + T beta / measured depth", cameraDistance: 5.6, cameraAngle: 335, voxelScale: [0.96, 0.96, 0.92] as ScaleVector },
  { id: "study-8", modeLabel: "T alpha + T beta / archival crop", cameraDistance: 5.65, cameraAngle: 334, voxelScale: [0.96, 0.96, 0.92] as ScaleVector },
  { id: "study-9", modeLabel: "T alpha + T beta / narrow chamber", cameraDistance: 5.7, cameraAngle: 335, voxelScale: [0.97, 0.97, 0.92] as ScaleVector },
  { id: "study-10", modeLabel: "T alpha + T beta / open field", cameraDistance: 5.75, cameraAngle: 336, voxelScale: [0.97, 0.97, 0.92] as ScaleVector },
  { id: "study-11", modeLabel: "T alpha + T beta / brighter lift", cameraDistance: 5.8, cameraAngle: 334, voxelScale: [0.97, 0.97, 0.92] as ScaleVector },
  { id: "study-12", modeLabel: "T alpha + T beta / observatory pull", cameraDistance: 5.85, cameraAngle: 335, voxelScale: [0.98, 0.98, 0.92] as ScaleVector },
  { id: "study-13", modeLabel: "T alpha + T beta / deep echo", cameraDistance: 5.9, cameraAngle: 336, voxelScale: [0.98, 0.98, 0.92] as ScaleVector },
  { id: "study-14", modeLabel: "T alpha + T beta / crisp relief", cameraDistance: 5.95, cameraAngle: 335, voxelScale: [0.98, 0.98, 0.92] as ScaleVector },
  { id: "study-15", modeLabel: "T alpha + T beta / calm plate", cameraDistance: 6, cameraAngle: 336, voxelScale: [0.99, 0.99, 0.92] as ScaleVector },
  { id: "study-16", modeLabel: "T alpha + T beta / direct mark", cameraDistance: 6.05, cameraAngle: 337, voxelScale: [0.99, 0.99, 0.92] as ScaleVector },
] as const;

const TECHTREE_LAYER_CELLS = techtreeAlphaBetaLayers({
  base: [0, 0],
  leftArm: 4,
  rightArm: 4,
  stem: 5,
});

const TECHTREE_STUDIES: readonly StudySpec[] = TECHTREE_VARIANTS.map((variant) => ({
  id: variant.id,
  depth: 4,
  layerCells: TECHTREE_LAYER_CELLS,
  modeLabel: variant.modeLabel,
  cameraDistance: variant.cameraDistance,
  cameraAngle: variant.cameraAngle,
  tile: [18, 20, 8],
  voxelScale: variant.voxelScale,
}));

function autolaunchMarks(axisHeight: number, axisWidth: number, ticks: readonly Cell[]): readonly Mark[] {
  return [
    line([0, 0], [0, axisHeight]),
    line([0, axisHeight], [axisWidth, axisHeight]),
    ...ticks.map(([x, y]) => rect(x, y, 2, 1)),
  ];
}

const AUTOLAUNCH_VARIANTS = [
  { id: "study-1", depth: 1, axisHeight: 4, axisWidth: 4, ticks: [[2, 3], [4, 2], [6, 1]] as const, modeLabel: "short-axis signal tape", cameraDistance: 5.45, voxelScale: [0.9, 0.9, 0.92] as ScaleVector },
  { id: "study-2", depth: 1, axisHeight: 4, axisWidth: 4, ticks: [[2, 3], [4, 2], [7, 1]] as const, modeLabel: "spread tape", cameraDistance: 5.5, voxelScale: [0.9, 0.9, 0.92] as ScaleVector },
  { id: "study-3", depth: 1, axisHeight: 4, axisWidth: 4, ticks: [[2, 3], [5, 2], [7, 1]] as const, modeLabel: "lifted market", cameraDistance: 5.55, voxelScale: [0.91, 0.91, 0.92] as ScaleVector },
  { id: "study-4", depth: 1, axisHeight: 4, axisWidth: 4, ticks: [[2, 2], [4, 1], [6, 0]] as const, modeLabel: "high board", cameraDistance: 5.6, voxelScale: [0.91, 0.91, 0.92] as ScaleVector },
  { id: "study-5", depth: 1, axisHeight: 4, axisWidth: 4, ticks: [[3, 3], [5, 2], [7, 1]] as const, modeLabel: "late climb", cameraDistance: 5.65, voxelScale: [0.92, 0.92, 0.92] as ScaleVector },
  { id: "study-6", depth: 1, axisHeight: 4, axisWidth: 5, ticks: [[2, 3], [4, 2], [6, 1]] as const, modeLabel: "extended floor", cameraDistance: 5.7, voxelScale: [0.92, 0.92, 0.92] as ScaleVector },
  { id: "study-7", depth: 2, axisHeight: 4, axisWidth: 4, ticks: [[2, 3], [4, 2], [6, 1]] as const, modeLabel: "stacked signal tape", cameraDistance: 5.75, voxelScale: [0.86, 0.86, 0.9] as ScaleVector, tile: [15, 15, 7] as [number, number, number] },
  { id: "study-8", depth: 2, axisHeight: 4, axisWidth: 4, ticks: [[2, 3], [5, 2], [7, 1]] as const, modeLabel: "stacked spread tape", cameraDistance: 5.8, voxelScale: [0.86, 0.86, 0.9] as ScaleVector, tile: [15, 15, 7] as [number, number, number] },
  { id: "study-9", depth: 2, axisHeight: 4, axisWidth: 4, ticks: [[2, 2], [4, 1], [6, 0]] as const, modeLabel: "stacked high board", cameraDistance: 5.85, voxelScale: [0.87, 0.87, 0.9] as ScaleVector, tile: [15, 15, 7] as [number, number, number] },
  { id: "study-10", depth: 2, axisHeight: 4, axisWidth: 5, ticks: [[2, 3], [4, 2], [7, 1]] as const, modeLabel: "stacked long floor", cameraDistance: 5.9, voxelScale: [0.87, 0.87, 0.9] as ScaleVector, tile: [15, 15, 7] as [number, number, number] },
  { id: "study-11", depth: 2, axisHeight: 4, axisWidth: 4, ticks: [[3, 3], [5, 2], [7, 1]] as const, modeLabel: "stacked late climb", cameraDistance: 5.95, voxelScale: [0.88, 0.88, 0.9] as ScaleVector, tile: [15, 15, 7] as [number, number, number] },
  { id: "study-12", depth: 2, axisHeight: 4, axisWidth: 5, ticks: [[2, 2], [4, 1], [6, 0]] as const, modeLabel: "stacked lift board", cameraDistance: 6, voxelScale: [0.88, 0.88, 0.9] as ScaleVector, tile: [15, 15, 7] as [number, number, number] },
  { id: "study-13", depth: 3, axisHeight: 4, axisWidth: 4, ticks: [[2, 3], [4, 2], [6, 1]] as const, modeLabel: "triple signal tape", cameraDistance: 6.05, voxelScale: [0.82, 0.82, 0.88] as ScaleVector, tile: [14, 14, 7] as [number, number, number] },
  { id: "study-14", depth: 3, axisHeight: 4, axisWidth: 4, ticks: [[2, 3], [5, 2], [7, 1]] as const, modeLabel: "triple spread tape", cameraDistance: 6.1, voxelScale: [0.82, 0.82, 0.88] as ScaleVector, tile: [14, 14, 7] as [number, number, number] },
  { id: "study-15", depth: 3, axisHeight: 4, axisWidth: 5, ticks: [[2, 2], [4, 1], [6, 0]] as const, modeLabel: "triple lift board", cameraDistance: 6.15, voxelScale: [0.83, 0.83, 0.88] as ScaleVector, tile: [14, 14, 7] as [number, number, number] },
  { id: "study-16", depth: 3, axisHeight: 4, axisWidth: 5, ticks: [[3, 3], [5, 2], [7, 1]] as const, modeLabel: "triple close tape", cameraDistance: 6.2, voxelScale: [0.83, 0.83, 0.88] as ScaleVector, tile: [14, 14, 7] as [number, number, number] },
] as const;

const AUTOLAUNCH_STUDIES: readonly StudySpec[] = AUTOLAUNCH_VARIANTS.map((variant) => ({
  id: variant.id,
  depth: variant.depth,
  marks: autolaunchMarks(variant.axisHeight, variant.axisWidth, variant.ticks),
  modeLabel: variant.modeLabel,
  cameraDistance: variant.cameraDistance,
  tile: "tile" in variant ? variant.tile : undefined,
  voxelScale: variant.voxelScale,
}));

export const logoStudies: Record<BrandId, readonly StudySpec[]> = {
  regents: REGENTS_STUDIES,
  "regent-elbow": REGENT_ELBOW_STUDIES,
  techtree: TECHTREE_STUDIES,
  autolaunch: AUTOLAUNCH_STUDIES,
};

export function voxelCountForStudy(brand: BrandId, variantId: string): number {
  const study = logoStudies[brand].find((entry) => entry.id === variantId);
  if (!study) throw new Error(`Unknown logo study: ${brand}/${variantId}`);
  return buildOccupancy(study).voxelCount;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function createEngine(
  tile: [number, number, number],
  cameraDistance: number,
  cameraAngle: number,
): HeerichInstance | null {
  if (!window.Heerich) return null;

  return new window.Heerich({
    tile,
    camera: { type: "oblique", angle: cameraAngle, distance: cameraDistance },
    style: {
      fill: BLUEPRINT_THEME.fill,
      stroke: BLUEPRINT_THEME.stroke,
      strokeWidth: 0.7,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    },
  }) as unknown as HeerichInstance;
}

function renderStudy(canvas: HTMLElement, study: StudySpec, theme: ThemeMode): void {
  const palette = THEME_PALETTES[theme];
  const occupancy = buildOccupancy(study);
  const occupancyKeys = new Set<string>();
  const tile = study.tile ?? DEFAULT_TILE;
  const engine = createEngine(tile, study.cameraDistance ?? 6, study.cameraAngle ?? DEFAULT_CAMERA_ANGLE);

  canvas.style.setProperty("--pp-logo-canvas-bg", palette.canvas);

  if (!engine) {
    canvas.innerHTML =
      `<div class="rg-scene-error"><strong>Heerich engine unavailable.</strong></div>`;
    return;
  }

  occupancy.cells.forEach(([x, y, z]) => {
    occupancyKeys.add(`${x}:${y}:${z}`);
  });

  engine.clear();
  engine.addGeometry({
    type: "fill",
    bounds: occupancy.bounds,
    test: (x: number, y: number, z: number) => occupancyKeys.has(`${x}:${y}:${z}`),
    style: {
      default: { fill: palette.fill, stroke: palette.stroke, strokeWidth: 0.7 },
      front: { fill: palette.fill },
      back: { fill: palette.fill },
      left: { fill: palette.left },
      right: { fill: palette.right },
      top: { fill: palette.top },
      bottom: { fill: palette.bottom },
    },
    scale: study.voxelScale ?? [0.94, 0.94, 0.96],
    scaleOrigin: [0.5, 0.5, 0.5],
  });

  canvas.innerHTML = engine.toSVG({
    padding: 18,
    faceAttributes: (face) => {
      const voxel = face.voxel;
      if (!voxel) return {};

      return {
        "data-logo-voxel-key": `${voxel.x}:${voxel.y}:${voxel.z}`,
      };
    },
  });
}

function parseViewBox(svg: SVGSVGElement): {
  minX: number;
  minY: number;
  width: number;
  height: number;
} {
  const viewBox = svg.getAttribute("viewBox");
  if (viewBox) {
    const values = viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter((value) => Number.isFinite(value));

    if (values.length === 4) {
      const [minX, minY, width, height] = values;
      return { minX, minY, width, height };
    }
  }

  const width = Number(svg.getAttribute("width")) || 640;
  const height = Number(svg.getAttribute("height")) || 640;
  return { minX: 0, minY: 0, width, height };
}

export function expandExportFrame(
  frame: { minX: number; minY: number; width: number; height: number },
  multiplier: number,
): {
  minX: number;
  minY: number;
  width: number;
  height: number;
} {
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    return frame;
  }

  const expandedWidth = frame.width * multiplier;
  const expandedHeight = frame.height * multiplier;

  return {
    minX: frame.minX - (expandedWidth - frame.width) / 2,
    minY: frame.minY - (expandedHeight - frame.height) / 2,
    width: expandedWidth,
    height: expandedHeight,
  };
}

function serializeSceneSvg(
  canvas: HTMLElement,
  theme: ThemeMode,
  frameMultiplier = 1,
): {
  markup: string;
  width: number;
  height: number;
} | null {
  const source = canvas.querySelector<SVGSVGElement>("svg");
  if (!source) return null;

  const svg = source.cloneNode(true) as SVGSVGElement;
  const { minX, minY, width, height } = expandExportFrame(
    parseViewBox(svg),
    frameMultiplier,
  );
  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  const serializer = new XMLSerializer();

  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);

  background.setAttribute("x", String(minX));
  background.setAttribute("y", String(minY));
  background.setAttribute("width", String(width));
  background.setAttribute("height", String(height));
  background.setAttribute("fill", THEME_PALETTES[theme].canvas);
  svg.insertBefore(background, svg.firstChild);

  return {
    markup: `<?xml version="1.0" encoding="UTF-8"?>${serializer.serializeToString(svg)}`,
    width,
    height,
  };
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function loadBlobImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to load the logo image for download."));
    };

    image.src = url;
  });
}

async function buildPngBlob(markup: string, width: number, height: number): Promise<Blob> {
  const svgBlob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const image = await loadBlobImage(svgBlob);
  const scale = 4;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = Math.max(1, Math.ceil(width * scale));
  canvas.height = Math.max(1, Math.ceil(height * scale));

  if (!context) {
    throw new Error("Unable to prepare a canvas for PNG export.");
  }

  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("PNG export failed."));
    }, "image/png");
  });
}

function downloadPulse(button: HTMLButtonElement): void {
  if (prefersReducedMotion()) return;

  animate(button, {
    scale: [1, 0.95, 1],
    duration: 220,
    ease: "outQuart",
  });
}

function downloadFilename(
  brand: BrandId,
  variant: string,
  theme: ThemeMode,
  format: DownloadFormat,
): string {
  return `${brand}-${variant}-${theme}.${format}`;
}

async function downloadStudy(
  canvas: HTMLElement,
  brand: BrandId,
  variant: string,
  theme: ThemeMode,
  format: DownloadFormat,
  button: HTMLButtonElement,
): Promise<void> {
  const serialized = serializeSceneSvg(canvas, theme, format === "png" ? 1.5 : 1);
  if (!serialized) return;

  const { markup, width, height } = serialized;
  const filename = downloadFilename(brand, variant, theme, format);

  if (format === "svg") {
    triggerBlobDownload(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }), filename);
    downloadPulse(button);
    return;
  }

  const pngBlob = await buildPngBlob(markup, width, height);
  triggerBlobDownload(pngBlob, filename);
  downloadPulse(button);
}

function updateCardMeta(card: HTMLElement, study: StudySpec): void {
  const countNode = card.querySelector<HTMLElement>("[data-logo-voxel-count]");
  const depthNode = card.querySelector<HTMLElement>("[data-logo-depth]");
  const modeNode = card.querySelector<HTMLElement>("[data-logo-mode]");
  const voxelCount = buildOccupancy(study).voxelCount;

  if (countNode) countNode.textContent = String(voxelCount);
  if (depthNode) depthNode.textContent = `${study.depth} layer${study.depth > 1 ? "s" : ""}`;
  if (modeNode) modeNode.textContent = study.modeLabel;
}

function applyToggleState(root: HTMLElement, theme: ThemeMode): void {
  root.dataset.logoTheme = theme;

  root.querySelectorAll<HTMLButtonElement>("[data-logo-theme-button]").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.logoThemeValue === theme),
    );
  });
}

function animateCanvases(canvases: HTMLElement[]): void {
  if (prefersReducedMotion()) return;

  animate(canvases, {
    opacity: [0.4, 1],
    scale: [0.97, 1],
    translateY: [6, 0],
    duration: 360,
    ease: "outQuart",
    delay: (_target: unknown, index: number) => index * 24,
  });
}

function resolveStudy(brand: string | undefined, variant: string | undefined): StudySpec | null {
  if (!brand || !variant) return null;
  if (!(brand in logoStudies)) return null;

  return logoStudies[brand as BrandId].find((study) => study.id === variant) ?? null;
}

function renderAllStudies(root: HTMLElement, theme: ThemeMode, withAnimation: boolean): void {
  const canvases = Array.from(root.querySelectorAll<HTMLElement>("[data-logo-scene]"));

  canvases.forEach((canvas) => {
    const study = resolveStudy(canvas.dataset.logoBrand, canvas.dataset.logoVariant);
    if (!study) return;
    renderStudy(canvas, study, theme);
    updateCardMeta(canvas.closest("[data-logo-card]") as HTMLElement, study);
  });

  if (withAnimation) animateCanvases(canvases);
}

function pulseLogoVoxel(scene: HTMLElement, voxelKey: string): void {
  const faces = Array.from(scene.querySelectorAll<SVGElement>("[data-logo-voxel-key]")).filter(
    (face) => face.dataset.logoVoxelKey === voxelKey,
  );

  if (faces.length === 0) return;
  if (scene.dataset.logoPulseKey === voxelKey) return;

  scene.dataset.logoPulseKey = voxelKey;

  animate(faces, {
    scale: [1, 0.0001, 1],
    opacity: [1, 0.04, 1],
    duration: LOGO_CLICK_DISSOLVE_MS,
    ease: "inOutQuad",
    transformOrigin: "center center",
    onComplete: () => {
      if (scene.dataset.logoPulseKey === voxelKey) {
        delete scene.dataset.logoPulseKey;
      }
    },
  });
}

function pulseLogoVoxelFromEvent(root: HTMLElement, event: PointerEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest("[data-logo-download], [data-logo-theme-button]")) return;

  const voxel = target.closest<HTMLElement>("[data-logo-voxel-key]");
  const scene = target.closest<HTMLElement>("[data-logo-scene]");
  const voxelKey = voxel?.dataset.logoVoxelKey;

  if (!scene || !voxelKey || !root.contains(scene)) return;
  pulseLogoVoxel(scene, voxelKey);
}

function validateStudies(): void {
  (Object.entries(logoStudies) as Array<[BrandId, readonly StudySpec[]]>).forEach(([brand, studies]) => {
    studies.forEach((study) => {
      const { cells, voxelCount } = buildOccupancy(study);

      if (brand === "regents" && study.id !== "study-1" && voxelCount !== 192) {
        throw new Error(`Logo study ${brand}/${study.id} has ${voxelCount} voxels. Expected exactly 192.`);
      }

      if (brand === "regents" && study.id === "study-1" && voxelCount <= 192) {
        throw new Error(`Logo study ${brand}/${study.id} must stay denser than the simpler rotated hooks.`);
      }

      if (brand === "regents" && study.depth !== 3) {
        throw new Error(`Logo study ${brand}/${study.id} must use 3 layers.`);
      }

      if (
        brand === "regents" &&
        cells.some(([x, y]) => x === 0 || y === 0)
      ) {
        throw new Error(`Logo study ${brand}/${study.id} must keep blank space across both center axes.`);
      }

      if (brand === "regent-elbow" && study.depth !== 3) {
        throw new Error(`Logo study ${brand}/${study.id} must use 3 layers.`);
      }

      if (brand === "techtree" && study.depth !== 4) {
        throw new Error(`Logo study ${brand}/${study.id} must use 4 layers.`);
      }

      if (brand === "techtree" && voxelCount !== 88) {
        throw new Error(
          `Logo study ${brand}/${study.id} has ${voxelCount} voxels. Expected exactly 88.`,
        );
      }

      if (
        brand === "techtree" &&
        (
          JSON.stringify(study.layerCells?.[0]) !== JSON.stringify(study.layerCells?.[1]) ||
          JSON.stringify(study.layerCells?.[2]) !== JSON.stringify(study.layerCells?.[3])
        )
      ) {
        throw new Error(`Logo study ${brand}/${study.id} must use identical alpha and beta layer pairs.`);
      }

      if (voxelCount <= 0) {
        throw new Error(`Logo study ${brand}/${study.id} must contain voxels.`);
      }
    });
  });
}

validateStudies();

export function mountLogoStudies(root: HTMLElement): () => void {
  let theme = (root.dataset.logoTheme as ThemeMode | undefined) ?? "blueprint";
  let pointerDown = false;

  const selectTheme = (nextTheme: ThemeMode) => {
    theme = nextTheme;
    applyToggleState(root, theme);
    renderAllStudies(root, theme, true);
  };

  const onClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const themeButton = target.closest<HTMLButtonElement>("[data-logo-theme-button]");
    if (themeButton) {
      const nextTheme =
        (themeButton.dataset.logoThemeValue as ThemeMode | undefined) ?? "blueprint";

      if (nextTheme !== theme) selectTheme(nextTheme);
      return;
    }

    const downloadButton = target.closest<HTMLButtonElement>("[data-logo-download]");
    if (!downloadButton) return;

    const card = downloadButton.closest<HTMLElement>("[data-logo-card]");
    const canvas = card?.querySelector<HTMLElement>("[data-logo-scene]");
    const brand = canvas?.dataset.logoBrand as BrandId | undefined;
    const variant = canvas?.dataset.logoVariant;
    const format =
      (downloadButton.dataset.logoDownload as DownloadFormat | undefined) ?? "png";

    if (!canvas || !brand || !variant) return;

    void downloadStudy(canvas, brand, variant, theme, format, downloadButton).catch((error) => {
      console.error(error);
    });
  };

  const onPointerDown = (event: PointerEvent) => {
    pointerDown = true;
    pulseLogoVoxelFromEvent(root, event);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!pointerDown) return;
    pulseLogoVoxelFromEvent(root, event);
  };

  const onPointerUp = () => {
    pointerDown = false;
  };

  applyToggleState(root, theme);
  renderAllStudies(root, theme, false);
  root.addEventListener("click", onClick);
  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
  window.addEventListener("blur", onPointerUp);

  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("pointerdown", onPointerDown);
    root.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    window.removeEventListener("blur", onPointerUp);
  };
}

export const LogoStudiesHook = {
  mounted(this: HookContext) {
    this.__logosCleanup?.();
    this.__logosCleanup = mountLogoStudies(this.el);
  },
  updated(this: HookContext) {
    this.__logosCleanup?.();
    this.__logosCleanup = mountLogoStudies(this.el);
  },
  destroyed(this: HookContext) {
    this.__logosCleanup?.();
    this.__logosCleanup = undefined;
  },
};
