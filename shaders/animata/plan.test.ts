import assert from "node:assert/strict";
import test from "node:test";

import { buildAnimataPlan } from "./plan.ts";

test("animata plan is the right size and stays unique", () => {
  const plan = buildAnimataPlan();
  assert.equal(plan.editions.length, 1_998);

  const signatures = new Set(plan.editions.map((edition) => edition.signature));
  assert.equal(signatures.size, 1_998);
});

test("animata plan keeps radiant2 highest and singularity lowest", () => {
  const plan = buildAnimataPlan();
  const counts = new Map<string, number>();

  for (const edition of plan.editions) {
    counts.set(edition.shaderId, (counts.get(edition.shaderId) ?? 0) + 1);
  }

  assert.equal(counts.get("radiant2"), 173);
  assert.equal(counts.get("singularity"), 43);
  assert.equal(counts.get("w3dfWN") ?? 0, 0);
  assert.equal(counts.get("buffer") ?? 0, 0);
  assert.equal(counts.get("bitmap") ?? 0, 0);
  assert.equal(counts.get("centrifuge"), 20);
  assert.equal(counts.get("cubic"), 20);
});

test("animata plan keeps magnetic brightness near its safe baseline", () => {
  const plan = buildAnimataPlan();
  const magneticEdition = plan.editions.find((edition) => edition.shaderId === "magnetic");

  assert.ok(magneticEdition);
  const brightness = Number.parseFloat(magneticEdition!.defineValues.BRIGHTNESS);
  assert.ok(brightness >= 450_000);
  assert.ok(brightness <= 2_200_000);
});

test("animata plan keeps cubic vertical direction fixed at the default", () => {
  const plan = buildAnimataPlan();
  const cubicEditions = plan.editions.filter((edition) => edition.shaderId === "cubic");

  assert.ok(cubicEditions.length > 0);
  assert.ok(cubicEditions.every((edition) => edition.defineValues.VEL === "vec3(0,-1,-1)"));
  assert.ok(cubicEditions.every((edition) => edition.defineValues.WAVE_FREQ === "5"));
  assert.ok(cubicEditions.every((edition) => ["1", "2"].includes(edition.defineValues.COL_FREQ)));
});

test("animata plan locks the tuned seam families to repeat-safe motion values", () => {
  const plan = buildAnimataPlan();
  const magneticEditions = plan.editions.filter((edition) => edition.shaderId === "magnetic");
  const flareEditions = plan.editions.filter((edition) => edition.shaderId === "flare");
  const centrifugeEditions = plan.editions.filter((edition) => edition.shaderId === "centrifuge");

  assert.ok(magneticEditions.every((edition) => edition.defineValues.TURB_SPEED === "0.5"));
  assert.ok(flareEditions.every((edition) => edition.defineValues.TRAIL === "0"));
  assert.ok(centrifugeEditions.every((edition) => edition.defineValues.INNER_SCALE === "0.2"));
  assert.ok(centrifugeEditions.every((edition) => edition.defineValues.SCROLL === "5"));
});
