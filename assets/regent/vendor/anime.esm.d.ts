export function animate(
  targets: unknown,
  options: Record<string, unknown>
): {
  cancel?: () => void
  pause?: () => void
  revert?: () => void
}

export function createDrawable(
  targets: unknown,
  start?: number,
  end?: number
): unknown

export function createTimeline(options?: Record<string, unknown>): {
  add(
    targets: unknown,
    options: Record<string, unknown>,
    position?: number | string
  ): unknown
  cancel?: () => void
  pause?: () => void
  revert?: () => void
}

export function stagger(value: number, options?: Record<string, unknown>): unknown
