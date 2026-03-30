export interface RequestVersionRef {
  current: number;
}

export function startTrackedRequest(ref: RequestVersionRef): number {
  ref.current += 1;
  return ref.current;
}

export function isTrackedRequestCurrent(
  ref: RequestVersionRef,
  requestId: number,
): boolean {
  return ref.current === requestId;
}

export function invalidateTrackedRequests(ref: RequestVersionRef): void {
  ref.current += 1;
}
