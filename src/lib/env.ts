const FALLBACK_CHAIN_ID = 84532;
const FALLBACK_RPC_URL = "https://base-sepolia.g.alchemy.com/v2/demo";
const FALLBACK_EAS_ADDRESS = "0x4200000000000000000000000000000000000021";
const FALLBACK_SCHEMA_UID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const FALLBACK_ESCROW_ADDRESS = "0x0000000000000000000000000000000000000000";

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Invalid NEXT_PUBLIC_CHAIN_ID: expected integer, received "${value}"`);
  }
  return parsed;
};

const toRpcUrl = (): string => {
  if (process.env.NEXT_PUBLIC_RPC_URL) {
    return process.env.NEXT_PUBLIC_RPC_URL;
  }
  if (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
    return `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
  }
  return FALLBACK_RPC_URL;
};

const toAddress = (value: string | undefined, fallback: `0x${string}`): `0x${string}` => {
  const target = value ?? fallback;
  if (!/^0x[a-fA-F0-9]{40}$/.test(target)) {
    throw new Error(`Invalid address provided: ${target}`);
  }
  return target as `0x${string}`;
};

const toBytes32 = (value: string | undefined, fallback: `0x${string}`): `0x${string}` => {
  const target = value ?? fallback;
  if (!/^0x[a-fA-F0-9]{64}$/.test(target)) {
    throw new Error(`Invalid bytes32 value provided: ${target}`);
  }
  return target as `0x${string}`;
};

export const env = {
  chainId: toNumber(process.env.NEXT_PUBLIC_CHAIN_ID, FALLBACK_CHAIN_ID),
  rpcUrl: toRpcUrl(),
  easAddress: toAddress(process.env.NEXT_PUBLIC_EAS_ADDRESS, FALLBACK_EAS_ADDRESS),
  schemaUid: toBytes32(process.env.NEXT_PUBLIC_SCHEMA_UID, FALLBACK_SCHEMA_UID),
  escrowAddress: toAddress(process.env.NEXT_PUBLIC_ESCROW_ADDRESS, FALLBACK_ESCROW_ADDRESS),
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
} as const;

export type AppEnv = typeof env;
