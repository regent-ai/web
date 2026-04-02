type ProceduralDemoKind = "fill" | "style" | "scale";

type HeerichWithProcedural = {
  clear(): void;
  addGeometry(input: Record<string, unknown>): void;
  applyGeometry(input: Record<string, unknown>): void;
  toSVG(input?: Record<string, unknown>): string;
};

function proceduralEngine(): HeerichWithProcedural | null {
  if (!window.Heerich) return null;

  return new window.Heerich({
    tile: [26, 26],
    camera: { type: "oblique", angle: 315, distance: 22 },
    style: {
      fill: "rgba(212, 221, 236, 0.84)",
      stroke: "#576579",
      strokeWidth: 0.5,
    },
  }) as unknown as HeerichWithProcedural;
}

function renderFillDemo(engine: HeerichWithProcedural): void {
  engine.addGeometry({
    type: "fill",
    bounds: [[-8, -3, -8], [8, 3, 8]],
    test: (x: number, y: number, z: number) => {
      const R = 6;
      const r = 2;
      const q = Math.sqrt(x * x + z * z) - R;
      return q * q + y * y <= r * r;
    },
    style: {
      default: { fill: "rgba(191, 166, 108, 0.86)", stroke: "#66512b" },
      top: { fill: "rgba(214, 188, 126, 0.92)" },
    },
  });
}

function renderStyleDemo(engine: HeerichWithProcedural): void {
  engine.addGeometry({
    type: "box",
    center: [3, 3, 3],
    size: 7,
    style: {
      default: (x: number, y: number, z: number) => {
        const hue = 32 + x * 18 + z * 6;
        const lightness = 62 - y * 2;
        return {
          fill: `hsl(${hue} 58% ${lightness}%)`,
          stroke: `hsl(${hue} 36% ${Math.max(lightness - 24, 18)}%)`,
        };
      },
    },
  });
}

function renderScaleDemo(engine: HeerichWithProcedural): void {
  engine.addGeometry({
    type: "box",
    center: [2, 2, 2],
    size: 6,
    style: {
      default: { fill: "rgba(125, 187, 255, 0.82)", stroke: "#315f8f" },
    },
    scale: (x: number, y: number, z: number) => {
      void x;
      void z;
      const t = 1 - y / 6;
      const width = 1 - t * 0.5;
      return [width, 1, width];
    },
    scaleOrigin: [0.5, 1, 0.5],
  });
}

export function mountProceduralHeerichDemo(root: HTMLElement): void {
  const engine = proceduralEngine();
  if (!engine) {
    root.innerHTML = `<div class="rg-scene-error"><strong>Heerich engine unavailable.</strong></div>`;
    return;
  }

  const kind = (root.dataset.demoKind ?? "fill") as ProceduralDemoKind;
  root.innerHTML = "";

  switch (kind) {
    case "fill":
      renderFillDemo(engine);
      break;
    case "style":
      renderStyleDemo(engine);
      break;
    case "scale":
      renderScaleDemo(engine);
      break;
  }

  root.innerHTML = engine.toSVG({ padding: 24 });
}
