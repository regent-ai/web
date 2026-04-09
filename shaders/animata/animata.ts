#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  COLLECTION_SEED,
  COLLECTION_VERSION,
  HERO_FRAME_SECONDS,
  LOOP_DURATION_SECONDS,
  LOOP_FPS,
  LOOP_HEIGHT,
  LOOP_WIDTH,
  REGENTS_CLUB_CONTRACT_ADDRESS,
  TOKEN_CARD_ANIMATION_PATH_PREFIX,
  TOKEN_CARD_HEIGHT,
  TOKEN_CARD_IMAGE_PATH_PREFIX,
  TOKEN_CARD_VERSION_LABEL,
  TOKEN_CARD_WIDTH,
} from "./config.ts";
import {
  buildHostedMetadataBundle,
  buildOpenSeaDropPackage,
  buildTokenCardManifest,
} from "./build_drop.ts";
import { analyzeCardImages } from "./analyze_cards.ts";
import { uploadMediaToLighthouse, uploadMetadataToLighthouse, writeJsonFile } from "./lighthouse.ts";
import { buildAnimataPlan } from "./plan.ts";
import { renderTokenCardImage } from "./render_card.ts";
import { renderEditionLoop } from "./render_loop.ts";
import type {
  AnimataEditionPlan,
  AnimataMetadataManifest,
  AnimataPlanDocument,
  AnimataRenderRecord,
  AnimataRenderManifest,
  AnimataTokenCardManifest,
  AnimataTokenCardManifestEntry,
} from "./types.ts";

async function main() {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case "plan":
      await runPlan(rest);
      return;
    case "render-one":
      await runRenderOne(rest);
      return;
    case "render-family-samples":
      await runRenderFamilySamples(rest);
      return;
    case "render-all-families":
      await runRenderAllFamilies(rest);
      return;
    case "render-range":
      await runRenderRange(rest);
      return;
    case "build-card-manifest":
      await runBuildCardManifest(rest);
      return;
    case "render-card-images":
      await runRenderCardImages(rest);
      return;
    case "analyze-card-images":
      await runAnalyzeCardImages(rest);
      return;
    case "rerender-card-outliers":
      await runRerenderCardOutliers(rest);
      return;
    case "build-drop":
      await runBuildDrop(rest);
      return;
    case "build-metadata":
      await runBuildMetadata(rest);
      return;
    case "refresh-opensea":
      await runRefreshOpenSea(rest);
      return;
    case "upload-lighthouse":
      await runUpload(rest);
      return;
    default:
      process.stdout.write(`${usageText()}\n`);
  }
}

async function runPlan(args: string[]) {
  const outPath = resolveFlag(args, "--out") ?? path.resolve(process.cwd(), "shaders/animata/out/plan.json");
  const seed = resolveFlag(args, "--seed") ?? COLLECTION_SEED;
  const plan = buildAnimataPlan(seed);
  await writeJsonFile(outPath, plan);
  writeJson({ ok: true, command: "plan", outPath, total: plan.editions.length });
}

async function runRenderOne(args: string[]) {
  const tokenId = parseInteger(resolveFlag(args, "--token-id") ?? "1", "--token-id");
  const plan = await loadPlan(resolveFlag(args, "--plan"));
  const edition = plan.editions.find((item) => item.tokenId === tokenId);
  if (!edition) {
    throw new Error(`Token ${tokenId} was not found in the plan.`);
  }

  const renderManifestPath = resolveFlag(args, "--render-manifest") ?? path.resolve(process.cwd(), "shaders/animata/out/render-manifest.json");
  const outDir = resolveFlag(args, "--out-dir") ?? path.resolve(process.cwd(), "shaders/animata/out/media");
  const browserPath = resolveFlag(args, "--browser");
  writeProgress(1, 1, edition);
  const record = await renderEditionLoop(edition, resolveLoopOptions(args, outDir, browserPath));
  const manifest = await mergeRenderManifest(renderManifestPath, [record]);
  writeJson({
    ok: true,
    command: "render-one",
    tokenId,
    durationSeconds: record.durationSeconds,
    loopSeamDelta: record.loopSeamDelta,
    loopAdjacentDelta: record.loopAdjacentDelta,
    loopSeamRatio: record.loopSeamRatio,
    loopClosureScore: record.loopClosureScore,
    renderManifestPath,
    items: manifest.items.length,
  });
}

async function runRenderFamilySamples(args: string[]) {
  const plan = await loadPlan(resolveFlag(args, "--plan"));
  const renderManifestPath = resolveFlag(args, "--render-manifest") ?? path.resolve(process.cwd(), "shaders/animata/out/render-manifest.json");
  const outDir = resolveFlag(args, "--out-dir") ?? path.resolve(process.cwd(), "shaders/animata/out/family-samples");
  const browserPath = resolveFlag(args, "--browser");
  const rendered = [];
  const seenFamilies = new Set<string>();
  const sampleEditions = plan.editions.filter((edition) => {
    if (seenFamilies.has(edition.shaderId)) return false;
    seenFamilies.add(edition.shaderId);
    return true;
  });

  for (const [index, edition] of sampleEditions.entries()) {
    writeProgress(index + 1, sampleEditions.length, edition);
    rendered.push(await renderEditionLoop(edition, resolveLoopOptions(args, outDir, browserPath)));
  }

  const manifest = await mergeRenderManifest(renderManifestPath, rendered);
  writeJson({
    ok: true,
    command: "render-family-samples",
    rendered: rendered.length,
    samples: rendered
      .map((record) => ({
        tokenId: record.tokenId,
        shaderId: record.shaderId,
        durationSeconds: record.durationSeconds,
        loopSeamDelta: record.loopSeamDelta,
        loopAdjacentDelta: record.loopAdjacentDelta,
        loopSeamRatio: record.loopSeamRatio,
        loopClosureScore: record.loopClosureScore,
      }))
      .sort((left, right) => left.loopSeamRatio - right.loopSeamRatio),
    renderManifestPath,
    items: manifest.items.length,
  });
}

async function runRenderAllFamilies(args: string[]) {
  const plan = await loadPlan(resolveFlag(args, "--plan"));
  const renderManifestPath = resolveFlag(args, "--render-manifest") ?? path.resolve(process.cwd(), "shaders/animata/out/render-manifest.json");
  const outDir = resolveFlag(args, "--out-dir") ?? path.resolve(process.cwd(), "shaders/animata/out/media");
  const browserPath = resolveFlag(args, "--browser");
  const workers = parseWorkers(resolveFlag(args, "--workers"));
  const skipExisting = hasFlag(args, "--skip-existing");
  const requestedFamilies = parseFamilyFilter(resolveFlag(args, "--families"));
  const limitPerFamily = parseOptionalPositiveInteger(resolveFlag(args, "--limit-per-family"), "--limit-per-family");
  const existingManifest =
    skipExisting ? await readJsonIfExists<AnimataRenderManifest>(renderManifestPath) : null;
  const existingItemsByTokenId = new Map(existingManifest?.items.map((item) => [item.tokenId, item]) ?? []);
  const familyCounts = new Map<string, number>();
  const familyFolders = new Map<string, string>();
  const selectedEditions = plan.editions.filter((edition) => {
    if (requestedFamilies && !requestedFamilies.has(edition.shaderId)) return false;

    const currentCount = familyCounts.get(edition.shaderId) ?? 0;
    if (limitPerFamily !== null && currentCount >= limitPerFamily) return false;

    familyCounts.set(edition.shaderId, currentCount + 1);
    return true;
  });
  familyCounts.clear();

  const results = await runWorkerPool(selectedEditions, workers, async (edition, index, total) => {
    const currentCount = familyCounts.get(edition.shaderId) ?? 0;
    const familyFolderName = buildFamilyFolderName(edition.shaderTitle);
    const familyOutDir = path.join(outDir, familyFolderName);
    writeProgress(index + 1, total, edition);
    const outcome = await renderOrReuseEdition(
      edition,
      resolveLoopOptions(args, familyOutDir, browserPath),
      existingItemsByTokenId,
      skipExisting,
    );
    familyCounts.set(edition.shaderId, currentCount + 1);
    familyFolders.set(edition.shaderId, familyOutDir);
    return outcome;
  });

  const rendered = results.filter((result) => !result.skipped).map((result) => result.record);
  const skippedRecords = results.filter((result) => result.skipped).map((result) => result.record);

  if (rendered.length === 0 && skippedRecords.length === 0) {
    if (requestedFamilies) {
      throw new Error(
        `No editions matched --families ${[...requestedFamilies].join(",")}. Use shader IDs from the plan, such as radiant2 or cubic.`,
      );
    }

    throw new Error("The long-run renderer did not find any editions to render.");
  }

  const manifest = await mergeRenderManifest(renderManifestPath, [...rendered, ...skippedRecords]);
  writeJson({
    ok: true,
    command: "render-all-families",
    rendered: rendered.length,
    skipped: skippedRecords.length,
    workers,
    families: [...familyCounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([shaderId, count]) => ({
        shaderId,
        count,
        outDir: familyFolders.get(shaderId),
      })),
    renderManifestPath,
    items: manifest.items.length,
  });
}

async function runRenderRange(args: string[]) {
  const start = parseInteger(resolveFlag(args, "--start") ?? "1", "--start");
  const end = parseInteger(resolveFlag(args, "--end") ?? `${start}`, "--end");
  if (end < start) {
    throw new Error("--end must be greater than or equal to --start.");
  }

  const plan = await loadPlan(resolveFlag(args, "--plan"));
  const renderManifestPath = resolveFlag(args, "--render-manifest") ?? path.resolve(process.cwd(), "shaders/animata/out/render-manifest.json");
  const outDir = resolveFlag(args, "--out-dir") ?? path.resolve(process.cwd(), "shaders/animata/out/media");
  const browserPath = resolveFlag(args, "--browser");
  const workers = parseWorkers(resolveFlag(args, "--workers"));
  const skipExisting = hasFlag(args, "--skip-existing");
  const existingManifest =
    skipExisting ? await readJsonIfExists<AnimataRenderManifest>(renderManifestPath) : null;
  const existingItemsByTokenId = new Map(existingManifest?.items.map((item) => [item.tokenId, item]) ?? []);
  const selectedEditions = plan.editions.filter(
    (edition) => edition.tokenId >= start && edition.tokenId <= end,
  );

  const results = await runWorkerPool(selectedEditions, workers, async (edition, index, total) => {
    writeProgress(index + 1, total, edition);
    return renderOrReuseEdition(
      edition,
      resolveLoopOptions(args, outDir, browserPath),
      existingItemsByTokenId,
      skipExisting,
    );
  });

  const rendered = results.filter((result) => !result.skipped).map((result) => result.record);
  const skippedRecords = results.filter((result) => result.skipped).map((result) => result.record);
  const manifest = await mergeRenderManifest(renderManifestPath, [...rendered, ...skippedRecords]);
  writeJson({
    ok: true,
    command: "render-range",
    rendered: rendered.length,
    skipped: skippedRecords.length,
    workers,
    renderManifestPath,
    items: manifest.items.length,
  });
}

async function runBuildCardManifest(args: string[]) {
  const plan = await loadPlan(resolveFlag(args, "--plan"));
  const outPath =
    resolveFlag(args, "--out") ??
    path.resolve(process.cwd(), "priv/static/animata/token-card-manifest.json");

  const manifest = buildTokenCardManifest(plan, {
    imagePathPrefix:
      resolveFlag(args, "--image-path-prefix") ?? TOKEN_CARD_IMAGE_PATH_PREFIX,
    animationPathPrefix:
      resolveFlag(args, "--animation-path-prefix") ?? TOKEN_CARD_ANIMATION_PATH_PREFIX,
    versionLabel: resolveFlag(args, "--version-label") ?? TOKEN_CARD_VERSION_LABEL,
  });

  await writeJsonFile(outPath, manifest);
  writeJson({ ok: true, command: "build-card-manifest", outPath, items: manifest.items.length });
}

async function runRenderCardImages(args: string[]) {
  const tokenCardManifest = await loadTokenCardManifest(resolveFlag(args, "--card-manifest"));
  const staticRoot = resolveFlag(args, "--static-root") ?? path.resolve(process.cwd(), "priv/static");
  const start = parseOptionalPositiveInteger(resolveFlag(args, "--start"), "--start");
  const end = parseOptionalPositiveInteger(resolveFlag(args, "--end"), "--end");
  const requestedFamilies = parseFamilyFilter(resolveFlag(args, "--families"));
  const browserPath = resolveFlag(args, "--browser");
  const workers = parseWorkers(resolveFlag(args, "--workers"));
  const skipExisting = hasFlag(args, "--skip-existing");
  const width = parseInteger(resolveFlag(args, "--width") ?? `${TOKEN_CARD_WIDTH}`, "--width");
  const height = parseInteger(resolveFlag(args, "--height") ?? `${TOKEN_CARD_HEIGHT}`, "--height");
  const heroFrameSeconds = parseFloatFlag(
    resolveFlag(args, "--hero-frame-seconds") ?? "",
    HERO_FRAME_SECONDS,
    "--hero-frame-seconds",
  );
  const requestedTokenIds = parseTokenIdFilter(resolveFlag(args, "--token-ids"));
  const selectedEntries = tokenCardManifest.items.filter((entry) => {
    if (requestedFamilies && !requestedFamilies.has(entry.shaderId)) return false;
    if (requestedTokenIds && !requestedTokenIds.has(entry.tokenId)) return false;
    if (start !== null && entry.tokenId < start) return false;
    if (end !== null && entry.tokenId > end) return false;
    return true;
  });

  const results = await runWorkerPool(selectedEntries, workers, async (entry, index, total) => {
    const outPath = path.join(staticRoot, entry.imagePath.replace(/^\/+/, ""));
    writeCardProgress(index + 1, total, entry);

    if (skipExisting && await fileExists(outPath)) {
      return { skipped: true };
    }

    await renderTokenCardImage(entry, {
      width,
      height,
      heroFrameSeconds,
      outPath,
      browserPath,
    });

    return { skipped: false };
  });

  const rendered = results.filter((result) => !result.skipped).length;
  const skipped = results.filter((result) => result.skipped).length;

  writeJson({
    ok: true,
    command: "render-card-images",
    rendered,
    skipped,
    workers,
    staticRoot,
    width,
    height,
  });
}

async function runBuildDrop(args: string[]) {
  const plan = await loadPlan(resolveFlag(args, "--plan"));
  const tokenCardManifest = await loadTokenCardManifest(resolveFlag(args, "--card-manifest"));
  const staticRoot = resolveFlag(args, "--static-root") ?? path.resolve(process.cwd(), "priv/static");
  const outDir = resolveFlag(args, "--out-dir") ?? path.resolve(process.cwd(), "shaders/animata/out/opensea-drop");
  await buildOpenSeaDropPackage(plan, tokenCardManifest, staticRoot, outDir);
  writeJson({ ok: true, command: "build-drop", outDir, items: plan.editions.length });
}

async function runAnalyzeCardImages(args: string[]) {
  const cardsDir =
    resolveFlag(args, "--cards-dir") ??
    path.resolve(process.cwd(), "priv/static/images/animata/cards");
  const outPath =
    resolveFlag(args, "--out") ??
    path.resolve(process.cwd(), "shaders/animata/out/card-analysis.json");

  const report = await analyzeCardImages(cardsDir, outPath);

  writeJson({
    ok: true,
    command: "analyze-card-images",
    cardsDir,
    outPath,
    analyzed: report.analyzed,
    suspectedBlank: report.suspectedBlank.slice(0, 10).map(toSummaryRow),
    suspectedWashed: report.suspectedWashed.slice(0, 10).map(toSummaryRow),
    overallOutliers: report.overallOutliers.slice(0, 20).map(toSummaryRow),
  });
}

async function runRerenderCardOutliers(args: string[]) {
  const analysisPath =
    resolveFlag(args, "--analysis") ??
    path.resolve(process.cwd(), "shaders/animata/out/card-analysis.json");
  const threshold = parseMinimumFloat(resolveFlag(args, "--threshold") ?? "100000", "--threshold");
  const analysis = JSON.parse(await fs.readFile(analysisPath, "utf8")) as {
    items: Array<{ tokenId: number; outlierScore: number }>;
  };

  const tokenIds = analysis.items
    .filter((item) => item.outlierScore > threshold)
    .map((item) => item.tokenId)
    .sort((left, right) => left - right);

  if (tokenIds.length === 0) {
    writeJson({
      ok: true,
      command: "rerender-card-outliers",
      analysisPath,
      threshold,
      rerendered: 0,
      tokenIds: [],
    });
    return;
  }

  const syntheticArgs = [
    "--card-manifest",
    resolveFlag(args, "--card-manifest") ?? path.resolve(process.cwd(), "priv/static/animata/token-card-manifest.json"),
    "--static-root",
    resolveFlag(args, "--static-root") ?? path.resolve(process.cwd(), "priv/static"),
    "--token-ids",
    tokenIds.join(","),
    "--workers",
    resolveFlag(args, "--workers") ?? "4",
  ];

  const browserPath = resolveFlag(args, "--browser");
  if (browserPath) {
    syntheticArgs.push("--browser", browserPath);
  }

  const heroFrameSeconds = resolveFlag(args, "--hero-frame-seconds");
  if (heroFrameSeconds) {
    syntheticArgs.push("--hero-frame-seconds", heroFrameSeconds);
  }

  const width = resolveFlag(args, "--width");
  if (width) {
    syntheticArgs.push("--width", width);
  }

  const height = resolveFlag(args, "--height");
  if (height) {
    syntheticArgs.push("--height", height);
  }

  await runRenderCardImages(syntheticArgs);
}

async function runBuildMetadata(args: string[]) {
  const plan = await loadPlan(resolveFlag(args, "--plan"));
  const cardManifestPath = resolveFlag(args, "--card-manifest");
  if (!cardManifestPath) {
    throw new Error("Missing --card-manifest for build-metadata.");
  }

  const siteUrl = resolveFlag(args, "--site-url");
  if (!siteUrl) {
    throw new Error("Missing --site-url for build-metadata.");
  }

  const tokenCardManifest = await loadTokenCardManifest(cardManifestPath);
  const outDir = resolveFlag(args, "--out-dir") ?? path.resolve(process.cwd(), "priv/static/metadata");
  const manifest = await buildHostedMetadataBundle(plan, tokenCardManifest, siteUrl, outDir);
  writeJson({ ok: true, command: "build-metadata", outDir, items: manifest.items.length });
}

async function runRefreshOpenSea(args: string[]) {
  const apiKeyEnv = resolveFlag(args, "--api-key-env") ?? "OPENSEA_API_KEY";
  const apiKey = process.env[apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Environment variable ${apiKeyEnv} is missing.`);
  }

  const tokenCardManifest = await loadTokenCardManifest(resolveFlag(args, "--card-manifest"));
  const contractAddress =
    resolveFlag(args, "--contract-address") ?? REGENTS_CLUB_CONTRACT_ADDRESS;
  const start = parseOptionalPositiveInteger(resolveFlag(args, "--start"), "--start");
  const end = parseOptionalPositiveInteger(resolveFlag(args, "--end"), "--end");
  const requestedTokenId = parseOptionalPositiveInteger(resolveFlag(args, "--token-id"), "--token-id");

  if (start !== null && end !== null && end < start) {
    throw new Error("--end must be greater than or equal to --start.");
  }

  const selected = tokenCardManifest.items.filter((entry) => {
    if (requestedTokenId !== null) return entry.tokenId === requestedTokenId;
    if (start !== null && entry.tokenId < start) return false;
    if (end !== null && entry.tokenId > end) return false;
    return true;
  });

  if (selected.length === 0) {
    throw new Error("No token cards matched the requested OpenSea refresh range.");
  }

  for (const entry of selected) {
    const response = await fetch(
      `https://api.opensea.io/api/v2/chain/base/contract/${contractAddress}/nfts/${entry.tokenId}/refresh`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "x-api-key": apiKey,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `OpenSea refresh failed for token ${entry.tokenId} with status ${response.status}.`,
      );
    }
  }

  writeJson({
    ok: true,
    command: "refresh-opensea",
    refreshed: selected.length,
    contractAddress,
  });
}

async function runUpload(args: string[]) {
  const apiKeyEnv = resolveFlag(args, "--api-key-env") ?? "LIGHTHOUSE_API_KEY";
  const apiKey = process.env[apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Environment variable ${apiKeyEnv} is missing.`);
  }

  const inputPath = resolveFlag(args, "--input");
  const kind = resolveFlag(args, "--kind");
  const outPath = resolveFlag(args, "--out") ?? path.resolve(process.cwd(), "shaders/animata/out/lighthouse-upload.json");

  if (!inputPath) {
    throw new Error("Missing --input for upload-lighthouse.");
  }

  if (kind === "media") {
    const renderManifest = await loadRenderManifest(inputPath);
    const result = await uploadMediaToLighthouse(renderManifest, apiKey);
    await writeJsonFile(outPath, result);
    writeJson({ ok: true, command: "upload-lighthouse", kind, outPath, items: result.items.length });
    return;
  }

  if (kind === "metadata") {
    const metadataManifest = await loadMetadataManifest(inputPath);
    const result = await uploadMetadataToLighthouse(metadataManifest, apiKey);
    await writeJsonFile(outPath, result);
    writeJson({ ok: true, command: "upload-lighthouse", kind, outPath, items: result.items.length });
    return;
  }

  throw new Error("upload-lighthouse requires --kind media|metadata.");
}

function usageText() {
  return [
    "node --experimental-strip-types shaders/animata/animata.ts plan [--seed regents-club-v1] [--out ./shaders/animata/out/plan.json]",
    "node --experimental-strip-types shaders/animata/animata.ts render-one [--token-id 1] [--plan ./shaders/animata/out/plan.json] [--out-dir ./shaders/animata/out/media]",
    "node --experimental-strip-types shaders/animata/animata.ts render-family-samples [--plan ./shaders/animata/out/plan.json] [--out-dir ./shaders/animata/out/family-samples]",
    "node --experimental-strip-types shaders/animata/animata.ts render-all-families [--plan ./shaders/animata/out/plan.json] [--out-dir ./shaders/animata/out/media] [--families radiant2,cubic] [--limit-per-family 1] [--workers 4] [--skip-existing]",
    "node --experimental-strip-types shaders/animata/animata.ts render-range --start 1 --end 1998 [--plan ./shaders/animata/out/plan.json] [--out-dir ./shaders/animata/out/media] [--workers 4] [--skip-existing]",
    "node --experimental-strip-types shaders/animata/animata.ts build-card-manifest [--plan ./shaders/animata/out/plan.json] [--out ./priv/static/animata/token-card-manifest.json]",
    "node --experimental-strip-types shaders/animata/animata.ts render-card-images [--card-manifest ./priv/static/animata/token-card-manifest.json] [--static-root ./priv/static] [--start 1] [--end 10] [--token-ids 8,70,1123] [--workers 4] [--skip-existing]",
    "node --experimental-strip-types shaders/animata/animata.ts analyze-card-images [--cards-dir ./priv/static/images/animata/cards] [--out ./shaders/animata/out/card-analysis.json]",
    "node --experimental-strip-types shaders/animata/animata.ts rerender-card-outliers [--analysis ./shaders/animata/out/card-analysis.json] [--threshold 100000] [--workers 4]",
    "node --experimental-strip-types shaders/animata/animata.ts build-drop [--plan ./shaders/animata/out/plan.json] [--card-manifest ./priv/static/animata/token-card-manifest.json] [--static-root ./priv/static] [--out-dir ./shaders/animata/out/opensea-drop]",
    "node --experimental-strip-types shaders/animata/animata.ts build-metadata --card-manifest ./priv/static/animata/token-card-manifest.json --site-url https://regents.sh [--plan ./shaders/animata/out/plan.json] [--out-dir ./priv/static/metadata]",
    "node --experimental-strip-types shaders/animata/animata.ts refresh-opensea --card-manifest ./priv/static/animata/token-card-manifest.json --token-id 1 [--api-key-env OPENSEA_API_KEY]",
    "node --experimental-strip-types shaders/animata/animata.ts upload-lighthouse --kind media|metadata --input ./path/to/manifest.json [--api-key-env LIGHTHOUSE_API_KEY] [--out ./shaders/animata/out/lighthouse-upload.json]",
  ].join("\n");
}

function resolveLoopOptions(args: string[], outDir: string, browserPath: string | null) {
  return {
    width: parseInteger(resolveFlag(args, "--width") ?? `${LOOP_WIDTH}`, "--width"),
    height: parseInteger(resolveFlag(args, "--height") ?? `${LOOP_HEIGHT}`, "--height"),
    fps: parseInteger(resolveFlag(args, "--fps") ?? `${LOOP_FPS}`, "--fps"),
    durationSeconds: parseOptionalPositiveFloat(resolveFlag(args, "--duration-seconds"), "--duration-seconds"),
    outDir,
    browserPath,
  };
}

function resolveFlag(args: string[], flag: string) {
  const index = args.indexOf(flag);
  if (index < 0) return null;
  return args[index + 1] ?? null;
}

function hasFlag(args: string[], flag: string) {
  return args.includes(flag);
}

function parseInteger(rawValue: string, flag: string) {
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return parsed;
}

function parseOptionalPositiveInteger(rawValue: string | null, flag: string) {
  if (rawValue === null) return null;
  return parseInteger(rawValue, flag);
}

function parseOptionalPositiveFloat(rawValue: string | null, flag: string) {
  if (rawValue === null) return null;
  const parsed = Number.parseFloat(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive number.`);
  }
  return parsed;
}

function parseMinimumFloat(rawValue: string, flag: string) {
  const parsed = Number.parseFloat(rawValue);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${flag} must be zero or greater.`);
  }
  return parsed;
}

function parseWorkers(rawValue: string | null) {
  if (rawValue === null) return 1;
  return parseInteger(rawValue, "--workers");
}

function toSummaryRow(record: {
  tokenId: number;
  blankScore: number;
  washScore: number;
  outlierScore: number;
  detailScore: number;
  creamCoverage: number;
  meanLuma: number;
}) {
  return {
    tokenId: record.tokenId,
    blankScore: roundMetric(record.blankScore),
    washScore: roundMetric(record.washScore),
    outlierScore: roundMetric(record.outlierScore),
    detailScore: roundMetric(record.detailScore),
    creamCoverage: roundMetric(record.creamCoverage),
    meanLuma: roundMetric(record.meanLuma),
  };
}

function roundMetric(value: number) {
  return Number(value.toFixed(4));
}

function parseFloatFlag(rawValue: string, defaultValue: number, flag: string) {
  if (!rawValue) return defaultValue;
  const parsed = Number.parseFloat(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive number.`);
  }
  return parsed;
}

function parseFamilyFilter(rawValue: string | null) {
  if (!rawValue) return null;
  const values = rawValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return values.length > 0 ? new Set(values) : null;
}

function parseTokenIdFilter(rawValue: string | null) {
  if (!rawValue) return null;

  const tokenIds = rawValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => parseInteger(value, "--token-ids"));

  return new Set(tokenIds);
}

function buildFamilyFolderName(shaderTitle: string) {
  return shaderTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function writeProgress(index: number, total: number, edition: AnimataPlanDocument["editions"][number]) {
  process.stderr.write(
    `[${index}/${total}] token ${edition.tokenId} ${edition.shaderId} ${edition.loopDurationSeconds.toFixed(3)}s\n`,
  );
}

function writeCardProgress(index: number, total: number, entry: AnimataTokenCardManifestEntry) {
  process.stderr.write(`[${index}/${total}] card ${entry.tokenId} ${entry.shaderId}\n`);
}

async function loadPlan(explicitPath: string | null): Promise<AnimataPlanDocument> {
  const planPath = explicitPath ?? path.resolve(process.cwd(), "shaders/animata/out/plan.json");
  const plan = JSON.parse(await fs.readFile(planPath, "utf8")) as AnimataPlanDocument;
  if (plan.version !== COLLECTION_VERSION) {
    throw new Error(`Unexpected plan version ${plan.version}.`);
  }
  return plan;
}

async function loadRenderManifest(explicitPath: string | null): Promise<AnimataRenderManifest> {
  if (!explicitPath) {
    throw new Error("Missing render manifest path.");
  }
  const manifest = JSON.parse(await fs.readFile(explicitPath, "utf8")) as AnimataRenderManifest;
  if (manifest.version !== COLLECTION_VERSION) {
    throw new Error(`Unexpected render manifest version ${manifest.version}.`);
  }
  return manifest;
}

async function loadTokenCardManifest(explicitPath: string | null): Promise<AnimataTokenCardManifest> {
  const manifestPath =
    explicitPath ?? path.resolve(process.cwd(), "priv/static/animata/token-card-manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as AnimataTokenCardManifest;
  if (manifest.version !== COLLECTION_VERSION) {
    throw new Error(`Unexpected token card manifest version ${manifest.version}.`);
  }
  return manifest;
}

async function loadMetadataManifest(explicitPath: string | null): Promise<AnimataMetadataManifest> {
  if (!explicitPath) {
    throw new Error("Missing metadata manifest path.");
  }
  const manifest = JSON.parse(await fs.readFile(explicitPath, "utf8")) as AnimataMetadataManifest;
  if (manifest.version !== COLLECTION_VERSION) {
    throw new Error(`Unexpected metadata manifest version ${manifest.version}.`);
  }
  return manifest;
}

async function mergeRenderManifest(
  renderManifestPath: string,
  nextItems: AnimataRenderManifest["items"],
) {
  const existing = await readJsonIfExists<AnimataRenderManifest>(renderManifestPath);
  const itemsByTokenId = new Map(existing?.items.map((item) => [item.tokenId, item]) ?? []);

  for (const item of nextItems) {
    itemsByTokenId.set(item.tokenId, item);
  }

  const manifest: AnimataRenderManifest = {
    collection: "Regents Club",
    version: COLLECTION_VERSION,
    items: [...itemsByTokenId.values()].sort((left, right) => left.tokenId - right.tokenId),
  };

  await writeJsonFile(renderManifestPath, manifest);
  return manifest;
}

async function renderOrReuseEdition(
  edition: AnimataEditionPlan,
  options: ReturnType<typeof resolveLoopOptions>,
  existingItemsByTokenId: Map<number, AnimataRenderRecord>,
  skipExisting: boolean,
) {
  const posterPath = path.join(options.outDir, edition.posterFileName);
  const videoPath = path.join(options.outDir, edition.videoFileName);

  if (
    skipExisting &&
    await fileExists(posterPath) &&
    await fileExists(videoPath)
  ) {
    return {
      skipped: true,
      record:
        existingItemsByTokenId.get(edition.tokenId) ??
        synthesizeRenderRecord(edition, options, posterPath, videoPath),
    };
  }

  return {
    skipped: false,
    record: await renderEditionLoop(edition, options),
  };
}

function synthesizeRenderRecord(
  edition: AnimataEditionPlan,
  options: ReturnType<typeof resolveLoopOptions>,
  posterPath: string,
  videoPath: string,
): AnimataRenderRecord {
  const durationSeconds = options.durationSeconds ?? edition.loopDurationSeconds;
  const frameCount = Math.max(1, Math.round(options.fps * durationSeconds));

  return {
    tokenId: edition.tokenId,
    shaderId: edition.shaderId,
    signature: edition.signature,
    width: options.width,
    height: options.height,
    fps: options.fps,
    durationSeconds,
    frameCount,
    loopSeamDelta: 0,
    loopAdjacentDelta: 0,
    loopSeamRatio: 0,
    loopClosureScore: 0,
    posterPath,
    videoPath,
  };
}

async function readJsonIfExists<T>(filePath: string) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function runWorkerPool<T, TResult>(
  items: readonly T[],
  workers: number,
  task: (item: T, index: number, total: number) => Promise<TResult>,
) {
  if (items.length === 0) {
    return [] as TResult[];
  }

  const total = items.length;
  const workerCount = Math.max(1, Math.min(workers, total));
  const results: TResult[] = [];
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= total) return;
        results.push(await task(items[index]!, index, total));
      }
    }),
  );

  return results;
}

function writeJson(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : "Animata command failed.";
  process.stderr.write(`${JSON.stringify({ ok: false, error: message }, null, 2)}\n`);
  process.exitCode = 1;
});
