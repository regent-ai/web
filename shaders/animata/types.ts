export type AnimataUsage = "avatar" | "background";

export interface AnimataFamilyAllocation {
  shaderId: string;
  count: number;
  usage: AnimataUsage;
}

export interface AnimataAttribute {
  trait_type: string;
  value: string | number;
}

export interface AnimataEditionPlan {
  tokenId: number;
  name: string;
  description: string;
  externalUrl: string;
  shaderId: string;
  shaderTitle: string;
  usage: AnimataUsage;
  occurrence: number;
  seed: string;
  signature: string;
  loopDurationSeconds: number;
  defineValues: Record<string, string>;
  attributes: AnimataAttribute[];
  posterFileName: string;
  videoFileName: string;
  metadataFileName: string;
}

export interface AnimataPlanDocument {
  collection: string;
  version: number;
  seed: string;
  loop: {
    width: number;
    height: number;
    fps: number;
    defaultDurationSeconds: number;
    familyDurationSeconds: Record<string, number>;
  };
  editions: AnimataEditionPlan[];
}

export interface AnimataRenderRecord {
  tokenId: number;
  shaderId: string;
  signature: string;
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  frameCount: number;
  loopSeamDelta: number;
  loopAdjacentDelta: number;
  loopSeamRatio: number;
  loopClosureScore: number;
  posterPath: string;
  videoPath: string;
}

export interface AnimataRenderManifest {
  collection: string;
  version: number;
  items: AnimataRenderRecord[];
}

export interface AnimataTokenCardManifestEntry {
  tokenId: number;
  name: string;
  shaderId: string;
  shaderTitle: string;
  defineValues: Record<string, string>;
  versionLabel: string;
  imagePath: string;
  animationPath: string;
}

export interface AnimataTokenCardManifest {
  collection: string;
  version: number;
  items: AnimataTokenCardManifestEntry[];
}

export interface AnimataMediaUriRecord {
  tokenId: number;
  posterCid: string;
  posterUri: string;
  videoCid: string;
  videoUri: string;
}

export interface AnimataMediaUriManifest {
  collection: string;
  version: number;
  items: AnimataMediaUriRecord[];
}

export interface AnimataMetadataManifestEntry {
  tokenId: number;
  filePath: string;
}

export interface AnimataMetadataManifest {
  collection: string;
  version: number;
  items: AnimataMetadataManifestEntry[];
}
