import type { DashboardConfig } from "./types";

export function parseDashboardConfig(raw: string | null | undefined): DashboardConfig | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DashboardConfig;
  } catch {
    return null;
  }
}

export function dashboardConfigSignature(config: DashboardConfig): string {
  return JSON.stringify(config);
}
