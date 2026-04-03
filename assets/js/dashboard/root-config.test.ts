import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  dashboardConfigSignature,
  parseDashboardConfig,
} from "./root-config.ts";
import type { DashboardConfig } from "./types.ts";

const sampleConfig: DashboardConfig = {
  privyAppId: "app_123",
  privyClientId: "client_123",
  baseRpcUrl: "https://base.example",
  redeemerAddress: "0x1111111111111111111111111111111111111111",
  endpoints: {
    basenamesConfig: "/api/basenames/config",
    basenamesAllowance: "/api/basenames/allowance",
    basenamesAvailability: "/api/basenames/availability",
    basenamesOwned: "/api/basenames/owned",
    basenamesRecent: "/api/basenames/recent",
    basenamesMint: "/api/basenames/mint",
    autolaunchAuctions: "/api/agentlaunch/auctions",
    opensea: "/api/opensea",
    openseaRedeemStats: "/api/opensea/redeem-stats",
  },
};

describe("dashboard root config helpers", () => {
  it("parses valid dashboard config JSON", () => {
    assert.deepEqual(parseDashboardConfig(JSON.stringify(sampleConfig)), sampleConfig);
  });

  it("returns null for missing or invalid dashboard config JSON", () => {
    assert.equal(parseDashboardConfig(null), null);
    assert.equal(parseDashboardConfig(""), null);
    assert.equal(parseDashboardConfig("{not-json}"), null);
  });

  it("produces stable signatures for equal configs", () => {
    assert.equal(
      dashboardConfigSignature(sampleConfig),
      dashboardConfigSignature({ ...sampleConfig }),
    );
  });
});
