import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { build } from "../../assets/node_modules/esbuild/lib/main.js";
import { chromium } from "../../assets/node_modules/playwright-core/index.mjs";

import { HERO_FRAME_SECONDS } from "./config.ts";
import type { AnimataEditionPlan, AnimataRenderRecord } from "./types.ts";

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const BROWSER_ENTRY = path.join(THIS_DIR, "render_loop_browser.ts");

const DEFAULT_BROWSER_CANDIDATES = [
  process.env.REGENT_CHROME_EXECUTABLE,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

export interface LoopRenderOptions {
  width: number;
  height: number;
  fps: number;
  durationSeconds: number | null;
  outDir: string;
  browserPath: string | null;
}

export async function renderEditionLoop(
  edition: AnimataEditionPlan,
  options: LoopRenderOptions,
): Promise<AnimataRenderRecord> {
  const executablePath = await resolveBrowserExecutable(options.browserPath);
  const bundleText = await buildBrowserBundle();
  const durationSeconds = options.durationSeconds ?? edition.loopDurationSeconds;
  const frameCount = Math.max(1, Math.round(options.fps * durationSeconds));
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `animata-${edition.tokenId}-`));

  await fs.mkdir(options.outDir, { recursive: true });
  const posterPath = path.join(options.outDir, edition.posterFileName);
  const videoPath = path.join(options.outDir, edition.videoFileName);

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: [
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--use-angle=swiftshader",
    ],
  });

  try {
    const page = await browser.newPage({
      viewport: {
        width: options.width,
        height: options.height,
      },
      deviceScaleFactor: 1,
    });

    await page.setContent(
      "<!doctype html><html><head><meta charset=\"utf-8\" /></head><body style=\"margin:0;background:#000;overflow:hidden;\"></body></html>",
      { waitUntil: "domcontentloaded" },
    );
    await page.evaluate((config) => {
      (window as any).__ANIMATA_LOOP_RENDER_CONFIG__ = config;
    }, {
      shaderId: edition.shaderId,
      defineValues: edition.defineValues,
      width: options.width,
      height: options.height,
    });
    await page.addScriptTag({ content: bundleText });
    await page.waitForFunction(
      () =>
        Boolean(
          (window as any).__ANIMATA_LOOP_RENDER_READY__ ||
            (window as any).__ANIMATA_LOOP_RENDER_ERROR__,
        ),
      { timeout: 30_000 },
    );

    const bootState = await page.evaluate(() => ({
      ready: Boolean((window as any).__ANIMATA_LOOP_RENDER_READY__),
      error: (window as any).__ANIMATA_LOOP_RENDER_ERROR__ ?? null,
    }));

    if (bootState.error || !bootState.ready) {
      throw new Error(bootState.error ?? "Animata loop renderer did not initialize.");
    }

    const heroFrameIndex = Math.min(
      frameCount - 1,
      Math.max(0, Math.round(HERO_FRAME_SECONDS * options.fps)),
    );
    let posterFramePath: string | null = null;
    let bestPosterScore = Number.NEGATIVE_INFINITY;
    let bestMeanLuma = 0;
    let firstFingerprint: number[] | null = null;
    let lastFingerprint: number[] | null = null;
    let previousFingerprint: number[] | null = null;
    let adjacentDeltaTotal = 0;
    let adjacentDeltaCount = 0;

    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      const elapsedSeconds = durationSeconds * (frameIndex / frameCount);
      const deltaSeconds = frameIndex === 0 ? 0 : durationSeconds / frameCount;
      const capture = await page.evaluate(
        ({ elapsedSeconds: nextElapsed, deltaSeconds: nextDelta }) =>
          (window as any).__ANIMATA_CAPTURE_FRAME__?.(nextElapsed, nextDelta) ?? null,
        { elapsedSeconds, deltaSeconds },
      );

      if (!capture?.dataUrl) {
        throw new Error(`Frame ${frameIndex} did not return image data.`);
      }

      const framePath = path.join(tempDir, `frame-${String(frameIndex).padStart(4, "0")}.png`);
      const bytes = decodePngDataUrl(capture.dataUrl);
      await fs.writeFile(framePath, bytes);

      const posterScore = capture.metrics?.posterScore ?? Number.NEGATIVE_INFINITY;
      const fingerprint = capture.metrics?.fingerprint ?? null;
      if (frameIndex === 0 && fingerprint) {
        firstFingerprint = fingerprint;
      }
      if (frameIndex === frameCount - 1 && fingerprint) {
        lastFingerprint = fingerprint;
      }
      if (previousFingerprint && fingerprint) {
        adjacentDeltaTotal += fingerprintDelta(previousFingerprint, fingerprint);
        adjacentDeltaCount += 1;
      }
      if (fingerprint) {
        previousFingerprint = fingerprint;
      }

      if (posterScore > bestPosterScore) {
        bestPosterScore = posterScore;
        bestMeanLuma = capture.metrics?.meanLuma ?? 0;
        posterFramePath = framePath;
      } else if (posterFramePath === null && frameIndex === heroFrameIndex) {
        posterFramePath = framePath;
      }
    }

    if (!posterFramePath) {
      throw new Error("No poster frame was selected.");
    }

    if (bestMeanLuma < 0.02) {
      throw new Error(
        `Rendered loop for token ${edition.tokenId} stayed too dark (mean luminance ${bestMeanLuma.toFixed(4)}).`,
      );
    }

    const loopSeamDelta = fingerprintDelta(firstFingerprint, lastFingerprint);
    const loopAdjacentDelta = adjacentDeltaCount > 0 ? adjacentDeltaTotal / adjacentDeltaCount : 0;
    const loopSeamRatio = loopAdjacentDelta > 0 ? loopSeamDelta / loopAdjacentDelta : 1;
    const loopClosureScore = Math.max(0, 1 - Math.max(0, loopSeamRatio - 1));

    await fs.copyFile(posterFramePath, posterPath);
    await encodeVideo(tempDir, options.fps, videoPath);

    return {
      tokenId: edition.tokenId,
      shaderId: edition.shaderId,
      signature: edition.signature,
      width: options.width,
      height: options.height,
      fps: options.fps,
      durationSeconds,
      frameCount,
      loopSeamDelta,
      loopAdjacentDelta,
      loopSeamRatio,
      loopClosureScore,
      posterPath,
      videoPath,
    };
  } finally {
    await browser.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function fingerprintDelta(left: number[] | null, right: number[] | null) {
  if (!left || !right || left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 1;
  }

  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    total += Math.abs((left[index] ?? 0) - (right[index] ?? 0));
  }

  return total / left.length;
}

async function buildBrowserBundle() {
  const result = await build({
    entryPoints: [BROWSER_ENTRY],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    target: ["es2022"],
  });

  const outputFile = result.outputFiles?.[0];
  if (!outputFile) {
    throw new Error("Animata browser bundle was empty.");
  }

  return outputFile.text;
}

async function resolveBrowserExecutable(preferredPath: string | null) {
  if (preferredPath) {
    await fs.access(preferredPath);
    return preferredPath;
  }

  for (const candidate of DEFAULT_BROWSER_CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error(
    "No Chrome or Chromium executable was found. Pass --browser /absolute/path/to/chrome or set REGENT_CHROME_EXECUTABLE.",
  );
}

async function encodeVideo(frameDir: string, fps: number, outPath: string) {
  await spawnChecked("/opt/homebrew/bin/ffmpeg", [
    "-y",
    "-framerate",
    `${fps}`,
    "-i",
    path.join(frameDir, "frame-%04d.png"),
    "-an",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    outPath,
  ]);
}

function decodePngDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) {
    throw new Error("Animata renderer returned an unexpected image payload.");
  }

  return Buffer.from(match[1], "base64");
}

function spawnChecked(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `${command} exited with code ${code}.`));
    });
  });
}
