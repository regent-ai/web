import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { build } from "../../assets/node_modules/esbuild/lib/main.js";
import { chromium } from "../../assets/node_modules/playwright-core/index.mjs";

import { HERO_FRAME_SECONDS } from "./config.ts";
import type { AnimataTokenCardManifestEntry } from "./types.ts";

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const BROWSER_ENTRY = path.join(THIS_DIR, "render_card_browser.tsx");

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
  const bundleText = await buildBrowserBundle();
  await fs.mkdir(path.dirname(options.outPath), { recursive: true });

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
      "<!doctype html><html><head><meta charset=\"utf-8\" /></head><body></body></html>",
      { waitUntil: "domcontentloaded" },
    );

    await page.evaluate((config) => {
      (window as any).__ANIMATA_CARD_RENDER_CONFIG__ = config;
    }, {
      entry,
      width: options.width,
      height: options.height,
      heroFrameSeconds: options.heroFrameSeconds,
      fontDisplayUrl: pathToFileURL(path.resolve(process.cwd(), "priv/static/fonts/GeistPixel-Circle.woff2")).toString(),
      fontBodyUrl: pathToFileURL(path.resolve(process.cwd(), "priv/static/fonts/GeistPixel-Square.woff2")).toString(),
    });

    await page.addScriptTag({ content: bundleText });
    await page.waitForFunction(
      () =>
        Boolean(
          (window as any).__ANIMATA_CARD_RENDER_READY__ ||
            (window as any).__ANIMATA_CARD_RENDER_ERROR__,
        ),
      { timeout: 30_000 },
    );

    const bootState = await page.evaluate(() => ({
      ready: Boolean((window as any).__ANIMATA_CARD_RENDER_READY__),
      error: (window as any).__ANIMATA_CARD_RENDER_ERROR__ ?? null,
    }));

    if (bootState.error || !bootState.ready) {
      throw new Error(bootState.error ?? "Token card renderer did not initialize.");
    }

    const locator = page.locator("#token-card-render-root");
    await locator.screenshot({
      path: options.outPath,
      type: "png",
      omitBackground: false,
    });
  } finally {
    await browser.close();
  }
}

async function buildBrowserBundle() {
  const result = await build({
    entryPoints: [BROWSER_ENTRY],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    target: ["es2022"],
    nodePaths: [path.resolve(process.cwd(), "assets/node_modules")],
  });

  const outputFile = result.outputFiles?.[0];
  if (!outputFile) {
    throw new Error("Animata token card browser bundle was empty.");
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
