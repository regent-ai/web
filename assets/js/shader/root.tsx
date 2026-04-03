import React from "react";
import { createRoot, type Root } from "react-dom/client";

import { ShaderApp } from "./ShaderApp.tsx";

type MountedShaderRoot = {
  root: Root;
};

const roots = new WeakMap<Element, MountedShaderRoot>();

export function mountShaderRoot(el: Element): void {
  const mounted = roots.get(el);
  if (mounted) return;

  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <ShaderApp />
    </React.StrictMode>,
  );
  roots.set(el, { root });
}

export function unmountShaderRoot(el: Element): void {
  const mounted = roots.get(el);
  if (!mounted) return;

  mounted.root.unmount();
  roots.delete(el);
}
