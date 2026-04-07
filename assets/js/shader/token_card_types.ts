import type { ShaderDefineValues } from "./lib/types.ts";

export interface TokenCardManifestEntry {
  tokenId: number;
  name: string;
  shaderId: string;
  shaderTitle: string;
  defineValues: ShaderDefineValues;
  versionLabel: string;
  imagePath: string;
  animationPath: string;
}
