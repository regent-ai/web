import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getSliderNumericValue,
  parseVec3Literal,
  toGlslFloatLiteral,
  validateShaderDefineInput,
} from "./shader/editor.ts";
import { getShaderById } from "./shader/lib/catalog.ts";

describe("shader editor helpers", () => {
  it("formats GLSL float literals predictably", () => {
    assert.equal(toGlslFloatLiteral(2), "2.0");
    assert.equal(toGlslFloatLiteral(0.25), "0.25");
  });

  it("parses vec3 literals", () => {
    assert.deepEqual(parseVec3Literal("vec3(1, 2, 3)"), [1, 2, 3]);
    assert.equal(parseVec3Literal("vec3(1, nope, 3)"), null);
  });

  it("validates float and vec3 inputs like the source creator flow", () => {
    const shard = getShaderById("w3dfWN");
    assert.ok(shard);

    const brightness = shard.defineControls.find((control) => control.key === "BRIGHTNESS");
    const pos = shard.defineControls.find((control) => control.key === "POS");
    assert.ok(brightness);
    assert.ok(pos);

    assert.deepEqual(validateShaderDefineInput(brightness, "0.005"), {
      isValid: true,
      normalizedValue: "0.005",
      errorMessage: null,
    });

    assert.deepEqual(validateShaderDefineInput(pos, "vec3(1, 2, 3)"), {
      isValid: true,
      normalizedValue: "vec3(1.0, 2.0, 3.0)",
      errorMessage: null,
    });

    assert.equal(
      validateShaderDefineInput(brightness, "999").errorMessage,
      "Value must be <= 0.01.",
    );
    assert.equal(
      validateShaderDefineInput(pos, "1, 2, 3").errorMessage,
      "Use vec3(x, y, z) with numeric values.",
    );
  });

  it("falls back when slider input is invalid", () => {
    assert.equal(getSliderNumericValue("3.25", 1), 3.25);
    assert.equal(getSliderNumericValue("bad", 1), 1);
  });
});
