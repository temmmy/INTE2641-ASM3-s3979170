const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

const parseChainId = (value: string): number => {
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) {
    throw new Error(`Invalid NEXT_PUBLIC_CHAIN_ID: expected integer, received "${value}"`);
  }
  return numeric;
};

const resolveRpcUrl = (): string => {
  const direct = process.env.NEXT_PUBLIC_RPC_URL;
  if (direct) {
    return direct;
  }

  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (alchemyKey) {
    return `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`;
  }

  throw new Error(
    "Provide NEXT_PUBLIC_RPC_URL or NEXT_PUBLIC_ALCHEMY_API_KEY to configure the RPC endpoint"
  );
};

const chainId = parseChainId(required("NEXT_PUBLIC_CHAIN_ID"));
const rpcUrl = resolveRpcUrl();

export const env = {
  chainId,
  rpcUrl,
  easAddress: required("NEXT_PUBLIC_EAS_ADDRESS") as `0x${string}`,
  schemaUid: required("NEXT_PUBLIC_SCHEMA_UID") as `0x${string}`,
  escrowAddress: required("NEXT_PUBLIC_ESCROW_ADDRESS") as `0x${string}`,
  walletConnectProjectId: required("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"),
};

export type AppEnv = typeof env;
