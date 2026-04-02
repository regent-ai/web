import { animate } from "animejs";
import { RegentSceneRenderer } from "../regent/js/regent_scene_renderer";
import type { ScaleVector, SceneSpec, StyleSpec } from "../regent/js/regent_scene_protocol";
import { COLOR_MODE_CHANGE_EVENT, type ColorMode } from "./color_mode";

type FooterVoxelCleanup = {
  destroy(): void;
};

type FooterVoxelPalette = {
  top: string;
  left: string;
  right: string;
  stroke: string;
};

type FooterVoxelButton = HTMLButtonElement & {
  __footerVoxelCleanup?: FooterVoxelCleanup;
};

type FooterVoxelHookContext = {
  el: FooterVoxelButton;
  __footerVoxelCleanup?: FooterVoxelCleanup;
};

const LIGHT_PALETTE: FooterVoxelPalette = {
  top: "#fbfeff",
  left: "#d7e4f0",
  right: "#eef4fa",
  stroke: "#5e7b93",
};

const DARK_PALETTE: FooterVoxelPalette = {
  top: "#6aa6d9",
  left: "#1e4f79",
  right: "#2e6e9b",
  stroke: "#143450",
};

function footerVoxelMotionReduced(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((part) => `${part}${part}`).join("")
    : normalized;

  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function rgbToHex([red, green, blue]: [number, number, number]): string {
  return `#${[red, green, blue].map((channel) => clampChannel(channel).toString(16).padStart(2, "0")).join("")}`;
}

function mixHex(from: string, to: string, progress: number): string {
  const start = hexToRgb(from);
  const finish = hexToRgb(to);

  return rgbToHex([
    start[0] + (finish[0] - start[0]) * progress,
    start[1] + (finish[1] - start[1]) * progress,
    start[2] + (finish[2] - start[2]) * progress,
  ] as [number, number, number]);
}

function mixPalette(progress: number): FooterVoxelPalette {
  return {
    top: mixHex(LIGHT_PALETTE.top, DARK_PALETTE.top, progress),
    left: mixHex(LIGHT_PALETTE.left, DARK_PALETTE.left, progress),
    right: mixHex(LIGHT_PALETTE.right, DARK_PALETTE.right, progress),
    stroke: mixHex(LIGHT_PALETTE.stroke, DARK_PALETTE.stroke, progress),
  };
}

function voxelScale(): ScaleVector {
  return [1.08, 1.08, 1.08];
}

function sceneStyle(palette: FooterVoxelPalette): StyleSpec {
  return {
    default: { fill: palette.right, stroke: palette.stroke, strokeWidth: 0.9, opacity: 1 },
    top: { fill: palette.top, stroke: palette.stroke, strokeWidth: 0.9, opacity: 1 },
    left: { fill: palette.left, stroke: palette.stroke, strokeWidth: 0.9, opacity: 1 },
    right: { fill: palette.right, stroke: palette.stroke, strokeWidth: 0.9, opacity: 1 },
  };
}

function footerVoxelScene(palette: FooterVoxelPalette): SceneSpec {
  const targetId = "platform:footer-voxel:classic";

  return {
    app: "platform",
    theme: "platform",
    activeFace: "entry",
    sceneVersion: 1,
    camera: { type: "oblique", angle: 315, distance: 18 },
    cameraPresets: {
      overview: {
        type: "oblique",
        angle: 315,
        distance: 18,
        zoom: 2.55,
        padding: 2,
      },
    },
    activeCameraPreset: "overview",
    cameraTargetId: targetId,
    faces: [
      {
        id: "entry",
        title: "Footer voxel",
        sigil: "seal",
        landmarkTargetId: targetId,
        commands: [
          {
            id: `${targetId}:core`,
            primitive: "box",
            op: "add",
            position: [0, 0, 0],
            size: [1, 1, 1],
            style: sceneStyle(palette),
            targetId,
            scale: voxelScale(),
            scaleOrigin: [0.5, 0.5, 0.5],
          },
        ],
        markers: [],
      },
    ],
  };
}

function setButtonState(button: HTMLButtonElement, mode: ColorMode): void {
  const dark = mode === "dark";

  button.dataset.voxelMode = mode;
  button.setAttribute("aria-pressed", dark ? "true" : "false");
  button.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
}

function mountFooterVoxel(button: FooterVoxelButton): FooterVoxelCleanup {
  const scene = button.querySelector<HTMLElement>("[data-footer-voxel-scene]");

  if (!scene) {
    return { destroy() {} };
  }

  const renderer = new RegentSceneRenderer(scene);
  const doc = button.ownerDocument;
  let mode: ColorMode =
    doc.documentElement.dataset.colorMode === "dark" ? "dark" : "light";
  let dark = mode === "dark";
  let colorProgress = dark ? 1 : 0;
  let angle = 0;
  let direction = dark ? -1 : 1;
  let spinAnimation: ReturnType<typeof animate> | null = null;
  let colorAnimation: ReturnType<typeof animate> | null = null;

  const renderVoxel = () => {
    renderer.render(footerVoxelScene(mixPalette(colorProgress)));
  };

  const applyRotation = () => {
    scene.style.transform = `rotate(${angle}deg)`;
  };

  const startSpin = () => {
    spinAnimation?.cancel();
    applyRotation();

    if (footerVoxelMotionReduced()) return;

    const spinState = { angle };

    spinAnimation = animate(spinState, {
      angle: angle + direction * 360,
      duration: 12000,
      ease: "linear",
      loop: true,
      onUpdate: () => {
        angle = spinState.angle;
        applyRotation();
      },
    });
  };

  const animateColorTo = (target: number) => {
    colorAnimation?.cancel();

    if (footerVoxelMotionReduced()) {
      colorProgress = target;
      renderVoxel();
      return;
    }

    const colorState = { mix: colorProgress };

    colorAnimation = animate(colorState, {
      mix: target,
      duration: 420,
      ease: "inOutQuad",
      onUpdate: () => {
        colorProgress = colorState.mix;
        renderVoxel();
      },
      onComplete: () => {
        colorProgress = target;
        renderVoxel();
      },
    });
  };

  const applyMode = (nextMode: ColorMode) => {
    mode = nextMode;
    dark = nextMode === "dark";
    direction = dark ? -1 : 1;
    setButtonState(button, nextMode);
    startSpin();
    animateColorTo(dark ? 1 : 0);
  };

  const onColorModeChange = (event: Event) => {
    const nextMode = (event as CustomEvent<{ mode: ColorMode }>).detail?.mode === "dark"
      ? "dark"
      : "light";

    applyMode(nextMode);
  };

  setButtonState(button, mode);
  renderVoxel();
  startSpin();
  doc.addEventListener(COLOR_MODE_CHANGE_EVENT, onColorModeChange as EventListener);

  return {
    destroy() {
      doc.removeEventListener(COLOR_MODE_CHANGE_EVENT, onColorModeChange as EventListener);
      spinAnimation?.cancel();
      colorAnimation?.cancel();
      renderer.destroy();
    },
  };
}

export const FooterVoxelHook = {
  mounted(this: FooterVoxelHookContext) {
    this.__footerVoxelCleanup?.destroy();
    this.__footerVoxelCleanup = mountFooterVoxel(this.el);
  },
  updated(this: FooterVoxelHookContext) {
    this.__footerVoxelCleanup?.destroy();
    this.__footerVoxelCleanup = mountFooterVoxel(this.el);
  },
  destroyed(this: FooterVoxelHookContext) {
    this.__footerVoxelCleanup?.destroy();
    delete this.__footerVoxelCleanup;
  },
};
