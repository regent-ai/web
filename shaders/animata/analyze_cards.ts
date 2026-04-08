import { promises as fs } from "node:fs";
import { execFile as execFileCallback } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const FFMPEG_PATH = "/opt/homebrew/bin/ffmpeg";
const SAMPLE_WIDTH = 48;
const SAMPLE_HEIGHT = 64;
const SAMPLE_PIXELS = SAMPLE_WIDTH * SAMPLE_HEIGHT;
const RAW_FRAME_BYTES = SAMPLE_PIXELS * 4;
const CREAM = { r: 0xfb, g: 0xf4, b: 0xde };

export interface CardAnalysisRecord {
  tokenId: number;
  fileName: string;
  path: string;
  meanLuma: number;
  lumaStdDev: number;
  meanSaturation: number;
  detailScore: number;
  creamCoverage: number;
  warmBias: number;
  coolBias: number;
  alphaCoverage: number;
  blankScore: number;
  washScore: number;
  outlierScore: number;
}

export interface CardAnalysisReport {
  ok: true;
  cardsDir: string;
  analyzed: number;
  sampleWidth: number;
  sampleHeight: number;
  suspectedBlank: CardAnalysisRecord[];
  suspectedWashed: CardAnalysisRecord[];
  overallOutliers: CardAnalysisRecord[];
  items: CardAnalysisRecord[];
}

export async function analyzeCardImages(cardsDir: string, outPath: string) {
  const fileNames = (await fs.readdir(cardsDir))
    .filter((fileName) => /^\d+\.png$/i.test(fileName))
    .sort((left, right) => {
      const leftId = Number.parseInt(left, 10);
      const rightId = Number.parseInt(right, 10);
      return leftId - rightId;
    });

  if (fileNames.length === 0) {
    throw new Error(`No plain token PNGs were found in ${cardsDir}.`);
  }

  const records: CardAnalysisRecord[] = [];

  for (const fileName of fileNames) {
    const tokenId = Number.parseInt(fileName, 10);
    const imagePath = path.join(cardsDir, fileName);
    const rgba = await decodeRgba(imagePath);
    records.push(measureCard(tokenId, fileName, imagePath, rgba));
  }

  applyOutlierScores(records);

  const report: CardAnalysisReport = {
    ok: true,
    cardsDir,
    analyzed: records.length,
    sampleWidth: SAMPLE_WIDTH,
    sampleHeight: SAMPLE_HEIGHT,
    suspectedBlank: [...records].sort((left, right) => right.blankScore - left.blankScore).slice(0, 40),
    suspectedWashed: [...records].sort((left, right) => right.washScore - left.washScore).slice(0, 40),
    overallOutliers: [...records].sort((left, right) => right.outlierScore - left.outlierScore).slice(0, 80),
    items: [...records].sort((left, right) => left.tokenId - right.tokenId),
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return report;
}

async function decodeRgba(imagePath: string) {
  const { stdout } = await execFile(FFMPEG_PATH, [
    "-v",
    "error",
    "-i",
    imagePath,
    "-vf",
    `scale=${SAMPLE_WIDTH}:${SAMPLE_HEIGHT}:flags=lanczos,format=rgba`,
    "-frames:v",
    "1",
    "-f",
    "rawvideo",
    "-",
  ], {
    encoding: "buffer",
    maxBuffer: RAW_FRAME_BYTES * 2,
  });

  const buffer = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
  if (buffer.length !== RAW_FRAME_BYTES) {
    throw new Error(
      `Decoded ${imagePath} to ${buffer.length} bytes, expected ${RAW_FRAME_BYTES}.`,
    );
  }

  return buffer;
}

function measureCard(
  tokenId: number,
  fileName: string,
  imagePath: string,
  rgba: Buffer,
): CardAnalysisRecord {
  let opaquePixels = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumLuma = 0;
  let sumLumaSquared = 0;
  let sumSaturation = 0;
  let creamPixels = 0;
  let warmBiasAccum = 0;
  let coolBiasAccum = 0;
  let detailAccum = 0;
  let detailPairs = 0;

  const lumas = new Float64Array(SAMPLE_PIXELS);
  const alphaMask = new Uint8Array(SAMPLE_PIXELS);

  for (let index = 0; index < SAMPLE_PIXELS; index += 1) {
    const offset = index * 4;
    const r = rgba[offset] / 255;
    const g = rgba[offset + 1] / 255;
    const b = rgba[offset + 2] / 255;
    const a = rgba[offset + 3] / 255;

    if (a < 0.05) continue;

    alphaMask[index] = 1;
    opaquePixels += 1;
    sumR += r;
    sumG += g;
    sumB += b;

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lumas[index] = luma;
    sumLuma += luma;
    sumLumaSquared += luma * luma;

    const maxChannel = Math.max(r, g, b);
    const minChannel = Math.min(r, g, b);
    const saturation = maxChannel - minChannel;
    sumSaturation += saturation;

    const creamDistance =
      Math.abs(r - CREAM.r / 255) +
      Math.abs(g - CREAM.g / 255) +
      Math.abs(b - CREAM.b / 255);

    if (creamDistance < 0.16) {
      creamPixels += 1;
    }

    warmBiasAccum += r - b;
    coolBiasAccum += b - r;
  }

  if (opaquePixels === 0) {
    return {
      tokenId,
      fileName,
      path: imagePath,
      meanLuma: 0,
      lumaStdDev: 0,
      meanSaturation: 0,
      detailScore: 0,
      creamCoverage: 0,
      warmBias: 0,
      coolBias: 0,
      alphaCoverage: 0,
      blankScore: 1,
      washScore: 1,
      outlierScore: 1,
    };
  }

  for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
    for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
      const index = y * SAMPLE_WIDTH + x;
      if (!alphaMask[index]) continue;

      if (x + 1 < SAMPLE_WIDTH) {
        const right = index + 1;
        if (alphaMask[right]) {
          detailAccum += Math.abs(lumas[index] - lumas[right]);
          detailPairs += 1;
        }
      }

      if (y + 1 < SAMPLE_HEIGHT) {
        const below = index + SAMPLE_WIDTH;
        if (alphaMask[below]) {
          detailAccum += Math.abs(lumas[index] - lumas[below]);
          detailPairs += 1;
        }
      }
    }
  }

  const meanLuma = sumLuma / opaquePixels;
  const lumaVariance = Math.max(0, sumLumaSquared / opaquePixels - meanLuma * meanLuma);
  const lumaStdDev = Math.sqrt(lumaVariance);
  const meanSaturation = sumSaturation / opaquePixels;
  const detailScore = detailPairs === 0 ? 0 : detailAccum / detailPairs;
  const creamCoverage = creamPixels / opaquePixels;
  const alphaCoverage = opaquePixels / SAMPLE_PIXELS;
  const warmBias = warmBiasAccum / opaquePixels;
  const coolBias = coolBiasAccum / opaquePixels;

  const blankScore = clamp01(
    (
      creamCoverage * 0.8 +
      clamp01((meanLuma - 0.7) / 0.2) * 0.55 +
      clamp01((0.08 - detailScore) / 0.08) * 0.8 +
      clamp01((0.15 - meanSaturation) / 0.15) * 0.45
    ) / 2.6,
  );

  const washScore = clamp01(
    (
      creamCoverage * 0.45 +
      clamp01((meanLuma - 0.58) / 0.28) * 0.35 +
      clamp01((0.11 - detailScore) / 0.11) * 0.5 +
      clamp01((0.18 - meanSaturation) / 0.18) * 0.4 +
      clamp01((warmBias - 0.04) / 0.12) * 0.25
    ) / 1.95,
  );

  return {
    tokenId,
    fileName,
    path: imagePath,
    meanLuma,
    lumaStdDev,
    meanSaturation,
    detailScore,
    creamCoverage,
    warmBias,
    coolBias,
    alphaCoverage,
    blankScore,
    washScore,
    outlierScore: 0,
  };
}

function applyOutlierScores(records: CardAnalysisRecord[]) {
  const metrics = {
    meanLuma: records.map((record) => record.meanLuma),
    lumaStdDev: records.map((record) => record.lumaStdDev),
    meanSaturation: records.map((record) => record.meanSaturation),
    detailScore: records.map((record) => record.detailScore),
    creamCoverage: records.map((record) => record.creamCoverage),
    warmBias: records.map((record) => record.warmBias),
    alphaCoverage: records.map((record) => record.alphaCoverage),
  };

  const stats = Object.fromEntries(
    Object.entries(metrics).map(([key, values]) => [key, robustStats(values)]),
  ) as Record<string, { median: number; scale: number }>;

  for (const record of records) {
    const outlierScore =
      Math.abs(robustZ(record.meanLuma, stats.meanLuma)) * 0.8 +
      Math.abs(robustZ(record.lumaStdDev, stats.lumaStdDev)) * 1.1 +
      Math.abs(robustZ(record.meanSaturation, stats.meanSaturation)) * 0.9 +
      Math.abs(robustZ(record.detailScore, stats.detailScore)) * 1.3 +
      Math.abs(robustZ(record.creamCoverage, stats.creamCoverage)) * 1.1 +
      Math.abs(robustZ(record.warmBias, stats.warmBias)) * 0.7 +
      Math.abs(robustZ(record.alphaCoverage, stats.alphaCoverage)) * 0.4 +
      record.blankScore * 2 +
      record.washScore * 1.4;

    record.outlierScore = outlierScore;
  }
}

function robustStats(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const median = medianOfSorted(sorted);
  const deviations = sorted.map((value) => Math.abs(value - median)).sort((left, right) => left - right);
  const mad = medianOfSorted(deviations);
  return {
    median,
    scale: Math.max(mad * 1.4826, 1e-6),
  };
}

function robustZ(value: number, stats: { median: number; scale: number }) {
  return (value - stats.median) / stats.scale;
}

function medianOfSorted(sorted: number[]) {
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle] ?? 0;
  }

  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
