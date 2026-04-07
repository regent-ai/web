import { buildShaderFragmentSource, getShaderById } from "../../assets/js/shader/lib/catalog.ts";
import { createShaderToyRuntime } from "../../assets/js/shader/lib/runtime.ts";
import type { ShaderDefineValues } from "../../assets/js/shader/lib/types.ts";

interface LoopRenderConfig {
  shaderId: string;
  defineValues: ShaderDefineValues;
  width: number;
  height: number;
}

interface LoopFrameMetrics {
  meanLuma: number;
  brightRatio: number;
  posterScore: number;
  fingerprint: number[];
}

interface LoopFrameCapture {
  dataUrl: string | null;
  metrics: LoopFrameMetrics | null;
}

declare global {
  interface Window {
    __ANIMATA_LOOP_RENDER_CONFIG__?: LoopRenderConfig;
    __ANIMATA_LOOP_RENDER_READY__?: boolean;
    __ANIMATA_LOOP_RENDER_ERROR__?: string;
    __ANIMATA_CAPTURE_FRAME__?: (
      elapsedSeconds: number,
      deltaSeconds: number,
    ) => LoopFrameCapture | null;
  }
}

async function run() {
  const config = window.__ANIMATA_LOOP_RENDER_CONFIG__;
  if (!config) {
    throw new Error("Missing animata loop render config.");
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
  const analysisCanvas = document.createElement("canvas");
  analysisCanvas.width = config.width;
  analysisCanvas.height = config.height;
  const analysisContext = analysisCanvas.getContext("2d", { willReadFrequently: true });

  const runtime = createShaderToyRuntime(canvas, {
    fragmentSource: buildShaderFragmentSource(shader, config.defineValues),
    channels: shader.channels,
    devicePixelRatioCap: 1,
    debugLabel: `animata-loop:${shader.id}`,
    preserveDrawingBuffer: true,
  });

  window.__ANIMATA_CAPTURE_FRAME__ = (elapsedSeconds: number, deltaSeconds: number) => {
    runtime.renderFrameAt(elapsedSeconds, deltaSeconds);
    let metrics: LoopFrameMetrics | null = null;
    if (analysisContext) {
      analysisContext.clearRect(0, 0, analysisCanvas.width, analysisCanvas.height);
      analysisContext.drawImage(canvas, 0, 0);
      metrics = analyzeCanvas(analysisContext, canvas.width, canvas.height);
    }

    return {
      dataUrl: runtime.captureFrame("image/png"),
      metrics,
    };
  };

  window.__ANIMATA_LOOP_RENDER_READY__ = true;
}

void run().catch((error) => {
  window.__ANIMATA_LOOP_RENDER_ERROR__ =
    error instanceof Error ? error.message : "Animata loop renderer failed.";
});

function analyzeCanvas(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): LoopFrameMetrics {
  const source = context.getImageData(0, 0, width, height).data;
  const step = 8;
  let samples = 0;
  let lumaTotal = 0;
  let brightSamples = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      const red = source[index] ?? 0;
      const green = source[index + 1] ?? 0;
      const blue = source[index + 2] ?? 0;
      const luma = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
      lumaTotal += luma;
      if (luma >= 0.08) {
        brightSamples += 1;
      }
      samples += 1;
    }
  }

  const meanLuma = samples > 0 ? lumaTotal / samples : 0;
  const brightRatio = samples > 0 ? brightSamples / samples : 0;

  return {
    meanLuma,
    brightRatio,
    posterScore: meanLuma + brightRatio * 0.75,
    fingerprint: buildLumaFingerprint(source, width, height),
  };
}

function buildLumaFingerprint(source: Uint8ClampedArray, width: number, height: number) {
  const columns = 4;
  const rows = 4;
  const sums = new Array<number>(columns * rows).fill(0);
  const counts = new Array<number>(columns * rows).fill(0);

  for (let y = 0; y < height; y += 1) {
    const row = Math.min(rows - 1, Math.floor((y / height) * rows));
    for (let x = 0; x < width; x += 1) {
      const column = Math.min(columns - 1, Math.floor((x / width) * columns));
      const bucket = row * columns + column;
      const index = (y * width + x) * 4;
      const red = source[index] ?? 0;
      const green = source[index + 1] ?? 0;
      const blue = source[index + 2] ?? 0;
      const luma = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
      sums[bucket] += luma;
      counts[bucket] += 1;
    }
  }

  return sums.map((sum, index) => {
    const count = counts[index] ?? 0;
    return count > 0 ? Number((sum / count).toFixed(6)) : 0;
  });
}
