export type HomeCameraTarget = "background" | "logos"

export interface HomeCameraState {
  target: HomeCameraTarget
  angle: number
  camY: number
  distance: number
}

export const DEFAULT_HOME_CAMERA_STATE: HomeCameraState = {
  target: "background",
  angle: 116,
  camY: -1,
  distance: 50,
}

type HomeCameraListener = (state: HomeCameraState) => void

const listeners = new Set<HomeCameraListener>()
let currentState: HomeCameraState = { ...DEFAULT_HOME_CAMERA_STATE }

function emit(): void {
  const snapshot = { ...currentState }
  listeners.forEach((listener) => listener(snapshot))
}

export function getHomeCameraState(): HomeCameraState {
  return { ...currentState }
}

export function setHomeCameraState(next: HomeCameraState): void {
  currentState = { ...next }
  emit()
}

export function updateHomeCameraState(
  partial: Partial<HomeCameraState>,
): HomeCameraState {
  currentState = {
    ...currentState,
    ...partial,
  }
  emit()
  return getHomeCameraState()
}

export function subscribeHomeCameraState(
  listener: HomeCameraListener,
): () => void {
  listeners.add(listener)
  listener(getHomeCameraState())

  return () => {
    listeners.delete(listener)
  }
}
