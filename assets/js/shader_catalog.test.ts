import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildShaderFragmentSource,
  getShaderById,
  getShaderDefaultDefineValues,
  sanitizeShaderDefineValues,
  SHADER_CATALOG,
} from "./shader/lib/catalog.ts";

describe("shader catalog", () => {
  it("loads the full 20-entry catalog in manifest order", () => {
    assert.equal(SHADER_CATALOG.length, 20);
    assert.equal(SHADER_CATALOG[0]?.id, "w3dfWN");
    assert.equal(SHADER_CATALOG[19]?.id, "cubic");
  });

  it("produces default define values for a shader", () => {
    const shader = getShaderById("w3dfWN");
    assert.ok(shader);

    const defaults = getShaderDefaultDefineValues(shader);

    assert.equal(defaults.BRIGHTNESS, "0.003");
    assert.equal(defaults.BASE, "0.7");
    assert.equal(defaults.POS, "vec3(0, 0, 8)");
  });

  it("normalizes and filters define values based on control type", () => {
    const shader = getShaderById("w3dfWN");
    assert.ok(shader);

    const sanitized = sanitizeShaderDefineValues(shader, {
      BRIGHTNESS: "1",
      POS: "vec3(1, 2, 3)",
      BANDS: "not-a-number",
      EXTRA: "ignored",
    });

    assert.deepEqual(sanitized, {
      POS: "vec3(1.0, 2.0, 3.0)",
    });
  });

  it("replaces matching define lines in fragment source", () => {
    const shader = getShaderById("w3dfWN");
    assert.ok(shader);

    const fragment = buildShaderFragmentSource(shader, {
      BRIGHTNESS: "0.008",
      POS: "vec3(1.0, 2.0, 3.0)",
    });

    assert.match(fragment, /#define BRIGHTNESS 0\.008/);
    assert.match(fragment, /#define POS vec3\(1\.0, 2\.0, 3\.0\)/);
  });
});
