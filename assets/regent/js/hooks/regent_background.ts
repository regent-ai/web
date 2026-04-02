import type { RegentHook, RegentHookContext } from "../regent_hook_types"
import { RegentBackgroundRenderer } from "../regent_background_renderer"

type HookWithState = RegentHookContext & {
  __regentBackground?: { renderer: RegentBackgroundRenderer }
}

export const RegentBackground: RegentHook = {
  mounted() {
    const hook = this as HookWithState
    const renderer = new RegentBackgroundRenderer(hook.el)
    hook.__regentBackground = { renderer }
    renderer.mount()
  },

  updated() {
    const hook = this as HookWithState
    hook.__regentBackground?.renderer.rebuild()
  },

  destroyed() {
    const hook = this as HookWithState
    hook.__regentBackground?.renderer.destroy()
    delete hook.__regentBackground
  },
}
