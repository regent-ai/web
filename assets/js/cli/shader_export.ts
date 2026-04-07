import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import { chromium } from "playwright-core";

import { getShaderById } from "../shader/lib/catalog.ts";
import type { ShaderDefineValues } from "../shader/lib/types.ts";

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const BROWSER_ENTRY = path.join(THIS_DIR, "shader_export_browser.ts");

const DEFAULT_BROWSER_CANDIDATES = [
  process.env.REGENT_CHROME_EXECUTABLE,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

interface ShaderExportOptions {
  shaderId: string;
  defineValues: ShaderDefineValues;
  width: number;
  height: number;
  settleMs: number;
  outPath: string;
  specOutPath: string | null;
  browserPath: string | null;
}

export async function exportShaderImage(options: ShaderExportOptions) {
  const shader = getShaderById(options.shaderId);
  if (!shader) {
    throw new Error(`Unknown shader "${options.shaderId}".`);
  }

  const executablePath = await resolveBrowserExecutable(options.browserPath);
  const bundleText = await buildBrowserBundle();

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
      (window as any).__REGENT_SHADER_EXPORT_CONFIG__ = config;
    }, {
      shaderId: options.shaderId,
      defineValues: options.defineValues,
      width: options.width,
      height: options.height,
      settleMs: options.settleMs,
    });
    await page.addScriptTag({ content: bundleText });

    await page.waitForFunction(
      () =>
        Boolean(
          (window as any).__REGENT_SHADER_EXPORT_RESULT__ ||
            (window as any).__REGENT_SHADER_EXPORT_ERROR__,
        ),
      { timeout: 30_000 },
    );

    const payload = await page.evaluate(() => ({
      result: (window as any).__REGENT_SHADER_EXPORT_RESULT__ ?? null,
      error: (window as any).__REGENT_SHADER_EXPORT_ERROR__ ?? null,
    }));

    if (payload.error) {
      throw new Error(payload.error);
    }

    if (!payload.result?.dataUrl || !payload.result.imageSpec) {
      throw new Error("Shader export did not return image data.");
    }

    const imageBytes = decodePngDataUrl(payload.result.dataUrl);
    await fs.mkdir(path.dirname(options.outPath), { recursive: true });
    await fs.writeFile(options.outPath, imageBytes);

    if (options.specOutPath) {
      await fs.mkdir(path.dirname(options.specOutPath), { recursive: true });
      await fs.writeFile(
        options.specOutPath,
        `${JSON.stringify(payload.result.imageSpec, null, 2)}\n`,
        "utf8",
      );
    }

    return {
      shaderId: shader.id,
      title: shader.title,
      usage: shader.usage,
      sourceUrl: shader.sourceUrl,
      outPath: options.outPath,
      specOutPath: options.specOutPath,
      width: options.width,
      height: options.height,
      defineValues: options.defineValues,
      imageSpec: payload.result.imageSpec,
    };
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
    jsx: "automatic",
  });

  const outputFile = result.outputFiles?.[0];
  if (!outputFile) {
    throw new Error("Shader export bundle was empty.");
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

function decodePngDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) {
    throw new Error("Shader export returned an unexpected image payload.");
  }

  return Buffer.from(match[1], "base64");
}
