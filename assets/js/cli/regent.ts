#!/usr/bin/env node
import process from "node:process";

import {
  exportSummaryPayload,
  parseRegentCommand,
  shaderListPayload,
  usageText,
} from "./shader_cli.ts";
import { exportShaderImage } from "./shader_export.ts";

async function main() {
  const command = parseRegentCommand(process.argv.slice(2), process.cwd());

  if (command.kind === "help") {
    process.stdout.write(`${usageText()}\n`);
    return;
  }

  if (command.kind === "shader-list") {
    writeJson(shaderListPayload(command));
    return;
  }

  const result = await exportShaderImage(command);
  writeJson(exportSummaryPayload(result));
}

function writeJson(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : "Command failed.";
  process.stderr.write(`${JSON.stringify({ ok: false, error: message }, null, 2)}\n`);
  process.exitCode = 1;
});
