import { promises as fs } from "node:fs";
import path from "node:path";
import { chromium } from "../../assets/node_modules/playwright-core/index.mjs";

import { HERO_FRAME_SECONDS } from "./config.ts";
import type { AnimataTokenCardManifestEntry } from "./types.ts";

const LIVE_CARD_STAGE_WIDTH = 384;
const LIVE_CARD_STAGE_HEIGHT = 512;
const LIVE_CARD_HORIZONTAL_MARGIN = 72;
const LIVE_CARD_VERTICAL_MARGIN = 96;
const LIVE_CARD_VIEWPORT_WIDTH = LIVE_CARD_STAGE_WIDTH + LIVE_CARD_HORIZONTAL_MARGIN * 2;
const LIVE_CARD_VIEWPORT_HEIGHT = LIVE_CARD_STAGE_HEIGHT + LIVE_CARD_VERTICAL_MARGIN * 2;
const LOCAL_RENDER_BASE_URL =
  process.env.ANIMATA_LOCAL_RENDER_BASE_URL ?? "http://127.0.0.1:4000";

const DEFAULT_BROWSER_CANDIDATES = [
  process.env.REGENT_CHROME_EXECUTABLE,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

export interface TokenCardRenderOptions {
  width: number;
  height: number;
  heroFrameSeconds: number;
  outPath: string;
  browserPath: string | null;
}

export async function renderTokenCardImage(
  entry: AnimataTokenCardManifestEntry,
  options: TokenCardRenderOptions,
) {
  const executablePath = await resolveBrowserExecutable(options.browserPath);
  const deviceScaleFactor = options.width / LIVE_CARD_VIEWPORT_WIDTH;
  await fs.mkdir(path.dirname(options.outPath), { recursive: true });

  if (Math.abs(options.height / LIVE_CARD_VIEWPORT_HEIGHT - deviceScaleFactor) > 0.0001) {
    throw new Error("Token card output dimensions must keep the 3:4 card render ratio.");
  }

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
        width: LIVE_CARD_VIEWPORT_WIDTH,
        height: LIVE_CARD_VIEWPORT_HEIGHT,
      },
      deviceScaleFactor,
    });

    const liveCardUrl = new URL(`/cards/regents-club/${entry.tokenId}`, LOCAL_RENDER_BASE_URL);

    try {
      await page.goto(liveCardUrl.toString(), { waitUntil: "networkidle", timeout: 30_000 });
    } catch {
      throw new Error(
        `Token card image rendering now captures the live Phoenix card page. Start mix phx.server on ${LOCAL_RENDER_BASE_URL} before running render-card-images.`,
      );
    }

    await page.addStyleTag({
      content: `
        html,
        body,
        #regents-token-card-page,
        .rtc-page {
          background: transparent !important;
        }

        .rtc-page {
          min-height: 100vh !important;
          padding: 0 !important;
        }
      `,
    });

    await page.waitForSelector(".rtc-card", { state: "visible", timeout: 30_000 });
    await page.waitForSelector(".rtc-chamber canvas", { state: "attached", timeout: 30_000 });
    await page.waitForFunction(() => document.fonts.status === "loaded", { timeout: 30_000 });
    await page.waitForFunction(waitForShaderSignal, { timeout: 30_000 });
    await page.waitForTimeout(Math.max(250, Math.round(options.heroFrameSeconds * 1000)));

    await page.screenshot({
      path: options.outPath,
      type: "png",
      omitBackground: true,
    });
  } finally {
    await browser.close();
  }
}

function waitForShaderSignal() {
  const card = document.querySelector(".rtc-card");
  const canvas = document.querySelector(".rtc-chamber canvas");

  if (!(card instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
    return false;
  }

  const cardRect = card.getBoundingClientRect();
  if (cardRect.width < 300 || cardRect.height < 420) {
    return false;
  }

  const canvasStyle = window.getComputedStyle(canvas);
  if (Number.parseFloat(canvasStyle.opacity || "0") < 0.95) {
    return false;
  }

  if (canvas.width < 8 || canvas.height < 8) {
    return false;
  }

  const probeCanvas = document.createElement("canvas");
  probeCanvas.width = 12;
  probeCanvas.height = 12;
  const context = probeCanvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return false;
  }

  try {
    context.drawImage(canvas, 0, 0, probeCanvas.width, probeCanvas.height);
  } catch {
    return false;
  }

  const { data } = context.getImageData(0, 0, probeCanvas.width, probeCanvas.height);
  let opaquePixels = 0;
  let brightPixels = 0;
  let sumLuma = 0;
  let sumLumaSquared = 0;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255;
    if (alpha < 0.05) continue;

    opaquePixels += 1;
    const r = data[index] / 255;
    const g = data[index + 1] / 255;
    const b = data[index + 2] / 255;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    sumLuma += luma;
    sumLumaSquared += luma * luma;
    if (luma > 0.09) {
      brightPixels += 1;
    }
  }

  if (opaquePixels < 40) {
    return false;
  }

  const meanLuma = sumLuma / opaquePixels;
  const variance = Math.max(0, sumLumaSquared / opaquePixels - meanLuma * meanLuma);
  const stdDev = Math.sqrt(variance);

  return meanLuma > 0.025 && stdDev > 0.01 && brightPixels >= 10;
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
