import type { RegentHook, RegentHookContext } from "../regent_hook_types"
import type {
  FaceSpec,
  MarkerSpec,
  NodeHoverPayload,
  SceneSpec,
  SceneFocusPayload,
  SceneGhostPayload,
  ScenePatchPayload,
  ScenePulsePayload,
  SceneReplacePayload,
  SurfaceErrorPayload,
} from "../regent_scene_protocol"
import { buildSceneFromRoot, RegentSceneRenderer } from "../regent_scene_renderer"

type HookWithState = RegentHookContext & {
  __regent?: {
    renderer: RegentSceneRenderer
    scene: SceneSpec
    version: string
    selectedTargetId: string | null
    refs: unknown[]
  }
}

function pushSurfaceError(hook: HookWithState, payload: SurfaceErrorPayload): void {
  hook.pushEvent("regent:surface_error", payload)
}

function readSelectedTargetId(hook: HookWithState): string | null {
  const selectedTargetId = hook.el.dataset.selectedTargetId
  return selectedTargetId && selectedTargetId.length > 0 ? selectedTargetId : null
}

function activeFace(scene: SceneSpec): FaceSpec | undefined {
  return scene.faces.find((face) => face.id === scene.activeFace) ?? scene.faces[0]
}

function activeMarker(scene: SceneSpec, targetId: string): { faceId: string; marker?: MarkerSpec } {
  const face = activeFace(scene)
  return {
    faceId: face?.id ?? "",
    marker: face?.markers?.find((entry) => entry.id === targetId),
  }
}

function installEventHandlers(hook: HookWithState): unknown[] {
  return [
    hook.handleEvent("regent:scene_replace", ({ scene }: SceneReplacePayload) => {
      const state = hook.__regent
      if (!state) return
      hook.el.dataset.sceneJson = JSON.stringify(scene)
      hook.el.dataset.sceneVersion = String(scene.sceneVersion ?? Number(hook.el.dataset.sceneVersion ?? "0") + 1)
      if (scene.activeFace) hook.el.dataset.activeFace = scene.activeFace
      const nextSelectedTargetId = readSelectedTargetId(hook)
      const renderedTargets = state.renderer.render(scene)
      state.scene = scene
      state.version = hook.el.dataset.sceneVersion ?? state.version
      state.selectedTargetId = nextSelectedTargetId
      state.renderer.focusTarget(nextSelectedTargetId)
      hook.pushEvent("regent:surface_ready", {
        scene_version: Number(hook.el.dataset.sceneVersion ?? "0"),
        active_face: scene.activeFace ?? null,
        rendered_targets: renderedTargets,
      })
    }),
    hook.handleEvent("regent:scene_patch", (patch: ScenePatchPayload) => {
      if (patch.activeFace) hook.el.dataset.activeFace = patch.activeFace
      if (patch.sceneVersion !== undefined) hook.el.dataset.sceneVersion = String(patch.sceneVersion)
      if (patch.selectedTargetId !== undefined) hook.el.dataset.selectedTargetId = patch.selectedTargetId ?? ""
      const state = hook.__regent
      if (!state) return
      const scene = buildSceneFromRoot(hook.el)
      state.scene = scene
      state.renderer.render(scene)
      state.renderer.focusTarget(readSelectedTargetId(hook))
      state.selectedTargetId = readSelectedTargetId(hook)
      state.version = hook.el.dataset.sceneVersion ?? state.version
    }),
    hook.handleEvent("regent:scene_focus", ({ target_id }: SceneFocusPayload) => {
      hook.__regent?.renderer.focusTarget(target_id)
      if (hook.__regent) hook.__regent.selectedTargetId = target_id
    }),
    hook.handleEvent("regent:scene_pulse", ({ target_id, state }: ScenePulsePayload) => {
      hook.__regent?.renderer.pulseTarget(target_id, state)
    }),
    hook.handleEvent("regent:scene_ghost", ({ target_id, diff }: SceneGhostPayload) => {
      hook.__regent?.renderer.ghostTarget(target_id, diff)
    }),
  ]
}

export const RegentScene: RegentHook = {
  mounted() {
    const hook = this as HookWithState

    try {
      const renderer = new RegentSceneRenderer(hook.el, {
        onTargetSelect: ({ targetId }) => {
          const scene = hook.__regent?.scene ?? buildSceneFromRoot(hook.el)
          const { faceId, marker } = activeMarker(scene, targetId)

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
          })
        },
        onTargetHover: ({ targetId }) => {
          const scene = hook.__regent?.scene ?? buildSceneFromRoot(hook.el)
          const { faceId, marker } = activeMarker(scene, targetId)
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
          }
          hook.pushEvent("regent:node_hover", payload)
        },
      })

      hook.__regent = {
        renderer,
        scene: buildSceneFromRoot(hook.el),
        version: hook.el.dataset.sceneVersion ?? "0",
        selectedTargetId: readSelectedTargetId(hook),
        refs: installEventHandlers(hook),
      }

      const scene = hook.__regent.scene
      const renderedTargets = renderer.render(scene)
      renderer.focusTarget(readSelectedTargetId(hook))

      hook.pushEvent("regent:surface_ready", {
        scene_version: Number(hook.el.dataset.sceneVersion ?? "0"),
        active_face: scene.activeFace ?? null,
        rendered_targets: renderedTargets,
      })
    } catch (error) {
      pushSurfaceError(hook, {
        phase: "render",
        message: error instanceof Error ? error.message : "Unknown RegentScene mount error",
      })
    }
  },

  updated() {
    const hook = this as HookWithState
    if (!hook.__regent) return

    try {
      const version = hook.el.dataset.sceneVersion ?? "0"
      const selectedTargetId = readSelectedTargetId(hook)
      const needsRender = version !== hook.__regent.version
      const needsFocus = selectedTargetId !== hook.__regent.selectedTargetId

      if (!needsRender && !needsFocus) return

      if (needsRender) {
        const scene = buildSceneFromRoot(hook.el)
        hook.__regent.renderer.clearTransient()
        hook.__regent.renderer.render(scene)
        hook.__regent.scene = scene
        hook.__regent.version = version
      }

      if (needsFocus || needsRender) {
        hook.__regent.renderer.focusTarget(selectedTargetId)
        hook.__regent.selectedTargetId = selectedTargetId
      }
    } catch (error) {
      pushSurfaceError(hook, {
        phase: "render",
        message: error instanceof Error ? error.message : "Unknown RegentScene update error",
      })
    }
  },

  destroyed() {
    const hook = this as HookWithState
    hook.__regent?.renderer.destroy()
    hook.__regent?.refs.forEach((ref: unknown) => {
      if (typeof hook.removeHandleEvent === "function") hook.removeHandleEvent(ref as never)
    })
    delete hook.__regent
  },
}
