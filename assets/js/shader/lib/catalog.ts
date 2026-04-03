import {
  SHADER_BITMAP,
  SHADER_BUFFER,
  SHADER_CENTRIFUGE,
  SHADER_CUBIC,
} from "./background-sources.ts";
import {
  SHADER_FLARE,
  SHADER_FLUTTER,
  SHADER_LAPSE,
  SHADER_OBSERVER,
  SHADER_RADIANT2,
  SHADER_ROCAILLE,
  SHADER_SINGULARITY,
  SHADER_STORM,
  SHADER_T3TFWN_ORBITAL,
  SHADER_THERMAL,
  SHADER_WELL,
  SHADER_W3DBD4_IONIZE,
  SHADER_W3DFWN_SHARD,
  SHADER_MAGNETIC,
  SHADER_WXDFW4_ORB,
  SHADER_WXDFWN_PHOSPHOR3,
} from "./sources.ts";
import type {
  ShaderCatalogEntry,
  ShaderDefineControl,
  ShaderDefineValues,
  ShaderImageSpec,
} from "./types.ts";

const DEFAULT_PREVIEW_SRC = "/images/regents-logo-large.png";

const DEFINE_FLOAT = (
  key: string,
  defaultValue: string,
  min: number,
  max: number,
  step: number,
  description?: string,
): ShaderDefineControl => ({
  key,
  label: key,
  kind: "float",
  defaultValue,
  min,
  max,
  step,
  description,
});

const DEFINE_INT = (
  key: string,
  defaultValue: string,
  min: number,
  max: number,
  step: number,
  description?: string,
): ShaderDefineControl => ({
  key,
  label: key,
  kind: "int",
  defaultValue,
  min,
  max,
  step,
  description,
});

const DEFINE_VEC3 = (
  key: string,
  defaultValue: string,
  description?: string,
): ShaderDefineControl => ({
  key,
  label: key,
  kind: "vec3",
  defaultValue,
  description,
});

const SHADER_SOURCE_BY_ID = {
  w3dfWN: SHADER_W3DFWN_SHARD,
  wXdfW4: SHADER_WXDFW4_ORB,
  w3dBD4: SHADER_W3DBD4_IONIZE,
  t3tfWN: SHADER_T3TFWN_ORBITAL,
  wXdfWN: SHADER_WXDFWN_PHOSPHOR3,
  flutter: SHADER_FLUTTER,
  storm: SHADER_STORM,
  thermal: SHADER_THERMAL,
  radiant2: SHADER_RADIANT2,
  rocaille: SHADER_ROCAILLE,
  well: SHADER_WELL,
  magnetic: SHADER_MAGNETIC,
  singularity: SHADER_SINGULARITY,
  lapse: SHADER_LAPSE,
  flare: SHADER_FLARE,
  observer: SHADER_OBSERVER,
  buffer: SHADER_BUFFER,
  bitmap: SHADER_BITMAP,
  centrifuge: SHADER_CENTRIFUGE,
  cubic: SHADER_CUBIC,
} as const;

type ShaderSourceId = keyof typeof SHADER_SOURCE_BY_ID;

export interface ShaderCatalogManifestEntry
  extends Omit<ShaderCatalogEntry, "fragmentSource"> {
  sourceId: ShaderSourceId;
}

export const SHADER_MANIFEST: readonly ShaderCatalogManifestEntry[] = [
  {
    id: "w3dfWN",
    title: "Shard (Inert)",
    description: "Default creator inert-state crystalline shard.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com/view/w3dfWN",
    usage: ["creator-inert", "avatar", "background"],
    sourceId: "w3dfWN",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "0.003", 0.00001, 0.01, 0.00001),
      DEFINE_FLOAT("BASE", "0.7", 0.0, 2.0, 0.01),
      DEFINE_VEC3("POS", "vec3(0, 0, 8)", "Camera position"),
      DEFINE_FLOAT("SPIN", "0.25", -2.0, 2.0, 0.01),
      DEFINE_FLOAT("BANDS", "3.3", 0.2, 12.0, 0.05),
      DEFINE_FLOAT("GLOW", "0.3", 0.01, 1.2, 0.01),
      DEFINE_FLOAT("SOFTNESS", "0.01", 0.0005, 0.2, 0.0005),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "wXdfW4",
    title: "Orb",
    description: "Twisted glowing orb with color-phased turbulence.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com/view/wXdfW4",
    usage: ["avatar", "background"],
    sourceId: "wXdfW4",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "0.0001", 0.00001, 0.01, 0.00001),
      DEFINE_VEC3("POS", "vec3(0,0,2)", "Camera position"),
      DEFINE_FLOAT("TWIST", "1.0", -8.0, 8.0, 0.01),
      DEFINE_FLOAT("GLOW", "0.2", 0.01, 2.0, 0.01),
      DEFINE_FLOAT("DENSITY", "0.1", 0.01, 1.5, 0.01),
      DEFINE_VEC3("RGB", "vec3(6, 1, 3)", "RGB phase shift"),
      DEFINE_FLOAT("COLOR_WAVE", "2.5", 0.1, 20, 0.1),
      DEFINE_FLOAT("COLOR_Y", "1.0", 0.1, 12, 0.1),
      DEFINE_FLOAT("SOFTNESS", "0.03", 0.0005, 0.4, 0.0005),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "w3dBD4",
    title: "Ionize",
    description: "Ionized shell with turbulent gyroid glow.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com/view/w3dBD4",
    usage: ["avatar", "background"],
    sourceId: "w3dBD4",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "0.0006", 0.00001, 0.01, 0.00001),
      DEFINE_VEC3("POS", "vec3(0,0,9)", "Camera position"),
      DEFINE_FLOAT("TURB_STRENGTH", "0.5", 0, 2.0, 0.01),
      DEFINE_FLOAT("TURB_MAX", "9.0", 1, 16, 0.1),
      DEFINE_FLOAT("SOFTNESS", "0.01", 0.0005, 0.3, 0.0005),
      DEFINE_FLOAT("COLOR_FREQ", "10.0", 0.1, 40.0, 0.1),
      DEFINE_VEC3("RGB", "vec3(2,4,5)", "RGB phase shift"),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "t3tfWN",
    title: "Orbital",
    description: "Orbital ring fold with crystalline modulation.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com/view/t3tfWN",
    usage: ["avatar", "background"],
    sourceId: "t3tfWN",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "0.0012", 0.00001, 0.02, 0.00001),
      DEFINE_VEC3("POS", "vec3(0,0,8.0)", "Camera position"),
      DEFINE_FLOAT("SPIN", "0.5", -4.0, 4.0, 0.01),
      DEFINE_FLOAT("GLOW", "0.1", 0.01, 1.0, 0.01),
      DEFINE_FLOAT("SOFTNESS", "0.1", 0.001, 0.8, 0.001),
      DEFINE_VEC3("COLOR_SHIFT", "vec3(4, 5, 7)", "RGB phase shift"),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "wXdfWN",
    title: "Phosphor 3",
    description: "Trailing axis phosphor shell with turbulent detail folding.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com/view/wXdfWN",
    usage: ["avatar", "background"],
    sourceId: "wXdfWN",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "0.0002", 0.00001, 0.02, 0.00001),
      DEFINE_VEC3("POS", "vec3(0,0,5)", "Camera position"),
      DEFINE_FLOAT("SPIN", "1.0", -6.0, 6.0, 0.01),
      DEFINE_FLOAT("TRAIL", "4.0", 0, 20, 0.05),
      DEFINE_FLOAT("TURB_MAX", "9.0", 1, 16, 0.1),
      DEFINE_FLOAT("SPEED", "1.0", -8.0, 8.0, 0.01),
      DEFINE_FLOAT("GLOW", "0.1", 0.005, 1.2, 0.005),
      DEFINE_FLOAT("WAVE_AMP", "0.07", 0, 0.5, 0.001),
      DEFINE_VEC3("RGB", "vec3(0, 1, 8)", "RGB phase shift"),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "flutter",
    title: "Flutter",
    description: "Blocky folded turbulence over a hollow shell.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["avatar", "background"],
    sourceId: "flutter",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "0.001", 0.00001, 0.02, 0.00001),
      DEFINE_VEC3("POS", "vec3(0,0,9)", "Camera position"),
      DEFINE_FLOAT("CELL", "0.1", 0.005, 1.0, 0.005),
      DEFINE_FLOAT("TURB_MIN", "2.0", 1.0, 12.0, 0.1),
      DEFINE_FLOAT("TURB_MAX", "8.0", 1.0, 20.0, 0.1),
      DEFINE_FLOAT("TURB_SPEED", "1.0", -12.0, 12.0, 0.01),
      DEFINE_FLOAT("FACTOR", "0.1", 0.001, 1.0, 0.001),
      DEFINE_FLOAT("SOFTNESS", "0.003", 0.0001, 0.1, 0.0001),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "storm",
    title: "Storm",
    description: "Pulsing turbulent shell with high-energy channel falloff color.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["avatar", "background"],
    sourceId: "storm",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "0.0002", 0.00001, 0.02, 0.00001),
      DEFINE_VEC3("POS", "vec3(0,0,7)", "Camera position"),
      DEFINE_FLOAT("FACTOR", "0.1", 0.001, 1.0, 0.001),
      DEFINE_FLOAT("FALLOFF", "10.0", 0.1, 40.0, 0.1),
      DEFINE_FLOAT("PULSE_RATE", "10.0", 0.1, 40.0, 0.1),
      DEFINE_VEC3("COLOR", "vec3(0.2, 9.0, 2.0)", "RGB color factors"),
      DEFINE_VEC3("EXP", "vec3(2, 1, 1)", "RGB falloff exponents"),
      DEFINE_FLOAT("TURB_MIN", "1.0", 0.1, 12.0, 0.1),
      DEFINE_FLOAT("TURB_MAX", "9.0", 0.1, 24.0, 0.1),
      DEFINE_FLOAT("TURB_SPEED", "1.0", -12.0, 12.0, 0.01),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "thermal",
    title: "Thermal",
    description: "Blocky heated cavity fold with cosine phase coloring.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["avatar", "background"],
    sourceId: "thermal",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "0.004", 0.00001, 0.04, 0.00001),
      DEFINE_VEC3("POS", "vec3(0, 0, 5)", "Camera position"),
      DEFINE_FLOAT("FACTOR", "0.4", 0.001, 2.0, 0.001),
      DEFINE_FLOAT("MODULATION", "0.5", 0.0, 2.0, 0.001),
      DEFINE_FLOAT("SIZE", "2.0", 0.1, 10.0, 0.01),
      DEFINE_FLOAT("TURB_MIN", "2.0", 0.1, 12.0, 0.1),
      DEFINE_FLOAT("TURB_MAX", "7.0", 0.1, 24.0, 0.1),
      DEFINE_FLOAT("TURB_SPEED", "1.0", -12.0, 12.0, 0.01),
      DEFINE_VEC3("RGB", "vec3(0, 1, 8)", "RGB phase shift"),
      DEFINE_FLOAT("CYCLE", "1.0", -20.0, 20.0, 0.01),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "radiant2",
    title: "Radiant 2",
    description: "Rotating radiant shell with phased tri-channel color trails.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["avatar", "background"],
    sourceId: "radiant2",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "0.006", 0.00001, 0.05, 0.00001),
      DEFINE_VEC3("POS", "vec3(0, 0, 9)", "Camera position"),
      DEFINE_FLOAT("FACTOR", "0.125", 0.001, 1.0, 0.001),
      DEFINE_FLOAT("SEPARATION", "0.9", 0.0, 2.0, 0.001),
      DEFINE_FLOAT("DENSITY", "1.6", 0.0, 8.0, 0.01),
      DEFINE_FLOAT("WAVE_FREQ", "15.0", 0.1, 50.0, 0.1),
      DEFINE_FLOAT("WAVE_SPEED", "1.0", -20.0, 20.0, 0.01),
      DEFINE_FLOAT("SPIN", "1.0", -20.0, 20.0, 0.01),
      DEFINE_VEC3("AXIS_PHASES", "vec3(0, 3, 0)", "Axis phase offsets"),
      DEFINE_VEC3("PHASES", "vec3(6, 1, 2)", "RGB phase offsets"),
      DEFINE_FLOAT("COLOR", "0.1", 0.0, 4.0, 0.01),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "rocaille",
    title: "Rocaille",
    description: "Layered rocaille turbulence with cosine RGB phase accumulation.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["avatar", "background"],
    sourceId: "rocaille",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "0.028", 0.00001, 0.2, 0.00001),
      DEFINE_FLOAT("SCALE", "0.3", 0.05, 3.0, 0.01),
      DEFINE_FLOAT("OFFSET", "1.0", -10.0, 10.0, 0.01),
      DEFINE_FLOAT("COLOR", "1.0", -20.0, 20.0, 0.01),
      DEFINE_VEC3("RGB", "vec3(0, 1, 2)", "RGB phase offsets"),
      DEFINE_FLOAT("TURB_MAX", "9.0", 1.0, 24.0, 0.1),
      DEFINE_FLOAT("TURB_SPEED", "1.0", -20.0, 20.0, 0.01),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "well",
    title: "Well",
    description: "Distorted well structure with channel-based bloom carry.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["avatar", "background"],
    sourceId: "well",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "0.1", 0.0001, 1.0, 0.0001),
      DEFINE_FLOAT("SCALE", "0.3", 0.05, 3.0, 0.01),
      DEFINE_FLOAT("COLOR_SHIFT", "0.333", -4.0, 4.0, 0.001),
      DEFINE_VEC3("RGB", "vec3(1, 2, 3)", "RGB phase offsets"),
      DEFINE_FLOAT("BLOOM", "0.04", 0.0, 0.3, 0.001),
      DEFINE_FLOAT("CURVE", "2.0", -10.0, 10.0, 0.01),
      DEFINE_FLOAT("TURB_FREQ", "9.0", 1.0, 24.0, 0.1),
      DEFINE_FLOAT("TURB_SPEED", "0.5", 0.05, 20.0, 0.01),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "magnetic",
    title: "Magnetic",
    description: "Magnetic volumetric fold with high-intensity hyperbolic tone map.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["avatar", "background"],
    sourceId: "magnetic",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "1e6", 1e2, 1e8, 1e2),
      DEFINE_VEC3("POS", "vec3(0, 0, 5)", "Camera position"),
      DEFINE_FLOAT("FACTOR", "0.16", 0.001, 1.0, 0.001),
      DEFINE_FLOAT("TURB_MIN", "1.0", 0.1, 12.0, 0.1),
      DEFINE_FLOAT("TURB_MAX", "9.0", 0.1, 24.0, 0.1),
      DEFINE_FLOAT("TURB_SPEED", "1.0", -20.0, 20.0, 0.01),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "singularity",
    title: "Singularity",
    description: "Gravitational lens and accretion-disk style singularity field.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["avatar", "background"],
    sourceId: "singularity",
    defineControls: [
      DEFINE_FLOAT("ZOOM", "0.7", 0.1, 4.0, 0.01),
      DEFINE_FLOAT("GRAV", "5.0", 0.0, 20.0, 0.01),
      DEFINE_FLOAT("GRAV_SOFT", "0.1", 0.0001, 2.0, 0.0001),
      DEFINE_FLOAT("SPIN", "0.2", -10.0, 10.0, 0.01),
      DEFINE_FLOAT("SPIRAL", "5.0", 0.1, 20.0, 0.01),
      DEFINE_FLOAT("TURB_MIN", "1.0", 0.1, 12.0, 0.1),
      DEFINE_FLOAT("TURB_MAX", "9.0", 0.1, 24.0, 0.1),
      DEFINE_FLOAT("TURB_AMP", "0.7", 0.0, 3.0, 0.01),
      DEFINE_FLOAT("TURB_BIAS", "0.5", -3.0, 3.0, 0.01),
      DEFINE_FLOAT("DISK_WAVE", "0.3", 0.01, 2.0, 0.01),
      DEFINE_FLOAT("DISK_MIX", "0.2", 0.0, 2.0, 0.01),
      DEFINE_FLOAT("DISK_TIGHT", "0.1", 0.001, 1.0, 0.001),
      DEFINE_FLOAT("GAUSS", "7.0", 0.0, 20.0, 0.1),
      DEFINE_FLOAT("GAUSS_SHIFT", "0.3", -4.0, 4.0, 0.01),
      DEFINE_FLOAT("HORIZON", "0.7", 0.0, 3.0, 0.01),
      DEFINE_FLOAT("HORIZON_SOFT", "0.03", 0.001, 0.5, 0.001),
      DEFINE_FLOAT("BRIGHTNESS", "0.2", 0.0001, 2.0, 0.0001),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "lapse",
    title: "Lapse",
    description: "Rotational lapse field with crystalline turbulence folding.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["avatar", "background"],
    sourceId: "lapse",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "1e-4", 1e-7, 1e-2, 1e-7),
      DEFINE_VEC3("POS", "vec3(0, 0, 5)", "Camera position"),
      DEFINE_VEC3("AXES", "vec3(0, 1, 0)", "Normalized rotation axis"),
      DEFINE_FLOAT("SPIN", "1.0", -20.0, 20.0, 0.01),
      DEFINE_FLOAT("TURB_MIN", "1.0", 0.1, 12.0, 0.1),
      DEFINE_FLOAT("TURB_MAX", "9.0", 0.1, 24.0, 0.1),
      DEFINE_FLOAT("FACTOR", "0.1", 0.001, 1.0, 0.001),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "flare",
    title: "Flare",
    description: "Orbital flare trails with palette cycling and noise fog.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["avatar", "background"],
    sourceId: "flare",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "3e-3", 1e-6, 0.1, 1e-6),
      DEFINE_FLOAT("FLASH", "1.0", -20.0, 20.0, 0.01),
      DEFINE_FLOAT("POINTS", "50.0", 1.0, 120.0, 1.0),
      DEFINE_FLOAT("SPIN", "1.0", -20.0, 20.0, 0.01),
      DEFINE_FLOAT("TRAIL", "0.03", 0.0, 1.0, 0.001),
      DEFINE_FLOAT("TRAIL_SCALE", "1.0", 0.0, 6.0, 0.01),
      DEFINE_FLOAT("TRAIL_SPEED", "4.0", -30.0, 30.0, 0.01),
      DEFINE_VEC3("PALETTE", "vec3(7, 4, 2)", "Color palette frequencies"),
      DEFINE_FLOAT("GLARE", "5.0", 0.1, 20.0, 0.1),
      DEFINE_FLOAT("GAMMA", "1.5", 0.1, 4.0, 0.01),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "observer",
    title: "Observer",
    description: "Layered turbulence observer field with bloom carry and phase tint.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["avatar", "background"],
    sourceId: "observer",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "0.03", 0.00001, 0.5, 0.00001),
      DEFINE_FLOAT("SCALE", "0.2", 0.05, 3.0, 0.01),
      DEFINE_FLOAT("COLOR_SHIFT", "0.4", -10.0, 10.0, 0.01),
      DEFINE_VEC3("PHASES", "vec3(0, 1, 2)", "RGB phase offsets"),
      DEFINE_FLOAT("BLOOM", "0.05", 0.0, 0.3, 0.001),
      DEFINE_FLOAT("FALLOFF", "3.0", 0.1, 20.0, 0.01),
      DEFINE_FLOAT("TURB_OFFSET", "0.9", -10.0, 10.0, 0.01),
      DEFINE_FLOAT("TURB_FREQ", "9.0", 1.0, 24.0, 0.1),
      DEFINE_FLOAT("TURB_SPEED", "0.5", 0.05, 20.0, 0.01),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "buffer",
    title: "Buffer",
    description: "Circular repeat field suitable for loading spinner effects.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["background"],
    sourceId: "buffer",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "0.3", 0.0001, 3.0, 0.0001),
      DEFINE_FLOAT("BASE", "0.7", 0.0, 3.0, 0.01),
      DEFINE_FLOAT("NUM", "8.0", 1.0, 64.0, 1.0),
      DEFINE_FLOAT("SPIN", "0.5", -20.0, 20.0, 0.01),
      DEFINE_FLOAT("TURN", "1.0", -20.0, 20.0, 0.01),
      DEFINE_FLOAT("FALL", "4.0", 0.01, 40.0, 0.01),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "bitmap",
    title: "Bitmap",
    description: "Layered bitmap-style fractal grid with alpha accumulation.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["background"],
    sourceId: "bitmap",
    defineControls: [
      DEFINE_INT("LAYERS", "20", 1, 64, 1),
      DEFINE_FLOAT("SPEED", "0.2", -10.0, 10.0, 0.01),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "centrifuge",
    title: "Centrifuge",
    description: "Cylindrical tunnel field with wave shell modulation.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["background"],
    sourceId: "centrifuge",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "5e-3", 1e-6, 0.1, 1e-6),
      DEFINE_VEC3("POS", "vec3(0, -7, 0)", "Camera position"),
      DEFINE_FLOAT("ANG_FREQ", "10.0", 0.1, 60.0, 0.1),
      DEFINE_FLOAT("Z_FREQ", "0.2", 0.001, 10.0, 0.001),
      DEFINE_FLOAT("SCROLL", "5.0", -40.0, 40.0, 0.01),
      DEFINE_FLOAT("THICKNESS", "0.2", 0.001, 4.0, 0.001),
      DEFINE_FLOAT("INNER_SCALE", "0.2", 0.01, 4.0, 0.01),
      DEFINE_FLOAT("FACTOR", "0.5", 0.001, 2.0, 0.001),
      DEFINE_VEC3("COLOR_FREQ", "vec3(0.2, 0.0, 0.3333333)", "RGB frequencies"),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
  {
    id: "cubic",
    title: "Cubic",
    description: "Nested cosine cubic fold with y-axis color phasing.",
    artist: "XorDev",
    sourceUrl: "https://www.shadertoy.com",
    usage: ["background"],
    sourceId: "cubic",
    defineControls: [
      DEFINE_FLOAT("BRIGHTNESS", "1e-4", 1e-7, 1e-1, 1e-7),
      DEFINE_VEC3("VEL", "vec3(0,-1,-1)", "Velocity vector"),
      DEFINE_FLOAT("WAVE_FREQ", "5.0", 0.1, 40.0, 0.1),
      DEFINE_FLOAT("HOLLOW", "0.1", 0.0, 4.0, 0.001),
      DEFINE_FLOAT("FACTOR", "0.16", 0.001, 2.0, 0.001),
      DEFINE_FLOAT("COL_FREQ", "1.0", -20.0, 20.0, 0.01),
      DEFINE_VEC3("RGB", "vec3(0, 2, 5)", "RGB color phase shifts"),
    ],
    previewSrc: DEFAULT_PREVIEW_SRC,
  },
] as const;

export const SHADER_CATALOG: readonly ShaderCatalogEntry[] = SHADER_MANIFEST.map(
  ({ sourceId, ...entry }) => {
    const fragmentSource = SHADER_SOURCE_BY_ID[sourceId];
    if (typeof fragmentSource !== "string" || !fragmentSource.trim()) {
      throw new Error(`Missing fragment source for shader "${entry.id}"`);
    }
    return {
      ...entry,
      fragmentSource,
    };
  },
);

export type CreatorIdentityShader = (typeof SHADER_CATALOG)[number];

const CATALOG_BY_ID = new Map(SHADER_CATALOG.map((entry) => [entry.id, entry]));

const DEFINE_LINE_PATTERN = /^(\s*#define\s+)([A-Z0-9_]+)(\s+)(.+)$/gm;
const VEC3_LITERAL_PATTERN =
  /^vec3\(\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*,\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*,\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*\)$/;

function toGlslFloatLiteral(value: number) {
  const text = String(value);
  if (text.includes(".") || text.includes("e") || text.includes("E")) return text;
  return `${text}.0`;
}

function parseVec3Literal(value: string) {
  const match = value.match(VEC3_LITERAL_PATTERN);
  if (!match) return null;
  const components = [match[1], match[2], match[3]].map((part) => Number(part));
  if (!components.every((component) => Number.isFinite(component))) return null;
  return components;
}

function normalizeDefineLiteral(control: ShaderDefineControl, rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  if (control.kind === "vec3") {
    const parsed = parseVec3Literal(trimmed);
    if (!parsed) return null;
    return `vec3(${parsed.map((value) => toGlslFloatLiteral(value)).join(", ")})`;
  }

  const parsedNumber = Number(trimmed);
  if (!Number.isFinite(parsedNumber)) return null;

  const normalizedNumber = control.kind === "int" ? Math.round(parsedNumber) : parsedNumber;
  if (typeof control.min === "number" && normalizedNumber < control.min) return null;
  if (typeof control.max === "number" && normalizedNumber > control.max) return null;

  return control.kind === "int"
    ? String(normalizedNumber)
    : toGlslFloatLiteral(normalizedNumber);
}

export function sanitizeShaderDefineValues(
  shader: ShaderCatalogEntry,
  defineValues?: ShaderDefineValues,
): ShaderDefineValues {
  if (!defineValues) return {};
  const controlByKey = new Map(shader.defineControls.map((control) => [control.key, control]));
  const sanitized: ShaderDefineValues = {};

  for (const [key, value] of Object.entries(defineValues)) {
    const control = controlByKey.get(key);
    if (!control || typeof value !== "string") continue;
    const normalized = normalizeDefineLiteral(control, value);
    if (!normalized) continue;
    sanitized[key] = normalized;
  }

  return sanitized;
}

export const CREATOR_IDENTITY_SHADERS = SHADER_CATALOG.filter((entry) =>
  entry.usage.includes("avatar"),
);

export const CREATOR_INERT_SHADER = SHADER_CATALOG.find((entry) =>
  entry.usage.includes("creator-inert"),
);

export const PLATFORM_BACKGROUND_SHADERS = SHADER_CATALOG.filter(
  (entry) => entry.usage.includes("background") && !entry.usage.includes("avatar"),
);

export const PLATFORM_BUFFER_SPINNER_SHADER = SHADER_CATALOG.find(
  (entry) => entry.id === "buffer",
);

export function getShaderById(id: string) {
  return CATALOG_BY_ID.get(id) ?? null;
}

export function getShaderDefaultDefineValues(
  shader: ShaderCatalogEntry,
): ShaderDefineValues {
  return shader.defineControls.reduce<ShaderDefineValues>((acc, control) => {
    acc[control.key] = control.defaultValue;
    return acc;
  }, {});
}

export function buildShaderFragmentSource(
  shader: ShaderCatalogEntry,
  defineValues?: ShaderDefineValues,
): string {
  const sanitizedValues = sanitizeShaderDefineValues(shader, defineValues);
  if (Object.keys(sanitizedValues).length === 0) {
    return shader.fragmentSource;
  }

  return shader.fragmentSource.replace(
    DEFINE_LINE_PATTERN,
    (line, prefix: string, key: string, spacing: string) => {
      const next = sanitizedValues[key];
      if (typeof next !== "string") return line;
      const trimmed = next.trim();
      if (!trimmed) return line;
      return `${prefix}${key}${spacing}${trimmed}`;
    },
  );
}

export function buildShaderImageSpec(
  shader: ShaderCatalogEntry,
  defineValues: ShaderDefineValues,
): ShaderImageSpec {
  return {
    engine: "shadertoy-webgl1",
    shaderId: shader.id,
    shaderTitle: shader.title,
    sourceUrl: shader.sourceUrl,
    usage: shader.usage,
    capturedAt: new Date().toISOString(),
    previewSrc: shader.previewSrc,
    defineValues,
  };
}
