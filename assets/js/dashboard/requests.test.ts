import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  invalidateTrackedRequests,
  isTrackedRequestCurrent,
  startTrackedRequest,
  type RequestVersionRef,
} from "./requests.ts";

describe("tracked request helpers", () => {
  it("marks only the latest request id as current", () => {
    const ref: RequestVersionRef = { current: 0 };
    const first = startTrackedRequest(ref);
    const second = startTrackedRequest(ref);

    assert.equal(isTrackedRequestCurrent(ref, first), false);
    assert.equal(isTrackedRequestCurrent(ref, second), true);
  });

  it("invalidates pending request ids", () => {
    const ref: RequestVersionRef = { current: 0 };
    const requestId = startTrackedRequest(ref);

    invalidateTrackedRequests(ref);

    assert.equal(isTrackedRequestCurrent(ref, requestId), false);
  });
});
