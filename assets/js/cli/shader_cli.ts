import path from "node:path";

import { SHADER_CATALOG, getShaderDefaultDefineValues, getShaderById } from "../shader/lib/catalog.ts";
import type {
  ShaderCatalogEntry,
  ShaderDefineControl,
  ShaderDefineValues,
  ShaderUsage,
} from "../shader/lib/types.ts";
import { validateShaderDefineInput } from "../shader/editor.ts";

export interface ShaderListCommand {
  kind: "shader-list";
  usage: ShaderUsage | null;
}

export interface ShaderExportCommand {
  kind: "shader-export";
  shaderId: string;
  width: number;
  height: number;
  settleMs: number;
  outPath: string;
  specOutPath: string | null;
  browserPath: string | null;
  defineValues: ShaderDefineValues;
}

export interface HelpCommand {
  kind: "help";
}

export type RegentCommand = ShaderListCommand | ShaderExportCommand | HelpCommand;

const VALID_USAGES: readonly ShaderUsage[] = ["avatar", "background", "creator-inert"];

export function usageText() {
  return [
    "regent shader list [--usage avatar|background|creator-inert]",
    "regent shader export <shader-id> [--define KEY=VALUE ...] [--width 1024] [--height 1024] [--settle-ms 900] [--out ./avatar.png] [--spec-out ./avatar.json] [--browser /path/to/chrome]",
  ].join("\n");
}

export function shaderListPayload(command: ShaderListCommand) {
  return {
    ok: true,
    command: "regent shader list",
    shaders: listShaders(command.usage).map((shader) => ({
      id: shader.id,
      title: shader.title,
      description: shader.description,
      usage: [...shader.usage],
      defineControls: shader.defineControls.map((control) => ({
        key: control.key,
        kind: control.kind,
        defaultValue: control.defaultValue,
        min: control.min ?? null,
        max: control.max ?? null,
        step: control.step ?? null,
        description: control.description ?? null,
      })),
    })),
  };
}

export function listShaders(usage: ShaderUsage | null) {
  if (!usage) return SHADER_CATALOG;
  return SHADER_CATALOG.filter((shader) => shader.usage.includes(usage));
}

export function parseRegentCommand(argv: readonly string[], cwd: string): RegentCommand {
  const args = [...argv];

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return { kind: "help" };
  }

  const [surface, command, ...rest] = args;

  if (surface !== "shader") {
    throw new Error(`Unknown command surface "${surface}".\n${usageText()}`);
  }

  if (command === "list") {
    return parseShaderList(rest);
  }

  if (command === "export") {
    return parseShaderExport(rest, cwd);
  }

  throw new Error(`Unknown shader command "${command ?? ""}".\n${usageText()}`);
}

function parseShaderList(args: string[]): ShaderListCommand {
  let usage: ShaderUsage | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === "--usage") {
      const next = args[index + 1];
      if (!next) throw new Error("Missing value after --usage.");
      if (!VALID_USAGES.includes(next as ShaderUsage)) {
        throw new Error(`Unsupported usage "${next}".`);
      }
      usage = next as ShaderUsage;
      index += 1;
      continue;
    }

    throw new Error(`Unknown flag "${token}" for regent shader list.`);
  }

  return { kind: "shader-list", usage };
}

function parseShaderExport(args: string[], cwd: string): ShaderExportCommand {
  if (args.length === 0) {
    throw new Error("Missing shader id for regent shader export.");
  }

  const shaderId = args[0]!;
  const shader = getShaderById(shaderId);
  if (!shader) {
    throw new Error(`Unknown shader "${shaderId}". Run regent shader list first.`);
  }

  let width = 1024;
  let height = 1024;
  let settleMs = 900;
  let outPath: string | null = null;
  let specOutPath: string | null = null;
  let browserPath: string | null = null;
  const definePairs: string[] = [];

  for (let index = 1; index < args.length; index += 1) {
    const token = args[index];

    if (token === "--define") {
      const next = args[index + 1];
      if (!next) throw new Error("Missing KEY=VALUE after --define.");
      definePairs.push(next);
      index += 1;
      continue;
    }

    if (token === "--width") {
      width = parsePositiveInteger(args[index + 1], "--width");
      index += 1;
      continue;
    }

    if (token === "--height") {
      height = parsePositiveInteger(args[index + 1], "--height");
      index += 1;
      continue;
    }

    if (token === "--settle-ms") {
      settleMs = parseNonNegativeInteger(args[index + 1], "--settle-ms");
      index += 1;
      continue;
    }

    if (token === "--out") {
      const next = args[index + 1];
      if (!next) throw new Error("Missing output path after --out.");
      outPath = path.resolve(cwd, next);
      index += 1;
      continue;
    }

    if (token === "--spec-out") {
      const next = args[index + 1];
      if (!next) throw new Error("Missing output path after --spec-out.");
      specOutPath = path.resolve(cwd, next);
      index += 1;
      continue;
    }

    if (token === "--browser") {
      const next = args[index + 1];
      if (!next) throw new Error("Missing executable path after --browser.");
      browserPath = path.resolve(cwd, next);
      index += 1;
      continue;
    }

    throw new Error(`Unknown flag "${token}" for regent shader export.`);
  }

  return {
    kind: "shader-export",
    shaderId,
    width,
    height,
    settleMs,
    outPath: outPath ?? path.resolve(cwd, `regent-shader-${shaderId}.png`),
    specOutPath,
    browserPath,
    defineValues: resolveShaderDefineOverrides(shader, definePairs),
  };
}

function parsePositiveInteger(rawValue: string | undefined, flag: string) {
  if (!rawValue) throw new Error(`Missing value after ${flag}.`);
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return parsed;
}

function parseNonNegativeInteger(rawValue: string | undefined, flag: string) {
  if (!rawValue) throw new Error(`Missing value after ${flag}.`);
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${flag} must be a non-negative integer.`);
  }
  return parsed;
}

function resolveShaderDefineOverrides(
  shader: ShaderCatalogEntry,
  definePairs: readonly string[],
): ShaderDefineValues {
  const defaults = getShaderDefaultDefineValues(shader);
  const controlsByKey = new Map(shader.defineControls.map((control) => [control.key, control]));
  const overrides: ShaderDefineValues = {};

  for (const pair of definePairs) {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex <= 0) {
      throw new Error(`Invalid define override "${pair}". Use KEY=VALUE.`);
    }

    const key = pair.slice(0, separatorIndex).trim();
    const rawValue = pair.slice(separatorIndex + 1).trim();
    const control = controlsByKey.get(key);
    if (!control) {
      throw new Error(`Shader "${shader.id}" does not expose a "${key}" define.`);
    }

    const validation = validateShaderDefineInput(control, rawValue);
    if (!validation.isValid || !validation.normalizedValue) {
      throw new Error(validation.errorMessage ?? `Invalid value for "${key}".`);
    }

    overrides[key] = validation.normalizedValue;
  }

  return {
    ...defaults,
    ...overrides,
  };
}

export function exportSummaryPayload(result: {
  shaderId: string;
  title: string;
  usage: readonly ShaderUsage[];
  sourceUrl: string;
  outPath: string;
  specOutPath: string | null;
  width: number;
  height: number;
  defineValues: ShaderDefineValues;
  imageSpec: Record<string, unknown>;
}) {
  return {
    ok: true,
    command: "regent shader export",
    shader: {
      id: result.shaderId,
      title: result.title,
      usage: [...result.usage],
      sourceUrl: result.sourceUrl,
    },
    outputPath: result.outPath,
    specPath: result.specOutPath,
    width: result.width,
    height: result.height,
    defineValues: result.defineValues,
    imageSpec: result.imageSpec,
  };
}

export function controlKeys(shaderId: string) {
  const shader = getShaderById(shaderId);
  if (!shader) return [];
  return shader.defineControls.map((control: ShaderDefineControl) => control.key);
}
