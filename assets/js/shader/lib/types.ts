export type ShaderUsage = "avatar" | "background" | "creator-inert";

export type ShaderTextureFilter = "linear" | "nearest";

export type ShaderTextureWrap = "clamp" | "repeat";

export type ShaderDefineKind = "float" | "int" | "vec3";

export interface ShaderChannelTexture {
  src: string;
  filter?: ShaderTextureFilter;
  wrap?: ShaderTextureWrap;
}

export interface ShaderDefineControl {
  key: string;
  label: string;
  kind: ShaderDefineKind;
  defaultValue: string;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export interface ShaderCatalogEntry {
  id: string;
  title: string;
  description: string;
  artist: string;
  sourceUrl: string;
  usage: readonly ShaderUsage[];
  fragmentSource: string;
  defineControls: readonly ShaderDefineControl[];
  previewSrc: string;
  channels?: readonly (ShaderChannelTexture | null | undefined)[];
}

export type ShaderDefineValues = Record<string, string>;

export interface ShaderImageSpec {
  engine: "shadertoy-webgl1";
  shaderId: string;
  shaderTitle: string;
  sourceUrl: string;
  usage: readonly ShaderUsage[];
  capturedAt: string;
  previewSrc: string;
  defineValues: ShaderDefineValues;
}
