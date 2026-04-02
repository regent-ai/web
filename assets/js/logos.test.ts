import test from "node:test";
import assert from "node:assert/strict";

import { expandExportFrame, logoStudies, voxelCountForStudy } from "./logos.ts";

test("png export frame grows by 1.5x around the same center", () => {
  const expanded = expandExportFrame({ minX: 10, minY: 20, width: 200, height: 120 }, 1.5);

  assert.deepEqual(expanded, {
    minX: -40,
    minY: -10,
    width: 300,
    height: 180,
  });
});

test("regent studies use 3 layers and 192 voxels", () => {
  assert.equal(logoStudies.regents.length, 16, "regents should expose 16 studies");
  for (const study of logoStudies.regents) {
    const count = voxelCountForStudy("regents", study.id);
    const pointMark = study.marks?.[0];

    assert.equal(study.depth, 3, `${study.id} should be 3 layers deep`);
    assert.ok(pointMark?.kind === "points", `${study.id} should be built from one rotated hook field`);
    assert.ok(
      pointMark.points.every(([x, y]) => x !== 0 && y !== 0),
      `${study.id} should keep a blank cross between the four quadrants`,
    );

    if (study.id === "study-1") {
      assert.ok(count > 192, `${study.id} should be denser than the simpler Regent hook studies`);
      assert.ok(
        pointMark.points.length > 64 && pointMark.points.length % 4 === 0,
        `${study.id} should remain a four-copy quadrant rotation`,
      );
      continue;
    }

    assert.equal(count, 192, `${study.id} should have 192 voxels`);
    assert.equal(pointMark.points.length, 64, `${study.id} should have 64 cells per layer`);
  }
});

test("regent elbow studies use the single-shape reference at 3 layers", () => {
  assert.equal(logoStudies["regent-elbow"].length, 16, "regent elbow should expose 16 studies");
  for (const study of logoStudies["regent-elbow"]) {
    const count = voxelCountForStudy("regent-elbow", study.id);
    const pointMark = study.marks?.[0];

    assert.equal(study.depth, 3, `${study.id} should be 3 layers deep`);
    assert.ok(pointMark?.kind === "points", `${study.id} should be a direct elbow field`);
    assert.ok(count > 0, `${study.id} should contain voxels`);
    assert.ok(
      pointMark.points.length >= 24,
      `${study.id} should keep enough cells to read as two detached elbows`,
    );
  }
});

test("techtree studies use alpha and beta four-layer stacks", () => {
  assert.equal(logoStudies.techtree.length, 16, "techtree should expose 16 studies");
  for (const study of logoStudies.techtree) {
    assert.equal(study.depth, 4, `${study.id} should be 4 layers deep`);
    assert.equal(study.layerCells?.length, 4, `${study.id} should define four layers`);
    assert.deepEqual(
      study.layerCells?.[0],
      study.layerCells?.[1],
      `${study.id} should use identical T_alpha layers`,
    );
    assert.deepEqual(
      study.layerCells?.[2],
      study.layerCells?.[3],
      `${study.id} should use identical T_beta layers`,
    );
    assert.equal(study.layerCells?.[0]?.length, 22, `${study.id} should have 22 cells in each T_alpha layer`);
    assert.equal(study.layerCells?.[2]?.length, 22, `${study.id} should have 22 cells in each T_beta layer`);
    assert.equal(voxelCountForStudy("techtree", study.id), 88, `${study.id} should have 88 voxels`);

    const alphaBottom = study.layerCells?.[1]?.find(([x, y]) => x === 1 && y === 7);
    const betaLeftTip = study.layerCells?.[2]?.find(([x, y]) => x === 1 && y === 7);
    assert.ok(alphaBottom, `${study.id} should keep the T_alpha bottom voxel at the anchor`);
    assert.ok(betaLeftTip, `${study.id} should place the T_beta left tip behind the anchor`);
  }
});

test("autolaunch studies still contain voxels", () => {
  assert.equal(logoStudies.autolaunch.length, 16, "autolaunch should expose 16 studies");
  for (const study of logoStudies.autolaunch) {
    assert.ok(voxelCountForStudy("autolaunch", study.id) > 0, `${study.id} should contain voxels`);
  }
});
