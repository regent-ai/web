import type { Abi } from "viem";

export const USDC: `0x${string}` = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const REGENT: `0x${string}` = "0x6f89bcA4eA5931EdFCB09786267b251DeE752b07";
export const ANIMATA1: `0x${string}` = "0x78402119Ec6349A0D41F12b54938De7BF783C923";
export const ANIMATA2: `0x${string}` = "0x903C4c1E8B8532FbD3575482d942D493eb9266e2";
export const COLLECTION3: `0x${string}` = "0x2208aaDBdEcd47D3B4430b5b75a175f6d885D487";

export type CollectionKey = "ANIMATA1" | "ANIMATA2";

export const USDC_PRICE: bigint = 80n * 1_000_000n;
export const REGENT_PAYOUT: bigint = 5_000_000n * 10n ** 18n;

export const erc721Abi = [
  {
    type: "function",
    name: "isApprovedForAll",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "setApprovalForAll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
] as const satisfies Abi;

export const erc20Abi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const satisfies Abi;

export const redeemerAbi = [
  {
    type: "function",
    name: "redeem",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sourceCollection", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "claimable",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getVest",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "pool", type: "uint128" },
      { name: "released", type: "uint128" },
      { name: "claimed", type: "uint128" },
      { name: "start", type: "uint64" },
    ],
  },
] as const satisfies Abi;
