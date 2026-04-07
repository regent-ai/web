import * as React from "react";
import { createRoot } from "react-dom/client";

import { RegentTokenCard } from "../../assets/js/shader/RegentTokenCard.tsx";
import { buildShaderFragmentSource, getShaderById } from "../../assets/js/shader/lib/catalog.ts";
import { createShaderToyRuntime } from "../../assets/js/shader/lib/runtime.ts";
import type { TokenCardManifestEntry } from "../../assets/js/shader/token_card_types.ts";

interface CardRenderConfig {
  entry: TokenCardManifestEntry;
  width: number;
  height: number;
  heroFrameSeconds: number;
  fontDisplayUrl: string;
  fontBodyUrl: string;
}

declare global {
  interface Window {
    __ANIMATA_CARD_RENDER_CONFIG__?: CardRenderConfig;
    __ANIMATA_CARD_RENDER_READY__?: boolean;
    __ANIMATA_CARD_RENDER_ERROR__?: string;
  }
}

async function run() {
  const config = window.__ANIMATA_CARD_RENDER_CONFIG__;
  if (!config) {
    throw new Error("Missing token card render config.");
  }

  const shader = getShaderById(config.entry.shaderId);
  if (!shader) {
    throw new Error(`Unknown shader "${config.entry.shaderId}".`);
  }

  injectFonts(config.fontDisplayUrl, config.fontBodyUrl);

  const rootElement = document.createElement("div");
  rootElement.id = "token-card-render-root";
  rootElement.style.width = `${config.width}px`;
  rootElement.style.height = `${config.height}px`;
  document.body.replaceChildren(rootElement);

  const canvasId = "token-card-render-canvas";
  const root = createRoot(rootElement);
  root.render(
    <RegentTokenCard
      entry={config.entry}
      interactive={false}
      className="h-full w-full"
      media={
        <canvas
          id={canvasId}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      }
    />,
  );

  await document.fonts.ready;
  await nextFrame();
  await nextFrame();

  const canvas = document.getElementById(canvasId);
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Token card render canvas was not created.");
  }

  const runtime = createShaderToyRuntime(canvas, {
    fragmentSource: buildShaderFragmentSource(shader, config.entry.defineValues),
    channels: shader.channels,
    devicePixelRatioCap: 1,
    preserveDrawingBuffer: true,
    debugLabel: `animata-card:${shader.id}:${config.entry.tokenId}`,
  });

  runtime.renderFrameAt(config.heroFrameSeconds, 0);
  await nextFrame();
  window.__ANIMATA_CARD_RENDER_READY__ = true;
}

void run().catch((error) => {
  window.__ANIMATA_CARD_RENDER_ERROR__ =
    error instanceof Error ? error.message : "Token card renderer failed.";
});

function injectFonts(displayUrl: string, bodyUrl: string) {
  const style = document.createElement("style");
  style.textContent = `
    @font-face {
      font-family: "GeistPixel Circle";
      src: url("${displayUrl}") format("woff2");
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: "GeistPixel Square";
      src: url("${bodyUrl}") format("woff2");
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }

    html, body {
      margin: 0;
      background: transparent;
    }
  `;
  document.head.append(style);
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
