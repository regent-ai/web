import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import { DashboardApp, DashboardFallback } from "./DashboardApp";
import {
  dashboardConfigSignature,
  parseDashboardConfig,
} from "./root-config";
import type { DashboardConfig } from "./types";

type MountedDashboardRoot = {
  root: Root;
  signature: string;
};

const roots = new WeakMap<Element, MountedDashboardRoot>();

function renderDashboard(root: Root, config: DashboardConfig): void {
  if (!config.privyAppId) {
    root.render(
      <React.StrictMode>
        <DashboardFallback config={config} />
      </React.StrictMode>,
    );
    return;
  }

  root.render(
    <React.StrictMode>
      <PrivyProvider appId={config.privyAppId} clientId={config.privyClientId ?? undefined}>
        <DashboardApp config={config} />
      </PrivyProvider>
    </React.StrictMode>,
  );
}

export function mountDashboardRoot(el: Element): void {
  const config = parseDashboardConfig(el.getAttribute("data-dashboard-config"));
  const mounted = roots.get(el);

  if (!config) {
    if (mounted) {
      mounted.root.unmount();
      roots.delete(el);
    }
    return;
  }

  const signature = dashboardConfigSignature(config);

  if (mounted) {
    if (mounted.signature === signature) return;
    renderDashboard(mounted.root, config);
    roots.set(el, { root: mounted.root, signature });
    return;
  }

  const root = createRoot(el);
  renderDashboard(root, config);
  roots.set(el, { root, signature });
}

export function unmountDashboardRoot(el: Element): void {
  const mounted = roots.get(el);
  if (!mounted) return;

  mounted.root.unmount();
  roots.delete(el);
}
