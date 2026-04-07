import {
  buildShaderFragmentSource,
  buildShaderImageSpec,
  getShaderById,
} from "../shader/lib/catalog.ts";
import { createShaderToyRuntime } from "../shader/lib/runtime.ts";
import type { ShaderDefineValues, ShaderImageSpec } from "../shader/lib/types.ts";

interface BrowserExportConfig {
  shaderId: string;
  defineValues: ShaderDefineValues;
  width: number;
  height: number;
  settleMs: number;
}

interface BrowserExportResult {
  dataUrl: string;
  imageSpec: ShaderImageSpec;
}

declare global {
  interface Window {
    __REGENT_SHADER_EXPORT_CONFIG__?: BrowserExportConfig;
    __REGENT_SHADER_EXPORT_RESULT__?: BrowserExportResult;
    __REGENT_SHADER_EXPORT_ERROR__?: string;
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

async function run() {
  const config = window.__REGENT_SHADER_EXPORT_CONFIG__;
  if (!config) {
    throw new Error("Missing shader export config.");
  }

  const shader = getShaderById(config.shaderId);
  if (!shader) {
    throw new Error(`Unknown shader "${config.shaderId}".`);
  }

  const canvas = document.createElement("canvas");
  canvas.width = config.width;
  canvas.height = config.height;
  canvas.style.display = "block";
  canvas.style.width = `${config.width}px`;
  canvas.style.height = `${config.height}px`;
  document.body.replaceChildren(canvas);

  const runtime = createShaderToyRuntime(canvas, {
    fragmentSource: buildShaderFragmentSource(shader, config.defineValues),
    channels: shader.channels,
    devicePixelRatioCap: 1,
    debugLabel: `shader-export:${shader.id}`,
    preserveDrawingBuffer: true,
  });

  runtime.start();
  await sleep(Math.max(0, config.settleMs));

  const dataUrl = runtime.captureFrame("image/png");
  runtime.stop();
  runtime.destroy();

  if (!dataUrl) {
    throw new Error("Shader export capture failed.");
  }

  window.__REGENT_SHADER_EXPORT_RESULT__ = {
    dataUrl,
    imageSpec: buildShaderImageSpec(shader, config.defineValues),
  };
}

void run().catch((error) => {
  window.__REGENT_SHADER_EXPORT_ERROR__ =
    error instanceof Error ? error.message : "Shader export failed.";
});
