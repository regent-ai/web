import { animate } from "animejs";
import type { HeerichInstance } from "../regent/js/heerich_types";
import { prefersReducedMotion } from "../regent/js/regent_motion";
import { COLOR_MODE_CHANGE_EVENT, type ColorMode } from "./color_mode";

type VoxelBackgroundVariant = "home" | "dashboard";

type LayerPalette = {
  top: string;
  left: string;
  right: string;
  stroke: string;
  opacity: number;
};

type VoxelBackgroundPalette = {
  base: LayerPalette;
  accent: LayerPalette;
  lattice: LayerPalette;
};

type VoxelBackgroundCleanup = {
  destroy(): void;
};

type VoxelBackgroundHost = HTMLElement & {
  __voxelBackgroundCleanup?: VoxelBackgroundCleanup;
};

type VoxelBackgroundHookContext = {
  el: VoxelBackgroundHost;
  __voxelBackgroundCleanup?: VoxelBackgroundCleanup;
};

type VoxelGridShape = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  cols: number;
  rows: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function readVariant(el: HTMLElement): VoxelBackgroundVariant {
  return el.dataset.voxelBackground === "dashboard" ? "dashboard" : "home";
}

function readMode(doc: Document): ColorMode {
  return doc.documentElement.dataset.colorMode === "dark" ? "dark" : "light";
}

function paletteFor(mode: ColorMode, variant: VoxelBackgroundVariant): VoxelBackgroundPalette {
  if (mode === "dark") {
    return variant === "home"
      ? {
          base: {
            top: "rgba(132, 173, 204, 0.7)",
            left: "rgba(26, 71, 103, 0.64)",
            right: "rgba(51, 106, 143, 0.66)",
            stroke: "rgba(15, 38, 58, 0.84)",
            opacity: 0.9,
          },
          accent: {
            top: "rgba(230, 199, 126, 0.9)",
            left: "rgba(152, 115, 50, 0.8)",
            right: "rgba(195, 159, 91, 0.84)",
            stroke: "rgba(74, 53, 20, 0.84)",
            opacity: 0.94,
          },
          lattice: {
            top: "rgba(219, 235, 247, 0.62)",
            left: "rgba(71, 108, 138, 0.56)",
            right: "rgba(112, 152, 186, 0.6)",
            stroke: "rgba(19, 45, 66, 0.7)",
            opacity: 0.78,
          },
        }
      : {
          base: {
            top: "rgba(142, 182, 212, 0.68)",
            left: "rgba(24, 67, 98, 0.6)",
            right: "rgba(56, 114, 153, 0.62)",
            stroke: "rgba(16, 41, 62, 0.84)",
            opacity: 0.88,
          },
          accent: {
            top: "rgba(228, 239, 248, 0.68)",
            left: "rgba(82, 123, 154, 0.54)",
            right: "rgba(137, 182, 214, 0.58)",
            stroke: "rgba(23, 55, 81, 0.72)",
            opacity: 0.82,
          },
          lattice: {
            top: "rgba(204, 178, 112, 0.66)",
            left: "rgba(126, 94, 39, 0.6)",
            right: "rgba(164, 131, 69, 0.62)",
            stroke: "rgba(62, 43, 17, 0.72)",
            opacity: 0.78,
          },
        };
  }

  return variant === "home"
    ? {
        base: {
          top: "rgba(255, 250, 239, 0.86)",
          left: "rgba(215, 197, 162, 0.82)",
          right: "rgba(240, 226, 197, 0.84)",
          stroke: "rgba(111, 90, 53, 0.4)",
          opacity: 0.86,
        },
        accent: {
          top: "rgba(223, 193, 126, 0.92)",
          left: "rgba(182, 145, 76, 0.84)",
          right: "rgba(208, 173, 106, 0.88)",
          stroke: "rgba(116, 86, 34, 0.52)",
          opacity: 0.92,
        },
        lattice: {
          top: "rgba(215, 231, 243, 0.8)",
          left: "rgba(143, 174, 197, 0.74)",
          right: "rgba(186, 210, 227, 0.78)",
          stroke: "rgba(61, 95, 122, 0.44)",
          opacity: 0.72,
        },
      }
    : {
        base: {
          top: "rgba(244, 249, 252, 0.82)",
          left: "rgba(188, 206, 219, 0.74)",
          right: "rgba(224, 236, 244, 0.78)",
          stroke: "rgba(62, 93, 117, 0.42)",
          opacity: 0.82,
        },
        accent: {
          top: "rgba(216, 187, 120, 0.88)",
          left: "rgba(170, 136, 72, 0.76)",
          right: "rgba(202, 168, 104, 0.8)",
          stroke: "rgba(113, 82, 31, 0.52)",
          opacity: 0.84,
        },
        lattice: {
          top: "rgba(230, 239, 247, 0.82)",
          left: "rgba(170, 192, 210, 0.72)",
          right: "rgba(211, 226, 238, 0.76)",
          stroke: "rgba(78, 108, 130, 0.42)",
          opacity: 0.72,
        },
      };
}

function sceneStyle(layer: LayerPalette) {
  return {
    default: {
      fill: layer.right,
      stroke: layer.stroke,
      strokeWidth: 0.82,
      opacity: layer.opacity,
    },
    top: {
      fill: layer.top,
      stroke: layer.stroke,
      strokeWidth: 0.82,
      opacity: layer.opacity,
    },
    left: {
      fill: layer.left,
      stroke: layer.stroke,
      strokeWidth: 0.82,
      opacity: layer.opacity,
    },
    right: {
      fill: layer.right,
      stroke: layer.stroke,
      strokeWidth: 0.82,
      opacity: layer.opacity,
    },
  };
}

function tileForWidth(width: number, variant: VoxelBackgroundVariant): [number, number] {
  const side =
    variant === "home"
      ? clamp(Math.round(width / 28), 30, 46)
      : clamp(Math.round(width / 31), 28, 42);

  return [side, side];
}

function gridShape(width: number, height: number, tile: number): VoxelGridShape {
  const cols = Math.max(18, Math.ceil(width / (tile * 0.62)) + 10);
  const rows = Math.max(10, Math.ceil(height / (tile * 0.7)) + 8);
  const minX = -Math.ceil(cols * 0.56);
  const maxX = minX + cols - 1;
  const minY = -Math.ceil(rows * 0.5);
  const maxY = minY + rows - 1;

  return { minX, maxX, minY, maxY, cols, rows };
}

function normalizeCell(x: number, y: number, shape: VoxelGridShape): [number, number] {
  return [x - shape.minX, y - shape.minY];
}

function buildPattern(
  variant: VoxelBackgroundVariant,
  shape: VoxelGridShape,
): {
  base: (x: number, y: number, z: number) => boolean;
  accent: (x: number, y: number, z: number) => boolean;
  lattice: (x: number, y: number, z: number) => boolean;
} {
  const diagonalSlopeA = variant === "home" ? 0.32 : 0.24;
  const diagonalSlopeB = variant === "home" ? 0.26 : 0.2;
  const bandWidth = variant === "home" ? 1 : 2;

  const bandA = (gx: number, gy: number) =>
    Math.abs(gy - Math.round(shape.rows * 0.18 + gx * diagonalSlopeA)) <= bandWidth;
  const bandB = (gx: number, gy: number) =>
    Math.abs(gy - Math.round(shape.rows * 0.82 - gx * diagonalSlopeB)) <= bandWidth;
  const homePillars = (gx: number, gy: number) =>
    gx % 7 === 0 && gy >= Math.floor(shape.rows * 0.44) && gy <= shape.rows - 2;
  const dashboardRails = (gx: number, gy: number) =>
    gy % 4 === 0 && gx >= Math.floor(shape.cols * 0.2) && gx <= Math.floor(shape.cols * 0.84);
  const notchMask = (gx: number, gy: number) => (gx * 5 + gy * 7) % 9 !== 0;

  return {
    base: (x, y, z) => {
      if (z !== 0) return false;
      const [gx, gy] = normalizeCell(x, y, shape);
      const structural =
        bandA(gx, gy) ||
        bandB(gx, gy) ||
        (variant === "home" ? homePillars(gx, gy) : dashboardRails(gx, gy));

      return structural && notchMask(gx, gy);
    },
    accent: (x, y, z) => {
      if (z !== 0) return false;
      const [gx, gy] = normalizeCell(x, y, shape);
      const highlighted =
        (bandA(gx, gy) && gx % 6 === 2) ||
        (bandB(gx, gy) && gx % 6 === 5) ||
        (variant === "dashboard" &&
          gx >= Math.floor(shape.cols * 0.32) &&
          gx <= Math.floor(shape.cols * 0.74) &&
          gy === Math.floor(shape.rows * 0.52) &&
          gx % 3 !== 0);

      return highlighted;
    },
    lattice: (x, y, z) => {
      if (z !== 0) return false;
      const [gx, gy] = normalizeCell(x, y, shape);
      const edgeBands =
        (gx < Math.floor(shape.cols * 0.2) && gy % 3 === 0) ||
        (gx > Math.floor(shape.cols * 0.78) && gy % 3 === 1);
      const centralBrace =
        variant === "home"
          ? gy === Math.floor(shape.rows * 0.34) && gx % 4 === 0
          : gx === Math.floor(shape.cols * 0.46) && gy % 3 !== 1;

      return edgeBands || centralBrace;
    },
  };
}

function createEngine(tile: [number, number], variant: VoxelBackgroundVariant): HeerichInstance | null {
  if (!window.Heerich) return null;

  return new window.Heerich({
    tile,
    camera: {
      type: "oblique",
      angle: 315,
      distance: variant === "home" ? 28 : 26,
    },
  }) as unknown as HeerichInstance;
}

class VoxelBackgroundController implements VoxelBackgroundCleanup {
  private readonly doc: Document;
  private readonly variant: VoxelBackgroundVariant;
  private currentMode: ColorMode;
  private resizeObserver: ResizeObserver | null = null;
  private rerenderFrame: number | null = null;
  private enterAnimation: ReturnType<typeof animate> | null = null;
  private driftAnimation: ReturnType<typeof animate> | null = null;
  private firstPaint = true;

  constructor(private readonly el: VoxelBackgroundHost) {
    this.doc = el.ownerDocument;
    this.variant = readVariant(el);
    this.currentMode = readMode(this.doc);
  }

  mount(): void {
    this.render();
    this.resizeObserver = new ResizeObserver(() => this.queueRender());
    this.resizeObserver.observe(this.el);
    this.doc.addEventListener(COLOR_MODE_CHANGE_EVENT, this.handleColorModeChange as EventListener);
  }

  destroy(): void {
    this.doc.removeEventListener(
      COLOR_MODE_CHANGE_EVENT,
      this.handleColorModeChange as EventListener,
    );
    this.resizeObserver?.disconnect();
    if (this.rerenderFrame !== null) window.cancelAnimationFrame(this.rerenderFrame);
    this.enterAnimation?.cancel();
    this.driftAnimation?.cancel();
    this.el.replaceChildren();
  }

  private readonly handleColorModeChange = (event: Event) => {
    const nextMode = (event as CustomEvent<{ mode: ColorMode }>).detail?.mode === "dark"
      ? "dark"
      : "light";

    if (nextMode === this.currentMode) return;
    this.currentMode = nextMode;
    this.queueRender();
  };

  private queueRender(): void {
    if (this.rerenderFrame !== null) window.cancelAnimationFrame(this.rerenderFrame);
    this.rerenderFrame = window.requestAnimationFrame(() => {
      this.rerenderFrame = null;
      this.render();
    });
  }

  private render(): void {
    const width = this.el.clientWidth || 1200;
    const height = this.el.clientHeight || (this.variant === "home" ? 760 : 680);
    const tile = tileForWidth(width, this.variant);
    const engine = createEngine(tile, this.variant);

    if (!engine) {
      this.el.replaceChildren();
      return;
    }

    const shape = gridShape(width, height, tile[0]);
    const palette = paletteFor(this.currentMode, this.variant);
    const pattern = buildPattern(this.variant, shape);
    const bounds: [[number, number, number], [number, number, number]] = [
      [shape.minX, shape.minY, 0],
      [shape.maxX, shape.maxY, 0],
    ];

    engine.addGeometry({
      type: "fill",
      bounds,
      test: pattern.base,
      style: sceneStyle(palette.base),
      scale: [1.2, 1.2, 1],
      scaleOrigin: [0.5, 0.5, 0.5],
    });

    engine.addGeometry({
      type: "fill",
      bounds,
      test: pattern.lattice,
      style: sceneStyle(palette.lattice),
      scale: [1.12, 1.12, 1],
      scaleOrigin: [0.5, 0.5, 0.5],
    });

    engine.addGeometry({
      type: "fill",
      bounds,
      test: pattern.accent,
      style: sceneStyle(palette.accent),
      scale: [1.18, 1.18, 1],
      scaleOrigin: [0.5, 0.5, 0.5],
    });

    const frame = this.doc.createElement("div");
    frame.className = "pp-voxel-background-frame";
    frame.innerHTML = engine.toSVG({ padding: 12 });
    this.el.replaceChildren(frame);

    const svg = frame.querySelector<SVGSVGElement>("svg");
    if (!svg) return;

    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("pp-voxel-background-svg");

    this.enterAnimation?.cancel();
    this.driftAnimation?.cancel();

    if (this.firstPaint && !prefersReducedMotion()) {
      frame.style.opacity = "0";
      frame.style.transform = "translate3d(0, 22px, 0) scale(0.985)";
      this.enterAnimation = animate(frame, {
        opacity: [0, 1],
        translateY: [22, 0],
        scale: [0.985, 1],
        duration: this.variant === "home" ? 880 : 760,
        ease: "outExpo",
      });
    } else {
      frame.style.opacity = "1";
      frame.style.transform = "none";
    }

    if (!prefersReducedMotion()) {
      const drift = this.variant === "home"
        ? { x: [-14, 10], y: [8, -10], rotate: [-1.2, 1.1], scale: [1.02, 1.05] }
        : { x: [-10, 8], y: [6, -8], rotate: [-0.8, 0.8], scale: [1.015, 1.04] };

      this.driftAnimation = animate(svg, {
        translateX: drift.x,
        translateY: drift.y,
        rotate: drift.rotate,
        scale: drift.scale,
        duration: this.variant === "home" ? 18000 : 16000,
        ease: "inOutSine",
        alternate: true,
        loop: true,
      });
    } else {
      svg.style.transform = "scale(1.02)";
    }

    this.firstPaint = false;
  }
}

function mountVoxelBackground(el: VoxelBackgroundHost): VoxelBackgroundCleanup {
  const controller = new VoxelBackgroundController(el);
  controller.mount();
  return controller;
}

export const VoxelBackgroundHook = {
  mounted(this: VoxelBackgroundHookContext) {
    this.__voxelBackgroundCleanup?.destroy();
    this.__voxelBackgroundCleanup = mountVoxelBackground(this.el);
  },
  updated(this: VoxelBackgroundHookContext) {
    this.__voxelBackgroundCleanup?.destroy();
    this.__voxelBackgroundCleanup = mountVoxelBackground(this.el);
  },
  destroyed(this: VoxelBackgroundHookContext) {
    this.__voxelBackgroundCleanup?.destroy();
    delete this.__voxelBackgroundCleanup;
  },
};
