import type { HeerichConstructor } from "./heerich_types"
import { hooks } from "./hooks"
import { HoverCycle, HoverCycleController, normalizeHoverCycleSpec } from "./regent_hover_cycle"
import { REGENT_SIGILS, sigilSvg, sigilVoxelMarkup } from "./regent_sigils"
import { prefersReducedMotion, pulseElement, revealSequence, traceSvgPaths } from "./regent_motion"
import { RegentSceneRenderer } from "./regent_scene_renderer"
import { RegentBackgroundRenderer } from "./regent_background_renderer"

export {
  hooks,
  HoverCycle,
  HoverCycleController,
  normalizeHoverCycleSpec,
  REGENT_SIGILS,
  sigilSvg,
  sigilVoxelMarkup,
  prefersReducedMotion,
  pulseElement,
  revealSequence,
  traceSvgPaths,
  RegentSceneRenderer,
  RegentBackgroundRenderer,
}

export function installHeerich(HeerichCtor: unknown): void {
  window.Heerich = HeerichCtor as HeerichConstructor
}
