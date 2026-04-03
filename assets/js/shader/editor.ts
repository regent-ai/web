import { getShaderDefaultDefineValues, getShaderById } from "./lib/catalog.ts";
import type {
  ShaderCatalogEntry,
  ShaderDefineControl,
  ShaderDefineValues,
} from "./lib/types.ts";

export interface ShaderDefineValidationResult {
  isValid: boolean;
  normalizedValue: string | null;
  errorMessage: string | null;
}

export const SHADER_SLIDER_COMMIT_DELAY_MS = 300;

const VEC3_LITERAL_PATTERN =
  /^vec3\(\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*,\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*,\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*\)$/;

export function toGlslFloatLiteral(value: number) {
  const text = String(value);
  if (text.includes(".") || text.includes("e") || text.includes("E")) return text;
  return `${text}.0`;
}

export function parseVec3Literal(value: string) {
  const match = value.trim().match(VEC3_LITERAL_PATTERN);
  if (!match) return null;

  const parts = [match[1], match[2], match[3]].map((entry) => Number(entry));
  if (!parts.every((entry) => Number.isFinite(entry))) return null;
  return parts;
}

export function validateShaderDefineInput(
  control: ShaderDefineControl,
  rawValue: string,
): ShaderDefineValidationResult {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return {
      isValid: false,
      normalizedValue: null,
      errorMessage: "Enter a value and press Enter to apply.",
    };
  }

  if (control.kind === "vec3") {
    const parsed = parseVec3Literal(trimmed);
    if (!parsed) {
      return {
        isValid: false,
        normalizedValue: null,
        errorMessage: "Use vec3(x, y, z) with numeric values.",
      };
    }

    return {
      isValid: true,
      normalizedValue: `vec3(${parsed.map((value) => toGlslFloatLiteral(value)).join(", ")})`,
      errorMessage: null,
    };
  }

  const parsedNumber = Number(trimmed);
  if (!Number.isFinite(parsedNumber)) {
    return {
      isValid: false,
      normalizedValue: null,
      errorMessage: "Value must be numeric.",
    };
  }

  const normalizedValue =
    control.kind === "int"
      ? String(Math.round(parsedNumber))
      : toGlslFloatLiteral(parsedNumber);
  const normalizedNumber = Number(normalizedValue);

  if (typeof control.min === "number" && normalizedNumber < control.min) {
    return {
      isValid: false,
      normalizedValue: null,
      errorMessage: `Value must be >= ${control.min}.`,
    };
  }

  if (typeof control.max === "number" && normalizedNumber > control.max) {
    return {
      isValid: false,
      normalizedValue: null,
      errorMessage: `Value must be <= ${control.max}.`,
    };
  }

  return {
    isValid: true,
    normalizedValue,
    errorMessage: null,
  };
}

export function getSliderNumericValue(value: string, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

export function resolveShaderDefineValues(
  shader: ShaderCatalogEntry,
  overrides: ShaderDefineValues | undefined,
  pending: ShaderDefineValues | undefined,
) {
  return {
    ...getShaderDefaultDefineValues(shader),
    ...(overrides ?? {}),
    ...(pending ?? {}),
  };
}

export function createShaderDefaultsById(
  shaders: readonly ShaderCatalogEntry[],
): Map<string, ShaderDefineValues> {
  return new Map(
    shaders.map((shader) => [shader.id, getShaderDefaultDefineValues(shader)]),
  );
}

export function resolveShaderDefaults(shaderId: string): ShaderDefineValues {
  const shader = getShaderById(shaderId);
  return shader ? getShaderDefaultDefineValues(shader) : {};
}
