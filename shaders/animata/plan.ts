import { getShaderById } from "../../assets/js/shader/lib/catalog.ts";
import type { ShaderDefineControl } from "../../assets/js/shader/lib/types.ts";

import {
  COLLECTION_DESCRIPTION,
  COLLECTION_EXTERNAL_URL_PREFIX,
  COLLECTION_NAME,
  COLLECTION_SEED,
  COLLECTION_VERSION,
  FAMILY_LOOP_DURATION_SECONDS,
  FAMILY_ALLOCATIONS,
  LOOP_DURATION_SECONDS,
  LOOP_FPS,
  LOOP_HEIGHT,
  LOOP_WIDTH,
  PALETTE_LABELS,
  loopDurationSecondsForShader,
} from "./config.ts";
import type {
  AnimataAttribute,
  AnimataEditionPlan,
  AnimataFamilyAllocation,
  AnimataPlanDocument,
  AnimataUsage,
} from "./types.ts";

const FORCED_DEFINE_VALUES_BY_SHADER: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  cubic: {
    VEL: "vec3(0,-1,-1)",
  },
};

const LOOP_SAFE_FLOAT_VALUES: Readonly<Record<string, Readonly<Record<string, readonly number[]>>>> = {
  t3tfWN: {
    SPIN: [0.5, 1.0],
  },
  wXdfWN: {
    SPIN: [1.0],
    SPEED: [1.0],
  },
  flutter: {
    TURB_SPEED: [1.0],
  },
  storm: {
    PULSE_RATE: [9.0, 10.0, 11.0],
    TURB_SPEED: [1.0],
  },
  thermal: {
    TURB_SPEED: [1.0],
    CYCLE: [1.0],
  },
  radiant2: {
    WAVE_SPEED: [1.0],
    SPIN: [1.0],
  },
  rocaille: {
    TURB_SPEED: [1.0],
  },
  well: {
    TURB_SPEED: [0.5, 1.0],
  },
  magnetic: {
    POS: [],
    FACTOR: [],
    TURB_MIN: [],
    TURB_MAX: [],
    TURB_SPEED: [0.5],
  },
  singularity: {
    SPIN: [0.2, 0.4],
  },
  lapse: {
    SPIN: [1.0],
  },
  flare: {
    FLASH: [1.0],
    SPIN: [1.0],
    TRAIL: [0.0],
    TRAIL_SCALE: [1.0],
    TRAIL_SPEED: [4.0],
  },
  observer: {
    TURB_SPEED: [0.5, 1.0],
  },
  centrifuge: {
    POS: [],
    ANG_FREQ: [],
    SCROLL: [5.0],
    THICKNESS: [],
    INNER_SCALE: [0.2],
    FACTOR: [],
  },
  cubic: {
    WAVE_FREQ: [5.0],
    COL_FREQ: [1.0, 2.0],
  },
} as const;

const AXIS_PRESETS = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
  [-1, 1, 0],
  [1, -1, 0],
] as const;

export function buildAnimataPlan(seed = COLLECTION_SEED): AnimataPlanDocument {
  const slots = shuffleSlots(expandFamilySlots(), seed);
  const seenSignatures = new Set<string>();
  const editions = slots.map((slot, index) =>
    buildEdition(index + 1, slot, `${seed}:${index + 1}`, seenSignatures),
  );

  return {
    collection: COLLECTION_NAME,
    version: COLLECTION_VERSION,
    seed,
    loop: {
      width: LOOP_WIDTH,
      height: LOOP_HEIGHT,
      fps: LOOP_FPS,
      defaultDurationSeconds: LOOP_DURATION_SECONDS,
      familyDurationSeconds: { ...FAMILY_LOOP_DURATION_SECONDS },
    },
    editions,
  };
}

function buildEdition(
  tokenId: number,
  slot: AnimataFamilyAllocation & { occurrence: number },
  seed: string,
  seenSignatures: Set<string>,
): AnimataEditionPlan {
  const shader = getShaderById(slot.shaderId);
  if (!shader) {
    throw new Error(`Unknown shader "${slot.shaderId}" in animata plan.`);
  }

  const defineValues = buildUniqueDefineValues(shader.id, shader.defineControls, seed, seenSignatures);
  const signature = buildSignature(shader.id, defineValues);
  const attributes = buildAttributes(shader.title, slot.usage, defineValues, signature);

  return {
    tokenId,
    name: `${COLLECTION_NAME} #${tokenId}`,
    description: COLLECTION_DESCRIPTION,
    externalUrl: `${COLLECTION_EXTERNAL_URL_PREFIX}/${tokenId}`,
    shaderId: shader.id,
    shaderTitle: shader.title,
    usage: slot.usage,
    occurrence: slot.occurrence,
    seed,
    signature,
    loopDurationSeconds: loopDurationSecondsForShader(shader.id),
    defineValues,
    attributes,
    posterFileName: `${tokenId}.png`,
    videoFileName: `${tokenId}.mp4`,
    metadataFileName: `${tokenId}.json`,
  };
}

function buildUniqueDefineValues(
  shaderId: string,
  controls: readonly ShaderDefineControl[],
  seed: string,
  seenSignatures: Set<string>,
) {
  const forcedValues = FORCED_DEFINE_VALUES_BY_SHADER[shaderId] ?? {};

  for (let attempt = 0; attempt < 512; attempt += 1) {
    const prng = createPrng(`${seed}:${attempt}`);
    const values = Object.fromEntries(controls.map((control) => {
      const forcedValue = forcedValues[control.key];
      return [control.key, forcedValue ?? sampleDefineValue(shaderId, control, prng)];
    }));
    const signature = buildSignature(shaderId, values);
    if (seenSignatures.has(signature)) continue;
    seenSignatures.add(signature);
    return values;
  }

  throw new Error(`Unable to find a unique define set for ${shaderId}.`);
}

function buildAttributes(
  shaderTitle: string,
  usage: AnimataUsage,
  defineValues: Record<string, string>,
  signature: string,
): AnimataAttribute[] {
  const seedLabel = shortHash(signature);

  return [
    { trait_type: "Family", value: shaderTitle },
    { trait_type: "Usage", value: usage === "avatar" ? "Avatar" : "Background" },
    { trait_type: "Motion", value: motionLabel(defineValues) },
    { trait_type: "Palette", value: paletteLabel(signature) },
    { trait_type: "Energy", value: energyLabel(defineValues) },
    { trait_type: "Seed", value: seedLabel },
  ];
}

function motionLabel(defineValues: Record<string, string>) {
  const motionKeys = [
    "SPIN",
    "SPEED",
    "TURB_SPEED",
    "TRAIL_SPEED",
    "WAVE_SPEED",
    "SCROLL",
    "FLASH",
    "CYCLE",
  ];
  const motionScore = motionKeys.reduce((sum, key) => sum + Math.abs(parseScalar(defineValues[key])), 0);

  if (motionScore >= 24) return "Surge";
  if (motionScore >= 8) return "Drift";
  return "Calm";
}

function energyLabel(defineValues: Record<string, string>) {
  const brightness = parseScalar(defineValues.BRIGHTNESS);
  const glow = parseScalar(defineValues.GLOW);
  const factor = parseScalar(defineValues.FACTOR);
  const raw = Math.log10(Math.max(1e-6, Math.abs(brightness) + glow + factor + 1e-6));

  if (raw >= 0) return "High";
  if (raw >= -1.5) return "Mid";
  return "Low";
}

function paletteLabel(signature: string) {
  return PALETTE_LABELS[hashString(signature) % PALETTE_LABELS.length]!;
}

function shuffleSlots(
  slots: Array<AnimataFamilyAllocation & { occurrence: number }>,
  seed: string,
) {
  const prng = createPrng(seed);
  for (let index = slots.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(prng() * (index + 1));
    const temp = slots[index]!;
    slots[index] = slots[swapIndex]!;
    slots[swapIndex] = temp;
  }
  return slots;
}

function expandFamilySlots() {
  return FAMILY_ALLOCATIONS.flatMap((family) =>
    Array.from({ length: family.count }, (_, occurrence) => ({
      ...family,
      occurrence: occurrence + 1,
    })),
  );
}

function sampleDefineValue(shaderId: string, control: ShaderDefineControl, prng: () => number) {
  if (control.kind === "int") {
    return sampleInteger(control, prng);
  }

  if (control.kind === "float") {
    return sampleFloat(shaderId, control, prng);
  }

  return sampleVec3(shaderId, control, prng);
}

function sampleInteger(control: ShaderDefineControl, prng: () => number) {
  const min = control.min ?? 0;
  const max = control.max ?? min;
  const step = control.step ?? 1;
  const defaultValue = parseScalar(control.defaultValue);
  const span = max - min;
  const spreadFactor = isColorControl(control) ? 0.18 : 0.08;
  const windowHalf = Math.max(step * 2, span * spreadFactor);
  const sampleMin = clampScalar(defaultValue - windowHalf, min, max);
  const sampleMax = clampScalar(defaultValue + windowHalf, min, max);
  const steps = Math.max(0, Math.round((sampleMax - sampleMin) / step));
  const index = Math.floor(prng() * (steps + 1));
  const value = sampleMin + index * step;
  return `${Math.round(value)}`;
}

function sampleFloat(shaderId: string, control: ShaderDefineControl, prng: () => number) {
  const loopSafeValues = LOOP_SAFE_FLOAT_VALUES[shaderId]?.[control.key];
  if (loopSafeValues && loopSafeValues.length > 0) {
    const index = Math.floor(prng() * loopSafeValues.length);
    return formatNumber(loopSafeValues[index]!, control.step ?? 0.01);
  }

  const min = control.min ?? 0;
  const max = control.max ?? min;
  const step = control.step ?? 0.01;
  const [sampleMin, sampleMax] = floatSamplingWindow(control, min, max);
  const steps = Math.max(1, Math.round((sampleMax - sampleMin) / step));
  const index = Math.floor(prng() * (steps + 1));
  const value = sampleMin + index * step;
  return formatNumber(value, step);
}

function sampleVec3(shaderId: string, control: ShaderDefineControl, prng: () => number) {
  const loopSafeValues = LOOP_SAFE_FLOAT_VALUES[shaderId]?.[control.key];
  if (loopSafeValues && loopSafeValues.length === 0) {
    return normalizeCanonicalVec3(control.defaultValue);
  }

  const base = parseVec3(control.defaultValue);
  let values: [number, number, number];

  if (control.key.includes("AXES")) {
    values = normalizeVec3(AXIS_PRESETS[Math.floor(prng() * AXIS_PRESETS.length)]!);
  } else if (control.key.includes("POS")) {
    values = [
      quantize(base[0] + sampleSigned(prng, 0.25), 0.25),
      quantize(base[1] + sampleSigned(prng, 0.25), 0.25),
      quantize(base[2] + sampleSigned(prng, 0.5), 0.25),
    ];
  } else {
    const spread = isColorControl(control) ? 3 : 0.5;

    values = [
      quantize(base[0] + sampleSigned(prng, spread), 0.25),
      quantize(base[1] + sampleSigned(prng, spread), 0.25),
      quantize(base[2] + sampleSigned(prng, spread), 0.25),
    ];
  }

  return `vec3(${values.map((value) => formatNumber(value, 0.25)).join(", ")})`;
}

function sampleSigned(prng: () => number, spread: number) {
  return (prng() * 2 - 1) * spread;
}

function quantize(value: number, step: number) {
  return Math.round(value / step) * step;
}

function normalizeVec3(input: readonly number[]) {
  const length = Math.hypot(...input);
  if (!length) return [1, 0, 0] as [number, number, number];
  return input.map((value) => quantize(value / length, 0.25)) as [number, number, number];
}

function parseVec3(rawValue: string) {
  const match = rawValue.match(/^vec3\((.+)\)$/);
  if (!match) return [0, 0, 0] as [number, number, number];
  const parts = match[1]!.split(",").map((value) => Number.parseFloat(value.trim()));
  return [
    Number.isFinite(parts[0]) ? parts[0]! : 0,
    Number.isFinite(parts[1]) ? parts[1]! : 0,
    Number.isFinite(parts[2]) ? parts[2]! : 0,
  ] as [number, number, number];
}

function normalizeCanonicalVec3(rawValue: string) {
  const match = rawValue.match(/^vec3\((.+)\)$/);
  if (!match) return rawValue;
  const values = match[1]!
    .split(",")
    .map((value) => trimZeros(Number.parseFloat(value.trim()).toString()));
  return `vec3(${values.join(", ")})`;
}

function parseScalar(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function floatSamplingWindow(control: ShaderDefineControl, min: number, max: number) {
  const defaultValue = parseScalar(control.defaultValue);

  if (
    control.key === "BRIGHTNESS" &&
    defaultValue > 0 &&
    min > 0 &&
    max > min
  ) {
    const minMultiplier = 0.45;
    const maxMultiplier = 2.2;
    return [
      clampScalar(defaultValue * minMultiplier, min, max),
      clampScalar(defaultValue * maxMultiplier, min, max),
    ] as const;
  }

  const spreadFactor = isColorControl(control)
    ? 0.22
    : isMotionControl(control)
      ? 0.12
      : 0.06;

  const span = max - min;
  const windowHalf = Math.max(control.step ?? 0.01, span * spreadFactor);
  return [
    clampScalar(defaultValue - windowHalf, min, max),
    clampScalar(defaultValue + windowHalf, min, max),
  ] as const;
}

function buildSignature(shaderId: string, defineValues: Record<string, string>) {
  const serialized = Object.entries(defineValues)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("|");

  return `${shaderId}:${serialized}`;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createPrng(seed: string) {
  let state = hashString(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 1_000_000) / 1_000_000;
  };
}

function formatNumber(value: number, step: number) {
  const decimals = stepToDecimals(step);
  return trimZeros(value.toFixed(decimals));
}

function stepToDecimals(step: number) {
  const normalized = `${step}`;
  if (normalized.includes("e-")) {
    return Number.parseInt(normalized.split("e-")[1]!, 10);
  }
  const parts = normalized.split(".");
  return parts[1]?.length ?? 0;
}

function trimZeros(value: string) {
  if (!value.includes(".")) return value;
  return value.replace(/\.?0+$/, "");
}

function shortHash(value: string) {
  return hashString(value).toString(16).padStart(8, "0").toUpperCase();
}

function clampScalar(value: number, min: number, max: number) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function isColorControl(control: ShaderDefineControl) {
  return (
    control.key.includes("RGB") ||
    control.key.includes("PHASE") ||
    control.key.includes("PALETTE") ||
    control.key.includes("COLOR")
  );
}

function isMotionControl(control: ShaderDefineControl) {
  return (
    control.key.includes("SPEED") ||
    control.key.includes("SPIN") ||
    control.key.includes("SCROLL") ||
    control.key.includes("WAVE") ||
    control.key.includes("FLASH") ||
    control.key.includes("CYCLE")
  );
}
