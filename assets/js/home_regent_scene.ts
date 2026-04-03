import { animate } from "animejs";
import { prefersReducedMotion } from "../regent/js/regent_motion";
import type { RegentHook, RegentHookContext } from "../regent/js/regent_hook_types";
import {
  buildSceneFromRoot,
  RegentSceneRenderer,
} from "../regent/js/regent_scene_renderer";
import type {
  BoxCommandSpec,
  FaceSpec,
  MarkerSpec,
  NodeHoverPayload,
  SceneFocusPayload,
  SceneGhostPayload,
  ScenePatchPayload,
  ScenePulsePayload,
  SceneReplacePayload,
  SceneSpec,
  SurfaceErrorPayload,
} from "../regent/js/regent_scene_protocol";

const HOME_LOGO_BUILD_DURATION_MS = 3000;
const HOME_LOGO_DISSOLUTION_DURATION_MS = 1000;
const HOME_LOGO_REBUILD_DURATION_MS = 2000;
const HOME_LOGO_SEQUENCE_DURATION_MS =
  HOME_LOGO_DISSOLUTION_DURATION_MS + HOME_LOGO_REBUILD_DURATION_MS;

type HomeLoopWrapper = {
  commandId: string;
  flowWeight: number;
  wrapper: SVGGElement;
};

type HookWithState = RegentHookContext & {
  __homeRegent?: {
    animator: HomeRegentLoopAnimator;
    refs: unknown[];
    renderer: RegentSceneRenderer;
    scene: SceneSpec;
    selectedTargetId: string | null;
    version: string;
  };
};

function pushSurfaceError(hook: HookWithState, payload: SurfaceErrorPayload): void {
  hook.pushEvent("regent:surface_error", payload);
}

function readSelectedTargetId(hook: HookWithState): string | null {
  const selectedTargetId = hook.el.dataset.selectedTargetId;
  return selectedTargetId && selectedTargetId.length > 0 ? selectedTargetId : null;
}

function activeFace(scene: SceneSpec): FaceSpec | undefined {
  return scene.faces.find((face) => face.id === scene.activeFace) ?? scene.faces[0];
}

function activeMarker(
  scene: SceneSpec,
  targetId: string,
): { faceId: string; marker?: MarkerSpec } {
  const face = activeFace(scene);
  return {
    faceId: face?.id ?? "",
    marker: face?.markers?.find((entry) => entry.id === targetId),
  };
}

function readSequenceNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boxCommands(face: FaceSpec | undefined): BoxCommandSpec[] {
  if (!face) return [];

  return face.commands.filter(
    (command): command is BoxCommandSpec =>
      command.primitive === "box" &&
      command.op !== "remove" &&
      command.op !== "style",
  );
}

function commandX(command: BoxCommandSpec): number {
  if (Array.isArray(command.position)) return command.position[0];
  if (Array.isArray(command.center)) return command.center[0];
  return 0;
}

function flowWeightsForFace(face: FaceSpec | undefined): Map<string, number> {
  const commands = boxCommands(face);
  const xs = commands.map(commandX);
  const minX = xs.length > 0 ? Math.min(...xs) : 0;
  const maxX = xs.length > 0 ? Math.max(...xs) : 1;
  const span = Math.max(maxX - minX, 1);
  const weights = new Map<string, number>();

  commands.forEach((command) => {
    weights.set(command.id, (commandX(command) - minX) / span);
  });

  return weights;
}

function setWrapperState(wrapper: SVGGElement, scale: number, opacity: number): void {
  wrapper.style.setProperty("transform-box", "fill-box");
  wrapper.style.setProperty("transform-origin", "center");
  wrapper.style.transform = `scale(${Math.max(scale, 0.0001)})`;
  wrapper.style.opacity = `${Math.max(opacity, 0.0001)}`;
}

class HomeRegentLoopAnimator {
  private buildTimeout: number | null = null;
  private cycleInterval: number | null = null;
  private cycleStartTimeout: number | null = null;
  private scene: SceneSpec | null = null;
  private sequenceCount = 1;
  private sequenceIndex = 0;
  private wrappers: HomeLoopWrapper[] = [];

  constructor(private readonly hook: HookWithState) {}

  syncFromScene(scene: SceneSpec): void {
    this.scene = scene;
    this.sequenceIndex = readSequenceNumber(this.hook.el.dataset.homeLogoSequence, 0);
    this.sequenceCount = Math.max(
      readSequenceNumber(this.hook.el.dataset.homeLogoCount, 1),
      1,
    );
  }

  afterRender(): void {
    this.rebuildWrappers();
    this.restart();
  }

  destroy(): void {
    this.clearTimers();
    this.clearWrapperAnimations();
    this.wrappers = [];
  }

  private clearTimers(): void {
    if (this.buildTimeout !== null) window.clearTimeout(this.buildTimeout);
    if (this.cycleStartTimeout !== null) window.clearTimeout(this.cycleStartTimeout);
    if (this.cycleInterval !== null) window.clearInterval(this.cycleInterval);
    this.buildTimeout = null;
    this.cycleStartTimeout = null;
    this.cycleInterval = null;
  }

  private clearWrapperAnimations(): void {
    this.wrappers.forEach(({ wrapper }) => {
      animate(wrapper, { duration: 0 }).cancel();
    });
  }

  private rebuildWrappers(): void {
    const face = activeFace(this.scene ?? { faces: [] });
    const weights = flowWeightsForFace(face);
    const groups = new Map<string, SVGElement[]>();

    this.hook.el
      .querySelectorAll<SVGElement>("[data-regent-command-id]")
      .forEach((element) => {
        const commandId = element.dataset.regentCommandId;
        if (!commandId) return;
        const group = groups.get(commandId) ?? [];
        group.push(element);
        groups.set(commandId, group);
      });

    this.wrappers = [...groups.entries()]
      .map(([commandId, facesForCommand]) => {
        const first = facesForCommand[0];
        const parent = first?.parentNode;
        if (!(first instanceof SVGElement) || !(parent instanceof SVGGElement || parent instanceof SVGSVGElement)) {
          return null;
        }

        const existingParent = first.parentElement;
        if (
          existingParent instanceof SVGGElement &&
          existingParent.dataset.homeLoopCommand === commandId
        ) {
          return {
            commandId,
            flowWeight: weights.get(commandId) ?? 0,
            wrapper: existingParent,
          };
        }

        const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
        wrapper.dataset.homeLoopCommand = commandId;
        parent.insertBefore(wrapper, first);
        facesForCommand.forEach((faceEl) => wrapper.appendChild(faceEl));

        return {
          commandId,
          flowWeight: weights.get(commandId) ?? 0,
          wrapper,
        };
      })
      .filter((entry): entry is HomeLoopWrapper => entry !== null)
      .sort((left, right) => left.flowWeight - right.flowWeight);
  }

  private restart(): void {
    this.clearTimers();
    this.clearWrapperAnimations();

    if (this.wrappers.length === 0) return;

    if (prefersReducedMotion()) {
      this.wrappers.forEach(({ wrapper }) => setWrapperState(wrapper, 1, 1));
      return;
    }

    this.wrappers.forEach(({ wrapper }) => setWrapperState(wrapper, 0.0001, 0.0001));
    this.playBuild(HOME_LOGO_BUILD_DURATION_MS);

    const cycleOffset = this.sequenceIndex * HOME_LOGO_SEQUENCE_DURATION_MS;
    const cycleWindow = this.sequenceCount * HOME_LOGO_SEQUENCE_DURATION_MS;

    this.cycleStartTimeout = window.setTimeout(() => {
      this.runCycle();
      this.cycleInterval = window.setInterval(() => this.runCycle(), cycleWindow);
    }, HOME_LOGO_BUILD_DURATION_MS + cycleOffset);
  }

  private playBuild(durationMs: number): void {
    animate(this.wrappers.map(({ wrapper }) => wrapper), {
      scale: [0.0001, 1],
      opacity: [0.0001, 1],
      delay: (_target: unknown, index: number) =>
        this.wrappers[index].flowWeight * durationMs * 0.72,
      duration: Math.max(durationMs * 0.28, 240),
      ease: "outCubic",
    });
  }

  private playDissolve(): void {
    animate(this.wrappers.map(({ wrapper }) => wrapper), {
      scale: [1, 0.0001],
      opacity: [1, 0.0001],
      delay: (_target: unknown, index: number) =>
        this.wrappers[index].flowWeight * HOME_LOGO_DISSOLUTION_DURATION_MS * 0.72,
      duration: Math.max(HOME_LOGO_DISSOLUTION_DURATION_MS * 0.28, 180),
      ease: "outCubic",
    });
  }

  private runCycle(): void {
    this.playDissolve();
    this.buildTimeout = window.setTimeout(() => {
      this.wrappers.forEach(({ wrapper }) => setWrapperState(wrapper, 0.0001, 0.0001));
      this.playBuild(HOME_LOGO_REBUILD_DURATION_MS);
    }, HOME_LOGO_DISSOLUTION_DURATION_MS);
  }
}

function installEventHandlers(hook: HookWithState): unknown[] {
  return [
    hook.handleEvent("regent:scene_replace", ({ scene }: SceneReplacePayload) => {
      const state = hook.__homeRegent;
      if (!state) return;

      hook.el.dataset.sceneJson = JSON.stringify(scene);
      hook.el.dataset.sceneVersion = String(
        scene.sceneVersion ?? Number(hook.el.dataset.sceneVersion ?? "0") + 1,
      );
      if (scene.activeFace) hook.el.dataset.activeFace = scene.activeFace;

      const nextSelectedTargetId = readSelectedTargetId(hook);
      const renderedTargets = state.renderer.render(scene);
      state.scene = scene;
      state.version = hook.el.dataset.sceneVersion ?? state.version;
      state.selectedTargetId = nextSelectedTargetId;
      state.renderer.focusTarget(nextSelectedTargetId);
      state.animator.syncFromScene(scene);
      state.animator.afterRender();

      hook.pushEvent("regent:surface_ready", {
        scene_version: Number(hook.el.dataset.sceneVersion ?? "0"),
        active_face: scene.activeFace ?? null,
        rendered_targets: renderedTargets,
      });
    }),
    hook.handleEvent("regent:scene_patch", (patch: ScenePatchPayload) => {
      if (patch.activeFace) hook.el.dataset.activeFace = patch.activeFace;
      if (patch.sceneVersion !== undefined) hook.el.dataset.sceneVersion = String(patch.sceneVersion);
      if (patch.selectedTargetId !== undefined) {
        hook.el.dataset.selectedTargetId = patch.selectedTargetId ?? "";
      }

      const state = hook.__homeRegent;
      if (!state) return;

      const scene = buildSceneFromRoot(hook.el);
      state.scene = scene;
      state.renderer.render(scene);
      state.renderer.focusTarget(readSelectedTargetId(hook));
      state.selectedTargetId = readSelectedTargetId(hook);
      state.version = hook.el.dataset.sceneVersion ?? state.version;
      state.animator.syncFromScene(scene);
      state.animator.afterRender();
    }),
    hook.handleEvent("regent:scene_focus", ({ target_id }: SceneFocusPayload) => {
      hook.__homeRegent?.renderer.focusTarget(target_id);
      if (hook.__homeRegent) hook.__homeRegent.selectedTargetId = target_id;
    }),
    hook.handleEvent("regent:scene_pulse", ({ target_id, state }: ScenePulsePayload) => {
      hook.__homeRegent?.renderer.pulseTarget(target_id, state);
    }),
    hook.handleEvent("regent:scene_ghost", ({ target_id, diff }: SceneGhostPayload) => {
      hook.__homeRegent?.renderer.ghostTarget(target_id, diff);
    }),
  ];
}

export const HomeRegentScene: RegentHook = {
  mounted() {
    const hook = this as HookWithState;

    try {
      const renderer = new RegentSceneRenderer(hook.el, {
        onTargetSelect: ({ targetId }) => {
          const scene = hook.__homeRegent?.scene ?? buildSceneFromRoot(hook.el);
          const { faceId, marker } = activeMarker(scene, targetId);

          hook.pushEvent("regent:node_select", {
            target_id: targetId,
            face_id: faceId,
            kind: marker?.kind,
            sigil: marker?.sigil,
            status: marker?.status,
            intent: marker?.intent,
            action_label: marker?.actionLabel,
            back_target_id: marker?.backTargetId ?? null,
            history_key: marker?.historyKey ?? null,
            group_role: marker?.groupRole ?? null,
            click_tone: marker?.clickTone ?? null,
            meta: marker?.meta ?? {},
          });
        },
        onTargetHover: ({ targetId }) => {
          const scene = hook.__homeRegent?.scene ?? buildSceneFromRoot(hook.el);
          const { faceId, marker } = activeMarker(scene, targetId);
          const payload: NodeHoverPayload = {
            target_id: targetId,
            face_id: faceId,
            kind: marker?.kind,
            sigil: marker?.sigil,
            status: marker?.status,
            intent: marker?.intent,
            action_label: marker?.actionLabel,
            back_target_id: marker?.backTargetId ?? null,
            history_key: marker?.historyKey ?? null,
            group_role: marker?.groupRole ?? null,
            click_tone: marker?.clickTone ?? null,
            meta: marker?.meta ?? {},
          };
          hook.pushEvent("regent:node_hover", payload);
        },
      });

      const scene = buildSceneFromRoot(hook.el);
      const animator = new HomeRegentLoopAnimator(hook);
      animator.syncFromScene(scene);

      hook.__homeRegent = {
        animator,
        renderer,
        scene,
        version: hook.el.dataset.sceneVersion ?? "0",
        selectedTargetId: readSelectedTargetId(hook),
        refs: installEventHandlers(hook),
      };

      const renderedTargets = renderer.render(scene);
      renderer.focusTarget(readSelectedTargetId(hook));
      animator.afterRender();

      hook.pushEvent("regent:surface_ready", {
        scene_version: Number(hook.el.dataset.sceneVersion ?? "0"),
        active_face: scene.activeFace ?? null,
        rendered_targets: renderedTargets,
      });
    } catch (error) {
      pushSurfaceError(hook, {
        phase: "render",
        message:
          error instanceof Error
            ? error.message
            : "Unknown HomeRegentScene mount error",
      });
    }
  },

  updated() {
    const hook = this as HookWithState;
    if (!hook.__homeRegent) return;

    try {
      const version = hook.el.dataset.sceneVersion ?? "0";
      const selectedTargetId = readSelectedTargetId(hook);
      const needsRender = version !== hook.__homeRegent.version;
      const needsFocus = selectedTargetId !== hook.__homeRegent.selectedTargetId;

      if (!needsRender && !needsFocus) return;

      if (needsRender) {
        const scene = buildSceneFromRoot(hook.el);
        hook.__homeRegent.renderer.clearTransient();
        hook.__homeRegent.renderer.render(scene);
        hook.__homeRegent.scene = scene;
        hook.__homeRegent.version = version;
        hook.__homeRegent.animator.syncFromScene(scene);
        hook.__homeRegent.animator.afterRender();
      }

      if (needsFocus || needsRender) {
        hook.__homeRegent.renderer.focusTarget(selectedTargetId);
        hook.__homeRegent.selectedTargetId = selectedTargetId;
      }
    } catch (error) {
      pushSurfaceError(hook, {
        phase: "render",
        message:
          error instanceof Error
            ? error.message
            : "Unknown HomeRegentScene update error",
      });
    }
  },

  destroyed() {
    const hook = this as HookWithState;
    hook.__homeRegent?.animator.destroy();
    hook.__homeRegent?.renderer.destroy();
    hook.__homeRegent?.refs.forEach((ref: unknown) => {
      if (typeof hook.removeHandleEvent === "function") {
        hook.removeHandleEvent(ref as never);
      }
    });
    delete hook.__homeRegent;
  },
};
