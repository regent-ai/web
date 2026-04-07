import assert from "node:assert/strict";
import test from "node:test";

import { parseRegentCommand, shaderListPayload, usageText } from "./shader_cli.ts";

const cwd = "/tmp/regent-cli";

test("usage text mentions shader list and export", () => {
  const help = usageText();
  assert.match(help, /regent shader list/);
  assert.match(help, /regent shader export/);
});

test("shader list command parses usage filter", () => {
  const command = parseRegentCommand(["shader", "list", "--usage", "avatar"], cwd);
  assert.deepEqual(command, {
    kind: "shader-list",
    usage: "avatar",
  });
});

test("shader list payload contains define controls", () => {
  const payload = shaderListPayload({
    kind: "shader-list",
    usage: "avatar",
  });

  assert.equal(payload.ok, true);
  assert.ok(payload.shaders.length > 0);
  assert.ok(payload.shaders.some((shader) => shader.id === "w3dfWN"));
  assert.ok(payload.shaders.every((shader) => Array.isArray(shader.defineControls)));
});

test("shader export parses define overrides and output paths", () => {
  const command = parseRegentCommand(
    [
      "shader",
      "export",
      "w3dfWN",
      "--define",
      "BRIGHTNESS=0.004",
      "--define",
      "POS=vec3(1, 2, 3)",
      "--width",
      "640",
      "--height",
      "640",
      "--settle-ms",
      "1200",
      "--out",
      "./avatars/shard.png",
      "--spec-out",
      "./avatars/shard.json",
    ],
    cwd,
  );

  assert.equal(command.kind, "shader-export");
  if (command.kind !== "shader-export") return;

  assert.equal(command.shaderId, "w3dfWN");
  assert.equal(command.width, 640);
  assert.equal(command.height, 640);
  assert.equal(command.settleMs, 1200);
  assert.equal(command.outPath, "/tmp/regent-cli/avatars/shard.png");
  assert.equal(command.specOutPath, "/tmp/regent-cli/avatars/shard.json");
  assert.equal(command.defineValues.BRIGHTNESS, "0.004");
  assert.equal(command.defineValues.POS, "vec3(1.0, 2.0, 3.0)");
});

test("shader export rejects unknown define keys", () => {
  assert.throws(
    () =>
      parseRegentCommand(
        ["shader", "export", "w3dfWN", "--define", "NOPE=1"],
        cwd,
      ),
    /does not expose/,
  );
});
