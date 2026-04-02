import type { PrivyEthereumWalletLike } from "./privy.ts";

type RequestProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export type WalletCancelResult =
  | "cancelled"
  | "unsupported"
  | "unavailable";

function isUnsupportedProviderMethod(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code;
  const message = String((error as { message?: unknown })?.message ?? "").toLowerCase();

  return (
    code === 4200 ||
    code === -32601 ||
    message.includes("unsupported") ||
    message.includes("not supported") ||
    message.includes("not found") ||
    message.includes("does not exist") ||
    message.includes("unrecognized method")
  );
}

export async function attemptWalletCancel(args: {
  wallet: PrivyEthereumWalletLike | null;
  txHash?: `0x${string}` | null;
}): Promise<WalletCancelResult> {
  if (!args.wallet) return "unavailable";

  const provider = (await args.wallet.getEthereumProvider()) as RequestProvider;
  if (typeof provider.request !== "function") return "unsupported";

  const attempts = [
    ...(args.txHash
      ? [
          { method: "wallet_cancelTransaction", params: [args.txHash] },
          { method: "wallet_cancelTransaction", params: [{ hash: args.txHash }] },
          { method: "wallet_cancelTransaction", params: [{ transactionHash: args.txHash }] },
        ]
      : []),
    { method: "wallet_rejectPendingRequest", params: [] },
    { method: "wallet_rejectPendingTransaction", params: [] },
  ];

  let supportedAttemptSeen = false;

  for (const attempt of attempts) {
    try {
      await provider.request({
        method: attempt.method,
        params: attempt.params,
      });
      return "cancelled";
    } catch (error) {
      if (isUnsupportedProviderMethod(error)) continue;
      supportedAttemptSeen = true;
    }
  }

  return supportedAttemptSeen ? "unavailable" : "unsupported";
}
