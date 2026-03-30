import { useActiveWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import React from "react";
import { createWalletClient, custom, type WalletClient } from "viem";
import { base, mainnet } from "viem/chains";

export interface PrivyUserWalletAccountLike {
  type?: string;
  address?: `0x${string}`;
}

export interface PrivyUserLike {
  id?: string;
  wallet?: { address?: `0x${string}` };
  linkedAccounts?: PrivyUserWalletAccountLike[];
}

export interface PrivyEthereumWalletLike {
  type: "ethereum";
  address: `0x${string}`;
  chainId?: string | number | null;
  walletClientType?: string | null;
  getEthereumProvider: () => Promise<unknown>;
}

interface PrivyWalletLike {
  type?: string;
  address?: `0x${string}`;
  chainId?: string | number | null;
  walletClientType?: string | null;
  getEthereumProvider?: () => Promise<unknown>;
}

export function resolvePrivyChainId(
  chainId: string | number | null | undefined,
): number | null {
  if (typeof chainId === "number") return chainId;
  if (typeof chainId === "string") {
    const numeric = chainId.includes(":") ? chainId.split(":").pop() : chainId;
    const parsed = numeric ? Number.parseInt(numeric, 10) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function getWalletAddressFromPrivyUser(
  privyUser: unknown,
): `0x${string}` | null {
  const user = privyUser as PrivyUserLike | null | undefined;

  if (!user) return null;
  if (user.wallet?.address) return user.wallet.address;

  const linkedAccounts = Array.isArray(user.linkedAccounts) ? user.linkedAccounts : [];
  const walletAccount = linkedAccounts.find(
    (account) =>
      account.type === "wallet" ||
      account.type === "wallet_account" ||
      account.type === "ethereum",
  );

  return walletAccount?.address ?? null;
}

export function getPrivyIdFromUser(privyUser: unknown): string | null {
  const user = privyUser as Pick<PrivyUserLike, "id"> | null | undefined;
  if (typeof user?.id !== "string") return null;
  const trimmed = user.id.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isPrivyEthereumWallet(
  value: unknown,
): value is PrivyEthereumWalletLike {
  const wallet = value as PrivyWalletLike | null | undefined;
  return (
    wallet?.type === "ethereum" &&
    typeof wallet.address === "string" &&
    typeof wallet.getEthereumProvider === "function"
  );
}

function matchesPrivyUserAddress(
  wallet: PrivyEthereumWalletLike,
  privyUserAddress: `0x${string}` | null,
): boolean {
  return (
    typeof privyUserAddress === "string" &&
    wallet.address.toLowerCase() === privyUserAddress.toLowerCase()
  );
}

function isEmbeddedPrivyWallet(wallet: PrivyEthereumWalletLike): boolean {
  return wallet.walletClientType === "privy";
}

export function selectPrivyEthereumWallet(args: {
  activeWallet: unknown;
  wallets: readonly unknown[] | null | undefined;
  privyUserAddress: `0x${string}` | null;
}): PrivyEthereumWalletLike | null {
  if (
    isPrivyEthereumWallet(args.activeWallet) &&
    (isEmbeddedPrivyWallet(args.activeWallet) ||
      matchesPrivyUserAddress(args.activeWallet, args.privyUserAddress))
  ) {
    return args.activeWallet;
  }

  const ethereumWallets = (args.wallets ?? []).filter(isPrivyEthereumWallet);
  const embeddedMatchingWallet =
    ethereumWallets.find(
      (wallet) =>
        isEmbeddedPrivyWallet(wallet) &&
        matchesPrivyUserAddress(wallet, args.privyUserAddress),
    ) ?? null;
  if (embeddedMatchingWallet) return embeddedMatchingWallet;

  const matchingWallet =
    ethereumWallets.find((wallet) =>
      matchesPrivyUserAddress(wallet, args.privyUserAddress),
    ) ?? null;
  if (matchingWallet) return matchingWallet;

  return ethereumWallets.find(isEmbeddedPrivyWallet) ?? null;
}

export interface UsePrivyWalletClientResult {
  account: `0x${string}` | null;
  privyId: string | null;
  wallet: PrivyEthereumWalletLike | null;
  walletClient: WalletClient | null;
  chainId: number | null;
  ready: boolean;
}

export function usePrivyWalletClient(): UsePrivyWalletClientResult {
  const { user: privyUser } = usePrivy();
  const { wallet: activeWallet } = useActiveWallet();
  const { wallets } = useWallets();

  const privyUserAddress = React.useMemo(
    () => getWalletAddressFromPrivyUser(privyUser),
    [privyUser],
  );
  const privyId = React.useMemo(() => getPrivyIdFromUser(privyUser), [privyUser]);
  const wallet = React.useMemo(
    () =>
      selectPrivyEthereumWallet({
        activeWallet,
        wallets,
        privyUserAddress,
      }),
    [activeWallet, privyUserAddress, wallets],
  );
  const account = (wallet?.address ?? privyUserAddress ?? null) as `0x${string}` | null;
  const chainId = React.useMemo(
    () => resolvePrivyChainId(wallet?.chainId ?? null),
    [wallet?.chainId],
  );
  const [walletClient, setWalletClient] = React.useState<WalletClient | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    if (!wallet) {
      setWalletClient(null);
      return;
    }

    void (async () => {
      try {
        const provider = await wallet.getEthereumProvider();
        if (cancelled) return;

        const resolvedChainId = resolvePrivyChainId(wallet.chainId) ?? base.id;
        const chain = resolvedChainId === mainnet.id ? mainnet : base;
        const nextClient = createWalletClient({
          account: wallet.address,
          chain,
          transport: custom(provider as any),
        });
        setWalletClient(nextClient);
      } catch {
        if (!cancelled) {
          setWalletClient(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wallet, wallet?.address, wallet?.chainId]);

  return {
    account,
    privyId,
    wallet,
    walletClient,
    chainId,
    ready: Boolean(account && privyId && walletClient),
  };
}
