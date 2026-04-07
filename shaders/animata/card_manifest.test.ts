import test from "node:test";
import assert from "node:assert/strict";

import { buildTokenCardManifest } from "./build_drop.ts";
import { buildAnimataPlan } from "./plan.ts";

test("token card manifest keeps the collection shape stable", () => {
  const plan = buildAnimataPlan();
  const manifest = buildTokenCardManifest(plan);

  assert.equal(manifest.items.length, 1998);

  const first = manifest.items[0];
  assert.equal(first?.tokenId, 1);
  assert.equal(first?.name, "Regents Club #1");
  assert.match(first?.imagePath ?? "", /^\/images\/animata\/cards\/1\.png$/);
  assert.match(first?.animationPath ?? "", /^\/cards\/regents-club\/1$/);
  assert.match(first?.versionLabel ?? "", /^0001\.v1$/);
});
