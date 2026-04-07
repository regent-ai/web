import React from "react";
import { createRoot, type Root } from "react-dom/client";

import { TokenCardPage } from "./TokenCardPage.tsx";
import type { TokenCardManifestEntry } from "./token_card_types.ts";

type MountedTokenCardRoot = {
  root: Root;
};

const roots = new WeakMap<Element, MountedTokenCardRoot>();

function readEntry(el: Element): TokenCardManifestEntry {
  const container = el.closest("[data-token-card-page]") ?? el.parentElement;
  const script = container?.querySelector<HTMLScriptElement>("[data-token-card-json]");

  if (!script?.textContent) {
    throw new Error("Token card page is missing its manifest payload.");
  }

  return JSON.parse(script.textContent) as TokenCardManifestEntry;
}

export function mountTokenCardRoot(el: Element): void {
  const mounted = roots.get(el);
  if (mounted) return;

  const entry = readEntry(el);
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <TokenCardPage entry={entry} />
    </React.StrictMode>,
  );
  roots.set(el, { root });
}

export function unmountTokenCardRoot(el: Element): void {
  const mounted = roots.get(el);
  if (!mounted) return;

  mounted.root.unmount();
  roots.delete(el);
}
