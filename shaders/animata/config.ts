import { getShaderById } from "../../assets/js/shader/lib/catalog.ts";

import type { AnimataFamilyAllocation } from "./types.ts";

export const COLLECTION_NAME = "Regents Club";
export const COLLECTION_VERSION = 1;
export const COLLECTION_SEED = "regents-club-v1";
export const COLLECTION_DESCRIPTION =
  "Looping Regents Club shader studies generated from the Regent avatar shader catalog.";
export const COLLECTION_EXTERNAL_URL_PREFIX = "https://regents.sh/cards/regents-club";
export const REGENTS_CLUB_CONTRACT_ADDRESS = "0x2208aadbdecd47d3b4430b5b75a175f6d885d487";

export const LOOP_WIDTH = 1024;
export const LOOP_HEIGHT = 1024;
export const LOOP_FPS = 24;
export const LOOP_DURATION_SECONDS = 4;
export const HERO_FRAME_SECONDS = 1;
const TAU = Math.PI * 2;
const TWO_TAU = TAU * 2;
const FIVE_TAU = TAU * 5;
export const TOKEN_CARD_WIDTH = 1536;
export const TOKEN_CARD_HEIGHT = 2048;
export const TOKEN_CARD_VERSION_LABEL = "v1";
export const TOKEN_CARD_IMAGE_PATH_PREFIX = "/images/animata/cards";
export const TOKEN_CARD_ANIMATION_PATH_PREFIX = "/cards/regents-club";

export const AVATAR_ALLOCATIONS: readonly AnimataFamilyAllocation[] = [
  { shaderId: "radiant2", count: 173, usage: "avatar" },
  { shaderId: "wXdfW4", count: 162, usage: "avatar" },
  { shaderId: "storm", count: 153, usage: "avatar" },
  { shaderId: "w3dBD4", count: 149, usage: "avatar" },
  { shaderId: "t3tfWN", count: 145, usage: "avatar" },
  { shaderId: "wXdfWN", count: 141, usage: "avatar" },
  { shaderId: "flutter", count: 138, usage: "avatar" },
  { shaderId: "thermal", count: 136, usage: "avatar" },
  { shaderId: "rocaille", count: 134, usage: "avatar" },
  { shaderId: "observer", count: 132, usage: "avatar" },
  { shaderId: "flare", count: 130, usage: "avatar" },
  { shaderId: "well", count: 128, usage: "avatar" },
  { shaderId: "magnetic", count: 121, usage: "avatar" },
  { shaderId: "lapse", count: 73, usage: "avatar" },
  { shaderId: "singularity", count: 43, usage: "avatar" },
] as const;

export const BACKGROUND_ALLOCATIONS: readonly AnimataFamilyAllocation[] = [
  { shaderId: "centrifuge", count: 20, usage: "background" },
  { shaderId: "cubic", count: 20, usage: "background" },
] as const;

export const FAMILY_ALLOCATIONS = [...AVATAR_ALLOCATIONS, ...BACKGROUND_ALLOCATIONS] as const;
export const TOTAL_EDITIONS = FAMILY_ALLOCATIONS.reduce((sum, family) => sum + family.count, 0);
export const TOTAL_AVATARS = AVATAR_ALLOCATIONS.reduce((sum, family) => sum + family.count, 0);
export const TOTAL_BACKGROUNDS = BACKGROUND_ALLOCATIONS.reduce(
  (sum, family) => sum + family.count,
  0,
);

if (TOTAL_AVATARS !== 1_958) {
  throw new Error(`Animata avatar count must be 1,958; received ${TOTAL_AVATARS}.`);
}

if (TOTAL_BACKGROUNDS !== 40) {
  throw new Error(`Animata background count must be 40; received ${TOTAL_BACKGROUNDS}.`);
}

if (TOTAL_EDITIONS !== 1_998) {
  throw new Error(`Animata total count must be 1,998; received ${TOTAL_EDITIONS}.`);
}

for (const family of FAMILY_ALLOCATIONS) {
  if (!getShaderById(family.shaderId)) {
    throw new Error(`Unknown shader in animata config: ${family.shaderId}`);
  }
}

export const PALETTE_LABELS = [
  "Aurora",
  "Cobalt",
  "Ember",
  "Verdant",
  "Violet",
  "Solar",
  "Frost",
  "Prism",
] as const;

export const FAMILY_LOOP_DURATION_SECONDS: Readonly<Record<string, number>> = {
  wXdfW4: TAU,
  w3dBD4: TAU,
  t3tfWN: TWO_TAU,
  wXdfWN: TAU,
  flutter: TAU,
  storm: TAU,
  thermal: TAU,
  radiant2: TAU,
  rocaille: TAU,
  well: TAU,
  magnetic: TWO_TAU,
  singularity: FIVE_TAU,
  lapse: TAU,
  flare: TAU,
  observer: TAU,
  centrifuge: TAU,
  cubic: TAU,
} as const;

export function loopDurationSecondsForShader(shaderId: string) {
  return FAMILY_LOOP_DURATION_SECONDS[shaderId] ?? LOOP_DURATION_SECONDS;
}
