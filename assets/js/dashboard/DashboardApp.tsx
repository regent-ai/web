import { animate } from "animejs";
import { usePrivy } from "@privy-io/react-auth";
import React from "react";
import {
  createPublicClient,
  http,
  isAddress,
  type Chain,
  type WalletClient,
} from "viem";
import { base, mainnet } from "viem/chains";

import {
  ANIMATA1,
  ANIMATA2,
  REGENT_PAYOUT,
  USDC,
  USDC_PRICE,
  erc20Abi,
  erc721Abi,
  redeemerAbi,
  type CollectionKey,
} from "./redeem-constants";
import {
  hasPrivySessionWallet,
  resolvePrivyChainId,
  usePrivyWalletClient,
  type PrivyEthereumWalletLike,
} from "./privy";
import {
  invalidateTrackedRequests,
  isTrackedRequestCurrent,
  startTrackedRequest,
} from "./requests";
import { attemptWalletCancel } from "./tx-cancel";
import type {
  AllowanceResponse,
  AvailabilityResponse,
  BasenamesConfigResponse,
  DashboardConfig,
  MintResponse,
  OpenSeaRedeemStatsResponse,
  OpenSeaResponse,
  OwnedNamesResponse,
  RecentNamesResponse,
} from "./types";

const PAYMENT_RECEIPT_TIMEOUT_MS = 120_000;

type NoticeTone = "error" | "success" | "info";

type Notice = {
  tone: NoticeTone;
  message: string;
};

type WalletSectionProps = {
  account: `0x${string}` | null;
  chainId: number | null;
  wallet: PrivyEthereumWalletLike | null;
  walletClient: WalletClient | null;
  authenticated: boolean;
  privyReady: boolean;
  onConnect: () => void;
  onDisconnect?: () => void;
};

type ClaimDialogState = {
  open: boolean;
  status: "pending" | "success";
  fqdn: string | null;
  ensFqdn: string | null;
  paymentTxHash: `0x${string}` | null;
};

type BasenameValidation = {
  isValid: boolean;
  normalizedLabel: string;
  reason?: string;
};

type NameAvailabilityState = {
  validation: BasenameValidation;
  fqdn: string | null;
  ensFqdn: string | null;
  availability: AvailabilityResponse | null;
  isReservedLabel: boolean;
  labelError: string | null;
  isAvailable: boolean | null;
  isLabelInvalid: boolean;
  isChecking: boolean;
  refresh: () => void;
};

type SourceKey = CollectionKey;

type HoldingsFetched = {
  ANIMATA1: boolean;
  ANIMATA2: boolean;
};

type HoldingList = {
  animata1: number[];
  animata2: number[];
};

type RedeemSupplyState = {
  animata: number | null;
  "regent-animata-ii": number | null;
};

type WalletSnapshot = {
  wallet: WalletClient | null;
  account: `0x${string}` | null;
  chainId: number | null;
};

type MaybeRequestProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const REGENTS_CLUB_OPENSEA_BASE = "https://opensea.io/collection/regents-club";

export function DashboardFallback({ config }: { config: DashboardConfig }) {
  return (
    <div className="space-y-8">
      <section
        className="rounded-[1.75rem] border border-[color:var(--border)] p-6 shadow-[0_24px_70px_-48px_color-mix(in_oklch,var(--brand-ink)_55%,transparent)]"
        style={{
          background:
            "radial-gradient(circle at 14% 16%, color-mix(in oklch, var(--accent) 18%, transparent), transparent 34%), radial-gradient(circle at 84% 82%, color-mix(in oklch, var(--chart-2) 14%, transparent), transparent 36%), linear-gradient(180deg, color-mix(in oklch, var(--card) 88%, transparent), color-mix(in oklch, var(--card) 96%, var(--background) 4%))",
        }}
      >
        <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
          Wallet Layer Missing
        </p>
        <div className="mt-3 space-y-3">
          <h2 className="font-display text-3xl text-[color:var(--foreground)] sm:text-4xl">
            Dashboard needs Privy to turn on
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-[color:var(--muted-foreground)] sm:text-base sm:leading-7">
            The Phoenix shell and APIs are live, but wallet actions stay disabled until a
            Privy app id is set. Once that is present, this page mounts the combined
            redeem and name-claim flow automatically.
          </p>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Privy" value="Missing app id" copy="Required for wallet auth" />
          <MetricTile
            label="Base RPC"
            value={config.baseRpcUrl ?? "Missing"}
            copy="Used for Base reads"
          />
          <MetricTile
            label="Redeemer"
            value={shortValue(config.redeemerAddress)}
            copy="Redeem contract"
          />
          <MetricTile label="API owner" value="Phoenix" copy="No Node fallback" />
        </dl>
      </section>
    </div>
  );
}

export function DashboardApp({ config }: { config: DashboardConfig }) {
  const {
    ready: privyReady,
    authenticated,
    login,
    logout,
  } = usePrivy();
  const { account, chainId, wallet, walletClient } = usePrivyWalletClient();

  return (
    <div className="space-y-8">
      <WalletStatus
        account={account}
        chainId={chainId}
        wallet={wallet}
        walletClient={walletClient}
        authenticated={authenticated}
        privyReady={privyReady}
        onConnect={() => login()}
        onDisconnect={() => {
          void logout();
        }}
      />

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)]">
        <RedeemSection
          config={config}
          account={account}
          chainId={chainId}
          wallet={wallet}
          walletClient={walletClient}
          authenticated={authenticated}
          privyReady={privyReady}
          onConnect={() => login()}
        />

        <NamesSection
          config={config}
          account={account}
          chainId={chainId}
          wallet={wallet}
          walletClient={walletClient}
          authenticated={authenticated}
          privyReady={privyReady}
          onConnect={() => login()}
        />
      </div>
    </div>
  );
}

function WalletStatus({
  account,
  authenticated,
  privyReady,
  onConnect,
  onDisconnect,
}: WalletSectionProps) {
  const [copiedAccount, setCopiedAccount] = React.useState(false);
  const checkIconRef = React.useRef<HTMLSpanElement | null>(null);
  const hasSessionWallet = hasPrivySessionWallet({ authenticated, account });

  React.useEffect(() => {
    if (!copiedAccount || !checkIconRef.current || prefersReducedMotion()) return;

    animate(checkIconRef.current, {
      opacity: [0, 1, 0],
      scale: [0.72, 1, 0.88],
      duration: 900,
      ease: "outQuart",
      onComplete: () => setCopiedAccount(false),
    });
  }, [copiedAccount]);

  React.useEffect(() => {
    if (!copiedAccount && checkIconRef.current) {
      checkIconRef.current.style.opacity = "0";
      checkIconRef.current.style.transform = "scale(0.72)";
    }
  }, [copiedAccount]);

  return (
    <section className="rounded-[1.75rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--card)_96%,var(--background)_4%)] p-6 shadow-[0_24px_70px_-48px_color-mix(in_oklch,var(--brand-ink)_55%,transparent)]">
      <div className="flex flex-col items-start gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
            onchain account
          </p>
          {hasSessionWallet ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="break-all text-sm leading-6 text-[color:var(--foreground)]">
                {account}
              </p>
              <button
                type="button"
                aria-label="Copy wallet address"
                title="Copy wallet address"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[color:var(--icon-ink)] transition hover:text-[color:var(--foreground)]"
                onClick={() => {
                  void copyText(account!)
                    .then(() => setCopiedAccount(true))
                    .catch(() => setCopiedAccount(false));
                }}
              >
                <span
                  aria-hidden="true"
                  className="relative inline-flex h-4 w-4 items-center justify-center"
                >
                  <svg
                    viewBox="0 0 16 16"
                    className={[
                      "absolute h-4 w-4 fill-none stroke-current transition-opacity duration-150",
                      copiedAccount ? "opacity-0" : "opacity-100"
                    ].join(" ")}
                  >
                    <rect
                      x="5.25"
                      y="2.25"
                      width="8.5"
                      height="10.5"
                      rx="1.25"
                      strokeWidth="1.25"
                    />
                    <path
                      d="M3.25 10.75H2.75c-.83 0-1.5-.67-1.5-1.5v-7c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5v.5"
                      strokeWidth="1.25"
                      strokeLinecap="square"
                    />
                  </svg>
                  <span
                    ref={checkIconRef}
                    className={[
                      "absolute inline-flex opacity-0",
                      copiedAccount ? "text-[color:var(--positive)]" : ""
                    ].join(" ")}
                    style={{ transform: "scale(0.72)" }}
                  >
                    <svg viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-current">
                      <path
                        d="m3.5 8.5 2.4 2.4L12.5 4.8"
                        strokeWidth="1.7"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                    </svg>
                  </span>
                </span>
              </button>
              <a
                href={`https://basescan.org/address/${account!}`}
                target="_blank"
                rel="noreferrer"
                aria-label="View wallet on Basescan"
                title="View wallet on Basescan"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[color:var(--icon-ink)] transition hover:bg-[color:color-mix(in_oklch,var(--icon-ink)_10%,transparent)] hover:text-[color:var(--foreground)]"
              >
                <img
                  src="/images/baselogo.jpeg"
                  alt=""
                  className="h-4 w-4 rounded-full object-cover"
                />
              </a>
              <a
                href={`https://etherscan.io/address/${account!}`}
                target="_blank"
                rel="noreferrer"
                aria-label="View wallet on Etherscan"
                title="View wallet on Etherscan"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:color-mix(in_oklch,var(--border)_88%,white_12%)] bg-[color:color-mix(in_oklch,var(--card)_92%,white_8%)] text-[color:var(--icon-ink)] shadow-[0_8px_18px_-14px_color-mix(in_oklch,var(--brand-ink)_40%,transparent)] transition hover:bg-[color:color-mix(in_oklch,var(--icon-ink)_8%,var(--card)_92%)] hover:text-[color:var(--foreground)]"
              >
                <img
                  src="/images/ethereumlogo.png"
                  alt=""
                  className="h-[13px] w-[13px] object-contain"
                />
              </a>
            </div>
          ) : (
            <p className="mt-2 break-all text-sm leading-6 text-[color:var(--foreground)]">
              No wallet connected
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap justify-start gap-3">
          {hasSessionWallet ? (
            <Button tone="secondary" onClick={onDisconnect}>
              Disconnect
            </Button>
          ) : (
            <Button
              disabled={!privyReady}
              onClick={onConnect}
              tone="primary"
            >
              {privyReady ? "Connect Account" : "Loading wallet"}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function RedeemSection({
  config,
  account,
  chainId,
  wallet,
  walletClient,
  authenticated,
  privyReady,
  onConnect,
}: WalletSectionProps & { config: DashboardConfig }) {
  const [source, setSource] = React.useState<SourceKey>("ANIMATA1");
  const [tokenId, setTokenId] = React.useState("");
  const [status, setStatus] = React.useState<
    "idle" | "approving" | "redeeming" | "claiming"
  >("idle");
  const [notice, setNotice] = React.useState<Notice | null>(null);
  const [holdings, setHoldings] = React.useState<HoldingList | null>(null);
  const [holdingsFetched, setHoldingsFetched] = React.useState<HoldingsFetched>({
    ANIMATA1: false,
    ANIMATA2: false,
  });
  const [isFetchingHoldings, setIsFetchingHoldings] = React.useState(false);
  const [accessPassHoldings, setAccessPassHoldings] = React.useState<number[] | null>(null);
  const [accessPassNotice, setAccessPassNotice] = React.useState<Notice | null>(null);
  const [isFetchingAccessPassHoldings, setIsFetchingAccessPassHoldings] =
    React.useState(false);
  const [redeemSupply, setRedeemSupply] = React.useState<RedeemSupplyState>({
    animata: null,
    "regent-animata-ii": null,
  });
  const [isFetchingRedeemSupply, setIsFetchingRedeemSupply] = React.useState(false);
  const [redeemSupplyNotice, setRedeemSupplyNotice] = React.useState<Notice | null>(null);
  const [claimable, setClaimable] = React.useState<bigint | null>(null);
  const [remaining, setRemaining] = React.useState<bigint | null>(null);
  const [nftApproved, setNftApproved] = React.useState(false);
  const [usdcAllowanceOk, setUsdcAllowanceOk] = React.useState(false);
  const [ownsSelectedToken, setOwnsSelectedToken] = React.useState<boolean | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [successTotal, setSuccessTotal] = React.useState<bigint | null>(null);
  const [showClaimSuccess, setShowClaimSuccess] = React.useState(false);
  const [claimSuccessAmount, setClaimSuccessAmount] = React.useState<bigint | null>(null);
  const publicClient = React.useMemo(
    () =>
      createPublicClient({
        chain: base,
        transport: http(config.baseRpcUrl ?? undefined),
      }),
    [config.baseRpcUrl],
  );

  const redeemerAddress = React.useMemo(() => {
    if (!config.redeemerAddress || !isAddress(config.redeemerAddress)) return null;
    return config.redeemerAddress as `0x${string}`;
  }, [config.redeemerAddress]);

  const connectedAccount = account ?? null;
  const connectedChainId = chainId ?? null;
  const isOnBase = connectedChainId === base.id;
  const approvalsReady = nftApproved && usdcAllowanceOk;
  const tokenIdValid =
    /^\d+$/.test(tokenId) && Number(tokenId) >= 1 && Number(tokenId) <= 999;
  const ownsTokenStatus = tokenIdValid ? ownsSelectedToken : null;
  const holdingsRequestRef = React.useRef(0);
  const accessPassRequestRef = React.useRef(0);
  const redeemSupplyRequestRef = React.useRef(0);
  const ownershipRequestRef = React.useRef(0);
  const claimableRequestRef = React.useRef(0);
  const approvalsRequestRef = React.useRef(0);

  React.useEffect(() => {
    return () => {
      invalidateTrackedRequests(holdingsRequestRef);
      invalidateTrackedRequests(accessPassRequestRef);
      invalidateTrackedRequests(redeemSupplyRequestRef);
      invalidateTrackedRequests(ownershipRequestRef);
      invalidateTrackedRequests(claimableRequestRef);
      invalidateTrackedRequests(approvalsRequestRef);
    };
  }, []);

  const refreshClaimable = React.useCallback(async () => {
    const requestId = startTrackedRequest(claimableRequestRef);

    if (!redeemerAddress || !connectedAccount) {
      setClaimable(null);
      setRemaining(null);
      return;
    }

    try {
      const currentClaimable = (await publicClient.readContract({
        address: redeemerAddress,
        abi: redeemerAbi,
        functionName: "claimable",
        args: [connectedAccount],
      })) as bigint;
      if (!isTrackedRequestCurrent(claimableRequestRef, requestId)) return;
      setClaimable(currentClaimable);

      const [pool, released, claimed] = (await publicClient.readContract({
        address: redeemerAddress,
        abi: redeemerAbi,
        functionName: "getVest",
        args: [connectedAccount],
      })) as readonly [bigint, bigint, bigint, bigint];
      if (!isTrackedRequestCurrent(claimableRequestRef, requestId)) return;
      const outstanding = pool + released - claimed;
      setRemaining(outstanding < 0n ? 0n : outstanding);
    } catch {
      if (!isTrackedRequestCurrent(claimableRequestRef, requestId)) return;
      setClaimable(null);
      setRemaining(null);
    }
  }, [connectedAccount, publicClient, redeemerAddress]);

  const refreshApprovals = React.useCallback(async () => {
    const requestId = startTrackedRequest(approvalsRequestRef);

    if (!connectedAccount || !redeemerAddress) {
      setNftApproved(false);
      setUsdcAllowanceOk(false);
      return;
    }

    try {
      const collection = source === "ANIMATA1" ? ANIMATA1 : ANIMATA2;
      const [approved, allowance] = await Promise.all([
        publicClient.readContract({
          address: collection,
          abi: erc721Abi,
          functionName: "isApprovedForAll",
          args: [connectedAccount, redeemerAddress],
        }) as Promise<boolean>,
        publicClient.readContract({
          address: USDC,
          abi: erc20Abi,
          functionName: "allowance",
          args: [connectedAccount, redeemerAddress],
        }) as Promise<bigint>,
      ]);

      if (!isTrackedRequestCurrent(approvalsRequestRef, requestId)) return;
      setNftApproved(Boolean(approved));
      setUsdcAllowanceOk(allowance >= USDC_PRICE);
    } catch {
      if (!isTrackedRequestCurrent(approvalsRequestRef, requestId)) return;
      setNftApproved(false);
      setUsdcAllowanceOk(false);
    }
  }, [connectedAccount, publicClient, redeemerAddress, source]);

  const fetchHoldings = React.useCallback(async () => {
    if (!connectedAccount) {
      setNotice({ tone: "error", message: "Connect your wallet to load holdings." });
      return;
    }

    const requestId = ++holdingsRequestRef.current;
    setIsFetchingHoldings(true);
    setNotice(null);

    try {
      const collection = source === "ANIMATA1" ? "animata" : "regent-animata-ii";
      const url = new URL(config.endpoints.opensea, window.location.origin);
      url.searchParams.set("address", connectedAccount);
      url.searchParams.set("collection", collection);

      const data = await fetchJson<OpenSeaResponse>(url.toString(), { cache: "no-store" });
      if (requestId !== holdingsRequestRef.current) return;

      setHoldings((current) => ({
        animata1:
          collection === "animata"
            ? data.animata1 ?? []
            : current?.animata1 ?? [],
        animata2:
          collection === "regent-animata-ii"
            ? data.animata2 ?? []
            : current?.animata2 ?? [],
      }));
      setHoldingsFetched((current) => ({ ...current, [source]: true }));
    } catch (error) {
      if (requestId !== holdingsRequestRef.current) return;
      setNotice({
        tone: "error",
        message: getErrorMessage(
          error,
          "Holdings lookup failed. You can still redeem by entering a token id.",
        ),
      });
    } finally {
      if (requestId === holdingsRequestRef.current) {
        setIsFetchingHoldings(false);
      }
    }
  }, [config.endpoints.opensea, connectedAccount, source]);

  const fetchAccessPassHoldings = React.useCallback(async () => {
    if (!connectedAccount) return;

    const requestId = ++accessPassRequestRef.current;
    setIsFetchingAccessPassHoldings(true);
    setAccessPassNotice(null);

    try {
      const url = new URL(config.endpoints.opensea, window.location.origin);
      url.searchParams.set("address", connectedAccount);
      url.searchParams.set("collection", "animata-pass");

      const data = await fetchJson<OpenSeaResponse>(url.toString(), { cache: "no-store" });
      if (requestId !== accessPassRequestRef.current) return;

      setAccessPassHoldings(Array.isArray(data.animataPass) ? data.animataPass : []);
    } catch (error) {
      if (requestId !== accessPassRequestRef.current) return;
      setAccessPassNotice({
        tone: "error",
        message: getErrorMessage(error, "Access pass holdings lookup failed."),
      });
    } finally {
      if (requestId === accessPassRequestRef.current) {
        setIsFetchingAccessPassHoldings(false);
      }
    }
  }, [config.endpoints.opensea, connectedAccount]);

  const fetchRedeemSupply = React.useCallback(async () => {
    const requestId = ++redeemSupplyRequestRef.current;
    setIsFetchingRedeemSupply(true);
    setRedeemSupplyNotice(null);

    try {
      const url = new URL(config.endpoints.openseaRedeemStats, window.location.origin);
      const data = await fetchJson<OpenSeaRedeemStatsResponse>(url.toString(), {
        cache: "no-store",
      });

      if (requestId !== redeemSupplyRequestRef.current) return;

      setRedeemSupply({
        animata: typeof data.animata === "number" ? data.animata : null,
        "regent-animata-ii":
          typeof data["regent-animata-ii"] === "number" ? data["regent-animata-ii"] : null,
      });
    } catch (error) {
      if (requestId !== redeemSupplyRequestRef.current) return;
      setRedeemSupply({
        animata: null,
        "regent-animata-ii": null,
      });
      setRedeemSupplyNotice({
        tone: "error",
        message: getErrorMessage(error, "Remaining Animata counts are unavailable right now."),
      });
    } finally {
      if (requestId === redeemSupplyRequestRef.current) {
        setIsFetchingRedeemSupply(false);
      }
    }
  }, [config.endpoints.openseaRedeemStats]);

  const ensureWallet = React.useCallback((): WalletSnapshot => {
    if (!walletClient || !connectedAccount) {
      throw new Error("Connect your wallet to continue.");
    }
    if (connectedChainId !== base.id) {
      throw new Error("Switch your wallet to Base to continue.");
    }
    return { wallet: walletClient, account: connectedAccount, chainId: connectedChainId };
  }, [connectedAccount, connectedChainId, walletClient]);

  const ensureNftApproval = React.useCallback(
    async (snapshot?: WalletSnapshot) => {
      const current = snapshot ?? ensureWallet();
      if (!current.wallet || !current.account) throw new Error("Connect your wallet first.");
      if (!redeemerAddress) throw new Error("Redeemer not configured.");

      const collection = source === "ANIMATA1" ? ANIMATA1 : ANIMATA2;
      const approved = (await publicClient.readContract({
        address: collection,
        abi: erc721Abi,
        functionName: "isApprovedForAll",
        args: [current.account, redeemerAddress],
      })) as boolean;

      setNftApproved(Boolean(approved));
      if (approved) return;

      setStatus("approving");
      try {
        const hash = await current.wallet.writeContract({
          address: collection,
          abi: erc721Abi,
          functionName: "setApprovalForAll",
          args: [redeemerAddress, true],
          account: current.account,
          chain: base,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setNftApproved(true);
      } finally {
        setStatus("idle");
      }
    },
    [ensureWallet, publicClient, redeemerAddress, source],
  );

  const approveUsdc = React.useCallback(async () => {
    setNotice(null);

    try {
      const current = ensureWallet();
      if (!current.wallet || !current.account) throw new Error("Connect your wallet first.");
      if (!redeemerAddress) throw new Error("Redeemer not configured.");

      setStatus("approving");
      const hash = await current.wallet.writeContract({
        address: USDC,
        abi: erc20Abi,
        functionName: "approve",
        args: [redeemerAddress, USDC_PRICE],
        account: current.account,
        chain: base,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setUsdcAllowanceOk(true);
      setNotice({ tone: "success", message: "USDC approval confirmed." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: getErrorMessage(error, "USDC approval failed."),
      });
    } finally {
      setStatus("idle");
    }
  }, [ensureWallet, publicClient, redeemerAddress]);

  const redeem = React.useCallback(async () => {
    setNotice(null);

    try {
      const current = ensureWallet();
      if (!current.wallet || !current.account) throw new Error("Wallet not ready.");
      if (!redeemerAddress) throw new Error("Redeemer not configured.");

      let beforeOutstanding: bigint | null = null;
      try {
        const [pool, released, claimed] = (await publicClient.readContract({
          address: redeemerAddress,
          abi: redeemerAbi,
          functionName: "getVest",
          args: [current.account],
          blockTag: "latest",
        })) as readonly [bigint, bigint, bigint, bigint];
        beforeOutstanding = pool + released - claimed;
      } catch {
        beforeOutstanding = null;
      }

      const parsedTokenId = BigInt(tokenId);
      if (parsedTokenId < 1n || parsedTokenId > 999n) {
        throw new Error("Token ID must be between 1 and 999.");
      }

      await ensureNftApproval(current);

      const allowance = (await publicClient.readContract({
        address: USDC,
        abi: erc20Abi,
        functionName: "allowance",
        args: [current.account, redeemerAddress],
      })) as bigint;
      if (allowance < USDC_PRICE) throw new Error("Approve 80 USDC first.");

      await publicClient.simulateContract({
        address: redeemerAddress,
        abi: redeemerAbi,
        functionName: "redeem",
        args: [source === "ANIMATA1" ? ANIMATA1 : ANIMATA2, parsedTokenId],
        account: current.account,
        chain: base,
      });

      setStatus("redeeming");
      const hash = await current.wallet.writeContract({
        address: redeemerAddress,
        abi: redeemerAbi,
        functionName: "redeem",
        args: [source === "ANIMATA1" ? ANIMATA1 : ANIMATA2, parsedTokenId],
        account: current.account,
        chain: base,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      void fetchHoldings();
      void fetchAccessPassHoldings();
      await refreshClaimable();

      try {
        let attempts = 0;
        let outstanding = 0n;
        while (attempts < 8) {
          const [pool, released, claimed] = (await publicClient.readContract({
            address: redeemerAddress,
            abi: redeemerAbi,
            functionName: "getVest",
            args: [current.account],
            blockTag: "latest",
          })) as readonly [bigint, bigint, bigint, bigint];
          outstanding = pool + released - claimed;
          if (
            beforeOutstanding === null ||
            outstanding >= beforeOutstanding + REGENT_PAYOUT
          ) {
            break;
          }
          attempts += 1;
          await sleep(1_000);
        }
        setSuccessTotal(outstanding < 0n ? 0n : outstanding);
      } catch {
        setSuccessTotal(null);
      }

      setShowSuccess(true);
      setNotice({ tone: "success", message: "Redeem confirmed on Base." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: getErrorMessage(error, "Redeem failed."),
      });
    } finally {
      setStatus("idle");
    }
  }, [
    ensureNftApproval,
    ensureWallet,
    fetchAccessPassHoldings,
    fetchHoldings,
    publicClient,
    redeemerAddress,
    refreshClaimable,
    source,
    tokenId,
  ]);

  const claimRegent = React.useCallback(async () => {
    setNotice(null);

    try {
      const current = ensureWallet();
      if (!current.wallet || !current.account) throw new Error("Wallet not ready.");
      if (!redeemerAddress) throw new Error("Redeemer not configured.");

      const claimableSnapshot = claimable ?? null;
      setStatus("claiming");

      const hash = await current.wallet.writeContract({
        address: redeemerAddress,
        abi: redeemerAbi,
        functionName: "claim",
        args: [],
        account: current.account,
        chain: base,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      await refreshClaimable();
      void fetchHoldings();
      void fetchAccessPassHoldings();
      setClaimSuccessAmount(claimableSnapshot);
      setShowClaimSuccess(true);
      setNotice({ tone: "success", message: "Claimed available REGENT." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: getErrorMessage(error, "Claim failed."),
      });
    } finally {
      setStatus("idle");
    }
  }, [
    claimable,
    ensureWallet,
    fetchAccessPassHoldings,
    fetchHoldings,
    publicClient,
    redeemerAddress,
    refreshClaimable,
  ]);

  React.useEffect(() => {
    void refreshClaimable();
  }, [refreshClaimable]);

  React.useEffect(() => {
    void refreshApprovals();
  }, [refreshApprovals]);

  React.useEffect(() => {
    setHoldings(null);
    setHoldingsFetched({ ANIMATA1: false, ANIMATA2: false });
    setOwnsSelectedToken(null);
  }, [connectedAccount]);

  React.useEffect(() => {
    setAccessPassHoldings(null);
    setAccessPassNotice(null);
  }, [connectedAccount]);

  React.useEffect(() => {
    if (!connectedAccount) return;
    void fetchHoldings();
  }, [connectedAccount, fetchHoldings, source]);

  React.useEffect(() => {
    if (!connectedAccount) return;
    void fetchAccessPassHoldings();
  }, [connectedAccount, fetchAccessPassHoldings]);

  React.useEffect(() => {
    void fetchRedeemSupply();
  }, [fetchRedeemSupply]);

  React.useEffect(() => {
    if (!connectedAccount) {
      setOwnsSelectedToken(null);
      return;
    }
    if (!/^\d+$/.test(tokenId)) {
      setOwnsSelectedToken(null);
      return;
    }

    const parsedTokenId = BigInt(tokenId);
    if (parsedTokenId < 1n || parsedTokenId > 999n) {
      setOwnsSelectedToken(null);
      return;
    }

    if (holdings && holdingsFetched[source]) {
      const numericTokenId = Number(tokenId);
      const ids = source === "ANIMATA1" ? holdings.animata1 : holdings.animata2;
      setOwnsSelectedToken(ids.includes(numericTokenId));
      return;
    }

    const requestId = ++ownershipRequestRef.current;
    setOwnsSelectedToken(null);

    void (async () => {
      try {
        const owner = (await publicClient.readContract({
          address: source === "ANIMATA1" ? ANIMATA1 : ANIMATA2,
          abi: [
            {
              type: "function",
              name: "ownerOf",
              stateMutability: "view",
              inputs: [{ name: "tokenId", type: "uint256" }],
              outputs: [{ name: "", type: "address" }],
            },
          ] as const,
          functionName: "ownerOf",
          args: [parsedTokenId],
        })) as `0x${string}`;

        if (requestId !== ownershipRequestRef.current) return;
        setOwnsSelectedToken(owner.toLowerCase() === connectedAccount.toLowerCase());
      } catch {
        if (requestId !== ownershipRequestRef.current) return;
        setOwnsSelectedToken(null);
      }
    })();
  }, [connectedAccount, holdings, holdingsFetched, publicClient, source, tokenId]);

  return (
    <section className="space-y-6 rounded-[1.75rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--card)_96%,var(--background)_4%)] p-6 shadow-[0_24px_70px_-48px_color-mix(in_oklch,var(--brand-ink)_55%,transparent)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
            Redeem
          </p>
          <h3 className="font-display text-2xl text-[color:var(--foreground)] sm:text-3xl">
            Redeem Animata Pass for $REGENT
          </h3>
          <p className="max-w-3xl text-sm leading-6 text-[color:var(--muted-foreground)]">
            Steps: Connect wallet on Base. Choose a token you own (or buy one) from{" "}
            <a
              href="https://opensea.io/collection/animata"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[color:var(--link-color)] underline decoration-[color:var(--link-underline)] underline-offset-3"
            >
              Animata Collection I
            </a>{" "}
            or{" "}
            <a
              href="https://opensea.io/collection/regent-animata-ii"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[color:var(--link-color)] underline decoration-[color:var(--link-underline)] underline-offset-3"
            >
              Animata Collection II
            </a>
            . Approve the Animata transfer, and approve 80 USDC transfer. Redeem your
            NFT with the USDC to receive 5 million $REGENT streamed over 7 days, as
            well as an{" "}
            <a
              href={REGENTS_CLUB_OPENSEA_BASE}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[color:var(--link-color)] underline decoration-[color:var(--link-underline)] underline-offset-3"
            >
              Animata membership
            </a>{" "}
            collectible.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {!connectedAccount ? (
            <span className="text-sm text-[color:var(--muted-foreground)]">
              Connect an account above to start redeeming.
            </span>
          ) : null}
          {connectedAccount && !isOnBase && wallet ? (
            <Button onClick={() => void switchToChain(wallet, base, config.baseRpcUrl)} tone="secondary">
              Switch to Base
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
        <SurfaceBlock title="Eligibility checklist">
          <ChecklistItem label="Wallet connected" status={Boolean(connectedAccount)} />
          <ChecklistItem
            label="On Base network"
            status={connectedAccount ? isOnBase : null}
            detail={connectedAccount && !isOnBase ? "Switch to Base" : undefined}
          />
          <ChecklistItem
            label={tokenIdValid ? "Owns selected token" : "Select a token ID"}
            status={ownsTokenStatus === null ? null : ownsTokenStatus}
            detail={
              tokenIdValid && ownsSelectedToken === false
                ? "Token not owned"
                : undefined
            }
          />
          <ChecklistItem
            label="Approvals ready"
            status={connectedAccount ? approvalsReady : null}
            detail={
              connectedAccount && !approvalsReady ? "Approve NFT and USDC" : undefined
            }
          />
          <ChecklistItem
            label="Redeemer configured"
            status={Boolean(redeemerAddress)}
            detail={!redeemerAddress ? "Missing redeemer address" : undefined}
          />
        </SurfaceBlock>

        <SurfaceBlock title="Select Animata Pass to Redeem">
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
            Price: 80 USDC. Receive 5M REGENT streamed over 7 days.
          </div>
          <div className="grid gap-4 pt-2 sm:grid-cols-[minmax(13.5rem,1.15fr)_minmax(0,0.85fr)]">
            <LabelBlock label="Source collection">
              <div className="relative min-w-0">
                <select
                  className="w-full min-w-0 appearance-none rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_84%,transparent)] px-4 py-3 pr-12 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--ring)]"
                  value={source}
                  onChange={(event) => setSource(event.currentTarget.value as SourceKey)}
                >
                  <option value="ANIMATA1">Animata I</option>
                  <option value="ANIMATA2">Animata II</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[color:var(--muted-foreground)]">
                  <svg viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-current">
                    <path
                      d="m4.25 6.5 3.75 3.75 3.75-3.75"
                      strokeWidth="1.5"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  </svg>
                </span>
              </div>
            </LabelBlock>

            <LabelBlock label="Token ID (1-999)">
              <input
                inputMode="numeric"
                disabled={!connectedAccount}
                className={classNames(
                  "w-full min-w-0 rounded-xl border bg-[color:color-mix(in_oklch,var(--background)_84%,transparent)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--ring)]",
                  tokenId.length > 0 && !tokenIdValid
                    ? "border-[color:#a6574f]"
                    : "border-[color:var(--border)]",
                  !connectedAccount && "cursor-not-allowed opacity-60",
                )}
                placeholder="123"
                value={tokenId}
                onChange={(event) => setTokenId(event.currentTarget.value.trim())}
              />
              {tokenId.length > 0 && !tokenIdValid ? (
                <p className="mt-2 text-sm text-[color:#a6574f]">
                  Enter a whole number from 1 to 999.
                </p>
              ) : null}
              {connectedAccount && ownsSelectedToken === false && tokenIdValid ? (
                <p className="mt-2 text-sm text-[color:#a6574f]">
                  That token is not owned by the connected wallet.
                </p>
              ) : null}
            </LabelBlock>
          </div>

          {connectedAccount ? (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_74%,transparent)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                    Your {source === "ANIMATA1" ? "Animata I" : "Animata II"} NFTs
                  </div>
                  <p className="text-sm text-[color:var(--muted-foreground)]">
                    Pick a chip or enter a token id manually.
                  </p>
                </div>
                <Button
                  disabled={isFetchingHoldings}
                  onClick={() => void fetchHoldings()}
                  tone="ghost"
                >
                  {isFetchingHoldings ? "Loading..." : "Refresh"}
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(source === "ANIMATA1" ? holdings?.animata1 : holdings?.animata2)?.length ? (
                  (source === "ANIMATA1" ? holdings?.animata1 : holdings?.animata2)?.map(
                    (id) => (
                      <button
                        key={`${source}-${id}`}
                        type="button"
                        className={classNames(
                          "rounded-full border px-3 py-1.5 text-sm transition",
                          tokenId === String(id)
                            ? "border-[color:var(--ring)] bg-[color:color-mix(in_oklch,var(--accent)_16%,transparent)]"
                            : "border-[color:var(--border)] hover:border-[color:var(--ring)]",
                        )}
                        onClick={() => setTokenId(String(id))}
                      >
                        #{id}
                      </button>
                    ),
                  )
                ) : (
                  <span className="text-sm text-[color:var(--muted-foreground)]">
                    {isFetchingHoldings ? "Loading holdings..." : "No tokens found for this collection."}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <ConnectHint message="Connect an account above to load holdings and redeem." />
          )}
        </SurfaceBlock>
      </div>

      {notice ? <InlineNotice notice={notice} /> : null}

      <SurfaceBlock title="Approvals and redemption">
        <div className="flex flex-wrap gap-3">
          {connectedAccount && !nftApproved ? (
            <Button
              disabled={status === "approving" || !redeemerAddress}
              onClick={() => void ensureNftApproval()}
              tone="secondary"
            >
              {status === "approving" ? "Approving NFT..." : "Approve NFT"}
            </Button>
          ) : null}

          {connectedAccount && !usdcAllowanceOk ? (
            <Button
              disabled={status === "approving" || !redeemerAddress}
              onClick={() => void approveUsdc()}
              tone="secondary"
            >
              {status === "approving" ? "Approving..." : "Approve 80 USDC"}
            </Button>
          ) : null}

          <Button
            disabled={
              !connectedAccount ||
              !tokenIdValid ||
              ownsSelectedToken === false ||
              !redeemerAddress ||
              status === "redeeming" ||
              status === "approving" ||
              !approvalsReady
            }
            onClick={() => void redeem()}
            tone="primary"
          >
            {status === "redeeming" ? "Confirming..." : "Redeem for REGENT"}
          </Button>
        </div>
      </SurfaceBlock>

      {connectedAccount ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <SurfaceBlock title="Claimable REGENT">
            <div className="space-y-3">
              <div className="font-display text-3xl text-[color:var(--foreground)] sm:text-4xl">
                {claimable !== null ? formatRegentRounded2(claimable) : "---"}
              </div>
              {remaining !== null && remaining > 0n ? (
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  Total remaining:{" "}
                  <span className="text-[color:var(--foreground)]">
                    {formatRegentRounded2(remaining)}
                  </span>
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={status !== "idle"}
                  onClick={() => void refreshClaimable()}
                  tone="ghost"
                >
                  Refresh
                </Button>
                <Button
                  disabled={status === "claiming" || !claimable || claimable === 0n}
                  onClick={() => void claimRegent()}
                  tone="primary"
                >
                  {status === "claiming" ? "Claiming..." : "Claim"}
                </Button>
              </div>
            </div>
          </SurfaceBlock>

          <SurfaceBlock title="Regent Animata Access Pass">
            <div className="flex flex-wrap items-start justify-end gap-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={isFetchingAccessPassHoldings}
                  onClick={() => void fetchAccessPassHoldings()}
                  tone="ghost"
                >
                  {isFetchingAccessPassHoldings ? "Loading..." : "Refresh"}
                </Button>
                <ActionLink href={REGENTS_CLUB_OPENSEA_BASE} label="OpenSea" />
              </div>
            </div>

            {accessPassNotice ? <InlineNotice notice={accessPassNotice} className="mt-4" /> : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {accessPassHoldings === null ? (
                <span className="text-sm text-[color:var(--muted-foreground)]">
                  {isFetchingAccessPassHoldings ? "Loading..." : "Holdings not loaded yet."}
                </span>
              ) : accessPassHoldings.length === 0 ? (
                <span className="text-sm text-[color:var(--muted-foreground)]">
                  No access passes found.
                </span>
              ) : (
                accessPassHoldings.map((id) => (
                  <a
                    key={`animata-pass-${id}`}
                    href={`${REGENTS_CLUB_OPENSEA_BASE}/${id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-sm"
                  >
                    #{id}
                  </a>
                ))
              )}
            </div>
          </SurfaceBlock>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_78%,transparent)] px-4 py-3 text-sm text-[color:var(--muted-foreground)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p>
              Remaining Animata I to Redeem:{" "}
              <span className="text-[color:var(--foreground)]">
                {redeemSupply.animata !== null
                  ? formatCount(redeemSupply.animata)
                  : isFetchingRedeemSupply
                    ? "Loading..."
                    : "--"}
              </span>
            </p>
            <p>
              Remaining Animata II to Redeem:{" "}
              <span className="text-[color:var(--foreground)]">
                {redeemSupply["regent-animata-ii"] !== null
                  ? formatCount(redeemSupply["regent-animata-ii"])
                  : isFetchingRedeemSupply
                    ? "Loading..."
                    : "--"}
              </span>
            </p>
          </div>
        </div>
        {redeemSupplyNotice ? <InlineNotice notice={redeemSupplyNotice} /> : null}
      </div>

      <div className="text-center text-xs text-[color:var(--muted-foreground)]">
        {redeemerAddress ? (
          <>Redeemer: {redeemerAddress}</>
        ) : (
          <>Set `VITE_NEXT_PUBLIC_REDEEMER_ADDRESS` to enable redemption.</>
        )}
      </div>

      {showSuccess ? (
        <OverlayCard
          title="Redeem confirmed"
          onClose={() => {
            void fetchHoldings();
            void fetchAccessPassHoldings();
            setShowSuccess(false);
          }}
        >
          <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
            You now have{" "}
            <span className="text-[color:var(--foreground)]">
              {successTotal !== null ? formatRegentRounded2(successTotal) : "---"} REGENT
            </span>{" "}
            streaming over 7 days. Claim any part of your unlocked amount early, and
            after 7 days the full amount is available to claim.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              onClick={() => {
                void fetchHoldings();
                void fetchAccessPassHoldings();
                setShowSuccess(false);
              }}
              tone="secondary"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                void refreshClaimable();
                void fetchHoldings();
                void fetchAccessPassHoldings();
                setShowSuccess(false);
              }}
              tone="primary"
            >
              Check claimable
            </Button>
          </div>
        </OverlayCard>
      ) : null}

      {showClaimSuccess ? (
        <OverlayCard
          title="Claim confirmed"
          onClose={() => {
            void refreshClaimable();
            void fetchHoldings();
            void fetchAccessPassHoldings();
            setShowClaimSuccess(false);
          }}
        >
          <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
            You claimed{" "}
            <span className="text-[color:var(--foreground)]">
              {claimSuccessAmount !== null
                ? formatRegentRounded2(claimSuccessAmount)
                : "---"}{" "}
              REGENT
            </span>
            . The remainder of the stream unlocks after 7 days.
          </p>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => {
                void refreshClaimable();
                void fetchHoldings();
                void fetchAccessPassHoldings();
                setShowClaimSuccess(false);
              }}
              tone="primary"
            >
              Close
            </Button>
          </div>
        </OverlayCard>
      ) : null}
    </section>
  );
}

function NamesSection({
  config,
  account,
  chainId,
  wallet,
  walletClient,
  authenticated,
  privyReady,
  onConnect,
}: {
  config: DashboardConfig;
  account: `0x${string}` | null;
  chainId: number | null;
  wallet: PrivyEthereumWalletLike | null;
  walletClient: WalletClient | null;
  authenticated: boolean;
  privyReady: boolean;
  onConnect: () => void;
}) {
  const [basenamesConfig, setBasenamesConfig] =
    React.useState<BasenamesConfigResponse | null>(null);
  const [configNotice, setConfigNotice] = React.useState<Notice | null>(null);
  const [allowance, setAllowance] = React.useState<AllowanceResponse | null>(null);
  const [allowanceNotice, setAllowanceNotice] = React.useState<Notice | null>(null);
  const [ownedNames, setOwnedNames] = React.useState<OwnedNamesResponse["names"]>([]);
  const [ownedNamesNotice, setOwnedNamesNotice] = React.useState<Notice | null>(null);
  const [recentNames, setRecentNames] = React.useState<RecentNamesResponse["names"]>([]);
  const [recentNamesNotice, setRecentNamesNotice] = React.useState<Notice | null>(null);
  const [notice, setNotice] = React.useState<Notice | null>(null);
  const [phase1Label, setPhase1Label] = React.useState("");
  const [phase2Label, setPhase2Label] = React.useState("");
  const [phase1ConfirmOpen, setPhase1ConfirmOpen] = React.useState(false);
  const [claimDialog, setClaimDialog] = React.useState<ClaimDialogState>({
    open: false,
    status: "pending",
    fqdn: null,
    ensFqdn: null,
    paymentTxHash: null,
  });
  const [mintStatus, setMintStatus] = React.useState<"idle" | "free" | "paid">("idle");
  const [copiedName, setCopiedName] = React.useState<string | null>(null);
  const signatureCacheRef = React.useRef<{
    signature: `0x${string}`;
    timestamp: number;
    fqdn: string;
    label: string;
    address: string;
  } | null>(null);
  const freeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const paidButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const phase1InputRef = React.useRef<HTMLInputElement | null>(null);
  const phase2InputRef = React.useRef<HTMLInputElement | null>(null);
  const hasPulsedFreeRef = React.useRef(false);
  const hasPulsedPaidRef = React.useRef(false);
  const basenamesConfigRequestRef = React.useRef(0);
  const allowanceRequestRef = React.useRef(0);
  const ownedNamesRequestRef = React.useRef(0);
  const recentNamesRequestRef = React.useRef(0);
  const claimDialogDismissedRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      invalidateTrackedRequests(basenamesConfigRequestRef);
      invalidateTrackedRequests(allowanceRequestRef);
      invalidateTrackedRequests(ownedNamesRequestRef);
      invalidateTrackedRequests(recentNamesRequestRef);
    };
  }, []);

  const loadBasenamesConfig = React.useCallback(async () => {
    const requestId = startTrackedRequest(basenamesConfigRequestRef);

    try {
      const nextConfig = await fetchJson<BasenamesConfigResponse>(
        config.endpoints.basenamesConfig,
      );
      if (!isTrackedRequestCurrent(basenamesConfigRequestRef, requestId)) return;
      setBasenamesConfig(nextConfig);
      setConfigNotice(null);
    } catch (error) {
      if (!isTrackedRequestCurrent(basenamesConfigRequestRef, requestId)) return;
      setConfigNotice({
        tone: "error",
        message: getErrorMessage(error, "Basenames configuration is unavailable."),
      });
    }
  }, [config.endpoints.basenamesConfig]);

  React.useEffect(() => {
    void loadBasenamesConfig();
  }, [loadBasenamesConfig]);

  const parentName = basenamesConfig?.parentName ?? "agent.base.eth";
  const ensParentName = basenamesConfig?.ensParentName ?? "regent.eth";

  const phase1State = useNameAvailability({
    label: phase1Label,
    parentName,
    ensParentName,
    endpoint: config.endpoints.basenamesAvailability,
  });
  const phase2State = useNameAvailability({
    label: phase2Label,
    parentName,
    ensParentName,
    endpoint: config.endpoints.basenamesAvailability,
  });

  const loadAllowance = React.useCallback(async () => {
    const requestId = startTrackedRequest(allowanceRequestRef);

    if (!account) {
      setAllowance(null);
      setAllowanceNotice(null);
      return;
    }

    try {
      const url = new URL(config.endpoints.basenamesAllowance, window.location.origin);
      url.searchParams.set("address", account);

      const nextAllowance = await fetchJson<AllowanceResponse>(url.toString());
      if (!isTrackedRequestCurrent(allowanceRequestRef, requestId)) return;
      setAllowance(nextAllowance);
      setAllowanceNotice(null);
    } catch (error) {
      if (!isTrackedRequestCurrent(allowanceRequestRef, requestId)) return;
      setAllowance(null);
      setAllowanceNotice({
        tone: "error",
        message: getErrorMessage(error, "Allowlist lookup failed."),
      });
    }
  }, [account, config.endpoints.basenamesAllowance]);

  const loadOwnedNames = React.useCallback(async () => {
    const requestId = startTrackedRequest(ownedNamesRequestRef);

    if (!account) {
      setOwnedNames([]);
      setOwnedNamesNotice(null);
      return;
    }

    try {
      const url = new URL(config.endpoints.basenamesOwned, window.location.origin);
      url.searchParams.set("address", account);

      const payload = await fetchJson<OwnedNamesResponse>(url.toString());
      if (!isTrackedRequestCurrent(ownedNamesRequestRef, requestId)) return;
      setOwnedNames(payload.names ?? []);
      setOwnedNamesNotice(null);
    } catch (error) {
      if (!isTrackedRequestCurrent(ownedNamesRequestRef, requestId)) return;
      setOwnedNames([]);
      setOwnedNamesNotice({
        tone: "error",
        message: getErrorMessage(error, "Owned names lookup failed."),
      });
    }
  }, [account, config.endpoints.basenamesOwned]);

  const loadRecentNames = React.useCallback(async () => {
    const requestId = startTrackedRequest(recentNamesRequestRef);

    try {
      const url = new URL(config.endpoints.basenamesRecent, window.location.origin);
      url.searchParams.set("limit", "15");
      const payload = await fetchJson<RecentNamesResponse>(url.toString());
      if (!isTrackedRequestCurrent(recentNamesRequestRef, requestId)) return;
      setRecentNames(payload.names ?? []);
      setRecentNamesNotice(null);
    } catch (error) {
      if (!isTrackedRequestCurrent(recentNamesRequestRef, requestId)) return;
      setRecentNames([]);
      setRecentNamesNotice({
        tone: "error",
        message: getErrorMessage(error, "Recent names lookup failed."),
      });
    }
  }, [config.endpoints.basenamesRecent]);

  React.useEffect(() => {
    void loadAllowance();
  }, [loadAllowance]);

  React.useEffect(() => {
    void loadOwnedNames();
  }, [loadOwnedNames]);

  React.useEffect(() => {
    void loadRecentNames();
    const id = window.setInterval(() => {
      void loadRecentNames();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [loadRecentNames]);

  const priceWei = React.useMemo(() => {
    const raw = basenamesConfig?.priceWei ?? "2500000000000000";
    try {
      return BigInt(raw);
    } catch {
      return 2_500_000_000_000_000n;
    }
  }, [basenamesConfig?.priceWei]);

  const paymentRecipient = React.useMemo(
    () => normalizePaymentRecipient(basenamesConfig?.paymentRecipient),
    [basenamesConfig?.paymentRecipient],
  );
  const isOnEthereum = chainId === mainnet.id;
  const isOnBase = chainId === base.id;
  const isOnPaymentChain = isOnBase || isOnEthereum;
  const hasPaymentRecipient = Boolean(paymentRecipient);
  const canFreeMint = (allowance?.freeMintsRemaining ?? 0) > 0;
  const freeMintsUsed = allowance?.freeMintsUsed ?? 0;
  const freeMintsRemaining = allowance?.freeMintsRemaining ?? 0;
  const snapshotTotal = allowance?.snapshotTotal ?? 0;
  const isPhase1Eligible = snapshotTotal > 0;
  const showPhase1Picker = Boolean(account) && canFreeMint;
  const hasOwnedNames = ownedNames.length > 0;
  const renderedOwnedNames = React.useMemo(
    () =>
      ownedNames.map((item) => ({
        ...item,
        displayFqdn: item.ensFqdn ?? toSubnameFqdn(item.label, ensParentName),
      })),
    [ensParentName, ownedNames],
  );
  const freeCtaReady =
    Boolean(account && walletClient) &&
    phase1State.validation.isValid &&
    !phase1State.isChecking &&
    phase1State.isAvailable !== false &&
    canFreeMint &&
    mintStatus === "idle";
  const paidCtaReady =
    Boolean(account && walletClient) &&
    isOnPaymentChain &&
    phase2State.validation.isValid &&
    !phase2State.isChecking &&
    phase2State.isAvailable !== false &&
    mintStatus === "idle" &&
    hasPaymentRecipient;
  const canPhase1Claim = freeCtaReady && isPhase1Eligible;
  const canPhase2Mint = paidCtaReady;

  useShakeOnInvalid(phase1InputRef, phase1State.isLabelInvalid);
  useShakeOnInvalid(phase2InputRef, phase2State.isLabelInvalid);

  React.useEffect(() => {
    if (!freeCtaReady) {
      hasPulsedFreeRef.current = false;
      return;
    }
    if (!freeButtonRef.current || hasPulsedFreeRef.current || prefersReducedMotion()) {
      return;
    }

    animate(freeButtonRef.current, {
      scale: [1, 1.03, 1],
      duration: 420,
      ease: "inOutSine",
    });
    hasPulsedFreeRef.current = true;
  }, [freeCtaReady]);

  React.useEffect(() => {
    if (!paidCtaReady) {
      hasPulsedPaidRef.current = false;
      return;
    }
    if (!paidButtonRef.current || hasPulsedPaidRef.current || prefersReducedMotion()) {
      return;
    }

    animate(paidButtonRef.current, {
      scale: [1, 1.03, 1],
      duration: 420,
      ease: "inOutSine",
    });
    hasPulsedPaidRef.current = true;
  }, [paidCtaReady]);

  React.useEffect(() => {
    if (!copiedName) return;
    const id = window.setTimeout(() => setCopiedName(null), 1_500);
    return () => window.clearTimeout(id);
  }, [copiedName]);

  const reloadNamesData = React.useCallback(async () => {
    await Promise.all([
      loadAllowance(),
      loadOwnedNames(),
      loadRecentNames(),
      loadBasenamesConfig(),
    ]);
    phase1State.refresh();
    phase2State.refresh();
  }, [
    loadAllowance,
    loadBasenamesConfig,
    loadOwnedNames,
    loadRecentNames,
    phase1State,
    phase2State,
  ]);

  const resetClaimDialog = React.useCallback(() => {
    setClaimDialog({
      open: false,
      status: "pending",
      fqdn: null,
      ensFqdn: null,
      paymentTxHash: null,
    });
  }, []);

  const finalizeMintSuccess = React.useCallback(
    async (result: MintResponse) => {
      setNotice({
        tone: "success",
        message: `Claimed ${result.fqdn}.`,
      });
      if (!claimDialogDismissedRef.current) {
        setClaimDialog({
          open: true,
          status: "success",
          fqdn: result.fqdn,
          ensFqdn: result.ensFqdn ?? null,
          paymentTxHash: null,
        });
      }
      claimDialogDismissedRef.current = false;
      await reloadNamesData();
    },
    [reloadNamesData],
  );

  const closeClaimDialog = React.useCallback(() => {
    if (!claimDialog.open) return;

    const isPending = claimDialog.status === "pending";
    const paymentTxHash = claimDialog.paymentTxHash;

    claimDialogDismissedRef.current = isPending;
    resetClaimDialog();

    if (!isPending) return;

    void attemptWalletCancel({ wallet, txHash: paymentTxHash }).then((result) => {
      if (result === "unsupported" || result === "unavailable") {
        setNotice({
          tone: "info",
          message:
            "Closed the claim window. If your wallet still shows a pending action, cancel it there.",
        });
      }
    });
  }, [
    claimDialog.open,
    claimDialog.paymentTxHash,
    claimDialog.status,
    resetClaimDialog,
    wallet,
  ]);

  const mintName = React.useCallback(
    async (
      state: NameAvailabilityState,
      options: {
        paymentTxHash?: `0x${string}`;
        paymentChainId?: number;
      } = {},
    ): Promise<MintResponse> => {
      if (!account || !walletClient) throw new Error("Connect a wallet first.");
      if (state.isReservedLabel) throw new Error("That name is reserved.");
      if (!state.fqdn || !state.validation.isValid) throw new Error("Enter a valid name.");

      const timestamp = Date.now();
      const message = createMintMessage(account, state.fqdn, base.id, timestamp);
      const signature = await walletClient.signMessage({ account, message });

      return fetchJson<MintResponse>(config.endpoints.basenamesMint, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          address: account,
          label: state.validation.normalizedLabel,
          signature,
          timestamp,
          paymentTxHash: options.paymentTxHash,
          paymentChainId: options.paymentChainId,
        }),
      });
    },
    [account, config.endpoints.basenamesMint, walletClient],
  );

  const performFreeClaim = React.useCallback(async () => {
    if (!canPhase1Claim) return;
    claimDialogDismissedRef.current = false;
    setNotice(null);
    setPhase1ConfirmOpen(false);
    setMintStatus("free");
    setClaimDialog({
      open: true,
      status: "pending",
      fqdn: phase1State.fqdn,
      ensFqdn: phase1State.ensFqdn,
      paymentTxHash: null,
    });

    try {
      const result = await mintName(phase1State);
      setPhase1Label("");
      await finalizeMintSuccess(result);
    } catch (error) {
      resetClaimDialog();
      setNotice({
        tone: "error",
        message: isUserRejectionError(error)
          ? "Claim cancelled."
          : getErrorMessage(error, "Free claim failed."),
      });
    } finally {
      setMintStatus("idle");
    }
  }, [canPhase1Claim, finalizeMintSuccess, mintName, phase1State]);

  const performPaidClaim = React.useCallback(async () => {
    if (!account || !walletClient) {
      setNotice({ tone: "error", message: "Connect a wallet first." });
      return;
    }
    if (!canPhase2Mint) return;
    if (!paymentRecipient) {
      setNotice({ tone: "error", message: "Paid claims are not configured yet." });
      return;
    }

    claimDialogDismissedRef.current = false;
    setNotice(null);
    setMintStatus("paid");
    setClaimDialog({
      open: true,
      status: "pending",
      fqdn: phase2State.fqdn,
      ensFqdn: phase2State.ensFqdn,
      paymentTxHash: null,
    });

    try {
      const paymentChain = isOnEthereum ? mainnet : base;
      const normalizedLabel = phase2State.validation.normalizedLabel;

      let signature: `0x${string}`;
      let timestamp: number;
      const cached = signatureCacheRef.current;
      if (
        cached &&
        cached.fqdn === phase2State.fqdn &&
        cached.label === normalizedLabel &&
        cached.address.toLowerCase() === account.toLowerCase() &&
        Date.now() - cached.timestamp < 60 * 60 * 1_000
      ) {
        signature = cached.signature;
        timestamp = cached.timestamp;
      } else {
        timestamp = Date.now();
        const message = createMintMessage(account, phase2State.fqdn ?? "", base.id, timestamp);
        signature = await walletClient.signMessage({ account, message });
        signatureCacheRef.current = {
          signature,
          timestamp,
          fqdn: phase2State.fqdn ?? "",
          label: normalizedLabel,
          address: account,
        };
      }

      const txHash = await walletClient.sendTransaction({
        account,
        chain: paymentChain,
        to: paymentRecipient,
        value: priceWei,
      });
      setClaimDialog((current) => ({ ...current, paymentTxHash: txHash }));

      const paymentClient = createPublicClient({
        chain: paymentChain,
        transport: http(paymentChain.id === base.id ? config.baseRpcUrl ?? undefined : undefined),
      });

      const receipt = await paymentClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: PAYMENT_RECEIPT_TIMEOUT_MS,
      });
      if (receipt.status !== "success") throw new Error("Payment transaction reverted.");

      const result = await fetchJson<MintResponse>(config.endpoints.basenamesMint, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          address: account,
          label: normalizedLabel,
          signature,
          timestamp,
          paymentTxHash: txHash,
          paymentChainId: paymentChain.id,
        }),
      });

      signatureCacheRef.current = null;
      setPhase2Label("");
      await finalizeMintSuccess(result);
    } catch (error) {
      resetClaimDialog();
      setNotice({
        tone: "error",
        message: isUserRejectionError(error)
          ? "Transaction cancelled."
          : isReceiptTimeoutError(error)
            ? "Payment confirmation timed out. Check your wallet activity and try again."
            : getErrorMessage(error, "Paid claim failed."),
      });
    } finally {
      setMintStatus("idle");
    }
  }, [
    account,
    canPhase2Mint,
    config.baseRpcUrl,
    config.endpoints.basenamesMint,
    finalizeMintSuccess,
    isOnEthereum,
    paymentRecipient,
    phase2State,
    priceWei,
    resetClaimDialog,
    walletClient,
  ]);

  const phase2DisabledReason = React.useMemo(() => {
    if (mintStatus === "paid" || canPhase2Mint) return null;
    if (!account) return "Connect a wallet to claim.";
    if (!walletClient) return "Preparing your wallet signer...";
    if (!isOnPaymentChain) return "Switch to Base or Ethereum to pay.";
    if (!hasPaymentRecipient) return "Paid claims are temporarily unavailable.";
    if (!phase2Label.trim()) return "Enter a name to continue.";
    if (!phase2State.validation.isValid) {
      return phase2State.labelError ?? "Enter a valid name.";
    }
    if (phase2State.isChecking) return "Checking name availability...";
    if (phase2State.isAvailable === false) return "That name is already taken.";
    return null;
  }, [
    account,
    canPhase2Mint,
    hasPaymentRecipient,
    isOnPaymentChain,
    mintStatus,
    phase2Label,
    phase2State.isAvailable,
    phase2State.isChecking,
    phase2State.labelError,
    phase2State.validation.isValid,
    walletClient,
  ]);

  return (
    <section className="space-y-6 rounded-[1.75rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--card)_96%,var(--background)_4%)] p-6 shadow-[0_24px_70px_-48px_color-mix(in_oklch,var(--brand-ink)_55%,transparent)]">
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted-foreground)]">
          Name Claim
        </p>
        <h3 className="font-display text-2xl text-[color:var(--foreground)] sm:text-3xl">
          Claim your Regent identity
        </h3>
        <p className="max-w-3xl text-sm leading-6 text-[color:var(--muted-foreground)]">
          Claim a Regent subname on Ethereum ENS for 0.0025 eth. These can be used by
          your agent within the Techtree and Autolaunch apps, and display as a unique
          color.
        </p>
      </div>

      {configNotice ? <InlineNotice notice={configNotice} /> : null}
      {notice ? <InlineNotice notice={notice} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <SurfaceBlock title="Claimed names" className="lg:col-span-2">
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
              A Regent agent can change its identity later. Any claimed name can be
              swapped onto any Regent you create.
            </p>

            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                Latest subnames registered
              </div>
              {recentNamesNotice ? <InlineNotice notice={recentNamesNotice} /> : null}
              <div className="flex flex-wrap gap-2">
                {recentNames.length ? (
                  recentNames.map((item) => (
                    <span
                      key={item.fqdn}
                      className="rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_74%,transparent)] px-3 py-1.5 text-sm"
                    >
                      {item.label}.{ensParentName}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[color:var(--muted-foreground)]">
                    No recent names yet.
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-[color:var(--border)] pt-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                My identities
              </div>
              {ownedNamesNotice ? <InlineNotice notice={ownedNamesNotice} className="mt-3" /> : null}
              {account ? (
                hasOwnedNames ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {renderedOwnedNames.map((item) => (
                      <div
                        key={item.fqdn}
                        className="min-w-[11rem] rounded-2xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_74%,transparent)] px-4 py-3"
                      >
                        <div className="font-display text-lg text-[color:var(--foreground)]">
                          {item.label}.
                        </div>
                        <div className="mt-1 break-all text-xs text-[color:var(--muted-foreground)]">
                          {item.displayFqdn}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            onClick={() =>
                              void copyText(item.displayFqdn).then(() => setCopiedName(item.displayFqdn))
                            }
                            tone="ghost"
                          >
                            {copiedName === item.displayFqdn ? "Copied" : "Copy"}
                          </Button>
                          {item.ensFqdn ? (
                            <ActionLink
                              href={`https://app.ens.domains/name/${item.ensFqdn}`}
                              label="ENS"
                            />
                          ) : null}
                          {item.ensTxHash ? (
                            <ActionLink
                              href={`https://etherscan.io/tx/${item.ensTxHash}`}
                              label="Tx"
                            />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-[color:var(--muted-foreground)]">
                    No names claimed yet.
                  </div>
                )
              ) : (
                <ConnectHint message="Connect an account above to view your claimed names." />
              )}
            </div>
          </div>
        </SurfaceBlock>

        <SurfaceBlock title="Phase 1: Animata Snapshot" className="lg:col-span-2">
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <MetricTile
                label="Claims remaining"
                value={String(freeMintsRemaining)}
                copy="Still available to this wallet"
              />
              <MetricTile label="Used" value={String(freeMintsUsed)} copy="Already consumed" />
              <MetricTile
                label="Snapshot total"
                value={String(snapshotTotal)}
                copy="Original allocation"
              />
            </div>

            {allowanceNotice ? <InlineNotice notice={allowanceNotice} /> : null}
            {!account ? (
              <ConnectHint message="Connect an account above to check free-claim eligibility." />
            ) : !isPhase1Eligible ? (
              <p className="text-sm text-[color:var(--muted-foreground)]">
                This wallet is not on the Phase 1 allowlist.
              </p>
            ) : null}

            {showPhase1Picker ? (
              <>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                    <span className="rounded-full border border-[color:var(--border)] px-3 py-1">1. Pick name</span>
                    <span className="rounded-full border border-[color:var(--border)] px-3 py-1">2. Check availability</span>
                    <span className="rounded-full border border-[color:var(--border)] px-3 py-1">3. Sign and claim</span>
                  </div>

                  <input
                    ref={phase1InputRef}
                    value={phase1Label}
                    onChange={(event) => setPhase1Label(event.currentTarget.value)}
                    placeholder="alice"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full max-w-md rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_84%,transparent)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--ring)]"
                  />

                  {phase1State.isLabelInvalid && phase1State.labelError ? (
                    <p className="text-sm text-[color:#a6574f]">{phase1State.labelError}</p>
                  ) : null}

                  <AvailabilityBadges state={phase1State} />
                </div>

                <Button
                  ref={freeButtonRef}
                  disabled={!canPhase1Claim}
                  onClick={() => setPhase1ConfirmOpen(true)}
                  tone="primary"
                >
                  {mintStatus === "free"
                    ? "Claiming..."
                    : "Claim free ENS and Basename"}
                </Button>
              </>
            ) : account && isPhase1Eligible ? (
              <p className="text-sm text-[color:var(--muted-foreground)]">
                This wallet has already used its full Phase 1 allocation.
              </p>
            ) : null}
          </div>
        </SurfaceBlock>

        <SurfaceBlock title="Phase 2 (Public)" className="lg:col-span-2">
          <div className="space-y-5">
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Price:{" "}
              <span className="text-[color:var(--foreground)]">{formatEthFromWei(priceWei)}</span>
            </p>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                <span className="rounded-full border border-[color:var(--border)] px-3 py-1">1. Pick name</span>
                <span className="rounded-full border border-[color:var(--border)] px-3 py-1">2. Check availability</span>
                <span className="rounded-full border border-[color:var(--border)] px-3 py-1">3. Pay and claim</span>
              </div>

              <input
                ref={phase2InputRef}
                value={phase2Label}
                onChange={(event) => setPhase2Label(event.currentTarget.value)}
                placeholder="alice"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full max-w-md rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_84%,transparent)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--ring)]"
              />

              {phase2State.isLabelInvalid && phase2State.labelError ? (
                <p className="text-sm text-[color:#a6574f]">{phase2State.labelError}</p>
              ) : null}

              <AvailabilityBadges state={phase2State} />
            </div>

            <Button
              ref={paidButtonRef}
              disabled={!canPhase2Mint}
              onClick={() => void performPaidClaim()}
              tone="secondary"
            >
              {mintStatus === "paid"
                ? "Paying..."
                : `Pay ${formatEthFromWei(priceWei)} and claim`}
            </Button>

            {!canPhase2Mint && phase2DisabledReason ? (
              <p className="text-sm text-[color:var(--muted-foreground)]">
                {phase2DisabledReason}
              </p>
            ) : null}
          </div>
        </SurfaceBlock>
      </div>

      {phase1ConfirmOpen ? (
        <OverlayCard
          title="Confirm Phase 1 claim"
          onClose={() => {
            if (mintStatus !== "idle") return;
            setPhase1ConfirmOpen(false);
          }}
        >
          <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
            You are claiming{" "}
            <span className="text-[color:var(--foreground)]">{phase1State.fqdn}</span> and{" "}
            <span className="text-[color:var(--foreground)]">{phase1State.ensFqdn}</span>.
            You can assign this identity to any Regent later.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              disabled={mintStatus !== "idle"}
              onClick={() => setPhase1ConfirmOpen(false)}
              tone="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={!canPhase1Claim || mintStatus !== "idle"}
              onClick={() => void performFreeClaim()}
              tone="primary"
            >
              {mintStatus === "free" ? "Claiming..." : "Confirm claim"}
            </Button>
          </div>
        </OverlayCard>
      ) : null}

      {claimDialog.open ? (
        <OverlayCard
          title={claimDialog.status === "success" ? "Success" : "Claiming your subname"}
          onClose={closeClaimDialog}
        >
          {claimDialog.status === "success" ? (
            <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
              You now own{" "}
              <span className="text-[color:var(--foreground)]">
                {claimDialog.ensFqdn ?? claimDialog.fqdn}
              </span>{" "}
              and{" "}
              <span className="text-[color:var(--foreground)]">
                {claimDialog.fqdn}
              </span>
              . These stay ready for Regent identity assignment later.
            </p>
          ) : (
            <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
              Finalizing{" "}
              <span className="text-[color:var(--foreground)]">
                {claimDialog.ensFqdn ?? claimDialog.fqdn ?? "your subname"}
              </span>
              . This can take a moment.
            </p>
          )}

          {claimDialog.status === "success" ? (
            <div className="mt-6 flex justify-end">
              <Button onClick={closeClaimDialog} tone="primary">
                Continue
              </Button>
            </div>
          ) : null}
        </OverlayCard>
      ) : null}
    </section>
  );
}

function AvailabilityBadges({ state }: { state: NameAvailabilityState }) {
  if (!state.validation.isValid) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {state.isReservedLabel ? <Pill tone="error">Reserved</Pill> : null}
      {!state.isReservedLabel && state.isChecking ? <Pill tone="muted">Checking...</Pill> : null}
      {!state.isReservedLabel && state.isAvailable === true ? (
        <Pill tone="success">Available</Pill>
      ) : null}
      {!state.isReservedLabel && state.isAvailable === false ? (
        <Pill tone="error">Taken</Pill>
      ) : null}
      {state.ensFqdn ? <Pill tone="outline">{state.ensFqdn}</Pill> : null}
    </div>
  );
}

function ChecklistItem({
  label,
  status,
  detail,
}: {
  label: string;
  status: boolean | null;
  detail?: string;
}) {
  const isMet = status === true;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_94%,var(--card)_6%)] px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={classNames(
            "inline-block h-3.5 w-3.5 rounded-full border transition",
            isMet
              ? "border-[color:var(--positive)] bg-[color:var(--positive)] shadow-[0_0_12px_color-mix(in_oklch,var(--positive)_70%,transparent)]"
              : "border-[color:var(--muted-foreground)] bg-transparent",
          )}
        >
        </span>
        <span>{label}</span>
      </div>
      {detail ? (
        <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
          {detail}
        </span>
      ) : null}
    </div>
  );
}

function SurfaceBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={classNames("rounded-[1.5rem] border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_94%,var(--card)_6%)] p-5", className)}>
      <div className="mb-4">
        <h4 className="font-display text-xl text-[color:var(--foreground)]">{title}</h4>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  copy,
}: {
  label: string;
  value: string;
  copy: string;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_94%,var(--card)_6%)] p-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
        {label}
      </div>
      <div className="font-display mt-3 break-all text-2xl text-[color:var(--foreground)]">
        {value}
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">{copy}</p>
    </div>
  );
}

function ConnectHint({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_94%,var(--card)_6%)] p-4">
      <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">{message}</p>
    </div>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--foreground)] transition hover:border-[color:var(--ring)]"
    >
      {label}
    </a>
  );
}

const buttonBase =
  "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50";

const buttonTones: Record<"primary" | "secondary" | "ghost", string> = {
  primary:
    "border-[color:var(--button-primary-bg)] bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-fg)] hover:opacity-90",
  secondary:
    "border-[color:var(--border)] bg-[color:var(--button-secondary-bg)] text-[color:var(--foreground)] hover:border-[color:var(--ring)]",
  ghost:
    "border-[color:var(--border)] bg-transparent text-[color:var(--foreground)] hover:border-[color:var(--ring)]",
};

const Button = React.forwardRef<HTMLButtonElement, {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone: "primary" | "secondary" | "ghost";
}>(({ children, onClick, disabled, tone }, ref) => (
  <button
    ref={ref}
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={classNames(buttonBase, buttonTones[tone])}
  >
    {children}
  </button>
));

Button.displayName = "Button";

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "error" | "muted" | "outline";
}) {
  const toneClass =
    tone === "success"
      ? "border-[color:color-mix(in_oklch,var(--positive)_60%,var(--border)_40%)] bg-[color:color-mix(in_oklch,var(--positive)_14%,transparent)]"
      : tone === "error"
        ? "border-[color:#a6574f] bg-[color:color-mix(in_oklch,#a6574f_12%,transparent)]"
        : tone === "muted"
          ? "border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_74%,transparent)]"
          : "border-[color:var(--border)]";

  return (
    <span
      className={classNames(
        "rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] text-[color:var(--foreground)]",
        toneClass,
      )}
    >
      {children}
    </span>
  );
}

function InlineNotice({
  notice,
  className,
}: {
  notice: Notice;
  className?: string;
}) {
  const toneClass =
    notice.tone === "error"
      ? "border-[color:#a6574f] bg-[color:color-mix(in_oklch,#a6574f_12%,transparent)]"
      : notice.tone === "success"
        ? "border-[color:color-mix(in_oklch,var(--positive)_60%,var(--border)_40%)] bg-[color:color-mix(in_oklch,var(--positive)_14%,transparent)]"
        : "border-[color:var(--border)] bg-[color:color-mix(in_oklch,var(--background)_74%,transparent)]";

  return (
    <div
      className={classNames(
        "rounded-2xl border px-4 py-3 text-sm leading-6 text-[color:var(--foreground)]",
        toneClass,
        className,
      )}
    >
      {notice.message}
    </div>
  );
}

function OverlayCard({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const backdropRef = React.useRef<HTMLDivElement | null>(null);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!backdropRef.current || !cardRef.current || prefersReducedMotion()) return;

    backdropRef.current.style.opacity = "0";
    cardRef.current.style.opacity = "0";
    cardRef.current.style.transform = "translateY(12px) scale(0.985)";

    animate(backdropRef.current, {
      opacity: [0, 1],
      duration: 160,
      ease: "outQuad",
    });

    animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [12, 0],
      scale: [0.985, 1],
      duration: 220,
      ease: "outQuart",
    });
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      onClick={onClose}
    >
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-[color:color-mix(in_oklch,var(--background)_26%,transparent)] backdrop-blur-[1.5px]"
        aria-hidden="true"
      />
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-lg rounded-[1.75rem] border border-[color:color-mix(in_oklch,var(--border)_78%,var(--brand-ink)_22%)] bg-[color:color-mix(in_oklch,var(--card)_96%,var(--background)_4%)] p-6 shadow-[0_32px_90px_-44px_color-mix(in_oklch,var(--brand-ink)_55%,transparent)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h4
          id={titleId}
          className="font-display text-2xl text-[color:var(--foreground)]"
        >
          {title}
        </h4>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function LabelBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0 space-y-2">
      <span className="block text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function useNameAvailability({
  label,
  parentName,
  ensParentName,
  endpoint,
}: {
  label: string;
  parentName: string;
  ensParentName: string;
  endpoint: string;
}): NameAvailabilityState {
  const validation = React.useMemo(() => validateBasenameLabel(label), [label]);
  const fqdn = validation.isValid
    ? toSubnameFqdn(validation.normalizedLabel, parentName)
    : null;
  const ensFqdn = validation.isValid
    ? toSubnameFqdn(validation.normalizedLabel, ensParentName)
    : null;
  const [availability, setAvailability] = React.useState<AvailabilityResponse | null>(null);
  const [isChecking, setIsChecking] = React.useState(false);
  const [refreshNonce, setRefreshNonce] = React.useState(0);

  const refresh = React.useCallback(() => {
    setRefreshNonce((value) => value + 1);
  }, []);

  React.useEffect(() => {
    if (!validation.isValid || !fqdn || !ensFqdn) {
      setAvailability(null);
      setIsChecking(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsChecking(true);
      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set("label", validation.normalizedLabel);

      void fetchJson<AvailabilityResponse>(url.toString(), { signal: controller.signal })
        .then((response) => {
          setAvailability(response);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setAvailability(null);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsChecking(false);
          }
        });
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [endpoint, ensFqdn, fqdn, refreshNonce, validation.isValid, validation.normalizedLabel]);

  const isReservedLabel = availability?.reserved === true;
  const labelError = !validation.isValid
    ? validation.reason ?? "Invalid name"
    : isReservedLabel
      ? "This name is reserved."
      : null;
  const isAvailable = isReservedLabel ? false : availability?.available ?? null;
  const isLabelInvalid = label.trim().length > 0 && Boolean(labelError);

  return {
    validation,
    fqdn,
    ensFqdn,
    availability,
    isReservedLabel,
    labelError,
    isAvailable,
    isLabelInvalid,
    isChecking,
    refresh,
  };
}

function useShakeOnInvalid(
  ref: React.RefObject<HTMLInputElement | null>,
  isInvalid: boolean,
) {
  React.useEffect(() => {
    if (!ref.current || !isInvalid || prefersReducedMotion()) return;

    animate(ref.current, {
      translateX: [-4, 4, -3, 3, 0],
      duration: 300,
      ease: "out(3)",
    });
  }, [isInvalid, ref]);
}

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function shortValue(value: string | null | undefined) {
  if (!value) return "Missing";
  return value.length > 18 ? shortenAddress(value) : value;
}

function normalizePaymentRecipient(
  value: string | null | undefined,
): `0x${string}` | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || !isAddress(trimmed)) return null;
  return trimmed as `0x${string}`;
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = tryParseJson(text);

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        ("statusMessage" in payload || "message" in payload) &&
        ((typeof payload.statusMessage === "string" && payload.statusMessage) ||
          (typeof payload.message === "string" && payload.message))) ||
      text ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return (payload ?? {}) as T;
}

function tryParseJson(value: string): any {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function validateBasenameLabel(rawLabel: string): BasenameValidation {
  const normalizedLabel = rawLabel.trim().toLowerCase();

  if (normalizedLabel === "") {
    return { isValid: false, normalizedLabel, reason: "Missing name" };
  }
  if (normalizedLabel.length < 3 || normalizedLabel.length > 15) {
    return {
      isValid: false,
      normalizedLabel,
      reason: "Name must be 3-15 characters.",
    };
  }
  if (!/^[a-z0-9]+$/.test(normalizedLabel)) {
    return {
      isValid: false,
      normalizedLabel,
      reason: "Use only lowercase letters and numbers.",
    };
  }
  if (/^\d+$/.test(normalizedLabel) && Number(normalizedLabel) <= 10_000) {
    return {
      isValid: false,
      normalizedLabel,
      reason: "Numeric names 0-10000 are not allowed.",
    };
  }

  return { isValid: true, normalizedLabel };
}

function toSubnameFqdn(label: string, parentName: string) {
  return `${label.trim().toLowerCase()}.${parentName.trim().toLowerCase()}`;
}

function createMintMessage(
  address: string,
  fqdn: string,
  chainId: number,
  timestamp: number,
) {
  return [
    "Regent Basenames Mint",
    `Address: ${address.toLowerCase()}`,
    `Name: ${fqdn.toLowerCase()}`,
    `ChainId: ${chainId}`,
    `Timestamp: ${timestamp}`,
  ].join("\n");
}

function formatEthFromWei(wei: bigint) {
  const eth = Number(wei) / 1e18;
  if (!Number.isFinite(eth)) return `${wei.toString()} wei`;
  return `${eth.toFixed(4)} ETH`;
}

function formatRegentRounded2(amount: bigint) {
  const denom = 10n ** 18n;
  const scaled = amount * 100n;
  const cents = (scaled + denom / 2n) / denom;
  const whole = cents / 100n;
  const fraction = cents % 100n;
  return `${whole.toLocaleString()}.${fraction.toString().padStart(2, "0")}`;
}

function formatCount(value: number) {
  return value.toLocaleString();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  if (error && typeof error === "object" && "shortMessage" in error) {
    const shortMessage = (error as { shortMessage?: unknown }).shortMessage;
    if (typeof shortMessage === "string" && shortMessage) return shortMessage;
  }
  return fallback;
}

function isUserRejectionError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  const causeCode = (error as { cause?: { code?: unknown } }).cause?.code;
  if (
    code === 4001 ||
    code === "ACTION_REJECTED" ||
    causeCode === 4001 ||
    causeCode === "ACTION_REJECTED"
  ) {
    return true;
  }

  const message = getErrorMessage(error, "").toLowerCase();
  return (
    message.includes("rejected") ||
    message.includes("denied") ||
    message.includes("cancelled") ||
    message.includes("canceled")
  );
}

function isReceiptTimeoutError(error: unknown) {
  const name = error instanceof Error ? error.name.toLowerCase() : "";
  if (name.includes("timeout")) return true;

  const message = getErrorMessage(error, "").toLowerCase();
  return message.includes("timed out") || message.includes("timeout");
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

async function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function switchToChain(
  wallet: PrivyEthereumWalletLike,
  chain: Chain,
  baseRpcUrl: string | null,
) {
  const provider = (await wallet.getEthereumProvider()) as MaybeRequestProvider;
  if (typeof provider.request !== "function") {
    throw new Error("Wallet provider does not support chain switching.");
  }

  const chainIdHex = `0x${chain.id.toString(16)}`;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (error) {
    const code = (error as { code?: unknown }).code;
    if (code !== 4902 || chain.id !== base.id) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [baseRpcUrl ?? "https://mainnet.base.org"],
          blockExplorerUrls: [chain.blockExplorers?.default.url ?? "https://basescan.org"],
        },
      ],
    });
  }
}
