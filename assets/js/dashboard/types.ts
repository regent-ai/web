export type DashboardConfig = {
  privyAppId: string | null;
  privyClientId: string | null;
  baseRpcUrl: string | null;
  redeemerAddress: string | null;
  endpoints: {
    basenamesConfig: string;
    basenamesAllowance: string;
    basenamesAvailability: string;
    basenamesOwned: string;
    basenamesRecent: string;
    basenamesMint: string;
    autolaunchAuctions: string;
    opensea: string;
  };
};

export interface BasenamesConfigResponse {
  chainId: number;
  parentName: string;
  parentNode: `0x${string}`;
  registryAddress: `0x${string}`;
  l2ResolverAddress: `0x${string}`;
  ensChainId: number;
  ensParentName: string;
  ensParentNode: `0x${string}`;
  ensRegistryAddress: `0x${string}`;
  ensResolverAddress: `0x${string}`;
  priceWei: string;
  paymentRecipient: `0x${string}` | null;
  dbEnabled: boolean;
  mintingEnabled: boolean;
  ensMintingEnabled: boolean;
}

export interface AvailabilityResponse {
  parentName: string;
  label: string;
  fqdn: string;
  node: `0x${string}`;
  owner: `0x${string}`;
  available: boolean;
  basenamesAvailable: boolean;
  reserved?: boolean;
  ensParentName: string;
  ensFqdn: string;
  ensNode: `0x${string}`;
  ensOwner: `0x${string}`;
  ensAvailable: boolean;
}

export interface AllowanceResponse {
  parentName: string;
  parentNode: `0x${string}`;
  address: `0x${string}`;
  snapshotTotal: number;
  freeMintsUsed: number;
  freeMintsRemaining: number;
}

export interface OwnedNamesResponse {
  address: `0x${string}`;
  names: Array<{
    label: string;
    fqdn: string;
    ensFqdn: string | null;
    ensTxHash: `0x${string}` | null;
    isFree: boolean;
    isInUse?: boolean;
    createdAt: string;
  }>;
}

export interface MintResponse {
  ok: boolean;
  fqdn: string;
  label: string;
  txHash: `0x${string}`;
  ensFqdn?: string;
  ensTxHash?: `0x${string}` | null;
  isFree: boolean;
  priceWei: string;
}

export interface RecentNamesResponse {
  names: Array<{
    label: string;
    fqdn: string;
    createdAt: string;
  }>;
}

export interface OpenSeaResponse {
  address: `0x${string}`;
  animata1: number[];
  animata2: number[];
  animataPass: number[];
}
