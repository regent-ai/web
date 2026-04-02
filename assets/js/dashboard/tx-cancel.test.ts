import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { attemptWalletCancel } from "./tx-cancel.ts";

describe("attemptWalletCancel", () => {
  it("returns unavailable when no wallet is present", async () => {
    const result = await attemptWalletCancel({ wallet: null });

    assert.equal(result, "unavailable");
  });

  it("returns unsupported when the wallet provider has no request method", async () => {
    const result = await attemptWalletCancel({
      wallet: {
        type: "ethereum",
        address: "0x1111111111111111111111111111111111111111",
        getEthereumProvider: async () => ({}),
      },
    });

    assert.equal(result, "unsupported");
  });

  it("returns cancelled when wallet_cancelTransaction succeeds", async () => {
    const calls: Array<{ method: string; params?: unknown[] }> = [];

    const result = await attemptWalletCancel({
      wallet: {
        type: "ethereum",
        address: "0x1111111111111111111111111111111111111111",
        getEthereumProvider: async () => ({
          request: async (args: { method: string; params?: unknown[] }) => {
            calls.push(args);
            return { ok: true };
          },
        }),
      },
      txHash: "0x1234",
    });

    assert.equal(result, "cancelled");
    assert.deepEqual(calls, [
      { method: "wallet_cancelTransaction", params: ["0x1234"] },
    ]);
  });

  it("falls back to rejecting a pending request when hash cancellation is unsupported", async () => {
    const calls: string[] = [];

    const result = await attemptWalletCancel({
      wallet: {
        type: "ethereum",
        address: "0x1111111111111111111111111111111111111111",
        getEthereumProvider: async () => ({
          request: async (args: { method: string; params?: unknown[] }) => {
            calls.push(args.method);
            if (args.method === "wallet_rejectPendingRequest") return { ok: true };
            throw new Error("unsupported");
          },
        }),
      },
      txHash: "0x1234",
    });

    assert.equal(result, "cancelled");
    assert.deepEqual(calls, [
      "wallet_cancelTransaction",
      "wallet_cancelTransaction",
      "wallet_cancelTransaction",
      "wallet_rejectPendingRequest",
    ]);
  });

  it("returns unavailable when a supported cancel method fails", async () => {
    const result = await attemptWalletCancel({
      wallet: {
        type: "ethereum",
        address: "0x1111111111111111111111111111111111111111",
        getEthereumProvider: async () => ({
          request: async (args: { method: string; params?: unknown[] }) => {
            if (args.method === "wallet_cancelTransaction") {
              throw new Error("wallet refused cancellation");
            }
            throw new Error("unsupported");
          },
        }),
      },
      txHash: "0x1234",
    });

    assert.equal(result, "unavailable");
  });
});
