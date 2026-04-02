export interface RegentHookContext {
  el: HTMLElement
  pushEvent(event: string, payload: unknown): void
  handleEvent(event: string, callback: (payload: any) => void): unknown
  removeHandleEvent?(ref: unknown): void
}

export interface RegentHook {
  mounted?(this: RegentHookContext): void
  updated?(this: RegentHookContext): void
  destroyed?(this: RegentHookContext): void
}
