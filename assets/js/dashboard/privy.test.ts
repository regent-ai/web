import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hasPrivySessionWallet,
  selectPrivyEthereumWallet,
  type PrivyEthereumWalletLike,
} from "./privy.ts";

function wallet(
  address: `0x${string}`,
  overrides: Partial<PrivyEthereumWalletLike> = {},
): PrivyEthereumWalletLike {
  return {
    type: "ethereum",
    address,
    walletClientType: "injected",
    getEthereumProvider: async () => ({}),
    ...overrides,
  };
}

describe("selectPrivyEthereumWallet", () => {
  const userAddress = "0x1111111111111111111111111111111111111111" as const;
  const otherAddress = "0x2222222222222222222222222222222222222222" as const;

  it("selects the active embedded wallet", () => {
    const activeWallet = wallet(otherAddress, { walletClientType: "privy" });

    assert.equal(
      selectPrivyEthereumWallet({
        activeWallet,
        wallets: [],
        privyUserAddress: userAddress,
      }),
      activeWallet,
    );
  });

  it("selects the active wallet when its address matches the Privy user", () => {
    const activeWallet = wallet(userAddress);

    assert.equal(
      selectPrivyEthereumWallet({
        activeWallet,
        wallets: [],
        privyUserAddress: userAddress,
      }),
      activeWallet,
    );
  });

  it("ignores unrelated connected wallets", () => {
    assert.equal(
      selectPrivyEthereumWallet({
        activeWallet: wallet(otherAddress),
        wallets: [wallet(otherAddress)],
        privyUserAddress: userAddress,
      }),
      null,
    );
  });

  it("returns null when no authenticated or matching wallet exists", () => {
    assert.equal(
      selectPrivyEthereumWallet({
        activeWallet: null,
        wallets: [],
        privyUserAddress: null,
      }),
      null,
    );
  });
});

describe("hasPrivySessionWallet", () => {
  it("returns false when a wallet-like account exists without authentication", () => {
    assert.equal(
      hasPrivySessionWallet({
        authenticated: false,
        account: "0x1111111111111111111111111111111111111111",
      }),
      false,
    );
  });

  it("returns true when an authenticated session has an account", () => {
    assert.equal(
      hasPrivySessionWallet({
        authenticated: true,
        account: "0x1111111111111111111111111111111111111111",
      }),
      true,
    );
  });
});
