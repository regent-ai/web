import type { HeerichInstance } from "../regent/js/heerich_types";
import {
  DEFAULT_HOME_CAMERA_STATE,
  subscribeHomeCameraState,
  type HomeCameraState,
} from "../regent/js/home_camera_state";
import { prefersReducedMotion } from "../regent/js/regent_motion";
import type {
  BoxCommandSpec,
  FaceSpec,
  SceneSpec,
  ScaleVector,
} from "../regent/js/regent_scene_protocol";

const HOME_LOGO_BUILD_DURATION_MS = 3000;
const HOME_LOGO_DISSOLUTION_DURATION_MS = 1000;
const HOME_LOGO_REBUILD_DURATION_MS = 2000;
const HOME_LOGO_CLICK_DISSOLVE_MS = 300;
const HOME_LOGO_SEQUENCE_DURATION_MS =
  HOME_LOGO_DISSOLUTION_DURATION_MS + HOME_LOGO_REBUILD_DURATION_MS;
const HOME_LOGO_PADDING = 18;
const HOME_LOGO_FPS = 30;
const HOME_LOGO_FRAME_MS = 1000 / HOME_LOGO_FPS;
const HOME_LOGO_TILE: [number, number] = [30, 30];

type HomeLogoHookContext = {
  el: HTMLElement;
  __homeLogoAnimator?: AnimatedHomeLogoScene;
};

type CommandWithWeight = {
  command: BoxCommandSpec;
  flowWeight: number;
};

type LoopPhase =
  | { mode: "build"; progress: number }
  | { mode: "dissolve"; progress: number }
  | { mode: "steady"; progress: 0 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(value: number): number {
  const t = clamp(value, 0, 1);
  return 1 - (1 - t) ** 3;
}

function activeFace(scene: SceneSpec): FaceSpec | undefined {
  return scene.faces.find((face) => face.id === scene.activeFace) ?? scene.faces[0];
}

function boxCommands(face: FaceSpec | undefined): BoxCommandSpec[] {
  if (!face) return [];

  return face.commands.filter(
    (command): command is BoxCommandSpec =>
      command.primitive === "box" && command.op !== "remove" && command.op !== "style",
  );
}

function readScene(el: HTMLElement): SceneSpec | null {
  const raw = el.dataset.sceneJson;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SceneSpec;
  } catch (_error) {
    return null;
  }
}

function readSequenceNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function scaleVector(input: ScaleVector | undefined): ScaleVector {
  return input ?? [1, 1, 1];
}

function commandX(command: BoxCommandSpec): number {
  if (Array.isArray(command.position)) return command.position[0];
  if (Array.isArray(command.center)) return command.center[0];
  return 0;
}

class AnimatedHomeLogoScene {
  private engine: HeerichInstance | null = null;
  private scene: SceneSpec | null = null;
  private face: FaceSpec | undefined;
  private commands: CommandWithWeight[] = [];
  private sequenceIndex = 0;
  private sequenceCount = 1;
  private lastFrameKey = "";
  private lastRenderAt = 0;
  private fixedViewBox: string | null = null;
  private pointerDown = false;
  private readonly voxelPulseStarts = new Map<string, number>();
  private overrideCamera:
    | { type: "perspective"; position: [number, number]; distance: number }
    | null = null;
  private sceneBounds = {
    minX: 0,
    maxX: 10,
    minY: 0,
    maxY: 10,
  };
  private stopCameraSubscription: (() => void) | null = null;

  private readonly onPointerDown = (event: PointerEvent) => {
    this.pointerDown = true;
    this.triggerPulseFromEvent(event);
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (!this.pointerDown) return;
    this.triggerPulseFromEvent(event);
  };

  private readonly onPointerUp = () => {
    this.pointerDown = false;
  };

  constructor(private readonly hook: HomeLogoHookContext) {}

  mount(): void {
    this.sync();
    this.stopCameraSubscription = subscribeHomeCameraState((state) =>
      this.applyCameraState(state),
    );
    this.disableDirectInteraction();
    this.bindInteraction();
    this.render({ mode: "build", progress: 0 });

    if (!prefersReducedMotion()) {
      registerHomeLogoAnimator(this);
    }
  }

  update(): void {
    const previousSignature = this.signature();
    this.sync();
    const nextSignature = this.signature();

    if (previousSignature !== nextSignature) {
      this.lastFrameKey = "";
      this.render({ mode: "build", progress: 0 });
    }
  }

  destroy(): void {
    this.unbindInteraction();
    this.stopCameraSubscription?.();
    this.stopCameraSubscription = null;
    unregisterHomeLogoAnimator(this);
  }

  tick(now: number): void {
    this.cleanupVoxelPulses(now);
    const phase = this.resolveLoopPhase(now);
    const frameKey = `${phase.mode}:${phase.progress.toFixed(3)}`;

    if (frameKey === this.lastFrameKey) return;
    if (phase.mode !== "steady" && now - this.lastRenderAt < HOME_LOGO_FRAME_MS) return;

    this.render(phase, now);
    this.lastFrameKey = frameKey;
    this.lastRenderAt = now;
  }

  private signature(): string {
    return [
      this.hook.el.dataset.sceneVersion ?? "",
      this.hook.el.dataset.sceneJson ?? "",
      this.hook.el.dataset.homeLogoSequence ?? "",
      this.hook.el.dataset.homeLogoCount ?? "",
    ].join("|");
  }

  private sync(): void {
    this.scene = readScene(this.hook.el);
    this.face = activeFace(this.scene ?? { faces: [] });
    this.sequenceIndex = readSequenceNumber(this.hook.el.dataset.homeLogoSequence, 0);
    this.sequenceCount = Math.max(readSequenceNumber(this.hook.el.dataset.homeLogoCount, 1), 1);

    const rawCommands = boxCommands(this.face);
    const xs = rawCommands.map(commandX);
    const ys = rawCommands.flatMap((command) => {
      const position = Array.isArray(command.position)
        ? command.position
        : Array.isArray(command.center)
          ? command.center
          : [0, 0, 0];
      const size = Array.isArray(command.size)
        ? command.size
        : [command.size, command.size, command.size];
      return [position[1], position[1] + Math.max(size[1] - 1, 0)];
    });
    const minX = xs.length > 0 ? Math.min(...xs) : 0;
    const maxX = xs.length > 0 ? Math.max(...xs) : 0;
    const minY = ys.length > 0 ? Math.min(...ys) : 0;
    const maxY = ys.length > 0 ? Math.max(...ys) : 0;
    const span = Math.max(maxX - minX, 1);
    this.sceneBounds = { minX, maxX, minY, maxY };

    this.commands = rawCommands.map((command) => ({
      command,
      flowWeight: (commandX(command) - minX) / span,
    }));

    this.fixedViewBox = this.computeFixedViewBox();
  }

  private applyCameraState(state: HomeCameraState): void {
    const nextCamera =
      state.target === "logos"
        ? this.perspectiveCameraFromState(state)
        : null;
    const previous = JSON.stringify(this.overrideCamera);
    const upcoming = JSON.stringify(nextCamera);

    if (previous === upcoming) return;

    this.overrideCamera = nextCamera;
    this.lastFrameKey = "";
    this.render(this.resolveLoopPhase(performance.now()));
  }

  private perspectiveCameraFromState(state: HomeCameraState): {
    type: "perspective";
    position: [number, number];
    distance: number;
  } {
    const spanX = Math.max(this.sceneBounds.maxX - this.sceneBounds.minX + 1, 6);
    const spanY = Math.max(this.sceneBounds.maxY - this.sceneBounds.minY + 1, 6);
    const centerX = this.sceneBounds.minX + spanX / 2;
    const centerY = this.sceneBounds.minY + spanY / 2;
    const camX =
      centerX +
      ((state.angle - DEFAULT_HOME_CAMERA_STATE.angle) / 180) * spanX * 0.95;
    const camY =
      centerY +
      ((state.camY - DEFAULT_HOME_CAMERA_STATE.camY) / 10) * spanY * 0.9;
    const distance = Math.max(state.distance / 7.5, 3.4);

    return {
      type: "perspective",
      position: [camX, camY],
      distance,
    };
  }

  private ensureEngine(): HeerichInstance | null {
    if (!window.Heerich) return null;

    const camera = {
      ...(this.overrideCamera ??
        this.scene?.camera ?? {
          type: (this.hook.el.dataset.cameraType as "oblique" | "perspective" | undefined) ?? "oblique",
          angle: readSequenceNumber(this.hook.el.dataset.cameraAngle, 315),
          distance: readSequenceNumber(this.hook.el.dataset.cameraDistance, 20),
        }),
    };

    if (!this.engine) {
      this.engine = new window.Heerich({
        tile: HOME_LOGO_TILE,
        camera,
        style: {
          fill: "#f5ecd7",
          stroke: "#d4c2a0",
          strokeWidth: 0.5,
        },
      });
    } else if (this.engine.setCamera) {
      this.engine.setCamera(camera);
    }

    this.engine.clear();
    return this.engine;
  }

  private resolveLoopPhase(now: number): LoopPhase {
    if (prefersReducedMotion()) return { mode: "steady", progress: 0 };

    const elapsed = Math.max(now - homeLogoLoopStartedAt, 0);

    if (elapsed < HOME_LOGO_BUILD_DURATION_MS) {
      return {
        mode: "build",
        progress: clamp(elapsed / HOME_LOGO_BUILD_DURATION_MS, 0, 1),
      };
    }

    const cycleMs = this.sequenceCount * HOME_LOGO_SEQUENCE_DURATION_MS;
    const cycleOffset = (elapsed - HOME_LOGO_BUILD_DURATION_MS) % cycleMs;
    const start = this.sequenceIndex * HOME_LOGO_SEQUENCE_DURATION_MS;
    const end = start + HOME_LOGO_SEQUENCE_DURATION_MS;

    if (cycleOffset < start || cycleOffset >= end) return { mode: "steady", progress: 0 };

    const localOffset = cycleOffset - start;

    if (localOffset < HOME_LOGO_DISSOLUTION_DURATION_MS) {
      return {
        mode: "dissolve",
        progress: clamp(localOffset / HOME_LOGO_DISSOLUTION_DURATION_MS, 0, 1),
      };
    }

    return {
      mode: "build",
      progress: clamp(
        (localOffset - HOME_LOGO_DISSOLUTION_DURATION_MS) / HOME_LOGO_REBUILD_DURATION_MS,
        0,
        1,
      ),
    };
  }

  private computeFixedViewBox(): string | null {
    const engine = this.ensureEngine();
    if (!engine || this.commands.length === 0) return null;

    this.commands.forEach(({ command }) => {
      const baseScale = scaleVector(command.scale);

      engine.addGeometry({
        type: "box",
        position: command.position,
        center: command.center,
        size: command.size,
        style: command.style,
        content: command.content ?? undefined,
        opaque: command.opaque,
        rotate: command.rotate,
        meta: command.meta,
        scale: () => baseScale,
        scaleOrigin: command.scaleOrigin ?? [0.5, 0.5, 0.5],
      });
    });

    const markup = engine.toSVG({ padding: HOME_LOGO_PADDING });
    const template = document.createElement("template");
    template.innerHTML = markup.trim();
    const svg = template.content.querySelector("svg");
    const viewBox = svg?.getAttribute("viewBox") ?? null;

    engine.clear();
    return viewBox;
  }

  private stabilizeOutputFrame(): void {
    const svg = this.hook.el.querySelector("svg");
    if (!(svg instanceof SVGSVGElement)) return;

    if (this.fixedViewBox) svg.setAttribute("viewBox", this.fixedViewBox);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.classList.add("pp-home-logo-svg");
  }

  private bindInteraction(): void {
    this.hook.el.addEventListener("pointerdown", this.onPointerDown);
    this.hook.el.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp, { passive: true });
    window.addEventListener("pointercancel", this.onPointerUp, { passive: true });
    window.addEventListener("blur", this.onPointerUp);
  }

  private unbindInteraction(): void {
    this.hook.el.removeEventListener("pointerdown", this.onPointerDown);
    this.hook.el.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    window.removeEventListener("blur", this.onPointerUp);
  }

  private triggerPulseFromEvent(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const voxel = target.closest<HTMLElement>("[data-home-logo-voxel-key]");
    if (!voxel || !this.hook.el.contains(voxel)) return;

    const voxelKey = voxel.dataset.homeLogoVoxelKey;
    if (!voxelKey) return;

    const now = performance.now();
    const previous = this.voxelPulseStarts.get(voxelKey);
    if (previous && now - previous < HOME_LOGO_CLICK_DISSOLVE_MS * 0.5) return;

    this.voxelPulseStarts.set(voxelKey, now);
    this.lastFrameKey = "";
  }

  private cleanupVoxelPulses(now: number): void {
    this.voxelPulseStarts.forEach((startedAt, key) => {
      if (now - startedAt < HOME_LOGO_CLICK_DISSOLVE_MS) return;
      this.voxelPulseStarts.delete(key);
    });
  }

  private pulseFactorForVoxel(key: string, now: number): number {
    const startedAt = this.voxelPulseStarts.get(key);
    if (startedAt === undefined) return 1;

    const age = clamp((now - startedAt) / HOME_LOGO_CLICK_DISSOLVE_MS, 0, 1);
    return Math.max(1 - easeOutCubic(age), 0.0001);
  }

  private worldVoxelKey(
    command: BoxCommandSpec,
    localX: number,
    localY: number,
    localZ: number,
  ): string | null {
    if (!Array.isArray(command.position)) return null;
    return `${command.position[0] + localX}:${command.position[1] + localY}:${command.position[2] + localZ}`;
  }

  private commandScale(weight: number, phase: LoopPhase, baseScale: ScaleVector): ScaleVector | null {
    if (phase.mode === "steady") return null;

    const progress = phase.progress;
    const lead = weight * 0.72;
    const local = clamp((progress - lead) / 0.28, 0, 1);
    const factor =
      phase.mode === "build"
        ? easeOutCubic(local)
        : 1 - easeOutCubic(local);

    if (phase.mode === "build" && factor <= 0) return [0.0001, 0.0001, 0.0001];
    if (phase.mode === "dissolve" && local <= 0) return null;

    return [
      baseScale[0] * Math.max(factor, 0.0001),
      baseScale[1] * Math.max(factor, 0.0001),
      baseScale[2] * Math.max(factor, 0.0001),
    ];
  }

  private render(phase: LoopPhase, now = performance.now()): void {
    const engine = this.ensureEngine();

    if (!engine || !this.face || this.commands.length === 0) {
      this.hook.el.innerHTML =
        `<div class="rg-scene-error"><strong>Home logo surface unavailable.</strong></div>`;
      return;
    }

    this.commands.forEach(({ command, flowWeight }) => {
      const baseScale = scaleVector(command.scale);
      const animatedScale = this.commandScale(flowWeight, phase, baseScale);
      const globalFactor = animatedScale
        ? animatedScale[0] / Math.max(baseScale[0], 0.0001)
        : 1;

      engine.addGeometry({
        type: "box",
        position: command.position,
        center: command.center,
        size: command.size,
        style: command.style,
        content: command.content ?? undefined,
        opaque: command.opaque,
        rotate: command.rotate,
        meta: {
          ...(command.meta ?? {}),
          homeLogoCommandId: command.id,
        },
        scale: (x: number, y: number, z: number) => {
          const key = this.worldVoxelKey(command, x, y, z);
          const pulseFactor = key ? this.pulseFactorForVoxel(key, now) : 1;
          const factor = Math.min(globalFactor, pulseFactor);
          return [
            baseScale[0] * Math.max(factor, 0.0001),
            baseScale[1] * Math.max(factor, 0.0001),
            baseScale[2] * Math.max(factor, 0.0001),
          ] as ScaleVector;
        },
        scaleOrigin: command.scaleOrigin ?? [0.5, 0.5, 0.5],
      });
    });

    this.hook.el.innerHTML = engine.toSVG({
      padding: HOME_LOGO_PADDING,
      faceAttributes: (face) => {
        const voxel = face.voxel;
        if (!voxel) return {};

        return {
          "data-home-logo-voxel-key": `${voxel.x}:${voxel.y}:${voxel.z}`,
        };
      },
    });
    this.stabilizeOutputFrame();
  }

  private disableDirectInteraction(): void {
    this.hook.el.removeAttribute("role");
    this.hook.el.removeAttribute("tabindex");
    this.hook.el.style.cursor = "";
  }
}

const homeLogoAnimators = new Set<AnimatedHomeLogoScene>();
let homeLogoFrame: number | null = null;
let homeLogoLoopStartedAt = 0;

function runHomeLogoLoop(now: number): void {
  homeLogoAnimators.forEach((animator) => animator.tick(now));
  homeLogoFrame =
    homeLogoAnimators.size > 0 ? window.requestAnimationFrame(runHomeLogoLoop) : null;
}

function registerHomeLogoAnimator(animator: AnimatedHomeLogoScene): void {
  homeLogoAnimators.add(animator);

  if (homeLogoFrame === null) {
    homeLogoLoopStartedAt = performance.now();
    homeLogoFrame = window.requestAnimationFrame(runHomeLogoLoop);
  }
}

function unregisterHomeLogoAnimator(animator: AnimatedHomeLogoScene): void {
  homeLogoAnimators.delete(animator);

  if (homeLogoAnimators.size === 0 && homeLogoFrame !== null) {
    window.cancelAnimationFrame(homeLogoFrame);
    homeLogoFrame = null;
  }
}

export const AnimatedHomeLogoSceneHook = {
  mounted(this: HomeLogoHookContext) {
    this.__homeLogoAnimator?.destroy();
    this.__homeLogoAnimator = new AnimatedHomeLogoScene(this);
    this.__homeLogoAnimator.mount();
  },
  updated(this: HomeLogoHookContext) {
    this.__homeLogoAnimator?.update();
  },
  destroyed(this: HomeLogoHookContext) {
    this.__homeLogoAnimator?.destroy();
    delete this.__homeLogoAnimator;
  },
};
